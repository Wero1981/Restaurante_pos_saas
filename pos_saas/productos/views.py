from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Categoria, Producto
from .serializers import CategoriaSerializer, ProductoSerializer
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter, OpenApiTypes
@extend_schema_view(
    list=extend_schema(
        description="Obtiene la lista de categorías o productos del restaurante asociado al usuario autenticado.",
        parameters=[
            OpenApiParameter(
                name='parent_only',
                type=OpenApiTypes.BOOL,
                description='Filtra solo las categorías principales (sin padre).',
            ),
        ]
    ),
    retrieve=extend_schema(
        description="Obtiene la información de una categoría o producto específico del restaurante asociado al usuario autenticado.",
        parameters=[
            OpenApiParameter(
                name='id',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.PATH,
                description='ID de la categoría'
            )
        ]
    ),
    create=extend_schema(
        description="Crea una nueva categoría o producto para el restaurante asociado al usuario autenticado."
    ),
    update=extend_schema(
        description="Actualiza la información de una categoría o producto específico del restaurante asociado al usuario autenticado.",
        parameters=[
            OpenApiParameter(
                name='id',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.PATH,
                description='ID de la categoría'
            )
        ]
    ),
    partial_update=extend_schema(
        description="Actualiza parcialmente la información de una categoría o producto específico del restaurante asociado al usuario autenticado.",
        parameters=[
            OpenApiParameter(
                name='id',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.PATH,
                description='ID de la categoría'
            )
        ]
    ),
    destroy=extend_schema(
        description="Elimina una categoría o producto específico del restaurante asociado al usuario autenticado.",
        parameters=[
            OpenApiParameter(
                name='id',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.PATH,
                description='ID de la categoría'
            )
        ]
    ),
)

class CategoriaViewSet(ModelViewSet):
    serializer_class = CategoriaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Categoria.objects.filter(
            restaurante=self.request.user.restaurante).prefetch_related('subcategorias')
        
        parent_only = self.request.query_params.get('parent_only')
        if parent_only == 'true':
            queryset = queryset.filter(parent__isnull=True)
        
        return queryset
        
    def perform_create(self, serializer):
        serializer.save(restaurante=self.request.user.restaurante)

@extend_schema_view(
    retrieve=extend_schema(
        description="Obtiene la información de un producto específico.",
        parameters=[
            OpenApiParameter(
                name='id',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.PATH,
                description='ID del producto'
            )
        ]
    ),
    update=extend_schema(
        description="Actualiza la información de un producto específico.",
        parameters=[
            OpenApiParameter(
                name='id',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.PATH,
                description='ID del producto'
            )
        ]
    ),
    partial_update=extend_schema(
        description="Actualiza parcialmente la información de un producto específico.",
        parameters=[
            OpenApiParameter(
                name='id',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.PATH,
                description='ID del producto'
            )
        ]
    ),
    destroy=extend_schema(
        description="Elimina un producto específico.",
        parameters=[
            OpenApiParameter(
                name='id',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.PATH,
                description='ID del producto'
            )
        ]
    ),
)
class ProductoViewSet(ModelViewSet):
    serializer_class = ProductoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Producto.objects.filter(
            restaurante=self.request.user.restaurante).select_related('categoria')
    
    def perform_create(self, serializer):
        serializer.save(restaurante=self.request.user.restaurante)

    @extend_schema(
        description="Obtiene los productos de una categoría específica.",
        parameters=[
            OpenApiParameter(
                name='categoria_id',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.PATH,
                description='ID de la categoría'
            )
        ]
    )
    @action(detail=False, methods=['get'], url_path='por-categoria/(?P<categoria_id>[^/.]+)')
    def productos_por_categoria(self, request, categoria_id=None):
        """Obtiene los productos de una categoría específica."""
        productos = Producto.objects.filter(
            restaurante=request.user.restaurante,
            categoria_id=categoria_id
        )
        serializer = self.get_serializer(productos, many=True)
        return Response(serializer.data)