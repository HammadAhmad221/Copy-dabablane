import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { XMarkIcon, PhotoIcon } from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'

interface ImageItem {
  type: 'file'
  value: File
}


interface ImageUploadProps {
  onChange: (files: File[]) => void
  maxFiles: number
  label?: string
  currentImages: ImageItem[]
  onRemove?: (index: number) => void
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onChange,
  maxFiles = 5,
  label = 'Upload Images',
  currentImages = [],
  onRemove,

}) => {
  const [dragActive, setDragActive] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleFiles = (files: FileList | null) => {
    if (!files) return;

    const remainingSlots = maxFiles - currentImages.length;
    if (remainingSlots <= 0) {
      toast.error('Maximum ${maxFiles} files allowed');
      return;
    }

    const validFiles = Array.from(files).slice(0, remainingSlots).filter((file) => {
      // Check file type
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} must be an image file`);
        return false;
      }

      // Check file size (2MB limit)
      if (file.size > 2 * 1024 * 1024) {
        toast.error(`${file.name} must be less than 2MB`);
        return false;
      }

      return true;
    });

    if (validFiles.length > 0) {
      if (currentImages.length + validFiles.length > maxFiles) {
        toast.error(`Maximum ${maxFiles} images allowed`);
        return;
      }

      setImageFiles(prev => [...prev, ...validFiles]);
      setFormErrors(prev => ({ ...prev, images: '' }));
      onChange(validFiles);
    }
  };

  const getImageUrl = (item: ImageItem): string => {
    return URL.createObjectURL(item.value);
  };


  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div>
      <p>{label}</p>
      <p>{currentImages.length}/{maxFiles} images</p>
      <div className="grid grid-cols-4 gap-4">
        {currentImages.map((image, index) => (
          <div key={index} className="relative">
            <img
              src={getImageUrl(image)}
              alt={`Uploaded ${index}`}
              className="w-full h-auto"
            />
            {onRemove && (
              <button
                onClick={() => onRemove(index)}
                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600 transform hover:scale-110"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-8
          transition-colors duration-200 ease-in-out
          ${dragActive 
            ? 'border-teal-500 bg-teal-50' 
            : 'border-gray-300 hover:border-teal-500 hover:bg-gray-50'
          }
        `}
      >
        <input
          type="file"
          multiple
          accept="image/*"
          name="images[]"
          onChange={(e) => handleFiles(e.target.files)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"

        />
        <p>Glissez-déposez vos images ici ou cliquez pour télécharger.</p>
        <p>PNG, JPG, GIF jusqu'à 2MB</p>
      </div>
    </div>

  );
};
