import { GuestApiClient } from '../client';
import FRONT_CONTACT_ENDPOINTS from '../endpoints/contact';
import { ContactFormData, ContactResponse } from '../types/contact';

export const contactService = {
  async create(data: ContactFormData): Promise<ContactResponse> {
    const response = await GuestApiClient.post<ContactResponse>(
      FRONT_CONTACT_ENDPOINTS.createContact(),
      data
    );

    return response.data;
  },
}; 