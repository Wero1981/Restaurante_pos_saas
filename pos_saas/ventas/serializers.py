from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field
from .models import Venta, VentaDetalle, Mesa, Comensal, PedidoDetalle, Pedido
from productos.models  import Producto
from caja.models import Caja
from django.utils import timezone
from decimal import Decimal
from core.restaurantes import get_restaurante_request



class VentaDetalleSerializer(serializers.ModelSerializer):
    class Meta:
        model = VentaDetalle
        fields = ['producto', 'cantidad', 'precio_unitario', 'subtotal', 'comensal']
        read_only_fields = ['subtotal']

class VentaSerializer(serializers.ModelSerializer):
    detalles = VentaDetalleSerializer(many=True)
    pedido = serializers.PrimaryKeyRelatedField(
        queryset=Pedido.objects.all(), 
        required=False, 
        allow_null=True
    )
    caja = serializers.PrimaryKeyRelatedField(queryset=Caja.objects.all())
    pedido_detalles_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        write_only=True
    )

    class Meta:
        model = Venta
        fields = ['id', 'total', 'metodo_pago', 'detalles', 'pedido', 'caja', 'pedido_detalles_ids', 'created_at']
        read_only_fields = ['id', 'created_at']

    def create(self, validated_data):
        detalles = validated_data.pop('detalles', [])
        pedido = validated_data.pop('pedido', None)
        pedido_detalles_ids = validated_data.pop('pedido_detalles_ids', [])
        total = validated_data.pop('total', Decimal('0.00'))
        caja = validated_data.pop('caja')
        request = self.context['request']
        restaurante = get_restaurante_request(request)

        if not restaurante or caja.restaurante_id != restaurante.id:
            raise serializers.ValidationError('La caja no pertenece al restaurante activo.')
        if not caja.abierta:
            raise serializers.ValidationError('La caja seleccionada está cerrada.')

        venta = Venta.objects.create(
            usuario=request.user,
            restaurante=restaurante,
            pedido=pedido,
            caja=caja,
            estado='pagada',
            metodo_pago=validated_data.get('metodo_pago'),
            total=total
        )

        total_generado = Decimal('0.00')

        if pedido:
            # Validar que el pedido pertenece al restaurante
            if pedido.restaurante != restaurante:
                raise serializers.ValidationError('El pedido no pertenece a este restaurante.')

            if pedido_detalles_ids:
                detalles_queryset = list(
                    PedidoDetalle.objects.select_related('producto', 'comensal').filter(
                        id__in=pedido_detalles_ids,
                        pedido=pedido,
                        cancelado=False,
                        pagado=False
                    )
                )

                if len(detalles_queryset) != len(set(pedido_detalles_ids)):
                    raise serializers.ValidationError('Algunos productos seleccionados no están disponibles para cobro.')
            else:
                detalles_queryset = list(
                    pedido.items.select_related('producto', 'comensal').filter(cancelado=False, pagado=False)
                )

            if not detalles_queryset:
                raise serializers.ValidationError('El pedido no tiene productos pendientes por cobrar.')

            for detalle in detalles_queryset:
                producto = detalle.producto

                if producto.restaurante != restaurante:
                    raise serializers.ValidationError('Producto inválido para este restaurante.')

                cantidad = Decimal(str(detalle.cantidad))

                if producto.stock != -1:
                    if producto.stock < cantidad:
                        raise serializers.ValidationError(
                            f"Stock insuficiente para {producto.nombre}. Disponible: {producto.stock}"
                        )
                    producto.stock -= cantidad
                    producto.save()

                subtotal = Decimal(str(detalle.subtotal))
                total_generado += subtotal

                VentaDetalle.objects.create(
                    venta=venta,
                    producto=producto,
                    cantidad=cantidad,
                    precio_unitario=detalle.precio_unitario,
                    subtotal=subtotal,
                    comensal=detalle.comensal
                )

                detalle.pagado = True
                detalle.pagado_en = timezone.now()
                detalle.venta = venta
                detalle.save(update_fields=['pagado', 'pagado_en', 'venta'])

            # Actualizar total calculado por servidor
            venta.total = total_generado
            venta.save(update_fields=['total'])

            pendientes = pedido.items.filter(cancelado=False, pagado=False).exists()

            if not pendientes:
                pedido.estado = 'cerrado'
                pedido.save(update_fields=['estado'])

                if pedido.mesa:
                    pedido.mesa.estado = 'disponible'
                    pedido.mesa.save(update_fields=['estado'])

                    Comensal.objects.filter(mesa=pedido.mesa).delete()
        else:
            if not detalles:
                raise serializers.ValidationError('Debes proporcionar detalles de la venta.')

            for d in detalles:
                producto = Producto.objects.get(
                    id=d['producto'].id,
                    restaurante=restaurante
                )

                cantidad = Decimal(str(d['cantidad']))

                if producto.stock != -1:
                    if producto.stock < cantidad:
                        raise serializers.ValidationError(
                            f"Stock insuficiente para {producto.nombre}. Disponible: {producto.stock}"
                        )
                    producto.stock -= cantidad
                    producto.save()

                subtotal = cantidad * Decimal(str(d['precio_unitario']))
                total_generado += subtotal

                VentaDetalle.objects.create(
                    venta=venta,
                    producto=producto,
                    cantidad=cantidad,
                    precio_unitario=d['precio_unitario'],
                    subtotal=subtotal
                )

            venta.total = total_generado if total_generado else total
            venta.save(update_fields=['total'])

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
        
        # Solo validar nombre en creación (POST), no en actualización (PATCH/PUT)
        if not self.instance:
            # Asegurarse de que al menos uno esté presente al crear
            if 'nombre' not in attrs or not attrs['nombre']:
                raise serializers.ValidationError({
                    'numero': 'Este campo es requerido.'
                })
        
        return attrs
    
class ComensalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comensal
        fields = ['id', 'mesa', 'nombre', 'creado']

class PedidoDetalleSerializer(serializers.ModelSerializer):
    producto = serializers.SerializerMethodField()
    comensal = ComensalSerializer(read_only=True)
    
    class Meta:
        model = PedidoDetalle
        fields = ['id',
            'pedido',
            'producto',
            'comensal',
            'cantidad',
            'precio_unitario',
            'subtotal',
            'observaciones',
            'enviado_cocina',
            'cancelado',
            'pagado',
            'fecha']
    
    @extend_schema_field({
        'type': 'object',
        'properties': {
            'id': {'type': 'integer'},
            'nombre': {'type': 'string'},
            'descripcion': {'type': 'string'},
            'precio': {'type': 'number', 'format': 'float'}
        }
    })
    def get_producto(self, obj):
        return {
            'id': obj.producto.id,
            'nombre': obj.producto.nombre,
            'descripcion': obj.producto.descripcion,
            'precio': float(obj.producto.precio)
        }
        
class PedidoSerializer(serializers.ModelSerializer):
    comensales = ComensalSerializer(many=True, read_only=True)
    detalles = serializers.SerializerMethodField()
    total = serializers.SerializerMethodField()
    total_pagado = serializers.SerializerMethodField()

    class Meta:
        model = Pedido
        fields = [
            'id',
            'restaurante',
            'mesa',
            'estado',
            'total',
            'total_pagado',
            'creado',
            'comensales',
            'detalles'
        ]
        read_only_fields = ['restaurante']

    def validate_mesa(self, mesa):
        request = self.context.get('request')
        restaurante = (
            get_restaurante_request(request)
            if request
            else getattr(self.instance, 'restaurante', None)
        )
        if mesa and restaurante and mesa.restaurante_id != restaurante.id:
            raise serializers.ValidationError(
                'La mesa pertenece a otro restaurante.'
            )
        return mesa
    
    def get_total(self, obj):
        pendientes = obj.items.filter(cancelado=False, pagado=False)
        return sum(item.subtotal for item in pendientes)

    def get_total_pagado(self, obj):
        pagados = obj.items.filter(cancelado=False, pagado=True)
        return sum(item.subtotal for item in pagados)

    def get_detalles(self, obj):
        detalles = obj.items.filter(cancelado=False, pagado=False).select_related('producto', 'comensal')
        serializer = PedidoDetalleSerializer(detalles, many=True)
        return serializer.data
