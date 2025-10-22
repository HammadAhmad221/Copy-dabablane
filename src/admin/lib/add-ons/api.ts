import axios from 'axios';
import { AddOn, AddOnResponse } from './types';

const BASE_URL = 'https://dev.dabablane.com/api/back/v1/admin/subscriptions/add-ons';

// Create axios instance with default config
const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor to add dynamic auth token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Add response interceptor for better error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        throw error;
    }
);

export const addOnsApi = {
    // Get all add-ons
    getAllAddOns: async (): Promise<AddOnResponse> => {
        try {
            const response = await api.get('');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Create new add-on
    createAddOn: async (addOn: AddOn): Promise<AddOnResponse> => {
        try {
            const response = await api.post('', addOn);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Update existing add-on
    updateAddOn: async (id: number, addOn: AddOn): Promise<AddOnResponse> => {
        try {
            const response = await api.put(`/${id}`, addOn);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Delete add-on
    deleteAddOn: async (id: number): Promise<AddOnResponse> => {
        try {
            const response = await api.delete(`/${id}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },
};