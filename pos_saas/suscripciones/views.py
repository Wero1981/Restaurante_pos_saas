from datetime import timedelta

from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions import EsAdmin
from core.restaurantes import get_restaurante_request

from .models import Plan, Suscripcion
from .serializers import PlanSerializer, SuscripcionSerializer


class PlanesView(APIView):
    permission_classes = [IsAuthenticated, EsAdmin]

    def get(self, request):
        planes = Plan.objects.filter(activo=True).order_by("precio", "id")
        return Response(PlanSerializer(planes, many=True).data)


class SuscripcionActualView(APIView):
    permission_classes = [IsAuthenticated, EsAdmin]

    def get(self, request):
        restaurante = get_restaurante_request(request)
        if not restaurante:
            return Response(
                {"detail": "Selecciona un restaurante válido."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        suscripcion = (
            Suscripcion.objects.filter(restaurante=restaurante)
            .select_related("plan", "restaurante")
            .first()
        )
        if not suscripcion:
            plan = Plan.objects.filter(nombre="Basico").order_by("id").first()
            if not plan:
                plan = Plan.objects.create(
                    nombre="Basico",
                    precio="0.00",
                    limite_usuarios=5,
                    limite_sucursales=1,
                    limi_cajas=1,
                )
            suscripcion = Suscripcion.objects.create(
                restaurante=restaurante,
                plan=plan,
                vence=timezone.localdate() + timedelta(days=15),
            )

        return Response(SuscripcionSerializer(suscripcion).data)


class SeleccionarPlanView(APIView):
    permission_classes = [IsAuthenticated, EsAdmin]

    def post(self, request):
        restaurante = get_restaurante_request(request)
        plan_id = request.data.get("plan_id")

        if not restaurante:
            return Response(
                {"detail": "Selecciona un restaurante válido."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            plan = Plan.objects.get(id=plan_id, activo=True)
        except Plan.DoesNotExist:
            return Response(
                {"plan_id": ["El plan seleccionado no existe o está inactivo."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        suscripcion, _ = Suscripcion.objects.get_or_create(
            restaurante=restaurante,
            defaults={
                "plan": plan,
                "vence": timezone.localdate() + timedelta(days=15),
            },
        )
        suscripcion.plan = plan
        suscripcion.save(update_fields=["plan"])

        return Response(
            {
                "detail": "Plan seleccionado. El periodo de prueba conserva su fecha de vencimiento.",
                "suscripcion": SuscripcionSerializer(suscripcion).data,
            }
        )
