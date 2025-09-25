const BASE_URL = '/back/v1/analytics';

const BACK_ANALYTICS_ENDPOINTS = {
  BASE: BASE_URL,
  getAllAnalytics: () => BASE_URL,
  getBlanesStatus: () => `${BASE_URL}/blanes-status`,
  getNearExpiration: () => `${BASE_URL}/near-expiration`,
  getStatusDistribution: () => `${BASE_URL}/status-distribution`,
  getSalesStats: () => `${BASE_URL}/sales-stats`,
  getUserStats: () => `${BASE_URL}/user-stats`,
  getReservationStats: () => `${BASE_URL}/reservation-stats`,
  getPerformanceMetrics: () => `${BASE_URL}/performance-metrics`,
};

export default BACK_ANALYTICS_ENDPOINTS;
