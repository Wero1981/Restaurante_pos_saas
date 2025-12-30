from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter
from drf_spectacular.types import OpenApiTypes
from .models import Restaurante
from .serializer import RestauranteSerializer

@extend_schema_view(
    retrieve=extend_schema(
        description="Obtiene la información del restaurante asociado al usuario autenticado.",
        parameters=[
            OpenApiParameter(
                name='id',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.PATH,
                description='ID del restaurante'
            )
        ]
    ),
    update=extend_schema(
        description="Actualiza la información del restaurante asociado al usuario autenticado.",
        parameters=[
            OpenApiParameter(
                name='id',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.PATH,
                description='ID del restaurante'
            )
        ]
    ),
    partial_update=extend_schema(
        description="Actualiza parcialmente la información del restaurante asociado al usuario autenticado.",
        parameters=[
            OpenApiParameter(
                name='id',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.PATH,
                description='ID del restaurante'
            )
        ]
    )

)
class RestauranteViewSet(viewsets.ModelViewSet):
    serializer_class = RestauranteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Obtiene el restaurante asociado al usuario autenticado."""
        return Restaurante.objects.filter(propietario=self.request.user)
    
    @extend_schema(summary="Completar datos del restaurante asociado al usuario autenticado.")
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)
    
    @extend_schema(
        summary="Actualizar información del restaurante del usuario autenticado",
        description="Actualiza los datos del restaurante asociado al usuario sin necesidad de especificar el ID",
        request=RestauranteSerializer,
        responses={200: RestauranteSerializer}
    )
    @action(detail=False, methods=['post', 'put', 'patch'], url_path='mi-restaurante')
    def actualizar_mi_restaurante(self, request):
        """Actualiza el restaurante del usuario autenticado sin necesidad de ID"""
        try:
            restaurante = Restaurante.objects.get(propietario=request.user)
            serializer = self.get_serializer(restaurante, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
        except Restaurante.DoesNotExist:
            return Response(
                {"error": "No se encontró un restaurante asociado a este usuario"},
                status=status.HTTP_404_NOT_FOUND
            )