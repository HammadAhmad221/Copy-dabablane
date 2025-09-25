import { adminApiClient as apiClient } from '../client';
import BACK_BLANE_IMAGE_ENDPOINTS from '../endpoints/blanImg';
import { BlaneImage, BlaneimgFormData } from '../types/blaneImg';
import { ApiResponse } from '../types/api';

export const BlanImgService = {
    // Get all images
    getAll: async (params?: {
        include?: string;
        paginationSize?: number;
        sort_by?: 'created_at' | 'blane_id';
        sort_order?: 'asc' | 'desc';
        search?: string;
        blane_id?: number;
    }) => {
        try {
            const response = await apiClient.get<ApiResponse<BlaneImage[]>>(
                BACK_BLANE_IMAGE_ENDPOINTS.getAllBlaneImages(),
                { params }
            );
            return response.data.data;
        } catch (error) {
            throw error;
        }
    },

    // Get images by blane ID
    getByBlaneId: async (blaneId: number) => {
        try {
            const response = await apiClient.get<ApiResponse<BlaneImage[]>>(
                BACK_BLANE_IMAGE_ENDPOINTS.getAllBlaneImages(),
                { 
                    params: { 
                        blane_id: blaneId,
                        include: 'blane'
                    } 
                }
            );
            return response.data.data;
        } catch (error) {
            throw error;
        }
    },

    // Get single image by ID
    getById: async (id: number) => {
        try {
            const response = await apiClient.get<ApiResponse<BlaneImage>>(
                BACK_BLANE_IMAGE_ENDPOINTS.getBlaneImageById(id.toString())
            );
            return response.data.data;
        } catch (error) {
            throw error;
        }
    },

    // Create new image
    create: async (data: { blane_id: number, image_file: File }) => {
        try {
            const formData = new FormData();
            formData.append('blane_id', data.blane_id.toString());
            formData.append('image_file', data.image_file);

            const response = await apiClient.post<ApiResponse<BlaneImage>>(
                BACK_BLANE_IMAGE_ENDPOINTS.createBlaneImage(),
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );
            return response.data.data;
        } catch (error) {
            throw error;
        }
    },

    // Update image
    update: async (id: number, data: { blane_id: number, image_file: File }) => {
        try {
            const formData = new FormData();
            formData.append('blane_id', data.blane_id.toString());
            formData.append('image_file', data.image_file);

            const response = await apiClient.put<ApiResponse<BlaneImage>>(
                BACK_BLANE_IMAGE_ENDPOINTS.updateBlaneImage(id.toString()),
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );
            return response.data.data;
        } catch (error) {
            throw error;
        }
    },

    // Delete image
    delete: async (id: number): Promise<void> => {
        try {
            await apiClient.delete(
                BACK_BLANE_IMAGE_ENDPOINTS.deleteBlaneImage(id.toString())
            );
        } catch (error) {
            throw error;
        }
    }
};
