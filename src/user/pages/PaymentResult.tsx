import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation, useSearchParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Check, Clock, X } from 'lucide-react';
import Loader from '@/user/components/ui/Loader';
import { orderService } from '@/user/lib/api/services/orderService';
import { reservationService } from '@/user/lib/api/services/reservationService';
import { OrderSummary } from '@/user/components/order/OrderSummary';
import { ReservationSummary } from '@/user/components/reservation/ReservationSummary';

// Define types for payment status and data
interface Customer {
  name: string;
  email: string;
  city?: string;
  phone?: string;
  address?: string;
}

interface Blane {
  name: string;
  price_current: string | number;
  tva?: number;
  type: string;
  partiel_field?: number;
  featured_image?: string;
  images?: string[];
  id?: number;
  slug?: string;
  is_digital?: boolean;
  expiration_date?: string; // Required by the Blane type in components
}

interface OrderType {
  NUM_ORD?: string;
  delivery_address?: string;
  total_price: string | number;
  partiel_price?: string | number;
  payment_method?: string;
  quantity: number;
  status?: 'pending' | 'confirmed' | 'cancelled' | 'paid' | 'failed';
  customer?: Customer;
  blane?: Blane;
  is_digital?: boolean;
  items?: Array<{
    productName: string;
    quantity: number;
  }>;
  id?: number | string;
  order_number?: string;
  total_amount?: number;
  total?: number;
  paid_amount?: number;
  payment_status?: string;
  name?: string;
  full_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  comments?: string;
  notes?: string;
  created_at?: string;
}

interface ReservationType {
  NUM_RES?: string;
  total_price: string | number;
  partiel_price?: string | number;
  payment_method?: string;
  number_persons?: number;
  date?: string;
  end_date?: string;
  time?: string;
  customer?: Customer;
  blane?: Blane;
  quantity?: number;
  id?: number;
  customers_id?: number;
  blane_id?: number;
  comments?: string;
  status?: "pending" | "confirmed" | "canceled" | "paid" | "failed";
  created_at?: string;
  updated_at?: string;
  full_name?: string;
  email?: string;
  phone?: string;
  city?: string;
  // Required by ReservationSummary component
  reservation_date?: string;
  reservation_time?: string;
  guest_count?: number;
}

// New component for status with summary
interface StatusWithSummaryViewProps {
  children: React.ReactNode;
  type: 'order' | 'reservation';
  status?: string;
  referenceNumber?: string;
}

// Status info type
interface StatusInfo {
  title: string;
  subtitle: string;
  gradient: string;
  icon: React.ReactNode;
  alertColor: string;
  alertBg: string;
  alertBorderColor: string;
  alertTextColor: string;
  alertTitle: string;
  alertMessage: string;
}

// Get the status display info based on the item's status
const getStatusInfo = (status?: string): StatusInfo => {
  switch(status) {
    case 'paid':
      return {
        title: 'Paiement réussi',
        subtitle: 'Votre paiement a été traité avec succès',
        gradient: 'from-green-600 to-green-500',
        icon: <Check className="h-8 w-8 text-white" />,
        alertColor: 'green',
        alertBg: 'bg-green-50',
        alertBorderColor: 'border-green-500',
        alertTextColor: 'text-green-700',
        alertTitle: 'Paiement confirmé',
        alertMessage: 'Votre paiement a été confirmé. Vous recevrez un email de confirmation.'
      };
    case 'failed':
      return {
        title: 'Paiement échoué',
        subtitle: 'Votre paiement n\'a pas pu être traité',
        gradient: 'from-red-600 to-red-500',
        icon: <X className="h-8 w-8 text-white" />,
        alertColor: 'red',
        alertBg: 'bg-red-50',
        alertBorderColor: 'border-red-500',
        alertTextColor: 'text-red-700',
        alertTitle: 'Échec du paiement',
        alertMessage: 'Votre paiement a échoué. Veuillez réessayer ou contacter notre service client.'
      };
    case 'pending':
      return {
        title: 'Paiement en attente',
        subtitle: 'Votre paiement est en cours de traitement',
        gradient: 'from-yellow-600 to-yellow-500',
        icon: <Clock className="h-8 w-8 text-white" />,
        alertColor: 'yellow',
        alertBg: 'bg-yellow-50',
        alertBorderColor: 'border-yellow-500',
        alertTextColor: 'text-yellow-700',
        alertTitle: 'Paiement en cours',
        alertMessage: 'Votre paiement est en cours de traitement. Veuillez patienter...'
      };
    case 'confirmed':
      return {
        title: 'Commande confirmée',
        subtitle: 'Votre commande a été confirmée',
        gradient: 'from-blue-600 to-blue-500',
        icon: <Check className="h-8 w-8 text-white" />,
        alertColor: 'blue',
        alertBg: 'bg-blue-50',
        alertBorderColor: 'border-blue-500',
        alertTextColor: 'text-blue-700',
        alertTitle: 'Commande confirmée',
        alertMessage: 'Votre commande a été confirmée et est en cours de traitement.'
      };
    case 'canceled':
    case 'cancelled':
      return {
        title: 'Commande annulée',
        subtitle: 'Votre commande a été annulée',
        gradient: 'from-gray-600 to-gray-500',
        icon: <X className="h-8 w-8 text-white" />,
        alertColor: 'gray',
        alertBg: 'bg-gray-50',
        alertBorderColor: 'border-gray-500',
        alertTextColor: 'text-gray-700',
        alertTitle: 'Commande annulée',
        alertMessage: 'Votre commande a été annulée.'
      };
    default:
      return {
        title: 'Statut inconnu',
        subtitle: 'Le statut de votre commande est inconnu',
        gradient: 'from-gray-600 to-gray-500',
        icon: <AlertTriangle className="h-8 w-8 text-white" />,
        alertColor: 'gray',
        alertBg: 'bg-gray-50',
        alertBorderColor: 'border-gray-500',
        alertTextColor: 'text-gray-700',
        alertTitle: 'Statut indéterminé',
        alertMessage: 'Le statut de votre commande ou réservation est inconnu.'
      };
  }
};

