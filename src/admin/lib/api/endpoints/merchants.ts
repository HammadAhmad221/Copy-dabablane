const FRONT_MERCHANTS_ENDPOINTS = {
  BASE: '/back/v1/merchants',
  getAllMerchants: () => `${FRONT_MERCHANTS_ENDPOINTS.BASE}`,
  getMerchantById: (id: string) => `${FRONT_MERCHANTS_ENDPOINTS.BASE}/${id}`,
  createMerchant: () => `${FRONT_MERCHANTS_ENDPOINTS.BASE}`,
  updateMerchant: (id: string) => `${FRONT_MERCHANTS_ENDPOINTS.BASE}/${id}`,
  deleteMerchant: (id: string) => `${FRONT_MERCHANTS_ENDPOINTS.BASE}/${id}`,
};

export default FRONT_MERCHANTS_ENDPOINTS;