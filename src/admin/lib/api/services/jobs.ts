import { adminApiClient as apiClient } from '../client';
import BACK_JOBS_ENDPOINTS from '../endpoints/jobs';
import { Job, JobFormData } from '../types/jobs';
import { ApiResponse } from '../types/api';

export const jobApi = {
  async getJobs() {
    const response = await apiClient.get<ApiResponse<Job[]>>(
      BACK_JOBS_ENDPOINTS.getAllJobs()
    );
    return response.data.data;
  },

  async getJob(id: string) {
    const response = await apiClient.get<ApiResponse<Job>>(
      BACK_JOBS_ENDPOINTS.getJobById(id)
    );
    return response.data.data;
  },

  async createJob(data: JobFormData) {
    const response = await apiClient.post<ApiResponse<Job>>(
      BACK_JOBS_ENDPOINTS.createJob(),
      data
    );
    return response.data.data;
  },

  async updateJob(id: string, data: JobFormData) {
    const response = await apiClient.put<ApiResponse<Job>>(
      BACK_JOBS_ENDPOINTS.updateJob(id),
      data
    );
    return response.data.data;
  },

  async deleteJob(id: string) {
    await apiClient.delete<ApiResponse<void>>(
      BACK_JOBS_ENDPOINTS.deleteJob(id)
    );
  }
};