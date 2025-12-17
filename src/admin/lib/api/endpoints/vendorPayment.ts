const BACK_VENDOR_PAYMENT_ENDPOINTS = {
  BASE: '/back/v1/vendor-payments',
  getAllPayments: () => `${BACK_VENDOR_PAYMENT_ENDPOINTS.BASE}`,
  getPaymentById: (id: string | number) => `${BACK_VENDOR_PAYMENT_ENDPOINTS.BASE}/${id}`,
  updatePayment: (id: string | number) => `${BACK_VENDOR_PAYMENT_ENDPOINTS.BASE}/${id}`,
  updateStatus: (id: string | number) => `${BACK_VENDOR_PAYMENT_ENDPOINTS.BASE}/${id}/status`,
  markProcessed: () => `${BACK_VENDOR_PAYMENT_ENDPOINTS.BASE}/mark-processed`,
  revertPayment: (id: string | number) => `${BACK_VENDOR_PAYMENT_ENDPOINTS.BASE}/${id}/revert`,
  exportExcel: () => `${BACK_VENDOR_PAYMENT_ENDPOINTS.BASE}/export/excel`,
  exportPDF: () => `${BACK_VENDOR_PAYMENT_ENDPOINTS.BASE}/export/pdf`,
  bankingReport: () => `${BACK_VENDOR_PAYMENT_ENDPOINTS.BASE}/banking-report`,
  getLogs: () => `${BACK_VENDOR_PAYMENT_ENDPOINTS.BASE}/logs`,
  dashboard: () => `${BACK_VENDOR_PAYMENT_ENDPOINTS.BASE}/dashboard`,
  weeklySummary: () => `${BACK_VENDOR_PAYMENT_ENDPOINTS.BASE}/weekly-summary`,
};

export default BACK_VENDOR_PAYMENT_ENDPOINTS;

