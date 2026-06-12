from rest_framework.permissions import BasePermission
from restaurantes.models import UsuarioRestaurante
from core.restaurantes import get_restaurante_request

class EsAdmin(BasePermission):
    def has_permission(self, request, view):
        restaurante = get_restaurante_request(request)
        if not restaurante:
            return False

        if restaurante.propietario_id == request.user.id:
            return True

        return UsuarioRestaurante.objects.filter(
            usuario=request.user,
            restaurante=restaurante,
            activo=True,
            rol=UsuarioRestaurante.ADMIN,
        ).exists()
    

class TienePermisoRestaurante(BasePermission):
    """
    Permiso personalizado para verificar si un usuario tiene un permiso específico
    en un restaurante determinado.
    """

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        # Intentar obtener el restaurante_id del header primero
        restaurante_id = request.META.get('HTTP_X_RESTAURANTE_ID')
        
        # Si no hay header, buscar el restaurante del usuario autenticado
        if not restaurante_id:
            from restaurantes.models import Restaurante
            restaurante = Restaurante.objects.filter(
                propietario=request.user,
                activo=True
            ).first()
            
            if not restaurante:
                # Si no es propietario, buscar si es empleado
                try:
                    ur = UsuarioRestaurante.objects.filter(
                        usuario=request.user,
                        activo=True
                    ).first()
                    if not ur:
                        return False
                    restaurante_id = ur.restaurante_id
                except UsuarioRestaurante.DoesNotExist:
                    return False
            else:
                restaurante_id = restaurante.id
        
        # Buscar la relación UsuarioRestaurante
        try:
            ur = UsuarioRestaurante.objects.get(
                usuario=request.user,
                restaurante_id=restaurante_id,
                activo=True
            )
        except UsuarioRestaurante.DoesNotExist:
            return False
        
        # ADMIN siempre pasa
        if ur.rol == UsuarioRestaurante.ADMIN:
            return True
        
        # Verificar permiso específico
        permiso = getattr(view, 'permiso_requerido', None)
        if not permiso:
            return False

        return ur.permisos.filter(codigo=permiso).exists()


class TienePermiso(BasePermission):
    """
    Verifica si el usuario tiene un permiso específico.
    Los usuarios con rol 'admin' siempre tienen acceso.
    Uso: permission_classes = [IsAuthenticated, TienePermiso]
         permission_required = 'crear_productos'
    """
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        # Obtener el usuario restaurante activo
        usuario_restaurante = UsuarioRestaurante.objects.filter(
            usuario=request.user,
            activo=True
        ).first()
        
        if not usuario_restaurante:
            return False
        
        # Los admins tienen acceso total
        if usuario_restaurante.rol == 'admin':
            return True
        
        # Obtener el permiso requerido desde el atributo de la vista
        permiso_requerido = getattr(view, 'permission_required', None)
        
        if not permiso_requerido:
            return True  # Si no se especifica permiso, permitir acceso
        
        # Verificar si tiene el permiso específico o 'todos_los_permisos'
        return usuario_restaurante.permisos.filter(
            codigo__in=[permiso_requerido, 'todos_los_permisos']
        ).exists()
