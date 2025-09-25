import { useState, ChangeEvent, FormEvent } from 'react';
import { ShoppingCart, Check, Loader2, Users } from 'lucide-react';
import { Alert, AlertDescription } from '@/user/components/ui/alert';
import { Button } from '@/user/components/ui/button';
import { FloatingInput } from '@/user/components/ui/FloatingInput';
import { FloatingTextarea } from '@/user/components/ui/FloatingTextarea';
import { FloatingSelect } from '@/user/components/ui/FloatingSelect';
import { PhoneInput } from '@/user/components/ui/PhoneInput';
import { formatPrice } from '@/user/lib/utils';
import { paymentService } from '@/user/services/paymentService';
import { orderService } from '@/user/lib/api/services/orderService';
import PaymentLoading from '@/user/components/PaymentLoading';
import { useHomeData } from '@/user/lib/hooks/useHomeData';
import { City } from '@/user/lib/types/home';
import CMI from '@/assets/images/logo_cmi.png';
import VISA from '@/assets/images/tn_verified_by_visa.png';
import MASTER from '@/assets/images/secure_code_logo.png';
import { validateInternationalPhone, formatPhoneNumber } from '@/user/lib/utils/phoneValidation';

// Constants
const DEFAULT_TVA_RATE = 0.20; // 20% TVA as default

// Extended Blane interface
interface ExtendedBlane {
  id: number;
  name: string;
  price_current: number;
  max_orders?: number;
  tva?: number;
  is_digital?: boolean;
  partiel?: boolean;
  partiel_field?: number;
  stock?: number;
  city?: string;
  online?: boolean;
  cash?: boolean;
  slug: string;
  livraison_in_city?: number;
  livraison_out_city?: number;
}

// Extended OrderType interface
interface ExtendedOrderType {
  id?: number;
  NUM_ORD?: string;
  status?: string;
  total_price?: number;
  partiel_price?: number;
  payment_method?: string;
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
    city?: string;
  };
  delivery_address?: string;
  quantity?: number;
}

// Form data interface
interface FormData {
  name: string;
  email: string;
  phone: string;
  countryCode: string;
  phoneFormatted?: string;
  countryName?: string;
  delivery_address: string;
  city: string;
  quantity: number;
  paymentMethod: 'cash' | 'partial' | 'online' | '';
  comments: string;
}

interface SimpleOrderFormProps {
  blane: ExtendedBlane;
  onOrderComplete: (orderData: ExtendedOrderType) => void;
}

