from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import ValidationError
from .models import Venta, Mesa
from .serializers import VentaSerializer, MesaSerializer
from restaurantes.models import UsuarioRestaurante
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter, OpenApiTypes


def get_restaurante_usuario(user):
    """Obtiene el restaurante asociado al usuario autenticado."""
    if not user.is_authenticated:
        return None
    rel = UsuarioRestaurante.objects.filter(usuario=user, activo=True).first()
    return rel.restaurante if rel else None


class VentaViewSet(ModelViewSet):
    serializer_class = VentaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        restaurante = get_restaurante_usuario(self.request.user)
        if not restaurante:
            return Venta.objects.none()
        return Venta.objects.filter(restaurante=restaurante)

@extend_schema_view(
    retrieve=extend_schema(
        description="Obtiene la información de una mesa específica.",
        parameters=[
            OpenApiParameter(
                name='id',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.PATH,
                description='ID de la mesa'
            )
        ]
    ),
    update=extend_schema(
        description="Actualiza la información de una mesa específica.",
        parameters=[
            OpenApiParameter(
                name='id',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.PATH,
                description='ID de la mesa'
            )
        ]
    ),
    destroy=extend_schema(
        description="Elimina la información de una mesa específica.",
        parameters=[
            OpenApiParameter(
                name='id',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.PATH,
                description='ID de la mesa'
            )
        ]
    )
)
class MesaViewSet(ModelViewSet):
    serializer_class = MesaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Obtiene las mesas del restaurante asociado al usuario autenticado."""
        restaurante = get_restaurante_usuario(self.request.user)
        if not restaurante:
            return Mesa.objects.none()
        return Mesa.objects.filter(restaurante=restaurante, activa=True)
    
    def perform_create(self, serializer):
        """Asigna el restaurante al crear una mesa."""
        restaurante = get_restaurante_usuario(self.request.user)
        if not restaurante:
            raise ValidationError('Usuario no está asociado a ningún restaurante')
        serializer.save(restaurante=restaurante)
    
