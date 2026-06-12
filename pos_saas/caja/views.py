from rest_framework import status
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from .serializers import CajaSerializer, MovimientoCajaSerializer
from .models import Caja, MovimientoCaja
from .services import obtener_resumen_caja
from core.restaurantes import get_restaurante_request
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
        restaurante = get_restaurante_request(self.request)
        if not restaurante:
            return Caja.objects.none()

        queryset = Caja.objects.filter(restaurante=restaurante)
        if getattr(self, 'action', None) == 'list':
            return queryset.filter(abierta=True).order_by('-fecha_apertura')
        return queryset.order_by('-fecha_apertura')

    def perform_create(self, serializer):
        restaurante = get_restaurante_request(self.request)
        if not restaurante:
            raise ValidationError('Selecciona un restaurante válido antes de abrir la caja.')
        if Caja.objects.filter(restaurante=restaurante, abierta=True).exists():
            raise ValidationError('Ya existe una caja abierta para este restaurante.')
        serializer.save(
            restaurante=restaurante,
            usuario=self.request.user,
        )

    @action(detail=True, methods=['get'], url_path='resumen')
    def resumen(self, request, pk=None):
        caja = self.get_object()
        resumen = obtener_resumen_caja(caja)
        return Response(resumen)

    @action(detail=True, methods=['post'], url_path='cerrar')
    def cerrar(self, request, pk=None):
        caja = self.get_object()
        if not caja.abierta:
            return Response({'detail': 'La caja ya se encuentra cerrada.'}, status=status.HTTP_400_BAD_REQUEST)

        resumen = obtener_resumen_caja(caja)
        caja.registrar_cierre(resumen, cierre_automatico=request.data.get('automatico', False))
        return Response(resumen, status=status.HTTP_200_OK)


class MovimientoCajaViewSet(ModelViewSet):
    serializer_class = MovimientoCajaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        restaurante = get_restaurante_request(self.request)
        if not restaurante:
            return MovimientoCaja.objects.none()

        caja_id = self.request.query_params.get('caja')
        queryset = MovimientoCaja.objects.filter(
            caja__restaurante=restaurante,
        )
        if caja_id:
            queryset = queryset.filter(caja_id=caja_id)
        return queryset.order_by('-fecha')

    def perform_create(self, serializer):
        caja = serializer.validated_data['caja']
        restaurante = get_restaurante_request(self.request)
        if not restaurante or caja.restaurante_id != restaurante.id:
            raise ValidationError('La caja no pertenece al restaurante activo.')
        if not caja.abierta:
            raise ValidationError('No se pueden registrar movimientos en una caja cerrada.')
        serializer.save()
