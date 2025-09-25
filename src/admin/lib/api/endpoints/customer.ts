const BACK_COSTOMER_ENDPOINTS = {
    BASE: '/back/v1/customers',
    GetAll: () => `${BACK_COSTOMER_ENDPOINTS.BASE}`,
    GetById: (id: number) => `${BACK_COSTOMER_ENDPOINTS.BASE}/${id}`,
    Create: () => `${BACK_COSTOMER_ENDPOINTS.BASE}`,
    Update: (id: number) => `${BACK_COSTOMER_ENDPOINTS.BASE}/${id}`,
    Delete: (id: number) => `${BACK_COSTOMER_ENDPOINTS.BASE}/${id}`,
  }; 
export default BACK_COSTOMER_ENDPOINTS;