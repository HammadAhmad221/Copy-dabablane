import { adminApiClient } from "../client";
import TERMS_CONDITIONS_ENDPOINTS from "../endpoints/termsConditions";
import {
  TermsAndCondition,
  TermsAndConditionResponse,
  UploadTermsAndConditionRequest,
} from "../types/termsConditions";

export const termsConditionsApi = {
  // Get active terms & conditions
  getActive: async (): Promise<TermsAndCondition | null> => {
    try {
      console.log("📤 Fetching active terms & conditions:", TERMS_CONDITIONS_ENDPOINTS.getActive());

      const response = await adminApiClient.get<TermsAndConditionResponse>(
        TERMS_CONDITIONS_ENDPOINTS.getActive()
      );

      console.log("✅ Terms & Conditions response:", response.data);
      
      // Handle response structure - could be direct data or wrapped in data property
      const termsData = response.data.data || response.data as any;
      
      if (!termsData) {
        console.log("ℹ️ No active terms & conditions found");
        return null;
      }

      return termsData;
    } catch (error: any) {
      // If 404 or no active terms, return null instead of throwing
      if (error.response?.status === 404) {
        console.log("ℹ️ No active terms & conditions found (404)");
        return null;
      }
      
      console.error("❌ Error fetching terms & conditions:", error);
      throw error;
    }
  },

  // Upload terms & conditions
  upload: async (data: UploadTermsAndConditionRequest): Promise<TermsAndCondition> => {
    try {
      console.log("📤 Uploading terms & conditions:", {
        title: data.title,
        version: data.version,
        is_active: data.is_active,
        file_name: data.pdf_file.name,
      });

      const formData = new FormData();
      formData.append("title", data.title);
      if (data.description) {
        formData.append("description", data.description);
      }
      formData.append("version", data.version);
      formData.append("is_active", String(data.is_active));
      formData.append("pdf_file", data.pdf_file);

      const response = await adminApiClient.post<TermsAndConditionResponse>(
        TERMS_CONDITIONS_ENDPOINTS.upload(),
        formData
        // Don't set Content-Type manually - let axios set it with boundary
      );

      console.log("✅ Terms & Conditions uploaded:", response.data);
      
      const termsData = response.data.data || response.data as any;
      return termsData;
    } catch (error: any) {
      console.error("❌ Error uploading terms & conditions:", error);
      throw error;
    }
  },

  // Delete terms & conditions
  delete: async (id: number): Promise<void> => {
    try {
      console.log("📤 Deleting terms & conditions:", id);

      await adminApiClient.delete(TERMS_CONDITIONS_ENDPOINTS.delete(id));

      console.log("✅ Terms & Conditions deleted successfully");
    } catch (error: any) {
      console.error("❌ Error deleting terms & conditions:", error);
      throw error;
    }
  },
};

export default termsConditionsApi;

