const FRONT_SHIPPING_DETAILS_ENDPOINTS = {
  BASE: '/back/v1/shipping-details',
  getAllShippingDetails: () => `${FRONT_SHIPPING_DETAILS_ENDPOINTS.BASE}`,
  getShippingDetailById: (id: string) => `${FRONT_SHIPPING_DETAILS_ENDPOINTS.BASE}/${id}`,
  createShippingDetail: () => `${FRONT_SHIPPING_DETAILS_ENDPOINTS.BASE}`,
  updateShippingDetail: (id: string) => `${FRONT_SHIPPING_DETAILS_ENDPOINTS.BASE}/${id}`,
  deleteShippingDetail: (id: string) => `${FRONT_SHIPPING_DETAILS_ENDPOINTS.BASE}/${id}`,
};

export default FRONT_SHIPPING_DETAILS_ENDPOINTS;