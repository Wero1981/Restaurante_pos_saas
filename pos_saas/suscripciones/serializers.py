from rest_framework import serializers

from .models import Pago, Plan, Suscripcion


class PlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = Plan
        fields = [
            "id",
            "nombre",
            "precio",
            "limite_usuarios",
            "limite_sucursales",
            "limite_cajas",
            "mercadopago_plan_id",
        ]


class PagoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pago
        fields = [
            "id",
            "proveedor",
            "proveedor_pago_id",
            "monto",
            "moneda",
            "estado",
            "fecha_pago",
            "creado",
        ]


class SuscripcionSerializer(serializers.ModelSerializer):
    plan = PlanSerializer(read_only=True)
    plan_pendiente = PlanSerializer(read_only=True)
    usuario_principal_email = serializers.EmailField(
        source="usuario_principal.email",
        read_only=True,
    )
    dias_restantes = serializers.IntegerField(read_only=True)
    esta_vencida = serializers.BooleanField(read_only=True)
    en_periodo_prueba = serializers.BooleanField(read_only=True)

    class Meta:
        model = Suscripcion
        fields = [
            "id",
            "usuario_principal",
            "usuario_principal_email",
            "plan",
            "plan_pendiente",
            "activa",
            "inicio",
            "vence",
            "proveedor",
            "proveedor_suscripcion_id",
            "estado_pago",
            "cancelar_al_final",
            "dias_restantes",
            "esta_vencida",
            "en_periodo_prueba",
        ]
