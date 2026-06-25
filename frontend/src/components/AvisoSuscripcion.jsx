// frontend/src/components/AvisoSuscripcion.jsx
import { useEffect } from 'react';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import { usePOS } from '@/context/POSContext';

export default function AvisoSuscripcion() {
  const navigate = useNavigate();
  const { suscripcion, cargarSuscripcion, userRol, restauranteActivo } = usePOS();

  useEffect(() => {
    if (userRol !== 'admin' || !restauranteActivo?.id) return;

    const revisarSuscripcion = async () => {
      const data = suscripcion || await cargarSuscripcion();
      if (!data) return;

      const dias = Number(data.dias_restantes);

      const requiereAvisoRenovacion =
        data.estado_pago === 'authorized' &&
        !data.esta_vencida &&
        dias > 0 &&
        dias <= 7;

      const requiereAvisoFinPrueba =
        data.estado_pago === 'trialing' &&
        !data.esta_vencida &&
        dias > 0 &&
        dias <= 7;

      if (!requiereAvisoRenovacion && !requiereAvisoFinPrueba) return;
      
      const avisoKey = `aviso_suscripcion_${data.id}_${data.dias_restantes}`;

      if(sessionStorage. getItem(avisoKey)) return;
      sessionStorage.setItem(avisoKey, '1');

      Swal.fire({
        icon: 'warning',
        title: requiereAvisoFinPrueba
          ? 'Tu prueba está por terminar'
          : 'Tu suscripción está por vencer',
        text: requiereAvisoFinPrueba
          ? `Te quedan ${dias} día${dias === 1 ? '' : 's'} de prueba. Elige un plan para continuar.`
          : `Te quedan ${dias} día${dias === 1 ? '' : 's'} de suscripción. Renueva tu plan para evitar interrupciones.`,
        showCancelButton: true,
        confirmButtonText: 'Ver planes',
        cancelButtonText: 'Después',
        confirmButtonColor: '#f97316',
      }).then((result) => {
        if (result.isConfirmed) {
          navigate('/suscripcion');
        }
      });
    };

    revisarSuscripcion();
  }, [suscripcion, cargarSuscripcion, userRol, restauranteActivo?.id, navigate]);

  return null;
}