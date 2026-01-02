from django.db import models

# Create your models here.
from django.db import models
from restaurantes.models import Restaurante
from caja.models import Caja

class Plan(models.Model):
    nombre = models.CharField(max_length=50)
    precio = models.DecimalField(max_digits=10, decimal_places=2)
    limite_usuarios = models.IntegerField()
    limite_sucursales = models.IntegerField(default=1)
    limi_cajas = models.IntegerField(default=1)
    activo = models.BooleanField(default=True)

    def __str__(self):
        return self.nombre


class Suscripcion(models.Model):
    restaurante = models.OneToOneField(
        Restaurante,
        on_delete=models.CASCADE
    )
    plan = models.ForeignKey(Plan, on_delete=models.PROTECT)
    activa = models.BooleanField(default=True)
    inicio = models.DateField(auto_now_add=True)
    vence = models.DateField()

    def __str__(self):
        return f"{self.restaurante.nombre} - {self.plan.nombre}"
