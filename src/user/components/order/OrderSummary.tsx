import { Check, User, MapPin, Clock, Box, ShoppingBag, FileText, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/user/components/ui/button';
import { generateAndDownloadPDF } from '@/user/lib/utils/pdfGenerator';
import { toast } from 'react-hot-toast';
import { PaymentService } from '@/user/lib/api/services/paymentService';
import { Blane } from '@/user/types/blane';

export interface OrderSummaryProps {
  order: OrderType;
  blane: Blane;
  onNewOrder: () => void;
}

interface OrderType {
  id?: number | string;
  NUM_ORD?: string;
  status?: string;
  total_price?: number;
  total_amount?: number;
  total?: number;
  partiel_price?: number;
  paid_amount?: number;
  payment_method?: string;
  payment_status?: string;
  quantity?: number;
  name?: string;
  full_name?: string;
  email?: string;
  phone?: string;
  delivery_address?: string;
  address?: string;
  city?: string;
  comments?: string;
  notes?: string;
  created_at?: string;
  order_number?: string;
  delivery_fee?: number;
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
    city?: string;
  };
}

// Helper function to safely parse numbers
const safeParseFloat = (value: string | number | undefined | null): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

// Helper function to safely format numbers
const safeToFixed = (value: string | number | undefined | null, decimals: number = 2): string => {
  const num = safeParseFloat(value);
  return num.toFixed(decimals);
};

// Helper function to get delivery fee from localStorage if not present in order
const getDeliveryFee = (order: OrderType, blane: Blane): number => {
  // First check if order has delivery fee
  if (order.delivery_fee !== undefined && order.delivery_fee !== null) {
    const fee = safeParseFloat(order.delivery_fee);
    if (fee > 0) return fee;
  }
  
  // Try to get from localStorage using different possible keys
  try {
    const orderNumber = order.NUM_ORD || order.order_number || order.id;
    
    // Check direct delivery fee storage first (most reliable)
    if (orderNumber) {
      const directFee = localStorage.getItem(`order_${orderNumber}_delivery_fee`);
      if (directFee) {
        const fee = safeParseFloat(directFee);
        if (fee > 0) return fee;
      }
    }
    
    // Check by slug
    if (blane.slug) {
      const slugFee = localStorage.getItem(`delivery_fee_${blane.slug}`);
      if (slugFee) {
        const fee = safeParseFloat(slugFee);
        if (fee > 0) return fee;
      }
    }
    
    // Check in stored order data
    const possibleKeys = [
      `blane_${blane.slug}_order_data`,
      `order_data_${orderNumber}`
    ];
    
    for (const key of possibleKeys) {
      const storedData = localStorage.getItem(key);
      if (storedData) {
        try {
          const parsedData = JSON.parse(storedData);
          if (parsedData && parsedData.delivery_fee !== undefined) {
            const fee = safeParseFloat(parsedData.delivery_fee);
            if (fee > 0) return fee;
          }
        } catch (error) {
          console.log(`Error parsing JSON from ${key}`, error);
          // Continue to next key
        }
      }
    }
    
    // If we get here, try to extract from localStorage keys that match pattern
    const allKeys = Object.keys(localStorage);
    for (const key of allKeys) {
      if ((blane.slug && key.includes(blane.slug)) || 
          (orderNumber && key.includes(String(orderNumber)))) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          if (data && data.delivery_fee !== undefined) {
            const fee = safeParseFloat(data.delivery_fee);
            if (fee > 0) return fee;
          }
        } catch {
          // Ignore parsing errors and continue
        }
      }
    }
    
    // As a last resort, try to get the delivery fee from the current URL
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const deliveryFee = urlParams.get('delivery_fee');
      if (deliveryFee) {
        return safeParseFloat(deliveryFee);
      }
    }
  } catch (error) {
    console.error('Error retrieving delivery fee from localStorage:', error);
  }
  
  // Default to 0 if not found
  return 0;
};

