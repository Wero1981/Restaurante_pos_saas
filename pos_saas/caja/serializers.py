from rest_framework import serializers
from .models import Caja

class CajaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Caja
        fields = '__all__'
        read_only_fields = ['restaurant', 'fecha_apertura', 'fecha_cierre']

