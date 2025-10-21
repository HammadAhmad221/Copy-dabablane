import axios from 'axios';
import { AddOn, AddOnResponse } from './types';

const BASE_URL = 'https://dev.dabablane.com/api/back/v1/admin/subscriptions/add-ons';

// Create axios instance with default config
const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer 666|4s6ttd05NEXXPesmwPw78cJdKHYFEVf2DNKpNSRl346a613d'
    }
});

export const addOnsApi = {
    // Get all add-ons
    getAllAddOns: async (): Promise<AddOnResponse> => {
        const response = await api.get('');
        return response.data;
    },

    // Create new add-on
    createAddOn: async (addOn: AddOn): Promise<AddOnResponse> => {
        const response = await api.post('', addOn);
        return response.data;
    },

    // Update existing add-on
    updateAddOn: async (id: number, addOn: AddOn): Promise<AddOnResponse> => {
        const response = await api.put(`/${id}`, addOn);
        return response.data;
    },

    // Delete add-on
    deleteAddOn: async (id: number): Promise<AddOnResponse> => {
        const response = await api.delete(`/${id}`);
        return response.data;
    },
};