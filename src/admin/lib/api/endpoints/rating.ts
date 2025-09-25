const BACK_RATING_ENDPOINTS = {
    BASE: '/back/v1/ratings',
    getAllRatings: () => `${BACK_RATING_ENDPOINTS.BASE}`,
    getRatingById: (id: string) => `${BACK_RATING_ENDPOINTS.BASE}/${id}`,
    createRating: () => `${BACK_RATING_ENDPOINTS.BASE}`,
    updateRating: (id: string) => `${BACK_RATING_ENDPOINTS.BASE}/${id}`,
    deleteRating: (id: string) => `${BACK_RATING_ENDPOINTS.BASE}/${id}`,
    markAsFlagged: (id: string) => `${BACK_RATING_ENDPOINTS.BASE}/${id}/flag`,
    unmarkAsFlagged: (id: string) => `${BACK_RATING_ENDPOINTS.BASE}/${id}/unflag`,
};
  
export default BACK_RATING_ENDPOINTS;