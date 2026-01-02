import { useState } from 'react';
import api from '../services/api';
import { usePOS } from '../context/POSContext';
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
  CheckCircle
} from "lucide-react";

export default function Caja() {
  const { 
    mesaSeleccionada, 
    carrito, 
    total, 
    incrementarCantidad,
    decrementarCantidad,
    removerDelCarrito,
    resetearPOS 
  } = usePOS();

  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [dialogPago, setDialogPago] = useState(false);
  const [dialogExito, setDialogExito] = useState(false);
  const [montoPagado, setMontoPagado] = useState('');
  const [procesando, setProcesando] = useState(false);

  const calcularCambio = () => {
    const pago = parseFloat(montoPagado) || 0;
    return pago - total;
  };

  const procesarVenta = async () => {
    if (carrito.length === 0) {
      alert('El carrito está vacío');
      return;
    }

    if (metodoPago === 'efectivo' && calcularCambio() < 0) {
      alert('El monto pagado es insuficiente');
      return;
    }

    setProcesando(true);
    try {
      const detalles = carrito.map(item => ({
        producto: item.id,
        cantidad: item.cantidad,
        precio_unitario: item.precio
      }));

      const ventaData = {
        total: total,
        metodo_pago: metodoPago,
        detalles: detalles
      };

      await api.post('/ventas/', ventaData);
      
      setDialogPago(false);
      setDialogExito(true);
      
      // Limpiar después de 2 segundos
      setTimeout(() => {
        setDialogExito(false);
        resetearPOS();
        setMontoPagado('');
        setMetodoPago('efectivo');
      }, 2000);

    } catch (error) {
      console.error('Error procesando venta:', error);
      alert('Error al procesar la venta');
    } finally {
      setProcesando(false);
    }
  };

  const abrirDialogPago = () => {
    if (carrito.length === 0) {
      alert('El carrito está vacío');
      return;
    }
    setMontoPagado(total.toFixed(2));
    setDialogPago(true);
  };

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-800">
          <CreditCard className="inline-block w-8 h-8 text-orange-500 mr-3" />
          Caja / Punto de Venta
        </h2>
        <p className="text-gray-600 mt-1">Procesa las órdenes y pagos</p>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
        {/* Carrito de compras */}
        <div className="lg:col-span-2 flex flex-col">
          <Card className="flex-1 flex flex-col">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Orden Actual
                {mesaSeleccionada && (
                  <span className="ml-auto text-sm font-normal bg-orange-100 text-orange-700 px-3 py-1 rounded">
                    Mesa {mesaSeleccionada.numero}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto p-4">
              {carrito.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <ShoppingCart className="w-16 h-16 mb-4" />
                  <p className="text-lg">El carrito está vacío</p>
                  <p className="text-sm">Agrega productos desde el módulo de Productos</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {carrito.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800">{item.nombre}</h4>
                        <p className="text-sm text-gray-600">
                          ${item.precio.toFixed(2)} c/u
                        </p>
                      </div>

                      {/* Controles de cantidad */}
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => decrementarCantidad(item.id)}
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
                          onClick={() => incrementarCantidad(item.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Subtotal */}
                      <div className="text-right w-24">
                        <p className="font-bold text-lg text-gray-800">
                          ${(item.precio * item.cantidad).toFixed(2)}
                        </p>
                      </div>

                      {/* Eliminar */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removerDelCarrito(item.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
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
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Productos:</span>
                <span className="font-medium">{carrito.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Items:</span>
                <span className="font-medium">
                  {carrito.reduce((sum, item) => sum + item.cantidad, 0)}
                </span>
              </div>
              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-2xl font-bold text-orange-500">
                    ${total.toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botones de acción */}
          <div className="space-y-3">
            <Button
              className="w-full bg-orange-500 hover:bg-orange-600 h-14 text-lg"
              onClick={abrirDialogPago}
              disabled={carrito.length === 0}
            >
              <DollarSign className="w-5 h-5 mr-2" />
              Procesar Pago
            </Button>
            
            <Button
              variant="outline"
              className="w-full"
              onClick={() => resetearPOS()}
              disabled={carrito.length === 0}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Cancelar Orden
            </Button>
          </div>
        </div>
      </div>

      {/* Dialog de Pago */}
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
                ${total.toFixed(2)}
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

