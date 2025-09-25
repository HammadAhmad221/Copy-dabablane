const BACK_CATEGORY_ENDPOINTS = {
    BASE: '/back/v1/categories',
    getAllCategories: () => `${BACK_CATEGORY_ENDPOINTS.BASE}`,
    getCategoryById: (id: string) => `${BACK_CATEGORY_ENDPOINTS.BASE}/${id}`,
    createCategory: () => `${BACK_CATEGORY_ENDPOINTS.BASE}`,
    updateCategory: (id: string) => `/back/v1/categories/${id}`,
    updateStatusCategory: (id: string) => `/back/v1/categories/${id}/status`,
    deleteCategory: (id: string) => `${BACK_CATEGORY_ENDPOINTS.BASE}/${id}`,
    getSubcategoriesByCategory: (categoryId: string) => `${BACK_CATEGORY_ENDPOINTS.BASE}/${categoryId}/subcategories`,
  }; 
export default BACK_CATEGORY_ENDPOINTS;