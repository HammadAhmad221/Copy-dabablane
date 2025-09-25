const BASE_URL = '/back/v1/blan-images'; // Changed to "blane-images"

const BACK_BLANE_IMAGE_ENDPOINTS = {
  BASE: BASE_URL,
  getAllBlaneImages: () => BASE_URL, // Retrieves all blane images
  getBlaneImageById: (id: string) => `${BASE_URL}/${id}`, // Retrieves a specific blane image by ID
  createBlaneImage: () => BASE_URL, // Creates a new blane image
  updateBlaneImage: (id: string) => `${BASE_URL}/${id}`, // Updates a specific blane image by ID
  deleteBlaneImage: (id: string) => `${BASE_URL}/${id}`, // Deletes a specific blane image by ID
};

export default BACK_BLANE_IMAGE_ENDPOINTS;
