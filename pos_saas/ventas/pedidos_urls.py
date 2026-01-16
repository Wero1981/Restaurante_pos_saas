from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PedidoViewSet,
    AbrirPedidoView,
    CancelarPedidoView,
    AgregarProductoView, 
    EnviarCocinaView,
    EliminarDetalleView,
    CancelarDetalleView
)

router = DefaultRouter()
router.register(r'', PedidoViewSet, basename='pedido')

urlpatterns = [
    path('abrir/', AbrirPedidoView.as_view(), name='abrir-pedido'),
    path('cancelar/', CancelarPedidoView.as_view(), name='cancelar-pedido'),
    path('agregar-producto/', AgregarProductoView.as_view(), name='agregar-producto'),
    path('enviar-cocina/', EnviarCocinaView.as_view(), name='enviar-cocina'),
    path('detalle/<int:detalle_id>/', EliminarDetalleView.as_view(), name='eliminar-detalle'),
    path('detalle/<int:detalle_id>/cancelar/', CancelarDetalleView.as_view(), name='cancelar-detalle'),
    path('', include(router.urls)),
]
