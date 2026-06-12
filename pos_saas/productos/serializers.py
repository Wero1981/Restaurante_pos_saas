from rest_framework import serializers
from .models import Categoria, Producto
from core.restaurantes import get_restaurante_request
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
        subcategorias = obj.subcategorias.filter(restaurante=obj.restaurante)
        return CategoriaSerializer(subcategorias, many=True).data

    def validate_parent(self, parent):
        request = self.context.get('request')
        restaurante = (
            get_restaurante_request(request)
            if request
            else getattr(self.instance, 'restaurante', None)
        )
        if parent and restaurante and parent.restaurante_id != restaurante.id:
            raise serializers.ValidationError(
                'La categoría padre pertenece a otro restaurante.'
            )
        return parent
    
class ProductoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Producto
        fields = '__all__'
        read_only_fields = ['restaurante']

    def validate_categoria(self, categoria):
        request = self.context.get('request')
        restaurante = (
            get_restaurante_request(request)
            if request
            else getattr(self.instance, 'restaurante', None)
        )
        if categoria and restaurante and categoria.restaurante_id != restaurante.id:
            raise serializers.ValidationError(
                'La categoría pertenece a otro restaurante.'
            )
        return categoria
