from django.db import models
from usuarios.models import Usuario
from django.utils.text import slugify
import uuid

class Restaurante(models.Model):
    nombre = models.CharField(max_length=100)
    slug = models.SlugField(
        max_length=120,
        unique=True,
        blank=True,
        null=True,
        help_text='Identificador único para la URL del restaurante'
    )
    direccion = models.CharField(max_length=255)
    telefono = models.CharField(max_length=15)
    ciudad = models.CharField(max_length=100, blank=True, default='')
    estado = models.CharField(max_length=100, blank=True, default='')
    email = models.EmailField(blank=True, default='')
    sitio_web = models.URLField(blank=True, null=True)
    propietario = models.ForeignKey(Usuario, on_delete=models.CASCADE)
    activo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    es_matriz = models.BooleanField(default=False)

    def __str__(self):
        return self.nombre

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.nombre) if self.nombre else ''
            if not base_slug:
                base_slug = f'restaurante-{uuid.uuid4().hex[:8]}'

            slug_candidate = base_slug
            counter = 1

            while Restaurante.objects.filter(slug=slug_candidate).exclude(pk=self.pk).exists():
                slug_candidate = f'{base_slug}-{counter}'
                counter += 1

            self.slug = slug_candidate

        super().save(*args, **kwargs)
    
class UsuarioRestaurante(models.Model):
    ADMIN = 'admin'
    CAJERO = 'cajero'
    MESERO = 'mesero'
    GERENTE = 'gerente'
    COCINERO = 'cocinero'

    ROLES = [
        (ADMIN, 'Administrador'),
        (CAJERO, 'Cajero'),
        (MESERO, 'Mesero'),
        (COCINERO, 'Cocinero'),
        (GERENTE, 'Gerente'),
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
    
