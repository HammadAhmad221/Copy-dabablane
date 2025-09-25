const BASE_URL = '/back/v1/addresses'; // Changed to "addresses"

const BACK_ADDRESS_ENDPOINTS = {
  BASE: BASE_URL,
  getAllAddresses: () => BASE_URL, // Retrieves all addresses
  getAddressById: (id: string) => `${BASE_URL}/${id}`, // Retrieves a single address by ID
  createAddress: () => BASE_URL, // Creates a new address
  updateAddress: (id: string) => `${BASE_URL}/${id}`, // Updates a specific address by ID
  deleteAddress: (id: string) => `${BASE_URL}/${id}`, // Deletes a specific address by ID
};

export default BACK_ADDRESS_ENDPOINTS;
