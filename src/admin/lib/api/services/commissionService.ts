import { adminApiClient } from '../client';
import BACK_COMMISSION_ENDPOINTS from '../endpoints/commission';
import {
  Commission,
  CreateCommissionRequest,
  UpdateCommissionRequest,
  VendorCommissionRate,
  UpdateVendorRateRequest,
  GlobalCommissionSettings,
  UpdateGlobalSettingsRequest,
  CommissionListResponse,
} from '../types/commission';

export const commissionApi = {
  // Get all commissions with optional filters
  getAll: async (
    categoryId?: number,
    vendorId?: number,
    includeInactive?: boolean
  ): Promise<CommissionListResponse> => {
    try {
      const params = new URLSearchParams();
      if (categoryId) params.append('category_id', String(categoryId));
      if (vendorId) params.append('vendor_id', String(vendorId));
      if (includeInactive) params.append('include_inactive', String(includeInactive));

      console.log('📤 Fetching commissions:', `${BACK_COMMISSION_ENDPOINTS.getAll()}?${params.toString()}`);
      
      const response = await adminApiClient.get(
        `${BACK_COMMISSION_ENDPOINTS.getAll()}?${params.toString()}`
      );

      console.log('✅ Commissions response:', response.data);
      console.log('✅ Commissions response structure:', JSON.stringify(response.data, null, 2));
      console.log('✅ Response data type:', typeof response.data);
      console.log('✅ Is array?', Array.isArray(response.data));

      // Handle multiple response structures
      let commissionsData = [];
      let metaData = {
        total: 0,
        current_page: 1,
        last_page: 1,
        per_page: 10,
      };

      if (response.data) {
        // Structure 1: { data: [...], meta: {...} }
        if (response.data.data && Array.isArray(response.data.data)) {
          commissionsData = response.data.data;
          if (response.data.meta) {
            metaData = response.data.meta;
          } else {
            metaData.total = commissionsData.length;
          }
        }
        // Structure 2: Direct array
        else if (Array.isArray(response.data)) {
          commissionsData = response.data;
          metaData.total = commissionsData.length;
        }
        // Structure 3: { commissions: [...], total: X }
        else if (response.data.commissions && Array.isArray(response.data.commissions)) {
          commissionsData = response.data.commissions;
          metaData.total = response.data.total || commissionsData.length;
        }
        // Structure 4: { results: [...], count: X }
        else if (response.data.results && Array.isArray(response.data.results)) {
          commissionsData = response.data.results;
          metaData.total = response.data.count || commissionsData.length;
        }
        // Structure 5: Wrapped object with status/code
        else if (response.data.status && response.data.data) {
          if (Array.isArray(response.data.data)) {
            commissionsData = response.data.data;
            metaData.total = commissionsData.length;
          }
        }
      }

      console.log('✅ Extracted commissions data:', commissionsData);
      console.log('✅ Extracted commissions count:', commissionsData.length);
      console.log('✅ Extracted meta data:', metaData);

      return {
        data: commissionsData,
        meta: metaData,
      };
    } catch (error) {
      console.error('❌ Error fetching commissions:', error);
      throw error;
    }
  },

  // Create new commission
  create: async (data: CreateCommissionRequest): Promise<Commission> => {
    try {
      // Ensure category_id and vendor_id are explicitly included (even if null)
      const payload: any = {
        commission_rate: data.commission_rate,
        is_active: data.is_active !== false,
      };

      // Explicitly set category_id and vendor_id (null if not provided)
      payload.category_id = data.category_id ?? null;
      payload.vendor_id = data.vendor_id ?? null;

      // Include optional fields
      if (data.partial_commission_rate !== undefined) {
        payload.partial_commission_rate = data.partial_commission_rate;
      }

      console.log('📤 Creating commission:', payload);
      console.log('📤 Request payload JSON:', JSON.stringify(payload, null, 2));
      
      const response = await adminApiClient.post(
        BACK_COMMISSION_ENDPOINTS.create(),
        payload
      );
      
      console.log('✅ Commission created response:', response.data);
      console.log('✅ Commission created structure:', JSON.stringify(response.data, null, 2));
      
      // Handle response structure
      if (response.data && response.data.data) {
        return response.data.data;
      }
      return response.data;
    } catch (error: any) {
      console.error('❌ Error creating commission:', error);
      console.error('❌ Error response:', error.response);
      console.error('❌ Error response data:', error.response?.data);
      console.error('❌ Error errors:', error.response?.data?.errors);
      console.error('❌ Error message:', error.message);
      throw error;
    }
  },

  // Update commission
  update: async (id: number, data: UpdateCommissionRequest): Promise<Commission> => {
    try {
      console.log('📤 Updating commission:', id, data);
      const response = await adminApiClient.put(
        BACK_COMMISSION_ENDPOINTS.update(id),
        data
      );
      console.log('✅ Commission updated:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error updating commission:', error);
      throw error;
    }
  },

  // Delete commission
  delete: async (id: number): Promise<void> => {
    try {
      console.log('📤 Deleting commission:', id);
      const response = await adminApiClient.delete(
        BACK_COMMISSION_ENDPOINTS.delete(id)
      );
      console.log('✅ Commission deleted');
    } catch (error) {
      console.error('❌ Error deleting commission:', error);
      throw error;
    }
  },

  // Get vendor commissions for all categories
  getVendorCommissions: async (vendorId: number): Promise<Commission[]> => {
    try {
      console.log('📤 Fetching vendor commissions:', vendorId);
      const response = await adminApiClient.get(
        BACK_COMMISSION_ENDPOINTS.getVendorCommissions(vendorId)
      );
      console.log('✅ Vendor commissions:', response.data);
      return response.data.data || response.data;
    } catch (error) {
      console.error('❌ Error fetching vendor commissions:', error);
      throw error;
    }
  },

  // Get vendor-specific rate
  getVendorSpecificRate: async (vendorId: number): Promise<VendorCommissionRate> => {
    try {
      console.log('📤 Fetching vendor-specific rate:', vendorId);
      const response = await adminApiClient.get(
        BACK_COMMISSION_ENDPOINTS.getVendorSpecificRate(vendorId)
      );
      console.log('✅ Vendor-specific rate:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching vendor-specific rate:', error);
      throw error;
    }
  },

  // Update vendor commission rate
  updateVendorRate: async (
    vendorId: number,
    data: UpdateVendorRateRequest
  ): Promise<VendorCommissionRate> => {
    try {
      console.log('📤 Updating vendor rate:', vendorId, data);
      const response = await adminApiClient.put(
        BACK_COMMISSION_ENDPOINTS.updateVendorRate(vendorId),
        data
      );
      console.log('✅ Vendor rate updated:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error updating vendor rate:', error);
      throw error;
    }
  },

  // Get global settings
  getSettings: async (): Promise<GlobalCommissionSettings> => {
    try {
      console.log('📤 Fetching global commission settings');
      const response = await adminApiClient.get(
        BACK_COMMISSION_ENDPOINTS.getSettings()
      );
      console.log('✅ Global settings:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching global settings:', error);
      throw error;
    }
  },

  // Update global settings
  updateSettings: async (
    data: UpdateGlobalSettingsRequest
  ): Promise<GlobalCommissionSettings> => {
    try {
      console.log('📤 Updating global settings:', data);
      const response = await adminApiClient.put(
        BACK_COMMISSION_ENDPOINTS.updateSettings(),
        data
      );
      console.log('✅ Global settings updated:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error updating global settings:', error);
      throw error;
    }
  },
};

export default commissionApi;

