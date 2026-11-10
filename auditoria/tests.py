from rest_framework.test import APITestCase

from users.models import TipoUsuario, Usuario

from .models import AccionAuditoria, RegistroAuditoria


class AuditoriaTests(APITestCase):
    def setUp(self):
        self.admin = Usuario.objects.create_user(
            'admin@test.com', 'ClaveSegura123', dni='10000001', tipo_usuario=TipoUsuario.ADMINISTRATOR,
        )
        self.alumno = Usuario.objects.create_user(
            'alumno@test.com', 'ClaveSegura123', dni='10000002', cui='20200001', tipo_usuario=TipoUsuario.STUDENT,
        )

    def test_cambiar_el_rol_queda_en_la_bitacora(self):
        self.client.force_authenticate(self.admin)
        self.client.patch(f'/users/admin/usuarios/{self.alumno.pk}/', {'tipo_usuario': TipoUsuario.TEACHER})
        registro = RegistroAuditoria.objects.get(accion=AccionAuditoria.USUARIO_CAMBIO_ROL)
        self.assertEqual(registro.actor, self.admin)
        self.assertIn('STUDENT -> TEACHER', registro.detalle)

    def test_la_bitacora_filtra_por_accion(self):
        self.client.force_authenticate(self.admin)
        self.client.patch(f'/users/admin/usuarios/{self.alumno.pk}/', {'tipo_usuario': TipoUsuario.TEACHER})
        self.client.patch(f'/users/admin/usuarios/{self.alumno.pk}/', {'status': 'SUSPENDIDO'})

        todos = self.client.get('/auditoria/')
        self.assertEqual(todos.data['count'], 2)
        soloo_rol = self.client.get(f'/auditoria/?accion={AccionAuditoria.USUARIO_CAMBIO_ROL}')
        self.assertEqual(soloo_rol.data['count'], 1)
        self.assertEqual(self.client.get('/auditoria/?accion=inventada').status_code, 400)

    def test_solo_el_admin_ve_la_bitacora(self):
        self.client.force_authenticate(self.alumno)
        self.assertEqual(self.client.get('/auditoria/').status_code, 403)
        self.client.force_authenticate(self.admin)
        self.assertEqual(self.client.get('/auditoria/').status_code, 200)
