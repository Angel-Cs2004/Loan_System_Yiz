import threading
import time
from datetime import datetime, timedelta, timezone as dt_timezone
from io import StringIO
from unittest.mock import patch

from django.core.management import call_command
from django.db import IntegrityError, connection, transaction
from django.test import TransactionTestCase
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from rest_framework.test import APITestCase

from catalogo.models import Categoria, EjemplarFisico, EstadoEjemplar, FichaRecurso
from users.models import EstadoUsuario, TipoUsuario, Usuario

from . import services
from .models import EstadoPrestamo, PoliticaPrestamo, Prestamo
from .services import hoy, registrar_prestamo


def crear_datos(test):
    test.admin = Usuario.objects.create_user(
        'admin@test.com', 'ClaveSegura123', dni='10000001', tipo_usuario=TipoUsuario.ADMINISTRATOR,
    )
    test.alumno = Usuario.objects.create_user(
        'alumno@test.com', 'ClaveSegura123', dni='10000002', cui='20200001', tipo_usuario=TipoUsuario.STUDENT,
    )
    test.otro = Usuario.objects.create_user(
        'otro@test.com', 'ClaveSegura123', dni='10000003', cui='20200002', tipo_usuario=TipoUsuario.STUDENT,
    )
    test.equipos = Categoria.objects.create(nombre='Equipos')
    test.fichas = [FichaRecurso.objects.create(nombre=f'Recurso {i}', categoria=test.equipos) for i in range(5)]
    for i, ficha in enumerate(test.fichas):
        EjemplarFisico.objects.create(ficha_recurso=ficha, codigo_inventario=f'EQ-{i}A')
        EjemplarFisico.objects.create(ficha_recurso=ficha, codigo_inventario=f'EQ-{i}B')


class PrestamoTestCase(APITestCase):
    def setUp(self):
        crear_datos(self)

    def reservar(self, ficha, usuario=None):
        self.client.force_authenticate(usuario or self.alumno)
        return self.client.post('/prestamos/reservar/', {'ficha_recurso': str(ficha.pk)})

    def prestar(self, ficha, usuario=None):
        respuesta = self.reservar(ficha, usuario)
        if respuesta.status_code != 201:
            return respuesta
        self.como_admin()
        respuesta = self.client.post(f"/prestamos/admin/reservas/{respuesta.data['id']}/entregar/")
        self.client.force_authenticate(usuario or self.alumno)
        return respuesta

    def como_admin(self):
        self.client.force_authenticate(self.admin)

    def vencer(self, prestamo_id):
        Prestamo.objects.filter(pk=prestamo_id).update(fecha_limite=hoy() - timedelta(days=1))


class FechaLimiteTests(PrestamoTestCase):
    def test_fecha_limite_segun_politica(self):
        respuesta = self.prestar(self.fichas[0])
        self.assertEqual(respuesta.status_code, 200)
        self.assertEqual(respuesta.data['fecha_limite'], str(hoy() + timedelta(days=6)))
        self.assertEqual(respuesta.data['codigo_inventario'], 'EQ-0A')

    def test_hoy_usa_la_hora_de_peru(self):
        with patch('django.utils.timezone.now', return_value=datetime(2026, 1, 10, 3, 0, tzinfo=dt_timezone.utc)):
            self.assertEqual(hoy().day, 9)


