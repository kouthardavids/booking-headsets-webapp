import axios from "axios";
import { getAccessToken, clearAccessToken, setAccessToken } from "./authToken.js";

export const API_BASE_URL = `${import.meta.env.VITE_BACKEND_URL}/api`;

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

// Add request interceptor to include auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh the token using the HTTP-only cookie
        const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {}, {
          withCredentials: true
        });
        
        if (response.data.accessToken) {
          const { accessToken } = response.data;
          setAccessToken(accessToken);
          // Retry the original request
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return axiosInstance(originalRequest);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        clearAccessToken();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export const api = {
  getAvailableHeadsets: async () => {
    const res = await axiosInstance.get("/headsets/available");
    return res.data;
  },

  getTotalHeadsets: async () => {
    const res = await axiosInstance.get("/headsets/total");
    return res.data;
  },

  getUnavailableHeadsets: async () => {
    const res = await axiosInstance.get("/headsets/unavailable");
    return res.data;
  },

  getAllHeadsets: async () => {
    const res = await axiosInstance.get("/headsets/all");
    return res.data;
  },

  bookHeadset: async (userId, headsetId) => {
    const res = await axiosInstance.post("/requests/book", { userId, headsetId });
    return res.data;
  },

  returnHeadset: async (userId, headsetId) => {
    const res = await axiosInstance.post("/requests/return", { userId, headsetId });
    return res.data;
  },

  getRecentRequests: async (limit = 4) => {
    const res = await axiosInstance.get(`/requests/recent?limit=${limit}`);
    return res.data;
  },

  getAllRequests: async () => {
    const res = await axiosInstance.get("/requests/all");
    return res.data;
  },

  getUserActiveBooking: async () => {
    const res = await axiosInstance.get("/requests/user-active");
    return res.data;
  },
};