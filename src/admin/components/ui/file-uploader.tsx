import * as React from "react";
import { useDropzone, FileRejection } from "react-dropzone";
import { cn } from "@/lib/utils";

interface FileUploaderProps {
  onDrop: (acceptedFiles: File[]) => void;
  onError?: (error: string) => void;
  accept?: Record<string, string[]>;
  multiple?: boolean;
  maxSize?: number;
  className?: string;
  children?: React.ReactNode;
}

export const FileUploader = React.forwardRef<HTMLDivElement, FileUploaderProps>(
  ({ 
    className, 
    onDrop, 
    onError,
    accept = {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif']
    },
    multiple = false,
    maxSize = 10485760, // 10MB
    children,
    ...props 
  }, ref) => {
    const handleDrop = React.useCallback(
      (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
        if (rejectedFiles.length > 0) {
          const errors = rejectedFiles.map(file => {
            if (file.errors[0]?.code === 'file-too-large') {
              return `File ${file.file.name} is too large. Max size is ${maxSize / 1024 / 1024}MB`;
            }
            if (file.errors[0]?.code === 'file-invalid-type') {
              return `File ${file.file.name} has invalid type. Accepted types are: ${Object.keys(accept).join(', ')}`;
            }
            return file.errors[0]?.message || 'Invalid file';
          });
          onError?.(errors.join('\n'));
          return;
        }
        onDrop(acceptedFiles);
      },
      [maxSize, accept, onDrop, onError]
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      onDrop: handleDrop,
      accept,
      multiple,
      maxSize,
    });

    return (
      <div
        {...getRootProps()}
        ref={ref}
        className={cn(
          "cursor-pointer transition-colors duration-200",
          isDragActive && "border-[#00897B] bg-[#00897B]/5",
          className
        )}
        {...props}
      >
        <input {...getInputProps()} />
        {children}
      </div>
    );
  }
);

FileUploader.displayName = "FileUploader"; 
