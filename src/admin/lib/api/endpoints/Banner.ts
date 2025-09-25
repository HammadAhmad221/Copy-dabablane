const BASE_URL = '/back/v1/banners'; // Changed to "addresses"

const BACK_BANNER_ENDPOINTS = {
  BASE: BASE_URL,  
  createBanner: () => BASE_URL, // Creates a new banner
  updateBanner: (id: string) => `${BASE_URL}/${id}`, // Updates a specific banner by ID
  deleteBanner: (id: string) => `${BASE_URL}/${id}`, // Deletes a specific banner by ID
};

export default BACK_BANNER_ENDPOINTS;