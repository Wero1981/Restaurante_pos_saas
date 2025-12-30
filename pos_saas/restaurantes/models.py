from django.db import models
from usuarios.models import Usuario

class Restaurante(models.Model):
    nombre = models.CharField(max_length=100)
    direccion = models.CharField(max_length=255)
    telefono = models.CharField(max_length=15)
    ciudad = models.CharField(max_length=100, blank=True, default='')
    estado = models.CharField(max_length=100, blank=True, default='')
    email = models.EmailField(blank=True, default='')
    sitio_web = models.URLField(blank=True, null=True)
    propietario = models.ForeignKey(Usuario, on_delete=models.CASCADE)
    activo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.nombre
    
class UsuarioRestaurante(models.Model):
    ADMIN = 'admin'
    CAJERO = 'cajero'

    ROLES = [
        (ADMIN, 'Administrador'),
        (CAJERO, 'Cajero'),
    ]

    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE)
    restaurante = models.ForeignKey(Restaurante, on_delete=models.CASCADE)
    rol = models.CharField(max_length=10, choices=ROLES)
    activo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)