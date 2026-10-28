from rest_framework.test import APITestCase

from prestamos.models import EstadoPrestamo, Prestamo
from users.models import TipoUsuario, Usuario

from .models import Categoria, CondicionEjemplar, EjemplarFisico, EstadoEjemplar, EstadoFicha, FichaRecurso


class CatalogoTestCase(APITestCase):
    def setUp(self):
        self.admin = Usuario.objects.create_user(
            'admin@test.com', 'ClaveSegura123', dni='10000001', tipo_usuario=TipoUsuario.ADMINISTRATOR,
        )
        self.alumno = Usuario.objects.create_user(
            'alumno@test.com', 'ClaveSegura123', dni='10000002', cui='20200001', tipo_usuario=TipoUsuario.STUDENT,
        )
        self.equipos = Categoria.objects.create(nombre='Equipos')
        self.ficha = FichaRecurso.objects.create(nombre='Proyector Epson', categoria=self.equipos)
        self.ejemplar = EjemplarFisico.objects.create(ficha_recurso=self.ficha, codigo_inventario='PROY-01')
        self.client.force_authenticate(self.admin)

    def prestar(self, ficha=None):
        self.client.force_authenticate(self.alumno)
        respuesta = self.client.post('/prestamos/reservar/', {'ficha_recurso': str((ficha or self.ficha).pk)})
        self.client.force_authenticate(self.admin)
        if respuesta.status_code != 201:
            return respuesta
        return self.client.post(f"/prestamos/admin/reservas/{respuesta.data['id']}/entregar/")


class CategoriaTests(CatalogoTestCase):
    def test_nombre_repetido_sin_importar_mayusculas(self):
        respuesta = self.client.post('/catalogo/admin/categorias/', {'nombre': '  equipos '})
        self.assertEqual(respuesta.status_code, 400)

    def test_eliminar_categoria_en_uso_responde_409(self):
        respuesta = self.client.delete(f'/catalogo/admin/categorias/{self.equipos.pk}/')
        self.assertEqual(respuesta.status_code, 409)
        self.assertTrue(Categoria.objects.filter(pk=self.equipos.pk).exists())

    def test_listado_publico_de_categorias(self):
        self.client.force_authenticate(self.alumno)
        respuesta = self.client.get('/catalogo/categorias/')
        self.assertEqual(respuesta.status_code, 200)
        self.assertEqual(respuesta.data['results'][0]['nombre'], 'Equipos')


class FichaTests(CatalogoTestCase):
    def test_nombre_repetido_en_la_misma_categoria(self):
        respuesta = self.client.post('/catalogo/admin/recursos/', {'nombre': 'PROYECTOR EPSON', 'categoria': str(self.equipos.pk)})
        self.assertEqual(respuesta.status_code, 400)

    def test_mismo_nombre_en_otra_categoria_es_valido(self):
        libros = Categoria.objects.create(nombre='Libros')
        respuesta = self.client.post('/catalogo/admin/recursos/', {'nombre': 'Proyector Epson', 'categoria': str(libros.pk)})
        self.assertEqual(respuesta.status_code, 201)
        self.assertEqual(respuesta.data['disponibilidad'], 'SIN_EJEMPLARES')

    def test_categoria_obligatoria_al_crear(self):
        respuesta = self.client.post('/catalogo/admin/recursos/', {'nombre': 'Laptop'})
        self.assertEqual(respuesta.status_code, 400)

    def test_estado_ficha_no_se_cambia_por_patch(self):
        self.client.patch(f'/catalogo/admin/recursos/{self.ficha.pk}/', {'estado_ficha': 'DADA_DE_BAJA'})
        self.ficha.refresh_from_db()
        self.assertEqual(self.ficha.estado_ficha, EstadoFicha.ACTIVA)

    def test_put_no_esta_permitido(self):
        respuesta = self.client.put(f'/catalogo/admin/recursos/{self.ficha.pk}/', {'nombre': 'X', 'categoria': str(self.equipos.pk)})
        self.assertEqual(respuesta.status_code, 405)

    def test_baja_oculta_del_catalogo_y_reactivar_la_devuelve(self):
        self.assertEqual(self.client.post(f'/catalogo/admin/recursos/{self.ficha.pk}/baja/').status_code, 200)
        self.assertEqual(self.client.post(f'/catalogo/admin/recursos/{self.ficha.pk}/baja/').status_code, 400)
        self.assertEqual(self.client.get('/catalogo/recursos/').data['results'], [])
        self.assertEqual(self.client.get(f'/catalogo/recursos/{self.ficha.pk}/').status_code, 404)

        self.client.post(f'/catalogo/admin/recursos/{self.ficha.pk}/reactivar/')
        self.assertEqual(self.client.get('/catalogo/recursos/').data['count'], 1)

    def test_baja_con_prestamo_activo_se_permite(self):
        self.prestar()
        respuesta = self.client.post(f'/catalogo/admin/recursos/{self.ficha.pk}/baja/')
        self.assertEqual(respuesta.status_code, 200)

    def test_eliminar_ficha_sin_historial(self):
        respuesta = self.client.delete(f'/catalogo/admin/recursos/{self.ficha.pk}/')
        self.assertEqual(respuesta.status_code, 204)
        self.assertFalse(EjemplarFisico.objects.filter(pk=self.ejemplar.pk).exists())

    def test_eliminar_ficha_con_historial_responde_409(self):
        prestamo_id = self.prestar().data['id']
        self.client.post(f'/prestamos/admin/reservas/{prestamo_id}/devolver/')
        respuesta = self.client.delete(f'/catalogo/admin/recursos/{self.ficha.pk}/')
        self.assertEqual(respuesta.status_code, 409)
        self.assertTrue(Prestamo.objects.filter(pk=prestamo_id).exists())