export const OrderSummary = ({ order, blane, onNewOrder }: OrderSummaryProps) => {
  // Helper to get status display information
  const getStatusInfo = (status: string = 'pending') => {
    const normalizedStatus = status?.toLowerCase() || 'pending';
    const isCashPayment = order.payment_method?.toLowerCase() === 'cash';
    
    switch (normalizedStatus) {
      case 'paid':
      case 'completed':
      case 'confirmed':
      case 'delivered':
        return {
          text: 'Confirmée',
          color: 'bg-green-100 text-green-800',
          icon: <Check className="h-5 w-5 text-green-600" />
        };
      case 'processing':
      case 'shipped':
        return {
          text: 'En traitement',
          color: 'bg-blue-100 text-blue-800',
          icon: <Box className="h-5 w-5 text-blue-600" />
        };
      case 'pending':
        return {
          text: isCashPayment ? 'Commande bien reçue. Nous la traitons au plus vite' : 'En attente',
          color: 'bg-amber-100 text-amber-800',
          icon: <Clock className="h-5 w-5 text-amber-600" />
        };
      case 'canceled':
      case 'cancelled':
        return {
          text: 'Annulée',
          color: 'bg-red-100 text-red-800',
          icon: <User className="h-5 w-5 text-red-600" />
        };
      default:
        return {
          text: 'En attente',
          color: 'bg-blue-100 text-blue-800',
          icon: <ShoppingBag className="h-5 w-5 text-blue-600" />
        };
    }
  };

  // Format payment status label and color
  const getPaymentMethodLabel = (method?: string) => {
    const paymentMethod = method || order.payment_status || order.payment_method || 'pending';
    
    switch (paymentMethod?.toLowerCase()) {
      case 'paid':
      case 'completed':
      case 'online':
        return 'Paiement en ligne';
      case 'partial':
      case 'partiel':
        return 'Paiement partiel';
      case 'cash':
        return 'Paiement Cash';
      case 'pending':
        return 'En attente de paiement';
      case 'failed':
        return 'Échec du paiement';
      default:
        return paymentMethod || 'Non spécifié';
    }
  };

  // Get status display
  const statusInfo = getStatusInfo(order.status);
  
  // Check if product is digital
  const isDigital = blane.is_digital === true;

  // Prioritize NUM_ORD over other identifiers
  const orderNumber = order.NUM_ORD || order.order_number || order.id || 'N/A';
  const orderDate = order.created_at ? new Date(order.created_at).toLocaleDateString('fr-FR') : 'N/A';
  const quantity = safeParseFloat(order.quantity) || 1;
  
  // Safely parse all numeric values
  const totalAmount = safeParseFloat(order.total_price || order.total_amount || order.total || 0);
  const paidAmount = safeParseFloat(order.paid_amount || 0);
  const remainingAmount = Math.max(0, totalAmount - paidAmount);
  const tva = safeParseFloat(blane.tva) || 20; // Default 20% TVA
  const basePrice = totalAmount / (1 + tva / 100);
  const tvaAmount = totalAmount - basePrice;
  const unitPrice = safeParseFloat(blane.price_current) || 0;
  const deliveryFee = getDeliveryFee(order, blane);
  const subtotal = totalAmount - deliveryFee;

  // Extract customer information
  const fullName = order.name || order.full_name || (order.customer?.name) || 'N/A';
  const email = order.email || (order.customer?.email) || 'N/A';
  const phone = order.phone || (order.customer?.phone) || 'N/A';
  const address = order.delivery_address || order.address || 'N/A';
  const city = order.city || (order.customer?.city) || 'N/A';

  // Handle PDF download
  const handleDownloadPDF = async () => {
    try {
      // Prepare order data for PDF generation
      const orderData = {
        NUM_ORD: orderNumber !== 'N/A' ? String(orderNumber) : undefined,
        delivery_address: address,
        total_price: totalAmount,
        partiel_price: order.partiel_price,
        payment_method: order.payment_method,
        quantity: quantity,
        customer: {
          name: fullName,
          email: email,
          phone: phone,
          city: city,
          address: address
        },
        blane: {
          name: blane.name,
          price_current: unitPrice,
          tva: tva,
          type: blane.type,
          partiel_field: safeParseFloat(blane.partiel_field)
        }
      };
      
      // Generate reference number if not available
      const referenceNumber = orderNumber !== 'N/A' ? 
        `BLANE-${orderNumber}` : 
        `BLANE-${new Date().getTime()}`;
      
      // Generate and download PDF
      await generateAndDownloadPDF(
        orderData, 
        null, 
        referenceNumber,
        () => toast.success('PDF téléchargé avec succès'),
        (error) => {
          console.error('Error downloading PDF:', error);
          toast.error('Échec du téléchargement du PDF. Réessayez plus tard.');
        }
      );
    } catch (error) {
      console.error('Error preparing PDF download:', error);
      toast.error('Échec de la préparation du PDF. Réessayez plus tard.');
    }
  };

  // Handle retry payment
  const handleRetryPayment = async () => {
    try {
      const paymentNumber = order.NUM_ORD 
        ? `BLANE-${order.NUM_ORD}` 
        : `BLANE-${order.id || new Date().getTime()}`;
      
      const paymentData = await PaymentService.initiateCmiPayment({
        number: paymentNumber,
        payment_type: 'full'
      });
      
      if (paymentData?.inputs) {
        // Create a form element
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = paymentData.payment_url;
        
        // Add all input fields from the response
        Object.entries(paymentData.inputs).forEach(([key, value]) => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = value as string;
          form.appendChild(input);
        });
        
        // Add the form to the document and submit it
        document.body.appendChild(form);
        form.submit();
      }
    } catch (error) {
      console.error('Error retrying payment:', error);
      toast.error('Échec du paiement. Veuillez réessayer plus tard.');
    }
  };

  // Render payment status banner
  const renderPaymentStatusBanner = () => {
    const status = order.status?.toLowerCase() || 'pending';
    const paymentMethod = order.payment_method?.toLowerCase() || '';
    
    // Don't show banner for cash payments
    if (paymentMethod === 'cash') return null;
    
    const isPendingOrFailed = status === 'pending' || status === 'failed';
    const isOnlineOrPartial = paymentMethod === 'online' || paymentMethod === 'partial' || paymentMethod === 'partiel';
    
    return (
      <div className={`mb-4 p-4 rounded-lg ${
        status === 'confirmed' || status === 'paid' || status === 'completed' || status === 'delivered'
          ? 'bg-green-50 border border-green-200' 
          : status === 'pending' 
            ? 'bg-amber-50 border border-amber-200' 
            : 'bg-red-50 border border-red-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {status === 'confirmed' || status === 'paid' || status === 'completed' || status === 'delivered' ? (
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            ) : status === 'pending' ? (
              <Clock className="h-5 w-5 text-amber-600 mr-2" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600 mr-2" />
            )}
            <p className={`font-medium ${
              status === 'confirmed' || status === 'paid' || status === 'completed' || status === 'delivered'
                ? 'text-green-700' 
                : status === 'pending' 
                  ? 'text-amber-700' 
                  : 'text-red-700'
            }`}>
              {status === 'confirmed' || status === 'paid' || status === 'completed' || status === 'delivered' 
                ? 'Paiement confirmé' 
                : status === 'pending' 
                  ? 'Paiement en attente' 
                  : 'Échec du paiement'}
            </p>
          </div>
          {isPendingOrFailed && isOnlineOrPartial && (
            <Button
              onClick={handleRetryPayment}
              className={`${
                status === 'pending' 
                  ? 'bg-amber-600 hover:bg-amber-700' 
                  : 'bg-red-600 hover:bg-red-700'
              } text-white`}
            >
              {status === 'pending' ? 'Continuer le paiement' : 'Réessayer le paiement'}
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Payment Status Banner */}
      {renderPaymentStatusBanner()}
      
      {/* Header */}
      <div className="text-center">
        <div className={`inline-flex items-center justify-center p-3 rounded-full ${statusInfo.color} mb-3`}>
          {statusInfo.icon}
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">
          Commande #{orderNumber}
        </h2>
        <p className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
          {statusInfo.text}
        </p>
      </div>

      {/* Order Details */}
      <div className="bg-gray-50 rounded-xl p-5 border">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
          <ShoppingBag size={18} className="mr-2 text-[#197874]" />
          Détails de la commande
        </h3>
        
        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b border-gray-200 text-sm">
            <span className="text-gray-500">Produit</span>
            <span className="font-medium">{blane.name}</span>
          </div>
          
          <div className="flex justify-between py-2 border-b border-gray-200 text-sm">
            <span className="text-gray-500">Date de commande</span>
            <span className="font-medium">{orderDate}</span>
          </div>
          
          <div className="flex justify-between py-2 border-b border-gray-200 text-sm">
            <span className="text-gray-500">Quantité</span>
            <span className="font-medium">{quantity}</span>
          </div>
          
          {isDigital && (
            <div className="flex justify-between py-2 border-b border-gray-200 text-sm">
              <span className="text-gray-500">Type de produit</span>
              <span className="font-medium">Produit digital</span>
            </div>
          )}
          
          <div className="flex justify-between py-2 border-b border-gray-200 text-sm">
            <span className="text-gray-500">Prix unitaire</span>
            <span className="font-medium">{safeToFixed(unitPrice)} DH</span>
          </div>

          {!isDigital && (
            <div className="flex justify-between py-2 border-b border-gray-200 text-sm">
              <span className="text-gray-500">Frais de livraison</span>
              <span className="font-medium">{safeToFixed(deliveryFee)} DH</span>
            </div>
          )}

          <div className="flex justify-between py-2 border-b border-gray-200 text-sm">
            <span className="text-gray-500">Sous-total</span>
            <span className="font-medium">{safeToFixed(subtotal)} DH</span>
          </div>

          <div className="flex justify-between py-2 border-b border-gray-200 text-sm">
            <span className="text-gray-500">TVA ({safeToFixed(tva, 0)}%)</span>
            <span className="font-medium">{safeToFixed(tvaAmount)} DH</span>
          </div>
          
          <div className="flex justify-between py-2 border-b border-gray-200 text-sm">
            <span className="text-gray-500">Moyen de paiement</span>
            <span className="font-medium">
              {getPaymentMethodLabel(order.payment_method)}
            </span>
          </div>
          
          {paidAmount > 0 && paidAmount < totalAmount && (
            <div className="flex justify-between py-2 border-b border-gray-200 text-sm">
              <span className="text-gray-500">Montant payé</span>
              <span className="font-medium">{safeToFixed(paidAmount)} DH</span>
            </div>
          )}
          
          {remainingAmount > 0 && paidAmount > 0 && (
            <div className="flex justify-between py-2 border-b border-gray-200 text-sm">
              <span className="text-gray-500">Montant restant</span>
              <span className="font-medium">{safeToFixed(remainingAmount)} DH</span>
            </div>
          )}
          
          <div className="flex justify-between pt-3 font-semibold">
            <span className="text-gray-800">Total TTC</span>
            <span className="text-[#197874]">{safeToFixed(totalAmount)} DH</span>
          </div>
        </div>
      </div>

      {/* Customer Information */}
      <div className="bg-gray-50 rounded-xl p-5 border">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
          <User size={18} className="mr-2 text-[#197874]" />
          Informations de contact
        </h3>
        
        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b border-gray-200 text-sm">
            <span className="text-gray-500">Nom</span>
            <span className="font-medium">{fullName}</span>
          </div>
          
          <div className="flex justify-between py-2 border-b border-gray-200 text-sm">
            <span className="text-gray-500">Email</span>
            <span className="font-medium">{email}</span>
          </div>
          
          <div className="flex justify-between py-2 border-b border-gray-200 text-sm">
            <span className="text-gray-500">Téléphone</span>
            <span className="font-medium">{phone}</span>
          </div>
          
          {!isDigital && (
            <>
              <div className="flex justify-between py-2 border-b border-gray-200 text-sm">
                <span className="text-gray-500">Adresse</span>
                <span className="font-medium">{address}</span>
              </div>
              
              <div className="flex justify-between py-2 text-sm">
                <span className="text-gray-500">Ville</span>
                <span className="font-medium">{city}</span>
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Order Notes */}
      {(order.comments || order.notes) && (
        <div className="bg-gray-50 rounded-xl p-5 border">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
            <MapPin size={18} className="mr-2 text-[#197874]" />
            Notes de commande
          </h3>
          <p className="text-sm text-gray-700 py-2">
            {order.comments || order.notes}
          </p>
        </div>
      )}
      
      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
        <Button
          onClick={onNewOrder}
          className="bg-[#197874] hover:bg-[#d15550] text-white font-semibold py-5 px-6 rounded-xl"
        >
          Nouvelle commande
        </Button>
        
        <Button
          onClick={handleDownloadPDF}
          className="flex items-center gap-2 bg-white border border-[#197874] text-[#197874] hover:bg-gray-50 font-semibold py-5 px-6 rounded-xl"
        >
          <FileText size={18} />
          Télécharger PDF
        </Button>
      </div>
    </div>
  );
}; 