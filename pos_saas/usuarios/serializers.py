from rest_framework import serializers
from .models import Usuario
from restaurantes.models import Restaurante, UsuarioRestaurante
from suscripciones.models import Plan, Suscripcion
from datetime import timedelta
from django.db import transaction
from django.utils import timezone



def crear_restaurante_para_usuario(user, restaurante_nombre):
    restaurante = Restaurante.objects.create(
        nombre=restaurante_nombre,
        propietario=user,
        direccion='',
        telefono='',
    )

    UsuarioRestaurante.objects.create(
        usuario=user,
        restaurante=restaurante,
        rol='admin',
    )

    plan = Plan.objects.filter(nombre='Basico').order_by('id').first()
    if not plan:
        plan = Plan.objects.create(
            nombre='Basico',
            precio='0.00',
            limite_usuarios=5,
            limite_sucursales=1,
            limi_cajas=1,
        )
    Suscripcion.objects.create(
        restaurante=restaurante,
        plan=plan,
        vence=timezone.localdate() + timedelta(days=15),
    )

    return restaurante


class RegistroSerializer(serializers.ModelSerializer):
    restaurante_nombre = serializers.CharField(write_only=True)

    class Meta:
        model = Usuario
        fields = ['email', 'password', 'nombre', 'restaurante_nombre']
        extra_kwargs = {
            'password': {'write_only': True},
            'email':{
                "error_messages": {
                    "unique": "Ya existe una cuenta con este correo electrónico."
                }
            }
        }

    @transaction.atomic
    def create(self, validated_data):
        restaurante_nombre = validated_data.pop('restaurante_nombre')
        password = validated_data.pop('password')
        email = validated_data.pop('email')
        nombre = validated_data.pop('nombre')
        
        user = Usuario.objects.create_user(
            email=email,
            nombre=nombre,
            password=password,
            **validated_data
        )

        crear_restaurante_para_usuario(user, restaurante_nombre)

        return user
    
    

        
