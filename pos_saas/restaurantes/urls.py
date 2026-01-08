from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RestauranteViewSet, UsuarioRestauranteViewSet

# Router para usuarios del restaurante
usuarios_router = DefaultRouter()
usuarios_router.register(r'', UsuarioRestauranteViewSet, basename='usuario-restaurante')

# Router para restaurantes
restaurante_router = DefaultRouter()
restaurante_router.register(r'', RestauranteViewSet, basename='restaurante')

urlpatterns = [
    path('usuarios/', include(usuarios_router.urls)),
    path('', include(restaurante_router.urls)),
]