class PoliticaTests(PrestamoTestCase):
    def setUp(self):
        super().setUp()
        self.como_admin()
        self.politica = PoliticaPrestamo.objects.get(tipo_usuario=TipoUsuario.STUDENT)

    def test_no_se_pueden_crear_politicas(self):
        respuesta = self.client.post('/prestamos/admin/politicas/', {'tipo_usuario': TipoUsuario.TEACHER, 'dias_maximo_prestamo': 5})
        self.assertEqual(respuesta.status_code, 405)

    def test_no_se_pueden_borrar_politicas(self):
        respuesta = self.client.delete(f'/prestamos/admin/politicas/{self.politica.pk}/')
        self.assertEqual(respuesta.status_code, 405)
        self.assertTrue(PoliticaPrestamo.objects.filter(pk=self.politica.pk).exists())

    def test_patch_no_cambia_el_tipo_usuario(self):
        url = f'/prestamos/admin/politicas/{self.politica.pk}/'
        respuesta = self.client.patch(url, {'tipo_usuario': TipoUsuario.TEACHER, 'dias_maximo_prestamo': 4})
        self.assertEqual(respuesta.status_code, 200)
        self.politica.refresh_from_db()
        self.assertEqual(self.politica.tipo_usuario, TipoUsuario.STUDENT)
        self.assertEqual(self.politica.dias_maximo_prestamo, 4)

    def test_cero_dias_o_cero_prestamos_no_se_aceptan(self):
        url = f'/prestamos/admin/politicas/{self.politica.pk}/'
        self.assertEqual(self.client.patch(url, {'dias_maximo_prestamo': 0}).status_code, 400)
        self.assertEqual(self.client.patch(url, {'max_prestamos_simultaneos': 0}).status_code, 400)

    def test_check_en_la_base(self):
        with self.assertRaises(IntegrityError), transaction.atomic():
            PoliticaPrestamo.objects.filter(pk=self.politica.pk).update(dias_maximo_prestamo=0)


class VencidosTests(PrestamoTestCase):
    def test_se_marca_vencido_al_listar(self):
        prestamo_id = self.prestar(self.fichas[0]).data['id']
        self.vencer(prestamo_id)
        resultado = self.client.get('/prestamos/mis-reservas/').data['results'][0]
        self.assertEqual(resultado['estado'], EstadoPrestamo.VENCIDO)
        self.assertTrue(resultado['con_retraso'])

    def test_filtro_vencidos_del_admin(self):
        prestamo_id = self.prestar(self.fichas[0]).data['id']
        self.prestar(self.fichas[1])
        self.vencer(prestamo_id)
        self.como_admin()
        respuesta = self.client.get('/prestamos/admin/reservas/?estado=VENCIDO')
        self.assertEqual([p['id'] for p in respuesta.data['results']], [prestamo_id])

    def test_comando_marcar_vencidos(self):
        prestamo_id = self.prestar(self.fichas[0]).data['id']
        self.vencer(prestamo_id)
        salida = StringIO()
        call_command('marcar_vencidos', stdout=salida)
        self.assertIn('1 prestamo', salida.getvalue())
        self.assertEqual(Prestamo.objects.get(pk=prestamo_id).estado, EstadoPrestamo.VENCIDO)

    def test_devolver_un_vencido_queda_con_retraso(self):
        prestamo_id = self.prestar(self.fichas[0]).data['id']
        self.vencer(prestamo_id)
        call_command('marcar_vencidos', stdout=StringIO())
        self.como_admin()
        respuesta = self.client.post(f'/prestamos/admin/reservas/{prestamo_id}/devolver/')
        self.assertEqual(respuesta.data['estado'], EstadoPrestamo.DEVUELTO)
        self.assertTrue(respuesta.data['con_retraso'])

    def test_devolucion_a_tiempo_sin_retraso(self):
        prestamo_id = self.prestar(self.fichas[0]).data['id']
        self.como_admin()
        respuesta = self.client.post(f'/prestamos/admin/reservas/{prestamo_id}/devolver/')
        self.assertFalse(respuesta.data['con_retraso'])


