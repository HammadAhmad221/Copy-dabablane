import { update } from "lodash";

const FRONT_ORDERS_ENDPOINTS = {
  BASE: '/back/v1/orders',
  getAllOrders: () => `${FRONT_ORDERS_ENDPOINTS.BASE}`,
  getOrderById: (id: string) => `${FRONT_ORDERS_ENDPOINTS.BASE}/${id}`,
  createOrder: () => `${FRONT_ORDERS_ENDPOINTS.BASE}`,
  updateOrder: (id: string) => `${FRONT_ORDERS_ENDPOINTS.BASE}/${id}`,
  deleteOrder: (id: string) => `${FRONT_ORDERS_ENDPOINTS.BASE}/${id}`,
  updateOrderStatus: (id: string) => `${FRONT_ORDERS_ENDPOINTS.BASE}/${id}/update-status`,
};

export default FRONT_ORDERS_ENDPOINTS;