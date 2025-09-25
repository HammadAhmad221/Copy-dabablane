import { adminApiClient as apiClient } from '../client';
import BACK_SHIPPING_DETAILS_ENDPOINTS from '../endpoints/shippingDetails';
import { ShippingDetail, ShippingDetailFormData } from '../types/shippingDetails';
import { ApiResponse } from '../types/api';

export const shippingDetailApi = {
  async getShippingDetails() {
    const response = await apiClient.get<ApiResponse<ShippingDetail[]>>(
      BACK_SHIPPING_DETAILS_ENDPOINTS.getAllShippingDetails()
    );
    return response.data.data;
  },

  async getShippingDetail(id: string) {
    const response = await apiClient.get<ApiResponse<ShippingDetail>>(
      BACK_SHIPPING_DETAILS_ENDPOINTS.getShippingDetailById(id)
    );
    return response.data.data;
  },

  async createShippingDetail(data: ShippingDetailFormData) {
    const response = await apiClient.post<ApiResponse<ShippingDetail>>(
      BACK_SHIPPING_DETAILS_ENDPOINTS.createShippingDetail(),
      data
    );
    return response.data.data;
  },

  async updateShippingDetail(id: string, data: ShippingDetailFormData) {
    const response = await apiClient.put<ApiResponse<ShippingDetail>>(
      BACK_SHIPPING_DETAILS_ENDPOINTS.updateShippingDetail(id),
      data
    );
    return response.data.data;
  },

  async deleteShippingDetail(id: string) {
    await apiClient.delete<ApiResponse<void>>(
      BACK_SHIPPING_DETAILS_ENDPOINTS.deleteShippingDetail(id)
    );
  }
};