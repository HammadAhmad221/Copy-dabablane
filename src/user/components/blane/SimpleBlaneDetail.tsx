import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertCircle, Check, Loader2, Clock, Calendar, Download, ShoppingBag, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/user/components/ui/alert';
import { Button } from '@/user/components/ui/button';
import { SimpleOrderForm } from '@/user/components/order/SimpleOrderForm';
import { blaneService } from '@/user/services/blane';
import { formatPrice } from '@/user/lib/utils';
import { formatDate } from '@/user/lib/utils/blane';
import { Badge } from '@/user/components/ui/badge';

interface SimpleBlaneDetailProps {
  blaneId: string | number;
}

type PaymentStatus = 'success' | 'failed' | 'canceled' | 'pending' | null;

export const SimpleBlaneDetail = ({ blaneId }: SimpleBlaneDetailProps) => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [blane, setBlane] = useState<any>(null);
  const [currentView, setCurrentView] = useState<'loading' | 'form' | 'paymentProcessing' | 'confirmation' | 'paymentError'>('loading');
  const [orderData, setOrderData] = useState<any>(null);
  
  // Check URL parameters for payment status
  const paymentStatus = searchParams.get('status') as PaymentStatus;
  const orderId = searchParams.get('orderId');
  
  // Effect to handle initial loading and payment returns
  useEffect(() => {
    const fetchBlaneAndCheckPayment = async () => {
      try {
        // First, fetch the blane details
        const blaneResponse = await blaneService.getBlaneById(blaneId);
        setBlane(blaneResponse);
        
        // Check if we're coming back from a payment
        if (paymentStatus) {
          if (paymentStatus === 'success' && orderId) {
            // Fetch order details and show confirmation
            const orderResponse = await blaneService.getOrderById(orderId);
            setOrderData(orderResponse);
            setCurrentView('confirmation');
          } else if (paymentStatus === 'failed' || paymentStatus === 'canceled') {
            // Show appropriate error message
            setError(paymentStatus === 'failed' 
              ? 'Payment processing failed. Please try again.' 
              : 'Payment was canceled. You can try again when you\'re ready.');
            setCurrentView('paymentError');
          }
        } else {
          // Check localStorage for any pending payments
          const pendingPaymentStr = localStorage.getItem('pendingPayment');
          if (pendingPaymentStr) {
            try {
              const pendingPayment = JSON.parse(pendingPaymentStr);
              if (pendingPayment && pendingPayment.blaneId === blaneId.toString()) {
                // We have a pending payment for this blane
                setOrderData(pendingPayment);
                setCurrentView('paymentProcessing');
              } else {
                setCurrentView('form');
              }
            } catch (e) {
              // Invalid JSON in localStorage
              localStorage.removeItem('pendingPayment');
              setCurrentView('form');
            }
          } else {
            setCurrentView('form');
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load blane details');
        setCurrentView('form');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBlaneAndCheckPayment();
  }, [blaneId, paymentStatus, orderId]);
  
  // Handle order completion
  const handleOrderComplete = (data: any) => {
    setOrderData(data);
    
    // Store pending payment data in localStorage
    if (data.payment_url || data.payment_form) {
      localStorage.setItem('pendingPayment', JSON.stringify({
        ...data,
        blaneId: blaneId.toString(),
        timestamp: new Date().toISOString()
      }));
      setCurrentView('paymentProcessing');
    } else {
      // For cash payments or completed payments
      setCurrentView('confirmation');
    }
  };
  
  // Handle retry payment
  const handleRetryPayment = async () => {
    setLoading(true);
    try {
      // Reset error state
      setError(null);
      
      // Clear pendingPayment from localStorage if it exists
      localStorage.removeItem('pendingPayment');
      
      // Return to the form view
      setCurrentView('form');
    } catch (err: any) {
      setError(err.message || 'Failed to reset payment flow');
    } finally {
      setLoading(false);
    }
  };
  
  // Render loading state
  if (loading || currentView === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-gray-600">Loading blane details...</p>
      </div>
    );
  }
  
  // Render error state
  if (error && !blane) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  
  // Render payment processing view
  if (currentView === 'paymentProcessing' && orderData) {
    return (
      <div className="space-y-6 py-8">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Payment Processing</h2>
          <p className="text-gray-600 mb-4">
            Please complete your payment to finalize your order. Do not close this window.
          </p>
          
          {orderData.payment_url && (
            <Button 
              onClick={() => window.location.href = orderData.payment_url}
              className="mt-4"
            >
              Go to Payment Page
            </Button>
          )}
          
          {/* This div will be used to insert the payment form via innerHTML if needed */}
          {orderData.payment_form && (
            <div 
              id="payment-form-container" 
              className="mt-6 p-4 border rounded-lg"
              dangerouslySetInnerHTML={{ __html: orderData.payment_form }}
            />
          )}
          
          <Button
            variant="outline"
            onClick={handleRetryPayment}
            className="mt-6"
          >
            Cancel and Start Over
          </Button>
        </div>
      </div>
    );
  }
  
  // Render payment error view
  if (currentView === 'paymentError') {
    return (
      <div className="space-y-6 py-8">
        <Alert variant="destructive" className="my-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Payment Issue</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        
        <div className="flex justify-center">
          <Button onClick={handleRetryPayment}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }
  
  // Render order confirmation view
  if (currentView === 'confirmation' && orderData) {
    return (
      <div className="space-y-6 py-8">
        <div className="text-center bg-green-50 p-6 rounded-lg border border-green-100">
          <div className="inline-flex items-center justify-center rounded-full bg-green-100 p-2 mb-4">
            <Check className="h-6 w-6 text-green-600" />
          </div>
          
          <h2 className="text-2xl font-bold mb-3">Order Confirmed!</h2>
          <p className="text-gray-600 mb-6">
            Thank you for your order. Your confirmation number is <span className="font-semibold">{orderData.id}</span>.
          </p>
          
          <div className="bg-white p-4 rounded-lg border text-left mb-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Order Date:</span>
                <span className="font-medium">{formatDate(orderData.order_date || new Date())}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Product:</span>
                <span className="font-medium">{blane?.name}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Quantity:</span>
                <span className="font-medium">{orderData.quantity}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total Amount:</span>
                <span className="font-medium">{formatPrice(orderData.total_amount)}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Payment Method:</span>
                <span className="font-medium capitalize">{orderData.payment_method}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Payment Status:</span>
                <span className={`font-medium ${
                  orderData.payment_status === 'paid' ? 'text-green-600' : 
                  orderData.payment_status === 'pending' ? 'text-amber-600' : 'text-gray-600'
                }`}>
                  {orderData.payment_status === 'paid' ? 'Paid' : 
                   orderData.payment_status === 'pending' ? 'Pending' : 
                   orderData.payment_status || 'Unknown'}
                </span>
              </div>
            </div>
          </div>
          
          <p className="text-sm text-gray-500">
            You will receive a confirmation email shortly. If you have any questions, please contact our support team.
          </p>
        </div>
      </div>
    );
  }
  
  // Render the order form (default view)
  return (
    <div className="space-y-8 py-6">
      {blane && (
        <>
          <div className="space-y-4">
            <h1 className="text-2xl font-bold text-gray-900">{blane.name}</h1>
            
            {/* Product type badges */}
            <div className="flex flex-wrap gap-2 mt-2">
              {blane.is_digital && (
                <Badge variant="outline" className="flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-200">
                  <Download size={14} />
                  Produit numérique
                </Badge>
              )}
              
              {blane.type === 'ecommerce' && (
                <Badge variant="outline" className="flex items-center gap-1 bg-purple-50 text-purple-700 border-purple-200">
                  <ShoppingBag size={14} />
                  E-commerce
                </Badge>
              )}
              
              {blane.type === 'reservation' && blane.type_time === 'time' && (
                <Badge variant="outline" className="flex items-center gap-1 bg-amber-50 text-amber-700 border-amber-200">
                  <Clock size={14} />
                  Réservation horaire
                </Badge>
              )}
              
              {blane.type === 'reservation' && (!blane.type_time || blane.type_time === 'date') && (
                <Badge variant="outline" className="flex items-center gap-1 bg-green-50 text-green-700 border-green-200">
                  <Calendar size={14} />
                  Réservation journalière
                </Badge>
              )}
            </div>
            
            {blane.description && (
              <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: blane.description }} />
            )}
            
            <div className="flex items-baseline">
              <span className="text-2xl font-bold text-gray-900 mr-2">{formatPrice(blane.price)}</span>
              {blane.price_old && (
                <span className="text-lg text-gray-500 line-through">{formatPrice(blane.price_old)}</span>
              )}
            </div>
            
            {/* Display availability information based on product type */}
            {blane.stock !== undefined && (
              <div className={`text-sm ${blane.stock > 10 ? 'text-green-600' : blane.stock > 0 ? 'text-amber-600' : 'text-red-600'}`}>
                {blane.stock > 10 
                  ? 'En stock' 
                  : blane.stock > 0 
                    ? `Plus que ${blane.stock} en stock!` 
                    : 'Épuisé'}
              </div>
            )}
            
            {/* Special information for digital products */}
            {blane.is_digital && (
              <div className="bg-blue-50 rounded-md p-3 text-blue-700 text-sm mt-2">
                <div className="flex items-center mb-1">
                  <Download size={16} className="mr-2" />
                  <span className="font-medium">Produit numérique</span>
                </div>
                <p>Disponible immédiatement après l'achat. Le lien de téléchargement sera envoyé sur votre email.</p>
              </div>
            )}
            
            {/* Advantages section */}
            {blane.advantages && (
              <div className="mt-4 bg-green-50 rounded-md p-4">
                <h3 className="font-medium mb-2 flex items-center text-green-800">
                  <CheckCircle size={16} className="mr-2 text-green-600" />
                  Avantages
                </h3>
                <ul className="space-y-2">
                  {blane.advantages.split('\n')
                    .filter((line: string) => line.trim() !== '')
                    .map((advantage: string, index: number) => (
                      <li key={index} className="flex items-start text-sm text-gray-700">
                        <Check size={14} className="mr-2 mt-1 text-green-600 flex-shrink-0" />
                        <span>{advantage.trim()}</span>
                      </li>
                    ))
                  }
                </ul>
              </div>
            )}
            
            {/* Conditions section */}
            {blane.conditions && (
              <div className="mt-4 bg-amber-50 rounded-md p-4">
                <h3 className="font-medium mb-2 flex items-center text-amber-800">
                  <AlertCircle size={16} className="mr-2 text-amber-600" />
                  Conditions
                </h3>
                <ul className="space-y-2">
                  {blane.conditions.split('\n')
                    .filter((line: string) => line.trim() !== '')
                    .map((condition: string, index: number) => (
                      <li key={index} className="flex items-start text-sm text-gray-700">
                        <AlertCircle size={14} className="mr-2 mt-1 text-amber-600 flex-shrink-0" />
                        <span>{condition.trim()}</span>
                      </li>
                    ))
                  }
                </ul>
              </div>
            )}
            
            {/* Time-specific information for reservation products */}
            {blane.type === 'reservation' && blane.type_time === 'time' && blane.available_time_slots && (
              <div className="mt-4">
                <h3 className="font-medium mb-2 flex items-center">
                  <Clock size={16} className="mr-2 text-gray-700" />
                  Créneaux horaires disponibles
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {blane.available_time_slots.map((slot: string, index: number) => (
                    <div key={index} className="bg-gray-100 rounded-md p-2 text-center text-sm">
                      {slot}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Date-specific information for reservation products */}
            {blane.type === 'reservation' && (!blane.type_time || blane.type_time === 'date') && blane.start_date && blane.expiration_date && (
              <div className="mt-4">
                <h3 className="font-medium mb-2 flex items-center">
                  <Calendar size={16} className="mr-2 text-gray-700" />
                  Période de validité
                </h3>
                <p className="text-gray-700">
                  Du {formatDate(blane.start_date)} au {formatDate(blane.expiration_date)}
                </p>
              </div>
            )}
          </div>
          
          <SimpleOrderForm 
            blane={blane} 
            onOrderComplete={handleOrderComplete}
          />
        </>
      )}
    </div>
  );
}; 