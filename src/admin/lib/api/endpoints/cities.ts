const BASE_URL = '/back/v1/cities'; // Changed to "cities"

const BACK_CITY_ENDPOINTS = {
  BASE: BASE_URL,
  getAllCities: () => BASE_URL, // Retrieves all cities
  getCityById: (id: string) => `${BASE_URL}/${id}`, // Retrieves a specific city by ID
  createCity: () => BASE_URL, // Creates a new city
  updateCity: (id: string) => `${BASE_URL}/${id}`, // Updates a specific city by ID
  deleteCity: (id: string) => `${BASE_URL}/${id}`, // Deletes a specific city by ID
};

export default BACK_CITY_ENDPOINTS;
