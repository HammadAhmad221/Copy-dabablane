import React from "react";

interface FloatingTextareaProps {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  rows?: number;
}

export const FloatingTextarea: React.FC<FloatingTextareaProps> = ({
  id,
  name,
  label,
  value,
  onChange,
  rows = 4,
}) => {
  return (
    <div className="relative">
      <textarea
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        rows={rows}
        className="peer input-floating resize-none"
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
