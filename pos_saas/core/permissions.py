from rest_framework.permissions import BasePermission
from restaurantes.models import UsuarioRestaurante

class EsAdmin(BasePermission):
    def has_permission(self, request, view):
        rel = UsuarioRestaurante.objects.filter(
            usuario=request.user,
            restaurante=request.restaurante
        ).first()
        return rel and rel.rol == 'admin'
