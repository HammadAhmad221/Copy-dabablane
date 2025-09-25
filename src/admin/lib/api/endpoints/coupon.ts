const BACK_COUPON_ENDPOINTS = {
  BASE: '/back/v1/coupons',
  getAllCoupons: () => `${BACK_COUPON_ENDPOINTS.BASE}`,
  getCouponById: (id: string) => `${BACK_COUPON_ENDPOINTS.BASE}/${id}`,
  createCoupon: () => `${BACK_COUPON_ENDPOINTS.BASE}`,
  updateCoupon: (id: string) => `${BACK_COUPON_ENDPOINTS.BASE}/${id}`,
  deleteCoupon: (id: string) => `${BACK_COUPON_ENDPOINTS.BASE}/${id}`,
};

export default BACK_COUPON_ENDPOINTS; 