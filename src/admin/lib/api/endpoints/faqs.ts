const BASE_URL = '/back/v1/faqs'; // Changed to "faqs"

const BACK_FAQ_ENDPOINTS = {
  BASE: BASE_URL,
  getAllFaqs: () => BASE_URL, // Retrieves all FAQs
  getFaqById: (id: string) => `${BASE_URL}/${id}`, // Retrieves a specific FAQ by ID
  createFaq: () => BASE_URL, // Creates a new FAQ
  updateFaq: (id: string) => `${BASE_URL}/${id}`, // Updates a specific FAQ by ID
  deleteFaq: (id: string) => `${BASE_URL}/${id}`, // Deletes a specific FAQ by ID
};

export default BACK_FAQ_ENDPOINTS;
