from django.urls import path

from .views import PlanesView, SeleccionarPlanView, SuscripcionActualView


urlpatterns = [
    path("planes/", PlanesView.as_view(), name="planes"),
    path("actual/", SuscripcionActualView.as_view(), name="suscripcion-actual"),
    path("seleccionar-plan/", SeleccionarPlanView.as_view(), name="seleccionar-plan"),
]
