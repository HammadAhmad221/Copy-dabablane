/**
 * Orders API endpoints
 */

const FRONT_ORDERS_ENDPOINTS = {
  BASE: '/front/v1/orders',
  getAllOrders: () => `${FRONT_ORDERS_ENDPOINTS.BASE}`,
  getOrderById: (id: string) => `${FRONT_ORDERS_ENDPOINTS.BASE}/${id}`,
  createOrder: () => `${FRONT_ORDERS_ENDPOINTS.BASE}`,
  updateOrderStatus: (orderNumber: string) => `${FRONT_ORDERS_ENDPOINTS.BASE}/${orderNumber}/status`,
  cancelOrder: () => `${FRONT_ORDERS_ENDPOINTS.BASE}/cancel`,
};

export default FRONT_ORDERS_ENDPOINTS;