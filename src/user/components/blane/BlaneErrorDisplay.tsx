import { ArrowLeft, RefreshCw, Server, Home, AlertCircle, Clock, Calendar, Download, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/user/components/ui/button';

interface BlaneErrorDisplayProps {
  error: Error | null;
  retryFetch: () => Promise<void>;
  slug?: string;
  type?: 'ecommerce' | 'reservation';
  typeTime?: 'time' | 'date';
  isDigital?: boolean;
}

export const BlaneErrorDisplay = ({ 
  error, 
  retryFetch, 
  slug,
  type,
  typeTime,
  isDigital 
}: BlaneErrorDisplayProps) => {
  const navigate = useNavigate();
  
  // Extract error message (handle nested errors)
  const errorMessage = error?.message || 'Unknown error';
  
  // Determine error type
  const isServerConnectionError = 
    errorMessage.includes('http://127.0.0.1:8000') || 
    errorMessage.includes('Network Error') ||
    errorMessage.includes('Failed to fetch') ||
    errorMessage.includes('No response received') ||
    errorMessage.includes('connection failed');
  
  const isNotFoundError = 
    errorMessage.includes('not found') || 
    errorMessage.includes('404');
  
  const isDataStructureError = 
    errorMessage.includes('Invalid response format') || 
    errorMessage.includes('No valid data structure') ||
    errorMessage.includes('No data returned');
  
  const isInventoryError = 
    errorMessage.includes('out of stock') || 
    errorMessage.includes('unavailable') ||
    errorMessage.includes('no stock');
  
  const isTimeSlotError =
    errorMessage.includes('time slot') ||
    errorMessage.includes('timeslot') ||
    errorMessage.includes('unavailable time');
  
  const isExpiredError =
    errorMessage.includes('expired') ||
    errorMessage.includes('no longer available');
    
  // Get type-specific error descriptions
  const getTypeSpecificMessage = () => {
    if (isDigital && type === 'ecommerce') {
      return {
        title: "Erreur avec le produit numérique",
        icon: <Download className="text-blue-600 mr-3 mt-1 flex-shrink-0" size={20} />,
        backgroundColor: "bg-blue-50",
        borderColor: "border-blue-200",
        titleColor: "text-blue-700",
        textColor: "text-blue-800",
        message: "Un problème est survenu avec ce produit numérique. Il est possible que les fichiers ne soient plus disponibles."
      };
    } else if (type === 'reservation' && typeTime === 'time') {
      return {
        title: "Erreur avec la réservation horaire",
        icon: <Clock className="text-amber-600 mr-3 mt-1 flex-shrink-0" size={20} />,
        backgroundColor: "bg-amber-50",
        borderColor: "border-amber-200",
        titleColor: "text-amber-700",
        textColor: "text-amber-800",
        message: "Un problème est survenu avec cette réservation horaire. Il est possible que les créneaux ne soient plus disponibles."
      };
    } else if (type === 'reservation' && (!typeTime || typeTime === 'date')) {
      return {
        title: "Erreur avec la réservation journalière",
        icon: <Calendar className="text-green-600 mr-3 mt-1 flex-shrink-0" size={20} />,
        backgroundColor: "bg-green-50",
        borderColor: "border-green-200",
        titleColor: "text-green-700",
        textColor: "text-green-800",
        message: "Un problème est survenu avec cette réservation journalière. Il est possible que les dates ne soient plus disponibles."
      };
    } else if (type === 'ecommerce' && !isDigital) {
      return {
        title: "Erreur avec le produit physique",
        icon: <Package className="text-purple-600 mr-3 mt-1 flex-shrink-0" size={20} />,
        backgroundColor: "bg-purple-50",
        borderColor: "border-purple-200",
        titleColor: "text-purple-700",
        textColor: "text-purple-800",
        message: "Un problème est survenu avec ce produit physique. Il est possible qu'il soit en rupture de stock."
      };
    }
    
    // Default fallback
    return null;
  };
  
  const typeSpecificError = getTypeSpecificMessage();
    
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            {isNotFoundError ? 'Blane Non Trouvé' : 'Erreur de Chargement'}
          </h2>
          
          <p className="text-gray-700 mb-4">{errorMessage}</p>
        </div>
        
        {/* Type-specific error */}
        {typeSpecificError && (
          <div className={`mb-8 p-4 ${typeSpecificError.backgroundColor} border ${typeSpecificError.borderColor} rounded-md`}>
            <div className="flex items-start">
              {typeSpecificError.icon}
              <div>
                <h3 className={`font-semibold ${typeSpecificError.titleColor} mb-2`}>{typeSpecificError.title}</h3>
                <p className={`${typeSpecificError.textColor} mb-2`}>
                  {typeSpecificError.message}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Server connection error */}
        {isServerConnectionError && (
          <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex items-start">
              <Server className="text-yellow-600 mr-3 mt-1 flex-shrink-0" size={20} />
              <div>
                <h3 className="font-semibold text-yellow-700 mb-2">Problème de connexion au serveur</h3>
                <p className="text-yellow-800 mb-2">
                  Il semble que nous ne puissions pas nous connecter au serveur API.
                </p>
                <ul className="list-disc list-inside text-sm text-yellow-800 space-y-1">
                  <li>Vérifiez que le serveur API est en cours d'exécution</li>
                  <li>Vérifiez si le point d'accès <code className="bg-yellow-100 px-1 py-0.5 rounded">/api/front/v1/blanes/{slug || '...'}</code> est disponible</li>
                  <li>Vérifiez la connectivité réseau avec le serveur</li>
                </ul>
              </div>
            </div>
          </div>
        )}
        
        {/* Not Found error */}
        {isNotFoundError && (
          <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-start">
              <AlertCircle className="text-blue-600 mr-3 mt-1 flex-shrink-0" size={20} />
              <div>
                <h3 className="font-semibold text-blue-700 mb-2">Blane Non Trouvé</h3>
                <p className="text-blue-800 mb-2">
                  Le blane demandé "{slug}" n'a pas pu être trouvé. Il a peut-être été supprimé ou l'URL est peut-être incorrecte.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Out of stock error */}
        {isInventoryError && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-start">
              <AlertCircle className="text-red-600 mr-3 mt-1 flex-shrink-0" size={20} />
              <div>
                <h3 className="font-semibold text-red-700 mb-2">Produit en rupture de stock</h3>
                <p className="text-red-800 mb-2">
                  Ce produit est actuellement en rupture de stock. Veuillez vérifier ultérieurement si de nouvelles quantités sont disponibles.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Time slot error */}
        {isTimeSlotError && (
          <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-md">
            <div className="flex items-start">
              <Clock className="text-amber-600 mr-3 mt-1 flex-shrink-0" size={20} />
              <div>
                <h3 className="font-semibold text-amber-700 mb-2">Créneau horaire non disponible</h3>
                <p className="text-amber-800 mb-2">
                  Le créneau horaire demandé n'est plus disponible. Veuillez essayer un autre horaire.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Expired error */}
        {isExpiredError && (
          <div className="mb-8 p-4 bg-gray-50 border border-gray-200 rounded-md">
            <div className="flex items-start">
              <AlertCircle className="text-gray-600 mr-3 mt-1 flex-shrink-0" size={20} />
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Offre expirée</h3>
                <p className="text-gray-800 mb-2">
                  Cette offre a expiré et n'est plus disponible. Veuillez consulter nos autres offres actuelles.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Data Structure Error */}
        {isDataStructureError && (
          <div className="mb-8 p-4 bg-purple-50 border border-purple-200 rounded-md">
            <div className="flex items-start">
              <AlertCircle className="text-purple-600 mr-3 mt-1 flex-shrink-0" size={20} />
              <div>
                <h3 className="font-semibold text-purple-700 mb-2">Problème de réponse API</h3>
                <p className="text-purple-800 mb-2">
                  Le serveur a renvoyé des données dans un format inattendu. Cela peut être dû à :
                </p>
                <ul className="list-disc list-inside text-sm text-purple-800 space-y-1">
                  <li>Incompatibilité de version de l'API</li>
                  <li>Données manquantes ou nulles dans la réponse</li>
                  <li>Modifications dans la structure de l'API</li>
                </ul>
                <div className="mt-3 text-purple-800 text-sm">
                  <p>Veuillez consulter la console du navigateur pour plus d'informations détaillées.</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex flex-wrap justify-center gap-4 mt-6">
          <Button 
            onClick={() => retryFetch()} 
            className="bg-blue-600 hover:bg-blue-700"
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Réessayer
          </Button>
          
          <Button onClick={() => navigate(-1)} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Retour
          </Button>
          
          <Button onClick={() => navigate('/')} className="bg-green-600 hover:bg-green-700">
            <Home className="mr-2 h-4 w-4" /> Accueil
          </Button>
        </div>
      </div>
    </div>
  );
}; 