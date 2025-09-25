import { adminApiClient as apiClient } from '../client';
import BACK_COUPON_ENDPOINTS from '../endpoints/coupon';
import { Coupon, CouponFormData, CouponResponse, CouponFilters } from '../types/coupon';
import { ApiResponse } from '../types/api';

interface GetCouponsParams {
  page?: number;
  search?: string;
  category_id?: number;
  paginationSize?: number;
}

const getCoupons = async ({
  page = 1,
  search = '',
  category_id,
  paginationSize = 10,
}: GetCouponsParams = {}): Promise<CouponResponse> => {
  try {
    const queryParams = {
      page: page.toString(),
      per_page: paginationSize.toString(),
      ...(search ? { search } : {}),
      ...(category_id ? { category_id: category_id.toString() } : {}),
    };

    const response = await apiClient.get<CouponResponse>(
      BACK_COUPON_ENDPOINTS.getAllCoupons(),
      { params: queryParams }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const couponApi = {
  getCoupons,

  async getCoupon(id: string) {
    try {
      const response = await apiClient.get<ApiResponse<Coupon>>(
        BACK_COUPON_ENDPOINTS.getCouponById(id)
      );
      return response.data.data;
    } catch (error) {
      throw error;
    }
  },

  async createCoupon(data: CouponFormData) {
    try {
      // Convert boolean to number for is_active
      const formattedData = {
        ...data,
        is_active: data.is_active ? 1 : 0
      };

      const response = await apiClient.post<ApiResponse<Coupon>>(
        BACK_COUPON_ENDPOINTS.createCoupon(),
        formattedData
      );
      return response.data.data;
    } catch (error) {
      throw error;
    }
  },

  async updateCoupon(id: string, data: CouponFormData) {
    try {
      // Convert boolean to number for is_active
      const formattedData = {
        ...data,
        is_active: data.is_active ? 1 : 0
      };

      const response = await apiClient.put<ApiResponse<Coupon>>(
        BACK_COUPON_ENDPOINTS.updateCoupon(id),
        formattedData
      );
      return response.data.data;
    } catch (error) {
      throw error;
    }
  },

  async deleteCoupon(id: string) {
    try {
      await apiClient.delete<ApiResponse<void>>(
        BACK_COUPON_ENDPOINTS.deleteCoupon(id)
      );
    } catch (error) {
      throw error;
    }
  },
};