// Main component
const PaymentResult: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { number } = useParams<{ number: string }>();
  const [searchParams] = useSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<OrderType | null>(null);
  const [reservation, setReservation] = useState<ReservationType | null>(null);
  const [notFound, setNotFound] = useState(false);
  
  // Determine status from path or query params
  const queryStatus = searchParams.get('status');
  const pathStatus = location.pathname.includes('/success') 
    ? 'paid' 
    : location.pathname.includes('/failed') || location.pathname.includes('/fail')
      ? 'failed' 
      : queryStatus || null;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      setNotFound(false);

      // Normalize reservation ID formats
      const normalizeReservationId = (id: string): string => {
        // If starts with RES but no dash, add the dash
        if (id.startsWith('RES') && !id.startsWith('RES-')) {
          return `RES-${id.substring(3)}`;
        }
        return id;
      };

      try {
        if (!number) {
          setError('Numéro de référence non reconnu. Veuillez contacter le support.');
          setLoading(false);
          return;
        }

        // Step 1: Try direct fetch first with the exact ID provided
        const normalizedId = normalizeReservationId(number);
        
        // First, try as a reservation if it looks like one
        if (normalizedId.startsWith('RES-')) {
          try {
            const reservationData = await reservationService.getReservationById(normalizedId);
            
            if (reservationData) {
              const typedReservation = reservationData as ReservationType;
              
              // Update status if needed based on path
              if (pathStatus && pathStatus !== typedReservation.status) {
                if (pathStatus === 'failed') {
                  await reservationService.updateReservationStatus(normalizedId, { status: 'failed' });
                }
              }
              
              setReservation(typedReservation);
              setLoading(false);
              return;
            }
          } catch (error) {
            console.warn(`Error fetching reservation with ID ${normalizedId}:`, error);
          }
        }
        
        // Step 2: Try as order if not a reservation or if reservation fetch failed
        try {
          const orderData = await orderService.getOrder(number);
          
          if (orderData) {
            const typedOrder = orderData as OrderType;
            
            // Update status if needed based on path
            if (pathStatus && pathStatus !== typedOrder.status) {
              if (pathStatus === 'failed') {
                await orderService.updateOrderStatus(number, { status: 'failed' });
              }
            }
            
            setOrder(typedOrder);
            setLoading(false);
            return;
          }
        } catch (error) {
          console.warn(`Error fetching order with ID ${number}:`, error);
        }
        
        // Step 3: Try with various reservation ID formats if direct lookups failed
        // Try with RES- prefix if it doesn't have one
        if (!number.startsWith('RES')) {
          try {
            // Format with RES- prefix for bare IDs
            const withPrefix = `RES-${number}`;
            
            const reservationData = await reservationService.getReservationById(withPrefix);
            
            if (reservationData) {
              const typedReservation = reservationData as ReservationType;
              
              // Update status if needed
              if (pathStatus && pathStatus !== typedReservation.status) {
                if (pathStatus === 'failed') {
                  await reservationService.updateReservationStatus(withPrefix, { status: 'failed' });
                }
              }
              
              setReservation(typedReservation);
              setLoading(false);
              return;
            }
          } catch (error) {
            console.warn(`Error fetching with added RES- prefix for ${number}:`, error);
          }
        }
        
        // Step 4: Try special handling for QF format
        if (number.includes('QF') || normalizedId.includes('QF')) {
          try {
            // Extract the QF part and numbers
            const qfMatch = number.match(/QF(\d+)/i) || normalizedId.match(/QF(\d+)/i);
            if (qfMatch) {
              const qfNumbers = qfMatch[1];
              const specialFormat = `RES-QF${qfNumbers}`;
              
              const reservationData = await reservationService.getReservationById(specialFormat);
              
              if (reservationData) {
                const typedReservation = reservationData as ReservationType;
                
                // Update status if needed
                if (pathStatus && pathStatus !== typedReservation.status) {
                  if (pathStatus === 'failed') {
                    await reservationService.updateReservationStatus(specialFormat, { status: 'failed' });
                  }
                }
                
                setReservation(typedReservation);
                setLoading(false);
                return;
              }
            }
          } catch (error) {
            console.warn(`Error fetching with QF special format for ${number}:`, error);
          }
        }
        
        // If we got here, nothing was found
        console.warn(`Resource not found after all attempts for ID: ${number}`);
        setNotFound(true);
        setLoading(false);
        
      } catch (error) {
        console.error('Unhandled error in fetch:', error);
        setError('Une erreur est survenue lors de la récupération des données. Veuillez réessayer ou contacter notre support.');
        setLoading(false);
      }
    };

    fetchData();
  }, [number, pathStatus]);

  const handleBackToHome = () => {
    navigate('/');
  };

  // Handle rendering based on data
  return (
    <div className="container mx-auto py-10 px-4">
      {loading ? (
        <LoadingView />
      ) : notFound ? (
        <NotFoundView referenceNumber={number} onBackToHome={handleBackToHome} />
      ) : error ? (
        <ErrorView error={error} onBackToHome={handleBackToHome} />
      ) : reservation ? (
        <StatusWithSummaryView 
          type="reservation"
          status={reservation.status}
          referenceNumber={reservation.NUM_RES || number}
        >
          <ReservationSummary 
            reservation={
              // Ensure we pass a properly formatted reservation with all required fields
              {
                ...reservation,
                // Add compatibility fields if missing
                reservation_date: reservation.date,
                reservation_time: reservation.time || "",
                guest_count: reservation.number_persons || reservation.quantity
              } as unknown as Parameters<typeof ReservationSummary>[0]['reservation']
            } 
            blane={
              // Ensure blane is available, create a minimal one if needed
              (reservation.blane || {
                id: reservation.blane_id || 0,
                name: "Réservation",
                price_current: reservation.total_price,
                type: "reservation",
                expiration_date: reservation.date
              }) as unknown as Parameters<typeof ReservationSummary>[0]['blane']
            } 
            onNewReservation={handleBackToHome}
          />
        </StatusWithSummaryView>
      ) : order && order.blane ? (
        <StatusWithSummaryView 
          type="order"
          status={order.status}
          referenceNumber={order.NUM_ORD || number}
        >
          <OrderSummary 
            order={order as unknown as Parameters<typeof OrderSummary>[0]['order']} 
            blane={order.blane as unknown as Parameters<typeof OrderSummary>[0]['blane']} 
            onNewOrder={handleBackToHome}
          />
        </StatusWithSummaryView>
      ) : (
        <ErrorView error="Aucune information disponible" onBackToHome={handleBackToHome} />
      )}
    </div>
  );
};

