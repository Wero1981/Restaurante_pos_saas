import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import api from '../services/api';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Search, Edit, MapPin, Phone, Mail, Globe, Store, Calendar } from "lucide-react";
import { usePOS } from '../context/POSContext';

export default function ListaRestaurantes() {
  const navigate = useNavigate();
  const [restaurantes, setRestaurantes] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);
  const [uso, setUso] = useState(null);
 const { seleccionarRestaurante } = usePOS();

  useEffect(() => {
    cargarRestaurantes();
  }, []);

  const cargarRestaurantes = async () => {
    try {
      setLoading(true);
      const [res, usoRes] = await Promise.all([
        api.get('/restaurantes/'),
        api.get('/suscripciones/uso/'),
      ]);
      setRestaurantes(Array.isArray(res.data) ? res.data : []);
      setUso(usoRes.data || null);
    } catch (error) {
      console.error('Error cargando restaurantes:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar los restaurantes',
        confirmButtonColor: '#f97316'
      }); 
      setRestaurantes([]);
    } finally {
      setLoading(false);
    }
  };

  const editarRestaurante = (restaurante) => {
    navigate('/restaurante', { state: { restaurante } });
  };

  const restaurantesFiltrados = restaurantes.filter(r => {
    const searchTerm = busqueda.toLowerCase();
    return (
      r.nombre?.toLowerCase().includes(searchTerm) ||
      r.ciudad?.toLowerCase().includes(searchTerm) ||
      r.estado?.toLowerCase().includes(searchTerm) ||
      r.direccion?.toLowerCase().includes(searchTerm)
    );
  });

  const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };



  return (  
    <div className="h-[calc(100vh-80px)] flex flex-col p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">
              <Store className="inline-block w-8 h-8 text-orange-500 mr-3" />
              Mis Restaurantes
            </h2>
            <p className="text-gray-600 mt-1">Administra la información de tus restaurantes</p>
          </div>
          <Button
            onClick={() => navigate('/restaurante', {state:{ esNuevo: true }})}
            disabled={uso && uso.restaurantes.usados >= uso.restaurantes.limite}
            className="bg-orange-500 hover:bg-orange-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Restaurante
          </Button>
        </div>
      </div>

      {/* Barra de búsqueda */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar por nombre, ciudad o estado..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Lista de Restaurantes */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando restaurantes...</p>
          </div>
        </div>
      ) : restaurantesFiltrados.length === 0 ? (
        <Card>
          <CardContent className="p-12">
            <div className="text-center">
              <Store className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                {busqueda ? 'No se encontraron restaurantes' : 'No tienes restaurantes registrados'}
              </h3>
              <p className="text-gray-500 mb-6">
                {busqueda 
                  ? 'Intenta con otros términos de búsqueda'
                  : 'Comienza creando tu primer restaurante para empezar a usar el sistema'
                }
              </p>
              {!busqueda && (
                <Button onClick={() => navigate('/restaurante', {state:{ esNuevo: true }})} className="bg-orange-500 hover:bg-orange-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Primer Restaurante
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-auto pb-6">
          {restaurantesFiltrados.map(restaurante => (
            <Card key={restaurante.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                {/* Header de la tarjeta */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      {restaurante.nombre}
                    </h3>
                   
                  </div>
                  <Button
                    className="bg-orange-500 hover:bg-orange-600"
                    onClick={() => {
                      seleccionarRestaurante(restaurante);
                    }}
                  >
                    <Store className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => editarRestaurante(restaurante)}
                    className="ml-2"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>

                {/* Información del restaurante */}
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2 text-gray-600">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-orange-500" />
                    <div className="flex-1">
                      <p>{restaurante.direccion}</p>
                      {(restaurante.ciudad || restaurante.estado) && (
                        <p className="text-gray-500">
                          {restaurante.ciudad}
                          {restaurante.ciudad && restaurante.estado && ', '}
                          {restaurante.estado}
                        </p>
                      )}
                    </div>
                  </div>

                  {restaurante.telefono && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="w-4 h-4 text-orange-500" />
                      <span>{restaurante.telefono}</span>
                    </div>
                  )}

                  {restaurante.email && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="w-4 h-4 text-orange-500" />
                      <span className="truncate">{restaurante.email}</span>
                    </div>
                  )}

                  {restaurante.sitio_web && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Globe className="w-4 h-4 text-orange-500" />
                      <a 
                        href={restaurante.sitio_web} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline truncate"
                      >
                        {restaurante.sitio_web}
                      </a>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="w-3 h-3" />
                    <span>Creado: {formatearFecha(restaurante.created_at)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Footer con contador */}
      {!loading && restaurantesFiltrados.length > 0 && (
        <div className="mt-4 pt-4 border-t text-sm text-gray-600">
          Mostrando {restaurantesFiltrados.length} de {restaurantes.length} restaurantes
        </div>
      )}
    </div>
  );
}
