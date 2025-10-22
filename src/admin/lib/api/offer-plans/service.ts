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
    try {
      const response = await apiClient.get<VendorPlansListResponse>(BASE_URL);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  createPlan: async (plan: CreateVendorPlanRequest) => {
    try {
      const response = await apiClient.post<VendorPlanResponse>(BASE_URL, plan);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  updatePlan: async (planId: number, plan: UpdateVendorPlanRequest) => {
    try {
      const response = await apiClient.put<VendorPlanResponse>(`${BASE_URL}/${planId}`, plan);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  deletePlan: async (planId: number) => {
    try {
      const response = await apiClient.delete(`${BASE_URL}/${planId}`);
      return response.data;
    } catch (error: any) {
      // Extract error message from response
      const errorMessage = error.response?.data?.message 
        || error.response?.data?.error 
        || error.message 
        || 'Failed to delete plan';
      
      // Create a more detailed error object
      const detailedError = new Error(errorMessage);
      (detailedError as any).status = error.response?.status;
      (detailedError as any).details = error.response?.data;
      
      throw detailedError;
    }
  }
};

export default vendorPlanService;