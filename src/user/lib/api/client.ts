import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';

// Base API URL configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
const USER_API_PATH = '';

// Default retry configuration
export const DEFAULT_RETRY_CONFIG = {
  maxRetries: 2,
  retryDelay: 1000,
  timeout: 10000,
};

// Extend AxiosRequestConfig to include retry-specific properties
interface RetryAxiosRequestConfig extends AxiosRequestConfig {
  _maxRetries?: number;
  _retryDelay?: number;
}

/**
 * Adds retry capability to an axios instance
 */
const addRetryInterceptor = (
  instance: AxiosInstance,
  defaultConfig = DEFAULT_RETRY_CONFIG
) => {
  // Create a map to track retry counts for each request
  const retryMap = new Map<string, number>();

  // Request interceptor to set timeout and store original request
  instance.interceptors.request.use(
    (config) => {
      const requestId = `${config.method}-${config.url}`;
      // Reset retry count for new requests
      if (!retryMap.has(requestId)) {
        retryMap.set(requestId, 0);
      }
      
      // Use custom timeout if specified in request config
      const timeout = config.timeout || defaultConfig.timeout;
      return { ...config, timeout };
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor for retry logic
  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      // Get the original request config
      const config = error.config as RetryAxiosRequestConfig;
      if (!config) {
        return Promise.reject(error);
      }

      // Get custom retry settings from config or use defaults
      const maxRetries = config._maxRetries || defaultConfig.maxRetries;
      const retryDelay = config._retryDelay || defaultConfig.retryDelay;
      
      // Generate a unique ID for this request to track retries
      const requestId = `${config.method}-${config.url}`;
      const currentRetryCount = retryMap.get(requestId) || 0;
      
      // Check if we should retry
      const shouldRetry = () => {
        // Don't retry if we've reached max retries
        if (currentRetryCount >= maxRetries) return false;
        
        // Don't retry for 4xx client errors
        if (error.response && error.response.status >= 400 && error.response.status < 500) {
          return false;
        }
        
        // Retry for network errors, timeouts and server errors
        return (
          !error.response || // Network error
          error.code === 'ECONNABORTED' || // Timeout
          error.code === 'ERR_NETWORK' || // Network error
          error.code === 'ERR_CONNECTION_REFUSED' || // Connection refused
          (error.response && error.response.status >= 500) // Server errors
        );
      };

      // Retry the request if conditions are met
      if (shouldRetry()) {
        retryMap.set(requestId, currentRetryCount + 1);
        
        // Calculate exponential backoff delay
        const delay = retryDelay * Math.pow(2, currentRetryCount);
        
        try {
          // Wait for the backoff period
          await new Promise(resolve => setTimeout(resolve, delay));
          
          // Make a new request
          const response = await instance(config);
          retryMap.delete(requestId); // Clean up after successful retry
          return response;
        } catch (retryError) {
          // If this was the last retry, clean up
          if (currentRetryCount + 1 >= maxRetries) {
            retryMap.delete(requestId);
          }
          // Continue to rejection
          return Promise.reject(retryError);
        }
      }
      
      // Clean up retry tracking if we're not retrying
      retryMap.delete(requestId);
      
      // Format error message based on error type
      if (error.response) {
        // The request was made and the server responded with an error status code
        const status = error.response.status;
        const errorMessage = getErrorMessageByStatus(status, config.url);
        
        // Create a new error that preserves the original response
        const enhancedError = new Error(errorMessage) as any;
        enhancedError.response = error.response;
        enhancedError.request = error.request;
        enhancedError.config = error.config;
        enhancedError.isAxiosError = true;
        enhancedError.status = status;
        
        return Promise.reject(enhancedError);
      } else if (error.request) {
        // The request was made but no response was received
        const networkError = error.code === 'ECONNABORTED'
          ? new Error(`La requête a expiré. Veuillez réessayer plus tard.`)
          : new Error('Aucune réponse reçue. Vérifiez votre connexion internet.');
        
        // Preserve original request information
        (networkError as any).request = error.request;
        (networkError as any).config = error.config;
        (networkError as any).isAxiosError = true;
        
        return Promise.reject(networkError);
      }
      
      // Something happened in setting up the request that triggered an Error
      const setupError = new Error(`La requête a échoué. Veuillez réessayer plus tard.`);
      (setupError as any).config = error.config;
      (setupError as any).isAxiosError = true;
      
      return Promise.reject(setupError);
    }
  );

  return instance;
};

/**
 * Get error message based on HTTP status code
 */
const getErrorMessageByStatus = (status: number, url?: string): string => {
  switch (status) {
    case 400:
      return `Requête invalide. Veuillez vérifier vos informations.`;
    case 401:
      return `Vous devez être connecté pour accéder à cette ressource.`;
    case 403:
      return `Vous n'avez pas les droits nécessaires pour accéder à cette ressource.`;
    case 404:
      return `Ressource non trouvée.`;
    case 500:
    case 502:
    case 503:
    case 504:
      return `Erreur serveur. Veuillez réessayer plus tard.`;
    default:
      return `Une erreur est survenue. Veuillez réessayer plus tard.`;
  }
};

/**
 * Create axios instance with retry capability for guest API calls
 */
export const GuestApiClient = addRetryInterceptor(
  axios.create({
    baseURL: `${API_BASE_URL}${USER_API_PATH}`,
    timeout: DEFAULT_RETRY_CONFIG.timeout,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Auth-Token': import.meta.env.VITE_API_TOKEN
    },
  })
);

/**
 * Apply custom retry configuration to a request
 */
export const withRetry = (config: AxiosRequestConfig, retryConfig?: {
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
}): RetryAxiosRequestConfig => {
  return {
    ...config,
    _maxRetries: retryConfig?.maxRetries,
    _retryDelay: retryConfig?.retryDelay,
    timeout: retryConfig?.timeout || config.timeout
  };
};