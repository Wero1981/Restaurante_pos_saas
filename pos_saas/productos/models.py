from django.db import models
from restaurantes.models import Restaurante
from usuarios.models import Usuario

class Categoria(models.Model):
    restaurante = models.ForeignKey(Restaurante, on_delete=models.CASCADE)
    nombre = models.CharField(max_length=100)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='subcategorias')


class Producto(models.Model):
    UNIDAD_CHOICES = [
        ('unidad', 'Unidad'),
        ('kilogramo', 'Kilogramo'),
        ('gramo', 'Gramo'),
        ('litro', 'Litro'),
        ('mililitro', 'Mililitro'),
        ('porcion', 'Porción'),
    ]
    
    restaurante = models.ForeignKey(Restaurante, on_delete=models.CASCADE)
    categoria = models.ForeignKey(Categoria, on_delete=models.CASCADE, null=True, blank=True)
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True)
    precio = models.DecimalField(max_digits=10, decimal_places=2)
    precio_por_unidad = models.CharField(max_length=20, choices=UNIDAD_CHOICES, default='unidad')
    stock = models.DecimalField(max_digits=10, decimal_places=3, default=0)  # Cambiado a Decimal para soportar decimales
    activo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.nombre} - ${self.precio}/{self.get_precio_por_unidad_display()}"