class LimitesTests(PrestamoTestCase):
    def test_con_un_vencido_no_se_presta_otro(self):
        self.vencer(self.prestar(self.fichas[0]).data['id'])
        self.assertEqual(self.prestar(self.fichas[1]).status_code, 400)

    def test_un_solo_ejemplar_por_recurso(self):
        self.assertEqual(self.prestar(self.fichas[0]).status_code, 200)
        self.assertEqual(self.prestar(self.fichas[0]).status_code, 400)
        self.assertEqual(self.prestar(self.fichas[0], self.otro).status_code, 200)

    def test_tope_de_prestamos_simultaneos(self):
        for ficha in self.fichas[:3]:
            self.assertEqual(self.prestar(ficha).status_code, 200)
        self.assertEqual(self.prestar(self.fichas[3]).status_code, 400)

    def test_devolver_libera_un_cupo(self):
        ids = [self.prestar(ficha).data['id'] for ficha in self.fichas[:3]]
        self.como_admin()
        self.client.post(f'/prestamos/admin/reservas/{ids[0]}/devolver/')
        self.assertEqual(self.prestar(self.fichas[3]).status_code, 200)

    def test_tope_configurable_por_politica(self):
        PoliticaPrestamo.objects.filter(tipo_usuario=TipoUsuario.STUDENT).update(max_prestamos_simultaneos=1)
        self.assertEqual(self.prestar(self.fichas[0]).status_code, 200)
        self.assertEqual(self.prestar(self.fichas[1]).status_code, 400)


class HistorialTests(PrestamoTestCase):
    def test_usuario_solo_ve_sus_prestamos(self):
        self.prestar(self.fichas[0])
        self.prestar(self.fichas[1], self.otro)
        respuesta = self.client.get('/prestamos/mis-reservas/')
        self.assertEqual([p['usuario_email'] for p in respuesta.data['results']], ['otro@test.com'])

    def test_usuario_normal_no_entra_al_admin(self):
        self.client.force_authenticate(self.alumno)
        self.assertEqual(self.client.get('/prestamos/admin/reservas/').status_code, 403)
        self.assertEqual(self.client.post('/prestamos/admin/reservas/', {}).status_code, 403)

    def test_historial_de_un_usuario(self):
        self.prestar(self.fichas[0])
        self.prestar(self.fichas[1], self.otro)
        self.como_admin()
        respuesta = self.client.get(f'/prestamos/admin/reservas/?usuario={self.alumno.pk}')
        self.assertEqual(respuesta.data['count'], 1)
        self.assertEqual(respuesta.data['results'][0]['tipo_usuario'], TipoUsuario.STUDENT)

    def test_filtros_invalidos_responden_400(self):
        self.como_admin()
        self.assertEqual(self.client.get('/prestamos/admin/reservas/?estado=ROBADO').status_code, 400)
        self.assertEqual(self.client.get('/prestamos/admin/reservas/?usuario=abc').status_code, 400)

    def test_no_se_borra_ni_un_devuelto(self):
        prestamo_id = self.prestar(self.fichas[0]).data['id']
        self.como_admin()
        self.client.post(f'/prestamos/admin/reservas/{prestamo_id}/devolver/')
        self.assertEqual(self.client.delete(f'/prestamos/admin/reservas/{prestamo_id}/').status_code, 405)
        self.assertTrue(Prestamo.objects.filter(pk=prestamo_id).exists())

    def test_paginacion(self):
        PoliticaPrestamo.objects.update(max_prestamos_simultaneos=10)
        for ficha in self.fichas:
            self.prestar(ficha)
        respuesta = self.client.get('/prestamos/mis-reservas/?page_size=2')
        self.assertEqual(respuesta.data['count'], 5)
        self.assertEqual(len(respuesta.data['results']), 2)
        self.assertIsNotNone(respuesta.data['next'])


