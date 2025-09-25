const BASE_URL = '/back/v1/coupons'; // Changed to "coupons"

const BACK_COUPON_ENDPOINTS = {
  BASE: BASE_URL,
  getAllCoupons: () => BASE_URL, // Retrieves all coupons
  getCouponById: (id: string) => `${BASE_URL}/${id}`, // Retrieves a specific coupon by ID
  createCoupon: () => BASE_URL, // Creates a new coupon
  updateCoupon: (id: string) => `${BASE_URL}/${id}`, // Updates a specific coupon by ID
  deleteCoupon: (id: string) => `${BASE_URL}/${id}`, // Deletes a specific coupon by ID
};

export default BACK_COUPON_ENDPOINTS;
