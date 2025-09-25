import React from "react";

interface FloatingInputProps {
  id: string;
  name: string;
  label: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
}

export const FloatingInput: React.FC<FloatingInputProps> = ({
  id,
  name,
  label,
  type = "text",
  value,
  onChange,
  required = false,
}) => {
  return (
    <div className="relative">
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        className="peer input-floating"
        placeholder=" "
      />
      <label
        htmlFor={id}
        className="floating-label"
      >
        {label}
      </label>
    </div>
  );
};
