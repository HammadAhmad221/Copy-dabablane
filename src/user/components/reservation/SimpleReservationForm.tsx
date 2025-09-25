import { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import { Calendar, Clock, Users, Check, Info } from 'lucide-react';
import { FloatingInput } from '@/user/components/ui/FloatingInput';
import { FloatingTextarea } from '@/user/components/ui/FloatingTextarea';
import { PhoneInput } from '@/user/components/ui/PhoneInput';
import { Button } from '@/user/components/ui/button';
import DatePicker from 'react-datepicker';
import { registerLocale } from 'react-datepicker';
import { fr } from 'date-fns/locale/fr';
import "react-datepicker/dist/react-datepicker.css";
import { reservationService } from '@/user/lib/api/services/reservationService';
import PaymentLoading from '@/user/components/PaymentLoading';
import { paymentService } from '@/user/services/paymentService';
import CMI from '@/assets/images/logo_cmi.png';
import VISA from '@/assets/images/tn_verified_by_visa.png';
import MASTER from '@/assets/images/secure_code_logo.png';
import { validateInternationalPhone } from '@/user/lib/utils/phoneValidation';
// Register French locale
registerLocale('fr', fr);

interface Blane {
  id: number;
  slug: string;
  name: string;
  price_current: number;
  price_old?: number;
  start_date?: string;
  end_date?: string;
  expiration_date?: string;
  type_time?: 'time' | 'date';
  jours_creneaux?: string[];
  online?: boolean;
  partiel?: boolean;
  cash?: boolean;
  partiel_field?: number;
  tva?: number;
  personnes_prestation?: number;
  available_periods?: Period[];
}

interface Period {
  start: string;
  end: string;
  available: boolean;
  currentReservations: number;
  maxReservations: number;
  remainingCapacity: number;
  percentageFull: number;
  daysCount: number;
  period_name: string;
  isWeekend: boolean;
}

interface ReservationResponse {
  id: number;
  NUM_RES?: string;
  status: string;
  total_price: number;
  partiel_price?: number;
  payment_method: string;
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
    city?: string;
  };
  date: string;
  time?: string;
  number_persons: number;
  quantity: number;
}

interface FormData {
  participants: number;
  name: string;
  email: string;
  phone: string;
  reservationDate: Date | null;
  selectedTime: string;
  selectedPeriod: string;
  comments: string;
  quantity: number;
  paymentMethod: 'cash' | 'partial' | 'online' | '';
  countryCode: string;
  phoneFormatted: string;
  countryName: string;
}

interface TimeSlot {
  time: string;
  available: boolean;
  maxReservations: number;
  currentReservations: number;
  remainingCapacity: number;
}

interface ReservationPayload {
  blane_id: number;
  name: string;
  email: string;
  phone: string;
  number_persons: number;
  quantity: number;
  comments: string;
  payment_method: 'cash' | 'online' | 'partiel';
  total_price: number;
  partiel_price?: number;
  date: string;
  time?: string;
  end_date?: string;
}

interface SimpleReservationFormProps {
  blane: Blane;
  onReservationComplete: (reservation: ReservationResponse) => void;
}

