import { adminApiClient as apiClient } from '../client';
import BACK_COSTOMER_ENDPOINTS from '../endpoints/customer';
import { CostomerResponse } from '../types/customer';
import { toast } from 'react-hot-toast';

export const CustomerService = {
  getAll: async () => {
    try {
      const response = await apiClient.get<CostomerResponse>(
        BACK_COSTOMER_ENDPOINTS.GetAll(),
        { 
          params: {
            paginationSize: 9999 // Get all records
          }
        }
      );
      return response.data;
    } catch (error) {
      toast.error('Failed to fetch customers');
      throw error;
    }
  }
};

export default CustomerService;
