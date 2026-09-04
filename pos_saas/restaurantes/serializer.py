from rest_framework import serializers
from .models import AreaServicio, Estacion, Restaurante, UsuarioRestaurante, Permiso
from configuraciones.models import Configuracion
from configuraciones.serializer import ConfiguracionSerializer
from core.restaurantes import get_restaurante_request


class PermisoSerializer(serializers.ModelSerializer):
    """Serializer para permisos."""
    class Meta:
        model = Permiso
        fields = ['id', 'codigo', 'descripcion']


class EstacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Estacion
        fields = ['id', 'nombre', 'descripcion', 'activa', 'orden']
        read_only_fields = ['id']


class AreaServicioSerializer(serializers.ModelSerializer):
    mesas_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = AreaServicio
        fields = ['id', 'nombre', 'descripcion', 'activa', 'orden', 'mesas_count']
        read_only_fields = ['id', 'mesas_count']

    def validate_nombre(self, nombre):
        nombre = nombre.strip()
        if not nombre:
            raise serializers.ValidationError('El nombre del área es obligatorio.')
        return nombre

    def validate(self, attrs):
        restaurante = getattr(self.instance, 'restaurante', None)
        if restaurante is None:
            restaurante = get_restaurante_request(self.context.get('request'))
        nombre = attrs.get('nombre', getattr(self.instance, 'nombre', ''))
        if restaurante and AreaServicio.objects.filter(
            restaurante=restaurante,
            nombre__iexact=nombre,
        ).exclude(pk=getattr(self.instance, 'pk', None)).exists():
            raise serializers.ValidationError({
                'nombre': 'Ya existe un área con este nombre.'
            })
        return attrs

class RestauranteSerializer(serializers.ModelSerializer):

    configuracion = ConfiguracionSerializer(source='configuracion_set.first', read_only=True)
   
    #Enviar los datos de configuracion junto con el restaurante
    tipo_moneda = serializers.CharField(write_only=True, required=False)
    descripcion = serializers.CharField(write_only=True, required=False)
    logo = serializers.ImageField(write_only=True, required=False)

    class Meta:
        model = Restaurante
        fields = [
            'id', 'nombre', 'direccion', 'slug', 'telefono', 'ciudad', 'estado', 'email', 'sitio_web',
            'propietario', 'activo', 'created_at', 'configuracion',
            'tipo_moneda', 'descripcion', 'logo', 'es_matriz'
        ]
        read_only_fields = [
            'id', 'propietario', 'activo', 'es_matriz',
            'created_at', 'configuracion'
        ]

    def create(self, validated_data):
        config_data = {
            'tipo_moneda': validated_data.pop('tipo_moneda', None),
            'descripcion': validated_data.pop('descripcion', None),
            'logo': validated_data.pop('logo', None),
        }
        restaurante = Restaurante.objects.create(**validated_data)
        if any(value is not None for value in config_data.values()):
            Configuracion.objects.create(
                restaurante=restaurante,
                **{key: value for key, value in config_data.items() if value is not None},
            )
        return restaurante

    def update(self, instance, validated_data):
        # Extraer los datos de configuración si existen
        config_data = {
            'tipo_moneda': validated_data.pop('tipo_moneda', None),
            'descripcion': validated_data.pop('descripcion', None),
            'logo': validated_data.pop('logo', None),
        }

        # Actualizar los campos del restaurante
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Actualizar o crear la configuración asociada
        if any(value is not None for value in config_data.values()):
            Configuracion.objects.update_or_create(
                restaurante=instance,
                defaults={k: v for k, v in config_data.items() if v is not None}
            )

        return instance
    

class UsuarioRestauranteSerializer(serializers.ModelSerializer):
    """Serializer para usuarios del restaurante con información completa del usuario."""
    email = serializers.EmailField(source='usuario.email', read_only=True)
    nombre = serializers.CharField(source='usuario.nombre', read_only=True)
    apellido = serializers.CharField(source='usuario.apellidoP', read_only=True)
    permisos_detalle = PermisoSerializer(source='permisos', many=True, read_only=True)
    permisos_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Permiso.objects.all(),
        source='permisos',
        write_only=True,
        required=False
    )
    estaciones_detalle = EstacionSerializer(source='estaciones', many=True, read_only=True)
    estaciones_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Estacion.objects.all(),
        source='estaciones',
        write_only=True,
        required=False,
    )
    
    class Meta:
        model = UsuarioRestaurante
        fields = [
            'id',
            'usuario',
            'email',
            'nombre',
            'apellido',
            'rol',
            'permisos_detalle',
            'permisos_ids',
            'estaciones_detalle',
            'estaciones_ids',
            'activo',
            'created_at'
        ]
        read_only_fields = ['id', 'usuario', 'created_at']

    def validate_estaciones(self, estaciones):
        restaurante = getattr(self.instance, 'restaurante', None)
        if restaurante is None:
            restaurante = get_restaurante_request(self.context.get('request'))
        if restaurante and any(estacion.restaurante_id != restaurante.id for estacion in estaciones):
            raise serializers.ValidationError('Una estación no pertenece al restaurante activo.')
        return estaciones
