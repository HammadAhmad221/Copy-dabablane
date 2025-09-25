import React, { useState } from 'react';
import { PhoneInput } from './ui/PhoneInput';

const PhoneInputTest = () => {
  const [countryCode, setCountryCode] = useState('212'); // Default to Morocco
  const [phoneNumber, setPhoneNumber] = useState('');
  const [validationResult, setValidationResult] = useState({ isValid: true });

  return (
    <div className="max-w-lg mx-auto p-6 bg-white rounded-lg shadow-md my-10">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Phone Input Component Test</h2>
      
      <div className="space-y-6">
        <PhoneInput
          countryCode={countryCode}
          phoneNumber={phoneNumber}
          onCountryCodeChange={setCountryCode}
          onPhoneNumberChange={setPhoneNumber}
          onValidationChange={setValidationResult}
          required
        />
        
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-lg mb-3">Current Values:</h3>
          <p><span className="font-medium">Country Code:</span> +{countryCode}</p>
          <p><span className="font-medium">Phone Number:</span> {phoneNumber}</p>
          <p>
            <span className="font-medium">Status:</span> 
            {validationResult.isValid ? (
              <span className="text-green-600">Valid</span>
            ) : (
              <span className="text-red-600">Invalid</span>
            )}
          </p>
          {validationResult.countryName && (
            <p><span className="font-medium">Country:</span> {validationResult.countryName}</p>
          )}
          {validationResult.formattedNumber && (
            <p><span className="font-medium">Formatted Number:</span> {validationResult.formattedNumber}</p>
          )}
          {validationResult.errorMessage && (
            <p><span className="font-medium">Error:</span> <span className="text-red-600">{validationResult.errorMessage}</span></p>
          )}
        </div>

        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <h3 className="text-lg font-medium text-blue-700 mb-2">Instructions</h3>
          <ul className="list-disc pl-5 space-y-1 text-blue-600">
            <li>Click on the flag/country code to open the dropdown</li>
            <li>Search for countries by name or code</li>
            <li>Type a full international number starting with + to auto-detect country</li>
            <li>Example: try typing "+33612345678" to auto-select France</li>
            <li>Phone validation happens automatically</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PhoneInputTest; 