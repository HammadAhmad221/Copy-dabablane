const BACK_PROMO_CODE_ENDPOINTS = {
  BASE: '/back/v1/admin/subscriptions/promo-codes',
  getAll: () => `${BACK_PROMO_CODE_ENDPOINTS.BASE}`,
  getById: (id: string) => `${BACK_PROMO_CODE_ENDPOINTS.BASE}/${id}`,
  create: () => `${BACK_PROMO_CODE_ENDPOINTS.BASE}`,
  update: (id: string) => `${BACK_PROMO_CODE_ENDPOINTS.BASE}/${id}`,
  delete: (id: string) => `${BACK_PROMO_CODE_ENDPOINTS.BASE}/${id}`,
};

export default BACK_PROMO_CODE_ENDPOINTS;