export const SimpleOrderForm = ({ blane, onOrderComplete }: SimpleOrderFormProps) => {
  // Get home data to access cities
  const { data: homeData, isLoading: isLoadingHomeData } = useHomeData();

  // Get the maximum available quantity
  const stockAvailable = blane.stock !== undefined ? blane.stock : Number.MAX_SAFE_INTEGER;
  const maxOrdersConfig = blane.max_orders || 10;
  const maxAvailableQuantity = Math.min(stockAvailable, maxOrdersConfig);

  // Form state
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    countryCode: '212', // Default to Morocco
    phoneFormatted: '',
    countryName: '',
    delivery_address: '',
    city: blane.city || '',
    quantity: 1,
    paymentMethod: '',
    comments: '',
  });

  // UI state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  const [showPaymentLoading, setShowPaymentLoading] = useState<boolean>(false);
  const [orderComplete, setOrderComplete] = useState<boolean>(false);
  const [orderData, setOrderData] = useState<ExtendedOrderType | null>(null);

  // Add phone validation state
  const [phoneError, setPhoneError] = useState<string>('');

  // Form validation
  const isFormValid = (() => {
    const phoneValidation = validateInternationalPhone(formData.countryCode, formData.phone);
    const baseValidation = !!(
      formData.name && 
      formData.email && 
      formData.phone &&
      phoneValidation.isValid &&
      formData.paymentMethod
    );

    // Add delivery validation only for non-digital products
    if (!blane.is_digital) {
      return baseValidation && 
             !!formData.delivery_address && 
             !!formData.city;
    }

    return baseValidation;
  })();

  // Price calculations
  const calculateBasePrice = () => {
    const totalPrice = blane.price_current * formData.quantity;
    const tvaRate = blane.tva !== undefined ? blane.tva / 100 : DEFAULT_TVA_RATE;
    return totalPrice / (1 + tvaRate);
  };

  const calculateTvaAmount = () => {
    const basePrice = calculateBasePrice();
    const tvaRate = blane.tva !== undefined ? blane.tva / 100 : DEFAULT_TVA_RATE;
    return basePrice * tvaRate;
  };

  const calculateDeliveryFee = () => {
    if (blane.is_digital) return 0;
    
    const isSameCity = formData.city === blane.city;
    return isSameCity ? (blane.livraison_in_city || 0) : (blane.livraison_out_city || 0);
  };

  const calculateTotalPrice = () => {
    const productPrice = blane.price_current * formData.quantity;
    const deliveryFee = calculateDeliveryFee();
    return productPrice + deliveryFee;
  };

  const calculatePartialAmount = () => {
    const percentage = blane.partiel_field || 33;
    const totalPrice = calculateTotalPrice();
    return parseFloat((totalPrice * (percentage / 100)).toFixed(2));
  };

  // Event handlers
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'phone' || name === 'countryCode') {
      const phoneValue = name === 'phone' ? value : formData.phone;
      const countryCodeValue = name === 'countryCode' ? value : formData.countryCode;
      
      // Only validate if we have both values
      if (phoneValue && countryCodeValue) {
        const validationResult = validateInternationalPhone(countryCodeValue, phoneValue);
        
        if (!validationResult.isValid) {
          setPhoneError(validationResult.errorMessage || 'Numéro de téléphone invalide');
        } else {
          setPhoneError('');
        }

        // Update form data with formatted phone and country info
        setFormData(prev => ({
          ...prev,
          [name]: value,
          phoneFormatted: validationResult.isValid ? formatPhoneNumber(countryCodeValue, phoneValue) : undefined,
          countryName: validationResult.countryName
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: value,
          phoneFormatted: undefined,
          countryName: undefined
        }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleQuantityChange = (amount: number) => {
    setFormData(prev => ({
      ...prev,
      quantity: Math.max(1, Math.min(maxAvailableQuantity, prev.quantity + amount))
    }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (isFormValid) {
      setShowConfirmation(true);
    } else {
      setErrorMessage("Veuillez remplir tous les champs obligatoires.");
    }
  };

  const handleConfirmSubmit = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    
    try {
      // Validate phone number one last time before submitting
      const phoneValidation = validateInternationalPhone(formData.countryCode, formData.phone);
      if (!phoneValidation.isValid) {
        setErrorMessage(phoneValidation.errorMessage || "Numéro de téléphone invalide");
        setIsSubmitting(false);
        return;
      }
      
      // Format the phone number for submission
      const formattedPhone = formData.countryCode + formData.phone; // Just concatenate without spaces or plus sign

      // Prepare order data
      const orderPayload = {
        blane_id: blane.id,
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formattedPhone,
        delivery_address: blane.is_digital ? undefined : formData.delivery_address.trim(),
        city: blane.is_digital ? undefined : formData.city.trim(),
        quantity: Number(formData.quantity),
        comments: formData.comments ? formData.comments.trim() : "",
        payment_method: formData.paymentMethod === 'partial' ? 'partiel' : 
                       formData.paymentMethod === 'cash' ? 'cash' : 'online',
        total_price: parseFloat(calculateTotalPrice().toFixed(2)),
        partiel_price: formData.paymentMethod === 'partial' ? 
          parseFloat(calculatePartialAmount().toFixed(2)) : null,
        delivery_fee: calculateDeliveryFee()
      };

      try {
        // Create order with more detailed error handling
        const response = await orderService.createOrder(orderPayload);
        
        // Extract data - handle different response structures
        const orderData = response.data || response;
        
        // Close confirmation modal
        setShowConfirmation(false);
        
        // Handle online payment
        if (formData.paymentMethod === 'online' || formData.paymentMethod === 'partial') {
          setShowPaymentLoading(true);
          
          try {
            // Save pending order data to localStorage BEFORE redirecting
            try {
              // Store both the order ID and full data
              const orderId = orderData.NUM_ORD || orderData.id?.toString() || '';
              localStorage.setItem(`blane_${blane.slug}_order_id`, orderId);
              
              // Add delivery fee to order data before storing
              const orderDataWithFee = {
                ...orderData,
                delivery_fee: calculateDeliveryFee()
              };
              localStorage.setItem(`blane_${blane.slug}_order_data`, JSON.stringify(orderDataWithFee));
              
              // Store delivery fee in a dedicated key for easier retrieval
              localStorage.setItem(`order_${orderId}_delivery_fee`, calculateDeliveryFee().toString());
              
              // Also store a copy without the specific ID for fallback retrieval
              if (blane.slug) {
                localStorage.setItem(`delivery_fee_${blane.slug}`, calculateDeliveryFee().toString());
              }
              
              // Also store payment intent data
              const paymentIntent = {
                type: 'order',
                id: orderId,
                method: formData.paymentMethod,
                amount: formData.paymentMethod === 'partial' ? calculatePartialAmount() : calculateTotalPrice(),
                timestamp: new Date().toISOString(),
                status: orderData.status || 'pending'
              };
              localStorage.setItem(`blane_${blane.slug}_payment_intent`, JSON.stringify(paymentIntent));
            } catch {
              // Silently handle localStorage errors
            }
            
            // Try to get payment URL
            const paymentType = formData.paymentMethod === 'partial' ? 'partial' : 'full';
            const orderId = orderData.NUM_ORD || orderData.id?.toString() || '';
            
            if (!orderId) {
              throw new Error('No order ID received from server');
            }
            
            const paymentData = await paymentService.initiatePayment(
              'order',
              orderId,
              paymentType as 'full' | 'partial'
            );
            
            if (paymentData && paymentData.redirect_url) {
              // Use the payment service to submit form with POST method
              paymentService.submitPaymentForm(
                paymentData.redirect_url,
                paymentData.payment_form_data
              );
            } else {
              throw new Error('No redirect URL received');
            }
          } catch {
            setErrorMessage('Erreur lors de la préparation du paiement');
            setShowPaymentLoading(false);
            
            // Still notify parent of completed order
            onOrderComplete(orderData);
          }
        } else {
          // For cash payments, show order confirmation
          // Store delivery fee in localStorage for cash payments as well
          try {
            const orderId = orderData.NUM_ORD || orderData.id?.toString() || '';
            const orderDataWithFee = {
              ...orderData,
              delivery_fee: calculateDeliveryFee()
            };
            localStorage.setItem(`blane_${blane.slug}_order_id`, orderId);
            localStorage.setItem(`blane_${blane.slug}_order_data`, JSON.stringify(orderDataWithFee));
            
            // Store delivery fee in a dedicated key for easier retrieval
            localStorage.setItem(`order_${orderId}_delivery_fee`, calculateDeliveryFee().toString());
            
            // Also store a copy without the specific ID for fallback retrieval
            if (blane.slug) {
              localStorage.setItem(`delivery_fee_${blane.slug}`, calculateDeliveryFee().toString());
            }
          } catch {
            // Silently handle localStorage errors
          }
          
          setOrderData(orderData);
          setOrderComplete(true);
          onOrderComplete(orderData);
        }
      } catch (apiError: unknown) {
        // Enhanced error handling for API errors
        
        // Try to get detailed error information from response
        let errorMessage = 'Erreur lors de la création de votre commande';
        
        if (apiError && typeof apiError === 'object' && 'response' in apiError) {
          const error = apiError as { response?: { data?: { error?: unknown; message?: string } } };
          
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          
          if (error.response?.data?.error) {
            if (typeof error.response.data.error === 'string') {
              errorMessage = error.response.data.error;
            } else if (typeof error.response.data.error === 'object') {
              // Handle validation errors
              errorMessage = 'Erreurs de validation:';
              Object.entries(error.response.data.error).forEach(([field, errors]) => {
                if (Array.isArray(errors)) {
                  errorMessage += `\n- ${field}: ${errors.join(', ')}`;
                } else {
                  errorMessage += `\n- ${field}: ${errors}`;
                }
              });
            }
          } else if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
          }
        }
        
        setErrorMessage(errorMessage);
      }
    } catch {
      // Error message is set in inner catch block
    } finally {
      setIsSubmitting(false);
    }
  };

  // Now, AFTER all hooks are declared, we can do conditional rendering
  
  // The Confirmation component
  const ConfirmationModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto scrollbar-hide p-5">
        <h3 className="text-xl font-bold mb-4">Confirmer votre commande</h3>
        
        <div className="space-y-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="font-semibold">{blane.name}</p>
            <p>Quantité: {formData.quantity}</p>
            <p className="text-sm text-gray-500">Prix unitaire: {formatPrice(blane.price_current)}</p>
            <div className="border-t mt-2 pt-2 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Prix unitaire</span>
                <span className="font-medium">{formatPrice(blane.price_current)}</span>
              </div>

              {!blane.is_digital && calculateDeliveryFee() > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Frais de livraison</span>
                  <span className="font-medium">{formatPrice(calculateDeliveryFee())}</span>
                </div>
              )}

              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Sous-total</span>
                <span className="font-medium">{formatPrice(blane.price_current * formData.quantity)}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-600">TVA ({blane.tva || 20}%)</span>
                <span className="font-medium">{formatPrice(calculateTvaAmount())}</span>
              </div>

              <div className="flex justify-between font-medium pt-2 border-t">
                <span>Total TTC</span>
                <span className="text-[#197874]">{formatPrice(calculateTotalPrice())}</span>
              </div>

              {formData.paymentMethod === 'partial' && (
                <div className="flex justify-between text-sm text-blue-600 pt-2 border-t">
                  <span>Acompte à payer maintenant ({blane.partiel_field || 33}%)</span>
                  <span className="font-medium">{formatPrice(calculatePartialAmount())}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <p><span className="font-medium">Nom:</span> {formData.name}</p>
            <p><span className="font-medium">Email:</span> {formData.email}</p>
            <p><span className="font-medium">Téléphone:</span> {formData.phoneFormatted || formData.phone}</p>
            {formData.countryName && !phoneError && (
              <p><span className="font-medium">Pays:</span> {formData.countryName}</p>
            )}
            {!blane.is_digital && (
              <>
                <p><span className="font-medium">Adresse:</span> {formData.delivery_address}</p>
                <p><span className="font-medium">Ville:</span> {formData.city}</p>
              </>
            )}
            <p><span className="font-medium">Méthode de paiement:</span> {
              formData.paymentMethod === 'cash' ? 'Cash' :
              formData.paymentMethod === 'online' ? 'Paiement en ligne' :
              formData.paymentMethod === 'partial' ? `Acompte de ${blane.partiel_field || 33}%` : ''
            }</p>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setShowConfirmation(false)}
            disabled={isSubmitting}
          >
            Modifier
          </Button>
          <Button
            className="flex-1"
            onClick={handleConfirmSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Traitement...
              </>
            ) : (
              'Confirmer'
            )}
          </Button>
        </div>
      </div>
    </div>
  );

  // Conditional renders that return JSX
  if (showPaymentLoading) {
    return <PaymentLoading />;
  }

  if (orderComplete && orderData) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-4">
            <Check className="h-6 w-6 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Commande Confirmée</h2>
          <p className="mt-1 text-gray-500">Référence: {orderData.NUM_ORD || `#${orderData.id}`}</p>
        </div>
        
        <div className="space-y-4 mb-6">
          <div className="border-t border-b border-gray-200 py-4">
            <h3 className="font-medium text-gray-900 mb-2">Détails de la commande</h3>
            <p className="text-gray-600">Article: {blane.name}</p>
            <p className="text-gray-600">Quantité: {orderData.quantity || 1}</p>
            <p className="text-gray-600">Total: {formatPrice(Number(orderData.total_price) || 0)}</p>
            {orderData.payment_method === 'partial' && orderData.partiel_price && (
              <p className="text-gray-600">Acompte payé: {formatPrice(Number(orderData.partiel_price))}</p>
            )}
          </div>
          
          <div className="py-4">
            <h3 className="font-medium text-gray-900 mb-2">Informations client</h3>
            <p className="text-gray-600">{orderData.customer?.name || ''}</p>
            <p className="text-gray-600">{orderData.customer?.email || ''}</p>
            <p className="text-gray-600">{orderData.customer?.phone || ''}</p>
            {!blane.is_digital && (
              <>
                <p className="text-gray-600">{orderData.delivery_address || ''}</p>
                <p className="text-gray-600">{orderData.customer?.city || ''}</p>
              </>
            )}
          </div>
        </div>
        
        <div className="flex justify-center">
          <Button 
            variant="outline" 
            className="mr-2"
            onClick={() => {
              setOrderComplete(false);
              setOrderData(null);
              setFormData({
                name: '',
                email: '',
                phone: '',
                countryCode: '212',
                phoneFormatted: '',
                countryName: '',
                delivery_address: '',
                city: blane.city || '',
                quantity: 1,
                paymentMethod: '',
                comments: '',
              });
            }}
          >
            Nouvelle commande
          </Button>
        </div>
      </div>
    );
  }

  // Main render
  return (
    <>
      {showConfirmation && <ConfirmationModal />}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {errorMessage && (
          <Alert variant="destructive">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
        
        {/* Product Summary Card */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">{blane.name}</h3>
              <p className="text-sm text-gray-500">Prix: {formatPrice(blane.price_current)}</p>
            </div>
          </div>
          
          <div className="border-t border-gray-100 pt-4 mt-2">
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium text-gray-600">Prix total:</p>
              <p className="font-semibold text-lg">{formatPrice(calculateTotalPrice())}</p>
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {formData.quantity} × {formatPrice(blane.price_current)}
              {blane.tva !== undefined && (
                <span> (TVA incluse: {formatPrice(calculateTvaAmount())})</span>
              )}
              {!blane.is_digital && calculateDeliveryFee() > 0 && (
                <span> + Frais de livraison: {formatPrice(calculateDeliveryFee())}</span>
              )}
            </div>
          </div>
        </div>
        
        {/* Quantity Section */}
        <div className="space-y-4">
          <label htmlFor="quantity" className="flex items-center gap-2 text-gray-700 text-lg font-semibold mb-2">
            <Users size={20} className="text-[#197874]" /> Quantité
          </label>
          
          <div className="flex items-center justify-center bg-gray-50 border border-gray-200 rounded-full overflow-hidden w-fit mx-auto shadow-inner">
            <button
              type="button"
              onClick={() => handleQuantityChange(-1)}
              disabled={formData.quantity <= 1}
              className={`px-4 py-2 text-lg font-bold transition-transform
                ${formData.quantity <= 1
                  ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                  : 'bg-white hover:bg-gray-100 active:scale-90'}
              `}
            >
              -
            </button>
            
            <input
              id="quantity"
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (!isNaN(value) && value >= 1 && value <= maxAvailableQuantity) {
                  setFormData(prev => ({ ...prev, quantity: value }));
                }
              }}
              min="1"
              max={maxAvailableQuantity}
              className="w-16 text-center bg-transparent focus:outline-none text-lg font-semibold focus:ring-0 focus:border-0 transition-all animate-pulse-on-change"
            />
            
            <button
              type="button"
              onClick={() => handleQuantityChange(1)}
              disabled={formData.quantity >= maxAvailableQuantity}
              className={`px-4 py-2 text-lg font-bold transition-transform
                ${formData.quantity >= maxAvailableQuantity
                  ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                  : 'bg-white hover:bg-gray-100 active:scale-90'}
              `}
            >
              +
            </button>
          </div>
          
          <div className="mt-4 space-y-2 text-center">
            <p className="text-xs text-gray-500">
              Maximum disponible : <span className="font-semibold">{maxAvailableQuantity}</span> article{maxAvailableQuantity > 1 ? 's' : ''}
            </p>
          </div>
        </div>
        
        {/* Contact Information */}
        <div className="space-y-4">
          <h3 className="font-medium text-gray-800">Informations de contact</h3>
          
          <FloatingInput
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            label="Nom complet"
            required
          />
          
          <FloatingInput
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            label="Email"
            required
          />
          
          <PhoneInput
            countryCode={formData.countryCode}
            phoneNumber={formData.phone}
            onCountryCodeChange={(value) => setFormData(prev => ({ ...prev, countryCode: value }))}
            onPhoneNumberChange={(value) => setFormData(prev => ({ ...prev, phone: value }))}
            onValidationChange={(result) => {
              setPhoneError(result.errorMessage || '');
              setFormData(prev => ({
                ...prev,
                phoneFormatted: result.formattedNumber,
                countryName: result.countryName
              }));
            }}
            required
          />
          
          {phoneError && (
            <div className="text-sm text-red-500 mt-1">
              {phoneError}
            </div>
          )}
          {formData.countryName && !phoneError && (
            <div className="text-sm text-green-600 mt-1">
              ✓ {formData.countryName}
            </div>
          )}
          
          {!blane.is_digital && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-700">Informations de livraison</h3>
              <FloatingInput
                id="delivery_address"
                type="text"
                name="delivery_address"
                label="Adresse de livraison"
                value={formData.delivery_address}
                onChange={handleInputChange}
                required
              />
              
              <FloatingSelect
                id="city"
                name="city"
                label="Ville"
                required
                value={formData.city}
                onValueChange={(value) => setFormData(prev => ({ ...prev, city: value }))}
                options={homeData?.data?.cities?.map((city: City) => ({
                  id: city.id,
                  name: city.name,
                  value: city.name
                })) || [
                  { id: 'default', name: blane.city || "Sélectionnez une ville", value: blane.city || "default_city" }
                ]}
                loading={isLoadingHomeData}
              />
            </div>
          )}
          
          <FloatingTextarea
            id="comments"
            name="comments"
            value={formData.comments}
            onChange={handleInputChange}
            label="Commentaires"
            rows={3}
          />
        </div>
        
        {/* Payment Method */}
        <div className="space-y-4">
          <h3 className="font-medium text-gray-800">Méthode de paiement</h3>
          
          <div className="grid grid-cols-1 gap-3">
            {/* Cash option */}
            {blane.cash && (
              <div 
                className={`border rounded-xl p-3 cursor-pointer ${
                  formData.paymentMethod === 'cash' 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-200'
                }`}
                onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'cash' }))}
              >
                <div className="flex items-center">
                  <div className={`rounded-full p-2 mr-3 ${
                    formData.paymentMethod === 'cash' 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      className="w-5 h-5"
                    >
                      <rect width="20" height="12" x="2" y="6" rx="2" />
                      <circle cx="12" cy="12" r="2" />
                      <path d="M6 12h.01M18 12h.01" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Paiement sur place</p>
                    {/* <p className="text-sm text-gray-500">Payez en espèces</p> */}
                  </div>
                  {formData.paymentMethod === 'cash' && (
                    <Check size={18} className="ml-auto text-green-600" />
                  )}
                </div>
              </div>
            )}
            
            {/* Partial payment option */}
            {blane.partiel && (
              <div 
                className={`border rounded-xl p-3 cursor-pointer ${
                  formData.paymentMethod === 'partial' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200'
                }`}
                onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'partial' }))}
              >
                <div className="flex items-center">
                  <div className={`rounded-full p-2 mr-3 ${
                    formData.paymentMethod === 'partial' 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      className="w-5 h-5"
                    >
                      <rect width="20" height="14" x="2" y="5" rx="2" />
                      <line x1="2" x2="22" y1="10" y2="10" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">Paiement partiel online</p>
                    <p className="text-sm text-gray-500">Réservez maintenant, payez le reste plus tard</p>
                  </div>
                  <div className="flex flex-col items-end ml-2">
                    <div className="flex items-center space-x-1 mb-1">
                      <img src={CMI} alt="CMI" className="h-5" />
                      <img src={VISA} alt="Visa" className="h-5" />
                      <img src={MASTER} alt="MasterCard SecureCode" className="h-5" />
                    </div>
                    {formData.paymentMethod === 'partial' && (
                      <Check size={18} className="text-blue-600" />
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Online payment option */}
            {blane.online && (
              <div 
                className={`border rounded-xl p-3 cursor-pointer ${
                  formData.paymentMethod === 'online' 
                    ? 'border-purple-500 bg-purple-50' 
                    : 'border-gray-200'
                }`}
                onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'online' }))}
              >
                <div className="flex items-center">
                  <div className={`rounded-full p-2 mr-3 ${
                    formData.paymentMethod === 'online' 
                      ? 'bg-purple-100 text-purple-600' 
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      className="w-5 h-5"
                    >
                      <rect width="20" height="14" x="2" y="5" rx="2" />
                      <circle cx="12" cy="12" r="3" />
                      <path d="m17 12 1.5-3" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">Paiement en ligne</p>
                    <p className="text-sm text-gray-500">Payez maintenant par carte bancaire</p>
                  </div>
                  <div className="flex flex-col items-end ml-2">
                    <div className="flex items-center space-x-1 mb-1">
                      <img src={CMI} alt="CMI" className="h-5" />
                      <img src={VISA} alt="Visa" className="h-5" />
                      <img src={MASTER} alt="MasterCard SecureCode" className="h-5" />
                    </div>
                    {formData.paymentMethod === 'online' && (
                      <Check size={18} className="text-purple-600" />
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Submit Button */}
        <Button 
          type="submit" 
          disabled={!isFormValid || isSubmitting}
          className="w-full p-6"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Traitement...
            </>
          ) : (
            <>
              <ShoppingCart className="mr-2 h-4 w-4" />
              Commander
            </>
          )}
        </Button>
      </form>
    </>
  );
}; 