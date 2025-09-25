import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { SimpleOrderForm } from '../components/order/SimpleOrderForm';
import { SimpleReservationForm } from '../components/reservation/SimpleReservationForm';
import Loader from '@/user/components/ui/Loader';
import { 
  BlaneImageGallery, 
  BlaneInfo, 
  BlaneDeliveryInfo,
  BlaneErrorDisplay
} from '@/user/components/blane';
import { ReservationSummary } from '@/user/components/reservation/ReservationSummary';
import { OrderSummary } from '@/user/components/order/OrderSummary';
import { reservationService } from '@/user/lib/api/services/reservationService';
import { orderService } from '@/user/lib/api/services/orderService';
import { BlaneService } from '@/user/lib/api/services/blaneService';
import NotFound from './NotFound';

// Define the transaction status types
type TransactionStatus = 'confirmed' | 'pending' | 'shipped' | 'cancelled' | 'paid' | 'failed' | 'canceled' | 'processing' | 'delivered';

// Define the transaction data interface
interface TransactionData {
  type: 'reservation' | 'order';
  id: string;
  method?: string;
  amount?: number;
  timestamp?: string;
  status: TransactionStatus;
  data: ReservationResponse | OrderType;
}

// Define simplified interfaces for ReservationResponse and OrderType
interface ReservationResponse {
  id: number;
  NUM_RES?: string;
  status: string;
  total_price: number;
  partiel_price?: number;
  payment_method: string;
  date: string;
  time?: string;
  number_persons: number;
  quantity: number;
  blane_id?: number;
  blane?: {
    id: number | string;
    name: string;
    type: string;
    slug: string;
    price_current: number;
    price_old?: number;
    is_digital?: boolean;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface OrderType {
  id?: number;
  NUM_ORD?: string;
  status?: string;
  total_price?: number;
  partiel_price?: number;
  payment_method?: string;
  quantity?: number;
  blane_id?: number;
  blane?: {
    id: number | string;
    name: string;
    type: string;
    slug: string;
    price_current: number;
    price_old?: number;
    is_digital?: boolean;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

// Define extended Blane type that can work with both library types
interface ExtendedBlaneType {
  id: number | string;
  slug: string;
  name: string;
  type: string;
  price_current: number;
  price_old?: number;
  expiration_date?: string;
  end_date?: string;
  start_date?: string;
  stock?: number;
  livraison_in_city?: number;
  is_digital?: boolean;
  images?: string[];
  [key: string]: unknown; // Allow for additional properties
}

// Utility function to convert Blane/API data to ExtendedBlaneType
const convertToExtendedBlane = (blaneData: unknown): ExtendedBlaneType => {
  if (!blaneData) {
    // Return a default empty object with required properties
    return {
      id: '',
      slug: '',
      name: '',
      type: '',
      price_current: 0,
      images: []
    } as ExtendedBlaneType;
  }
  
  const data = blaneData as Record<string, any>;
  
  // Handle images: check for blaneImages first (from API), then images property
  let images: string[] = [];
  
  // Extract images from blane_images array if it exists
  if (data.blane_images && Array.isArray(data.blane_images)) {
    images = data.blane_images.map((img: any) => {
      if (typeof img === 'object' && img !== null && 'image_link' in img) {
        return img.image_link;
      }
      return null;
    }).filter(Boolean);
  } 
  // Otherwise use images array if it exists
  else if (data.images && Array.isArray(data.images)) {
    images = data.images;
  }
  
  // If we still don't have any images, try setting the main image from other properties
  if (images.length === 0 && data.image) {
    images = [data.image];
  }
  
  return {
    id: data.id,
    slug: data.slug || '',
    name: data.name || '',
    type: data.type || '',
    price_current: data.price_current || 0,
    price_old: data.price_old,
    expiration_date: data.expiration_date,
    end_date: data.end_date,
    start_date: data.start_date,
    stock: data.stock,
    livraison_in_city: data.livraison_in_city,
    is_digital: data.is_digital,
    images: images,
    ...data
  };
};

const BlaneDetail = () => {
  // Get slug and optional token from URL params
  const { slug, token } = useParams<{ slug: string; token?: string }>();
  
  // State for transaction data (reservation or order)
  const [transaction, setTransaction] = useState<TransactionData | null>(null);
  const [isLoadingTransaction, setIsLoadingTransaction] = useState<boolean>(true);
  const [hasBlaneDataFromTransaction, setHasBlaneDataFromTransaction] = useState<boolean>(false);
  const [transactionBlane, setTransactionBlane] = useState<ExtendedBlaneType | null>(null);
  
  // State for direct blane loading (used when no transaction blane data is available)
  const [directBlane, setDirectBlane] = useState<ExtendedBlaneType | null>(null);
  const [isLoadingBlane, setIsLoadingBlane] = useState<boolean>(false);
  const [blaneError, setBlaneError] = useState<Error | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  
  // Add state to track the last status check time
  const [lastStatusCheckTime, setLastStatusCheckTime] = useState<number>(Date.now());
  
  // Function to fetch blane data directly from API
  const fetchBlaneData = async () => {
    if (!slug) return;
    
    try {
      setIsLoadingBlane(true);
      // Include blaneImages in the API request and pass token if available
      const requestOptions: any = {
        include: "blaneImages"
      };
      
      // Add token to request if it exists (for shared links)
      if (token) {
        requestOptions.token = token;
      }
      
      const response = await BlaneService.getBlaneBySlug(slug, requestOptions);
      
      if (response?.data) {
        const apiData = response.data;
        
        // Check if we have images property
        if (!apiData.images) {
          // Initialize empty images array if it doesn't exist
          apiData.images = [];
        }
        
        // Check if we need to extract images from blane_images
        if (apiData.blane_images && Array.isArray(apiData.blane_images) && apiData.blane_images.length > 0) {
          // Get image URLs from blane_images objects
          const extractedImages = apiData.blane_images
            .map((img: any) => {
              if (typeof img === 'object' && img !== null && img.image_link) {
                return img.image_link;
              }
              return null;
            })
            .filter(Boolean);
            
          // Add extracted images to the images array
          apiData.images = [...apiData.images, ...extractedImages];
        }
        
        // Convert to normalized format
        const blaneData = convertToExtendedBlane(apiData);
        
        setDirectBlane(blaneData);
        setBlaneError(null);
      } else {
        setBlaneError(new Error('Failed to fetch blane data'));
      }
    } catch (err) {
      setBlaneError(err instanceof Error ? err : new Error('Failed to fetch blane detail'));
    } finally {
      setIsLoadingBlane(false);
    }
  };

  // Add function to update transaction status from API
  const updateTransactionStatus = async () => {
    if (!transaction || !slug) return;
    
    try {
      if (transaction.type === 'reservation') {
        // Try to fetch updated reservation data from API
        try {
          // The reservationService already includes blane and blaneImages in the request
          const apiResponse = await reservationService.getReservationById(transaction.id);
          
          if (apiResponse) {
            // Store updated data in localStorage
            localStorage.setItem(`blane_${slug}_reservation_data`, JSON.stringify(apiResponse));
            
            // Update transaction state
            setTransaction({
              ...transaction,
              status: (apiResponse.status || 'pending') as TransactionStatus,
              data: apiResponse as any
            });
            
            // Handle blane data if available
            if (apiResponse && 'blane' in apiResponse && apiResponse.blane) {
              setHasBlaneDataFromTransaction(true);
              setTransactionBlane(convertToExtendedBlane(apiResponse.blane as any));
            }
          }
        } catch (err) {
          console.error('Error fetching updated reservation:', err);
        }
      } else if (transaction.type === 'order') {
        // Try to fetch updated order data from API
        try {
          // The orderService already includes blane in the request
          const apiResponse = await orderService.getOrder(transaction.id);
          
          if (apiResponse) {
            // Store updated data in localStorage
            localStorage.setItem(`blane_${slug}_order_data`, JSON.stringify(apiResponse));
            
            // Update transaction state
            setTransaction({
              ...transaction,
              status: (apiResponse.status || 'pending') as TransactionStatus,
              data: apiResponse as any
            });
            
            // Handle blane data if available
            if (apiResponse && 'blane' in apiResponse && apiResponse.blane) {
              setHasBlaneDataFromTransaction(true);
              setTransactionBlane(convertToExtendedBlane(apiResponse.blane as any));
            }
          }
        } catch (err) {
          console.error('Error fetching updated order:', err);
        }
      }
      
      // Update last check time
      setLastStatusCheckTime(Date.now());
    } catch (error) {
      console.error('Error in updateTransactionStatus:', error);
    }
  };

  // Only fetch blane data directly if we don't have it from a transaction
  useEffect(() => {
    if (slug && !hasBlaneDataFromTransaction) {
      fetchBlaneData();
    }
  }, [slug, hasBlaneDataFromTransaction]);

  // Set up initial status check for transactions
  useEffect(() => {
    if (!transaction) return;
    
    // Only perform initial check on mount
    updateTransactionStatus();
    
    // No interval setup - removed periodic checks
  }, [transaction?.id, transaction?.type]);

  // Check localStorage and API for existing transactions first
  useEffect(() => {
    const checkExistingTransactions = async () => {
      if (!slug) {
        setIsLoadingTransaction(false);
        return;
      }
      
      try {
        // First check if we have complete transaction data in localStorage
        const reservationData = localStorage.getItem(`blane_${slug}_reservation_data`);
        const orderData = localStorage.getItem(`blane_${slug}_order_data`);
        
        // If we have reservation data
        if (reservationData) {
          try {
            const parsedData = JSON.parse(reservationData);
            const reservationId = parsedData.NUM_RES || parsedData.id;
            
            setTransaction({
              id: reservationId?.toString() || '',
              type: 'reservation',
              data: parsedData,
              status: parsedData.status as TransactionStatus
            });
            
            if (parsedData.blane) {
              setHasBlaneDataFromTransaction(true);
              setTransactionBlane(convertToExtendedBlane(parsedData.blane));
            }
            
            setIsLoadingTransaction(false);
            return;
          } catch (error) {
            console.warn(`Error parsing stored reservation data:`, error);
            localStorage.removeItem(`blane_${slug}_reservation_data`);
          }
        }
        
        // If we have order data
        if (orderData) {
          try {
            const parsedData = JSON.parse(orderData);
            const orderId = parsedData.NUM_ORD || parsedData.id;
            
            setTransaction({
              id: orderId?.toString() || '',
              type: 'order',
              data: parsedData,
              status: (parsedData.status || 'pending') as TransactionStatus
            });
            
            if (parsedData.blane) {
              setHasBlaneDataFromTransaction(true);
              setTransactionBlane(convertToExtendedBlane(parsedData.blane));
            }
            
            setIsLoadingTransaction(false);
            return;
          } catch (error) {
            console.warn(`Error parsing stored order data:`, error);
            localStorage.removeItem(`blane_${slug}_order_data`);
          }
        }
        
        // If no complete data, check for IDs and fetch from API with blane included
        const reservationId = localStorage.getItem(`blane_${slug}_reservation_id`);
        const orderId = localStorage.getItem(`blane_${slug}_order_id`);
        
        if (reservationId) {
          try {
            // The reservationService already includes blane and blaneImages in the request
            const reservation = await reservationService.getReservationById(reservationId);
            
            if (reservation) {
              // Store the complete data for future use
              localStorage.setItem(`blane_${slug}_reservation_data`, JSON.stringify(reservation));
              
              setTransaction({
                id: reservationId,
                type: 'reservation',
                data: reservation,
                status: reservation.status as TransactionStatus
              });
              
              if (reservation.blane) {
                setHasBlaneDataFromTransaction(true);
                setTransactionBlane(convertToExtendedBlane(reservation.blane));
              }
              
              setIsLoadingTransaction(false);
              return;
            }
          } catch (error) {
            console.error(`Error fetching reservation ${reservationId}:`, error);
            // Remove invalid ID
            localStorage.removeItem(`blane_${slug}_reservation_id`);
          }
        }
        
        if (orderId) {
          try {
            // The orderService already includes blane in the request
            const order = await orderService.getOrder(orderId);
            
            if (order) {
              // Store the complete data for future use
              localStorage.setItem(`blane_${slug}_order_data`, JSON.stringify(order));
              
              setTransaction({
                id: orderId,
                type: 'order',
                data: order,
                status: (order.status || 'pending') as TransactionStatus
              });
              
              if (order.blane) {
                setHasBlaneDataFromTransaction(true);
                setTransactionBlane(convertToExtendedBlane(order.blane));
              }
              
              setIsLoadingTransaction(false);
              return;
            }
          } catch (error) {
            console.error(`Error fetching order ${orderId}:`, error);
            // Remove invalid ID
            localStorage.removeItem(`blane_${slug}_order_id`);
          }
        }
        
        // No transaction data found - will default to fetching blane directly
        setIsLoadingTransaction(false);
      } catch (error) {
        console.error('Error checking transaction data:', error);
        setIsLoadingTransaction(false);
      }
    };
    
    checkExistingTransactions();
  }, [slug]);

  // Get the effective blane data - either from transaction or direct fetch
  const effectiveBlane = useMemo(() => {
    return hasBlaneDataFromTransaction ? transactionBlane : directBlane;
  }, [hasBlaneDataFromTransaction, transactionBlane, directBlane]);

  // Format dates
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  };
  
  // Check if blane is expired
  const isExpired = (expirationDate: string) => {
    if (!expirationDate) return false;
    try {
      const today = new Date();
      const expDate = new Date(expirationDate);
      return today > expDate;
    } catch {
      return false;
    }
  };
  
  // Get remaining days until expiration
  const getRemainingDays = (expirationDate: string) => {
    if (!expirationDate) return 0;
    try {
      const today = new Date();
      const expDate = new Date(expirationDate);
      const diffTime = expDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 0;
    } catch {
      return 0;
    }
  };
  
  // Calculate discount percentage
  const getDiscountPercentage = (originalPrice: number, discountPrice: number) => {
    if (!originalPrice || !discountPrice || originalPrice <= discountPrice) return 0;
    const percentage = Math.round(((originalPrice - discountPrice) / originalPrice) * 100);
    return percentage;
  };

  // Handle completed reservation
  const handleReservationComplete = (reservation: ReservationResponse) => {
    if (!slug) return;
    
    // Save reservation ID and data before any redirection
    const reservationId = reservation.NUM_RES || reservation.id.toString();
    localStorage.setItem(`blane_${slug}_reservation_id`, reservationId);
    localStorage.setItem(`blane_${slug}_reservation_data`, JSON.stringify(reservation));
    
    // Set transaction data in state immediately
    setTransaction({
      id: reservationId,
      type: 'reservation',
      data: reservation,
      status: reservation.status as TransactionStatus
    });
    
    // Check for and use blane data if available
    if (reservation.blane) {
      setHasBlaneDataFromTransaction(true);
      setTransactionBlane(convertToExtendedBlane(reservation.blane));
    }
    
    // For non-cash payments, ensure localStorage is updated before redirection
    if (reservation.payment_method && reservation.payment_method !== 'cash') {
      const savedData = localStorage.getItem(`blane_${slug}_reservation_data`);
      if (!savedData) {
        localStorage.setItem(`blane_${slug}_reservation_data`, JSON.stringify(reservation));
      }
    }
  };
  
  // Handle completed order
  const handleOrderComplete = (order: OrderType) => {
    if (!slug) return;
    
    // Save order ID and data before any redirection
    const orderId = order.NUM_ORD || (order.id ? order.id.toString() : '');
    localStorage.setItem(`blane_${slug}_order_id`, orderId);
    localStorage.setItem(`blane_${slug}_order_data`, JSON.stringify(order));
    
    // Set transaction data in state immediately
    setTransaction({
      id: orderId,
      type: 'order',
      data: order,
      status: (order.status || 'pending') as TransactionStatus
    });
    
    // Check for and use blane data if available
    if (order.blane) {
      setHasBlaneDataFromTransaction(true);
      setTransactionBlane(convertToExtendedBlane(order.blane));
    }
    
    // For non-cash payments, ensure localStorage is updated before redirection
    if (order.payment_method && order.payment_method !== 'cash') {
      const savedData = localStorage.getItem(`blane_${slug}_order_data`);
      if (!savedData) {
        localStorage.setItem(`blane_${slug}_order_data`, JSON.stringify(order));
      }
    }
  };
  
  // Handle creating a new transaction (starting over)
  const handleNewTransaction = () => {
    if (!slug || !transaction) return;
    
    // Clear localStorage entries
    if (transaction.type === 'reservation') {
      localStorage.removeItem(`blane_${slug}_reservation_id`);
      localStorage.removeItem(`blane_${slug}_reservation_data`);
    } else {
      localStorage.removeItem(`blane_${slug}_order_id`);
      localStorage.removeItem(`blane_${slug}_order_data`);
    }
    
    setTransaction(null);
    setHasBlaneDataFromTransaction(false);
    setTransactionBlane(null);
  };

  // Show loader while fetching data
  if (isLoadingTransaction || isLoadingBlane) {
    return (
      <div className="min-h-[60vh] flex justify-center items-center">
        <Loader />
      </div>
    );
  }

  // Show error if any
  if (blaneError || !effectiveBlane) {
    return <NotFound />;
  }

  // Calculate discount percentage for display
  const discountPercentage = getDiscountPercentage(
    effectiveBlane.price_old || 0,
    effectiveBlane.price_current || 0
  );

  // Calculate remaining days and check if expired for display
  const getExpirationInfo = () => {
    // Check for relevant date field
    let expirationDate;
    if ('end_date' in effectiveBlane && effectiveBlane.end_date) {
      expirationDate = effectiveBlane.end_date;
    } else if ('expiration_date' in effectiveBlane && typeof effectiveBlane.expiration_date === 'string') {
      expirationDate = effectiveBlane.expiration_date;
    } else {
      return { isExpired: false, remainingDays: 0 };
    }
    
    return {
      isExpired: isExpired(expirationDate),
      remainingDays: getRemainingDays(expirationDate)
    };
  };

  const { isExpired: isBlaneExpired, remainingDays } = getExpirationInfo();

  // Get images for gallery
  const images = effectiveBlane.images || [];

  // Determine what form or summary to render based on transaction state
  const renderTransactionSection = () => {
    // Check if blane is expired
    if (isBlaneExpired) {
      return (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-10 w-10 mx-auto text-amber-500 mb-4" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Offre expirée</h2>
          <p className="text-gray-600 mb-4">Cette offre n'est plus disponible.</p>
        </div>
      );
    }

    // Check for stock availability for order type blanes
    if (effectiveBlane.type !== 'reservation' && effectiveBlane.stock !== undefined && effectiveBlane.stock <= 0) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-10 w-10 mx-auto text-red-500 mb-4" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Rupture de stock</h2>
          <p className="text-gray-600 mb-4">Ce produit est actuellement en rupture de stock.</p>
        </div>
      );
    }

    // If we have an existing transaction, show summary
    if (transaction) {
      // Type guard for transaction type
      const isReservation = transaction.type === 'reservation';
      return (
        <>
          {isReservation ? (
            <ReservationSummary 
              reservation={transaction.data as ReservationResponse} 
              blane={effectiveBlane}
              onNewReservation={handleNewTransaction}
            />
          ) : (
            <OrderSummary
              order={transaction.data as OrderType}
              blane={effectiveBlane}
              onNewOrder={handleNewTransaction}
            />
          )}
        </>
      );
    }

    // Otherwise show appropriate form based on blane type
    if (effectiveBlane.type === 'reservation') {
        return (
          <>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Réserver maintenant
            </h2>
            <SimpleReservationForm
            blane={effectiveBlane}
              onReservationComplete={handleReservationComplete}
            />
          </>
        );
      } else {
        return (
          <>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Commander
            </h2>
          {effectiveBlane.stock !== undefined && (
              <div className="mb-4 text-sm">
                <span className={`inline-block px-3 py-1 rounded-full ${
                effectiveBlane.stock > 10 
                    ? 'bg-green-100 text-green-800' 
                  : effectiveBlane.stock > 5 
                      ? 'bg-yellow-100 text-yellow-800' 
                      : 'bg-orange-100 text-orange-800'
                }`}>
                {effectiveBlane.stock > 10 
                    ? 'En stock' 
                  : `Plus que ${effectiveBlane.stock} en stock`}
                </span>
              </div>
            )}
            <SimpleOrderForm
            blane={effectiveBlane}
              onOrderComplete={handleOrderComplete}
            />
          </>
        );
    }
  };

  // Main render
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Show shared link indicator if token is present */}
      {token && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                Contenu partagé
              </span>
              <span className="text-blue-700 text-sm">Vous consultez une offre partagée via un lien</span>
            </div>
            <button 
              onClick={() => window.history.back()}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left column: Details and images */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            {/* Images */}
            <div>
              <BlaneImageGallery 
                images={images}
                name={effectiveBlane.name}
                activeImageIndex={activeImageIndex}
                setActiveImageIndex={setActiveImageIndex}
                discountPercentage={discountPercentage}
              />
            </div>
          </div>

          {/* Detailed information */}
          <div className="space-y-8">
            <div className="bg-white border rounded-lg shadow-sm p-6">
              <h1 className="text-xl font-bold text-gray-900 mb-1">{effectiveBlane.name}</h1>
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <div className="flex items-baseline gap-3">
                  <span className="text-xl font-bold text-[#197874]">
                    {effectiveBlane.price_current} DH
                  </span>
                  {effectiveBlane.price_old && effectiveBlane.price_old > effectiveBlane.price_current && (
                    <span className="text-lg text-gray-400 line-through">
                      {effectiveBlane.price_old} DH
                    </span>
                  )}
                  {discountPercentage > 0 && (
                    <span className="bg-[#E66C61] text-white px-3 py-1 rounded-lg text-xs font-semibold animate-pulse">
                      -{discountPercentage}%
                    </span>
                  )}
                </div>
              </div>
              <BlaneInfo
                blane={effectiveBlane}
                formatDate={formatDate}
                isExpired={() => isBlaneExpired}
                getRemainingDays={() => remainingDays}
              />
            </div>

            {effectiveBlane.livraison_in_city === 1 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Livraison</h2>
                <BlaneDeliveryInfo blane={effectiveBlane} />
              </div>
            )}
          </div>
        </div>

        {/* Right column: Reservation/Order form or summary */}
        <div className="lg:col-span-6 lg:sticky lg:top-8 self-start">
          <div className="bg-white shadow-sm rounded-lg p-6 border">
            {renderTransactionSection()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlaneDetail; 