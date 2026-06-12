from rest_framework import serializers

from .models import Plan, Suscripcion


class PlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = Plan
        fields = [
            "id",
            "nombre",
            "precio",
            "limite_usuarios",
            "limite_sucursales",
            "limi_cajas",
        ]


class SuscripcionSerializer(serializers.ModelSerializer):
    plan = PlanSerializer(read_only=True)
    restaurante = serializers.CharField(source="restaurante.nombre", read_only=True)
    dias_restantes = serializers.IntegerField(read_only=True)
    esta_vencida = serializers.BooleanField(read_only=True)
    en_periodo_prueba = serializers.BooleanField(read_only=True)

    class Meta:
        model = Suscripcion
        fields = [
            "id",
            "restaurante",
            "plan",
            "activa",
            "inicio",
            "vence",
            "dias_restantes",
            "esta_vencida",
            "en_periodo_prueba",
        ]
