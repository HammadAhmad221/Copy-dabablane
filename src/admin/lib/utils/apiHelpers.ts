/**
 * Handles API error responses consistently
 * 
 * @param error - The error object from the fetch call
 * @returns A formatted error message
 */
export const handleApiError = (error: any): string => {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    if (error.response.data && error.response.data.message) {
      return error.response.data.message;
    }
    return `Error ${error.response.status}: ${error.response.statusText}`;
  } else if (error.request) {
    // The request was made but no response was received
    return 'No response received from server. Please check your connection.';
  } else {
    // Something happened in setting up the request that triggered an Error
    return error.message || 'An unexpected error occurred';
  }
}; 