import { toast } from "react-hot-toast";

/**
 * Handles errors throughout the application with user-friendly messages
 * @param error The error object
 * @param customMessage Optional custom message to display instead of the default
 */
export const handleError = (error: unknown, customMessage?: string): void => {
  // Only log errors in development mode
  if (import.meta.env.DEV) {
    console.error('Error occurred:', error);
  }
  
  // Show a user-friendly message
  const message = customMessage || "Une erreur s'est produite. Veuillez réessayer plus tard.";
  toast.error(message);
};

/**
 * Returns a user-friendly error message based on error type/status
 * @param error The error object
 * @param fallbackMessage Optional fallback message
 */
export const getFriendlyErrorMessage = (error: unknown, fallbackMessage = "Une erreur s'est produite. Veuillez réessayer."): string => {
  if (typeof error === 'string') return error;
  
  if (error instanceof Error) {
    // In production, don't expose actual error messages to users
    if (process.env.NODE_ENV === 'production') {
      return fallbackMessage;
    }
    return error.message || fallbackMessage;
  }
  
  return fallbackMessage;
};

/**
 * A wrapper for API calls that handles errors gracefully
 * @param apiCall The async API function to call
 * @param errorMessage Optional custom error message
 */
export async function safeApiCall<T>(
  apiCall: () => Promise<T>,
  errorMessage = "Une erreur s'est produite. Veuillez réessayer."
): Promise<{ data: T | null; error: string | null }> {
  try {
    const data = await apiCall();
    return { data, error: null };
  } catch (error) {
    handleError(error, errorMessage);
    return { data: null, error: errorMessage };
  }
} 