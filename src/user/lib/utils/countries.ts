// Country data with dialing codes
export interface Country {
  name: string;
  code: string;
  dialCode: string;
  flag: string;
}

export const countries: Country[] = [
  { name: 'Morocco', code: 'MA', dialCode: '212', flag: '🇲🇦' },
  { name: 'France', code: 'FR', dialCode: '33', flag: '🇫🇷' },
  { name: 'United States', code: 'US', dialCode: '1', flag: '🇺🇸' },
  { name: 'Spain', code: 'ES', dialCode: '34', flag: '🇪🇸' },
  { name: 'United Kingdom', code: 'GB', dialCode: '44', flag: '🇬🇧' },
  { name: 'Germany', code: 'DE', dialCode: '49', flag: '🇩🇪' },
  { name: 'Italy', code: 'IT', dialCode: '39', flag: '🇮🇹' },
  { name: 'Belgium', code: 'BE', dialCode: '32', flag: '🇧🇪' },
  { name: 'Netherlands', code: 'NL', dialCode: '31', flag: '🇳🇱' },
  { name: 'Canada', code: 'CA', dialCode: '1', flag: '🇨🇦' },
  { name: 'Switzerland', code: 'CH', dialCode: '41', flag: '🇨🇭' },
  { name: 'Portugal', code: 'PT', dialCode: '351', flag: '🇵🇹' },
  { name: 'Algeria', code: 'DZ', dialCode: '213', flag: '🇩🇿' },
  { name: 'Tunisia', code: 'TN', dialCode: '216', flag: '🇹🇳' },
  { name: 'Egypt', code: 'EG', dialCode: '20', flag: '🇪🇬' },
  { name: 'Saudi Arabia', code: 'SA', dialCode: '966', flag: '🇸🇦' },
  { name: 'UAE', code: 'AE', dialCode: '971', flag: '🇦🇪' },
  { name: 'Qatar', code: 'QA', dialCode: '974', flag: '🇶🇦' },
  { name: 'Kuwait', code: 'KW', dialCode: '965', flag: '🇰🇼' },
  { name: 'Bahrain', code: 'BH', dialCode: '973', flag: '🇧🇭' },
  { name: 'Oman', code: 'OM', dialCode: '968', flag: '🇴🇲' },
  { name: 'Turkey', code: 'TR', dialCode: '90', flag: '🇹🇷' },
  { name: 'Australia', code: 'AU', dialCode: '61', flag: '🇦🇺' },
  { name: 'Brazil', code: 'BR', dialCode: '55', flag: '🇧🇷' },
  { name: 'China', code: 'CN', dialCode: '86', flag: '🇨🇳' },
  { name: 'India', code: 'IN', dialCode: '91', flag: '🇮🇳' },
  { name: 'Japan', code: 'JP', dialCode: '81', flag: '🇯🇵' },
  { name: 'Mexico', code: 'MX', dialCode: '52', flag: '🇲🇽' },
  { name: 'Russia', code: 'RU', dialCode: '7', flag: '🇷🇺' },
  { name: 'Singapore', code: 'SG', dialCode: '65', flag: '🇸🇬' },
  { name: 'South Africa', code: 'ZA', dialCode: '27', flag: '🇿🇦' },
  { name: 'South Korea', code: 'KR', dialCode: '82', flag: '🇰🇷' },
  { name: 'Nigeria', code: 'NG', dialCode: '234', flag: '🇳🇬' },
  { name: 'Ghana', code: 'GH', dialCode: '233', flag: '🇬🇭' },
  { name: 'Kenya', code: 'KE', dialCode: '254', flag: '🇰🇪' },
  { name: 'Senegal', code: 'SN', dialCode: '221', flag: '🇸🇳' },
  { name: 'Ivory Coast', code: 'CI', dialCode: '225', flag: '🇨🇮' },
  { name: 'Lebanon', code: 'LB', dialCode: '961', flag: '🇱🇧' },
  { name: 'Jordan', code: 'JO', dialCode: '962', flag: '🇯🇴' }
];

// Sort countries to put Morocco first and then alphabetically
export const getSortedCountries = (): Country[] => {
  return [...countries].sort((a, b) => {
    if (a.code === 'MA') return -1;
    if (b.code === 'MA') return 1;
    return a.name.localeCompare(b.name);
  });
};

// Find a country by dial code
export const findCountryByDialCode = (dialCode: string): Country | undefined => {
  return countries.find(country => country.dialCode === dialCode);
};

// Find countries that match a dial code pattern (for auto-detection)
export const findCountriesByDialCodePattern = (pattern: string): Country[] => {
  return countries.filter(country => pattern.startsWith(country.dialCode));
};

// Format international phone number
export const formatInternationalPhone = (countryCode: string, phoneNumber: string): string => {
  return `+${countryCode} ${phoneNumber}`;
}; 