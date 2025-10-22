import { adminApiClient as apiClient } from '../client';
import {
  ActivatePurchaseRequest,
  ActivatePurchaseResponse,
  ManualPurchaseRequest,
  ManualPurchaseResponse,
  VendorsListResponse,
  VendorsSubscriptionListResponse,
} from './types';

const BASE_PURCHASES_URL = '/back/v1/admin/subscriptions/purchases';
const GET_ALL_VENDORS_URL = '/back/v1/admin/subscriptions/getAllVendorsList';
const ALL_VENDORS_SUBSCRIPTION_URL = '/back/v1/admin/subscriptions/allVendorsSubscription';

interface VendorPlanActivationService {
  manualPurchase: (payload: ManualPurchaseRequest) => Promise<ManualPurchaseResponse>;
  getAllVendors: () => Promise<VendorsListResponse>;
  getAllVendorsSubscription: () => Promise<VendorsSubscriptionListResponse>;
  activatePurchase: (purchaseId: number, payload: ActivatePurchaseRequest) => Promise<ActivatePurchaseResponse>;
}

export const vendorPlanActivationService: VendorPlanActivationService = {
  manualPurchase: async (payload) => {
    const response = await apiClient.post<ManualPurchaseResponse>(`${BASE_PURCHASES_URL}/manual`, payload);
    return response.data;
  },

  getAllVendors: async () => {
    // This endpoint requires a different token per provided CURL
    const response = await apiClient.get<VendorsListResponse>(GET_ALL_VENDORS_URL, {
      headers: {
        Authorization: `Bearer 340|HTMaR8zkc0hc6sSVEFlVOm3A9lbDCNVEotPfhnog7afacb10`,
      },
    });
    return response.data;
  },

  getAllVendorsSubscription: async () => {
    const response = await apiClient.get<VendorsSubscriptionListResponse>(ALL_VENDORS_SUBSCRIPTION_URL);
    return response.data;
  },

  activatePurchase: async (purchaseId, payload) => {
    const response = await apiClient.post<ActivatePurchaseResponse>(`${BASE_PURCHASES_URL}/${purchaseId}/activate`, payload);
    return response.data;
  },
};

export default vendorPlanActivationService;
