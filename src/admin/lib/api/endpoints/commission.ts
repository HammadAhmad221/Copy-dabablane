const BACK_COMMISSION_ENDPOINTS = {
  BASE: '/back/v1/commissions',
  
  // Commission list and CRUD
  getAll: () => `${BACK_COMMISSION_ENDPOINTS.BASE}`,
  create: () => `${BACK_COMMISSION_ENDPOINTS.BASE}`,
  update: (id: string | number) => `${BACK_COMMISSION_ENDPOINTS.BASE}/${id}`,
  delete: (id: string | number) => `${BACK_COMMISSION_ENDPOINTS.BASE}/${id}`,
  
  // Vendor-specific commissions
  getVendorCommissions: (vendorId: string | number) => `${BACK_COMMISSION_ENDPOINTS.BASE}?vendor_id=${vendorId}`,
  getVendorSpecificRate: (vendorId: string | number) => `${BACK_COMMISSION_ENDPOINTS.BASE}/vendors/${vendorId}`,
  updateVendorRate: (vendorId: string | number) => `${BACK_COMMISSION_ENDPOINTS.BASE}/vendors/${vendorId}/rate`,
  
  // Global settings
  getSettings: () => `${BACK_COMMISSION_ENDPOINTS.BASE}/settings`,
  updateSettings: () => `${BACK_COMMISSION_ENDPOINTS.BASE}/settings`,
};

export default BACK_COMMISSION_ENDPOINTS;