class PrestamoAdminTests(PrestamoTestCase):
    def setUp(self):
        super().setUp()
        self.como_admin()

    def registrar(self, **datos):
        return self.client.post('/prestamos/admin/reservas/', {k: str(v) for k, v in datos.items()})

    def test_por_recurso(self):
        respuesta = self.registrar(usuario=self.alumno.pk, ficha_recurso=self.fichas[0].pk)
        self.assertEqual(respuesta.status_code, 201)
        self.assertEqual(respuesta.data['usuario_email'], 'alumno@test.com')
        self.assertEqual(respuesta.data['registrado_por_email'], 'admin@test.com')
        self.assertEqual(respuesta.data['fecha_limite'], str(hoy() + timedelta(days=6)))

    def test_por_ejemplar_exacto(self):
        ejemplar = EjemplarFisico.objects.get(codigo_inventario='EQ-0B')
        respuesta = self.registrar(usuario=self.alumno.pk, codigo_inventario=ejemplar.codigo_inventario)
        self.assertEqual(respuesta.data['codigo_inventario'], 'EQ-0B')

    def test_ejemplar_no_disponible(self):
        ejemplar = EjemplarFisico.objects.get(codigo_inventario='EQ-0A')
        ejemplar.estado = EstadoEjemplar.EN_MANTENIMIENTO
        ejemplar.save()
        self.assertEqual(self.registrar(usuario=self.alumno.pk, codigo_inventario=ejemplar.codigo_inventario).status_code, 400)

    def test_ficha_o_ejemplar_pero_no_ambos(self):
        ejemplar = EjemplarFisico.objects.get(codigo_inventario='EQ-0A')
        self.assertEqual(self.registrar(usuario=self.alumno.pk).status_code, 400)
        self.assertEqual(self.registrar(
            usuario=self.alumno.pk, ficha_recurso=self.fichas[0].pk, codigo_inventario=ejemplar.codigo_inventario,
        ).status_code, 400)

    def test_usuario_inactivo(self):
        self.alumno.status = EstadoUsuario.SUSPENDIDO
        self.alumno.save()
        self.assertEqual(self.registrar(usuario=self.alumno.pk, ficha_recurso=self.fichas[0].pk).status_code, 400)

    def test_respeta_los_limites_del_usuario(self):
        self.vencer(self.registrar(usuario=self.alumno.pk, ficha_recurso=self.fichas[0].pk).data['id'])
        self.assertEqual(self.registrar(usuario=self.alumno.pk, ficha_recurso=self.fichas[1].pk).status_code, 400)


class PerdidoTests(PrestamoTestCase):
    def test_marcar_perdido(self):
        prestamo_id = self.prestar(self.fichas[0]).data['id']
        self.como_admin()
        respuesta = self.client.post(f'/prestamos/admin/reservas/{prestamo_id}/perdido/', {'observaciones': 'Se lo robaron'})
        self.assertEqual(respuesta.data['estado'], EstadoPrestamo.PERDIDO)

        ejemplar = EjemplarFisico.objects.get(codigo_inventario='EQ-0A')
        self.assertEqual(ejemplar.estado, EstadoEjemplar.DADO_DE_BAJA)
        self.assertIn('Se lo robaron', ejemplar.observaciones)
        self.assertEqual(self.client.get(f'/catalogo/recursos/{self.fichas[0].pk}/').data['total_ejemplares'], 1)
        self.assertEqual(self.prestar(self.fichas[0]).status_code, 200)

    def test_un_perdido_no_se_devuelve_ni_se_pierde_dos_veces(self):
        prestamo_id = self.prestar(self.fichas[0]).data['id']
        self.como_admin()
        self.client.post(f'/prestamos/admin/reservas/{prestamo_id}/perdido/')
        self.assertEqual(self.client.post(f'/prestamos/admin/reservas/{prestamo_id}/devolver/').status_code, 400)
        self.assertEqual(self.client.post(f'/prestamos/admin/reservas/{prestamo_id}/perdido/').status_code, 400)