// Component for loading state
const LoadingView: React.FC = () => (
  <div className="max-w-3xl mx-auto">
    <div className="bg-gradient-to-r from-[#197874] to-[#1d8f8a] rounded-t-xl shadow-md p-6 text-white">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Traitement en cours</h1>
          <p className="text-white/80 mt-1">
            Veuillez patienter...
          </p>
        </div>
        <div className="bg-white/20 p-3 rounded-full">
          <div className="h-8 w-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    </div>
    
    <div className="bg-white rounded-b-xl shadow-md p-8 border border-t-0 border-gray-200">
      <div className="flex flex-col items-center justify-center text-center">
        <Loader />
        <h2 className="text-xl font-bold text-gray-800 mt-6 mb-2">Chargement des informations</h2>
        <p className="text-gray-600 max-w-md">
          Nous récupérons les détails de votre paiement. 
          Cette opération ne prendra que quelques instants.
        </p>
      </div>
    </div>
  </div>
);

// Component for not found state
interface NotFoundViewProps {
  referenceNumber?: string;
  onBackToHome: () => void;
}

const NotFoundView: React.FC<NotFoundViewProps> = ({ referenceNumber, onBackToHome }) => (
  <div className="max-w-3xl mx-auto">
    {/* Status Header */}
    <div className="bg-gradient-to-r from-orange-600 to-orange-500 rounded-t-xl shadow-md p-6 text-white">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Non trouvé</h1>
          <p className="text-white/80 mt-1">
            La référence n'existe pas
          </p>
        </div>
        <div className="bg-white/20 p-3 rounded-full">
          <AlertTriangle className="h-8 w-8 text-white" />
        </div>
      </div>
    </div>
    
    {/* Content */}
    <div className="bg-white rounded-b-xl shadow-md p-6 border border-t-0 border-gray-200">
      {/* Error Message */}
      <div className="mb-8 text-center">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Référence introuvable</h2>
        <p className="text-gray-600 max-w-lg mx-auto">
          La référence {referenceNumber ? `"${referenceNumber}"` : ""} n'a pas été trouvée dans notre système.
          Veuillez vérifier que vous avez utilisé le bon lien ou contactez notre service client.
        </p>
      </div>
      
      {/* Status Alert */}
      <div className="bg-orange-50 border-l-4 border-orange-500 text-orange-700 p-4 rounded-r-md mb-8" role="alert">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
          </div>
          <div className="ml-3">
            <p className="font-bold">Référence invalide</p>
            <p className="text-sm">
              Si vous pensez qu'il s'agit d'une erreur, veuillez contacter notre service client.
            </p>
          </div>
        </div>
      </div>
      
      {/* Back Button */}
      <div className="mt-8 flex justify-center">
        <button
          onClick={onBackToHome}
          className="bg-[#E66C61] hover:bg-[#d15550] text-white font-semibold py-3 px-6 rounded-xl transition-all flex items-center gap-2"
        >
          <ArrowLeft className="h-5 w-5" />
          Retour à l'accueil
        </button>
      </div>
    </div>
  </div>
);

