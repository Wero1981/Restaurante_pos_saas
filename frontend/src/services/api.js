//Service/api.js
import axios from 'axios';
import Swal from 'sweetalert2';

const api = axios.create({
  baseURL: 'http://localhost:8000/api', // Base URL for the API
  timeout: 10000, // Request timeout
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token && token !== 'null' && token !== 'undefined') {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Agregar ID del restaurante si existe (opcional con la nueva implementación)
  const user = localStorage.getItem('user');
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
    if (error.response && error.response.status === 401) {
      
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
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
      