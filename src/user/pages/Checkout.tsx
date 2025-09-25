import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import OrderSummary from '@/user/components/OrderSummary';
import PaymentLoading from '@/user/components/PaymentLoading';
import { paymentService } from '@/user/services/paymentService';
import { Blane } from '@/user/lib/types/blane';
import { OrderFormData } from '@/user/lib/types/orders';
import { ReservationData } from '@/user/lib/types/reservation';

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Extract data from location state
  const { 
    type, 
    entityId, 
    data, 
    blane 
  } = location.state as { 
    type: 'order' | 'reservation'; 
    entityId: string;
    data: OrderFormData | ReservationData;
    blane: Blane;
  };

  useEffect(() => {
    // Redirect to home if accessed directly without data
    if (!type || !entityId || !data || !blane) {
      navigate('/');
    }
  }, [type, entityId, data, blane, navigate]);

  const handleProceedToPayment = async (paymentType: 'full' | 'partial') => {
    try {
      setPaymentLoading(true);
      setError(null);

      // Initiate payment
      const paymentData = await paymentService.initiatePayment(
        type,
        entityId,
        paymentType
      );

      // Check if we need to redirect or use a form submission
      if (paymentData.payment_form_data) {
        // Use the payment service to submit form with POST method
        paymentService.submitPaymentForm(
          paymentData.redirect_url,
          paymentData.payment_form_data
        );
      } else {
        // Use POST method even without form data for 3D Secure compatibility
        paymentService.submitPaymentForm(paymentData.redirect_url);
      }
    } catch (err) {
      console.error('Error initiating payment:', err);
      setPaymentLoading(false);
      setError('Une erreur est survenue lors de la préparation du paiement. Veuillez réessayer.');
    }
  };

  const handleCancel = () => {
    // Go back to the previous page (blane detail)
    navigate(-1);
  };

  if (!type || !entityId || !data || !blane) {
    return null; // Handled by useEffect redirect
  }

  return (
    <div className="container mx-auto py-8 bg-gray-50 min-h-[80vh]">
      <div className="max-w-3xl mx-auto">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            <p>{error}</p>
            <button 
              onClick={() => setError(null)}
              className="mt-2 text-sm underline"
            >
              Réessayer
            </button>
          </div>
        )}

        {paymentLoading ? (
          <PaymentLoading />
        ) : (
          <>
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Finaliser votre {type === 'reservation' ? 'réservation' : 'commande'}</h1>
            
            <OrderSummary
              type={type}
              data={data}
              blane={blane}
              onProceedToPayment={handleProceedToPayment}
              onCancel={handleCancel}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default Checkout; 