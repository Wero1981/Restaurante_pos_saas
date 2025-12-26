from django.contrib.auth.models import BaseUserManager

class UsuarioManager(BaseUserManager):
    def create_user(self, email, nombre, password=None, **extra_fields):
        if not email:
            raise ValueError('El email es obligatorio')
        email = self.normalize_email(email)
        user = self.model(email=email, nombre=nombre, **extra_fields)
        user.set_password(password)
        user.save()
        return user

    def create_superuser(self, email, password=None):
        return self.create_user(
            email,
            password,
            is_staff=True,
            is_superuser=True
        )
        