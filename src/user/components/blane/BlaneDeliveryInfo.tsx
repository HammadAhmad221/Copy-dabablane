import { Blane } from '@/user/lib/types/blane';
import { Truck, Download, Package } from 'lucide-react';

interface BlaneDeliveryInfoProps {
  blane: Blane;
}

export const BlaneDeliveryInfo = ({ blane }: BlaneDeliveryInfoProps) => {
  // For digital products, we show a different message
  if (blane.is_digital === true) {
    return (
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-start mb-2">
          <Download className="h-5 w-5 text-blue-700 mr-2 mt-1" />
          <h3 className="text-lg font-semibold text-blue-700">Produit numérique</h3>
        </div>
        <p className="text-blue-600">Téléchargement disponible immédiatement après l'achat.</p>
      </div>
    );
  }
  
  // For physical products with delivery
  if (blane.livraison_in_city === 1 && blane.city) {
    return (
      <div className="mt-6 p-4 bg-green-50 rounded-lg">
        <div className="flex items-start mb-2">
          <Truck className="h-5 w-5 text-green-700 mr-2 mt-1" />
          <h3 className="text-lg font-semibold text-green-700">Livraison disponible</h3>
        </div>
        <p className="text-green-600">Ce produit peut être livré à {blane.city}.</p>
      </div>
    );
  }
  
  // For physical products without delivery
  if (blane.type === 'ecommerce' && !blane.is_digital && blane.livraison_in_city !== 1) {
    return (
      <div className="mt-6 p-4 bg-amber-50 rounded-lg">
        <div className="flex items-start mb-2">
          <Package className="h-5 w-5 text-amber-700 mr-2 mt-1" />
          <h3 className="text-lg font-semibold text-amber-700">Produit physique</h3>
        </div>
        <p className="text-amber-600">Récupération sur place uniquement.</p>
      </div>
    );
  }
  
  return null;
}; 