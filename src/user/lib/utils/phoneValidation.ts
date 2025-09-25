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

// Parse phone number from API format (e.g., +91000000000000)
export const parsePhoneNumberFromAPI = (apiPhoneNumber: string): { countryCode: string; phoneNumber: string } => {
  if (!apiPhoneNumber) {
    return { countryCode: '212', phoneNumber: '' }; // Default to Morocco
  }

  // Remove any spaces or special characters except +
  const cleanNumber = apiPhoneNumber.replace(/[\s-]/g, '');
  
  // If it starts with +, extract the country code
  if (cleanNumber.startsWith('+')) {
    const numberWithoutPlus = cleanNumber.substring(1);
    
    // Find the best matching country code
    const matchingCountries = countries.filter(country => 
      numberWithoutPlus.startsWith(country.dialCode)
    );
    
    // Sort by dial code length (descending) to get the most specific match
    matchingCountries.sort((a, b) => b.dialCode.length - a.dialCode.length);
    
    if (matchingCountries.length > 0) {
      const country = matchingCountries[0];
      const phoneNumber = numberWithoutPlus.substring(country.dialCode.length);
      return { countryCode: country.dialCode, phoneNumber };
    }
  }
  
  // If no country code found or doesn't start with +, assume it's a local number
  // Default to Morocco for local numbers
  return { countryCode: '212', phoneNumber: cleanNumber.replace(/^\+/, '') };
};

// Re-export country data for consistency
export { countries }; 