// Component for error state
interface ErrorViewProps {
  error: string;
  onBackToHome: () => void;
}

const ErrorView: React.FC<ErrorViewProps> = ({ error, onBackToHome }) => (
  <div className="max-w-3xl mx-auto">
    {/* Status Header */}
    <div className="bg-gradient-to-r from-red-600 to-red-500 rounded-t-xl shadow-md p-6 text-white">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Erreur</h1>
          <p className="text-white/80 mt-1">
            Un problème est survenu
          </p>
        </div>
        <div className="bg-white/20 p-3 rounded-full">
          <AlertTriangle className="h-8 w-8 text-white" />
        </div>
      </div>
    </div>
    
    {/* Content */}
    <div className="bg-white rounded-b-xl shadow-md p-6 border border-t-0 border-gray-200">
      {/* Error Message */}
      <div className="mb-8 text-center">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Une erreur est survenue</h2>
        <p className="text-gray-600 max-w-lg mx-auto">
          {error}
        </p>
      </div>
      
      {/* Status Alert */}
      <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-r-md mb-8" role="alert">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-red-500" />
          </div>
          <div className="ml-3">
            <p className="font-bold">Erreur détectée</p>
            <p className="text-sm">
              Si le problème persiste, veuillez contacter notre service client.
            </p>
          </div>
        </div>
      </div>
      
      {/* Back Button */}
      <div className="mt-8 flex justify-center">
        <button
          onClick={onBackToHome}
          className="bg-[#E66C61] hover:bg-[#d15550] text-white font-semibold py-3 px-6 rounded-xl transition-all flex items-center gap-2"
        >
          <ArrowLeft className="h-5 w-5" />
          Retour à l'accueil
        </button>
      </div>
    </div>
  </div>
);

// Status with summary component implementation
const StatusWithSummaryView: React.FC<StatusWithSummaryViewProps> = ({ 
  children, 
  type, 
  status, 
  referenceNumber
}) => {
  const statusInfo = getStatusInfo(status);
  const typeLabel = type === 'order' ? 'Commande' : 'Réservation';
  
  return (
    <div className="max-w-3xl mx-auto">
      {/* Status Header */}
      <div className={`bg-gradient-to-r ${statusInfo.gradient} rounded-t-xl shadow-md p-6 text-white`}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{statusInfo.title}</h1>
            <p className="text-white/80 mt-1">
              {statusInfo.subtitle}
            </p>
            <p className="text-white/90 mt-2 font-medium">
              {typeLabel} réf: {referenceNumber}
            </p>
          </div>
          <div className="bg-white/20 p-3 rounded-full">
            {statusInfo.icon}
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="bg-white rounded-b-xl shadow-md p-6 border border-t-0 border-gray-200">
        {/* Order or Reservation Summary */}
        <div className="mt-4">
          {children}
        </div>
      </div>
    </div>
  );
};

export default PaymentResult; 