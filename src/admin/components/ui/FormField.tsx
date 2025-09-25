import { cn } from '@/lib/utils'

interface FormFieldProps {
  label: string
  error?: string
  children: React.ReactNode
  className?: string
}

export const FormField = ({ label, error, children, className }: FormFieldProps) => {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label className="text-sm font-medium text-gray-700 block">
        {label}
      </label>
      {children}
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  )
} 
