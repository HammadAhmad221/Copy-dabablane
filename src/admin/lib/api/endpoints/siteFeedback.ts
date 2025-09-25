const FRONT_SITE_FEEDBACK_ENDPOINTS = {
  BASE: '/back/v1/site-feedback',
  getAllSiteFeedback: () => `${FRONT_SITE_FEEDBACK_ENDPOINTS.BASE}`,
  getSiteFeedbackById: (id: string) => `${FRONT_SITE_FEEDBACK_ENDPOINTS.BASE}/${id}`,
  createSiteFeedback: () => `${FRONT_SITE_FEEDBACK_ENDPOINTS.BASE}`,
  updateSiteFeedback: (id: string) => `${FRONT_SITE_FEEDBACK_ENDPOINTS.BASE}/${id}`,
  deleteSiteFeedback: (id: string) => `${FRONT_SITE_FEEDBACK_ENDPOINTS.BASE}/${id}`,
};

export default FRONT_SITE_FEEDBACK_ENDPOINTS;