class CancelarTests(PrestamoTestCase):
    def test_cancelar_libera_el_ejemplar(self):
        prestamo_id = self.reservar(self.fichas[0]).data['id']
        respuesta = self.client.post(f'/prestamos/mis-reservas/{prestamo_id}/cancelar/')
        self.assertEqual(respuesta.data['estado'], EstadoPrestamo.CANCELADO)
        self.assertEqual(EjemplarFisico.objects.get(codigo_inventario='EQ-0A').estado, EstadoEjemplar.DISPONIBLE)

    def test_despues_de_recoger_no_se_cancela(self):
        prestamo_id = self.prestar(self.fichas[0]).data['id']
        self.assertEqual(self.client.post(f'/prestamos/mis-reservas/{prestamo_id}/cancelar/').status_code, 400)
        self.assertEqual(Prestamo.objects.get(pk=prestamo_id).estado, EstadoPrestamo.ACTIVO)
        self.assertEqual(EjemplarFisico.objects.get(codigo_inventario='EQ-0A').estado, EstadoEjemplar.PRESTADO)

    def test_prestamo_del_mostrador_no_se_cancela(self):
        self.como_admin()
        prestamo_id = self.client.post('/prestamos/admin/reservas/', {
            'usuario': self.alumno.pk, 'ficha_recurso': str(self.fichas[0].pk),
        }).data['id']
        self.client.force_authenticate(self.alumno)
        self.assertEqual(self.client.post(f'/prestamos/mis-reservas/{prestamo_id}/cancelar/').status_code, 400)

    def test_no_se_cancela_el_de_otro(self):
        prestamo_id = self.reservar(self.fichas[0], self.otro).data['id']
        self.client.force_authenticate(self.alumno)
        self.assertEqual(self.client.post(f'/prestamos/mis-reservas/{prestamo_id}/cancelar/').status_code, 404)


class ReservaTests(PrestamoTestCase):
    def test_reservar_aparta_sin_fecha_limite(self):
        respuesta = self.reservar(self.fichas[0])
        self.assertEqual(respuesta.data['estado'], EstadoPrestamo.RESERVADO)
        self.assertIsNone(respuesta.data['fecha_limite'])
        self.assertIsNotNone(respuesta.data['recoger_antes_de'])
        self.assertEqual(EjemplarFisico.objects.get(codigo_inventario='EQ-0A').estado, EstadoEjemplar.RESERVADO)

    def test_entregar_activa_y_cuenta_los_dias_desde_hoy(self):
        respuesta = self.prestar(self.fichas[0])
        self.assertEqual(respuesta.data['estado'], EstadoPrestamo.ACTIVO)
        self.assertEqual(respuesta.data['fecha_limite'], str(hoy() + timedelta(days=6)))
        self.assertEqual(respuesta.data['registrado_por_email'], 'admin@test.com')

    def test_no_se_entrega_dos_veces(self):
        prestamo_id = self.prestar(self.fichas[0]).data['id']
        self.como_admin()
        self.assertEqual(self.client.post(f'/prestamos/admin/reservas/{prestamo_id}/entregar/').status_code, 400)

    def test_una_reserva_no_se_devuelve(self):
        prestamo_id = self.reservar(self.fichas[0]).data['id']
        self.como_admin()
        self.assertEqual(self.client.post(f'/prestamos/admin/reservas/{prestamo_id}/devolver/').status_code, 400)

    def test_caduca_a_las_24_horas(self):
        prestamo_id = self.reservar(self.fichas[0]).data['id']
        Prestamo.objects.filter(pk=prestamo_id).update(fecha_prestamo=timezone.now() - timedelta(hours=25))
        self.assertEqual(self.client.get('/prestamos/mis-reservas/').data['results'][0]['estado'], EstadoPrestamo.CANCELADO)
        self.assertEqual(EjemplarFisico.objects.get(codigo_inventario='EQ-0A').estado, EstadoEjemplar.DISPONIBLE)
        self.como_admin()
        self.assertEqual(self.client.post(f'/prestamos/admin/reservas/{prestamo_id}/entregar/').status_code, 400)

    def test_la_reserva_ocupa_cupo(self):
        PoliticaPrestamo.objects.filter(tipo_usuario=TipoUsuario.STUDENT).update(max_prestamos_simultaneos=1)
        self.reservar(self.fichas[0])
        self.assertEqual(self.reservar(self.fichas[1]).status_code, 400)

    def test_el_admin_no_cambia_a_mano_un_ejemplar_reservado(self):
        self.reservar(self.fichas[0])
        ejemplar = EjemplarFisico.objects.get(codigo_inventario='EQ-0A')
        self.como_admin()
        respuesta = self.client.patch(f'/catalogo/admin/ejemplares/{ejemplar.pk}/', {'estado': 'DISPONIBLE'})
        self.assertEqual(respuesta.status_code, 400)


