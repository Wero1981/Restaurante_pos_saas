from rest_framework import serializers
from .models import Venta, VentaDetalle
from productos.models  import Producto


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

        venta = Venta.objects.create(
            usuario=request.user,
            restaurante=request.user.restaurante,
            **validated_data
        )

        for d in detalles:
            producto = Producto.objects.get(
                id=d['producto'].id,
                restaurante=request.restaurante
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