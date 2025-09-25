import axios from 'axios';
import FRONT_PAYMENT_ENDPOINTS from '../endpoints/payment';

// Base API URL configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export interface PaymentData {
  number: string;
  payment_type?: 'full' | 'partial';
}

export interface PaymentInputs {
  clientid: string;
  storetype: string;
  trantype: string;
  amount: string;
  currency: string;
  oid: string;
  okUrl: string;
  failUrl: string;
  lang: string;
  email: string;
  BillToName: string;
  BillToCompany: string;
  BillToStreet1: string;
  BillToCity: string;
  BillToStateProv: string;
  BillToPostalCode: string;
  tel: string;
  rnd: string;
  hashAlgorithm: string;
  callbackUrl: string;
  encoding: string;
  hash: string;
}

export interface PaymentResponse {
  payment_url: string;
  inputs: PaymentInputs;
}

export class PaymentService {
  /**
   * Initiates a CMI payment transaction
   */
  static async initiateCmiPayment(
    data: PaymentData,
  ): Promise<PaymentResponse> {
    try {
      // Ensure number has the correct format (must start with ORDER or RES)
      const formattedNumber = this.formatPaymentNumber(data.number);
      
      // Create a new object to avoid modifying the original
      const paymentData = {
        ...data,
        number: formattedNumber
      };
            
      const response = await axios.post(
        `${API_BASE_URL}${FRONT_PAYMENT_ENDPOINTS.getCmi()}`,
        paymentData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Auth-Token': import.meta.env.VITE_API_TOKEN
          },
          timeout: 10000
        }
      );

      // If the response is wrapped in a data property
      const responseData = response.data.data || response.data;

      // Validate the payment data
      if (!responseData.payment_url || !responseData.inputs) {
        throw new Error('Invalid payment data received from server');
      }

      return {
        payment_url: responseData.payment_url,
        inputs: responseData.inputs
      };
    } catch (error) {
      console.error('Payment initiation error:', error);
      throw error instanceof Error 
        ? error 
        : new Error('Payment initiation failed');
    }
  }
  
  /**
   * Format the payment number to ensure it has the correct prefix
   * Expected format by API: Must start with ORDER or RES
   */
  private static formatPaymentNumber(number: string): string {
    // If number is in the format RES-XK123456, keep it exactly as is
    if (/^RES-[A-Z0-9]+/i.test(number)) {
      return number;
    }
    
    // If number is in the format ORDER-XK123456, keep it exactly as is
    if (/^ORDER-[A-Z0-9]+/i.test(number)) {
      return number;
    }
    
    // If number starts with BLANE-RES-, extract just the reservation code
    if (number.startsWith('BLANE-RES-')) {
      const resId = number.replace('BLANE-', '');
      return resId;
    }
    
    // If number starts with BLANE-ORDER-, extract just the order code
    if (number.startsWith('BLANE-ORDER-')) {
      const orderId = number.replace('BLANE-', '');
      return orderId;
    }
    
    // If number starts with BLANE-, check if it contains a reservation ID format
    if (number.startsWith('BLANE-')) {
      const afterPrefix = number.replace('BLANE-', '');
      // If after removing BLANE- it looks like a RES ID
      if (/^RES[A-Z0-9]+/i.test(afterPrefix)) {
        // Add the dash if missing
        if (!afterPrefix.includes('-')) {
          const formatted = `RES-${afterPrefix.replace('RES', '')}`;
          return formatted;
        }
        return afterPrefix;
      }
      
      // If after removing BLANE- it looks like an ORDER ID
      if (/^ORDER[A-Z0-9]+/i.test(afterPrefix)) {
        // Add the dash if missing
        if (!afterPrefix.includes('-')) {
          const formatted = `ORDER-${afterPrefix.replace('ORDER', '')}`;
          return formatted;
        }
        return afterPrefix;
      }
      
      // If it starts with VZ or other code that needs to be formatted as RES-VZxxxxx
      if (/^VZ[0-9]+/i.test(afterPrefix)) {
        const formatted = `RES-${afterPrefix}`;
        return formatted;
      }
    }
    
    // If it's a numeric string, assume it's an ID that needs a prefix
    if (/^\d+$/.test(number)) {
      // Based on backend implementation, numbers need to start with ORDER or RES
      return number; // We'll let UserPaymentService handle the formatting
    }
    
    // If number already starts with ORDER or RES (but not RES-), check if it needs a dash
    if (number.startsWith('RES') && !number.startsWith('RES-')) {
      // Check if it's like "RESVZ400681" and needs to be "RES-VZ400681"
      if (/^RES[A-Z]{2}[0-9]+$/i.test(number)) {
        const resCode = number.substring(3); // Extract everything after "RES"
        const formatted = `RES-${resCode}`;
        return formatted;
      }
      return number;
    }
    
    if (number.startsWith('ORDER') && !number.startsWith('ORDER-')) {
      // Check if it's like "ORDERVZ400681" and needs to be "ORDER-VZ400681"
      if (/^ORDER[A-Z]{2}[0-9]+$/i.test(number)) {
        const orderCode = number.substring(5); // Extract everything after "ORDER"
        const formatted = `ORDER-${orderCode}`;
        return formatted;
      }
      return number;
    }
    
    // If number starts with order_, reservation_, or similar, format appropriately
    if (number.toLowerCase().includes('order')) {
      // Check if it might be a format like "VZ400681" that needs "ORDER-" prefix
      if (/^VZ[0-9]+$/i.test(number)) {
        return `ORDER-${number}`;
      }
      
      return `ORDER${number.replace(/[^0-9]/g, '')}`;
    }
    
    if (number.toLowerCase().includes('res')) {
      // Check if it might be a format like "VZ400681" that needs "RES-" prefix
      if (/^VZ[0-9]+$/i.test(number)) {
        return `RES-${number}`;
      }
      
      const numericPart = number.replace(/[^0-9]/g, '');
      if (numericPart) {
        return `RES${numericPart}`;
      }
    }
    
    // If we can't determine the type, return as is and let the backend handle it
    return number;
  }
}

export default PaymentService;
