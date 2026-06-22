from datetime import timedelta
from decimal import Decimal

from django.conf import settings
from django.db import transaction
from django.shortcuts import redirect
from django.utils.dateparse import parse_datetime
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions import EsAdmin
from core.restaurantes import get_restaurante_request
from caja.models import Caja
from restaurantes.models import Restaurante, UsuarioRestaurante

from .limites import obtener_limites_efectivos, obtener_suscripcion
from .mercadopago import (
    MercadoPagoError,
    crear_checkout_plan,
    obtener_pago,
    obtener_preaprobacion,
    verificar_firma_webhook,
)
from .models import Pago, Plan, Suscripcion
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

        suscripcion = obtener_o_crear_suscripcion(restaurante)

        return Response(SuscripcionSerializer(suscripcion).data)


class UsoSuscripcionView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        restaurante = get_restaurante_request(request)
        if not restaurante:
            return Response(
                {"detail": "Selecciona un restaurante válido."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        suscripcion = obtener_suscripcion(restaurante)
        limites = obtener_limites_efectivos(suscripcion)
        principal = restaurante.propietario
        return Response({
            "tipo": (
                "plan"
                if suscripcion.estado_pago == Suscripcion.ESTADO_AUTORIZADA
                else "prueba"
            ),
            "restaurantes": {
                "usados": Restaurante.objects.filter(
                    propietario=principal,
                    activo=True,
                ).count(),
                "limite": limites["restaurantes"],
            },
            "usuarios": {
                "usados": UsuarioRestaurante.objects.filter(
                    restaurante=restaurante,
                    activo=True,
                ).exclude(usuario=principal).count(),
                "limite": limites["usuarios"],
            },
            "cajas": {
                "abiertas": Caja.objects.filter(
                    restaurante=restaurante,
                    abierta=True,
                ).count(),
                "limite": limites["cajas"],
            },
        })


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

        suscripcion = obtener_o_crear_suscripcion(restaurante, plan)
        if Decimal(plan.precio) > Decimal("0"):
            return Response(
                {"detail": "Los planes de pago deben contratarse mediante Mercado Pago."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        suscripcion.plan = plan
        suscripcion.plan_pendiente = None
        suscripcion.activa = True
        suscripcion.estado_pago = Suscripcion.ESTADO_AUTORIZADA
        suscripcion.save(
            update_fields=["plan", "plan_pendiente", "activa", "estado_pago"]
        )

        return Response(
            {
                "detail": "Plan seleccionado. El periodo de prueba conserva su fecha de vencimiento.",
                "suscripcion": SuscripcionSerializer(suscripcion).data,
            }
        )


def obtener_o_crear_suscripcion(restaurante, plan=None):
    if plan is None:
        plan = Plan.objects.filter(nombre="Basico").order_by("id").first()
        if not plan:
            plan = Plan.objects.create(
                nombre="Basico",
                precio="0.00",
                limite_usuarios=5,
                limite_sucursales=1,
                limite_cajas=1,
            )

    suscripcion, _ = Suscripcion.objects.get_or_create(
        usuario_principal=restaurante.propietario,
        defaults={
            "plan": plan,
            "vence": timezone.localdate() + timedelta(days=15),
        },
    )
    return suscripcion


class CrearSuscripcionMercadoPagoView(APIView):
    permission_classes = [IsAuthenticated, EsAdmin]

    @transaction.atomic
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

        suscripcion = obtener_o_crear_suscripcion(restaurante, plan)

        if Decimal(plan.precio) <= Decimal("0"):
            suscripcion.plan = plan
            suscripcion.plan_pendiente = None
            suscripcion.activa = True
            suscripcion.estado_pago = Suscripcion.ESTADO_AUTORIZADA
            suscripcion.save(
                update_fields=["plan", "plan_pendiente", "activa", "estado_pago"]
            )
            return Response(
                {
                    "detail": "Plan gratuito seleccionado.",
                    "suscripcion": SuscripcionSerializer(suscripcion).data,
                }
            )

        try:
            checkout = crear_checkout_plan(plan, suscripcion)
        except MercadoPagoError as error:
            return Response(
                {"detail": str(error)},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        suscripcion.plan_pendiente = plan
        suscripcion.proveedor = Suscripcion.PROVEEDOR_MERCADOPAGO
        suscripcion.proveedor_suscripcion_id = checkout["id"]
        suscripcion.estado_pago = Suscripcion.ESTADO_PENDIENTE
        suscripcion.save(
            update_fields=[
                "plan_pendiente",
                "proveedor",
                "proveedor_suscripcion_id",
                "estado_pago",
            ]
        )

        checkout_url = (
            checkout.get("init_point")
            or checkout.get("sandbox_init_point")
        )
        return Response(
            {
                "checkout_url": checkout_url,
                "suscripcion": SuscripcionSerializer(suscripcion).data,
            },
            status=status.HTTP_201_CREATED,
        )


class MercadoPagoWebhookView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        if not verificar_firma_webhook(request):
            return Response(
                {"detail": "Firma inválida."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        topic = (
            request.data.get("type")
            or request.data.get("topic")
            or request.query_params.get("type")
            or request.query_params.get("topic")
        )
        resource_id = (
            request.query_params.get("data.id")
            or request.data.get("data", {}).get("id")
            or request.data.get("id")
        )

        if not topic or not resource_id:
            return Response({"detail": "Webhook recibido sin recurso."})

        try:
            if topic == "payment":
                self._procesar_pago(resource_id)
            elif topic in {"subscription_preapproval", "preapproval"}:
                self._procesar_preaprobacion(resource_id)
        except MercadoPagoError:
            return Response(
                {"detail": "No se pudo consultar Mercado Pago."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        return Response({"detail": "Webhook procesado."})

    def _procesar_preaprobacion(self, preapproval_id):
        preaprobacion = obtener_preaprobacion(preapproval_id)
        suscripcion = Suscripcion.objects.filter(
            proveedor=Suscripcion.PROVEEDOR_MERCADOPAGO,
            proveedor_suscripcion_id=preapproval_id,
        ).first()
        if not suscripcion and preaprobacion.get("preapproval_plan_id"):
            suscripcion = Suscripcion.objects.filter(
                proveedor=Suscripcion.PROVEEDOR_MERCADOPAGO,
                proveedor_suscripcion_id=preaprobacion["preapproval_plan_id"],
            ).first()
        if not suscripcion and preaprobacion.get("external_reference"):
            suscripcion = Suscripcion.objects.filter(
                id=preaprobacion["external_reference"],
            ).first()
        if not suscripcion:
            return

        estado = preaprobacion.get("status") or Suscripcion.ESTADO_PENDIENTE
        suscripcion.proveedor_suscripcion_id = preapproval_id
        suscripcion.estado_pago = estado
        suscripcion.activa = estado == Suscripcion.ESTADO_AUTORIZADA
        update_fields = [
            "proveedor_suscripcion_id",
            "estado_pago",
            "activa",
            "cancelar_al_final",
        ]
        if estado == Suscripcion.ESTADO_AUTORIZADA and suscripcion.plan_pendiente:
            suscripcion.plan = suscripcion.plan_pendiente
            suscripcion.plan_pendiente = None
            update_fields.extend(["plan", "plan_pendiente"])
        if estado in {Suscripcion.ESTADO_CANCELADA, Suscripcion.ESTADO_PAUSADA}:
            suscripcion.cancelar_al_final = estado == Suscripcion.ESTADO_CANCELADA
        suscripcion.save(update_fields=update_fields)

    @transaction.atomic
    def _procesar_pago(self, payment_id):
        pago_remoto = obtener_pago(payment_id)
        if pago_remoto.get("status") != "approved":
            return

        preapproval_id = (
            pago_remoto.get("metadata", {}).get("preapproval_id")
            or pago_remoto.get("preapproval_id")
        )
        suscripcion = None
        if preapproval_id:
            suscripcion = Suscripcion.objects.filter(
                proveedor=Suscripcion.PROVEEDOR_MERCADOPAGO,
                proveedor_suscripcion_id=preapproval_id,
            ).first()

        if not suscripcion and pago_remoto.get("external_reference"):
            suscripcion = Suscripcion.objects.filter(
                id=pago_remoto["external_reference"]
            ).first()

        if not suscripcion:
            return

        fecha_pago = parse_datetime(pago_remoto.get("date_approved") or "")
        Pago.objects.update_or_create(
            proveedor_pago_id=str(pago_remoto["id"]),
            defaults={
                "suscripcion": suscripcion,
                "proveedor": Pago.PROVEEDOR_MERCADOPAGO,
                "monto": Decimal(str(pago_remoto.get("transaction_amount", "0"))),
                "moneda": pago_remoto.get("currency_id") or "MXN",
                "estado": pago_remoto.get("status") or "approved",
                "fecha_pago": fecha_pago,
            },
        )

        suscripcion.activa = True
        suscripcion.estado_pago = Suscripcion.ESTADO_AUTORIZADA
        suscripcion.vence = timezone.localdate() + timedelta(days=30)
        update_fields = ["activa", "estado_pago", "vence"]
        if suscripcion.plan_pendiente:
            suscripcion.plan = suscripcion.plan_pendiente
            suscripcion.plan_pendiente = None
            update_fields.extend(["plan", "plan_pendiente"])
        suscripcion.save(update_fields=update_fields)


class MercadoPagoRetornoView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        return redirect(f"{settings.FRONTEND_URL.rstrip('/')}/suscripcion")
