import { useState, useEffect } from 'react';

interface TimePickerProps {
  value: string;
  onChange: (time: string) => void;
  minTime: string;
  maxTime: string;
  step: number;
  placeholder?: string;
}

const TimePicker = ({ value, onChange, minTime, maxTime, step, placeholder }: TimePickerProps) => {
  const [selectedTime, setSelectedTime] = useState(value);
  const [showPlaceholder, setShowPlaceholder] = useState(!value);

  // Add validation for time parameters
  const isValidTime = (time: string) => {
    return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
  };

  const generateTimeOptions = () => {
    const options = [];
    
    if (placeholder) {
      options.push(
        <option key="placeholder" value="" disabled hidden>
          {placeholder}
        </option>
      );
    }

    // Add default values if times are invalid
    const safeMinTime = isValidTime(minTime) ? minTime : '08:00';
    const safeMaxTime = isValidTime(maxTime) ? maxTime : '20:00';

    const [minHour, minMinute] = safeMinTime.split(':').map(Number);
    const [maxHour, maxMinute] = safeMaxTime.split(':').map(Number);

    let currentHour = minHour;
    let currentMinute = minMinute;

    while (currentHour < maxHour || (currentHour === maxHour && currentMinute <= maxMinute)) {
      const time = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
      options.push(
        <option key={time} value={time}>
          {time}
        </option>
      );

      currentMinute += step;
      if (currentMinute >= 60) {
        currentMinute = 0;
        currentHour++;
      }
    }

    return options;
  };

  useEffect(() => {
    setSelectedTime(value);
    setShowPlaceholder(!value);
  }, [value]);

  return (
    <select
      value={selectedTime}
      onChange={(e) => {
        setSelectedTime(e.target.value);
        setShowPlaceholder(false);
        onChange(e.target.value);
      }}
      className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#197874] focus:border-[#197874] ${
        showPlaceholder ? 'text-gray-400' : 'text-gray-900'
      }`}
    >
      {generateTimeOptions()}
    </select>
  );
};

export default TimePicker; 