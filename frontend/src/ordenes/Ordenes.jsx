import { useEffect, useState, useCallback } from 'react';
import Swal from 'sweetalert2';
import api from '@/services/api';
import { usePOS } from '@/context/POSContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Clock, Users, UtensilsCrossed, Trash2, CircleX } from 'lucide-react';

const REFRESH_INTERVAL_MS = 30000;

const formatMinutes = (minutes) => {
  if (minutes <= 0) {
    return 'recién enviado';
  }
  if (minutes === 1) {
    return 'hace 1 minuto';
  }
  if (minutes < 60) {
    return `hace ${minutes} minutos`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `hace ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
  }
  return `hace ${hours}h ${remainingMinutes}m`;
};

const formatTime = (isoString) => {
  if (!isoString) {
    return '';
  }
  try {
    return new Date(isoString).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return '';
  }
};

export default function Ordenes() {
  const { restauranteActivo, userRol } = usePOS();
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null);
  const [cancelingId, setCancelingId] = useState(null);
  const [cancelingDetalleId, setCancelingDetalleId] = useState(null);

  const cargarOrdenes = useCallback(async (mostrarLoader = false) => {
    if (mostrarLoader) {
      setLoading(true);
    }

    if (userRol === 'admin' && !restauranteActivo?.id) {
      setOrdenes([]);
      setError('Selecciona un restaurante en la barra superior.');
      setLoading(false);
      return;
    }

    try {
      const response = await api.get('/pedidos/cocina/');
      const data = Array.isArray(response.data) ? response.data : [];
      setOrdenes(data);
      setError(null);
      setUltimaActualizacion(new Date());
    } catch (err) {
      console.error('Error cargando órdenes de cocina:', err);
      setError('No se pudieron cargar las órdenes. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  }, [restauranteActivo?.id, userRol]);

  useEffect(() => {
    cargarOrdenes(true);

    const intervalo = setInterval(() => {
      cargarOrdenes();
    }, REFRESH_INTERVAL_MS);

    return () => clearInterval(intervalo);
  }, [cargarOrdenes]);

  const handlePedidoPagado = useCallback((pedidoId) => {
    if (!pedidoId) {
      cargarOrdenes();
      return;
    }

    setOrdenes((prev) => prev.filter((orden) => orden.id !== pedidoId));
    cargarOrdenes();
  }, [cargarOrdenes]);

  useEffect(() => {
    const storageHandler = (event) => {
      if (event.key !== 'pedido_pagado') {
        return;
      }

      try {
        const data = event.newValue ? JSON.parse(event.newValue) : null;
        handlePedidoPagado(data?.pedidoId);
      } catch (error) {
        console.warn('No se pudo interpretar el evento de pago:', error);
        cargarOrdenes();
      }
    };

    const customHandler = (event) => {
      handlePedidoPagado(event.detail?.pedidoId);
    };

    window.addEventListener('storage', storageHandler);
    window.addEventListener('pedido_pagado', customHandler);

    return () => {
      window.removeEventListener('storage', storageHandler);
      window.removeEventListener('pedido_pagado', customHandler);
    };
  }, [handlePedidoPagado, cargarOrdenes]);

  const cancelarOrden = useCallback(async (pedidoId) => {
    const orden = ordenes.find((item) => item.id === pedidoId);
    const mesaLabel = orden?.mesa?.nombre || orden?.mesa?.id || '';

    const { isConfirmed } = await Swal.fire({
      title: 'Cancelar orden',
      text: mesaLabel ? `¿Cancelar el pedido de la mesa ${mesaLabel}?` : '¿Cancelar este pedido? Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'Volver'
    });

    if (!isConfirmed) {
      return;
    }

    setCancelingId(pedidoId);
    try {
      await api.post('/pedidos/cancelar/', { pedido_id: pedidoId });
      setOrdenes((prev) => prev.filter((item) => item.id !== pedidoId));
      setCancelingId(null);
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Pedido cancelado',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true
      });
      cargarOrdenes();
    } catch (err) {
      console.error('Error cancelando pedido:', err);
      setCancelingId(null);
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'error',
        title: 'No se pudo cancelar el pedido',
        showConfirmButton: false,
        timer: 2500,
        timerProgressBar: true
      });
    }
  }, [ordenes, cargarOrdenes]);

  const cancelarDetalle = useCallback(async (orden, detalle) => {
    if (!orden || !detalle) {
      return;
    }

    const { isConfirmed } = await Swal.fire({
      title: 'Cancelar producto',
      text: `¿Cancelar ${detalle.cantidad}x ${detalle.producto?.nombre || 'este producto'}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'Volver'
    });

    if (!isConfirmed) {
      return;
    }

    setCancelingDetalleId(detalle.id);

    try {
      await api.post(`/pedidos/detalle/${detalle.id}/cancelar/`);

      setOrdenes((prev) => prev
        .map((item) => {
          if (item.id !== orden.id) {
            return item;
          }
          const restantes = (item.detalles || []).filter((d) => d.id !== detalle.id);
          return restantes.length
            ? { ...item, detalles: restantes }
            : null;
        })
        .filter(Boolean));

      setCancelingDetalleId(null);

      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Producto cancelado',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true
      });

      cargarOrdenes();
    } catch (err) {
      console.error('Error cancelando producto:', err);
      setCancelingDetalleId(null);
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'error',
        title: 'No se pudo cancelar el producto',
        showConfirmButton: false,
        timer: 2500,
        timerProgressBar: true
      });
    }
  }, [cargarOrdenes]);

  const ultimaActualizacionTexto = ultimaActualizacion
    ? ultimaActualizacion.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      })
    : '—';

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col gap-4 bg-gray-100">
      <div className="flex flex-col gap-2 px-6 pt-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
              <UtensilsCrossed className="w-7 h-7 text-orange-500" />
              Órdenes de Cocina
            </h1>
            <p className="text-gray-600">Monitorea los platos enviados desde el punto de venta.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-500 flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Última actualización: {ultimaActualizacionTexto}
            </div>
            <Button
              variant="outline"
              onClick={() => cargarOrdenes(true)}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>
        </div>
        {error && (
          <div className="px-4 py-2 bg-red-100 border border-red-200 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {loading && !ordenes.length ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-500">
            <RefreshCw className="w-8 h-8 animate-spin mb-3" />
            Cargando órdenes...
          </div>
        ) : ordenes.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <UtensilsCrossed className="w-12 h-12 mb-3" />
            <p className="text-sm">No hay órdenes en cocina por ahora.</p>
            <p className="text-xs mt-1">Las órdenes aparecerán aquí cuando se envíen desde el POS.</p>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {ordenes.map((orden) => (
              <Card key={orden.id} className="shadow-sm border border-orange-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-gray-800 flex items-center justify-between">
                    <span>
                      Mesa {orden?.mesa?.nombre || orden?.mesa?.id || 'sin asignar'}
                    </span>
                    <span className="text-sm font-medium text-orange-600">
                      {formatMinutes(orden?.tiempo_espera_minutos ?? 0)}
                    </span>
                  </CardTitle>
                  <div className="text-xs text-gray-500 flex items-center gap-2">
                    <span>Pedido #{orden.id}</span>
                    <span>•</span>
                    <span>Enviado {formatTime(orden?.detalles?.[0]?.fecha || orden?.creado)}</span>
                    {orden?.mesero?.nombre && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {orden.mesero.nombre}
                        </span>
                      </>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(Array.isArray(orden.detalles) ? orden.detalles : []).map((detalle) => (
                    <div
                      key={detalle.id}
                      className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-gray-800 text-sm">
                            {detalle.cantidad}x {detalle.producto?.nombre}
                          </p>
                          {detalle.producto?.estacion?.nombre && (
                            <span className="mt-1 inline-flex rounded bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-800">
                              {detalle.producto.estacion.nombre}
                            </span>
                          )}
                          {detalle.comensal?.nombre && (
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {detalle.comensal.nombre}
                            </p>
                          )}
                          {detalle.observaciones && (
                            <p className="text-xs text-orange-600 mt-1 italic">
                              Nota: {detalle.observaciones}
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-gray-400">
                          {formatTime(detalle.fecha)}
                        </span>
                      </div>
                      <div className="flex justify-end mt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => cancelarDetalle(orden, detalle)}
                          disabled={cancelingDetalleId === detalle.id || cancelingId === orden.id}
                        >
                          <CircleX className="w-4 h-4 mr-1" />
                          {cancelingDetalleId === detalle.id ? 'Cancelando...' : 'Cancelar'}
                        </Button>
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-end pt-2">
                    <Button
                      variant="outline"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => cancelarOrden(orden.id)}
                      disabled={cancelingId === orden.id}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {cancelingId === orden.id ? 'Cancelando...' : 'Cancelar orden'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
