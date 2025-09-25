/**
 * Reservation API endpoints
 */

const FRONT_RESERVATIONS_ENDPOINTS = {
    BASE: '/front/v1/reservations',
    getAllReservations: () => `${FRONT_RESERVATIONS_ENDPOINTS.BASE}`,
    getReservationById: (id: string) => `${FRONT_RESERVATIONS_ENDPOINTS.BASE}/${id}`,
    createReservation: () => `${FRONT_RESERVATIONS_ENDPOINTS.BASE}`,
    updateReservationStatus: (reservationNumber: string) => `${FRONT_RESERVATIONS_ENDPOINTS.BASE}/${reservationNumber}/status`,
    cancelReservation: () => `${FRONT_RESERVATIONS_ENDPOINTS.BASE}/cancel`,
    availableTimeSlots: (blaneId: string | number, date: string) => 
      `/front/v1/blanes/${blaneId}/available-time-slots?date=${date}`,
  };
  
export default FRONT_RESERVATIONS_ENDPOINTS;