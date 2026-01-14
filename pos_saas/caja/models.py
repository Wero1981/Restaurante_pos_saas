from django.db import models
from decimal import Decimal

from django.utils import timezone
from restaurantes.models import Restaurante

class Caja(models.Model):
    restaurante = models.ForeignKey(Restaurante, on_delete=models.CASCADE)
    usuario = models.ForeignKey('usuarios.Usuario', on_delete=models.CASCADE, null=True, blank=True)
    monto_inicial = models.DecimalField(max_digits=10, decimal_places=2)
    monto_final = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    fecha_cierre = models.DateTimeField(null=True, blank=True)
    fecha_apertura = models.DateTimeField(auto_now_add=True)
    abierta = models.BooleanField(default=True)
    total_ventas = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    total_efectivo = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    total_tarjeta = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    total_otros = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    total_movimientos_entrada = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    total_movimientos_salida = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    cierre_automatico = models.BooleanField(default=False)

    def registrar_cierre(self, resumen, cierre_automatico=False):
        """Actualiza la caja con la información calculada al cierre."""
        ventas_por_metodo = resumen['ventas']['por_metodo']
        self.total_ventas = resumen['ventas']['total']
        self.total_efectivo = ventas_por_metodo.get('efectivo', Decimal('0.00'))
        self.total_tarjeta = ventas_por_metodo.get('tarjeta', Decimal('0.00'))
        self.total_otros = ventas_por_metodo.get('otros', Decimal('0.00'))
        self.total_movimientos_entrada = resumen['movimientos']['entradas']
        self.total_movimientos_salida = resumen['movimientos']['salidas']
        self.monto_final = resumen['monto_final']
        self.abierta = False
        self.fecha_cierre = timezone.now()
        self.cierre_automatico = cierre_automatico
        self.save(update_fields=[
            'total_ventas',
            'total_efectivo',
            'total_tarjeta',
            'total_otros',
            'total_movimientos_entrada',
            'total_movimientos_salida',
            'monto_final',
            'abierta',
            'fecha_cierre',
            'cierre_automatico'
        ])

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