import { countries } from './countries';

export interface PhoneValidationResult {
  isValid: boolean;
  errorMessage?: string;
  countryName?: string;
  formattedNumber?: string;
}

export const validateInternationalPhone = (countryCode: string, phoneNumber: string): PhoneValidationResult => {
  if (!phoneNumber) {
    return { isValid: false, errorMessage: 'Numéro de téléphone requis' };
  }

  // Basic validation
  const isValidLength = phoneNumber.length >= 5 && phoneNumber.length <= 15;
  const isValidFormat = /^\d+$/.test(phoneNumber);

  if (!isValidLength || !isValidFormat) {
    return { 
      isValid: false, 
      errorMessage: 'Format de numéro invalide' 
    };
  }

  // Find country name
  const country = countries.find(c => c.dialCode === countryCode);
  const countryName = country?.name || '';
  
  // Format the phone number with international formatting
  const formattedNumber = formatPhoneNumber(countryCode, phoneNumber);

  return { 
    isValid: true,
    countryName,
    formattedNumber
  };
};

export const formatPhoneNumber = (countryCode: string, phoneNumber: string): string => {
  return `+${countryCode} ${phoneNumber}`;
};

// Re-export country data for consistency
export { countries }; 