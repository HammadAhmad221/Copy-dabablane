import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/user/components/ui/select';

interface Option {
  id: number | string;
  name: string;
  value: string;
}

interface FloatingSelectProps {
  id?: string;
  name?: string;
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  required?: boolean;
  loading?: boolean;
}

export const FloatingSelect: React.FC<FloatingSelectProps> = ({
  id,
  name,
  label,
  value,
  onValueChange,
  options,
  placeholder = " ",
  required = false,
  loading = false,
}) => {
  return (
    <div className="relative">
      <Select value={value} onValueChange={onValueChange} name={name}>
        <SelectTrigger 
          id={id}
          className="peer input-floating h-14 pt-4 pb-1.5 px-3"
          aria-required={required}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.id} value={option.value}>
              {option.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <label
        htmlFor={id}
        className="floating-label"
      >
        {label}
      </label>
      {loading && (
        <p className="text-xs text-gray-500 mt-1">Chargement...</p>
      )}
    </div>
  );
}; 