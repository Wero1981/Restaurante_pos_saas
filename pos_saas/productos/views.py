from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from .models import Categoria, Producto
from .serializers import CategoriaSerializer, ProductoSerializer

class CategoriaViewSet(ModelViewSet):
    serializer_class = CategoriaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Categoria.objects.filter(restaurante=self.request.user.restaurante)
    
    def perform_create(self, serializer):
        serializer.save(restaurante=self.request.user.restaurante)

class ProductoViewSet(ModelViewSet):
    serializer_class = ProductoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Producto.objects.filter(restaurante=self.request.user.restaurante)
    
    def perform_create(self, serializer):
        serializer.save(restaurante=self.request.user.restaurante)