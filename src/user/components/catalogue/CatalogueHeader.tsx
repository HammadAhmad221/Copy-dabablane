import React from 'react';

const CatalogueHeader: React.FC = () => {
  return (
    <div className="my-6 sm:my-6 text-center">
      <h1 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-4">Catalogue des Blanes</h1>
      <p className="text-gray-600 text-sm sm:text-base">
        Découvrez notre sélection de blanes de qualité
      </p>
    </div>
  );
};

export default CatalogueHeader; 