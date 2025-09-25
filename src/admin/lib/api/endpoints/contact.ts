const BACK_CONTACT_ENDPOINTS = {
    BASE: '/back/v1/contacts',
    GetAll: () => BACK_CONTACT_ENDPOINTS.BASE,
    Get: (id: string) => `${BACK_CONTACT_ENDPOINTS.BASE}/${id}`,
    Update: (id: string) => `${BACK_CONTACT_ENDPOINTS.BASE}/${id}`,
    Delete: (id: string) => `${BACK_CONTACT_ENDPOINTS.BASE}/${id}`,
  }; 
export default BACK_CONTACT_ENDPOINTS;