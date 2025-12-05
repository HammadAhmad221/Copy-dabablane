const TERMS_CONDITIONS_ENDPOINTS = {
  BASE: '/terms-conditions',
  
  // Get all terms & conditions
  getAll: () => `${TERMS_CONDITIONS_ENDPOINTS.BASE}`,
  
  // Get active terms & conditions
  getActive: () => `${TERMS_CONDITIONS_ENDPOINTS.BASE}/active`,
  
  // Upload terms & conditions
  upload: () => `${TERMS_CONDITIONS_ENDPOINTS.BASE}`,
  
  // Delete terms & conditions
  delete: (id: string | number) => `${TERMS_CONDITIONS_ENDPOINTS.BASE}/${id}`,
};

export default TERMS_CONDITIONS_ENDPOINTS;

