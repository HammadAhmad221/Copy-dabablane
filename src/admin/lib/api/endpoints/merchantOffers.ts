const FRONT_MERCHANT_OFFERS_ENDPOINTS = {
  BASE: '/back/v1/merchant-offers',
  getAllMerchantOffers: () => `${FRONT_MERCHANT_OFFERS_ENDPOINTS.BASE}`,
  getMerchantOfferById: (id: string) => `${FRONT_MERCHANT_OFFERS_ENDPOINTS.BASE}/${id}`,
  createMerchantOffer: () => `${FRONT_MERCHANT_OFFERS_ENDPOINTS.BASE}`,
  updateMerchantOffer: (id: string) => `${FRONT_MERCHANT_OFFERS_ENDPOINTS.BASE}/${id}`,
  deleteMerchantOffer: (id: string) => `${FRONT_MERCHANT_OFFERS_ENDPOINTS.BASE}/${id}`,
};

export default FRONT_MERCHANT_OFFERS_ENDPOINTS;