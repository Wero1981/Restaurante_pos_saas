from django.db import models
from django.utils import timezone
from restaurantes.models import Restaurante

class Plan(models.Model):
    nombre = models.CharField(max_length=50)
    precio = models.DecimalField(max_digits=10, decimal_places=2)
    limite_usuarios = models.IntegerField()
    limite_sucursales = models.IntegerField(default=1)
    limi_cajas = models.IntegerField(default=1)
    activo = models.BooleanField(default=True)
    mercadopago_plan_id = models.CharField(max_length=255, blank=True)

    def __str__(self):
        return self.nombre


class Suscripcion(models.Model):
    PROVEEDOR_MERCADOPAGO = "mercadopago"
    PROVEEDOR_PAYPAL = "paypal"
    PROVEEDORES = [
        (PROVEEDOR_MERCADOPAGO, "Mercado Pago"),
        (PROVEEDOR_PAYPAL, "PayPal"),
    ]

    ESTADO_TRIAL = "trialing"
    ESTADO_PENDIENTE = "pending"
    ESTADO_AUTORIZADA = "authorized"
    ESTADO_PAUSADA = "paused"
    ESTADO_CANCELADA = "cancelled"
    ESTADO_VENCIDA = "expired"
    ESTADOS_PAGO = [
        (ESTADO_TRIAL, "Periodo de prueba"),
        (ESTADO_PENDIENTE, "Pendiente"),
        (ESTADO_AUTORIZADA, "Autorizada"),
        (ESTADO_PAUSADA, "Pausada"),
        (ESTADO_CANCELADA, "Cancelada"),
        (ESTADO_VENCIDA, "Vencida"),
    ]

    restaurante = models.OneToOneField(
        Restaurante,
        on_delete=models.CASCADE
    )
    plan = models.ForeignKey(Plan, on_delete=models.PROTECT)
    activa = models.BooleanField(default=True)
    inicio = models.DateField(auto_now_add=True)
    vence = models.DateField()
    proveedor = models.CharField(max_length=20, choices=PROVEEDORES, blank=True)
    proveedor_suscripcion_id = models.CharField(max_length=255, blank=True)
    estado_pago = models.CharField(
        max_length=30,
        choices=ESTADOS_PAGO,
        default=ESTADO_TRIAL,
    )
    cancelar_al_final = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.restaurante.nombre} - {self.plan.nombre}"

    @property
    def esta_vencida(self):
        return not self.activa or self.vence < timezone.localdate()

    @property
    def dias_restantes(self):
        if not self.activa:
            return 0
        return max((self.vence - timezone.localdate()).days, 0)

    @property
    def en_periodo_prueba(self):
        return self.inicio <= timezone.localdate() <= self.vence


class Pago(models.Model):
    PROVEEDOR_MERCADOPAGO = "mercadopago"

    suscripcion = models.ForeignKey(
        Suscripcion,
        on_delete=models.CASCADE,
        related_name="pagos",
    )
    proveedor = models.CharField(max_length=20)
    proveedor_pago_id = models.CharField(max_length=255, unique=True)
    monto = models.DecimalField(max_digits=10, decimal_places=2)
    moneda = models.CharField(max_length=3, default="MXN")
    estado = models.CharField(max_length=30)
    fecha_pago = models.DateTimeField(null=True, blank=True)
    creado = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-creado"]

    def __str__(self):
        return f"{self.proveedor} {self.proveedor_pago_id} - {self.estado}"
