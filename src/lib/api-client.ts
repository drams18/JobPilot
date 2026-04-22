import axios from 'axios';

export const apiClient = axios.create();

apiClient.interceptors.request.use((config) => {
  // Prepend /api to relative paths so hooks stay clean (e.g. /jobs → /api/jobs)
  if (config.url && !config.url.startsWith('http')) {
    const path = config.url.startsWith('/') ? config.url : `/${config.url}`;
    config.url = `/api${path}`;
  }
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);
