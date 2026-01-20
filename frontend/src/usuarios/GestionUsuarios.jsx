import { useEffect, useMemo, useState, useCallback } from 'react';
import Swal from 'sweetalert2';
import api from '../services/api';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Plus, Search, Edit, Trash2, Users, Mail, Shield } from "lucide-react";
import { usePOS } from '@/context/POSContext';
import { ConPermiso } from '@/components/ConPermiso';

export default function GestionUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editando, setEditando] = useState(null);
  const [permisos, setPermisos] = useState([]);
  const [usuarioForm, setUsuarioForm] = useState({
    email: '',
    nombre: '',
    apellido: '',
    password: '',
    rol: 'mesero',
    permisos_ids: [],
    activo: true
  });
  const [restaurante, setRestaurante] = useState(null);
  const [emailLocalPart, setEmailLocalPart] = useState('');
  const { tienePermiso, userRol } = usePOS();

  const domainSuffix = useMemo(() => {
    if (!restaurante?.slug) {
      return '';
    }
    return `@${restaurante.slug}.com`;
  }, [restaurante]);

  const sanitizeLocalPart = useCallback((value) => {
    return (value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9._-]/g, '');
  }, []);

  const handleEmailLocalChange = useCallback((value) => {
    setEmailLocalPart(sanitizeLocalPart(value));
  }, [sanitizeLocalPart]);

  const extractLocalPart = useCallback((email) => {
    if (!email) {
      return '';
    }

    const lowered = email.toLowerCase();

    if (domainSuffix && lowered.endsWith(domainSuffix.toLowerCase())) {
      return sanitizeLocalPart(email.slice(0, -domainSuffix.length));
    }

    const [local] = email.split('@');
    return sanitizeLocalPart(local);
  }, [domainSuffix, sanitizeLocalPart]);

  useEffect(() => {
    setUsuarioForm((prev) => {
      const desiredEmail = emailLocalPart
        ? `${emailLocalPart}${domainSuffix || ''}`
        : '';

      if (prev.email === desiredEmail) {
        return prev;
      }

      return {
        ...prev,
        email: desiredEmail,
      };
    });
  }, [emailLocalPart, domainSuffix]);


  const cargarUsuarios = async () => {
    try {
      const res = await api.get('/restaurantes/usuarios/');
      setUsuarios(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      setUsuarios([]);
    }
  };

  const cargarRestaurante = useCallback(async () => {
    try {
      const res = await api.get('/restaurantes/mi-restaurante/');
      setRestaurante(res.data || null);
    } catch (error) {
      console.error('Error cargando restaurante:', error);
      setRestaurante(null);
    }
  }, []);

  useEffect(() => {
    cargarUsuarios();
    cargarPermisos();
    cargarRestaurante();
  }, [cargarRestaurante]);

  const cargarPermisos = async () => {
    try {
      const res = await api.get('/restaurantes/permisos/');
      setPermisos(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Error cargando permisos:', error);
      setPermisos([]);
    }
  };

  const guardarUsuario = async (e) => {
    e.preventDefault();
    try {
      if (!domainSuffix) {
        Swal.fire({
          icon: 'warning',
          title: 'Configura el restaurante',
          text: 'Define el slug del restaurante antes de crear usuarios.',
          confirmButtonColor: '#f97316'
        });
        return;
      }

      const sanitizedLocal = sanitizeLocalPart(emailLocalPart);

      if (!sanitizedLocal) {
        Swal.fire({
          icon: 'warning',
          title: 'Usuario requerido',
          text: 'Ingresa un identificador para el correo del usuario.',
          confirmButtonColor: '#f97316'
        });
        return;
      }

      const emailFinal = `${sanitizedLocal}${domainSuffix}`;
      setEmailLocalPart(sanitizedLocal);

      setUsuarioForm((prev) => ({
        ...prev,
        email: emailFinal
      }));

      const basePayload = {
        ...usuarioForm,
        email: emailFinal
      };

      if (editando) {
        // Editar usuario existente
        const dataToUpdate = { ...basePayload };
        // No enviar password si está vacío
        if (!dataToUpdate.password) {
          delete dataToUpdate.password;
        }
        await api.put(`/restaurantes/usuarios/${editando}/`, dataToUpdate);
      } else {
        // Crear nuevo usuario
        await api.post('/restaurantes/usuarios/', basePayload);
      }
      
      setDialogOpen(false);
      resetForm();
      cargarUsuarios();
      
      Swal.fire({
        icon: 'success',
        title: editando ? '¡Actualizado!' : '¡Creado!',
        text: `Usuario ${editando ? 'actualizado' : 'creado'} exitosamente`,
        confirmButtonColor: '#f97316',
        timer: 2000
      });
    } catch (error) {
      console.error('Error guardando usuario:', error);
      const errorMsg = error.response?.data?.email?.[0] || 
                       error.response?.data?.detail ||
                       'Error al guardar usuario';
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: errorMsg,
        confirmButtonColor: '#f97316'
      });
    }
  };

  const eliminarUsuario = async (id) => {
    const result = await Swal.fire({
      icon: 'question',
      title: '¿Eliminar usuario?',
      text: 'Esta acción desactivará el usuario',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#f97316',
      cancelButtonColor: '#6b7280'
    });
    
    if (result.isConfirmed) {
      try {
        await api.delete(`/restaurantes/usuarios/${id}/`);
        cargarUsuarios();
        Swal.fire({
          icon: 'success',
          title: '¡Eliminado!',
          text: 'Usuario desactivado exitosamente',
          confirmButtonColor: '#f97316',
          timer: 2000
        });
      } catch (error) {
        console.error('Error eliminando usuario:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al eliminar usuario',
          confirmButtonColor: '#f97316'
        });
      }
    }
  };

  const abrirDialogNuevo = () => {
    resetForm();
    setEditando(null);
    setDialogOpen(true);
  };

  const abrirDialogEditar = (usuario) => {
    setEditando(usuario.id);
    setUsuarioForm({
      email: usuario.email,
      nombre: usuario.nombre || '',
      apellido: usuario.apellido || '',
      password: '', // No mostrar password al editar
      rol: usuario.rol || 'mesero',
      permisos_ids: usuario.permisos_detalle?.map(p => p.id) || [],
      activo: usuario.activo !== undefined ? usuario.activo : true
    });
    setEmailLocalPart(extractLocalPart(usuario.email));
    setDialogOpen(true);
  };

  const resetForm = () => {
    setUsuarioForm({
      email: '',
      nombre: '',
      apellido: '',
      password: '',
      rol: 'mesero',
      permisos_ids: [],
      activo: true
    });
    setEmailLocalPart('');
    setEditando(null);
  };

  const togglePermiso = (permisoId) => {
    setUsuarioForm(prev => {
      const permisos = prev.permisos_ids.includes(permisoId)
        ? prev.permisos_ids.filter(id => id !== permisoId)
        : [...prev.permisos_ids, permisoId];
      return { ...prev, permisos_ids: permisos };
    });
  };

  const usuariosFiltrados = usuarios.filter(u => {
    const searchTerm = busqueda.toLowerCase();
    return (
      u.email?.toLowerCase().includes(searchTerm) ||
      u.nombre?.toLowerCase().includes(searchTerm) ||
      u.apellido?.toLowerCase().includes(searchTerm)
    );
  });

  const getRolBadge = (rol) => {
    const colores = {
      admin: 'bg-purple-100 text-purple-800',
      gerente: 'bg-blue-100 text-blue-800',
      mesero: 'bg-green-100 text-green-800',
      cajero: 'bg-orange-100 text-orange-800',
      cocinero: 'bg-yellow-100 text-yellow-800',
    };
    return colores[rol] || 'bg-gray-100 text-gray-800';
  };

  const getRolLabel = (rol) => {
    const labels = {
      admin: 'Administrador',
      gerente: 'Gerente',
      mesero: 'Mesero',
      cajero: 'Cajero',
      cocinero: 'Cocinero',
    };
    return labels[rol] || rol;
  };

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col p-6">
      {/* Header */}
      <div className="mb-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">
              <Users className="inline-block w-8 h-8 text-orange-500 mr-3" />
              Gestión de Usuarios
            </h2>
            <p className="text-gray-600 mt-1">Administra el personal del restaurante</p>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <Card className="flex-1 flex flex-col">
        <CardContent className="p-4 flex flex-col h-full">
          {/* Barra de búsqueda y acciones */}
          <div className="flex gap-3 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar usuarios por email o nombre..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Mostrar botón siempre si es admin O tiene permiso */}
            {(userRol === 'admin' || tienePermiso('administrar_usuarios')) && (
              <Button onClick={abrirDialogNuevo}>
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Usuario
              </Button>
            )}        
          </div>

          {/* Tabla de Usuarios */}
          <div className="flex-1 overflow-auto border rounded-lg">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Permisos</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {usuariosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                      <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>No hay usuarios para mostrar</p>
                    </td>
                  </tr>
                ) : (
                  usuariosFiltrados.map(usuario => (
                    <tr key={usuario.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{usuario.email}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">
                          {usuario.nombre} {usuario.apellido}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRolBadge(usuario.rol)}`}>
                          <Shield className="w-3 h-3 mr-1" />
                          {getRolLabel(usuario.rol)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {usuario.permisos_detalle && usuario.permisos_detalle.length > 0 ? (
                            usuario.permisos_detalle.slice(0, 2).map(permiso => (
                              <span key={permiso.id} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800">
                                {permiso.descripcion}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-gray-400">Sin permisos</span>
                          )}
                          {usuario.permisos_detalle && usuario.permisos_detalle.length > 2 && (
                            <span className="text-xs text-gray-500">+{usuario.permisos_detalle.length - 2}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          usuario.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {usuario.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <ConPermiso permiso="administrar_usuarios">
                            <button 
                              onClick={() => abrirDialogEditar(usuario)}
                              className="p-1 hover:bg-blue-100 rounded"
                              title="Editar usuario"
                            >
                              <Edit className="w-4 h-4 text-blue-600" />
                            </button>
                          </ConPermiso>
                          <ConPermiso permiso="administrar_usuarios">
                            <button 
                              onClick={() => eliminarUsuario(usuario.id)}
                              className="p-1 hover:bg-red-100 rounded"
                              title="Eliminar usuario"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                          </ConPermiso>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer con contador */}
          <div className="mt-4 pt-4 border-t text-sm text-gray-600">
            Mostrando {usuariosFiltrados.length} de {usuarios.length} usuarios
          </div>
        </CardContent>
      </Card>

      {/* Dialog Crear/Editar Usuario */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editando ? 'Editar Usuario' : 'Nuevo Usuario'}
            </DialogTitle>
            <DialogDescription>
              {editando 
                ? 'Modifica los datos del usuario. Deja la contraseña vacía para mantener la actual.'
                : 'Completa la información del nuevo usuario del restaurante'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={guardarUsuario} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Usuario (correo) *</label>
              <div className="flex items-center">
                <Input
                  type="text"
                  placeholder="usuario"
                  value={emailLocalPart}
                  onChange={(e) => handleEmailLocalChange(e.target.value)}
                  required
                  className={`flex-1 ${domainSuffix ? 'rounded-r-none' : ''}`}
                  pattern="^[a-z0-9._-]+$"
                  title="Solo letras minúsculas, números, puntos, guiones y guiones bajos"
                />
                <span className="px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-100 text-sm text-gray-600">
                  {domainSuffix || '@' + (restaurante?.slug || 'restaurante') + '.com'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {domainSuffix
                  ? `El correo final será ${emailLocalPart || 'usuario'}${domainSuffix}`
                  : 'Define el slug del restaurante para generar correos automáticamente.'}
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nombre</label>
                <Input
                  placeholder="Nombre"
                  value={usuarioForm.nombre}
                  onChange={(e) => setUsuarioForm({ ...usuarioForm, nombre: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Apellido</label>
                <Input
                  placeholder="Apellido"
                  value={usuarioForm.apellido}
                  onChange={(e) => setUsuarioForm({ ...usuarioForm, apellido: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Contraseña {editando && '(dejar vacío para no cambiar)'}
              </label>
              <Input
                type="password"
                placeholder={editando ? 'Nueva contraseña (opcional)' : 'Contraseña'}
                value={usuarioForm.password}
                onChange={(e) => setUsuarioForm({ ...usuarioForm, password: e.target.value })}
                required={!editando}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Rol *</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                value={usuarioForm.rol}
                onChange={(e) => setUsuarioForm({ ...usuarioForm, rol: e.target.value })}
                required
              >
                <option value="mesero">Mesero</option>
                <option value="cajero">Cajero</option>
                <option value="cocinero">Cocinero</option>
                <option value="gerente">Gerente</option>
                <option value="admin">Administrador</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-3">Permisos</label>
              <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2 bg-gray-50">
                {permisos.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-2">No hay permisos disponibles</p>
                ) : (
                  permisos.map(permiso => (
                    <div key={permiso.id} className="flex items-start space-x-2">
                      <Checkbox
                        id={`permiso-${permiso.id}`}
                        checked={usuarioForm.permisos_ids.includes(permiso.id)}
                        onCheckedChange={() => togglePermiso(permiso.id)}
                      />
                      <label
                        htmlFor={`permiso-${permiso.id}`}
                        className="text-sm cursor-pointer flex-1"
                      >
                        <div className="font-medium">{permiso.descripcion}</div>
                        <div className="text-xs text-gray-500">{permiso.codigo}</div>
                      </label>
                    </div>
                  ))
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Selecciona los permisos específicos para este usuario
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="activo"
                checked={usuarioForm.activo}
                onChange={(e) => setUsuarioForm({ ...usuarioForm, activo: e.target.checked })}
                className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
              />
              <label htmlFor="activo" className="text-sm font-medium cursor-pointer">
                Usuario activo
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {editando ? (
                  <>
                    <Edit className="w-4 h-4 mr-2" />
                    Actualizar
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Usuario
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
