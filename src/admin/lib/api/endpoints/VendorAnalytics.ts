const BASE_URL = '/back/v1/analytics';

const BACK_VENDOR_ANALYTICS_ENDPOINTS = {
  BASE: BASE_URL,
  getVendorAnalytics: () => `${BASE_URL}/vendor`,
};

export default BACK_VENDOR_ANALYTICS_ENDPOINTS;

