const BASE_URL = '/back/v1/cache-locks'; // Changed to "cache-locks"

const BACK_CACHE_LOCKS_ENDPOINTS = {
  BASE: BASE_URL,
  getAllCacheLocks: () => BASE_URL, // Retrieves all cache locks
  getCacheLockByKey: (key: string) => `${BASE_URL}/${key}`, // Retrieves a specific cache lock by key
  createCacheLock: () => BASE_URL, // Creates a new cache lock
  updateCacheLock: (key: string) => `${BASE_URL}/${key}`, // Updates a specific cache lock by key
  deleteCacheLock: (key: string) => `${BASE_URL}/${key}`, // Deletes a specific cache lock by key
};

export default BACK_CACHE_LOCKS_ENDPOINTS;
