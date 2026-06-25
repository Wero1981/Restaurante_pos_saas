//Service/api.js
import axios from 'axios';
import Swal from 'sweetalert2';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  timeout: 10000, // Request timeout
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token && token !== 'null' && token !== 'undefined') {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Agregar ID del restaurante si existe (opcional con la nueva implementación)
  const restauranteId = localStorage.getItem('restaurante_id');
  if (restauranteId) {
    config.headers['X-Restaurante-ID'] = restauranteId;
  }
  
  return config;
}, error => {
  return Promise.reject(error);
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 403 && error.response?.data?.codigo === 'SUSCRIPCION_VENCIDA') {
      const avisoKey = 'aviso_suscripcion_bloqueada';
      if (!sessionStorage.getItem(avisoKey)) {
        sessionStorage.setItem(avisoKey, '1');
        Swal.fire({
          icon: 'warning',
          title: 'Suscripción vencida',
          text: error.response.data.detail || 'Renueva tu suscripción para continuar.',
          confirmButtonText: 'Ver planes',
          confirmButtonColor: '#f97316',
        }).then(() => {
          if (window.location.pathname !== '/suscripcion') {
            window.location.href = '/suscripcion';
          }
        });
      } else if (window.location.pathname !== '/suscripcion') {
        window.location.href = '/suscripcion';
      }
    }

    if (error.response && error.response.status === 401) {
      
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('restaurante_id');
      localStorage.removeItem('restauranteActivo');
      
      Swal.fire({
        icon: 'warning',
        title: 'Session  caducada',
        text: 'Por favor, inicia sesión nuevamente.',
      }).then(() => {
        window.location.href = '/login'; 
      });
    }
    return Promise.reject(error);
  }
);

export default api;
