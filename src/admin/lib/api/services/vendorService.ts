import { adminApiClient } from '../client';
import {
  Vendor,
  CreateVendorRequest,
  UpdateVendorRequest,
  UpdateVendorStatusRequest,
  VendorFilters,
  VendorListResponse,
  CreateVendorRequestSchema,
  UpdateVendorRequestSchema,
  UpdateVendorStatusRequestSchema,
  VendorFiltersSchema
} from '../types/vendor';

export const vendorApi = {
  // Get all vendors with filters and pagination
  getVendors: async (filters?: VendorFilters, limit = 10, page = 1): Promise<VendorListResponse> => {
    // Validate filters if provided (but don't fail if validation fails)
    if (filters) {
      try {
        VendorFiltersSchema.parse(filters);
      } catch (error) {
        // Validation failed, proceed with raw filters
      }
    }

    const params = new URLSearchParams();
    
    if (filters?.status) params.append('status', filters.status);
    if (filters?.city) params.append('city', filters.city);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);
    if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);
    params.append('include', 'coverMedia');
    params.append('paginationSize', limit.toString());
    params.append('page', page.toString());

    const response = await adminApiClient.get(`/getAllVendors?${params.toString()}`);
    
    // Handle the new API response structure with meta object
    if (response.data && response.data.meta) {
      const result = {
        data: response.data.data || [],
        meta: response.data.meta
      };
      
      return result as VendorListResponse;
    }
    
    // Fallback for old API response structure
    if (Array.isArray(response.data)) {
      return {
        data: response.data,
        meta: {
          total: response.data.length,
          current_page: page,
          last_page: Math.ceil(response.data.length / limit),
          per_page: limit,
          from: (page - 1) * limit + 1,
          to: Math.min(page * limit, response.data.length)
        }
      } as VendorListResponse;
    }
    
    // Handle wrapped response without meta
    return {
      data: response.data?.data || response.data || [],
      meta: {
        total: response.data?.total || response.data?.length || 0,
        current_page: response.data?.page || page,
        last_page: response.data?.totalPages || Math.ceil((response.data?.total || response.data?.length || 0) / limit),
        per_page: response.data?.limit || limit,
        from: ((response.data?.page || page) - 1) * (response.data?.limit || limit) + 1,
        to: Math.min((response.data?.page || page) * (response.data?.limit || limit), response.data?.total || response.data?.length || 0)
      }
    } as VendorListResponse;
  },

  // Get vendor by ID
  getVendorById: async (id: string): Promise<Vendor> => {
    const response = await adminApiClient.get(`/vendors/${id}`);
    return response.data as Vendor;
  },

  // Create new vendor
  createVendor: async (vendorData: CreateVendorRequest): Promise<Vendor> => {
    const validatedData = CreateVendorRequestSchema.parse(vendorData);
    const response = await adminApiClient.post('/vendors', validatedData);
    return response.data as Vendor;
  },

  // Update vendor
  updateVendor: async (id: string, vendorData: UpdateVendorRequest): Promise<Vendor> => {
    const validatedData = UpdateVendorRequestSchema.parse(vendorData);
    const response = await adminApiClient.put(`/vendors/${id}`, validatedData);
    return response.data as Vendor;
  },

  // Update vendor (using /api/updateVendor endpoint)
  updateVendorInfo: async (vendorData: UpdateVendorRequest): Promise<Vendor> => {
    // Don't validate with schema since API accepts all fields
    const response = await adminApiClient.put('/updateVendor', vendorData);
    return response.data as Vendor;
  },

  // Update vendor status
  updateVendorStatus: async (id: string, statusData: UpdateVendorStatusRequest): Promise<Vendor> => {
    const validatedData = UpdateVendorStatusRequestSchema.parse(statusData);
    const response = await adminApiClient.patch(`/changeVendorStatus/${id}`, validatedData);
    return response.data as Vendor;
  },

  // Delete vendor
  deleteVendor: async (id: string): Promise<void> => {
    await adminApiClient.delete(`/vendors/${id}`);
  },

  // Get vendor statistics
  getVendorStats: async () => {
    const response = await adminApiClient.get('/vendors/stats');
    return response.data;
  }
};
