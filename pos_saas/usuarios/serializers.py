from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
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
        es_matriz=True,
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
            limite_cajas=1,
        )
    Suscripcion.objects.create(
        usuario_principal=user,
        plan=plan,
        vence=timezone.localdate() + timedelta(days=7),
        estado_pago=Suscripcion.ESTADO_TRIAL,
    )

    return restaurante


class RegistroSerializer(serializers.ModelSerializer):
    restaurante_nombre = serializers.CharField(write_only=True)

    class Meta:
        model = Usuario
        fields = [
            'email',
            'password',
            'nombre',
            'apellidoP',
            'apellidoM',
            'restaurante_nombre',
        ]
        extra_kwargs = {
            'password': {'write_only': True},
            'nombre': {'required': False, 'allow_blank': True},
            'apellidoP': {'required': False, 'allow_blank': True},
            'apellidoM': {'required': False, 'allow_blank': True},
            'email':{
                "error_messages": {
                    "unique": "Ya existe una cuenta con este correo electrónico."
                }
            }
        }

    def validate(self, attrs):
        password = attrs.get('password', '')
        errores = []

        reglas = [
            (len(password) >= 10, 'La contraseña debe tener al menos 10 caracteres.'),
            (any(char.islower() for char in password), 'La contraseña debe incluir una letra minúscula.'),
            (any(char.isupper() for char in password), 'La contraseña debe incluir una letra mayúscula.'),
            (any(char.isdigit() for char in password), 'La contraseña debe incluir un número.'),
            (any(not char.isalnum() for char in password), 'La contraseña debe incluir un símbolo.'),
        ]

        errores.extend(mensaje for cumple, mensaje in reglas if not cumple)

        user = Usuario(
            email=attrs.get('email', '').strip().lower(),
            username=attrs.get('email', '').strip().lower(),
            nombre=attrs.get('nombre', '').strip(),
            apellidoP=attrs.get('apellidoP', '').strip(),
            apellidoM=attrs.get('apellidoM', '').strip(),
        )

        try:
            validate_password(password, user=user)
        except DjangoValidationError as error:
            errores.extend(error.messages)

        if errores:
            raise serializers.ValidationError({'password': errores})

        return attrs

    @transaction.atomic
    def create(self, validated_data):
        restaurante_nombre = validated_data.pop('restaurante_nombre').strip()
        password = validated_data.pop('password')
        email = validated_data.pop('email').strip().lower()
        nombre = validated_data.pop('nombre', '').strip() or email.split('@')[0]
        validated_data['apellidoP'] = validated_data.get('apellidoP', '').strip()
        validated_data['apellidoM'] = validated_data.get('apellidoM', '').strip()
        
        user = Usuario.objects.create_user(
            email=email,
            nombre=nombre,
            password=password,
            **validated_data
        )

        crear_restaurante_para_usuario(user, restaurante_nombre)

        return user
    
    

        
