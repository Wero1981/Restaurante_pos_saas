from rest_framework import serializers
from .models import Caja

class CajaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Caja
        fields = ['id', 'restaurante', 'usuario', 'monto_inicial', 'monto_final', 
                  'fecha_apertura', 'fecha_cierre', 'abierta']
        read_only_fields = ['id', 'fecha_apertura']