class DisponibilidadTests(CatalogoTestCase):
    def test_conteos_y_disponibilidad(self):
        EjemplarFisico.objects.create(ficha_recurso=self.ficha, codigo_inventario='PROY-02', estado=EstadoEjemplar.EN_MANTENIMIENTO)
        EjemplarFisico.objects.create(ficha_recurso=self.ficha, codigo_inventario='PROY-03', estado=EstadoEjemplar.DADO_DE_BAJA)
        recurso = self.client.get('/catalogo/recursos/').data['results'][0]
        self.assertEqual((recurso['total_ejemplares'], recurso['disponibles'], recurso['disponibilidad']), (2, 1, 'DISPONIBLE'))

        self.prestar()
        recurso = self.client.get('/catalogo/recursos/').data['results'][0]
        self.assertEqual((recurso['disponibles'], recurso['disponibilidad']), (0, 'AGOTADO'))

    def test_filtros_del_catalogo(self):
        FichaRecurso.objects.create(nombre='Laptop Lenovo', categoria=self.equipos)
        self.assertEqual(len(self.client.get('/catalogo/recursos/', {'q': 'lenovo'}).data['results']), 1)
        self.assertEqual(len(self.client.get('/catalogo/recursos/', {'solo_disponibles': 'true'}).data['results']), 1)
        self.assertEqual(len(self.client.get('/catalogo/recursos/', {'categoria': str(self.equipos.pk)}).data['results']), 2)
        self.assertEqual(self.client.get('/catalogo/recursos/', {'categoria': 'no-es-uuid'}).status_code, 400)


