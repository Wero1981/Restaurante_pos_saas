from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RestauranteViewSet, UsuarioRestauranteViewSet, PermisoViewSet

# Router para usuarios del restaurante
usuarios_router = DefaultRouter()
usuarios_router.register(r'', UsuarioRestauranteViewSet, basename='usuario-restaurante')

# Router para restaurantes
restaurante_router = DefaultRouter()
restaurante_router.register(r'', RestauranteViewSet, basename='restaurante')

# Router para permisos
permisos_router = DefaultRouter()
permisos_router.register(r'', PermisoViewSet, basename='permiso')

urlpatterns = [
    path('usuarios/', include(usuarios_router.urls)),
    path('permisos/', include(permisos_router.urls)),
    path('', include(restaurante_router.urls)),
]