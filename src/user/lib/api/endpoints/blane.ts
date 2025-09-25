const FRONT_BLANE_ENDPOINTS = {
    BASE: '/front/v1/blanes',
    getAllBlanes: () => {return `${FRONT_BLANE_ENDPOINTS.BASE}`;},
    getBlaneById: (id: string) => `${FRONT_BLANE_ENDPOINTS.BASE}/${id}`,    
    getBlaneBySlug: (slug: string) => `${FRONT_BLANE_ENDPOINTS.BASE}/${slug}`,
    getBlaneImages: (blaneId: string) => `${FRONT_BLANE_ENDPOINTS.BASE}/${blaneId}/images`,
  };
  
export default FRONT_BLANE_ENDPOINTS;