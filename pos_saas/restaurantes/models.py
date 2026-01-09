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
    MESERO = 'mesero'
    COCINERO = 'cocinero'

    ROLES = [
        (ADMIN, 'Administrador'),
        (CAJERO, 'Cajero'),
        (MESERO, 'Mesero'),
        (COCINERO, 'Cocinero'),
    ]

    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE)
    restaurante = models.ForeignKey(Restaurante, on_delete=models.CASCADE)
    rol = models.CharField(max_length=10, choices=ROLES)

    permisos = models.ManyToManyField('Permiso', blank=True, related_name='usuarios_restaurante')

    activo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('usuario', 'restaurante')

class Permiso(models.Model):
    codigo = models.CharField(max_length=50, unique=True)
    descripcion = models.CharField(max_length=255)

    def __str__(self):
        return self.codigo
    
