from django.db import models
from restaurantes.models import Restaurante
from usuarios.models import Usuario

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

class Comensal(models.Model):
    mesa = models.ForeignKey(Mesa, on_delete=models.CASCADE)
    nombre = models.CharField(max_length=100)
    creado = models.DateTimeField(auto_now_add=True)

class Pedido(models.Model):
    restaurante = models.ForeignKey(Restaurante, on_delete=models.CASCADE)
    mesa = models.ForeignKey(Mesa, on_delete=models.SET_NULL, null=True)
    mesero = models.ForeignKey(
        Usuario, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        limit_choices_to={'usuariorestaurante__rol': 'mesero'}
    )
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
    comensal = models.ForeignKey(Comensal, on_delete=models.CASCADE, null=True, blank=True)
    producto = models.ForeignKey('productos.Producto', on_delete=models.CASCADE)
    cantidad = models.IntegerField()
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    observaciones = models.TextField(blank=True, default='')
    enviado_cocina = models.BooleanField(default=False)
    cancelado = models.BooleanField(default=False)
    pagado = models.BooleanField(default=False)
    pagado_en = models.DateTimeField(null=True, blank=True)
    venta = models.ForeignKey('Venta', related_name='detalles_pedido', null=True, blank=True, on_delete=models.SET_NULL)
    fecha = models.DateTimeField(auto_now_add=True)


class Venta(models.Model):
    restaurante = models.ForeignKey(Restaurante, on_delete=models.CASCADE)
    pedido = models.ForeignKey(Pedido, on_delete=models.CASCADE, null=True, blank=True, related_name='ventas')
    caja = models.ForeignKey('caja.Caja', on_delete=models.SET_NULL, null=True, blank=True, related_name='ventas')
    usuario = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True)
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
    created_at = models.DateTimeField(auto_now_add=True)

class VentaDetalle(models.Model):
    venta = models.ForeignKey(Venta, on_delete=models.CASCADE, related_name='detalles')
    comensal = models.ForeignKey(Comensal, on_delete=models.SET_NULL, null=True)
    producto = models.ForeignKey('productos.Producto', on_delete=models.CASCADE)
    cantidad = models.DecimalField(max_digits=10, decimal_places=3)
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
