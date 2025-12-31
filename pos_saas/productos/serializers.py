from rest_framework import serializers
from .models import Categoria, Producto
from drf_spectacular.utils import extend_schema_field
from typing import List, Dict, Any

class CategoriaSerializer(serializers.ModelSerializer):
    """Serializer para la categoría de productos."""
    subcategorias = serializers.SerializerMethodField()
    class Meta:
        model = Categoria
        fields = ['id', 'restaurante', 'nombre', 'parent', 'subcategorias']
        read_only_fields = ['restaurante']

    @extend_schema_field(serializers.ListField(child=serializers.DictField()))
    def get_subcategorias(self, obj) -> List[Dict[str, Any]]:
        return CategoriaSerializer(obj.subcategorias, many=True).data
    
class ProductoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Producto
        fields = '__all__'
        read_only_fields = ['restaurante']
        