class MostradorTests(PrestamoTestCase):
    def test_buscar_por_codigo_para_devolver(self):
        prestamo_id = self.prestar(self.fichas[0]).data['id']
        self.como_admin()
        respuesta = self.client.get('/prestamos/admin/reservas/?codigo_inventario= eq-0a &estado=ACTIVO')
        self.assertEqual([p['id'] for p in respuesta.data['results']], [prestamo_id])

    def test_historial_de_un_recurso(self):
        self.prestar(self.fichas[0])
        self.prestar(self.fichas[1])
        self.como_admin()
        respuesta = self.client.get(f'/prestamos/admin/reservas/?ficha_recurso={self.fichas[0].pk}')
        self.assertEqual(respuesta.data['count'], 1)
        self.assertEqual(self.client.get('/prestamos/admin/reservas/?ficha_recurso=abc').status_code, 400)

    def test_admin_cancela_una_reserva(self):
        prestamo_id = self.reservar(self.fichas[0]).data['id']
        self.como_admin()
        respuesta = self.client.post(f'/prestamos/admin/reservas/{prestamo_id}/cancelar/')
        self.assertEqual(respuesta.data['estado'], EstadoPrestamo.CANCELADO)
        self.assertEqual(EjemplarFisico.objects.get(codigo_inventario='EQ-0A').estado, EstadoEjemplar.DISPONIBLE)

    def test_admin_no_cancela_lo_entregado(self):
        prestamo_id = self.prestar(self.fichas[0]).data['id']
        self.como_admin()
        self.assertEqual(self.client.post(f'/prestamos/admin/reservas/{prestamo_id}/cancelar/').status_code, 400)

    def test_baja_de_ficha_cancela_sus_reservas(self):
        prestamo_id = self.reservar(self.fichas[0]).data['id']
        entregado_id = self.prestar(self.fichas[0], self.otro).data['id']
        self.como_admin()
        self.client.post(f'/catalogo/admin/recursos/{self.fichas[0].pk}/baja/')
        self.assertEqual(Prestamo.objects.get(pk=prestamo_id).estado, EstadoPrestamo.CANCELADO)
        self.assertEqual(Prestamo.objects.get(pk=entregado_id).estado, EstadoPrestamo.ACTIVO)


