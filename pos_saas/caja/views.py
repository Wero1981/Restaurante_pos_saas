from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from django.utils.timezone import now
from .serializers import CajaSerializer
from .models import Caja
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter, OpenApiTypes
@extend_schema_view(
    list=extend_schema(
        description="Obtiene la lista de cajas abiertas para un restaurante específico.",
        parameters=[
            OpenApiParameter(
                name='restaurante',
                type=OpenApiTypes.INT,
                description='ID del restaurante para filtrar las cajas abiertas.',
                required=True,
            ),
        ]
    ),

    retrieve=extend_schema(
        description="Obtiene la información de una caja específica.",
        parameters=[
            OpenApiParameter(
                name='id',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.PATH,
                description='ID de la caja'
            )
        ]
    ),
    create=extend_schema(
        description="Crea una nueva caja para un restaurante."
    ),
    update=extend_schema(
        description="Actualiza la información de una caja específica.",
        parameters=[
            OpenApiParameter(
                name='id',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.PATH,
                description='ID de la caja'
            )
        ]
    ),
    partial_update=extend_schema(
        description="Actualiza parcialmente la información de una caja específica.",
        parameters=[
            OpenApiParameter(
                name='id',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.PATH,
                description='ID de la caja'
            )
        ]
    ),
)

class CajaViewSet(ModelViewSet):
    serializer_class = CajaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        restaurante_id = self.request.query_params.get('restaurante')
        return Caja.objects.filter(
            restaurante_id=restaurante_id,
            abierta=True
        )