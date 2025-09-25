import { Calendar, Clock, Users, Check, FileText, AlertTriangle } from 'lucide-react';
import { Button } from '@/user/components/ui/button';
import { ReservationType } from '@/user/types/reservation';
import { Blane } from '@/user/types/blane';
import { generateAndDownloadPDF } from '@/user/lib/utils/pdfGenerator';
import { toast } from 'react-hot-toast';
import { PaymentService } from '@/user/lib/api/services/paymentService';
import { Alert, AlertDescription, AlertTitle } from '@/user/components/ui/alert';

// Extended ReservationType interface to include additional properties needed
interface ExtendedReservationType extends ReservationType {
  date?: string;
  time?: string;
  total_price?: number;
  partiel_price?: number;
  payment_method?: string;
  number_persons?: number;
  end_date?: string;
  quantity?: number;
  customer?: Customer;
  city?: string;
}

interface Customer {
  name?: string;
  email?: string;
  phone?: string;
  city?: string;
}

export interface ReservationSummaryProps {
  reservation: ExtendedReservationType;
  blane: Blane;
  onNewReservation: () => void;
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

export const ReservationSummary = ({ 
  reservation, 
  blane, 
  onNewReservation 
}: ReservationSummaryProps) => {
  // Helper to get status display information
  const getStatusInfo = (status: string = 'pending') => {
    const normalizedStatus = status?.toLowerCase() || 'pending';
    const isCashPayment = reservation.payment_method?.toLowerCase() === 'cash';
    
    switch (normalizedStatus) {
      case 'paid':
      case 'confirmed':
        return {
          text: 'Confirmée',
          color: 'bg-green-100 text-green-800',
          icon: <Check className="h-5 w-5 text-green-600" />
        };
      case 'pending':
        return {
          text: isCashPayment ? 'Réservation bien reçue. Nous la traitons au plus vite' : 'En attente',
          color: 'bg-amber-100 text-amber-800',
          icon: <Clock className="h-5 w-5 text-amber-600" />
        };
      case 'canceled':
      case 'cancelled':
        return {
          text: 'Annulée',
          color: 'bg-red-100 text-red-800',
          icon: <Users className="h-5 w-5 text-red-600" />
        };
      default:
        return {
          text: 'En traitement',
          color: 'bg-blue-100 text-blue-800',
          icon: <Calendar className="h-5 w-5 text-blue-600" />
        };
    }
  };

  // Get status display
  const statusInfo = getStatusInfo(reservation.status);
  
  // Get formatted reference number
  const referenceNumber = reservation.NUM_RES || `#${reservation.id}`;
  
  // Get payment method display
  const getPaymentMethodLabel = (method?: string) => {
    const paymentMethod = method || 'pending';
    
    switch (paymentMethod?.toLowerCase()) {
      case 'cash':
        return 'Paiement Cash';
      case 'partial':
      case 'partiel':
        return 'Paiement partiel';
      case 'online':
        return 'Paiement en ligne';
      default:
        return 'Non spécifié';
    }
  };

  // Handle PDF download
  const handleDownloadPDF = async () => {
    try {
      // Prepare reservation data for PDF generation
      const formattedDate = reservation.date || '';
      
      // Prepare data for PDF
      const reservationData = {
        NUM_RES: reservation.NUM_RES || reservation.id?.toString(),
        total_price: reservation.total_price,
        partiel_price: reservation.partiel_price,
        payment_method: reservation.payment_method,
        number_persons: reservation.number_persons || 1,
        date: formattedDate,
        end_date: reservation.end_date,
        time: reservation.time,
        quantity: reservation.quantity || 1,
        customer: {
          name: reservation.customer?.name || reservation.full_name || '',
          email: reservation.customer?.email || reservation.email || '',
          phone: reservation.customer?.phone || reservation.phone || '',
          city: reservation.customer?.city || reservation.city || ''
        },
        blane: {
          name: blane.name,
          price_current: safeParseFloat(blane.price_current),
          tva: safeParseFloat(blane.tva) || 20,
          partiel_field: safeParseFloat(blane.partiel_field) || 33
        }
      };
      
      // Generate PDF reference number
      const pdfReferenceNumber = reservation.NUM_RES 
        ? `BLANE-${reservation.NUM_RES}` 
        : `BLANE-${reservation.id || new Date().getTime()}`;
      
      // Generate and download PDF
      await generateAndDownloadPDF(
        null,
        reservationData,
        pdfReferenceNumber,
        () => toast.success('PDF téléchargé avec succès'),
        (error) => {
          toast.error('Échec du téléchargement du PDF. Réessayez plus tard.');
        }
      );
    } catch (error) {
      toast.error('Échec de la préparation du PDF. Réessayez plus tard.');
    }
  };

  // Handle retry payment
  const handleRetryPayment = async () => {
    try {
      // Careful formatting of the reservation number to ensure it's sent correctly
      let paymentNumber;
      
      if (reservation.NUM_RES) {
        // If NUM_RES already has the correct format (RES-VZxxxxxx), use it directly
        if (reservation.NUM_RES.includes('-')) {
          paymentNumber = reservation.NUM_RES;
        } else if (/^RES[A-Z]{2}[0-9]+$/i.test(reservation.NUM_RES)) {
          // Format like RESVZ400681 to RES-VZ400681
          const code = reservation.NUM_RES.substring(3);
          paymentNumber = `RES-${code}`;
        } else {
          // Use as-is
          paymentNumber = reservation.NUM_RES;
        }
      } else {
        // Fallback to ID
        paymentNumber = `RES${reservation.id || new Date().getTime()}`;
      }
      
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
      toast.error('Échec du paiement. Veuillez réessayer plus tard.');
    }
  };

  // Check if payment needs to be completed
  const needsPayment = () => {
    const isPartialPayment = reservation.payment_method === 'partial' || reservation.payment_method === 'partiel';
    const isOnlinePayment = reservation.payment_method === 'online';
    const isNotPaid = reservation.status !== 'paid' && reservation.status !== 'confirmed';
    
    return (isOnlinePayment || isPartialPayment) && isNotPaid;
  };

  // Get payment alert message
  const getPaymentAlertMessage = () => {
    if (reservation.payment_method === 'partial' || reservation.payment_method === 'partiel') {
      return {
        title: 'Paiement partiel incomplet',
        description: `Votre paiement partiel de ${reservation.partiel_price} DH n'a pas été complété. Veuillez continuer le processus de paiement pour confirmer votre réservation.`
      };
    }
    return {
      title: 'Paiement incomplet',
      description: 'Votre paiement n\'a pas été complété. Veuillez continuer le processus de paiement pour confirmer votre réservation.'
    };
  };

  return (
    <div className="space-y-6">
      {/* Payment Status Banner */}
      {needsPayment() && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{getPaymentAlertMessage().title}</AlertTitle>
          <AlertDescription>
            {getPaymentAlertMessage().description}
          </AlertDescription>
          <Button 
            onClick={handleRetryPayment}
            className="mt-2"
            variant="destructive"
          >
            Continuer le paiement
          </Button>
        </Alert>
      )}
      
      {/* Header */}
      <div className="text-center">
        <div className={`inline-flex items-center justify-center p-3 rounded-full ${statusInfo.color} mb-3`}>
          {statusInfo.icon}
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">
          Réservation {referenceNumber}
        </h2>
        <p className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
          {statusInfo.text}
        </p>
      </div>
      
      {/* Reservation Details */}
      <div className="bg-gray-50 rounded-lg p-5 border">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
          <Calendar size={18} className="mr-2 text-[#197874]" />
          Détails de la réservation
        </h3>
        
        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b border-gray-200 text-sm">
            <span className="text-gray-500">Service</span>
            <span className="font-medium">{blane.name}</span>
          </div>
          
          {reservation.date && (
            <div className="flex justify-between py-2 border-b border-gray-200 text-sm">
              <span className="text-gray-500">Date</span>
              <span className="font-medium">
                {reservation.date}
                {reservation.end_date ? ` - ${reservation.end_date}` : ''}
              </span>
            </div>
          )}
          
          {reservation.time && (
            <div className="flex justify-between py-2 border-b border-gray-200 text-sm">
              <span className="text-gray-500">Heure</span>
              <span className="font-medium">{reservation.time}</span>
            </div>
          )}
          
          <div className="flex justify-between py-2 border-b border-gray-200 text-sm">
            <span className="text-gray-500">Nombre de personnes</span>
            <span className="font-medium">{reservation.number_persons || 1}</span>
          </div>
          
          <div className="flex justify-between py-2 border-b border-gray-200 text-sm">
            <span className="text-gray-500">Quantité</span>
            <span className="font-medium">{reservation.quantity || 1}</span>
          </div>

          <div className="flex justify-between py-2 border-b border-gray-200 text-sm">
            <span className="text-gray-500">Prix unitaire</span>
            <span className="font-medium">{blane.price_current} DH</span>
          </div>

          <div className="flex justify-between py-2 border-b border-gray-200 text-sm">
            <span className="text-gray-500">Prix de base</span>
            <span className="font-medium">
              {((reservation.total_price || 0) / (1 + (blane.tva || 20) / 100)).toFixed(2)} DH
            </span>
          </div>

          <div className="flex justify-between py-2 border-b border-gray-200 text-sm">
            <span className="text-gray-500">TVA ({blane.tva || 20}%)</span>
            <span className="font-medium">
              {((reservation.total_price || 0) - ((reservation.total_price || 0) / (1 + (blane.tva || 20) / 100))).toFixed(2)} DH
            </span>
          </div>
          
          <div className="flex justify-between py-2 border-b border-gray-200 text-sm">
            <span className="text-gray-500">Moyen de paiement</span>
            <span className="font-medium">
              {getPaymentMethodLabel(reservation.payment_method)}
            </span>
          </div>
          
          {reservation.partiel_price && reservation.partiel_price>0 && (
            <div className="flex justify-between py-2 border-b border-gray-200 text-sm">
              <span className="text-gray-500">Paiement partiel ({blane.partiel_field || 33}%)</span>
              <span className="font-medium">{reservation.partiel_price} DH</span>
            </div>
          )}
          
          <div className="flex justify-between pt-3 font-semibold">
            <span className="text-gray-800">Total TTC</span>
            <span className="text-[#197874]">{reservation.total_price || 0} DH</span>
          </div>
        </div>
      </div>
      
      {/* Contact Information */}
      {reservation.customer && (
        <div className="bg-gray-50 rounded-lg p-5 border">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
            <Users size={18} className="mr-2 text-[#197874]" />
            Informations de contact
          </h3>
          
          <div className="space-y-3">
            {reservation.customer.name && (
              <div className="flex justify-between py-2 border-b border-gray-200 text-sm">
                <span className="text-gray-500">Nom</span>
                <span className="font-medium">{reservation.customer.name}</span>
              </div>
            )}
            
            {reservation.customer.email && (
              <div className="flex justify-between py-2 border-b border-gray-200 text-sm">
                <span className="text-gray-500">Email</span>
                <span className="font-medium">{reservation.customer.email}</span>
              </div>
            )}
            
            {reservation.customer.phone && (
              <div className="flex justify-between py-2 border-b border-gray-200 text-sm">
                <span className="text-gray-500">Téléphone</span>
                <span className="font-medium">{reservation.customer.phone}</span>
              </div>
            )}
            
            {reservation.customer.city && (
              <div className="flex justify-between py-2 text-sm">
                <span className="text-gray-500">Ville</span>
                <span className="font-medium">{reservation.customer.city}</span>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
        <Button
          onClick={onNewReservation}
          className="bg-[#197874] hover:bg-[#d15550] text-white font-semibold py-5 px-6 rounded-lg"
        >
          Nouvelle réservation
        </Button>
        
        <Button
          onClick={handleDownloadPDF}
          className="flex items-center gap-2 bg-white border border-[#197874] text-[#197874] hover:bg-gray-50 font-semibold py-5 px-6 rounded-lg"
        >
          <FileText size={18} />
          Télécharger PDF
        </Button>
      </div>
    </div>
  );
}; 