class RenovarTests(PrestamoTestCase):
    def setUp(self):
        super().setUp()
        self.prestamo_id = self.prestar(self.fichas[0]).data['id']
        Prestamo.objects.filter(pk=self.prestamo_id).update(fecha_limite=hoy() + timedelta(days=1))
        self.url = f'/prestamos/admin/reservas/{self.prestamo_id}/renovar/'
        self.como_admin()

    def test_renovar_una_sola_vez(self):
        respuesta = self.client.post(self.url)
        self.assertEqual(respuesta.status_code, 200)
        self.assertEqual(respuesta.data['fecha_limite'], str(hoy() + timedelta(days=6)))
        self.assertEqual(respuesta.data['renovaciones'], 1)
        self.assertEqual(self.client.post(self.url).status_code, 400)

    def test_recien_pedido_no_se_renueva(self):
        Prestamo.objects.filter(pk=self.prestamo_id).update(fecha_limite=hoy() + timedelta(days=6))
        self.assertEqual(self.client.post(self.url).status_code, 400)

    def test_vencido_no_se_renueva(self):
        self.vencer(self.prestamo_id)
        self.assertEqual(self.client.post(self.url).status_code, 400)

    def test_recurso_dado_de_baja_no_se_renueva(self):
        self.fichas[0].estado_ficha = 'DADA_DE_BAJA'
        self.fichas[0].save()
        self.assertEqual(self.client.post(self.url).status_code, 400)

    def test_el_usuario_no_puede_renovar(self):
        self.client.force_authenticate(self.alumno)
        self.assertEqual(self.client.post(self.url).status_code, 403)
        self.assertEqual(self.client.post(f'/prestamos/mis-reservas/{self.prestamo_id}/renovar/').status_code, 404)


class IntegridadTests(PrestamoTestCase):
    def test_un_vencido_tambien_bloquea_el_ejemplar_en_la_base(self):
        prestamo = Prestamo.objects.get(pk=self.prestar(self.fichas[0]).data['id'])
        Prestamo.objects.filter(pk=prestamo.pk).update(estado=EstadoPrestamo.VENCIDO)
        with self.assertRaises(IntegrityError), transaction.atomic():
            Prestamo.objects.create(usuario=self.otro, ejemplar_fisico=prestamo.ejemplar_fisico, fecha_limite=hoy())

    def test_devuelto_sin_fecha_no_se_guarda(self):
        prestamo_id = self.prestar(self.fichas[0]).data['id']
        with self.assertRaises(IntegrityError), transaction.atomic():
            Prestamo.objects.filter(pk=prestamo_id).update(estado=EstadoPrestamo.DEVUELTO)

    def test_reserva_marca_el_ejemplar_prestado(self):
        respuesta = self.prestar(self.fichas[0])
        ejemplar = Prestamo.objects.get(pk=respuesta.data['id']).ejemplar_fisico
        self.assertEqual(ejemplar.estado, EstadoEjemplar.PRESTADO)


class ConcurrenciaTests(TransactionTestCase):
    serialized_rollback = True

    def setUp(self):
        crear_datos(self)

    def en_paralelo(self, *llamadas):
        barrera = threading.Barrier(len(llamadas))
        resultados = []

        def correr(usuario, ficha):
            try:
                barrera.wait()
                resultados.append(registrar_prestamo(usuario, ficha, registrado_por=self.admin))
            except ValidationError as error:
                resultados.append(error)
            finally:
                connection.close()

        original = services.calcular_fecha_limite

        def lento(usuario):
            time.sleep(0.3)
            return original(usuario)

        hilos = [threading.Thread(target=correr, args=llamada) for llamada in llamadas]
        with patch.object(services, 'calcular_fecha_limite', lento):
            for hilo in hilos:
                hilo.start()
            for hilo in hilos:
                hilo.join()
        return [r for r in resultados if isinstance(r, Prestamo)]

    def test_dos_usuarios_se_llevan_ejemplares_distintos(self):
        prestamos = self.en_paralelo((self.alumno, self.fichas[0]), (self.otro, self.fichas[0]))
        self.assertEqual(len(prestamos), 2)
        self.assertNotEqual(prestamos[0].ejemplar_fisico_id, prestamos[1].ejemplar_fisico_id)

    def test_el_tope_se_respeta_aunque_lleguen_juntas(self):
        PoliticaPrestamo.objects.filter(tipo_usuario=TipoUsuario.STUDENT).update(max_prestamos_simultaneos=1)
        prestamos = self.en_paralelo((self.alumno, self.fichas[0]), (self.alumno, self.fichas[1]))
        self.assertEqual(len(prestamos), 1)
        self.assertEqual(Prestamo.objects.filter(usuario=self.alumno).count(), 1)
