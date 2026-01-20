from django.urls import path

from .views import ConfiguracionesActivasView, ImprimirVentaView

urlpatterns = [
    path("ventas/imprimir/", ImprimirVentaView.as_view(), name="impresion-venta"),
    path("configuraciones/activas/", ConfiguracionesActivasView.as_view(), name="impresion-configuraciones-activas"),
]
