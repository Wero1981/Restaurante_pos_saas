from django.db import models
from restaurantes.models import Restaurante
from usuarios.models import Usuario

class Categoria(models.Model):
    restaurante = models.ForeignKey(Restaurante, on_delete=models.CASCADE)
    nombre = models.CharField(max_length=100)


class Producto(models.Model):
    restaurante = models.ForeignKey(Restaurante, on_delete=models.CASCADE)
    categoria = models.ForeignKey(Categoria, on_delete=models.CASCADE, null=True, blank=True)
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True)
    precio = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.IntegerField(default=0)
    activo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

