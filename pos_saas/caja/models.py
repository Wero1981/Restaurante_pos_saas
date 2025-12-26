from django.db import models
from restaurantes.models import Restaurante

class Caja(models.Model):
    restaurante = models.ForeignKey(Restaurante, on_delete=models.CASCADE)
    fecha_apertura = models.DateTimeField(auto_now_add=True)
    monto_inicial = models.DecimalField(max_digits=10, decimal_places=2)
    fecha_cierre = models.DateTimeField(null=True, blank=True)
    monto_final = models.DecimalField(max_digits=10, decimal_places=2, null=True)