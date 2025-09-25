import React, { useState, KeyboardEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon, PlusIcon } from '@heroicons/react/20/solid'
import { X } from 'lucide-react'

interface TagInputProps {
  label: string
  tags: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  maxTags?: number
  error?: string
  value: string[]
  className?: string
}

export const TagInput: React.FC<TagInputProps> = ({
  label,
  tags,
  onChange,
  placeholder = 'Add tag...',
  maxTags,
  error,
  value,
  className = ''
}) => {
  const [input, setInput] = useState('')

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && input.trim()) {
      e.preventDefault()
      onChange([...value, input.trim()])
      setInput('')
    }
  }

  const removeTag = (indexToRemove: number) => {
    onChange(value.filter((_, index) => index !== indexToRemove))
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">{label}</label>
      )}
      <div className="bg-white border rounded-lg p-3">
        <div className="flex flex-wrap gap-2 mb-3">
          {value.map((tag, index) => (
            <motion.span
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="inline-flex items-center gap-1.5 bg-[#008F8F]/10 text-[#008F8F] 
                       rounded-full px-3 py-1.5 text-sm font-medium"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(index)}
                className="hover:bg-[#008F8F]/20 rounded-full p-0.5 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="flex-1 h-10 rounded-lg border-0 bg-gray-50 px-3 py-2 text-sm 
                     focus:ring-2 focus:ring-[#008F8F]/20 transition-colors"
          />
          <button
            type="button"
            onClick={() => {
              if (input.trim()) {
                onChange([...value, input.trim()]);
                setInput('');
              }
            }}
            className="inline-flex items-center gap-1 bg-[#008F8F] text-white rounded-lg 
                     px-3 py-2 text-sm font-medium hover:bg-[#007A7A] transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            Ajouter
          </button>
        </div>
      </div>
    </div>
  )
} 