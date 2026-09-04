import { useCallback, useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { Edit, Factory, Plus, Trash2 } from 'lucide-react';

import api from '@/services/api';
import { usePOS } from '@/context/POSContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

const FORM_INICIAL = { nombre: '', descripcion: '', orden: 0, activa: true };

export default function Estaciones() {
  const { restauranteActivo } = usePOS();
  const [estaciones, setEstaciones] = useState([]);
  const [uso, setUso] = useState(null);
  const [form, setForm] = useState(FORM_INICIAL);
  const [editando, setEditando] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const cargarEstaciones = useCallback(async () => {
    if (!restauranteActivo?.id) {
      setEstaciones([]);
      return;
    }
    try {
      const [estacionesResponse, usoResponse] = await Promise.all([
        api.get('/restaurantes/estaciones/'),
        api.get('/suscripciones/uso/'),
      ]);
      setEstaciones(Array.isArray(estacionesResponse.data) ? estacionesResponse.data : []);
      setUso(usoResponse.data || null);
    } catch (error) {
      console.error('Error cargando estaciones:', error);
      setEstaciones([]);
    }
  }, [restauranteActivo?.id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarEstaciones();
  }, [cargarEstaciones]);

  const abrirNueva = () => {
    setEditando(null);
    setForm(FORM_INICIAL);
    setDialogOpen(true);
  };

  const limiteAlcanzado = Boolean(
    uso && uso.estaciones.usadas >= uso.estaciones.limite
  );

  const abrirEditar = (estacion) => {
    setEditando(estacion.id);
    setForm({
      nombre: estacion.nombre || '',
      descripcion: estacion.descripcion || '',
      orden: estacion.orden ?? 0,
      activa: estacion.activa !== false,
    });
    setDialogOpen(true);
  };

  const guardar = async (event) => {
    event.preventDefault();
    try {
      if (editando) {
        await api.put(`/restaurantes/estaciones/${editando}/`, form);
      } else {
        await api.post('/restaurantes/estaciones/', form);
      }
      setDialogOpen(false);
      await cargarEstaciones();
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'No se pudo guardar',
        text: error.response?.data?.nombre?.[0] || error.response?.data?.detail || 'Revisa los datos de la estación.',
        confirmButtonColor: '#f97316',
      });
    }
  };

  const eliminar = async (estacion) => {
    const resultado = await Swal.fire({
      icon: 'warning',
      title: `¿Eliminar ${estacion.nombre}?`,
      text: 'Los productos asignados quedarán sin estación y seguirán visibles en todas las comandas.',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
    });
    if (!resultado.isConfirmed) return;
    await api.delete(`/restaurantes/estaciones/${estacion.id}/`);
    cargarEstaciones();
  };

  return (
    <div className="h-[calc(100vh-80px)] overflow-y-auto p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-3 text-3xl font-bold text-gray-800">
              <Factory className="h-8 w-8 text-orange-500" />
              Estaciones de preparación
            </h1>
            <p className="mt-1 text-gray-600">Distribuye las comandas digitales entre cocina, barra, postres u otras áreas.</p>
          </div>
          <Button onClick={abrirNueva} disabled={!restauranteActivo?.id || limiteAlcanzado}>
            <Plus className="mr-2 h-4 w-4" /> Nueva estación
          </Button>
        </div>

        <div className="mb-5 rounded-lg border border-orange-200 bg-orange-50 p-4 text-sm text-orange-900">
          Después de crear estaciones, asígnalas a los productos en Inventario y a los usuarios de cocina en Usuarios. Los productos sin estación se muestran en todas las pantallas de órdenes.
          {uso?.estaciones && (
            <span className="ml-2 font-semibold">
              {uso.estaciones.usadas} de {uso.estaciones.limite} utilizadas.
            </span>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {estaciones.map((estacion) => (
            <Card key={estacion.id}>
              <CardContent className="flex items-start justify-between gap-4 p-5">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold text-gray-900">{estacion.nombre}</h2>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${estacion.activa ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {estacion.activa ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">{estacion.descripcion || 'Sin descripción'}</p>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => abrirEditar(estacion)} aria-label={`Editar ${estacion.nombre}`}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" className="text-red-600" onClick={() => eliminar(estacion)} aria-label={`Eliminar ${estacion.nombre}`}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {!estaciones.length && (
          <div className="rounded-lg border border-dashed py-14 text-center text-gray-500">
            <Factory className="mx-auto mb-3 h-12 w-12 text-gray-300" />
            <p>No hay estaciones configuradas.</p>
            <p className="mt-1 text-sm">Puedes comenzar con Cocina, Barra y Postres.</p>
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editando ? 'Editar estación' : 'Nueva estación'}</DialogTitle>
            <DialogDescription>Una estación representa el área responsable de preparar determinados productos.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={guardar}>
            <div>
              <label className="mb-2 block text-sm font-medium">Nombre *</label>
              <Input value={form.nombre} onChange={(event) => setForm({ ...form, nombre: event.target.value })} placeholder="Ej. Cocina" required />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Descripción</label>
              <Input value={form.descripcion} onChange={(event) => setForm({ ...form, descripcion: event.target.value })} placeholder="Ej. Platos calientes y entradas" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium">Orden</label>
                <Input type="number" min="0" value={form.orden} onChange={(event) => setForm({ ...form, orden: Number(event.target.value) || 0 })} />
              </div>
              <label className="flex items-center gap-2 self-end pb-2 text-sm font-medium">
                <input type="checkbox" checked={form.activa} onChange={(event) => setForm({ ...form, activa: event.target.checked })} />
                Estación activa
              </label>
            </div>
            <div className="flex justify-end gap-2 border-t pt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={!editando && limiteAlcanzado}>
                {editando ? 'Actualizar' : 'Crear estación'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
