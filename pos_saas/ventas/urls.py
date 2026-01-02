from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VentaViewSet, MesaViewSet
router = DefaultRouter()
router.register(r'ventas', VentaViewSet, basename='venta')
router.register(r'mesas', MesaViewSet, basename='mesa')

urlpatterns = [
    path('', include(router.urls)),
]