import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { usePOS } from '../context/POSContext';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Plus, Users, MapPin, Edit, Trash2 } from "lucide-react";

export default function Mesas() {
  const navigate = useNavigate();
  const { seleccionarMesa, mesaSeleccionada } = usePOS();
  const [mesas, setMesas] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mesaForm, setMesaForm] = useState({ numero: '', capacidad: 4 });
  const [editando, setEditando] = useState(null);

  useEffect(() => {
    cargarMesas();
  }, []);

  const cargarMesas = async () => {
    try {
      const res = await api.get('/mesas/');
      setMesas(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Error cargando mesas:', error);
      setMesas([]);
    }
  };

  const guardarMesa = async (e) => {
    e.preventDefault();
    try {
      if (editando) {
        await api.put(`/mesas/${editando}/`, mesaForm);
      } else {
        await api.post('/mesas/', mesaForm);
      }
      setDialogOpen(false);
      setMesaForm({ numero: '', capacidad: 4 });
      setEditando(null);
      cargarMesas();
    } catch (error) {
      console.error('Error guardando mesa:', error);
    }
  };

  const eliminarMesa = async (id) => {
    if (confirm('¿Eliminar esta mesa?')) {
      try {
        await api.delete(`/mesas/${id}/`);
        cargarMesas();
      } catch (error) {
        console.error('Error eliminando mesa:', error);
      }
    }
  };

  const handleSeleccionarMesa = (mesa) => {
    seleccionarMesa(mesa);
    // Navegar a productos para tomar orden
    navigate('/productos');
  };

  const abrirDialogNuevo = () => {
    setEditando(null);
    setMesaForm({ numero: '', capacidad: 4 });
    setDialogOpen(true);
  };

  const abrirDialogEditar = (mesa) => {
    setEditando(mesa.id);
    setMesaForm({ numero: mesa.numero, capacidad: mesa.capacidad || 4 });
    setDialogOpen(true);
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'disponible':
        return 'bg-green-100 border-green-500 hover:bg-green-50';
      case 'ocupada':
        return 'bg-orange-100 border-orange-500 hover:bg-orange-50';
      case 'reservada':
        return 'bg-blue-100 border-blue-500 hover:bg-blue-50';
      default:
        return 'bg-gray-100 border-gray-500 hover:bg-gray-50';
    }
  };

  const getEstadoBadge = (estado) => {
    const colores = {
      disponible: 'bg-green-500',
      ocupada: 'bg-orange-500',
      reservada: 'bg-blue-500',
    };
    return colores[estado] || 'bg-gray-500';
  };

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">
              <MapPin className="inline-block w-8 h-8 text-orange-500 mr-3" />
              Gestión de Mesas
            </h2>
            <p className="text-gray-600 mt-1">Administra las mesas de tu restaurante</p>
          </div>
          <Button onClick={abrirDialogNuevo} className="bg-orange-500 hover:bg-orange-600">
            <Plus className="w-4 h-4 mr-2" />
            Nueva Mesa
          </Button>
        </div>

        {mesaSeleccionada && (
          <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-sm font-medium text-orange-800">
              Mesa seleccionada: <span className="font-bold">Mesa {mesaSeleccionada.numero}</span>
            </p>
          </div>
        )}
      </div>

      {/* Grid de Mesas */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {mesas.map((mesa) => (
            <Card
              key={mesa.id}
              className={`cursor-pointer transition-all border-2 ${getEstadoColor(mesa.estado)} ${
                mesaSeleccionada?.id === mesa.id ? 'ring-2 ring-orange-500' : ''
              }`}
              onClick={() => handleSeleccionarMesa(mesa)}
            >
              <CardContent className="p-4">
                <div className="flex flex-col items-center gap-3">
                  {/* Número de mesa */}
                  <div className="w-full flex justify-between items-start">
                    <div className="flex-1 text-center">
                      <div className="text-4xl font-bold text-gray-800">
                        {mesa.numero}
                      </div>
                      <div className="text-xs text-gray-500 uppercase">Mesa</div>
                    </div>
                  </div>

                  {/* Estado */}
                  <div className={`w-full text-center py-1 px-2 rounded text-white text-xs font-semibold ${getEstadoBadge(mesa.estado)}`}>
                    {mesa.estado?.toUpperCase() || 'DISPONIBLE'}
                  </div>

                  {/* Capacidad */}
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>{mesa.capacidad || 4} personas</span>
                  </div>

                  {/* Botones de acción */}
                  <div className="flex gap-2 w-full mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        abrirDialogEditar(mesa);
                      }}
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        eliminarMesa(mesa.id);
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {mesas.length === 0 && (
          <div className="text-center py-12">
            <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No hay mesas registradas</p>
            <p className="text-gray-400 text-sm">Crea tu primera mesa para comenzar</p>
          </div>
        )}
      </div>

      {/* Dialog para crear/editar mesa */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editando ? 'Editar Mesa' : 'Nueva Mesa'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={guardarMesa} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Número de Mesa
              </label>
              <Input
                type="text"
                placeholder="Ej: 1, A1, VIP-1"
                value={mesaForm.numero}
                onChange={(e) => setMesaForm({ ...mesaForm, numero: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Capacidad (personas)
              </label>
              <Input
                type="number"
                min="1"
                max="20"
                value={mesaForm.capacidad}
                onChange={(e) => setMesaForm({ ...mesaForm, capacidad: parseInt(e.target.value) })}
                required
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-orange-500 hover:bg-orange-600">
                {editando ? 'Actualizar' : 'Crear'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

