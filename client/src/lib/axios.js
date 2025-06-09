import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
});

// Interceptor para agregar el token a todas las solicitudes
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Si el error es 401 y no es una solicitud de refresh token
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url.includes('users/login/')) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Intentar renovar el token
        const response = await api.post('/api/users/login/', {
          refresh: refreshToken
        });

        const { access } = response.data;
        localStorage.setItem('token', access);

        // Actualizar el token en la solicitud original
        originalRequest.headers['Authorization'] = `Bearer ${access}`;
        
        // Reintentar la solicitud original
        return api(originalRequest);
      } catch (refreshError) {
        // Si falla la renovación, limpiar el almacenamiento y redirigir al login
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api; 