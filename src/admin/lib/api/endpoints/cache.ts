const BASE_URL = '/back/v1/cache'; // Changed to "cache"

const BACK_CACHE_ENDPOINTS = {
  BASE: BASE_URL,
  getAllCache: () => BASE_URL, // Retrieves all cache items
  getCacheByKey: (key: string) => `${BASE_URL}/${key}`, // Retrieves a specific cache item by key
  createCache: () => BASE_URL, // Creates a new cache item
  updateCache: (key: string) => `${BASE_URL}/${key}`, // Updates a specific cache item by key
  deleteCache: (key: string) => `${BASE_URL}/${key}`, // Deletes a specific cache item by key
};

export default BACK_CACHE_ENDPOINTS;
