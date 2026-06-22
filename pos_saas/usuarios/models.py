from django.contrib.auth.models import AbstractUser, PermissionsMixin
from django.contrib.auth.validators import UnicodeUsernameValidator
from django.db import models
from .manager import UsuarioManager

class Usuario(AbstractUser, PermissionsMixin):
    username_validator = UnicodeUsernameValidator()
    username = models.CharField(
        max_length=150,
        unique=True,
        help_text="Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only.",
        validators=[username_validator],
        error_messages={"unique": "El nombre de usuario ya existe."},
        verbose_name="username",
    )
    nombre = models.CharField(max_length=150)
    apellidoM = models.CharField(max_length=150, blank=True, null=True)
    apellidoP = models.CharField(max_length=150, blank=True, null=True)
    email = models.EmailField(unique=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)
    last_modified = models.DateTimeField(auto_now=True)
    google_id = models.CharField(max_length=255, blank=True, null=True, unique=True)
    email_verificado = models.BooleanField(default=False)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['nombre',]

    objects = UsuarioManager()
    def __str__(self):
        return f"{self.nombre} {self.apellidoP} {self.apellidoM} <{self.email}>"
