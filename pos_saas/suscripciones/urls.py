from django.urls import path

from .views import (
    CrearSuscripcionMercadoPagoView,
    MercadoPagoRetornoView,
    MercadoPagoWebhookView,
    PlanesView,
    SeleccionarPlanView,
    SuscripcionActualView,
    UsoSuscripcionView,
)


urlpatterns = [
    path("planes/", PlanesView.as_view(), name="planes"),
    path("actual/", SuscripcionActualView.as_view(), name="suscripcion-actual"),
    path("uso/", UsoSuscripcionView.as_view(), name="suscripcion-uso"),
    path("seleccionar-plan/", SeleccionarPlanView.as_view(), name="seleccionar-plan"),
    path("mercadopago/crear/", CrearSuscripcionMercadoPagoView.as_view(), name="mercadopago-crear"),
    path("mercadopago/retorno/", MercadoPagoRetornoView.as_view(), name="mercadopago-retorno"),
    path("mercadopago/webhook/", MercadoPagoWebhookView.as_view(), name="mercadopago-webhook"),
]
