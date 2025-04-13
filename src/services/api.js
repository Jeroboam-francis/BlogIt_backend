
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for adding token to requests
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

// Auth API
export const authApi = {
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },
  
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
  
  getProfile: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

// Blog API
export const blogApi = {
  getBlogs: async (params) => {
    const response = await api.get('/blogs', { params });
    return response.data;
  },
  
  getBlogById: async (id) => {
    const response = await api.get(`/blogs/${id}`);
    return response.data;
  },
  
  createBlog: async (blogData) => {
    const response = await api.post('/blogs', blogData);
    return response.data;
  },
  
  updateBlog: async (id, blogData) => {
    const response = await api.put(`/blogs/${id}`, blogData);
    return response.data;
  },
  
  deleteBlog: async (id) => {
    const response = await api.delete(`/blogs/${id}`);
    return response.data;
  },
  
  toggleLike: async (id) => {
    const response = await api.post(`/blogs/${id}/like`);
    return response.data;
  },
};

export default api;