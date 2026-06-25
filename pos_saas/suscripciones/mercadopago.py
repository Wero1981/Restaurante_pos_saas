import hashlib
import hmac
from decimal import Decimal
from urllib.parse import urljoin

import requests
from django.conf import settings


API_BASE_URL = "https://api.mercadopago.com"


class MercadoPagoError(Exception):
    pass


def _headers():
    if not settings.MERCADOPAGO_ACCESS_TOKEN:
        raise MercadoPagoError("Configura MERCADOPAGO_ACCESS_TOKEN.")

    return {
        "Authorization": f"Bearer {settings.MERCADOPAGO_ACCESS_TOKEN}",
        "Content-Type": "application/json",
    }


def _request(method, path, **kwargs):
    try:
        response = requests.request(
            method,
            urljoin(API_BASE_URL, path),
            headers=_headers(),
            timeout=15,
            **kwargs,
        )
    except requests.RequestException as error:
        raise MercadoPagoError(
            "No se pudo conectar con Mercado Pago. Intenta nuevamente."
        ) from error

    if response.status_code >= 400:
        try:
            message = response.json().get("message")
        except ValueError:
            message = None
        raise MercadoPagoError(message or "Mercado Pago rechazó la solicitud.")
    return response.json()


def crear_checkout_plan(plan, suscripcion):
    payload = {
        "reason": f"{plan.nombre} - {suscripcion.usuario_principal.email}",
        "external_reference": str(suscripcion.id),
        "auto_recurring": {
            "frequency": 1,
            "frequency_type": "months",
            "transaction_amount": float(Decimal(plan.precio)),
            "currency_id": "MXN",
        },
        "back_url": obtener_url_retorno(),
    }
    return _request("POST", "/preapproval_plan", json=payload)


def obtener_url_retorno():
    if settings.BACKEND_URL:
        return (
            f"{settings.BACKEND_URL.rstrip('/')}"
            "/api/suscripciones/mercadopago/retorno/"
        )
    return f"{settings.FRONTEND_URL.rstrip('/')}/suscripcion"


def obtener_preaprobacion(preapproval_id):
    return _request("GET", f"/preapproval/{preapproval_id}")


def obtener_pago(payment_id):
    return _request("GET", f"/v1/payments/{payment_id}")


def verificar_firma_webhook(request):
    secret = settings.MERCADOPAGO_WEBHOOK_SECRET
    if not secret:
        return bool(settings.DEBUG)

    signature_header = request.headers.get("x-signature", "")
    request_id = request.headers.get("x-request-id", "")
    data_id = (
        request.query_params.get("data.id")
        or request.data.get("data", {}).get("id")
        or request.data.get("id")
    )

    partes = {}
    for item in signature_header.split(","):
        key, _, value = item.strip().partition("=")
        if key and value:
            partes[key] = value

    ts = partes.get("ts")
    expected = partes.get("v1")
    if not data_id or not request_id or not ts or not expected:
        return False

    manifest = f"id:{data_id};request-id:{request_id};ts:{ts};"
    digest = hmac.new(
        secret.encode(),
        msg=manifest.encode(),
        digestmod=hashlib.sha256,
    ).hexdigest()

    return hmac.compare_digest(digest, expected)
