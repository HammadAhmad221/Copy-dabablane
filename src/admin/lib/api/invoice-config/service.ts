import { adminApiClient as apiClient } from '../client';
import {
  CreateInvoiceConfigRequest,
  CreateInvoiceConfigResponse,
  GetInvoiceConfigResponse,
} from './types';

const CONFIG_URL = '/back/v1/admin/subscriptions/configurations';

interface InvoiceConfigService {
  getConfiguration: () => Promise<GetInvoiceConfigResponse>;
  createConfiguration: (payload: CreateInvoiceConfigRequest) => Promise<CreateInvoiceConfigResponse>;
}

export const invoiceConfigService: InvoiceConfigService = {
  getConfiguration: async () => {
    const response = await apiClient.get<GetInvoiceConfigResponse>(CONFIG_URL);
    return response.data;
  },

  createConfiguration: async (payload) => {
    const formData = new FormData();
    formData.append('billing_email', payload.billing_email);
    formData.append('contact_email', payload.contact_email);
    formData.append('contact_phone', payload.contact_phone);
    formData.append('invoice_legal_mentions', payload.invoice_legal_mentions);
    formData.append('invoice_prefix', payload.invoice_prefix);
    if (payload.invoice_logo_path) {
      const file = payload.invoice_logo_path as File;
      if (typeof (file as any).name === 'string') {
        formData.append('invoice_logo_path', file, file.name);
      } else {
        // Fallback: wrap Blob as File with a default name and type if available
        const blob = payload.invoice_logo_path as Blob;
        const fallbackType = (blob as any).type || 'image/png';
        const wrapped = new File([blob], 'logo.png', { type: fallbackType });
        formData.append('invoice_logo_path', wrapped, wrapped.name);
      }
    }

    const response = await apiClient.post<CreateInvoiceConfigResponse>(CONFIG_URL, formData);
    return response.data;
  },
};

export default invoiceConfigService;
