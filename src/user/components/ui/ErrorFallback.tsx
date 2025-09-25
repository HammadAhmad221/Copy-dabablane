import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ErrorFallbackProps {
  error?: string;
  resetErrorBoundary?: () => void;
  showReset?: boolean;
}

/**
 * A component that displays user-friendly error messages
 * Can be used both as a standalone component or inside an ErrorBoundary
 */
const ErrorFallback: React.FC<ErrorFallbackProps> = ({ 
  error = "Une erreur s'est produite. Veuillez réessayer plus tard.", 
  resetErrorBoundary,
  showReset = true
}) => {
  return (
    <div className="bg-white shadow-md rounded-lg p-6 max-w-lg mx-auto my-8 border border-red-100">
      <div className="flex items-center mb-4">
        <div className="bg-red-100 p-2 rounded-full mr-3">
          <AlertTriangle className="h-6 w-6 text-red-500" />
        </div>
        <h2 className="text-xl font-semibold text-gray-800">Oups!</h2>
      </div>
      
      <p className="text-gray-600 mb-6">
        {error}
      </p>
      
      {showReset && resetErrorBoundary && (
        <button
          onClick={resetErrorBoundary}
          className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 w-full"
        >
          Réessayer
        </button>
      )}
    </div>
  );
};

export default ErrorFallback; 