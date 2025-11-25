import { adminApiClient } from "../client";
import BACK_COMMISSION_ENDPOINTS from "../endpoints/commission";
import {
  Commission,
  CreateCommissionRequest,
  UpdateCommissionRequest,
  VendorCommissionRate,
  UpdateVendorRateRequest,
  GlobalCommissionSettings,
  UpdateGlobalSettingsRequest,
  CommissionListResponse,
  CategoryDefaultCommission,
  CreateCategoryDefaultRequest,
  UpdateCategoryDefaultRequest,
} from "../types/commission";

export const commissionApi = {
  // Get all commissions with optional filters
  getAll: async (
    categoryId?: number,
    vendorId?: number,
    includeInactive?: boolean
  ): Promise<CommissionListResponse> => {
    try {
      const params = new URLSearchParams();
      if (categoryId) params.append("category_id", String(categoryId));
      if (vendorId) params.append("vendor_id", String(vendorId));
      if (includeInactive)
        params.append("include_inactive", String(includeInactive));

      console.log(
        "📤 Fetching commissions:",
        `${BACK_COMMISSION_ENDPOINTS.getAll()}?${params.toString()}`
      );

      const response = await adminApiClient.get(
        `${BACK_COMMISSION_ENDPOINTS.getAll()}?${params.toString()}`
      );

      console.log("✅ Commissions response:", response.data);
      console.log(
        "✅ Commissions response structure:",
        JSON.stringify(response.data, null, 2)
      );
      console.log("✅ Response data type:", typeof response.data);
      console.log("✅ Is array?", Array.isArray(response.data));
      console.log("✅ Response keys:", response.data ? Object.keys(response.data) : 'null');
      
      // Log the full response for debugging
      if (response.data && response.data.data !== undefined) {
        console.log("✅ response.data.data exists:", response.data.data);
        console.log("✅ response.data.data type:", typeof response.data.data);
        console.log("✅ response.data.data is array?", Array.isArray(response.data.data));
        if (Array.isArray(response.data.data)) {
          console.log("✅ response.data.data length:", response.data.data.length);
          if (response.data.data.length > 0) {
            console.log("✅ First item in response.data.data:", response.data.data[0]);
          }
        }
      }

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
        else if (
          response.data.commissions &&
          Array.isArray(response.data.commissions)
        ) {
          commissionsData = response.data.commissions;
          metaData.total = response.data.total || commissionsData.length;
        }
        // Structure 4: { results: [...], count: X }
        else if (
          response.data.results &&
          Array.isArray(response.data.results)
        ) {
          commissionsData = response.data.results;
          metaData.total = response.data.count || commissionsData.length;
        }
        // Structure 5: Wrapped object with status/code/message/data
        else if (response.data.status !== undefined && response.data.data !== undefined) {
          console.log("✅ Structure 5 detected - status/code/message/data format");
          console.log("✅ response.data.status:", response.data.status);
          console.log("✅ response.data.code:", response.data.code);
          console.log("✅ response.data.message:", response.data.message);
          console.log("✅ response.data.data type:", typeof response.data.data);
          console.log("✅ response.data.data is array?", Array.isArray(response.data.data));
          console.log("✅ response.data.data value:", response.data.data);
          if (response.data.data && typeof response.data.data === 'object' && !Array.isArray(response.data.data)) {
            console.log("✅ response.data.data keys:", Object.keys(response.data.data));
          }
          
          if (Array.isArray(response.data.data)) {
            commissionsData = response.data.data;
            metaData.total = commissionsData.length;
            console.log("✅ Extracted array from response.data.data with", commissionsData.length, "items");
          } else if (response.data.data && typeof response.data.data === 'object' && !Array.isArray(response.data.data)) {
            // If data is an object, check if it has nested arrays
            const nestedArrayKeys = Object.keys(response.data.data).filter(key => 
              Array.isArray(response.data.data[key])
            );
            if (nestedArrayKeys.length > 0) {
              // Combine all arrays found in the response.data.data object
              const allCommissions: any[] = [];
              nestedArrayKeys.forEach(key => {
                const arrayData = response.data.data[key];
                if (Array.isArray(arrayData)) {
                  console.log(`✅ Found nested array in response.data.data.${key} with`, arrayData.length, "items");
                  // Flatten and add all items from this array
                  allCommissions.push(...arrayData);
                }
              });
              commissionsData = allCommissions;
              metaData.total = commissionsData.length;
              console.log(`✅ Combined ${nestedArrayKeys.length} arrays into`, commissionsData.length, "total commissions");
            } else {
              // Check if data itself should be treated as a single commission
              console.log("⚠️ response.data.data is an object, checking if it's a single commission");
              // If it has commission-like properties, treat as single item array
              if (response.data.data.id !== undefined || response.data.data.commission_rate !== undefined) {
                commissionsData = [response.data.data];
                metaData.total = 1;
                console.log("✅ Treated response.data.data as single commission object");
              } else {
                console.warn("⚠️ response.data.data is an object but doesn't look like a commission. Keys:", Object.keys(response.data.data));
              }
            }
          } else if (response.data.data === null || response.data.data === undefined) {
            console.warn("⚠️ response.data.data is null or undefined");
            commissionsData = [];
            metaData.total = 0;
          }
        }
        // Structure 6: { commission: {...} } or { commission: [...] }
        else if (response.data.commission) {
          if (Array.isArray(response.data.commission)) {
            commissionsData = response.data.commission;
            metaData.total = commissionsData.length;
          } else {
            // Single commission object
            commissionsData = [response.data.commission];
            metaData.total = 1;
          }
        }
        // Structure 7: Laravel pagination { data: [...], current_page, last_page, per_page, total }
        else if (response.data.current_page !== undefined) {
          // This is Laravel pagination format
          if (Array.isArray(response.data.data)) {
            commissionsData = response.data.data;
            metaData = {
              total: response.data.total || 0,
              current_page: response.data.current_page || 1,
              last_page: response.data.last_page || 1,
              per_page: response.data.per_page || 10,
            };
          }
        }
        // Structure 8: Check if response.data itself is an object with array-like properties
        else if (typeof response.data === 'object' && !Array.isArray(response.data)) {
          // Try to find any array property
          const arrayKeys = Object.keys(response.data).filter(key => 
            Array.isArray(response.data[key])
          );
          if (arrayKeys.length > 0) {
            // Use the first array found
            const firstArrayKey = arrayKeys[0];
            commissionsData = response.data[firstArrayKey];
            metaData.total = commissionsData.length;
            console.log(`✅ Found array in key "${firstArrayKey}" with ${commissionsData.length} items`);
          } else {
            console.warn("⚠️ Response is an object but no array found. Full structure:", response.data);
          }
        }
      }

      console.log("✅ Extracted commissions data:", commissionsData);
      console.log("✅ Extracted commissions count:", commissionsData.length);
      console.log("✅ Extracted meta data:", metaData);

      return {
        data: commissionsData,
        meta: metaData,
      };
    } catch (error) {
      console.error("❌ Error fetching commissions:", error);
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

      console.log("📤 Creating commission:", payload);
      console.log("📤 Request payload JSON:", JSON.stringify(payload, null, 2));

      const response = await adminApiClient.post(
        BACK_COMMISSION_ENDPOINTS.create(),
        payload
      );

      console.log("✅ Commission created response:", response.data);
      console.log(
        "✅ Commission created structure:",
        JSON.stringify(response.data, null, 2)
      );

      // Handle response structure
      if (response.data && response.data.data) {
        return response.data.data;
      }
      return response.data;
    } catch (error: any) {
      console.error("❌ Error creating commission:", error);
      console.error("❌ Error response:", error.response);
      console.error("❌ Error response data:", error.response?.data);
      console.error("❌ Error errors:", error.response?.data?.errors);
      console.error("❌ Error message:", error.message);
      throw error;
    }
  },

  // Update commission
  update: async (
    id: number,
    data: UpdateCommissionRequest
  ): Promise<Commission> => {
    try {
      console.log("📤 Updating commission:", id, data);
      const response = await adminApiClient.put(
        BACK_COMMISSION_ENDPOINTS.update(id),
        data
      );
      console.log("✅ Commission updated:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Error updating commission:", error);
      throw error;
    }
  },

  // Delete commission
  delete: async (id: number): Promise<void> => {
    try {
      console.log("📤 Deleting commission:", id);
      const response = await adminApiClient.delete(
        BACK_COMMISSION_ENDPOINTS.delete(id)
      );
      console.log("✅ Commission deleted");
    } catch (error) {
      console.error("❌ Error deleting commission:", error);
      throw error;
    }
  },

  // Get vendor commissions for all categories
  getVendorCommissions: async (vendorId: number): Promise<Commission[]> => {
    try {
      console.log("📤 Fetching vendor commissions:", vendorId);
      const response = await adminApiClient.get(
        BACK_COMMISSION_ENDPOINTS.getVendorCommissions(vendorId)
      );
      console.log("✅ Vendor commissions:", response.data);
      return response.data.data || response.data;
    } catch (error) {
      console.error("❌ Error fetching vendor commissions:", error);
      throw error;
    }
  },

  // Get vendor-specific rate
  getVendorSpecificRate: async (
    vendorId: number
  ): Promise<VendorCommissionRate> => {
    try {
      console.log("📤 Fetching vendor-specific rate:", vendorId);
      const response = await adminApiClient.get(
        BACK_COMMISSION_ENDPOINTS.getVendorSpecificRate(vendorId)
      );
      console.log("✅ Vendor-specific rate:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Error fetching vendor-specific rate:", error);
      throw error;
    }
  },

  // Update vendor commission rate
  updateVendorRate: async (
    vendorId: number,
    data: UpdateVendorRateRequest
  ): Promise<VendorCommissionRate> => {
    try {
      console.log("📤 Updating vendor rate:", vendorId, data);
      const response = await adminApiClient.put(
        BACK_COMMISSION_ENDPOINTS.updateVendorRate(vendorId),
        data
      );
      console.log("✅ Vendor rate updated:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Error updating vendor rate:", error);
      throw error;
    }
  },

  // Get global settings
  getSettings: async (): Promise<GlobalCommissionSettings> => {
    try {
      console.log("📤 Fetching global commission settings");
      const response = await adminApiClient.get(
        BACK_COMMISSION_ENDPOINTS.getSettings()
      );
      console.log("✅ Global settings response:", response.data);
      
      // Backend returns nested structure: {status, code, message, data: {...}}
      // Extract the actual settings data
      if (response.data && response.data.data) {
        console.log("✅ Extracted settings from nested structure:", response.data.data);
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      console.error("❌ Error fetching global settings:", error);
      throw error;
    }
  },

  // Update global settings
  updateSettings: async (
    data: UpdateGlobalSettingsRequest
  ): Promise<GlobalCommissionSettings> => {
    try {
      console.log("📤 Updating global settings:", data);
      console.log("📤 Payload types:", {
        partial_payment_commission_rate: typeof data.partial_payment_commission_rate,
        vat_rate: typeof data.vat_rate,
        daba_blane_account_iban: typeof data.daba_blane_account_iban,
        transfer_processing_day: typeof data.transfer_processing_day,
      });
      console.log("📤 transfer_processing_day value:", data.transfer_processing_day);
      console.log("📤 transfer_processing_day length:", data.transfer_processing_day?.length);
      console.log("📤 transfer_processing_day JSON:", JSON.stringify(data.transfer_processing_day));
      
      const response = await adminApiClient.put(
        BACK_COMMISSION_ENDPOINTS.updateSettings(),
        data
      );
      console.log("✅ Global settings updated:", response.data);
      
      // Extract nested data if present
      if (response.data && response.data.data) {
        return response.data.data;
      }
      return response.data;
    } catch (error: any) {
      console.error("❌ Error updating global settings:", error);
      console.error("❌ Error response data:", error.response?.data);
      console.error("❌ Error response status:", error.response?.status);
      if (error.response?.data?.errors) {
        console.error("❌ Validation errors:", JSON.stringify(error.response.data.errors, null, 2));
      }
      throw error;
    }
  },

  // Get all category default commissions
  getCategoryDefaults: async (): Promise<CategoryDefaultCommission[]> => {
    try {
      console.log("📤 Fetching category default commissions");
      const response = await adminApiClient.get(
        BACK_COMMISSION_ENDPOINTS.getCategoryDefaults()
      );
      console.log("✅ Category default commissions:", response.data);

      // Handle different response structures
      if (
        response.data &&
        response.data.data &&
        Array.isArray(response.data.data)
      ) {
        return response.data.data;
      } else if (Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error("❌ Error fetching category default commissions:", error);
      throw error;
    }
  },

  // Create category default commission
  createCategoryDefault: async (
    data: CreateCategoryDefaultRequest
  ): Promise<CategoryDefaultCommission> => {
    try {
      // Ensure numeric values are properly typed
      const payload = {
        category_id: Number(data.category_id),
        commission_rate: parseFloat(String(data.commission_rate)),
        partial_commission_rate: parseFloat(
          String(data.partial_commission_rate)
        ),
        is_active: Boolean(data.is_active),
      };

      console.log("📤 Creating category default commission:", payload);
      const response = await adminApiClient.post(
        BACK_COMMISSION_ENDPOINTS.createCategoryDefault(),
        payload
      );
      console.log("✅ Category default commission created:", response.data);

      // Handle response structure
      if (response.data && response.data.data) {
        return response.data.data;
      }
      return response.data;
    } catch (error: any) {
      console.error("❌ Error creating category default commission:", error);
      console.error("❌ Error response:", error.response?.data);
      throw error;
    }
  },

  // Update category default commission
  updateCategoryDefault: async (
    data: UpdateCategoryDefaultRequest
  ): Promise<CategoryDefaultCommission> => {
    try {
      // Ensure numeric values are properly typed as floats
      const commissionRate = parseFloat(String(data.commission_rate));
      const partialRate = parseFloat(String(data.partial_commission_rate));
      const commissionRateFloat = isNaN(commissionRate)
        ? 0.0
        : parseFloat(commissionRate.toFixed(2));
      const partialRateFloat = isNaN(partialRate)
        ? 0.0
        : parseFloat(partialRate.toFixed(2));
      const payload = {
        category_id: Number(data.category_id),
        commission_rate: commissionRateFloat,
        partial_commission_rate: partialRateFloat,
        is_active: Boolean(data.is_active),
      };

      console.log("📤 Updating category default commission:", payload);
      console.log("📤 Payload types:", {
        category_id: typeof payload.category_id,
        commission_rate: typeof payload.commission_rate,
        partial_commission_rate: typeof payload.partial_commission_rate,
        is_active: typeof payload.is_active,
      });
      const response = await adminApiClient.put(
        BACK_COMMISSION_ENDPOINTS.updateCategoryDefault(),
        payload
      );
      console.log("✅ Category default commission updated:", response.data);

      // Handle response structure
      if (response.data && response.data.data) {
        return response.data.data;
      }
      return response.data;
    } catch (error: any) {
      console.error("❌ Error updating category default commission:", error);
      console.error("❌ Error response:", error.response?.data);
      console.error(
        "❌ Error details:",
        JSON.stringify(error.response?.data, null, 2)
      );
      if (error.response?.data?.errors) {
        console.error("❌ Validation errors:", error.response.data.errors);
      }
      throw error;
    }
  },
};

export default commissionApi;
