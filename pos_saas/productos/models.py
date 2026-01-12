from django.db import models
from django.core.exceptions import ValidationError
from restaurantes.models import Restaurante
from usuarios.models import Usuario

class Categoria(models.Model):
    restaurante = models.ForeignKey(Restaurante, on_delete=models.CASCADE)
    nombre = models.CharField(max_length=100)
    url_imagen = models.URLField(blank=True)
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
    
    def clean(self):
        """Validar que el stock no sea negativo (excepto -1 que significa ilimitado)"""
        if self.stock is not None and self.stock < -1:
            raise ValidationError({
                'stock': 'El stock no puede ser menor a -1. Use -1 para stock ilimitado o valores >= 0.'
            })
    
    def save(self, *args, **kwargs):
        """Override save para ejecutar validaciones solo si no se especifica lo contrario"""
        # Permitir skip_validation=True para operaciones bulk o correcciones
        skip_validation = kwargs.pop('skip_validation', False)
        if not skip_validation:
            self.full_clean()
        super().save(*args, **kwargs)

