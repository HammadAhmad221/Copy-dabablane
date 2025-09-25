import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/utils/cn';
import { countries, getSortedCountries, Country } from '@/user/lib/utils/countries';

interface ValidationResult {
  isValid: boolean;
  errorMessage?: string;
  countryName?: string;
  formattedNumber?: string;
}

interface PhoneInputProps {
  countryCode: string;
  phoneNumber: string;
  onCountryCodeChange: (value: string) => void;
  onPhoneNumberChange: (value: string) => void;
  onValidationChange: (result: ValidationResult) => void;
  required?: boolean;
  className?: string;
  disabled?: boolean;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  countryCode,
  phoneNumber,
  onCountryCodeChange,
  onPhoneNumberChange,
  onValidationChange,
  required = false,
  className,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCountries, setFilteredCountries] = useState<Country[]>(getSortedCountries());
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const lastPhoneRef = useRef({ phoneNumber, countryCode });

  // Find the current selected country
  const selectedCountry = countries.find(country => country.dialCode === countryCode) || countries[0];

  // Update validation function
  const validatePhone = useCallback(() => {
    // Basic validation
    if (!phoneNumber) {
      if (required) {
        return { isValid: false, errorMessage: 'Numéro de téléphone requis' };
      }
      return { isValid: true };
    }

    // Simple format validation
    const isValidFormat = /^\d{5,15}$/.test(phoneNumber);
    
    if (!isValidFormat) {
      return {
        isValid: false,
        errorMessage: 'Format de numéro invalide. Ne doit contenir que des chiffres (5-15).'
      };
    }

    // If we have a selected country, include it in the validation result
    const country = countries.find(c => c.dialCode === countryCode);
    // Always include country code in the formatted number
    const formattedNumber = countryCode + phoneNumber;
    
    return {
      isValid: true,
      countryName: country?.name,
      formattedNumber
    };
  }, [phoneNumber, countryCode, required]);

  // Filter countries based on search query
  useEffect(() => {
    const query = searchQuery.toLowerCase();
    const filtered = getSortedCountries().filter(country =>
      country.name.toLowerCase().includes(query) ||
      country.code.toLowerCase().includes(query) ||
      country.dialCode.includes(query)
    );
    setFilteredCountries(filtered);
  }, [searchQuery]);

  // Auto-detect country when typing in phone input
  useEffect(() => {
    // Skip if the phone number hasn't changed
    if (phoneNumber === lastPhoneRef.current.phoneNumber && 
        countryCode === lastPhoneRef.current.countryCode) {
      return;
    }

    // Update the ref
    lastPhoneRef.current = { phoneNumber, countryCode };

    if (phoneNumber.startsWith('+')) {
      // Extract potential country code from the phone number
      const potentialCode = phoneNumber.substring(1).match(/^\d+/)?.[0];
      
      if (potentialCode) {
        // Find countries that match the potential code
        const matchingCountries = countries.filter(country => 
          potentialCode.startsWith(country.dialCode)
        );
        
        // Sort by dial code length (descending) to match the most specific code first
        matchingCountries.sort((a, b) => b.dialCode.length - a.dialCode.length);
        
        // Update country code if a match is found
        if (matchingCountries.length > 0 && matchingCountries[0].dialCode !== countryCode) {
          onCountryCodeChange(matchingCountries[0].dialCode);
          
          // Remove the country code from the phone number
          const newPhoneNumber = phoneNumber.substring(1 + matchingCountries[0].dialCode.length);
          onPhoneNumberChange(newPhoneNumber);
        }
      }
    }
  }, [phoneNumber, countryCode, onCountryCodeChange, onPhoneNumberChange]);

  // Validate phone number
  useEffect(() => {
    // Skip if nothing has changed
    if (phoneNumber === lastPhoneRef.current.phoneNumber && 
        countryCode === lastPhoneRef.current.countryCode) {
      return;
    }

    const result = validatePhone();
    onValidationChange(result);
  }, [phoneNumber, countryCode, validatePhone, onValidationChange]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Handle country selection
  const handleCountrySelect = useCallback((country: Country) => {
    onCountryCodeChange(country.dialCode);
    setIsOpen(false);
    setSearchQuery('');
  }, [onCountryCodeChange]);

  // Handle phone number input
  const handlePhoneNumberChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // If the user is typing a plus at the beginning, it might be a complete international number
    if (value.startsWith('+')) {
      // Extract potential country code and number
      const match = value.match(/^\+(\d+)(\d*)$/);
      if (match) {
        const [, potentialCode, remainingDigits] = match;
        // Find matching country
        const matchingCountries = countries.filter(country => 
          potentialCode.startsWith(country.dialCode)
        ).sort((a, b) => b.dialCode.length - a.dialCode.length);

        if (matchingCountries.length > 0) {
          const country = matchingCountries[0];
          // Update country code
          onCountryCodeChange(country.dialCode);
          // Update phone number without country code
          const newPhoneNumber = potentialCode.slice(country.dialCode.length) + remainingDigits;
          onPhoneNumberChange(newPhoneNumber);
          return;
        }
      }
      // If no match found, just pass the digits
      onPhoneNumberChange(value.replace(/\D/g, ''));
    } else {
      // Otherwise just pass the digits
      const digits = value.replace(/\D/g, '');
      onPhoneNumberChange(digits);
    }
  }, [onCountryCodeChange, onPhoneNumberChange]);

  return (
    <div className={cn("relative", className)}>
      <div className="flex">
        {/* Country Code Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            disabled={disabled}
            className="flex items-center bg-gray-50 border border-r-0 border-gray-300 rounded-l-md px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#197874] focus:border-[#197874]"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
          >
            <span className="mr-1">{selectedCountry.flag}</span>
            <span>+{selectedCountry.dialCode}</span>
            <svg
              className="w-5 h-5 ml-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              ></path>
            </svg>
          </button>

          {isOpen && (
            <div className="absolute z-10 mt-1 w-80 bg-white border border-gray-300 rounded-md shadow-lg">
              <div className="p-2 border-b">
                <div className="flex items-center bg-gray-50 rounded-md px-2">
                  <Search className="h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    ref={searchInputRef}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher un pays..."
                    className="w-full py-2 px-1 focus:outline-none bg-transparent text-sm"
                  />
                </div>
              </div>
              <ul
                className="max-h-60 overflow-y-auto py-1"
                role="listbox"
              >
                {filteredCountries.map((country) => (
                  <li
                    key={country.code}
                    role="option"
                    aria-selected={country.dialCode === countryCode}
                    className={`flex items-center px-3 py-2 cursor-pointer hover:bg-gray-100 ${
                      country.dialCode === countryCode ? 'bg-gray-100' : ''
                    }`}
                    onClick={() => handleCountrySelect(country)}
                  >
                    <span className="mr-2">{country.flag}</span>
                    <span className="flex-1">{country.name}</span>
                    <span className="text-gray-500">+{country.dialCode}</span>
                  </li>
                ))}
                {filteredCountries.length === 0 && (
                  <li className="px-3 py-2 text-gray-500 text-sm">
                    Aucun pays trouvé
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>

        {/* Phone Number Input */}
        <input
          type="tel"
          value={phoneNumber}
          onChange={handlePhoneNumberChange}
          disabled={disabled}
          required={required}
          placeholder="Numéro de téléphone"
          className="flex-1 rounded-r-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#197874] focus:border-[#197874]"
        />
      </div>

      {/* Example format hint */}
      <p className="mt-1 text-xs text-gray-500">
        Format: {selectedCountry.dialCode}{phoneNumber ? phoneNumber : ' XXXXXXXXX'}
      </p>
    </div>
  );
};

// Re-export the validation function from phoneValidation.ts
export { validateInternationalPhone } from '@/user/lib/utils/phoneValidation';
export { formatPhoneNumber } from '@/user/lib/utils/phoneValidation'; 