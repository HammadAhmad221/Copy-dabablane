const BACK_SUBCATEGORY_ENDPOINTS = {
    BASE: '/back/v1/subcategories',
    getAllSubcategories: () => `${BACK_SUBCATEGORY_ENDPOINTS.BASE}`,
    getSubcategoryById: (id: string) => `${BACK_SUBCATEGORY_ENDPOINTS.BASE}/${id}`,
    createSubcategory: () => `${BACK_SUBCATEGORY_ENDPOINTS.BASE}`,
    updateSubcategory: (id: string) => `${BACK_SUBCATEGORY_ENDPOINTS.BASE}/${id}`,
    deleteSubcategory: (id: string) => `${BACK_SUBCATEGORY_ENDPOINTS.BASE}/${id}`,
    getBlanesBySubcategory: (subcategoryId: string) => `${BACK_SUBCATEGORY_ENDPOINTS.BASE}/${subcategoryId}/blanes`,
  };
export default BACK_SUBCATEGORY_ENDPOINTS;