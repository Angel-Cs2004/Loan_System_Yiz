import re

from django.core import mail
from rest_framework.test import APITestCase

from catalogo.models import Categoria, EjemplarFisico, FichaRecurso
from prestamos.models import EstadoPrestamo, Prestamo

from .models import EstadoUsuario, TipoUsuario, Usuario


class UsuariosTestCase(APITestCase):
    def setUp(self):
        self.admin = Usuario.objects.create_user(
            'admin@test.com', 'ClaveSegura123', dni='10000001', tipo_usuario=TipoUsuario.ADMINISTRATOR,
        )
        self.alumno = Usuario.objects.create_user(
            'alumno@test.com', 'ClaveSegura123', dni='10000002', cui='20200001',
            tipo_usuario=TipoUsuario.STUDENT, first_name='Daniel', last_name='Perez',
        )
        self.docente = Usuario.objects.create_user(
            'docente@test.com', 'ClaveSegura123', dni='10000003', tipo_usuario=TipoUsuario.TEACHER,
            first_name='Rosa', last_name='Quispe',
        )
        equipos = Categoria.objects.create(nombre='Equipos')
        self.ficha = FichaRecurso.objects.create(nombre='Proyector', categoria=equipos)
        EjemplarFisico.objects.create(ficha_recurso=self.ficha, codigo_inventario='PROY-01')
        EjemplarFisico.objects.create(ficha_recurso=self.ficha, codigo_inventario='PROY-02')

    def reservar(self, usuario):
        self.client.force_authenticate(usuario)
        respuesta = self.client.post('/prestamos/reservar/', {'ficha_recurso': str(self.ficha.pk)})
        self.client.force_authenticate(self.admin)
        return respuesta.data['id']

    def prestar(self, usuario):
        prestamo_id = self.reservar(usuario)
        self.client.post(f'/prestamos/admin/reservas/{prestamo_id}/entregar/')
        return prestamo_id


class CambioDeEstadoTests(UsuariosTestCase):
    def url(self, usuario):
        return f'/users/admin/usuarios/{usuario.pk}/'

    def test_patch_inactivo_con_recurso_en_mano_se_rechaza(self):
        self.prestar(self.alumno)
        respuesta = self.client.patch(self.url(self.alumno), {'status': EstadoUsuario.INACTIVO})
        self.assertEqual(respuesta.status_code, 400)
        self.alumno.refresh_from_db()
        self.assertEqual(self.alumno.status, EstadoUsuario.ACTIVO)

    def test_delete_con_recurso_en_mano_se_rechaza(self):
        self.prestar(self.alumno)
        self.assertEqual(self.client.delete(self.url(self.alumno)).status_code, 400)

    def test_baja_con_solo_una_reserva_la_cancela(self):
        prestamo_id = self.reservar(self.alumno)
        self.assertEqual(self.client.delete(self.url(self.alumno)).status_code, 204)
        self.assertEqual(Prestamo.objects.get(pk=prestamo_id).estado, EstadoPrestamo.CANCELADO)

    def test_suspender_con_prestamo_se_permite_y_cancela_reservas(self):
        entregado = self.prestar(self.alumno)
        self.client.force_authenticate(self.docente)
        reserva = self.client.post('/prestamos/reservar/', {'ficha_recurso': str(self.ficha.pk)}).data['id']
        self.client.force_authenticate(self.admin)

        for usuario in (self.alumno, self.docente):
            respuesta = self.client.patch(self.url(usuario), {'status': EstadoUsuario.SUSPENDIDO})
            self.assertEqual(respuesta.status_code, 200)
        self.assertEqual(Prestamo.objects.get(pk=entregado).estado, EstadoPrestamo.ACTIVO)
        self.assertEqual(Prestamo.objects.get(pk=reserva).estado, EstadoPrestamo.CANCELADO)


class FiltrosTests(UsuariosTestCase):
    def emails(self, consulta):
        return sorted(u['email'] for u in self.client.get(f'/users/admin/usuarios/{consulta}').data['results'])

    def setUp(self):
        super().setUp()
        self.client.force_authenticate(self.admin)

    def test_buscar_por_nombre_apellido_email_o_documento(self):
        self.assertEqual(self.emails('?q=daniel perez'), ['alumno@test.com'])
        self.assertEqual(self.emails('?q=QUISPE'), ['docente@test.com'])
        self.assertEqual(self.emails('?q=docente@'), ['docente@test.com'])
        self.assertEqual(self.emails('?q=20200001'), ['alumno@test.com'])

    def test_filtrar_por_tipo_y_estado(self):
        self.assertEqual(self.emails('?tipo_usuario=TEACHER'), ['docente@test.com'])
        self.docente.status = EstadoUsuario.SUSPENDIDO
        self.docente.save()
        self.assertEqual(self.emails('?status=SUSPENDIDO'), ['docente@test.com'])

    def test_valor_invalido_responde_400(self):
        self.assertEqual(self.client.get('/users/admin/usuarios/?tipo_usuario=profe').status_code, 400)
        self.assertEqual(self.client.get('/users/admin/usuarios/?status=borrado').status_code, 400)


