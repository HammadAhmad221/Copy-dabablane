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
  { name: 'Austria', code: 'AT', dialCode: '43', flag: '🇦🇹' },
  { name: 'Sweden', code: 'SE', dialCode: '46', flag: '🇸🇪' },
  { name: 'Norway', code: 'NO', dialCode: '47', flag: '🇳🇴' },
  { name: 'Denmark', code: 'DK', dialCode: '45', flag: '🇩🇰' },
  { name: 'Finland', code: 'FI', dialCode: '358', flag: '🇫🇮' },
  { name: 'Ireland', code: 'IE', dialCode: '353', flag: '🇮🇪' },
  { name: 'Poland', code: 'PL', dialCode: '48', flag: '🇵🇱' },
  { name: 'Czech Republic', code: 'CZ', dialCode: '420', flag: '🇨🇿' },
  { name: 'Hungary', code: 'HU', dialCode: '36', flag: '🇭🇺' },
  { name: 'Romania', code: 'RO', dialCode: '40', flag: '🇷🇴' },
  { name: 'Bulgaria', code: 'BG', dialCode: '359', flag: '🇧🇬' },
  { name: 'Croatia', code: 'HR', dialCode: '385', flag: '🇭🇷' },
  { name: 'Slovenia', code: 'SI', dialCode: '386', flag: '🇸🇮' },
  { name: 'Slovakia', code: 'SK', dialCode: '421', flag: '🇸🇰' },
  { name: 'Lithuania', code: 'LT', dialCode: '370', flag: '🇱🇹' },
  { name: 'Latvia', code: 'LV', dialCode: '371', flag: '🇱🇻' },
  { name: 'Estonia', code: 'EE', dialCode: '372', flag: '🇪🇪' },
  { name: 'Greece', code: 'GR', dialCode: '30', flag: '🇬🇷' },
  { name: 'Cyprus', code: 'CY', dialCode: '357', flag: '🇨🇾' },
  { name: 'Malta', code: 'MT', dialCode: '356', flag: '🇲🇹' },
  { name: 'Luxembourg', code: 'LU', dialCode: '352', flag: '🇱🇺' },
  { name: 'Iceland', code: 'IS', dialCode: '354', flag: '🇮🇸' },
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
  { name: 'Pakistan', code: 'PK', dialCode: '92', flag: '🇵🇰' },
  { name: 'Bangladesh', code: 'BD', dialCode: '880', flag: '🇧🇩' },
  { name: 'Sri Lanka', code: 'LK', dialCode: '94', flag: '🇱🇰' },
  { name: 'Nepal', code: 'NP', dialCode: '977', flag: '🇳🇵' },
  { name: 'Afghanistan', code: 'AF', dialCode: '93', flag: '🇦🇫' },
  { name: 'Iran', code: 'IR', dialCode: '98', flag: '🇮🇷' },
  { name: 'Iraq', code: 'IQ', dialCode: '964', flag: '🇮🇶' },
  { name: 'Syria', code: 'SY', dialCode: '963', flag: '🇸🇾' },
  { name: 'Israel', code: 'IL', dialCode: '972', flag: '🇮🇱' },
  { name: 'Palestine', code: 'PS', dialCode: '970', flag: '🇵🇸' },
  { name: 'Japan', code: 'JP', dialCode: '81', flag: '🇯🇵' },
  { name: 'Mexico', code: 'MX', dialCode: '52', flag: '🇲🇽' },
  { name: 'Russia', code: 'RU', dialCode: '7', flag: '🇷🇺' },
  { name: 'Singapore', code: 'SG', dialCode: '65', flag: '🇸🇬' },
  { name: 'Malaysia', code: 'MY', dialCode: '60', flag: '🇲🇾' },
  { name: 'Thailand', code: 'TH', dialCode: '66', flag: '🇹🇭' },
  { name: 'Indonesia', code: 'ID', dialCode: '62', flag: '🇮🇩' },
  { name: 'Philippines', code: 'PH', dialCode: '63', flag: '🇵🇭' },
  { name: 'Vietnam', code: 'VN', dialCode: '84', flag: '🇻🇳' },
  { name: 'Myanmar', code: 'MM', dialCode: '95', flag: '🇲🇲' },
  { name: 'Cambodia', code: 'KH', dialCode: '855', flag: '🇰🇭' },
  { name: 'Laos', code: 'LA', dialCode: '856', flag: '🇱🇦' },
  { name: 'Brunei', code: 'BN', dialCode: '673', flag: '🇧🇳' },
  { name: 'Taiwan', code: 'TW', dialCode: '886', flag: '🇹🇼' },
  { name: 'Hong Kong', code: 'HK', dialCode: '852', flag: '🇭🇰' },
  { name: 'Macau', code: 'MO', dialCode: '853', flag: '🇲🇴' },
  { name: 'Mongolia', code: 'MN', dialCode: '976', flag: '🇲🇳' },
  { name: 'Kazakhstan', code: 'KZ', dialCode: '7', flag: '🇰🇿' },
  { name: 'Uzbekistan', code: 'UZ', dialCode: '998', flag: '🇺🇿' },
  { name: 'Kyrgyzstan', code: 'KG', dialCode: '996', flag: '🇰🇬' },
  { name: 'Tajikistan', code: 'TJ', dialCode: '992', flag: '🇹🇯' },
  { name: 'Turkmenistan', code: 'TM', dialCode: '993', flag: '🇹🇲' },
  { name: 'South Africa', code: 'ZA', dialCode: '27', flag: '🇿🇦' },
  { name: 'South Korea', code: 'KR', dialCode: '82', flag: '🇰🇷' },
  { name: 'Nigeria', code: 'NG', dialCode: '234', flag: '🇳🇬' },
  { name: 'Ghana', code: 'GH', dialCode: '233', flag: '🇬🇭' },
  { name: 'Kenya', code: 'KE', dialCode: '254', flag: '🇰🇪' },
  { name: 'Senegal', code: 'SN', dialCode: '221', flag: '🇸🇳' },
  { name: 'Ivory Coast', code: 'CI', dialCode: '225', flag: '🇨🇮' },
  { name: 'Ethiopia', code: 'ET', dialCode: '251', flag: '🇪🇹' },
  { name: 'Tanzania', code: 'TZ', dialCode: '255', flag: '🇹🇿' },
  { name: 'Uganda', code: 'UG', dialCode: '256', flag: '🇺🇬' },
  { name: 'Rwanda', code: 'RW', dialCode: '250', flag: '🇷🇼' },
  { name: 'Burundi', code: 'BI', dialCode: '257', flag: '🇧🇮' },
  { name: 'Somalia', code: 'SO', dialCode: '252', flag: '🇸🇴' },
  { name: 'Djibouti', code: 'DJ', dialCode: '253', flag: '🇩🇯' },
  { name: 'Eritrea', code: 'ER', dialCode: '291', flag: '🇪🇷' },
  { name: 'Sudan', code: 'SD', dialCode: '249', flag: '🇸🇩' },
  { name: 'South Sudan', code: 'SS', dialCode: '211', flag: '🇸🇸' },
  { name: 'Libya', code: 'LY', dialCode: '218', flag: '🇱🇾' },
  { name: 'Mali', code: 'ML', dialCode: '223', flag: '🇲🇱' },
  { name: 'Burkina Faso', code: 'BF', dialCode: '226', flag: '🇧🇫' },
  { name: 'Niger', code: 'NE', dialCode: '227', flag: '🇳🇪' },
  { name: 'Chad', code: 'TD', dialCode: '235', flag: '🇹🇩' },
  { name: 'Central African Republic', code: 'CF', dialCode: '236', flag: '🇨🇫' },
  { name: 'Cameroon', code: 'CM', dialCode: '237', flag: '🇨🇲' },
  { name: 'Gabon', code: 'GA', dialCode: '241', flag: '🇬🇦' },
  { name: 'Equatorial Guinea', code: 'GQ', dialCode: '240', flag: '🇬🇶' },
  { name: 'Republic of Congo', code: 'CG', dialCode: '242', flag: '🇨🇬' },
  { name: 'Democratic Republic of Congo', code: 'CD', dialCode: '243', flag: '🇨🇩' },
  { name: 'Angola', code: 'AO', dialCode: '244', flag: '🇦🇴' },
  { name: 'Zambia', code: 'ZM', dialCode: '260', flag: '🇿🇲' },
  { name: 'Zimbabwe', code: 'ZW', dialCode: '263', flag: '🇿🇼' },
  { name: 'Botswana', code: 'BW', dialCode: '267', flag: '🇧🇼' },
  { name: 'Namibia', code: 'NA', dialCode: '264', flag: '🇳🇦' },
  { name: 'Lesotho', code: 'LS', dialCode: '266', flag: '🇱🇸' },
  { name: 'Swaziland', code: 'SZ', dialCode: '268', flag: '🇸🇿' },
  { name: 'Madagascar', code: 'MG', dialCode: '261', flag: '🇲🇬' },
  { name: 'Mauritius', code: 'MU', dialCode: '230', flag: '🇲🇺' },
  { name: 'Seychelles', code: 'SC', dialCode: '248', flag: '🇸🇨' },
  { name: 'Comoros', code: 'KM', dialCode: '269', flag: '🇰🇲' },
  { name: 'Mauritania', code: 'MR', dialCode: '222', flag: '🇲🇷' },
  { name: 'Guinea', code: 'GN', dialCode: '224', flag: '🇬🇳' },
  { name: 'Guinea-Bissau', code: 'GW', dialCode: '245', flag: '🇬🇼' },
  { name: 'Sierra Leone', code: 'SL', dialCode: '232', flag: '🇸🇱' },
  { name: 'Liberia', code: 'LR', dialCode: '231', flag: '🇱🇷' },
  { name: 'Gambia', code: 'GM', dialCode: '220', flag: '🇬🇲' },
  { name: 'Cape Verde', code: 'CV', dialCode: '238', flag: '🇨🇻' },
  { name: 'Sao Tome and Principe', code: 'ST', dialCode: '239', flag: '🇸🇹' },
  { name: 'Togo', code: 'TG', dialCode: '228', flag: '🇹🇬' },
  { name: 'Benin', code: 'BJ', dialCode: '229', flag: '🇧🇯' },
  { name: 'Malawi', code: 'MW', dialCode: '265', flag: '🇲🇼' },
  { name: 'Mozambique', code: 'MZ', dialCode: '258', flag: '🇲🇿' },
  { name: 'Lebanon', code: 'LB', dialCode: '961', flag: '🇱🇧' },
  { name: 'Jordan', code: 'JO', dialCode: '962', flag: '🇯🇴' },
  { name: 'Argentina', code: 'AR', dialCode: '54', flag: '🇦🇷' },
  { name: 'Chile', code: 'CL', dialCode: '56', flag: '🇨🇱' },
  { name: 'Colombia', code: 'CO', dialCode: '57', flag: '🇨🇴' },
  { name: 'Peru', code: 'PE', dialCode: '51', flag: '🇵🇪' },
  { name: 'Venezuela', code: 'VE', dialCode: '58', flag: '🇻🇪' },
  { name: 'Ecuador', code: 'EC', dialCode: '593', flag: '🇪🇨' },
  { name: 'Bolivia', code: 'BO', dialCode: '591', flag: '🇧🇴' },
  { name: 'Paraguay', code: 'PY', dialCode: '595', flag: '🇵🇾' },
  { name: 'Uruguay', code: 'UY', dialCode: '598', flag: '🇺🇾' },
  { name: 'Guyana', code: 'GY', dialCode: '592', flag: '🇬🇾' },
  { name: 'Suriname', code: 'SR', dialCode: '597', flag: '🇸🇷' }
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