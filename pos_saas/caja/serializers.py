from rest_framework import serializers
from .models import Caja, MovimientoCaja

class CajaSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.CharField(source='usuario.nombre', read_only=True)

    class Meta:
        model = Caja
        fields = ['id', 'restaurante', 'usuario', 'monto_inicial', 'monto_final', 
                  'fecha_apertura', 'fecha_cierre', 'abierta', 'total_ventas',
                  'total_efectivo', 'total_tarjeta', 'total_otros',
                  'total_movimientos_entrada', 'total_movimientos_salida',
                  'cierre_automatico', 'usuario_nombre']
        read_only_fields = ['id', 'fecha_apertura', 'total_ventas', 'total_efectivo',
                            'total_tarjeta', 'total_otros', 'total_movimientos_entrada',
                            'total_movimientos_salida', 'cierre_automatico',
                            'restaurante', 'usuario']


class MovimientoCajaSerializer(serializers.ModelSerializer):
    class Meta:
        model = MovimientoCaja
        fields = ['id', 'caja', 'tipo', 'monto', 'descripcion', 'fecha']
        read_only_fields = ['id', 'fecha']
