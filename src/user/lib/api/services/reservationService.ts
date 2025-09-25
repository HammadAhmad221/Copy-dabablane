/**
 * Reservation Service for handling reservation-related API calls
 */
import { GuestApiClient } from '../client';
import FRONT_RESERVATIONS_ENDPOINTS from '../endpoints/reservation';
import { ReservationData, ReservationResponse, TimeSlot } from '../../types/reservation';
import { ReservationFormData, ReservationType } from '../../types/reservations';

// Define cancellation response interface
interface CancellationResponse {
  success: boolean;
  message: string;
}

// Define cancellation data interface that will be returned by the API
export interface CancellationData {
  id: string;
  token: string;
  timestamp: string;
}

/**
 * Reservation service with methods for interacting with the reservation API
 */
export const reservationService = {
  /**
   * Fetches available time slots for a specific date and blane
   * 
   * @param blaneId - The ID of the blane
   * @param date - The date to check for available time slots
   * @returns Promise with time slot data
   */
  async getAvailableTimeSlots(slug: string, date: string): Promise<TimeSlot[]> {
    try {
      const response = await GuestApiClient.get(
        FRONT_RESERVATIONS_ENDPOINTS.availableTimeSlots(slug, date)
      );
      
      return response.data.data || [];
    } catch (error) {
      console.error("Error fetching time slots:", error);
      // Return empty array instead of throwing to make component more resilient
      return [];
    }
  },

  /**
   * Creates a new reservation
   * 
   * @param reservationData - The reservation data to submit
   * @returns Promise with the created reservation data and payment info if applicable
   */
  async createReservation(reservationData: ReservationData): Promise<any> {
    try {
      const response = await GuestApiClient.post(
        FRONT_RESERVATIONS_ENDPOINTS.createReservation(),
        reservationData
      );
      
      // Return the full response object so we can access payment_info
      // and other properties that might be at the top level
      return response.data;
    } catch (error) {
      console.error("Error creating reservation:", error);
      throw error;
    }
  },

  /**
   * Gets a specific reservation by ID
   * 
   * @param id - The ID of the reservation to retrieve
   * @returns Promise with the reservation data
   */
  async getReservationById(id: string): Promise<ReservationResponse> {
    try {
      const response = await GuestApiClient.get(
        FRONT_RESERVATIONS_ENDPOINTS.getReservationById(id),
        {
          params: {
            include: 'blane,blane.blaneImages,customer' // Include blane data to avoid additional API calls
          }
        }
      );
      
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching reservation ${id}:`, error);
      throw error;
    }
  },

  /**
   * Updates the status of a reservation
   * 
   * @param reservationId - The ID of the reservation to update
   * @param data - The status data to update
   * @returns Promise with the updated reservation data
   */
  async updateReservationStatus(reservationId: string, data: { status: string }): Promise<ReservationResponse> {
    try {
      const response = await GuestApiClient.patch<{ data: ReservationResponse }>(
        FRONT_RESERVATIONS_ENDPOINTS.updateReservationStatus(reservationId),
        data
      );
      return response.data.data;
    } catch (error) {
      console.error(`Error updating status for reservation ${reservationId}:`, error);
      throw error;
    }
  },

  /**
   * Cancels a reservation using the cancellation token and data
   * 
   * @param reservationNumber - The reservation number or ID
   * @param token - The cancellation token provided by the API
   * @param timestamp - The timestamp associated with the cancellation token
   * @returns Promise with cancellation result
   */
  async cancelReservation(reservationNumber: string, token: string, timestamp: string): Promise<CancellationResponse> {
    try {
      const response = await GuestApiClient.post<CancellationResponse>(
        FRONT_RESERVATIONS_ENDPOINTS.cancelReservation(),
        {
          id: reservationNumber,
          token,
          timestamp
        }
      );
      
      return response.data;
    } catch (error) {
      console.error(`Error canceling reservation ${reservationNumber}:`, error);
      throw error;
    }
  },
}; 
