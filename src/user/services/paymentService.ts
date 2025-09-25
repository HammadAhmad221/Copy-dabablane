import PaymentService from '@/user/lib/api/services/paymentService';
import { PaymentData } from '@/user/lib/api/services/paymentService';

/**
 * Payment service for user-facing payment processing
 */
export class UserPaymentService {
  /**
   * Initiates a payment for an order or reservation
   * @param type The type of entity being paid for (order or reservation)
   * @param entityId The ID of the order or reservation
   * @param paymentType Whether this is a full or partial payment
   * @returns Payment data with redirect URL and form inputs
   */
  async initiatePayment(
    type: 'order' | 'reservation',
    entityId: string,
    paymentType: 'full' | 'partial'
  ): Promise<{ redirect_url: string; payment_form_data?: Record<string, string> }> {
    try {
      // Format the entity ID with the proper prefix
      const formattedId = this.formatEntityId(type, entityId);
      // Create payment data object with payment type included
      const paymentData: PaymentData = {
        number: formattedId,
        payment_type: paymentType // Include payment type in the request
      };

      // Initiate CMI payment through the API service
      const cmiResponse = await PaymentService.initiateCmiPayment(paymentData);

      // Return the data needed for the redirect
      return {
        redirect_url: cmiResponse.payment_url,
        payment_form_data: cmiResponse.inputs as unknown as Record<string, string>
      };
    } catch (error) {
      console.error('Payment initiation error:', error);
      throw error instanceof Error 
        ? error 
        : new Error('Failed to initiate payment');
    }
  }

  /**
   * Processes a payment redirect to 3D Secure gateway
   * Always uses POST method with form data for compatibility with 3D Secure requirements
   * @param redirectUrl The payment gateway URL
   * @param formData The form data to submit
   */
  submitPaymentForm(redirectUrl: string, formData?: Record<string, string>): void {
    // Always use form submission with POST method for 3D Secure
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = redirectUrl;
    
    // Add input fields if form data is provided
    if (formData && Object.keys(formData).length > 0) {
      Object.entries(formData).forEach(([name, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = name;
        input.value = String(value);
        form.appendChild(input);
      });
    }
    
    // Append to document and submit
    document.body.appendChild(form);
    form.submit();
  }

  /**
   * Formats an entity ID with the appropriate prefix for the backend API
   * @param type The type of entity (order or reservation)
   * @param entityId The raw entity ID
   * @returns Formatted ID string with prefix
   */
  private formatEntityId(type: 'order' | 'reservation', entityId: string): string {
    // If it's a reservation ID that matches the pattern RES-XK... (alphanumeric after RES-), 
    // return it as is
    if (type === 'reservation' && /^RES-[A-Z0-9]+$/.test(entityId)) {
      return entityId;
    }
    
    // If it's a numeric string, we need to prefix it appropriately
    if (/^\d+$/.test(entityId)) {
      if (type === 'order') {
        return `ORDER${entityId}`;
      } else {
        // Important: For reservations, we need to check if we have the NUM_RES stored
        // Try to access localStorage to get the reservation data
        try {
          // Look through localStorage for this reservation ID
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.includes('reservation_data')) {
              const reservationData = JSON.parse(localStorage.getItem(key) || '{}');
              if (reservationData && reservationData.id === parseInt(entityId) && reservationData.NUM_RES) {
                return reservationData.NUM_RES;
              }
            }
          }
        } catch (e) {
          // Silently handle localStorage errors
        }
        
        // If we can't find the correct format, use a simple prefix
        return `RES${entityId}`;
      }
    }
    
    // If the entityId contains entity data like full reservation or order object
    if (typeof entityId === 'string' && (entityId.includes('"id"') || entityId.includes('"NUM_RES"'))) {
      try {
        const parsedData = JSON.parse(entityId);
        
        // If we have NUM_RES directly, use it
        if (parsedData.NUM_RES) {
          return parsedData.NUM_RES;
        }
        
        // Otherwise use the ID with prefix
        if (parsedData.id) {
          if (type === 'order') {
            return `ORDER${parsedData.id}`;
          } else {
            return `RES${parsedData.id}`;
          }
        }
      } catch (e) {
        // Not valid JSON, continue with other checks
      }
    }
    
    // For existing prefixed IDs, preserve them
    if (entityId.startsWith('ORDER') || entityId.startsWith('RES')) {
      return entityId;
    }
    
    // Default fallback
    if (type === 'order') {
      return `ORDER${entityId.replace(/\D/g, '')}`;
    } else {
      return `RES${entityId.replace(/\D/g, '')}`;
    }
  }

  /**
   * Gets the status of a payment
   * @param paymentId The payment ID from the callback
   * @returns Payment status information
   */
  async getPaymentStatus(paymentId: string): Promise<{
    status: 'pending' | 'completed' | 'failed';
    message: string;
    order_number?: string;
    reservation_number?: string;
  }> {
    try {
      // TODO: Implement the API call to check payment status
      // This would need a corresponding API endpoint method
      
      // Mock implementation for now
      return {
        status: 'completed',
        message: 'Votre paiement a été traité avec succès.',
        order_number: paymentId
      };
    } catch (error) {
      console.error('Payment status check error:', error);
      throw error instanceof Error 
        ? error 
        : new Error('Failed to check payment status');
    }
  }
}

// Export as a singleton instance
export const paymentService = new UserPaymentService(); 