class OlvideMiPasswordTests(UsuariosTestCase):
    def pedir_enlace(self, email):
        return self.client.post('/users/password/olvide/', {'email': email})

    def datos_del_enlace(self):
        return dict(re.findall(r'(uid|token)=([^&\s]+)', mail.outbox[-1].body))

    def test_flujo_completo(self):
        self.assertEqual(self.pedir_enlace(' ALUMNO@test.com ').status_code, 200)
        self.assertEqual(len(mail.outbox), 1)
        datos = self.datos_del_enlace()

        respuesta = self.client.post('/users/password/restablecer/', {**datos, 'password_nueva': 'OtraClave456!'})
        self.assertEqual(respuesta.status_code, 200)
        self.assertEqual(self.client.post('/login/', {'email': 'alumno@test.com', 'password': 'OtraClave456!'}).status_code, 200)

        respuesta = self.client.post('/users/password/restablecer/', {**datos, 'password_nueva': 'Tercera789!'})
        self.assertEqual(respuesta.status_code, 400)

    def test_email_desconocido_responde_igual_y_no_manda_nada(self):
        self.assertEqual(self.pedir_enlace('nadie@test.com').status_code, 200)
        self.assertEqual(len(mail.outbox), 0)

    def test_usuario_suspendido_no_recibe_enlace(self):
        self.alumno.status = EstadoUsuario.SUSPENDIDO
        self.alumno.save()
        self.pedir_enlace('alumno@test.com')
        self.assertEqual(len(mail.outbox), 0)

    def test_token_falso_y_password_debil(self):
        self.pedir_enlace('alumno@test.com')
        datos = self.datos_del_enlace()
        falso = {'uid': datos['uid'], 'token': 'abc-123', 'password_nueva': 'OtraClave456!'}
        self.assertEqual(self.client.post('/users/password/restablecer/', falso).status_code, 400)
        debil = {**datos, 'password_nueva': '123'}
        self.assertEqual(self.client.post('/users/password/restablecer/', debil).status_code, 400)


class AccesoTests(UsuariosTestCase):
    def test_admin_ve_un_usuario(self):
        self.client.force_authenticate(self.admin)
        respuesta = self.client.get(f'/users/admin/usuarios/{self.alumno.pk}/')
        self.assertEqual(respuesta.status_code, 200)
        self.assertEqual(respuesta.data['email'], 'alumno@test.com')
        self.client.force_authenticate(self.alumno)
        self.assertEqual(self.client.get(f'/users/admin/usuarios/{self.alumno.pk}/').status_code, 403)

    def test_lo_publico_sigue_abierto(self):
        registro = self.client.post('/users/registro/', {
            'email': 'nuevo@test.com', 'password': 'ClaveSegura123', 'dni': '10000009', 'cui': '20200009',
        })
        self.assertEqual(registro.status_code, 201)
        login = self.client.post('/login/', {'email': 'nuevo@test.com', 'password': 'ClaveSegura123'})
        self.assertEqual(login.status_code, 200)
        self.assertEqual(self.client.post('/users/password/olvide/', {'email': 'x@test.com'}).status_code, 200)
        self.assertEqual(self.client.get('/api/schema/').status_code, 200)

    def test_lo_privado_pide_sesion(self):
        self.assertEqual(self.client.get('/catalogo/recursos/').status_code, 401)
        self.assertEqual(self.client.get('/users/perfil/').status_code, 401)


class CorsTests(APITestCase):
    def test_el_front_puede_llamar(self):
        respuesta = self.client.options('/login/', HTTP_ORIGIN='http://localhost:5173',
                                        HTTP_ACCESS_CONTROL_REQUEST_METHOD='POST')
        self.assertEqual(respuesta.headers.get('Access-Control-Allow-Origin'), 'http://localhost:5173')

    def test_otro_origen_no(self):
        respuesta = self.client.get('/api/schema/', HTTP_ORIGIN='http://sitio-cualquiera.com')
        self.assertNotIn('Access-Control-Allow-Origin', respuesta.headers)
