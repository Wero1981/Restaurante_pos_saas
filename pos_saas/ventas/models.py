from django.db import models
from restaurantes.models import Restaurante
from usuarios.models import Usuario

class Venta(models.Model):
    restaurante = models.ForeignKey(Restaurante, on_delete=models.CASCADE)
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, null=True, blank=True)
    mesa = models.ForeignKey('Mesa', on_delete=models.SET_NULL, null=True, blank=True)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    estado = models.CharField(
        max_length=20,
        choices=[
            ('pendiente', 'Pendiente'),
            ('pagada', 'Pagada'),
            ('cancelada', 'Cancelada')
        ],
        default='pendiente'
    )
    metodo_pago = models.CharField(max_length=50)
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)

class VentaDetalle(models.Model):
    venta = models.ForeignKey(Venta, on_delete=models.CASCADE)
    producto = models.ForeignKey('productos.Producto', on_delete=models.CASCADE)
    cantidad = models.DecimalField(max_digits=10, decimal_places=3)  # Cambiado para soportar decimales (ej: 1.5 kg)
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    fecha = models.DateTimeField(auto_now_add=True)

class Mesa(models.Model):
    restaurante = models.ForeignKey(Restaurante, on_delete=models.CASCADE)
    nombre = models.CharField(max_length=50)
    capacidad = models.IntegerField(default=4)
    estado = models.CharField(
        max_length=20,
        choices=[
            ('disponible', 'Disponible'),
            ('ocupada', 'Ocupada'),
            ('reservada', 'Reservada')
        ],
        default='disponible'
    )
    activa = models.BooleanField(default=True)

class Pedido(models.Model):
    restaurante = models.ForeignKey(Restaurante, on_delete=models.CASCADE)
    mesa = models.ForeignKey(Mesa, on_delete=models.SET_NULL, null=True)
    estado = models.CharField(
        max_length=20, 
        choices=[
            ('abierto', 'Abierto'),
            ('cerrado', 'Cerrado'),
            ('cancelado', 'Cancelado')
        ],
        default='abierto'
    )
    creado = models.DateTimeField(auto_now_add=True)

class PedidoDetalle(models.Model):
    pedido = models.ForeignKey(Pedido, related_name='items', on_delete=models.CASCADE)
    producto = models.ForeignKey('productos.Producto', on_delete=models.CASCADE)
    cantidad = models.IntegerField()