class EjemplarTests(CatalogoTestCase):
    def url_ejemplares(self, ficha=None):
        return f'/catalogo/admin/recursos/{(ficha or self.ficha).pk}/ejemplares/'

    def test_crear_sin_mandar_la_ficha_en_el_body(self):
        respuesta = self.client.post(self.url_ejemplares(), {'codigo_inventario': ' proy-02 '})
        self.assertEqual(respuesta.status_code, 201)
        self.assertEqual(respuesta.data['codigo_inventario'], 'PROY-02')
        self.assertEqual(respuesta.data['ficha_recurso'], self.ficha.pk)

    def test_codigo_repetido_sin_importar_mayusculas(self):
        respuesta = self.client.post(self.url_ejemplares(), {'codigo_inventario': 'proy-01'})
        self.assertEqual(respuesta.status_code, 400)

    def test_no_se_crea_prestado_ni_dado_de_baja(self):
        for estado in (EstadoEjemplar.PRESTADO, EstadoEjemplar.DADO_DE_BAJA):
            respuesta = self.client.post(self.url_ejemplares(), {'codigo_inventario': 'PROY-09', 'estado': estado})
            self.assertEqual(respuesta.status_code, 400)

    def test_no_se_agregan_ejemplares_a_ficha_de_baja(self):
        self.client.post(f'/catalogo/admin/recursos/{self.ficha.pk}/baja/')
        respuesta = self.client.post(self.url_ejemplares(), {'codigo_inventario': 'PROY-02'})
        self.assertEqual(respuesta.status_code, 400)

    def test_ficha_inexistente_responde_404(self):
        respuesta = self.client.get('/catalogo/admin/recursos/00000000-0000-0000-0000-000000000000/ejemplares/')
        self.assertEqual(respuesta.status_code, 404)

    def test_no_se_cambia_de_ficha(self):
        otra = FichaRecurso.objects.create(nombre='Laptop', categoria=self.equipos)
        self.client.patch(f'/catalogo/admin/ejemplares/{self.ejemplar.pk}/', {'ficha_recurso': str(otra.pk)})
        self.ejemplar.refresh_from_db()
        self.assertEqual(self.ejemplar.ficha_recurso, self.ficha)

    def test_no_se_marca_prestado_a_mano(self):
        respuesta = self.client.patch(f'/catalogo/admin/ejemplares/{self.ejemplar.pk}/', {'estado': 'PRESTADO'})
        self.assertEqual(respuesta.status_code, 400)

    def test_prestado_no_cambia_de_estado_a_mano(self):
        self.prestar()
        respuesta = self.client.patch(f'/catalogo/admin/ejemplares/{self.ejemplar.pk}/', {'estado': 'DISPONIBLE'})
        self.assertEqual(respuesta.status_code, 400)

    def test_danado_no_puede_quedar_disponible(self):
        respuesta = self.client.patch(f'/catalogo/admin/ejemplares/{self.ejemplar.pk}/', {'condicion': 'DANADO'})
        self.assertEqual(respuesta.status_code, 400)
        respuesta = self.client.patch(
            f'/catalogo/admin/ejemplares/{self.ejemplar.pk}/', {'condicion': 'DANADO', 'estado': 'EN_MANTENIMIENTO'},
        )
        self.assertEqual(respuesta.status_code, 200)

    def test_eliminar_ejemplar_con_historial_responde_409(self):
        prestamo_id = self.prestar().data['id']
        self.client.post(f'/prestamos/admin/reservas/{prestamo_id}/devolver/')
        respuesta = self.client.delete(f'/catalogo/admin/ejemplares/{self.ejemplar.pk}/')
        self.assertEqual(respuesta.status_code, 409)


class PrestamoConCatalogoTests(CatalogoTestCase):
    def test_no_se_presta_un_recurso_dado_de_baja(self):
        self.client.post(f'/catalogo/admin/recursos/{self.ficha.pk}/baja/')
        self.assertEqual(self.prestar().status_code, 400)

    def test_no_se_presta_sin_ejemplares_disponibles(self):
        self.ejemplar.estado = EstadoEjemplar.EN_MANTENIMIENTO
        self.ejemplar.save()
        self.assertEqual(self.prestar().status_code, 400)

    def test_devolucion_doble_se_rechaza(self):
        prestamo_id = self.prestar().data['id']
        self.assertEqual(self.client.post(f'/prestamos/admin/reservas/{prestamo_id}/devolver/').status_code, 200)
        self.assertEqual(self.client.post(f'/prestamos/admin/reservas/{prestamo_id}/devolver/').status_code, 400)

    def test_devolucion_danada_va_a_mantenimiento(self):
        prestamo_id = self.prestar().data['id']
        self.client.post(f'/prestamos/admin/reservas/{prestamo_id}/devolver/', {'condicion': CondicionEjemplar.DANADO})
        self.ejemplar.refresh_from_db()
        self.assertEqual((self.ejemplar.estado, self.ejemplar.condicion), (EstadoEjemplar.EN_MANTENIMIENTO, CondicionEjemplar.DANADO))

    def test_devolucion_normal_libera_el_ejemplar(self):
        prestamo_id = self.prestar().data['id']
        self.client.post(f'/prestamos/admin/reservas/{prestamo_id}/devolver/')
        self.ejemplar.refresh_from_db()
        self.assertEqual(self.ejemplar.estado, EstadoEjemplar.DISPONIBLE)

    def test_no_se_elimina_un_prestamo_pendiente(self):
        prestamo_id = self.prestar().data['id']
        respuesta = self.client.delete(f'/prestamos/admin/reservas/{prestamo_id}/')
        self.assertEqual(respuesta.status_code, 405)
        self.assertEqual(Prestamo.objects.get(pk=prestamo_id).estado, EstadoPrestamo.ACTIVO)
