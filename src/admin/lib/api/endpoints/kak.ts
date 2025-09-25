const BACK_JOBS_ENDPOINTS = {
    BASE: '/back/v1/jobs',
    getAllJobs: () => `${BACK_JOBS_ENDPOINTS.BASE}`,
    getJobById: (id: string) => `${BACK_JOBS_ENDPOINTS.BASE}/${id}`,
    createJob: () => `${BACK_JOBS_ENDPOINTS.BASE}`,
    updateJob: (id: string) => `${BACK_JOBS_ENDPOINTS.BASE}/${id}`,
    deleteJob: (id: string) => `${BACK_JOBS_ENDPOINTS.BASE}/${id}`,
  };
  
  const BACK_JOB_BATCHES_ENDPOINTS = {
    BASE: '/back/v1/job-batches',
    getAllJobBatches: () => `${BACK_JOB_BATCHES_ENDPOINTS.BASE}`,
    getJobBatchById: (id: string) => `${BACK_JOB_BATCHES_ENDPOINTS.BASE}/${id}`,
    createJobBatch: () => `${BACK_JOB_BATCHES_ENDPOINTS.BASE}`,
    updateJobBatch: (id: string) => `${BACK_JOB_BATCHES_ENDPOINTS.BASE}/${id}`,
    deleteJobBatch: (id: string) => `${BACK_JOB_BATCHES_ENDPOINTS.BASE}/${id}`,
  };
  
  const BACK_MENU_ITEMS_ENDPOINTS = {
    BASE: '/back/v1/menu-items',
    getAllMenuItems: () => `${BACK_MENU_ITEMS_ENDPOINTS.BASE}`,
    getMenuItemById: (id: string) => `${BACK_MENU_ITEMS_ENDPOINTS.BASE}/${id}`,
    createMenuItem: () => `${BACK_MENU_ITEMS_ENDPOINTS.BASE}`,
    updateMenuItem: (id: string) => `${BACK_MENU_ITEMS_ENDPOINTS.BASE}/${id}`,
    deleteMenuItem: (id: string) => `${BACK_MENU_ITEMS_ENDPOINTS.BASE}/${id}`,
  };
  
  const BACK_MERCHANTS_ENDPOINTS = {
    BASE: '/back/v1/merchants',
    getAllMerchants: () => `${BACK_MERCHANTS_ENDPOINTS.BASE}`,
    getMerchantById: (id: string) => `${BACK_MERCHANTS_ENDPOINTS.BASE}/${id}`,
    createMerchant: () => `${BACK_MERCHANTS_ENDPOINTS.BASE}`,
    updateMerchant: (id: string) => `${BACK_MERCHANTS_ENDPOINTS.BASE}/${id}`,
    deleteMerchant: (id: string) => `${BACK_MERCHANTS_ENDPOINTS.BASE}/${id}`,
  };
  
  const BACK_MERCHANT_OFFERS_ENDPOINTS = {
    BASE: '/back/v1/merchant-offers',
    getAllMerchantOffers: () => `${BACK_MERCHANT_OFFERS_ENDPOINTS.BASE}`,
    getMerchantOfferById: (id: string) => `${BACK_MERCHANT_OFFERS_ENDPOINTS.BASE}/${id}`,
    createMerchantOffer: () => `${BACK_MERCHANT_OFFERS_ENDPOINTS.BASE}`,
    updateMerchantOffer: (id: string) => `${BACK_MERCHANT_OFFERS_ENDPOINTS.BASE}/${id}`,
    deleteMerchantOffer: (id: string) => `${BACK_MERCHANT_OFFERS_ENDPOINTS.BASE}/${id}`,
  };
  
  const BACK_ORDERS_ENDPOINTS = {
    BASE: '/back/v1/orders',
    getAllOrders: () => `${BACK_ORDERS_ENDPOINTS.BASE}`,
    getOrderById: (id: string) => `${BACK_ORDERS_ENDPOINTS.BASE}/${id}`,
    createOrder: () => `${BACK_ORDERS_ENDPOINTS.BASE}`,
    updateOrder: (id: string) => `${BACK_ORDERS_ENDPOINTS.BASE}/${id}`,
    deleteOrder: (id: string) => `${BACK_ORDERS_ENDPOINTS.BASE}/${id}`,
  };
  
  const BACK_RESERVATIONS_ENDPOINTS = {
    BASE: '/back/v1/reservations',
    getAllReservations: () => `${BACK_RESERVATIONS_ENDPOINTS.BASE}`,
    getReservationById: (id: string) => `${BACK_RESERVATIONS_ENDPOINTS.BASE}/${id}`,
    createReservation: () => `${BACK_RESERVATIONS_ENDPOINTS.BASE}`,
    updateReservation: (id: string) => `${BACK_RESERVATIONS_ENDPOINTS.BASE}/${id}`,
    deleteReservation: (id: string) => `${BACK_RESERVATIONS_ENDPOINTS.BASE}/${id}`,
  };
  
  const BACK_SHIPPING_DETAILS_ENDPOINTS = {
    BASE: '/back/v1/shipping-details',
    getAllShippingDetails: () => `${BACK_SHIPPING_DETAILS_ENDPOINTS.BASE}`,
    getShippingDetailById: (id: string) => `${BACK_SHIPPING_DETAILS_ENDPOINTS.BASE}/${id}`,
    createShippingDetail: () => `${BACK_SHIPPING_DETAILS_ENDPOINTS.BASE}`,
    updateShippingDetail: (id: string) => `${BACK_SHIPPING_DETAILS_ENDPOINTS.BASE}/${id}`,
    deleteShippingDetail: (id: string) => `${BACK_SHIPPING_DETAILS_ENDPOINTS.BASE}/${id}`,
  };
  
  const BACK_SITE_FEEDBACK_ENDPOINTS = {
    BASE: '/back/v1/site-feedback',
    getAllSiteFeedback: () => `${BACK_SITE_FEEDBACK_ENDPOINTS.BASE}`,
    getSiteFeedbackById: (id: string) => `${BACK_SITE_FEEDBACK_ENDPOINTS.BASE}/${id}`,
    createSiteFeedback: () => `${BACK_SITE_FEEDBACK_ENDPOINTS.BASE}`,
    updateSiteFeedback: (id: string) => `${BACK_SITE_FEEDBACK_ENDPOINTS.BASE}/${id}`,
    deleteSiteFeedback: (id: string) => `${BACK_SITE_FEEDBACK_ENDPOINTS.BASE}/${id}`,
  };