import { useContext } from 'react';
import { HomeContext } from '../contexts/HomeContext';

export const useHome = () => {
  const context = useContext(HomeContext);
  if (context === undefined) {
    throw new Error('useHome must be used within a HomeProvider');
  }
  return context;
}; 