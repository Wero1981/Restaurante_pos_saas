from django.db import models
from restaurantes.models import Restaurante

class Caja(models.Model):
    restaurante = models.ForeignKey(Restaurante, on_delete=models.CASCADE)
    usuario = models.ForeignKey('usuarios.Usuario', on_delete=models.CASCADE, null=True, blank=True)
    monto_inicial = models.DecimalField(max_digits=10, decimal_places=2)
    monto_final = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    fecha_cierre = models.DateTimeField(null=True, blank=True)
    fecha_apertura = models.DateTimeField(auto_now_add=True)
    abierta = models.BooleanField(default=True)

class MovimientoCaja(models.Model):
    caja = models.ForeignKey(Caja, on_delete=models.CASCADE)
    tipo = models.CharField(
        max_length=10,
        choices=[
            ('entrada', 'Entrada'),
            ('salida', 'Salida')
        ]
    )
    monto = models.DecimalField(max_digits=10, decimal_places=2)
    descripcion = models.TextField(null=True, blank=True)
    fecha = models.DateTimeField(auto_now_add=True)