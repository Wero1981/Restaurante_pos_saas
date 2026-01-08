from django.contrib.auth.models import BaseUserManager

class UsuarioManager(BaseUserManager):
    def create_user(self, email, nombre, password=None, **extra_fields):
        if not email:
            raise ValueError('El email es obligatorio')
        email = self.normalize_email(email)
        # Usar el email como username para evitar conflictos
        user = self.model(email=email, username=email, nombre=nombre, **extra_fields)
        user.set_password(password)
        user.save()
        return user

    def create_superuser(self, email, nombre='Admin', password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, nombre, password, **extra_fields)
        