import { GuestApiClient } from '../client';
import { Blane } from '../../types/blane';

const FRONT_VENDOR_ENDPOINTS = {
  getVendorBySlug: (slug: string) => `/vendors/${slug}`,
};

export interface Vendor {
  id: number;
  name: string;
  slug: string;
  description: string;
  image: string;
  blanes: Blane[];
}

export interface VendorResponse {
  success?: boolean;
  data: Vendor;
  message?: string;
}

export class VendorService {
  static async getVendorBySlug(slug: string): Promise<VendorResponse> {
    try {
      const response = await GuestApiClient.get(
        FRONT_VENDOR_ENDPOINTS.getVendorBySlug(slug)
      );
      return response.data;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to fetch vendor';
      return {
        success: false,
        data: {} as Vendor,
        message,
      };
    }
  }
}
