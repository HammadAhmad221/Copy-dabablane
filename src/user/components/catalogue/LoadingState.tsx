import React from 'react';

interface LoadingStateProps {
  message?: string;
}

const LoadingState: React.FC<LoadingStateProps> = ({ message = 'Loading products...' }) => {
  return (
    <div className="min-h-screen p-8">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-4">Catalogue</h1>
        <p className="mb-8">{message}</p>
      </div>
    </div>
  );
};

export default LoadingState; 