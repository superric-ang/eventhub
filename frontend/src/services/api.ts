import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data: any) => api.put('/auth/profile', data),
};

export const eventAPI = {
  getAll: (params?: any) => api.get('/events', { params }),
  getById: (id: string) => api.get(`/events/${id}`),
  create: (data: FormData) =>
    api.post('/events', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  update: (id: string, data: any) => api.put(`/events/${id}`, data),
  delete: (id: string) => api.delete(`/events/${id}`),
  toggleSave: (id: string) => api.post(`/events/${id}/save`),
  getCategories: () => api.get('/events/categories'),
};

export const orderAPI = {
  create: (data: any) => api.post('/orders', data),
  getAll: (params?: any) => api.get('/orders', { params }),
  getByOrderNumber: (orderNumber: string) => api.get(`/orders/${orderNumber}`),
  checkIn: (orderNumber: string) => api.put(`/orders/${orderNumber}/checkin`),
  cancel: (id: string) => api.put(`/orders/${id}/cancel`),
};

export const promoAPI = {
  create: (data: any) => api.post('/promos', data),
  validate: (params: any) => api.get('/promos/validate', { params }),
};

export default api;