export const SimpleReservationForm = ({ blane, onReservationComplete }: SimpleReservationFormProps) => {
  // Get initial participants per reservation
  const participantsPerReservation = blane.personnes_prestation || 1;

  // Form state
  const [formData, setFormData] = useState<FormData>({
    participants: participantsPerReservation,
    name: '',
    email: '',
    phone: '',
    reservationDate: null,
    selectedTime: '',
    selectedPeriod: '',
    comments: '',
    quantity: 1,
    paymentMethod: '',
    countryCode: '',
    phoneFormatted: '',
    countryName: '',
  });

  // UI state
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  const [showPaymentLoading, setShowPaymentLoading] = useState<boolean>(false);
  const [maxAvailableQuantity, setMaxAvailableQuantity] = useState<number>(1);
  const [phoneError, setPhoneError] = useState<string>('');

  // Load time slots when date changes
  const loadTimeSlots = async (date: Date) => {
    if (!date) return;
    
    setIsLoadingSlots(true);
    setErrorMessage(null);
    
    try {
      // Format date as YYYY-MM-DD for API - preserving local date
      const formattedDate = formatDateForAPI(date);
      
      // Fetch time slots from API
      const slots = await reservationService.getAvailableTimeSlots(blane.slug, formattedDate);
      
      // Add remainingCapacity to each slot
      const slotsWithRemaining = slots.map(slot => ({
        ...slot,
        remainingCapacity: slot.maxReservations - slot.currentReservations
      }));
      
      setTimeSlots(slotsWithRemaining);
    } catch (error: unknown) {
      console.error('Error loading time slots:', error);
      setErrorMessage("Erreur lors du chargement des créneaux disponibles.");
    } finally {
      setIsLoadingSlots(false);
    }
  };

  // Helper to format date for API without timezone issues
  const formatDateForAPI = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper to format the date for display
  const formatDate = (date: Date | null): string => {
    if (!date) return '';
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Check if the date is valid
  const isDateAvailable = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // If there's no start_date, use today as the minimum date
    if (!blane.start_date) {
      if (date < today) return false;
    } else {
      // If there is a start_date, use it as the minimum date
      const startDateObj = new Date(blane.start_date);
      startDateObj.setHours(0, 0, 0, 0);
      if (date < startDateObj) return false;
    }
    
    // Check if date is within allowed range for end date
    const endDateObj = blane.expiration_date 
      ? new Date(blane.expiration_date) 
      : blane.end_date 
        ? new Date(blane.end_date) 
        : new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000); // Default: 90 days from today
    
    if (date > endDateObj) return false;
    
    // Check available days
    if (blane.jours_creneaux && blane.jours_creneaux.length > 0) {
      const dayOfWeek = date.toLocaleDateString('fr-FR', { weekday: 'long' }).toLowerCase();
      const availableDays = blane.jours_creneaux.map((day: string) => day.toLowerCase());
      return availableDays.includes(dayOfWeek);
    }
    
    return true;
  };

  // Check if a period is valid
  const isPeriodValid = (period: Period): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const startDate = new Date(period.start);
    const endDate = new Date(period.end);
    
    // Don't allow periods in the past
    if (endDate < today) return false;
    
    // Check if period is within allowed range
    const startDateObj = new Date(blane.start_date || today);
    const endDateObj = blane.expiration_date 
      ? new Date(blane.expiration_date) 
      : blane.end_date 
        ? new Date(blane.end_date) 
        : new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000); // Default: 90 days from today
    
    if (startDate < startDateObj || endDate > endDateObj) return false;
    
    // Check available days if specified
    if (blane.jours_creneaux && blane.jours_creneaux.length > 0) {
      // Check if any day in the period falls on an available day
      const availableDays = blane.jours_creneaux.map((day: string) => day.toLowerCase());
      const periodDays = [];
      const currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        const dayOfWeek = currentDate.toLocaleDateString('fr-FR', { weekday: 'long' }).toLowerCase();
        periodDays.push(dayOfWeek);
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      return periodDays.some(day => availableDays.includes(day));
    }
    
    return true;
  };

  // Form validation
  const isFormValid = (() => {
    // Phone validation
    const phoneValidation = validateInternationalPhone(formData.countryCode, formData.phone);
    
    // Base validation for all fields
    const baseValidation = !!(
      formData.name && 
      formData.email && 
      formData.phone &&
      phoneValidation.isValid &&
      formData.paymentMethod
    );

    // Additional validation based on blane type
    if (blane.type_time === 'time') {
      return baseValidation && 
             !!formData.reservationDate && 
             !!formData.selectedTime;
    } else if (blane.type_time === 'date') {
      return baseValidation && !!formData.selectedPeriod;
    }

    return baseValidation;
  })();

  // Price calculations
  const calculateBasePrice = () => {
    const totalPrice = blane.price_current * formData.quantity;
    const tvaRate = blane.tva !== undefined ? blane.tva / 100 : 0.20; // 20% default TVA
    return totalPrice / (1 + tvaRate); // Calculate base price by removing TVA
  };

  const calculateTvaAmount = () => {
    const basePrice = calculateBasePrice();
    const tvaRate = blane.tva !== undefined ? blane.tva / 100 : 0.20;
    return basePrice * tvaRate;
  };

  const calculateTotalPrice = () => {
    return blane.price_current * formData.quantity;
  };
  
  // Calculate partial payment amount
  const calculatePartialAmount = () => {
    const percentage = blane.partiel_field || 33;
    const totalPrice = calculateTotalPrice();
    return parseFloat((totalPrice * (percentage / 100)).toFixed(2));
  };

  // Event handlers
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date: Date | null) => {
    setFormData(prev => ({ ...prev, reservationDate: date, selectedTime: '' }));
    if (date) {
      loadTimeSlots(date);
    }
  };

  const handlePeriodChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const selectedPeriodValue = e.target.value;
    setFormData(prev => ({ ...prev, selectedPeriod: selectedPeriodValue }));
  };

  // Update the useEffect to set maxAvailableQuantity when a time slot is selected
  useEffect(() => {
    if (formData.selectedTime && timeSlots.length > 0) {
      const selectedSlot = timeSlots.find(slot => slot.time === formData.selectedTime);
      if (selectedSlot) {
        // Set maxAvailableQuantity with a fallback of 1
        setMaxAvailableQuantity(selectedSlot.remainingCapacity ?? 1);
        
        // If current quantity exceeds max available, reduce it
        if (formData.quantity > (selectedSlot.remainingCapacity ?? 1)) {
          setFormData(prev => ({
            ...prev,
            quantity: selectedSlot.remainingCapacity ?? 1
          }));
        }
      }
    }
  }, [formData.selectedTime, timeSlots]);

  // Add a new useEffect to update maxAvailableQuantity when a period is selected
  useEffect(() => {
    if (blane.type_time === 'date' && formData.selectedPeriod && blane.available_periods) {
      const selectedPeriod = blane.available_periods.find(
        period => `${period.start}-${period.end}` === formData.selectedPeriod
      );
      
      if (selectedPeriod) {
        // Set maxAvailableQuantity with a fallback of 1
        setMaxAvailableQuantity(selectedPeriod.remainingCapacity);
        
        // If current quantity exceeds max available, reduce it
        if (formData.quantity > selectedPeriod.remainingCapacity) {
          setFormData(prev => ({
            ...prev,
            quantity: selectedPeriod.remainingCapacity
          }));
        }
      }
    }
  }, [formData.selectedPeriod, blane.available_periods, blane.type_time]);

  const handleQuantityChange = (amount: number) => {
    setFormData(prev => ({
      ...prev,
      quantity: Math.max(1, Math.min(maxAvailableQuantity, prev.quantity + amount))
    }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    // Reset error state
    setErrorMessage(null);

    // Validate phone number
    const phoneValidation = validateInternationalPhone(formData.countryCode, formData.phone);
    if (!phoneValidation.isValid) {
      setErrorMessage(phoneValidation.errorMessage || "Numéro de téléphone invalide");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setErrorMessage("Format d'email invalide");
      return;
    }

    // Validate name (at least 3 characters)
    if (formData.name.trim().length < 3) {
      setErrorMessage("Le nom doit contenir au moins 3 caractères");
      return;
    }

    // Validate date and time for time-based reservations
    if (blane.type_time === 'time') {
      if (!formData.reservationDate) {
        setErrorMessage("Veuillez sélectionner une date");
        return;
      }
      if (!formData.selectedTime) {
        setErrorMessage("Veuillez sélectionner une heure");
        return;
      }
    }

    // Validate period for date-based reservations
    if (blane.type_time === 'date' && !formData.selectedPeriod) {
      setErrorMessage("Veuillez sélectionner une période");
      return;
    }

    // Validate payment method
    if (!formData.paymentMethod) {
      setErrorMessage("Veuillez sélectionner un mode de paiement");
      return;
    }

    // If all validations pass, show confirmation
    if (isFormValid) {
      setShowConfirmation(true);
    }
  };

  const handleConfirmSubmit = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    
    try {
      // Format the phone number for submission
      const formattedPhone = formData.countryCode + formData.phone;

      // Prepare reservation data
      const reservationPayload: ReservationPayload = {
        blane_id: blane.id,
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formattedPhone,
        number_persons: formData.participants * formData.quantity,
        quantity: formData.quantity || 1,
        comments: formData.comments ? formData.comments.trim() : "",
        payment_method: formData.paymentMethod === 'partial' ? 'partiel' : formData.paymentMethod as 'cash' | 'online',
        total_price: calculateTotalPrice(),
        partiel_price: formData.paymentMethod === 'partial' ? calculatePartialAmount() : undefined,
        date: new Date().toISOString().split('T')[0] // Default to today if no date provided
      };

      // Add date/time based on reservation type
      if (blane.type_time === 'time' && formData.selectedTime) {
        if (formData.reservationDate) {
          reservationPayload.date = formatDateForAPI(formData.reservationDate);
        } else {
          throw new Error("Date de réservation manquante");
        }
        reservationPayload.time = formData.selectedTime;
      } 
      else if (blane.type_time === 'date' && formData.selectedPeriod && blane.available_periods) {
        const selectedPeriod = blane.available_periods.find(
          period => `${period.start}-${period.end}` === formData.selectedPeriod
        );
        
        if (selectedPeriod) {
          reservationPayload.date = selectedPeriod.start;
          reservationPayload.end_date = selectedPeriod.end;
        } else {
          throw new Error("Période sélectionnée invalide");
        }
      }

      // Create reservation
      try {
        const response = await reservationService.createReservation(reservationPayload);
        const reservationData = response.data || response;
        
        // Close confirmation modal
        setShowConfirmation(false);
        
        // Handle online payment
        if (formData.paymentMethod === 'online' || formData.paymentMethod === 'partial') {
          setShowPaymentLoading(true);
          
          try {
            // Save pending reservation data to localStorage
            const reservationId = reservationData.NUM_RES || reservationData.id?.toString();
            if (!reservationId) {
              throw new Error('No reservation ID received');
            }

            localStorage.setItem(`blane_${blane.slug}_reservation_id`, reservationId);
            localStorage.setItem(`blane_${blane.slug}_reservation_data`, JSON.stringify(reservationData));
            
            const paymentIntent = {
              type: 'reservation',
              id: reservationId,
              method: formData.paymentMethod,
              amount: formData.paymentMethod === 'partial' ? calculatePartialAmount() : calculateTotalPrice(),
              timestamp: new Date().toISOString(),
              status: reservationData.status || 'pending'
            };
            localStorage.setItem(`blane_${blane.slug}_payment_intent`, JSON.stringify(paymentIntent));

            // Get payment URL
            const paymentType = formData.paymentMethod === 'partial' ? 'partial' : 'full';
            const paymentData = await paymentService.initiatePayment(
              'reservation',
              reservationId,
              paymentType as 'full' | 'partial'
            );
            
            if (paymentData && paymentData.redirect_url) {
              paymentService.submitPaymentForm(
                paymentData.redirect_url,
                paymentData.payment_form_data
              );
              return;
            } else {
              throw new Error('No redirect URL received');
            }
          } catch (error: unknown) {
            console.error('Payment preparation error:', error);
            setErrorMessage('Erreur lors de la préparation du paiement');
            setShowPaymentLoading(false);
            onReservationComplete(reservationData);
          }
        } else {
          // For cash payments
          onReservationComplete(reservationData);
        }
      } catch (error: unknown) {
        handleApiError(error);
      }
    } catch (error: unknown) {
      console.error('Reservation submission error:', error);
      setErrorMessage('Une erreur inattendue est survenue. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to handle API errors
  const handleApiError = (error: unknown) => {
    if (error && typeof error === 'object' && 'response' in error) {
      const apiError = error as { 
        response?: { 
          status?: number; 
          data?: { 
            error?: unknown; 
            message?: string;
          } 
        } 
      };

      if (apiError.response?.status === 400) {
        const errorData = apiError.response.data;
        if (errorData?.error) {
          if (typeof errorData.error === 'object') {
            const errorMessages = Object.values(errorData.error)
              .flat()
              .join('\n');
            setErrorMessage(errorMessages);
          } else {
            setErrorMessage(String(errorData.error));
          }
        } else if (errorData?.message) {
          setErrorMessage(errorData.message);
        } else {
          setErrorMessage('Erreur de validation des données de réservation.');
        }
      } else if (apiError.response?.status === 422) {
        if (apiError.response.data?.error) {
          setErrorMessage(String(apiError.response.data.error));
        } else {
          setErrorMessage('Ce créneau a atteint son nombre maximal de réservations.');
        }
      } else {
        setErrorMessage('Erreur lors de la création de votre réservation. Veuillez réessayer.');
      }
    } else {
      setErrorMessage('Une erreur inattendue est survenue. Veuillez réessayer.');
    }
    setIsSubmitting(false);
  };

  // DatePicker styles
  const datePickerStyles = `
    .react-datepicker-wrapper { 
      width: 100%; 
    }
    .react-datepicker {
      font-family: inherit;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      background-color: white;
    }
    .react-datepicker__header {
      background-color: #197874;
      border-bottom: none;
      padding: 1rem 0.5rem;
      border-top-left-radius: 0.75rem;
      border-top-right-radius: 0.75rem;
    }
    .react-datepicker__current-month {
      color: white;
      font-weight: 600;
      font-size: 1rem;
      margin-bottom: 0.5rem;
    }
    .react-datepicker__day-name {
      color: rgba(255, 255, 255, 0.9);
      font-weight: 500;
      width: 2rem;
      margin: 0.2rem;
    }
    .react-datepicker__day {
      width: 2rem;
      height: 2rem;
      line-height: 2rem;
      margin: 0.2rem;
      border-radius: 9999px;
      transition: all 0.2s;
    }
    .react-datepicker__day:hover:not(.react-datepicker__day--disabled) {
      background-color: #e6f7f7;
      color: #197874;
    }
    .react-datepicker__day--selected {
      background-color: #197874 !important;
      color: white !important;
      font-weight: 600;
    }
    .react-datepicker__day--keyboard-selected {
      background-color: rgba(25, 120, 116, 0.1);
      color: #197874;
    }
    .react-datepicker__day--disabled {
      color: #cbd5e0;
      cursor: not-allowed;
    }
    .react-datepicker__navigation {
      top: 1rem;
    }
    .react-datepicker__navigation-icon::before {
      border-color: white;
      border-width: 2px 2px 0 0;
      height: 8px;
      width: 8px;
    }
    .react-datepicker__navigation:hover *::before {
      border-color: rgba(255, 255, 255, 0.7);
    }
    .react-datepicker__day--today {
      font-weight: bold;
      color: #197874;
    }
    .react-datepicker__triangle {
      display: none;
    }
  `;
  
  // Show payment loading state if necessary
  if (showPaymentLoading) {
    return <PaymentLoading />;
  }

  // Render form
  return (
    <>
      <style>{datePickerStyles}</style>
      <form onSubmit={handleSubmit} className="space-y-6">
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">
            {errorMessage}
          </div>
        )}
        
        {/* Main Form Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column - Date Selection or Period Selection */}
          <div>
            {blane.type_time === 'date' ? (
              <>
                <label htmlFor="selectedPeriod" className="flex items-center gap-2 text-gray-700 text-lg font-semibold mb-3">
                  <Calendar size={20} className="text-[#197874]" /> Période de réservation
                </label>
                <select
                  id="selectedPeriod"
                  name="selectedPeriod"
                  value={formData.selectedPeriod}
                  onChange={handlePeriodChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#197874] focus:border-transparent text-center lg:text-left"
                  required
                >
                  <option value="">Sélectionnez une période</option>
                  {blane.available_periods?.map((period) => {
                    const isValid = isPeriodValid(period);
                    return (
                      <option 
                        key={`${period.start}-${period.end}`}
                        value={`${period.start}-${period.end}`}
                        disabled={!period.available || !isValid}
                      >
                        {period.period_name} {period.isWeekend ? '(Weekend)' : ''}
                        {!isValid ? ' (Période non disponible)' : ''}
                      </option>
                    );
                  })}
                </select>

                {formData.selectedPeriod && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg animate-fadeIn border">
                    {(() => {
                      const selectedPeriod = blane.available_periods?.find(
                        p => `${p.start}-${p.end}` === formData.selectedPeriod
                      );
                      if (selectedPeriod) {
                        return (
                          <>
                            <p className="text-sm font-semibold text-gray-700 mb-1">
                              Période sélectionnée: {selectedPeriod.period_name}
                            </p>
                          </>
                        );
                      }
                      return null;
                    })()}
                  </div>
                )}
              </>
            ) : (
              <>
            <label className="flex items-center gap-2 text-gray-700 text-md font-semibold mb-3">
              <Calendar size={16} className="text-[#197874]"/> Date de réservation
          </label>
            <div className="w-full">
          <DatePicker
            selected={formData.reservationDate}
            onChange={handleDateChange}
            locale="fr"
            dateFormat="dd/MM/yyyy"
            minDate={new Date()}
            filterDate={isDateAvailable}
            placeholderText="Sélectionnez une date"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#197874] focus:border-transparent text-center lg:text-left"
            calendarStartDay={1}
                formatWeekDay={(day: string) => day.substr(0, 2)}
          />
            </div>
          {formData.reservationDate && (
              <p className="mt-3 text-green-600 text-sm font-medium text-center sm:text-left">
              Date sélectionnée: {formatDate(formData.reservationDate)}
            </p>
          )}
            {blane.jours_creneaux && blane.jours_creneaux.length > 0 && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-100 shadow-sm">
                <h4 className="text-sm font-semibold text-gray-700 mb-1">Jours disponibles :</h4>
                <div className="flex flex-wrap gap-1 text-xs">
                  {blane.jours_creneaux.map((day, index) => (
                    <span 
                      key={index} 
                      className="bg-white px-2 py-1 rounded border border-gray-200 font-medium"
                    >
                      {day}
                    </span>
                  ))}
                </div>
              </div>
                )}
              </>
            )}
        </div>
        
          {/* Right Column - Time Selection (only for time type) */}
          <div>
            {blane.type_time === 'date' ? (
              // For date type, show period details
              <div>
                <label className="flex items-center gap-2 text-gray-700 text-lg font-semibold mb-3">
                  <Users size={20} className="text-[#197874]" /> Détails de la période
                </label>
                {formData.selectedPeriod ? (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    {(() => {
                      const selectedPeriod = blane.available_periods?.find(
                        p => `${p.start}-${p.end}` === formData.selectedPeriod
                      );
                      if (selectedPeriod) {
                        return (
                          <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Début:</span>
                              <span className="font-medium">{new Date(selectedPeriod.start).toLocaleDateString('fr-FR')}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Fin:</span>
                              <span className="font-medium">{new Date(selectedPeriod.end).toLocaleDateString('fr-FR')}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Durée:</span>
                              <span className="font-medium">{selectedPeriod.daysCount} jour{selectedPeriod.daysCount > 1 ? 's' : ''}</span>
                            </div>
                            {/* {selectedPeriod.isWeekend && (
                              <div className="bg-amber-50 p-2 rounded text-amber-700 text-xs font-medium">
                                Période de weekend - Tarif spécial peut s'appliquer
                              </div>
                            )} */}
                          </div>
                        );
                      }
                      return (
                        <div className="text-gray-500 text-sm">
                          Veuillez sélectionner une période pour voir les détails.
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="py-3 px-4 bg-gray-100 text-gray-500 rounded-lg">
                    <p className="text-sm">Veuillez d'abord sélectionner une période.</p>
                  </div>
                )}
              </div>
            ) : (
              // For time type, show time selection
              <>
            <label htmlFor="selectedTime" className="flex items-center gap-2 text-gray-700 text-md font-semibold mb-3">
              <Clock size={16} className="text-[#197874]" /> Heure de réservation
            </label>
            
            {isLoadingSlots ? (
              <div className="flex justify-center py-6 animate-pulse text-[#197874]">
                Chargement des créneaux disponibles...
              </div>
            ) : timeSlots.length > 0 ? (
              <>
              <select
                  id="selectedTime"
                name="selectedTime"
                value={formData.selectedTime}
                onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#197874] focus:border-transparent text-center sm:text-left"
                required
              >
                <option value="">Sélectionnez une heure</option>
                  {timeSlots.map((slot) => (
                  <option 
                    key={slot.time} 
                    value={slot.time}
                    disabled={!slot.available}
                  >
                    {slot.time}
                  </option>
                ))}
              </select>

                {formData.selectedTime && (
                  <div className="mt-3 p-2 bg-gray-50 rounded-lg animate-fadeIn border">
                    <p className="text-sm font-semibold text-gray-700 mb-1">
                      Heure sélectionnée: {formData.selectedTime}
                    </p>
                  </div>
                )}
                
                <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">
                    <span className="font-medium">Légende:</span> Chaque créneau affiche le nombre de réservations disponibles. 
                    Les créneaux complets sont désactivés.
                  </p>
                </div>
              </>
            ) : formData.reservationDate ? (
              <div className="py-3 px-4 bg-amber-50 text-amber-700 rounded-lg border border-amber-200">
                <p className="text-sm">Aucun créneau disponible pour cette date. Veuillez sélectionner une autre date.</p>
              </div>
            ) : (
              <div className="py-3 px-4 bg-gray-100 text-gray-500 rounded-lg">
                <p className="text-sm">Veuillez d'abord sélectionner une date.</p>
          </div>
                )}
              </>
        )}
          </div>
        </div>

        {/* Quantity Section */}
        <div className="transition-all space-y-4 mt-6">
          <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-lg border border-blue-200 mb-4 flex items-center gap-2">
            <Info size={16} className="flex-shrink-0" />
            {blane.type_time === 'date' 
              ? "Choisissez la période de réservation avant de mettre à jour la quantité"
              : "Choisissez l'heure/jour de réservation avant de mettre à jour la quantité"
            }
          </div>
          <label htmlFor="quantity" className="flex items-center gap-2 text-gray-700 text-md font-semibold mb-2">
            <Users size={16} className="text-[#197874]" /> Quantité
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
              Maximum disponible : <span className="font-semibold">{maxAvailableQuantity}</span> réservation{maxAvailableQuantity > 1 ? 's' : ''}
            </p>
            <p className="text-md text-gray-700 font-semibold">
              Nombre de personnes : <span className="text-[#197874]">{formData.participants * formData.quantity}</span>
            </p>
            <div className="text-xs text-gray-400 italic">
              {formData.participants} personne(s) fixe par prestation × {formData.quantity} réservation(s)
            </div>
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
                phoneFormatted: result.formattedNumber || '',
                countryName: result.countryName || ''
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
                className={`border rounded-lg p-3 cursor-pointer ${
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
                className={`border rounded-lg p-3 cursor-pointer ${
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
                className={`border rounded-lg p-3 cursor-pointer ${
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
                    <p className="text-sm text-gray-500">Payez maintenant</p>
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
          className={`w-full ${
            isFormValid && !isSubmitting
              ? 'bg-[#197874] hover:bg-[#d15550]' 
              : 'bg-gray-300 cursor-not-allowed'
          } text-white font-bold py-6 px-6 rounded-lg`}
        >
          {isSubmitting ? 'Traitement...' : 'Réserver maintenant'}
        </Button>
      </form>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">
                Confirmation de réservation
              </h3>
            </div>
            
            <div className="p-5 space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg border">
                <h4 className="font-medium text-gray-800 mb-3">Récapitulatif</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Service</span>
                    <span className="font-medium">{blane.name}</span>
                  </div>

                  {blane.type_time === 'date' ? (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Période</span>
                      <span className="font-medium">
                        {(() => {
                          const selectedPeriod = blane.available_periods?.find(
                            p => `${p.start}-${p.end}` === formData.selectedPeriod
                          );
                          return selectedPeriod ? selectedPeriod.period_name : '';
                        })()}
                      </span>
                    </div>
                  ) : (
                    <>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Date</span>
                    <span className="font-medium">
                      {formatDate(formData.reservationDate)}
                    </span>
                  </div>
                  
                  {formData.selectedTime && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Heure</span>
                      <span className="font-medium">{formData.selectedTime}</span>
                    </div>
                      )}
                    </>
                  )}
                  
                  <div className="flex justify-between">
                    <span className="text-gray-500">Nombre de personnes</span>
                    <span className="font-medium">
                      {formData.participants * formData.quantity}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-500">Quantité</span>
                    <span className="font-medium">{formData.quantity}</span>
                  </div>

                  {/* <div className="flex justify-between">
                    <span className="text-gray-500">Prix unitaire</span>
                    <span className="font-medium">{blane.price_current} DH</span>
                  </div> */}
                  
                  <div className="flex justify-between">
                    <span className="text-gray-500">Prix de base</span>
                    <span className="font-medium">
                      {calculateBasePrice().toFixed(2)} DH
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-500">TVA ({blane.tva || 20}%)</span>
                    <span className="font-medium">
                      {calculateTvaAmount().toFixed(2)} DH
                    </span>
                  </div>
                  
                  <div className="flex justify-between font-semibold">
                    <span className="text-gray-800">Total TTC</span>
                    <span className="text-[#197874]">
                      {calculateTotalPrice().toFixed(2)} DH
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-500">Méthode de paiement</span>
                    <span className="font-medium">
                      {formData.paymentMethod === 'cash' ? 'Cash' :
                       formData.paymentMethod === 'partial' ? 'Paiement partiel' :
                       formData.paymentMethod === 'online' ? 'Paiement en ligne' : ''}
                    </span>
                  </div>
                  
                  {formData.paymentMethod === 'partial' && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Paiement partiel ({blane.partiel_field || 33}%)</span>
                      <span className="font-medium">
                        {calculatePartialAmount().toFixed(2)} DH
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg border">
                <h4 className="font-medium text-gray-800 mb-3">Contact</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Nom</span>
                    <span className="font-medium">{formData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Email</span>
                    <span className="font-medium">{formData.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Téléphone</span>
                    <span className="font-medium">{formData.phone}</span>
                  </div>
                  {formData.comments && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Commentaires</span>
                      <span className="font-medium">{formData.comments}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="p-5 border-t border-gray-200 flex justify-end gap-3">
              <button 
                onClick={() => setShowConfirmation(false)}
                className="px-4 py-2 border border-gray-300 font-medium rounded-lg"
              >
                Annuler
              </button>
              
              <button 
                onClick={handleConfirmSubmit}
                disabled={isSubmitting}
                className="px-4 py-2 bg-[#197874] text-white font-medium rounded-lg"
              >
                {isSubmitting ? (
                  <>
                    <span className="inline-block animate-spin mr-2">⟳</span>
                    Traitement...
                  </>
                ) : (
                  'Confirmer'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}; 