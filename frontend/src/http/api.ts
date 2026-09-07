
import axios from 'axios';
import useTokenStore from '@/store';

const api = axios.create({
    // todo: move this value to env variable.
    baseURL: import.meta.env.VITE_PUBLIC_BACKEND_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true
});

api.interceptors.request.use(async (config) => {
    // Add 3-second delay to every API call
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const token = useTokenStore.getState().token;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// login admin
export const login = async (data: { email: string; password: string }) => {
    const response = await api.post('/api/auth/login', data);
    return response.data;
};

// change password
export const changePassword = async (data: { oldPassword: string; newPassword: string }) => {
    const response = await api.post('/api/auth/change-password', data);
    return response.data;
};

// register admin or compliance
export const register = async (data: { name: string; email: string; password: string;  }) => {
    const endpoint = '/api/auth/register';
    const response = await api.post(endpoint, {
        name: data.name,
        email: data.email,
        password: data.password,
    });
    return response.data;
};

// forget password
export const forgetPassword = async (data: { email: string; }) =>
    api.post('/api/auth/forget-password-admin', data);

// verify otp
export const verifyOtp = async (data: { email: string; otp: string; newPassword: string, confirmPassword: string}) => 
    api.post('/api/auth/verify-otp', data);
    


interface PaginationParams {
  page?: number;
  limit?: number;
  filterStatus?: string;
}

// get all customers
export const getCustomers = async ({ page = 1, limit=20 }: PaginationParams = {}) => {
  const response = await api.get(`/api/list/all-customers?page=${page}&limit=${limit}`);
  return response.data;
};


// get all news
export const getNews = async ({ page = 1, limit=20 }: PaginationParams = {}) => {
  const response = await api.get(`/api/list/all-news?page=${page}&limit=${limit}`);
  return response.data;
};


export const logout = async () => {
  const response = await api.post('/api/auth/logout');
  return response.data;
};

