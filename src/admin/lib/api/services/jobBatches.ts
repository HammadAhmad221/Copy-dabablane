import { adminApiClient as apiClient } from '../client';
import BACK_JOB_BATCHES_ENDPOINTS from '../endpoints/jobBatches';
import { JobBatch, JobBatchFormData } from '../types/jobBatches';
import { ApiResponse } from '../types/api';

export const jobBatchApi = {
  async getJobBatches() {
    const response = await apiClient.get<ApiResponse<JobBatch[]>>(
      BACK_JOB_BATCHES_ENDPOINTS.getAllJobBatches()
    );
    return response.data.data;
  },

  async getJobBatch(id: string) {
    const response = await apiClient.get<ApiResponse<JobBatch>>(
      BACK_JOB_BATCHES_ENDPOINTS.getJobBatchById(id)
    );
    return response.data.data;
  },

  async createJobBatch(data: JobBatchFormData) {
    const response = await apiClient.post<ApiResponse<JobBatch>>(
      BACK_JOB_BATCHES_ENDPOINTS.createJobBatch(),
      data
    );
    return response.data.data;
  },

  async updateJobBatch(id: string, data: JobBatchFormData) {
    const response = await apiClient.put<ApiResponse<JobBatch>>(
      BACK_JOB_BATCHES_ENDPOINTS.updateJobBatch(id),
      data
    );
    return response.data.data;
  },

  async deleteJobBatch(id: string) {
    await apiClient.delete<ApiResponse<void>>(
      BACK_JOB_BATCHES_ENDPOINTS.deleteJobBatch(id)
    );
  }
};