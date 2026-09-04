from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AreaServicioViewSet, EstacionViewSet, RestauranteViewSet, UsuarioRestauranteViewSet, PermisoViewSet

# Router para usuarios del restaurante
usuarios_router = DefaultRouter()
usuarios_router.register(r'', UsuarioRestauranteViewSet, basename='usuario-restaurante')

# Router para restaurantes
restaurante_router = DefaultRouter()
restaurante_router.register(r'', RestauranteViewSet, basename='restaurante')

# Router para permisos
permisos_router = DefaultRouter()
permisos_router.register(r'', PermisoViewSet, basename='permiso')

estaciones_router = DefaultRouter()
estaciones_router.register(r'', EstacionViewSet, basename='estacion')

areas_router = DefaultRouter()
areas_router.register(r'', AreaServicioViewSet, basename='area-servicio')

urlpatterns = [
    path('usuarios/', include(usuarios_router.urls)),
    path('permisos/', include(permisos_router.urls)),
    path('estaciones/', include(estaciones_router.urls)),
    path('areas/', include(areas_router.urls)),
    path('', include(restaurante_router.urls)),
]
