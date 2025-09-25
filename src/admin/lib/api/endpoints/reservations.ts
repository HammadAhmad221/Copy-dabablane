const FRONT_RESERVATIONS_ENDPOINTS = {
  BASE: '/back/v1/reservations',
  getAllReservations: () => `${FRONT_RESERVATIONS_ENDPOINTS.BASE}`,
  getReservationById: (id: string) => `${FRONT_RESERVATIONS_ENDPOINTS.BASE}/${id}`,
  createReservation: () => `${FRONT_RESERVATIONS_ENDPOINTS.BASE}`,
  updateReservation: (id: string) => `${FRONT_RESERVATIONS_ENDPOINTS.BASE}/${id}`,
  deleteReservation: (id: string) => `${FRONT_RESERVATIONS_ENDPOINTS.BASE}/${id}`,
  updateReservationStatus: (id: string) => `${FRONT_RESERVATIONS_ENDPOINTS.BASE}/${id}/update-status`,
};

export default FRONT_RESERVATIONS_ENDPOINTS;