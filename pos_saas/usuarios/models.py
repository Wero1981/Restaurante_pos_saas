from django.contrib.auth.models import AbstractUser, PermissionsMixin
from django.db import models
from .manager import UsuarioManager

class Usuario(AbstractUser, PermissionsMixin):
    nombre = models.CharField(max_length=150)
    apellidoM = models.CharField(max_length=150)
    apellidoP = models.CharField(max_length=150)
    email = models.EmailField(unique=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)
    last_modified = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['nombre',]

    objects = UsuarioManager()
    def __str__(self):
        return f"{self.nombre} {self.apellidoP} {self.apellidoM} <{self.email}>"
