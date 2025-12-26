from rest_framework import serializers
from .models import Usuario
from restaurantes.models import Restaurante, UsuarioRestaurante
from suscripciones.models import Plan, Suscripcion
from datetime import date, timedelta

class RegistroSerializer(serializers.ModelSerializer):
    restaurante_nombre = serializers.CharField(write_only=True)

    class Meta:
        model = Usuario
        fields = ['username', 'email', 'password', 'restaurante_nombre']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        restaurante_nombre = validated_data.pop('restaurante_nombre')
        user = Usuario.objects.create_user(**validated_data)

        restaurante = Restaurante.objects.create(nombre = restaurante_nombre)

        UsuarioRestaurante.objects.create(
            usuario=user,
            restaurante=restaurante,
            rol='admin'
        )

        plan = Plan.objects.get(nombre='Basico')
        Suscripcion.objects.create(
            restaurante=restaurante,
            plan=plan,
            vence = date.today() + timedelta(days=15)
        )

        return user
    
    

        
