import { adminApiClient as apiClient } from '../client';
import { ReservationType, ReservationsResponse, ReservationFormData, ReservationFilters } from '../types/reservations';
import { ApiResponse } from '../types/api';
import CustomerService from './customerService';
import { toast } from 'react-hot-toast';
import BACK_RESERVATIONS_ENDPOINTS from '../endpoints/reservations';
const BASE_URL = '/back/v1/reservations';

export const reservationApi = {
  async getReservations(filters: ReservationFilters = {}): Promise<ReservationsResponse> {
    try {
      const params = new URLSearchParams({
        page: (filters.page || 1).toString(),
        paginationSize: (filters.paginationSize || 10).toString(),
        ...(filters.sortBy && { sortBy: filters.sortBy }),
        ...(filters.sortOrder && { sortOrder: filters.sortOrder }),
        ...(filters.search && { search: filters.search }),
      });

      // Get reservations and customers in parallel
      const [reservationsResponse, customersResponse] = await Promise.all([
        apiClient.get<ReservationsResponse>('/back/v1/reservations', { params }),
        CustomerService.getAll()
      ]);

      // Map customer data to reservations
      const reservationsWithCustomerData = {
        ...reservationsResponse.data,
        data: reservationsResponse.data.data.map(reservation => {
          const customer = customersResponse.data.find(c => c.id === reservation.customers_id);
          if (customer) {
            return {
              ...reservation,
              name: customer.name,
              email: customer.email,
              city: customer.city
            };
          }
          return reservation;
        })
      };

      return reservationsWithCustomerData;
    } catch (error) {
      throw error;
    }
  },

  async getReservation(id: string): Promise<ReservationType> {
    try {
      const response = await apiClient.get<ApiResponse<ReservationType>>(BACK_RESERVATIONS_ENDPOINTS.getReservationById(id));
      return response.data.data;
    } catch (error) {
      toast.error('Failed to fetch reservation');
      throw error;
    }
  },

  async createReservation(data: ReservationFormData): Promise<ReservationType> {
    try {
      const response = await apiClient.post<ApiResponse<ReservationType>>(BACK_RESERVATIONS_ENDPOINTS.createReservation(), data);
      toast.success('Reservation created successfully');
      return response.data.data;
    } catch (error) {
      toast.error('Failed to create reservation');
      throw error;
    }
  },

  async updateReservation(id: string, data: Partial<ReservationFormData>): Promise<ReservationType> {
    try {
      const response = await apiClient.put<ApiResponse<ReservationType>>(BACK_RESERVATIONS_ENDPOINTS.updateReservation(id), data);
      toast.success('Reservation updated successfully');
      return response.data.data;
    } catch (error) {
      toast.error('Failed to update reservation');
      throw error;
    }
  },

  async deleteReservation(id: string): Promise<void> {
    try {
      await apiClient.delete(BACK_RESERVATIONS_ENDPOINTS.deleteReservation(id));
      toast.success('Reservation deleted successfully');
    } catch (error) {
      toast.error('Failed to delete reservation');
      throw error;
    }
  },
  async updateReservationStatus(id: string, status: string): Promise<ReservationType> {
    try {
      const response = await apiClient.patch<ApiResponse<ReservationType>>(BACK_RESERVATIONS_ENDPOINTS.updateReservationStatus(id), { status });
      return response.data.data;
    } catch (error) {
      toast.error('Failed to update reservation status');
      throw error;
    }
  }
}; 