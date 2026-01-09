from rest_framework import serializers
from .models import Restaurante, UsuarioRestaurante, Permiso
from configuraciones.models import Configuracion
from configuraciones.serializer import ConfiguracionSerializer


class PermisoSerializer(serializers.ModelSerializer):
    """Serializer para permisos."""
    class Meta:
        model = Permiso
        fields = ['id', 'codigo', 'descripcion']

class RestauranteSerializer(serializers.ModelSerializer):
    
    configuracion = ConfiguracionSerializer(source='configuracion_set.first', read_only=True)
   
    #Enviar los datos de configuracion junto con el restaurante
    tipo_moneda = serializers.CharField(write_only=True, required=False)
    descripcion = serializers.CharField(write_only=True, required=False)
    logo = serializers.ImageField(write_only=True, required=False)

    class Meta:
        model = Restaurante
        fields = [
            'id', 'nombre', 'direccion', 'telefono', 'ciudad', 'estado', 'email', 'sitio_web',
            'propietario', 'activo', 'created_at', 'configuracion',
            'tipo_moneda', 'descripcion', 'logo'
        ]
        #read_only_fields = ['id', 'propietario', 'activo', 'created_at', 'configuracion']

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
            'activo',
            'created_at'
        ]
        read_only_fields = ['id', 'usuario', 'created_at']
    