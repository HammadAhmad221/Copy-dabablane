import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to merge class names with Tailwind CSS
 * Prevents class conflicts when combining conditional classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a price with currency symbol
 */
export const formatPrice = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined) return '0 DH';
  
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  
  // Handle NaN
  if (isNaN(numericValue)) return '0 DH';
  
  return `${numericValue.toLocaleString('fr-MA')} DH`;
}; 