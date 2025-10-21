import { adminApiClient as apiClient } from '../client';
import BACK_PROMO_CODE_ENDPOINTS from '../endpoints/promoCode';

export interface PromoCodeApiItem {
  id: number | string;
  code: string;
  discount_percentage: number;
  valid_from: string;
  valid_until: string;
  is_active: boolean | number;
}

export const promoCodeApi = {
  async getAll() {
    const resp = await apiClient.get(BACK_PROMO_CODE_ENDPOINTS.getAll());
    return resp.data;
  },

  async create(data: { code: string; discount_percentage: number; valid_from: string; valid_until: string; is_active: boolean }) {
    const payload = {
      code: data.code,
      discount_percentage: data.discount_percentage,
      valid_from: data.valid_from,
      valid_until: data.valid_until,
      is_active: data.is_active,
    };
    const resp = await apiClient.post(BACK_PROMO_CODE_ENDPOINTS.create(), payload);
    return resp.data;
  },

  async update(id: string | number, data: { code: string; discount_percentage: number; valid_from: string; valid_until: string; is_active: boolean }) {
    const payload = {
      code: data.code,
      discount_percentage: data.discount_percentage,
      valid_from: data.valid_from,
      valid_until: data.valid_until,
      is_active: data.is_active,
    };
    const resp = await apiClient.put(BACK_PROMO_CODE_ENDPOINTS.update(String(id)), payload);
    return resp.data;
  },

  async delete(id: string | number) {
    const resp = await apiClient.delete(BACK_PROMO_CODE_ENDPOINTS.delete(String(id)));
    return resp.data;
  }
};
