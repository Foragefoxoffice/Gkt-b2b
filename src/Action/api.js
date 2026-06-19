import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (originalRequest.url === '/auth/refresh-token') {
        return Promise.reject(error);
      }
      
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (refreshToken) {
        try {
          const res = await axios.post(`${API_URL}/auth/refresh-token`, { refreshToken });
          if (res.data.success && res.data.data.accessToken) {
            localStorage.setItem('token', res.data.data.accessToken);
            if (res.data.data.refreshToken) {
              localStorage.setItem('refreshToken', res.data.data.refreshToken);
            }
            originalRequest.headers.Authorization = `Bearer ${res.data.data.accessToken}`;
            return api(originalRequest);
          }
        } catch (refreshError) {
          console.error('Refresh token failed:', refreshError);
        }
      }
      
      // Clear storage and redirect on session expiry
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const loginApi = (data) => api.post('/auth/login', data);
export const verifyOtpApi = (data) => api.post('/auth/verify-otp', data);

// Dashboard APIs
export const getAdminDashboardApi = () => api.get('/dashboard/admin');
export const getBuyerDashboardApi = () => api.get('/dashboard/buyer');

// Firm APIs
export const getFirmsApi = () => api.get('/firms');
export const createFirmApi = (data) => api.post('/firms', data, { headers: { 'Content-Type': 'multipart/form-data' } });
export const updateFirmApi = (id, data) => api.put(`/firms/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
export const deleteFirmApi = (id) => api.delete(`/firms/${id}`);

// Buyer APIs
export const getBuyersApi = () => api.get('/buyers');
export const createBuyerApi = (data) => api.post('/buyers', data);
export const updateBuyerApi = (id, data) => api.put(`/buyers/${id}`, data);
export const deleteBuyerApi = (id) => api.delete(`/buyers/${id}`);

// Category APIs
export const getCategoriesApi = () => api.get('/categories');
export const createCategoryApi = (data) => api.post('/categories', data);
export const updateCategoryApi = (id, data) => api.put(`/categories/${id}`, data);
export const deleteCategoryApi = (id) => api.delete(`/categories/${id}`);

// Weaver APIs
export const getWeaversApi = () => api.get('/weavers');
export const createWeaverApi = (data) => api.post('/weavers', data);
export const updateWeaverApi = (id, data) => api.put(`/weavers/${id}`, data);
export const assignDesignToLoomApi = (weaverId, loomId, data) => api.put(`/weavers/${weaverId}/looms/${loomId}/assign`, data);
export const deleteWeaverApi = (id) => api.delete(`/weavers/${id}`);

// Design APIs
export const getDesignsApi = () => api.get('/designs');
export const getDesignByIdApi = (id) => api.get(`/designs/${id}`);
export const createDesignApi = (data) => api.post('/designs', data, { headers: { 'Content-Type': 'multipart/form-data' } });
export const updateDesignApi = (id, data) => api.put(`/designs/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
export const deleteDesignApi = (id) => api.delete(`/designs/${id}`);

// Transporter APIs
export const getTransportersApi = () => api.get('/transporters');
export const createTransporterApi = (data) => api.post('/transporters', data);
export const updateTransporterApi = (id, data) => api.put(`/transporters/${id}`, data);
export const deleteTransporterApi = (id) => api.delete(`/transporters/${id}`);

// Cart APIs
export const getCartApi = () => api.get('/cart');
export const addToCartApi = (data) => api.post('/cart/add', data);
export const updateCartItemApi = (itemId, data) => api.put(`/cart/update/${itemId}`, data);
export const removeCartItemApi = (itemId) => api.delete(`/cart/remove/${itemId}`);

// Order APIs
export const getOrdersApi = () => api.get('/orders');
export const getOrderByIdApi = (id) => api.get(`/orders/${id}`);
export const createOrderApi = (data) => api.post('/orders', data);
export const updateOrderStatusApi = (id, data) => api.put(`/orders/${id}/status`, data);

// Dispatch APIs
export const getDispatchesApi = (params) => api.get('/dispatches', { params });
export const createDispatchApi = (data) => api.post('/dispatches', data, { headers: { 'Content-Type': 'multipart/form-data' } });
export const updateDispatchStatusApi = (id, data) => api.put(`/dispatches/${id}/status`, data);

export default api;
