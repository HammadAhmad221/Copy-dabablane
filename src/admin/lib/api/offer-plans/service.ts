import { adminApiClient as apiClient } from '../client';
import {
  CreateVendorPlanRequest,
  UpdateVendorPlanRequest,
  VendorPlanResponse,
  VendorPlansListResponse,
} from './types';

const BASE_URL = '/back/v1/admin/subscriptions/plans';

interface VendorPlanService {
  getAllPlans: () => Promise<VendorPlansListResponse>;
  createPlan: (plan: CreateVendorPlanRequest) => Promise<VendorPlanResponse>;
  updatePlan: (planId: number, plan: UpdateVendorPlanRequest) => Promise<VendorPlanResponse>;
  deletePlan: (planId: number) => Promise<void>;
}

export const vendorPlanService: VendorPlanService = {
  getAllPlans: async () => {
    const fullUrl = apiClient.defaults.baseURL + BASE_URL;
    console.log('Making request to:', fullUrl);
    try {
      console.log('Request headers:', apiClient.defaults.headers);
      const response = await apiClient.get<VendorPlansListResponse>(BASE_URL);
      console.log('API Response:', response);
      return response.data;
    } catch (error: any) {
      console.error('API Error Details:', {
        config: error.config,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  },

  createPlan: async (plan: CreateVendorPlanRequest) => {
    try {
      const response = await apiClient.post<VendorPlanResponse>(BASE_URL, plan);
      return response.data;
    } catch (error: any) {
      console.error('Error creating plan:', error);
      throw error;
    }
  },

  updatePlan: async (planId: number, plan: UpdateVendorPlanRequest) => {
    try {
      const response = await apiClient.put<VendorPlanResponse>(`${BASE_URL}/${planId}`, plan);
      return response.data;
    } catch (error: any) {
      console.error('Error updating plan:', error);
      throw error;
    }
  },

  deletePlan: async (planId: number) => {
    try {
      await apiClient.delete(`${BASE_URL}/${planId}`);
    } catch (error: any) {
      console.error('Error deleting plan:', error);
      throw error;
    }
  }
};

export default vendorPlanService;