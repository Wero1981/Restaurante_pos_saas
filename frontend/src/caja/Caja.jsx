import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { usePOS } from '../context/POSContext';
import Swal from 'sweetalert2';
import CuentaRapida from './CuentaRapida';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  CreditCard, 
  DollarSign, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus,
  Receipt,
  CheckCircle,
  Lock,
  Unlock,
  Search,
  ArrowLeftRight,
  CircleDollarSign,
  PlusCircle, 
  X,
  Loader2
} from "lucide-react";




export default function Caja() {
  const navigate = useNavigate();
  const { seleccionarMesa: seleccionarMesaContexto, establecerPedidoActivo } = usePOS();


  // Estados para caja
  const [cajaAbierta, setCajaAbierta] = useState(false);
  const [cajaActual, setCajaActual] = useState(null);
  const [dialogAbrirCaja, setDialogAbrirCaja] = useState(false);
  const [montoInicial, setMontoInicial] = useState('');
  const [cargandoCaja, setCargandoCaja] = useState(true);
  const [restaurantes, setRestaurantes] = useState([]);
  const [restauranteSeleccionado, setRestauranteSeleccionado] = useState(null);
  const [tipoMovimiento, setTipoMovimiento] = useState('entrada');
  const [montoMovimiento, setMontoMovimiento] = useState('');
  const [descripcionMovimiento, setDescripcionMovimiento] = useState('');

  // Estados para POS (pagos)
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [dialogPago, setDialogPago] = useState(false);
  const [dialogExito, setDialogExito] = useState(false);
  const [montoPagado, setMontoPagado] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [dialogCierre, setDialogCierre] = useState(false);
  const [resumenCaja, setResumenCaja] = useState(null);
  const [cargandoResumen, setCargandoResumen] = useState(false);
  const [cerrandoCaja, setCerrandoCaja] = useState(false);
  const [errorResumen, setErrorResumen] = useState(null);

  //Estado Drawer
  const [isOpenDrawer, setIsOpenDrawer] = useState(false);
  
  // Estados para mesas con cuentas abiertas
  const [mesasConCuentas, setMesasConCuentas] = useState([]);
  const [mesaSeleccionadaLocal, setMesaSeleccionadaLocal] = useState(null);
  const [pedidoMesa, setPedidoMesa] = useState(null);
  const [cargandoMesas, setCargandoMesas] = useState(false);
  
  // Estados para cuenta rápida
  const [modoCuentaRapida, setModoCuentaRapida] = useState(false);
  const [productos, setProductos] = useState([]);
  const [busquedaProducto, setBusquedaProducto] = useState('');
  const [carritoRapido, setCarritoRapido] = useState([]);

  //Drawer
  const handleCloseDrawer = () => {
    setIsOpenDrawer(false);
    setMontoMovimiento('');
    setDescripcionMovimiento('');
    setTipoMovimiento('entrada');
  };

  const submitMovimiento = async (event) => {
    event.preventDefault();
    if (!montoMovimiento || Number(montoMovimiento) <= 0) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'warning',
        text: 'Ingresa un monto válido para el movimiento.',
        timer: 2500,
        showConfirmButton: false,
      });
      return;
    }

    const resultado = await handleRegistrarMovimiento(
      tipoMovimiento,
      montoMovimiento,
      descripcionMovimiento
    );

    if (resultado) {
      await obtenerResumenCaja();
      handleCloseDrawer();
    }
  };

  // Funciones con useCallback (definidas antes de los useEffect)
  const cargarProductos = useCallback(async () => {
    try {
      const res = await api.get('/productos/');
      setProductos(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Error cargando productos:', error);
    }
  }, []);

  const cargarRestaurantes = useCallback(async () => {
    try {
      const res = await api.get('/restaurantes/');
      setRestaurantes(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Error cargando restaurantes:', error);
    }
  }, []);

  const cargarMesasConCuentas = useCallback(async () => {
    try {
      setCargandoMesas(true);
      // Obtener todas las mesas
      const resMesas = await api.get(`/mesas/?restaurante=${restauranteSeleccionado}`);
      const todasMesas = resMesas.data;
      
      // Obtener pedidos activos con detalles
      const resPedidos = await api.get(`/pedidos/?restaurante=${restauranteSeleccionado}`);
      const pedidosActivos = resPedidos.data;
      
      console.log('Pedidos cargados:', pedidosActivos);
      
      // Filtrar mesas que tienen pedidos abiertos
      const mesasConPedidos = todasMesas.filter(mesa => 
        pedidosActivos.some(pedido => 
          pedido.mesa === mesa.id && pedido.estado === 'abierto'
        )
      );
      
      // Agregar información del pedido a cada mesa
      const mesasConInfo = mesasConPedidos.map(mesa => {
        const pedido = pedidosActivos.find(p => p.mesa === mesa.id && p.estado === 'abierto');
        return {
          ...mesa,
          pedido: pedido
        };
      });
      
      console.log('Mesas con cuentas:', mesasConInfo);
      setMesasConCuentas(mesasConInfo);
    } catch (error) {
      console.error('Error cargando mesas con cuentas:', error);
    } finally {
      setCargandoMesas(false);
    }
  }, [restauranteSeleccionado]);
  const notificarPedidoPagado = useCallback((pedidoId) => {
    if (!pedidoId) {
      return;
    }

    const payload = JSON.stringify({
      pedidoId,
      timestamp: Date.now()
    });

    try {
      localStorage.setItem('pedido_pagado', payload);
    } catch (error) {
      console.warn('No se pudo almacenar el evento de pago:', error);
    }

    window.dispatchEvent(new CustomEvent('pedido_pagado', {
      detail: { pedidoId }
    }));
  }, []);

  const formatearMonto = (valor) => {
    const numero = Number(valor || 0);
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(Number.isFinite(numero) ? numero : 0);
  };

  // Verificar si hay caja abierta al cargar
  useEffect(() => {
    cargarRestaurantes();
    const restoId = localStorage.getItem('restaurante_id');
    if (restoId) {
      setRestauranteSeleccionado(parseInt(restoId));
      verificarCajaAbierta(restoId);
    } else {
      setCargandoCaja(false);
    }
  }, [cargarRestaurantes]);
  
  // Cargar mesas cuando la caja está abierta
  useEffect(() => {
    if (cajaAbierta && restauranteSeleccionado) {
      cargarMesasConCuentas();
      cargarProductos();
    }
  }, [cajaAbierta, restauranteSeleccionado, cargarMesasConCuentas, cargarProductos]);

  const seleccionarMesa = async (mesa) => {
    try {
      setMesaSeleccionadaLocal(mesa);
      
      // Cargar detalles del pedido
      if (mesa.pedido) {
        const res = await api.get(`/pedidos/${mesa.pedido.id}/`);
        console.log('Detalles del pedido cargados:', res.data);
        setPedidoMesa(res.data);
      }
    } catch (error) {
      console.error('Error cargando pedido de mesa:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo cargar el pedido de la mesa',
        confirmButtonColor: '#f97316'
      });
    }
  };
  
  // Funciones para cuenta rápida
  const iniciarCuentaRapida = () => {
    setModoCuentaRapida(true);
    setMesaSeleccionadaLocal(null);
    setPedidoMesa(null);
    setCarritoRapido([]);
  };
  
  const agregarProductoCarrito = (producto) => {
    const itemExistente = carritoRapido.find(item => item.id === producto.id);
    
    if (itemExistente) {
      setCarritoRapido(carritoRapido.map(item => 
        item.id === producto.id 
          ? { ...item, cantidad: item.cantidad + 1 }
          : item
      ));
    } else {
      setCarritoRapido([...carritoRapido, {
        ...producto,
        cantidad: 1
      }]);
    }
  };
  
  const incrementarCantidadRapida = (productoId) => {
    setCarritoRapido(carritoRapido.map(item => 
      item.id === productoId 
        ? { ...item, cantidad: item.cantidad + 1 }
        : item
    ));
  };
  
  const decrementarCantidadRapida = (productoId) => {
    setCarritoRapido(carritoRapido.map(item => 
      item.id === productoId && item.cantidad > 1
        ? { ...item, cantidad: item.cantidad - 1 }
        : item
    ).filter(item => item.cantidad > 0));
  };
  
  const removerProductoRapido = (productoId) => {
    setCarritoRapido(carritoRapido.filter(item => item.id !== productoId));
  };
  
  const calcularTotalRapido = () => {
    return carritoRapido.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
  };
  
  const cancelarCuentaRapida = () => {
    setModoCuentaRapida(false);
    setCarritoRapido([]);
    setBusquedaProducto('');
  };
  
  // Función para abrir pedido con mesa seleccionada
  const abrirPedidoConMesa = () => {
    if (!mesaSeleccionadaLocal || !pedidoMesa) {
      Swal.fire({
        icon: 'warning',
        title: 'Sin pedido',
        text: 'Selecciona una mesa con pedido abierto',
        confirmButtonColor: '#f97316'
      });
      return;
    }
    
    // Guardar mesa y pedido en el contexto antes de navegar
    seleccionarMesaContexto(mesaSeleccionadaLocal);
    establecerPedidoActivo(pedidoMesa);
    navigate('/pedido');
  };

  const verificarCajaAbierta = async (restauranteId) => {
    try {
      setCargandoCaja(true);
      if (!restauranteId) {
        setCargandoCaja(false);
        return;
      }
      const res = await api.get(`/caja/cajas/?restaurante=${restauranteId}`);
      
      if (res.data && res.data.length > 0) {
        setCajaActual(res.data[0]);
        console.log('Caja abierta encontrada:', res.data[0]);
        setCajaAbierta(true);
      } else {
        setCajaAbierta(false);
        setCajaActual(null);
      }
    } catch (error) {
      console.error('Error verificando caja:', error);
      setCajaAbierta(false);
    } finally {
      setCargandoCaja(false);
    }
  };

  const abrirCaja = async () => {
    if (!montoInicial || parseFloat(montoInicial) < 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Monto inválido',
        text: 'Ingresa un monto inicial válido',
        confirmButtonColor: '#f97316'
      });
      return;
    }

    try {
      if (!restauranteSeleccionado) {
        Swal.fire({
          icon: 'warning',
          title: 'Selecciona un restaurante',
          text: 'Debes seleccionar un restaurante antes de abrir la caja',
          confirmButtonColor: '#f97316'
        });
        return;
      }
      
      const usuarioData = JSON.parse(localStorage.getItem('user'));
      
      const payload = {
        restaurante: parseInt(restauranteSeleccionado),
        usuario: usuarioData.id,
        monto_inicial: parseFloat(montoInicial),
        abierta: true
      };
      
      console.log('Abriendo caja con payload:', payload);
      const res = await api.post('/caja/cajas/', payload);
      console.log('Respuesta al abrir caja:', res.data);

      setCajaActual(res.data);
      setCajaAbierta(true);
      setDialogAbrirCaja(false);
      setMontoInicial('');

      Swal.fire({
        icon: 'success',
        title: '¡Caja abierta!',
        text: 'La caja se ha abierto correctamente',
        confirmButtonColor: '#f97316',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Error abriendo caja:', error);
      console.error('Respuesta del error:', error.response?.data);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || error.response?.data?.detail || 'No se pudo abrir la caja',
        confirmButtonColor: '#f97316'
      });
    }
  };

  const obtenerResumenCaja = async () => {
    if (!cajaActual) {
      Swal.fire({
        icon: 'warning',
        title: 'Sin caja activa',
        text: 'Abre una caja antes de intentar cerrarla.',
        confirmButtonColor: '#f97316'
      });
      return null;
    }

    setErrorResumen(null);
    setCargandoResumen(true);

    try {
      const res = await api.get(`/caja/cajas/${cajaActual.id}/resumen/`);
      console.log('Resumen de caja obtenido:', res.data);
      setResumenCaja(res.data);
      return res.data;
    } catch (error) {
      console.error('Error obteniendo resumen de caja:', error);
      const mensaje = error.response?.data?.detail || 'No se pudo obtener el resumen de la caja';
      setErrorResumen(mensaje);
      return null;
    } finally {
      setCargandoResumen(false);
    }
  };

  const mostrarDialogoCierre = async () => {
    if (!cajaActual) {
      Swal.fire({
        icon: 'warning',
        title: 'Sin caja activa',
        text: 'Abre una caja antes de intentar cerrarla.',
        confirmButtonColor: '#f97316'
      });
      return;
    }

    setDialogCierre(true);
    await obtenerResumenCaja();
  };

  const cerrarDialogoCierre = () => {
    setDialogCierre(false);
    setResumenCaja(null);
    setErrorResumen(null);
  };

  const cerrarCaja = async () => {
    if (!cajaActual) {
      return;
    }

    setCerrandoCaja(true);
    try {
      const res = await api.post(`/caja/cajas/${cajaActual.id}/cerrar/`, {
        automatico: false
      });

      const resumenFinal = res.data;
      setResumenCaja(resumenFinal);
      setCajaAbierta(false);
      setCajaActual(null);
      setDialogCierre(false);
      setMesasConCuentas([]);
      setMesaSeleccionadaLocal(null);
      setPedidoMesa(null);

      Swal.fire({
        icon: 'success',
        title: '¡Caja cerrada!',
        html: `
          <div class="text-left space-y-2">
            <p><strong>Total de ventas:</strong> ${formatearMonto(resumenFinal?.ventas?.total)}</p>
            <p><strong>Ventas en efectivo:</strong> ${formatearMonto(resumenFinal?.ventas?.por_metodo?.efectivo)}</p>
            <p><strong>Ventas con tarjeta:</strong> ${formatearMonto(resumenFinal?.ventas?.por_metodo?.tarjeta)}</p>
            <p><strong>Entradas adicionales:</strong> ${formatearMonto(resumenFinal?.movimientos?.entradas)}</p>
            <p><strong>Salidas:</strong> ${formatearMonto(resumenFinal?.movimientos?.salidas)}</p>
            <p><strong>Monto final:</strong> ${formatearMonto(resumenFinal?.monto_final)}</p>
          </div>
        `,
        confirmButtonColor: '#f97316'
      });
    } catch (error) {
      console.error('Error cerrando caja:', error);
      const mensaje = error.response?.data?.detail || 'No se pudo cerrar la caja';
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: mensaje,
        confirmButtonColor: '#f97316'
      });
    } finally {
      setCerrandoCaja(false);
    }
  };
  const handleRegistrarMovimiento = async (tipo, monto, descripcion) => {
    if (!cajaActual) {
      Swal.fire({
        icon: 'warning',
        title: 'Sin caja activa',
        text: 'Abre una caja antes de registrar movimientos.',
        toast: true,
        position: 'top-end',
        timer: 3000,
        showConfirmButton: false,
        timerProgressBar: true,
      });
      return;
    }
    try {
      const payload = {
        caja: cajaActual.id,
        tipo: tipo,
        monto: parseFloat(monto),
        descripcion: descripcion
      };
      const res = await api.post(`caja/movimientos/`, payload);
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        text: `Movimiento de ${tipo} registrado`,
        timer: 2000,
        showConfirmButton: false,
      });
      return res.data;
    } catch (error) {
      console.error('Error registrando movimiento:', error);
    }
  };


  const calcularCambio = () => {
    const pago = parseFloat(montoPagado) || 0;
    const totalPedido = modoCuentaRapida ? calcularTotalRapido() : (pedidoMesa?.total || 0);
    return pago - totalPedido;
  };

  const procesarVenta = async () => {
    // Validación para cuenta rápida
    if (modoCuentaRapida) {
      if (carritoRapido.length === 0) {
        Swal.fire({
          icon: 'warning',
          title: 'Sin productos',
          text: 'Agrega productos antes de procesar el pago',
          confirmButtonColor: '#f97316'
        });
        return;
      }
      
      if (metodoPago === 'efectivo' && calcularCambio() < 0) {
        Swal.fire({
          icon: 'warning',
          title: 'Monto insuficiente',
          text: 'El monto pagado es insuficiente',
          confirmButtonColor: '#f97316'
        });
        return;
      }
      
      setProcesando(true);
      try {
        const detalles = carritoRapido.map(item => ({
          producto: item.id,
          cantidad: item.cantidad,
          precio_unitario: item.precio
        }));

        const ventaData = {
          total: calcularTotalRapido(),
          metodo_pago: metodoPago,
          detalles: detalles
        };

        await api.post('/ventas/', ventaData);
        notificarPedidoPagado(pedidoMesa?.id);
        
        setDialogPago(false);
        setDialogExito(true);
        
        setTimeout(() => {
          setDialogExito(false);
          cancelarCuentaRapida();
          setMontoPagado('');
          setMetodoPago('efectivo');
        }, 2000);

      } catch (error) {
        console.error('Error procesando venta:', error);
        const mensaje = error.response?.data?.non_field_errors?.[0] || error.response?.data?.detail || 'Error al procesar la venta';
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: mensaje,
          confirmButtonColor: '#f97316'
        });
      } finally {
        setProcesando(false);
      }
      return;
    }
    
    // Validación para pedido de mesa
    if (!pedidoMesa || !pedidoMesa.detalles || pedidoMesa.detalles.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Sin productos',
        text: 'Esta mesa no tiene productos en su pedido',
        confirmButtonColor: '#f97316'
      });
      return;
    }

    if (metodoPago === 'efectivo' && calcularCambio() < 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Monto insuficiente',
        text: 'El monto pagado es insuficiente',
        confirmButtonColor: '#f97316'
      });
      return;
    }

    setProcesando(true);
    try {
      const detalles = pedidoMesa.detalles.map(item => ({
        producto: item.producto.id,
        cantidad: item.cantidad,
        precio_unitario: item.producto.precio
      }));

      const ventaData = {
        total: pedidoMesa.total,
        metodo_pago: metodoPago,
        detalles: detalles,
        pedido: pedidoMesa.id
      };

      await api.post('/ventas/', ventaData);
      notificarPedidoPagado(pedidoMesa?.id);
      
      // El backend automáticamente cierra el pedido y libera la mesa
      
      setDialogPago(false);
      setDialogExito(true);
      
      // Limpiar después de 2 segundos y recargar mesas
      setTimeout(() => {
        setDialogExito(false);
        setMesaSeleccionadaLocal(null);
        setPedidoMesa(null);
        setMontoPagado('');
        setMetodoPago('efectivo');
        cargarMesasConCuentas();
      }, 2000);

    } catch (error) {
      console.error('Error procesando venta:', error);
      const mensaje = error.response?.data?.non_field_errors?.[0] || error.response?.data?.detail || 'Error al procesar la venta';
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: mensaje,
        confirmButtonColor: '#f97316'
      });
    } finally {
      setProcesando(false);
    }
  };

  const abrirDialogPago = () => {
    if (modoCuentaRapida) {
      if (carritoRapido.length === 0) {
        Swal.fire({
          icon: 'warning',
          title: 'Sin productos',
          text: 'Agrega productos antes de procesar el pago',
          confirmButtonColor: '#f97316'
        });
        return;
      }
      setMontoPagado(calcularTotalRapido().toFixed(2));
      setDialogPago(true);
      return;
    }
    
    if (!pedidoMesa || !pedidoMesa.detalles || pedidoMesa.detalles.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Sin productos',
        text: 'Selecciona una mesa con productos para procesar el pago',
        confirmButtonColor: '#f97316'
      });
      return;
    }
    setMontoPagado(pedidoMesa.total.toFixed(2));
    setDialogPago(true);
  };

  // Si está cargando
  if (cargandoCaja) {
    return (
      <div className="h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando estado de la caja...</p>
        </div>
      </div>
    );
  }

  // Si la caja no está abierta, mostrar pantalla de apertura
  if (!cajaAbierta) {
    return (
      <div className="h-[calc(100vh-80px)] flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="p-12">
            <div className="text-center">
              <Lock className="w-20 h-20 mx-auto mb-6 text-gray-300" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Caja Cerrada
              </h2>
              <p className="text-gray-600 mb-8">
                Abre la caja para comenzar a procesar ventas
              </p>
              
              {/* Selector de restaurante */}
              {restaurantes.length > 1 && (
                <div className="mb-6 text-left">
                  <label className="block text-sm font-medium mb-2">
                    Selecciona un restaurante
                  </label>
                  <select
                    className="w-full border rounded-md p-2"
                    value={restauranteSeleccionado || ''}
                    onChange={(e) => {
                      const restoId = parseInt(e.target.value);
                      setRestauranteSeleccionado(restoId);
                      localStorage.setItem('restaurante_id', restoId);
                    }}
                  >
                    <option value="">-- Selecciona --</option>
                    {restaurantes.map(resto => (
                      <option key={resto.id} value={resto.id}>
                        {resto.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              <Button 
                onClick={() => setDialogAbrirCaja(true)}
                className="bg-orange-500 hover:bg-orange-600 w-full h-12"
                disabled={!restauranteSeleccionado}
              >
                <Unlock className="w-5 h-5 mr-2" />
                Abrir Caja
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Dialog para abrir caja */}
        <Dialog open={dialogAbrirCaja} onOpenChange={setDialogAbrirCaja}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Abrir Caja</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Monto inicial
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={montoInicial}
                  onChange={(e) => setMontoInicial(e.target.value)}
                  placeholder="0.00"
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-1">
                  Ingresa el monto con el que inicias la caja
                </p>
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setDialogAbrirCaja(false);
                    setMontoInicial('');
                  }}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={abrirCaja}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  Abrir Caja
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Liberar mesa sin procesar pago
  const liberarMesa = async () => {
    if (!mesaSeleccionadaLocal || !pedidoMesa) {
      return;
    }

    const result = await Swal.fire({
      icon: 'warning',
      title: '¿Liberar mesa?',
      html: `
        <p>¿Deseas liberar la <strong>Mesa ${mesaSeleccionadaLocal.numero}</strong>?</p>
        <p class="text-sm text-gray-600 mt-2">El pedido será cancelado y la mesa quedará disponible.</p>
      `,
      showCancelButton: true,
      confirmButtonColor: '#f97316',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, liberar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        // Cerrar el pedido cambiando su estado a 'cerrado'
        await api.patch(`/pedidos/${pedidoMesa.id}/`, {
          estado: 'cerrado'
        });

        // Liberar la mesa cambiando su estado a 'disponible'
        await api.patch(`/mesas/${mesaSeleccionadaLocal.id}/`, {
          estado: 'disponible'
        });

        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: `Mesa ${mesaSeleccionadaLocal.numero} liberada`,
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true,
          background: '#d1fae5',
          iconColor: '#10b981',
          customClass: {
            title: 'text-green-800'
          }
        });

        // Limpiar selección y recargar mesas
        setMesaSeleccionadaLocal(null);
        setPedidoMesa(null);
        cargarMesasConCuentas();

      } catch (error) {
        console.error('Error liberando mesa:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.response?.data?.error || 'No se pudo liberar la mesa',
          confirmButtonColor: '#f97316'
        });
      }
    }
  };
    
  // Si la caja está abierta, mostrar el POS normal o cuenta rápida
  if (modoCuentaRapida) {
    return (
      <CuentaRapida
        onCancelar={cancelarCuentaRapida}
        onVentaExitosa={() => {
          Swal.fire({
            icon: 'success',
            title: '¡Venta exitosa!',
            text: 'La cuenta rápida se ha procesado correctamente',
            confirmButtonColor: '#f97316',
            timer: 2000,
            showConfirmButton: false
          });
        }}
      />
    );
  }

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col p-6">
      {/* Header con info de caja */}
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">
              <CreditCard className="inline-block w-8 h-8 text-orange-500 mr-3" />
              Caja / Punto de Venta
            </h2>
            <p className="text-gray-600 mt-1">Procesa las órdenes y pagos</p>
            
            {/* Botón para crear cuenta rápida */}
            {!modoCuentaRapida && (
              <Button
                onClick={iniciarCuentaRapida}
                className="mt-3 bg-green-600 hover:bg-green-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nueva Cuenta Rápida
              </Button>
            )}
            
            {modoCuentaRapida && (
              <div className="mt-3 flex items-center gap-2">
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                  Modo Cuenta Rápida Activo
                </span>
                <Button
                  onClick={cancelarCuentaRapida}
                  size="sm"
                  variant="outline"
                  className="text-red-600"
                >
                  Cancelar
                </Button>
              </div>
            )}
          </div>

          <div className="relative">
         
            {isOpenDrawer ? (
              <div className="absolute right-0 top-0 z-20 w-80 rounded-lg border border-gray-200 bg-white shadow-xl">
                <div className="flex items-center justify-between border-b px-4 py-3">
                  <h3 className="text-sm font-semibold text-gray-800">Registrar movimiento</h3>
                  <button
                    type="button"
                    onClick={handleCloseDrawer}
                    className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                    aria-label="Cerrar panel de movimientos"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <form onSubmit={submitMovimiento} className="space-y-4 p-4">
                  <div className='flex flex-row gap-4'>
                    <button
                      type="button"
                      onClick={() => setTipoMovimiento('entrada')}
                      className={`flex-1 px-3 py-2 rounded-l-md border ${
                        tipoMovimiento === 'entrada'
                          ? 'bg-green-500 text-white border-green-500'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Entrada
                    </button>
                    <button
                      type="button"
                      onClick={() => setTipoMovimiento('salida')}
                      className={`flex-1 px-3 py-2 rounded-r-md border ${
                        tipoMovimiento === 'salida'
                          ? 'bg-red-500 text-white border-red-500'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Salida
                    </button>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Monto</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={montoMovimiento}
                      onChange={(e) => setMontoMovimiento(e.target.value)}
                      placeholder="0.00"
                      className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-sm shadow-sm focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Descripción (opcional)</label>
                    <input
                      type="text"
                      value={descripcionMovimiento}
                      onChange={(e) => setDescripcionMovimiento(e.target.value)}
                      placeholder="Describe el movimiento"
                      className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-sm shadow-sm focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={handleCloseDrawer}>
                      Cancelar
                    </Button>
                    <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700">
                      Registrar
                    </Button>
                  </div>
                </form>
              </div>
            ) : null}
          </div>
          
          {/* Información de la caja abierta */}
          <Card className="min-w-[250px]">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Unlock className="w-4 h-4 text-green-500" />
                <span className="font-semibold text-green-600">Caja Abierta</span>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <p>Monto inicial: <span className="font-semibold">{formatearMonto(cajaActual?.monto_inicial)}</span></p>
                <p className="text-xs text-gray-500">
                  {new Date(cajaActual?.fecha_apertura).toLocaleString('es-ES')}
                </p>
              </div>            
              <div className='flex flex-row gap-2'>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={mostrarDialogoCierre}
                  className="w-full mt-3 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Lock className="w-3 h-3 mr-2" />
                </Button>
                  <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsOpenDrawer(true)}
                  className="w-full mt-3 text-orange-500 hover:text-orange-500 hover:bg-orange-50"
                >
                  <CircleDollarSign /> 
                  <ArrowLeftRight />
                  
                </Button>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 overflow-hidden">
        {/* Lista de mesas con cuentas abiertas - Solo mostrar si NO está en modo cuenta rápida */}
        {!modoCuentaRapida && (
          <div className="lg:col-span-1 flex flex-col">
            <Card className="flex-1 flex flex-col">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Receipt className="w-4 h-4" />
                  Cuentas Abiertas
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-auto p-3">
                {cargandoMesas ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                </div>
              ) : mesasConCuentas.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 text-center">
                  <Receipt className="w-12 h-12 mb-2" />
                  <p className="text-sm">No hay cuentas abiertas</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {mesasConCuentas.map((mesa) => (
                    <div
                      key={mesa.id}
                      onClick={() => seleccionarMesa(mesa)}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        mesaSeleccionadaLocal?.id === mesa.id
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-orange-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-gray-800">
                          Mesa {mesa.numero}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          mesa.estado === 'ocupada' 
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {mesa.estado}
                        </span>
                      </div>
                      {mesa.pedido && (
                        <div className="text-xs text-gray-600">
                          <p>Total: <span className="font-semibold text-orange-600">${mesa.pedido.total}</span></p>
                          <p className="text-gray-500">{mesa.pedido.detalles?.length || 0} items</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        )}
        
        {/* Panel de productos para cuenta rápida */}
        {modoCuentaRapida && (
          <div className="lg:col-span-1 flex flex-col">
            <Card className="flex-1 flex flex-col">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Search className="w-4 h-4" />
                  Productos
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-auto p-3">
                <Input
                  placeholder="Buscar producto..."
                  value={busquedaProducto}
                  onChange={(e) => setBusquedaProducto(e.target.value)}
                  className="mb-3"
                />
                <div className="space-y-2">
                  {productos
                    .filter(p => 
                      p.nombre.toLowerCase().includes(busquedaProducto.toLowerCase()) ||
                      p.descripcion?.toLowerCase().includes(busquedaProducto.toLowerCase())
                    )
                    .slice(0, 10)
                    .map((producto) => (
                      <div
                        key={producto.id}
                        onClick={() => agregarProductoCarrito(producto)}
                        className="p-3 rounded-lg border hover:border-orange-300 hover:bg-orange-50 cursor-pointer transition-all"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-semibold text-sm text-gray-800">{producto.nombre}</p>
                            {producto.descripcion && (
                              <p className="text-xs text-gray-500 line-clamp-1">{producto.descripcion}</p>
                            )}
                          </div>
                          <span className="text-orange-600 font-bold text-sm ml-2">
                            ${producto.precio}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Detalle del pedido de la mesa seleccionada o carrito rápido */}
        <div className="lg:col-span-2 flex flex-col">
          <Card className="flex-1 flex flex-col">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                {modoCuentaRapida ? 'Cuenta Rápida' : 'Detalle de Cuenta'}
                {mesaSeleccionadaLocal && !modoCuentaRapida && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={abrirPedidoConMesa}
                      className="ml-auto bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar Productos
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={liberarMesa}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Liberar Mesa
                    </Button>
                  </>
                )}
                {mesaSeleccionadaLocal && !modoCuentaRapida && (
                  <span className="text-sm font-normal bg-orange-100 text-orange-700 px-3 py-1 rounded">
                    Mesa {mesaSeleccionadaLocal.numero}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto p-4">
              {modoCuentaRapida ? (
                // Mostrar carrito rápido
                carritoRapido.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <ShoppingCart className="w-16 h-16 mb-4" />
                    <p className="text-lg">Carrito vacío</p>
                    <p className="text-sm">Selecciona productos para agregar</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {carritoRapido.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800">{item.nombre}</h4>
                          <p className="text-sm text-gray-600">
                            ${item.precio.toFixed(2)} c/u
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => decrementarCantidadRapida(item.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="w-12 text-center font-semibold">
                            {item.cantidad}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => incrementarCantidadRapida(item.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="text-right w-24">
                          <p className="font-bold text-lg text-gray-800">
                            ${(item.precio * item.cantidad).toFixed(2)}
                          </p>
                        </div>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removerProductoRapido(item.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                // Mostrar detalle de pedido de mesa
                !mesaSeleccionadaLocal ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <ShoppingCart className="w-16 h-16 mb-4" />
                    <p className="text-lg">Selecciona una mesa</p>
                    <p className="text-sm">para ver el detalle de su cuenta</p>
                  </div>
                ) : !pedidoMesa ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pedidoMesa.detalles && (() => {
                      // Agrupar productos por ID
                      const productosAgrupados = pedidoMesa.detalles.reduce((acc, item) => {
                        const productoId = item.producto.id;
                        if (!acc[productoId]) {
                          acc[productoId] = {
                            producto: item.producto,
                            cantidadTotal: 0,
                            subtotal: 0
                          };
                        }
                        acc[productoId].cantidadTotal += parseFloat(item.cantidad);
                        acc[productoId].subtotal += item.producto.precio * item.cantidad;
                        return acc;
                      }, {});

                      return Object.values(productosAgrupados).map((grupo, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-800">{grupo.producto.nombre}</h4>
                            <p className="text-sm text-gray-600">
                              ${grupo.producto.precio.toFixed(2)} c/u
                            </p>
                          </div>

                          <div className="text-center">
                            <span className="text-sm text-gray-500">Cantidad</span>
                            <p className="font-semibold text-lg">{grupo.cantidadTotal.toFixed(3)}</p>
                          </div>

                          <div className="text-right w-24">
                            <p className="font-bold text-lg text-gray-800">
                              ${grupo.subtotal.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                )
              )}
            </CardContent>
          </Card>
        </div>

        {/* Resumen y pago */}
        <div className="flex flex-col gap-4">
          {/* Resumen */}
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                Resumen
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {modoCuentaRapida ? (
                // Resumen para cuenta rápida
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Productos:</span>
                    <span className="font-medium">{carritoRapido.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Items:</span>
                    <span className="font-medium">
                      {carritoRapido.reduce((sum, item) => sum + item.cantidad, 0)}
                    </span>
                  </div>
                  <div className="border-t pt-3 mt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold">Total:</span>
                      <span className="text-2xl font-bold text-orange-500">
                        ${calcularTotalRapido().toFixed(2)}
                      </span>
                    </div>
                  </div>
                </>
              ) : mesaSeleccionadaLocal && pedidoMesa ? (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Mesa:</span>
                    <span className="font-medium">#{mesaSeleccionadaLocal.numero}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Productos:</span>
                    <span className="font-medium">{pedidoMesa.detalles?.length || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Items:</span>
                    <span className="font-medium">
                      {pedidoMesa.detalles?.reduce((sum, item) => sum + item.cantidad, 0) || 0}
                    </span>
                  </div>
                  <div className="border-t pt-3 mt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold">Total:</span>
                      <span className="text-2xl font-bold text-orange-500">
                        ${pedidoMesa.total?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-4 text-gray-400 text-sm">
                  Selecciona una mesa para ver el resumen
                </div>
              )}
            </CardContent>
          </Card>

          {/* Botones de acción */}
          <div className="space-y-3">
            <Button
              className="w-full bg-orange-500 hover:bg-orange-600 h-14 text-lg"
              onClick={abrirDialogPago}
              disabled={modoCuentaRapida ? carritoRapido.length === 0 : (!pedidoMesa || !pedidoMesa.detalles || pedidoMesa.detalles.length === 0)}
            >
              <DollarSign className="w-5 h-5 mr-2" />
              Procesar Pago
            </Button>
            
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                if (modoCuentaRapida) {
                  cancelarCuentaRapida();
                } else {
                  setMesaSeleccionadaLocal(null);
                  setPedidoMesa(null);
                }
              }}
              disabled={modoCuentaRapida ? carritoRapido.length === 0 : !mesaSeleccionadaLocal}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {modoCuentaRapida ? 'Vaciar Carrito' : 'Limpiar Selección'}
            </Button>
          </div>
        </div>
      </div>

      {/* Dialog de Pago */}
      <Dialog
        open={dialogCierre}
        onOpenChange={(open) => {
          if (!open) {
            cerrarDialogoCierre();
          }
        }}

        className="overflow-auto"
      >
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Resumen de cierre de caja</DialogTitle>
          </DialogHeader>

          {cargandoResumen ? (
            <div className="py-10 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            </div>
          ) : errorResumen ? (
            <div className="space-y-4">
              <p className="text-sm text-red-600">{errorResumen}</p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={cerrarDialogoCierre}>
                  Cancelar
                </Button>
                <Button className="bg-orange-500 hover:bg-orange-600" onClick={obtenerResumenCaja}>
                  Reintentar
                </Button>
              </div>
            </div>
          ) : resumenCaja ? (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-gray-500">Ventas registradas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-gray-800">{formatearMonto(resumenCaja?.ventas?.total)}</p>
                    <p className="text-xs text-gray-500 mt-1">{resumenCaja?.ventas?.conteo || 0} tickets</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-gray-500">Ventas en efectivo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg font-semibold text-gray-700">{formatearMonto(resumenCaja?.ventas?.por_metodo?.efectivo)}</p>
                    <p className="text-xs text-gray-500">Incluye propinas en efectivo</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-gray-500">Ventas con tarjeta y otros</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg font-semibold text-gray-700">{formatearMonto((Number(resumenCaja?.ventas?.por_metodo?.tarjeta) || 0) + (Number(resumenCaja?.ventas?.por_metodo?.otros) || 0))}</p>
                    <p className="text-xs text-gray-500">Tarjeta: {formatearMonto(resumenCaja?.ventas?.por_metodo?.tarjeta)} · Otros: {formatearMonto(resumenCaja?.ventas?.por_metodo?.otros)}</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Detalle de ventas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {resumenCaja?.ventas?.detalle?.length ? (
                    <div className="max-h-56 overflow-y-auto divide-y border rounded-md">
                      {resumenCaja.ventas.detalle.map((venta) => (
                        <div key={venta.id} className="flex items-center justify-between px-4 py-3 text-sm">
                          <div className="flex-1 pr-3">
                            <p className="font-semibold text-gray-800">Venta #{venta.id}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(venta.created_at).toLocaleString('es-ES', {
                                day: '2-digit',
                                month: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                            {venta.pedido ? (
                              <p className="text-xs text-gray-500">Pedido asociado: {venta.pedido}</p>
                            ) : null}
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-800">{formatearMonto(venta.total)}</p>
                            <p className="text-xs uppercase tracking-wide text-gray-500">{venta.metodo_pago}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No hay ventas registradas aún.</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Movimientos manuales</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-4 text-sm">
                    <span className="text-green-600">Entradas: {formatearMonto(resumenCaja?.movimientos?.entradas)}</span>
                    <span className="text-red-600">Salidas: {formatearMonto(resumenCaja?.movimientos?.salidas)}</span>
                  </div>
                  {resumenCaja?.movimientos?.detalle?.length ? (
                    <div className="max-h-48 overflow-y-auto space-y-2 text-sm">
                      {resumenCaja.movimientos.detalle.map((mov) => (
                        <div key={mov.id} className="flex justify-between items-start border rounded-md px-3 py-2">
                          <div className="flex-1 pr-2">
                            <p className="font-medium capitalize text-gray-700">{mov.tipo}</p>
                            {mov.descripcion ? (
                              <p className="text-xs text-gray-500 mt-1">{mov.descripcion}</p>
                            ) : null}
                          </div>
                          <div className={`text-sm font-semibold ${mov.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                            {formatearMonto(mov.monto)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No hay movimientos manuales registrados.</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Resultado esperado en caja</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>Monto inicial: <span className="font-semibold">{formatearMonto(resumenCaja?.caja?.monto_inicial)}</span></p>
                  <p>+ Ventas en efectivo: <span className="font-semibold">{formatearMonto(resumenCaja?.ventas?.por_metodo?.efectivo)}</span></p>
                  <p>+ Entradas manuales: <span className="font-semibold">{formatearMonto(resumenCaja?.movimientos?.entradas)}</span></p>
                  <p>- Salidas manuales: <span className="font-semibold">{formatearMonto(resumenCaja?.movimientos?.salidas)}</span></p>
                  <p className="text-lg font-bold text-gray-800 pt-2">Monto final esperado: {formatearMonto(resumenCaja?.monto_final)}</p>
                  {resumenCaja?.generado_en && (
                    <p className="text-xs text-gray-500">
                      Cortado al {new Date(resumenCaja.generado_en).toLocaleString('es-ES')}
                    </p>
                  )}
                </CardContent>
              </Card>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={obtenerResumenCaja}>
                  Actualizar resumen
                </Button>
                <Button
                  onClick={cerrarCaja}
                  className="bg-red-600 hover:bg-red-700"
                  disabled={cerrandoCaja}
                >
                  {cerrandoCaja ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Cerrando...
                    </span>
                  ) : (
                    'Confirmar cierre'
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No hay información disponible del resumen.</p>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={dialogPago} onOpenChange={setDialogPago}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Procesar Pago</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Total a pagar */}
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <p className="text-sm text-gray-600">Total a pagar</p>
              <p className="text-3xl font-bold text-orange-600">
                ${modoCuentaRapida ? calcularTotalRapido().toFixed(2) : (pedidoMesa?.total?.toFixed(2) || '0.00')}
              </p>
            </div>

            {/* Método de pago */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Método de pago
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={metodoPago === 'efectivo' ? 'default' : 'outline'}
                  onClick={() => setMetodoPago('efectivo')}
                  className={metodoPago === 'efectivo' ? 'bg-orange-500' : ''}
                >
                  💵 Efectivo
                </Button>
                <Button
                  type="button"
                  variant={metodoPago === 'tarjeta' ? 'default' : 'outline'}
                  onClick={() => setMetodoPago('tarjeta')}
                  className={metodoPago === 'tarjeta' ? 'bg-orange-500' : ''}
                >
                  💳 Tarjeta
                </Button>
              </div>
            </div>

            {/* Monto pagado (solo efectivo) */}
            {metodoPago === 'efectivo' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Monto recibido
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={montoPagado}
                    onChange={(e) => setMontoPagado(e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                {/* Cambio */}
                {montoPagado && (
                  <div className={`p-4 rounded-lg ${calcularCambio() >= 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    <p className="text-sm text-gray-600">Cambio</p>
                    <p className={`text-2xl font-bold ${calcularCambio() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${Math.abs(calcularCambio()).toFixed(2)}
                      {calcularCambio() < 0 && ' (insuficiente)'}
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Botones */}
            <div className="flex gap-2 justify-end pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setDialogPago(false)}
                disabled={procesando}
              >
                Cancelar
              </Button>
              <Button 
                onClick={procesarVenta}
                className="bg-green-600 hover:bg-green-700"
                disabled={procesando || (metodoPago === 'efectivo' && calcularCambio() < 0)}
              >
                {procesando ? 'Procesando...' : 'Confirmar Pago'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Éxito */}
      <Dialog open={dialogExito} onOpenChange={setDialogExito}>
        <DialogContent className="sm:max-w-md">
          <div className="text-center py-6">
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              ¡Pago Exitoso!
            </h3>
            <p className="text-gray-600">
              La venta se ha procesado correctamente
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}