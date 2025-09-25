import React from 'react';

interface ErrorStateProps {
  message?: string;
}

const ErrorState: React.FC<ErrorStateProps> = ({ 
  message = 'Failed to load products. Please try again later.' 
}) => {
  return (
    <div className="min-h-screen p-8">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-4">Catalogue</h1>
        <p className="mb-8 text-red-500">{message}</p>
      </div>
    </div>
  );
};

export default ErrorState; 