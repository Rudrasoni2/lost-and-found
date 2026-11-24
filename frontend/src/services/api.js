import axios from 'axios';

export const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const getImageUrl = (filePath) => {
  if (!filePath) return '';
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }
  const cleanPath = filePath.startsWith('/') ? filePath : `/${filePath}`;
  return `${API_BASE_URL}${cleanPath}`;
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    if (!config.headers) {
      config.headers = {};
    }
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

api.interceptors.response.use((response) => response.data, (error) => {
  if (error.response?.status === 401) {
    localStorage.removeItem('token');
    if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
      const redirectUrl = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/login?redirect=${redirectUrl}`;
    }
  }
  return Promise.reject(error.response?.data || error);
});

export const login = (data) => {
  const formData = new URLSearchParams();
  formData.append('username', data.email);
  formData.append('password', data.password);
  return api.post('/api/auth/login', formData, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });
};
export const register = (data) => api.post('/api/auth/register', data);
export const getMe = () => api.get('/api/auth/me');

export const getItems = (params) => api.get('/api/items', { params });
export const getItem = (id) => api.get(`/api/items/${id}`);
export const getMyItems = () => api.get('/api/items/my');
export const createItem = (formData) => api.post('/api/items', formData);
export const updateItem = (id, data) => api.patch(`/api/items/${id}`, data);
export const deleteItem = (id) => api.delete(`/api/items/${id}`);

export const getMatches = (itemId) => api.get(`/api/items/${itemId}/matches`);
export const findMatches = (itemId) => api.post(`/api/items/${itemId}/find-matches`);
export const getExpertMatches = (itemId) => api.get(`/api/items/${itemId}/expert-matches`);

export const sendMessage = (data) => api.post('/api/messages', data);
export const getConversations = () => api.get('/api/messages/conversations');
export const getMessages = (userId, itemId) => api.get(`/api/messages/conversation/${userId}`, { params: itemId ? { item_id: itemId } : {} });

export const getNotifications = () => api.get('/api/notifications');
export const markNotificationRead = (id) => api.patch(`/api/notifications/${id}/read`);
export const markAllNotificationsRead = () => api.patch('/api/notifications/read-all');
export const getUnreadCount = () => api.get('/api/notifications/unread-count');

export const getAdminStats = () => api.get('/api/admin/stats');
export const getAdminUsers = (params) => api.get('/api/admin/users', { params });
export const updateAdminUser = (id, data) => api.patch(`/api/admin/users/${id}`, data);
export const deleteAdminUser = (id) => api.delete(`/api/admin/users/${id}`);
export const getAdminItems = (params) => api.get('/api/admin/items', { params });
export const deleteAdminItem = (id) => api.delete(`/api/admin/items/${id}`);

export default api;
