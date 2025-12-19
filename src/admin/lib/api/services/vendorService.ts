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

    const buildParams = (statusOverride?: string) => {
      const params = new URLSearchParams();

      if (filters?.status) {
        const statusParam = statusOverride ?? String(filters.status);
        params.append('status', statusParam);
      }
      if (filters?.city) params.append('city', filters.city);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.sortBy) params.append('sortBy', filters.sortBy);
      if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);
      params.append('include', 'coverMedia');
      params.append('paginationSize', limit.toString());
      params.append('page', page.toString());

      return params;
    };

    const requestOnce = async (statusOverride?: string) => {
      const params = buildParams(statusOverride);
      return adminApiClient.get(`/getAllVendors?${params.toString()}`);
    };

    let response;
    const rawStatus = filters?.status ? String(filters.status) : undefined;

    // Normalize status for API + retry for inActive variations.
    if (rawStatus) {
      // Backend rejects the inactive status filter with 422 in some environments.
      // For inActive/waiting, skip sending status to the API and apply filtering client-side.
      if (rawStatus === 'inActive' || rawStatus === 'waiting') {
        const fallbackPageSizes = [1000, 500, 200, 100];

        let fallbackResponse: any;
        let lastFallbackError: any;
        for (const fallbackPageSize of fallbackPageSizes) {
          try {
            const params = new URLSearchParams();
            if (filters?.city) params.append('city', filters.city);
            if (filters?.search) params.append('search', filters.search);
            if (filters?.sortBy) params.append('sortBy', filters.sortBy);
            if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);
            params.append('include', 'coverMedia');
            params.append('paginationSize', fallbackPageSize.toString());
            params.append('page', '1');

            fallbackResponse = await adminApiClient.get(`/getAllVendors?${params.toString()}`);
            lastFallbackError = undefined;
            break;
          } catch (err: any) {
            lastFallbackError = err;
          }
        }

        if (!fallbackResponse) {
          throw lastFallbackError;
        }

        const payload = fallbackResponse.data ?? {};
        const vendorsRaw = payload?.data?.data ?? payload?.data ?? payload ?? [];
        const allVendors = Array.isArray(vendorsRaw) ? vendorsRaw : [];
        const wanted = String(rawStatus).toLowerCase();
        const filteredAll = allVendors.filter((v: any) => String(v?.status).toLowerCase() === wanted);

        const total = filteredAll.length;
        const lastPage = Math.max(1, Math.ceil(total / limit));
        const currentPage = Math.min(Math.max(page, 1), lastPage);
        const start = (currentPage - 1) * limit;
        const data = filteredAll.slice(start, start + limit);

        return {
          data,
          meta: {
            total,
            current_page: currentPage,
            last_page: lastPage,
            per_page: limit,
            from: total === 0 ? 0 : start + 1,
            to: Math.min(start + data.length, total),
          },
        } as VendorListResponse;
      }

      const normalizedStatus = rawStatus === 'inActive' ? rawStatus : rawStatus.toLowerCase();
      const statusAttempts = rawStatus === 'inActive'
        ? ['inActive', 'inactive', 'in_active']
        : [normalizedStatus];

      let lastError: any;
      for (const attempt of statusAttempts) {
        try {
          response = await requestOnce(attempt);
          lastError = undefined;
          break;
        } catch (err: any) {
          lastError = err;
          const statusCode = err?.response?.status;
          if (statusCode !== 422) {
            throw err;
          }
        }
      }

      if (!response) {
        throw lastError;
      }
    } else {
      response = await requestOnce();
    }
    
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

  createVendorByEmail: async (email: string) => {
    const response = await adminApiClient.post('/admin/createVendor', { email });
    return response.data;
  },

  // Update vendor
  updateVendor: async (id: string, vendorData: UpdateVendorRequest): Promise<Vendor> => {
    const validatedData = UpdateVendorRequestSchema.parse(vendorData);
    const response = await adminApiClient.put(`/vendors/${id}`, validatedData);
    return response.data as Vendor;
  },

  // Update vendor (using /api/admin/updateVendor endpoint)
  updateVendorInfo: async (vendorData: UpdateVendorRequest & { id?: number }): Promise<Vendor> => {
    // Don't validate with schema since API accepts all fields
    const { id, ...dataToSend } = vendorData;
    const endpoint = id ? `/admin/updateVendor/${id}` : '/admin/updateVendor';
    const formData = new FormData();

    Object.entries(dataToSend).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        return;
      }

      if (value === null || value === undefined) {
        formData.append(key, '');
        return;
      }

      if (typeof value === 'boolean') {
        formData.append(key, value ? '1' : '0');
        return;
      }

      formData.append(key, String(value));
    });

    const response = await adminApiClient.post(endpoint, formData);
    return (response.data?.data || response.data) as Vendor;
  },

  // Update vendor status
  updateVendorStatus: async (id: string, statusData: UpdateVendorStatusRequest): Promise<Vendor> => {
    const validatedData = UpdateVendorStatusRequestSchema.parse(statusData);
    
    // Transform status to match API expectations (lowercase)
    const apiData = {
      ...validatedData,
      status: validatedData.status === 'inActive' ? 'inactive' : validatedData.status
    };
    
    const response = await adminApiClient.patch(`/changeVendorStatus/${id}`, apiData);
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
