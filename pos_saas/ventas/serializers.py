from rest_framework import serializers
from .models import Venta, VentaDetalle, Mesa
from productos.models  import Producto
from restaurantes.models import UsuarioRestaurante, Restaurante



def get_restaurante_usuario(user):
    """Obtiene el restaurante asociado al usuario autenticado."""
    if not user.is_authenticated:
        return None
    rel = UsuarioRestaurante.objects.filter(usuario=user, activo=True).first()
    return rel.restaurante if rel else None


class VentaDetalleSerializer(serializers.ModelSerializer):
    class Meta:
        model = VentaDetalle
        fields = ['producto', 'cantidad', 'precio_unitario']

class VentaSerializer(serializers.ModelSerializer):
    detalles = VentaDetalleSerializer(many=True)

    class Meta:
        model = Venta
        fields = ['total', 'metodo_pago', 'detalles']

    def create(self, validated_data):
        detalles = validated_data.pop('detalles')
        request = self.context['request']
        restaurante = get_restaurante_usuario(request.user)

        venta = Venta.objects.create(
            usuario=request.user,
            restaurante=restaurante,
            **validated_data
        )

        for d in detalles:
            producto = Producto.objects.get(
                id=d['producto'].id,
                restaurante=restaurante
            )
            producto.stock -= d['cantidad']
            producto.save()

            VentaDetalle.objects.create(
                venta=venta,
                producto=producto,
                cantidad=d['cantidad'],
                precio_unitario=d['precio_unitario']
            )

        return venta

    
class MesaSerializer(serializers.ModelSerializer):
    numero = serializers.CharField(source='nombre', required=False, allow_blank=True)
    nombre = serializers.CharField(required=False, allow_blank=True)
    
    class Meta:
        model = Mesa
        fields = ['id', 'numero', 'nombre', 'capacidad', 'estado', 'activa', 'restaurante']
        read_only_fields = ['id', 'restaurante']
    
    def validate(self, attrs):
        # Si se envía 'numero', usarlo como 'nombre'
        if 'nombre' in attrs and not attrs['nombre']:
            attrs.pop('nombre', None)
        
        # Asegurarse de que al menos uno esté presente
        if 'nombre' not in attrs or not attrs['nombre']:
            raise serializers.ValidationError({
                'numero': 'Este campo es requerido.'
            })
        
        return attrs