/**
 * Custom hook to normalize status values from the backend
 * Consistently handles various status values from different API endpoints
 */
export type NormalizedStatus = 
  | "pending" 
  | "paid" 
  | "processing" 
  | "delivered" 
  | "canceled" 
  | "failed" 
  | "recovery" 
  | "confirmed" 
  | "cancelled" 
  | "shipped";

export const useStatusNormalization = () => {
  /**
   * Normalizes a status value to a consistent format
   */
  const normalizeStatus = (status: string | undefined): NormalizedStatus => {
    if (!status) return 'pending';
    
    // Convert to lowercase for case-insensitive comparison
    const normalizedStatus = status.toLowerCase();
    
    // Map various spellings to consistent status values
    let result: NormalizedStatus = 'pending';
    
    if (normalizedStatus === 'cancelled') result = 'canceled';
    else if (normalizedStatus === 'delivered') result = 'delivered';
    else if (normalizedStatus === 'shipped') result = 'shipped';
    else if (normalizedStatus === 'processing') result = 'processing'; 
    else if (normalizedStatus === 'confirmed') result = 'confirmed';
    else if (normalizedStatus === 'pending') result = 'pending';
    else if (normalizedStatus === 'paid') result = 'paid';
    else if (normalizedStatus === 'failed') result = 'failed';
    else if (normalizedStatus === 'recovery') result = 'recovery';
    else result = 'pending';
    
    return result;
  };

  /**
   * Determines if a status indicates the payment needs to be retried
   */
  const isRetryableStatus = (status: string | undefined): boolean => {
    const normalized = normalizeStatus(status);
    return normalized === 'failed' || normalized === 'pending' || normalized === 'recovery';
  };
  
  /**
   * Determines if a status is a successful one
   */
  const isSuccessStatus = (status: string | undefined): boolean => {
    const normalized = normalizeStatus(status);
    return normalized === 'paid' || normalized === 'confirmed' || 
           normalized === 'delivered' || normalized === 'shipped' ||
           normalized === 'processing';
  };
  
  /**
   * Determines if a status is a cancelled one
   */
  const isCancelledStatus = (status: string | undefined): boolean => {
    const normalized = normalizeStatus(status);
    return normalized === 'canceled';
  };

  return {
    normalizeStatus,
    isRetryableStatus,
    isSuccessStatus,
    isCancelledStatus
  };
};

export default useStatusNormalization; 