import { adminApiClient } from '../client';
import {
  CommissionFile,
  CommissionChartListResponse,
  CommissionChartUploadRequest,
  CommissionChartUpdateRequest
} from '../types/commissionChart';

const BASE_URL = '/back/v1/admin/subscriptions/commissionChart';

export const commissionChartApi = {
  // Get all commission files
  getCommissionFiles: async (): Promise<CommissionFile[]> => {
    const response = await adminApiClient.get<CommissionChartListResponse>(BASE_URL);
    return response.data.data || response.data as any;
  },

  // Upload new commission file
  uploadCommissionFile: async (data: CommissionChartUploadRequest): Promise<CommissionFile> => {
    const formData = new FormData();
    formData.append('category_id', String(data.category_id));
    formData.append('commission_file', data.commission_file);
    // Also send the file name so backend can store it
    formData.append('file_name', data.commission_file.name);

    const response = await adminApiClient.post<{ data: CommissionFile }>(
      `${BASE_URL}/upload`,
      formData
      // Don't set Content-Type manually - let axios set it with boundary
    );
    return response.data.data || response.data as any;
  },

  // Update commission file
  updateCommissionFile: async (
    id: number,
    data: CommissionChartUpdateRequest
  ): Promise<CommissionFile> => {
    const formData = new FormData();
    if (data.category_id !== undefined) {
      formData.append('category_id', String(data.category_id));
    }
    if (data.commission_file) {
      formData.append('commission_file', data.commission_file);
      // Also send the file name so backend can update it
      formData.append('file_name', data.commission_file.name);
    }

    const response = await adminApiClient.post<{ data: CommissionFile }>(
      `${BASE_URL}/${id}`,
      formData
      // Don't set Content-Type manually - let axios set it with boundary
    );
    return response.data.data || response.data as any;
  },

  // Delete commission file
  deleteCommissionFile: async (id: number): Promise<void> => {
    await adminApiClient.delete(`${BASE_URL}/${id}`);
  },

  // Download commission file
  downloadCommissionFile: async (id: number): Promise<Blob> => {
    const response = await adminApiClient.get(`${BASE_URL}/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

