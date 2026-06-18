import { useCallback, useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import {
  CalendarDays,
  Check,
  CreditCard,
  Loader2,
  Store,
  Users,
  WalletCards,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePOS } from '@/context/POSContext';
import api from '@/services/api';


const formatCurrency = (value) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(Number(value || 0));

const formatDate = (value) => {
  if (!value) return 'Sin fecha';
  return new Date(`${value}T00:00:00`).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

export default function Suscripciones() {
  const { restauranteActivo } = usePOS();
  const [planes, setPlanes] = useState([]);
  const [suscripcion, setSuscripcion] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [seleccionando, setSeleccionando] = useState(null);
  const [pagando, setPagando] = useState(null);
  const [error, setError] = useState('');

  const cargarDatos = useCallback(async () => {
    if (!restauranteActivo?.id) {
      setPlanes([]);
      setSuscripcion(null);
      setError('Selecciona un restaurante en la barra superior.');
      setCargando(false);
      return;
    }

    setCargando(true);
    setError('');
    try {
      const [planesResponse, suscripcionResponse] = await Promise.all([
        api.get('/suscripciones/planes/'),
        api.get('/suscripciones/actual/'),
      ]);
      setPlanes(Array.isArray(planesResponse.data) ? planesResponse.data : []);
      setSuscripcion(suscripcionResponse.data || null);
    } catch (requestError) {
      console.error('Error cargando suscripción:', requestError);
      setError(
        requestError.response?.data?.detail ||
        'No se pudo cargar la información de suscripción.'
      );
    } finally {
      setCargando(false);
    }
  }, [restauranteActivo?.id]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const seleccionarPlan = async (plan) => {
    if (plan.id === suscripcion?.plan?.id) return;
    const esGratis = Number(plan.precio) <= 0;

    const confirmacion = await Swal.fire({
      icon: 'question',
      title: esGratis ? `Seleccionar plan ${plan.nombre}` : `Pagar plan ${plan.nombre}`,
      text: esGratis
        ? 'Tu fecha de prueba no cambiará.'
        : 'Te redirigiremos a Mercado Pago para completar la suscripción.',
      showCancelButton: true,
      confirmButtonText: esGratis ? 'Seleccionar' : 'Continuar al pago',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#f97316',
    });
    if (!confirmacion.isConfirmed) return;

    if (!esGratis) {
      setPagando(plan.id);
    } else {
      setSeleccionando(plan.id);
    }

    try {
      if (esGratis) {
        const response = await api.post('/suscripciones/seleccionar-plan/', {
          plan_id: plan.id,
        });
        setSuscripcion(response.data.suscripcion);
        Swal.fire({
          icon: 'success',
          title: 'Plan seleccionado',
          text: response.data.detail,
          confirmButtonColor: '#f97316',
        });
      } else {
        const response = await api.post('/suscripciones/mercadopago/crear/', {
          plan_id: plan.id,
        });
        if (response.data.checkout_url) {
          window.location.href = response.data.checkout_url;
          return;
        }
        setSuscripcion(response.data.suscripcion);
      }
    } catch (requestError) {
      Swal.fire({
        icon: 'error',
        title: Number(plan.precio) <= 0 ? 'No se pudo seleccionar el plan' : 'No se pudo iniciar el pago',
        text:
          requestError.response?.data?.plan_id?.[0] ||
          requestError.response?.data?.detail ||
          'Intenta nuevamente.',
        confirmButtonColor: '#f97316',
      });
    } finally {
      setSeleccionando(null);
      setPagando(null);
    }
  };

  if (cargando) {
    return (
      <div className="h-[calc(100vh-80px)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] p-6 bg-gray-50">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <WalletCards className="w-8 h-8 text-orange-500" />
            Planes y suscripción
          </h1>
          <p className="text-gray-600 mt-1">
            Administra el plan de {restauranteActivo?.nombre || 'tu restaurante'}.
          </p>
        </div>

        {error ? (
          <Card>
            <CardContent className="p-8 text-center text-amber-700">
              {error}
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-white">
              <CardContent className="p-6 grid gap-5 md:grid-cols-4">
                <div>
                  <p className="text-sm text-gray-500">Plan actual</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {suscripcion?.plan?.nombre || 'Sin plan'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Estado</p>
                  <p className={`font-semibold ${suscripcion?.esta_vencida ? 'text-red-600' : 'text-green-600'}`}>
                    {suscripcion?.esta_vencida ? 'Vencida' : 'Activa'}
                  </p>
                  {suscripcion?.estado_pago && (
                    <p className="text-xs text-gray-500 mt-1">
                      Pago: {suscripcion.estado_pago}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Días restantes</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {suscripcion?.dias_restantes ?? 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Vence</p>
                  <p className="font-semibold text-gray-800">
                    {formatDate(suscripcion?.vence)}
                  </p>
                </div>
              </CardContent>
            </Card>

            {suscripcion?.en_periodo_prueba && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 px-5 py-4 flex items-center gap-3 text-blue-800">
                <CalendarDays className="w-5 h-5 shrink-0" />
                Estás usando los 15 días gratuitos. Seleccionar otro plan no reinicia la prueba.
              </div>
            )}

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {planes.map((plan) => {
                const actual = plan.id === suscripcion?.plan?.id;
                const esGratis = Number(plan.precio) <= 0;
                return (
                  <Card
                    key={plan.id}
                    className={actual ? 'border-2 border-orange-500 shadow-md' : ''}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between gap-3">
                        <CardTitle className="text-xl">{plan.nombre}</CardTitle>
                        {actual && (
                          <span className="text-xs font-semibold text-orange-700 bg-orange-100 rounded-full px-3 py-1">
                            Plan actual
                          </span>
                        )}
                      </div>
                      <div className="pt-3">
                        <span className="text-3xl font-bold text-gray-900">
                          {formatCurrency(plan.precio)}
                        </span>
                        <span className="text-gray-500 text-sm"> / mes</span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3 text-sm text-gray-700">
                        <p className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-orange-500" />
                          Hasta {plan.limite_usuarios} usuarios
                        </p>
                        <p className="flex items-center gap-2">
                          <Store className="w-4 h-4 text-orange-500" />
                          {plan.limite_sucursales} sucursal(es)
                        </p>
                        <p className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-orange-500" />
                          {plan.limi_cajas} caja(s)
                        </p>
                      </div>
                      <Button
                        className="w-full"
                        variant={actual ? 'outline' : 'default'}
                        disabled={actual || seleccionando === plan.id || pagando === plan.id}
                        onClick={() => seleccionarPlan(plan)}
                      >
                        {seleccionando === plan.id || pagando === plan.id ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : actual ? (
                          <Check className="w-4 h-4 mr-2" />
                        ) : !esGratis ? (
                          <CreditCard className="w-4 h-4 mr-2" />
                        ) : null}
                        {actual ? 'Seleccionado' : esGratis ? 'Elegir plan' : 'Pagar con Mercado Pago'}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {!planes.length && (
              <Card>
                <CardContent className="p-8 text-center text-gray-500">
                  No hay planes activos configurados.
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
