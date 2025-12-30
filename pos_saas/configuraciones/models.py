from django.db import models
from restaurantes.models import Restaurante

class Configuracion(models.Model):
    """Modelo para almacenar configuraciones generales del sistema."""

    restaurante = models.ForeignKey(Restaurante, on_delete=models.CASCADE)
    tipo_moneda = models.CharField(max_length=10, default='USD')
    descripcion = models.TextField(blank=True, default='')
    logo = models.URLField(blank=True, null=True)