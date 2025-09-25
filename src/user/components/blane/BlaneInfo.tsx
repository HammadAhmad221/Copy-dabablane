import { Star, MapPin, Calendar, Clock, Package, Download, CheckCircle, AlertCircle, Store, Phone } from 'lucide-react';
import { Blane } from '@/user/lib/types/blane';
import { Badge } from '@/user/components/ui/badge';

interface BlaneInfoProps {
  blane: Blane;
  formatDate: (dateString: string) => string;
  isExpired: () => boolean;
  getRemainingDays: () => number;
}

export const BlaneInfo = ({
  blane,
  formatDate,
  isExpired,
  getRemainingDays
}: BlaneInfoProps) => {
  // Determine if this is a digital product
  const isDigitalProduct = blane.is_digital === true;
  
  // Determine if this is a reservation with time slots
  const isTimeBasedReservation = blane.type === 'reservation' && blane.type_time === 'time';
  
  // Determine if this is a date-based reservation (default for reservations)
  const isDateBasedReservation = blane.type === 'reservation' && (!blane.type_time || blane.type_time === 'date');
  
  return (
    <div className="space-y-5">
      {/* Rating */}
      <div className="flex items-center">
        <div className="flex">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              size={16}
              className={`${
                parseFloat(blane.rating) >= star
                  ? 'text-yellow-400 fill-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          ))}
        </div>
        <span className="ml-2 text-sm text-gray-600">({Number(blane.rating).toFixed(1)})</span>
      </div>

      {/* Product Badges */}
      <div className="flex flex-wrap gap-2">
        {isDigitalProduct && (
          <Badge variant="outline" className="flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-200">
            <Download size={10} />
            Produit numérique
          </Badge>
        )}
        
        {blane.type === 'ecommerce' && (
          <Badge variant="outline" className="flex items-center gap-1 bg-purple-50 text-purple-700 border-purple-200">
            <Package size={10} />
            E-commerce
          </Badge>
        )}
        
        {isTimeBasedReservation && (
          <Badge variant="outline" className="flex items-center gap-1 bg-amber-50 text-amber-700 border-amber-200">
            <Clock size={10} />
            Réservation horaire
          </Badge>
        )}
        
        {isDateBasedReservation && (
          <Badge variant="outline" className="flex items-center gap-1 bg-green-50 text-green-700 border-green-200">
            <Calendar size={10} />
            Réservation journalière
          </Badge>
        )}
      </div>

      {/* Location and Dates */}
      <div className="space-y-3">
        {blane.city && (
          <div className="flex items-center text-gray-600">
            <MapPin size={18} className="mr-2 text-[#E66C61]" />
            {blane.city}
          </div>
        )}
        
        {blane.commerce_name && (
          <div className="flex items-center text-gray-600">
            <Store size={18} className="mr-2 text-[#E66C61]" />
            {blane.commerce_name}
          </div>
        )}
        
        {blane.commerce_phone && (
          <div className="flex items-center text-gray-600">
            <Phone size={18} className="mr-2 text-[#E66C61]" />
            {blane.commerce_phone}
          </div>
        )}
        
        {/* Show different information based on product type */}
        {(isDateBasedReservation || blane.type === 'ecommerce') && blane.start_date && blane.expiration_date && (
          <div className="flex items-center text-gray-600">
            <Calendar size={12} className="mr-2 text-[#E66C61]" />
            <span>
              {formatDate(blane.start_date)} - {formatDate(blane.expiration_date)}
            </span>
          </div>
        )}
        
        {/* For time-based reservations, show available time slots if present */}
        {isTimeBasedReservation && blane.available_time_slots && blane.available_time_slots.length > 0 && (
          <div className="flex items-start text-gray-600">
            <Clock size={18} className="mr-2 mt-1 text-[#E66C61]" />
            <div>
              <div className="font-medium mb-1">Créneaux disponibles:</div>
              <div className="grid grid-cols-2 gap-2">
                {blane.available_time_slots.map((slot, index) => (
                  <div key={index} className="text-sm bg-gray-100 rounded-lg px-2 py-1">
                    {slot}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Availability info for digital products */}
        {isDigitalProduct && (
          <div className="flex items-center text-gray-600">
            <Download size={18} className="mr-2 text-[#E66C61]" />
            <span>Disponible immédiatement après l'achat</span>
          </div>
        )}
        
        {/* Status badge - different for digital products */}
        {isDigitalProduct ? (
          <div className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-lg text-xs font-medium">
            Téléchargement instantané
          </div>
        ) : isExpired() ? (
          <div className="inline-block bg-red-100 text-red-700 px-3 py-1 rounded-lg text-xs font-medium">
            Expiré
          </div>
        ) : (
          <div className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-lg text-xs font-medium">
            Actif - {getRemainingDays()} jours restants
          </div>
        )}
      </div>

      {/* Description */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Description</h3>
        <p className="text-gray-700 whitespace-pre-line">{blane.description}</p>
      </div>
      
      {/* Advantages */}
      {blane.advantages && (
        <div className="mt-6 bg-green-50 rounded-lg p-4">
          <h2 className="text-md font-semibold mb-3 flex items-center text-green-800">
            <CheckCircle size={18} className="mr-2 text-green-600" />
            Avantages
          </h2>
          <ul className="space-y-2 text-gray-700">
            {blane.advantages.split('\n')
              .filter(line => line.trim() !== '')
              .map((advantage, index) => (
                <li key={index} className="flex items-start">
                  <CheckCircle size={12} className="ml-4 mr-2 mt-1 text-green-600 flex-shrink-0" />
                  <span className="text-sm">{advantage.trim()}</span>
                </li>
              ))
            }
          </ul>
        </div>
      )}
      
      {/* Conditions */}
      {blane.conditions && (
        <div className="mt-4 bg-amber-50 rounded-lg p-4">
          <h2 className="text-md font-semibold mb-3 flex items-center text-amber-800">
            <AlertCircle size={18} className="mr-2 text-amber-600" />
            Conditions
          </h2>
          <ul className="space-y-2 text-gray-700">
            {blane.conditions.split('\n')
              .filter(line => line.trim() !== '')
              .map((condition, index) => (
                <li key={index} className="flex items-start">
                  <AlertCircle size={14} className="ml-4 mr-2 mt-1 text-amber-600 flex-shrink-0" />
                  <span className="text-sm">{condition.trim()}</span>
                </li>
              ))
            }
          </ul>
        </div>
      )}
    </div>
  );
}; 