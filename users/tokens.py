from django.contrib.auth.tokens import PasswordResetTokenGenerator


class ActivacionTokenGenerator(PasswordResetTokenGenerator):
    # Un salt propio hace que estos tokens no sirvan para restablecer contrasena y viceversa.
    key_salt = 'users.ActivacionTokenGenerator'


activacion_token = ActivacionTokenGenerator()
