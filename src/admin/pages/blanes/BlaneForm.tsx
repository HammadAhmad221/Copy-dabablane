import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Category } from "@/admin/lib/api/types/category";
import { Subcategory } from "@/admin/lib/api/types/subcategory";
import { City } from "@/admin/lib/api/types/city";
import { BlaneFormData, BlaneType } from "@/admin/lib/api/types/blane";
import { BlaneimgFormData } from "@/admin/lib/api/types/blaneImg";
import { BlanImgService } from "@/admin/lib/api/services/blanimgs";
import { BLANE_STATUS, type BlaneStatus, getStatusLabel } from "@/admin/lib/constants/status";
import { parsePhoneNumberFromAPI } from "@/user/lib/utils/phoneValidation";
import { HeartIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon } from "@heroicons/react/24/solid";
import { Input } from "@/admin/components/ui/input";
import { Textarea } from "@/admin/components/ui/textarea";
import { FormField } from "@/admin/components/ui/FormField";
import { useAuth } from "@/contexts/AuthContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/admin/components/ui/select";
import { TagInput } from "@/admin/components/ui/TagInput";
import { blaneApi } from "@/admin/lib/api/services/blaneService";
import { toast } from "react-hot-toast";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { BlaneImage } from "@/admin/lib/api/types/blaneImg";
import BlaneVisibilitySelector from "@/admin/components/forms/BlaneVisibilitySelector";
import {
  Home,
  Tag,
  Gift,
  ShoppingBag,
  User,
  Clock,
  MapPin,
  Calendar,
  Users,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Wallet,
  X,
} from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/admin/components/ui/carousel";
import { Dialog, DialogContent, DialogTrigger } from "@/admin/components/ui/dialog";
import { Switch } from "@/admin/components/ui/switch";
import { Checkbox } from "@/admin/components/ui/checkbox";
import { cityApi } from "@/admin/lib/api/services/cityService";
import { Button } from "@/admin/components/ui/button";
import { Label } from "@/admin/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/admin/components/ui/radio-group";
import { Tabs, TabsList, TabsTrigger } from "@/admin/components/ui/tabs";
import { Card, CardContent } from "@/admin/components/ui/card-blane";
import { z } from "zod";
import { DialogHeader, DialogTitle, DialogDescription } from "@/admin/components/ui/dialog";
import { PhoneInput } from '@/user/components/ui/PhoneInput';

// Define type for reservationType
type ReservationType = "instante" | "pre-reservation";

interface BlaneFormProps {
  categories: Category[];
  subcategories: Subcategory[];
  citiesList: City[];
  onSubmit: (data: FormData) => Promise<unknown>;
  initialData: BlaneFormData | null;
  onCancel?: () => void;
  existingImages?: BlaneImage[];
  onImageDelete?: (imageId: number) => Promise<void>;
  isDuplicating?: boolean;
  isEditing?: boolean;
  onCategoryChange?: (categoryId: number) => void;
}

// Add this type for image preview
interface ImagePreview {
  id: string;
  url: string | null;  // Allow null for url
  file?: File;
  isExisting?: boolean;
}

// Add these types based on the JSON structure
interface OrderType {
  stock: number;
  max_orders: number;
  livraison_in_city: number;
  livraison_out_city: number;
}

// Add proper type for form data
interface BlaneFormState extends BlaneFormData {
  images: File[];
  nombre_max_reservation: number;
  max_reservation_par_creneau: number;
  reservation_per_day?: number;
  order_per_day?: number;
  jours_creneaux: string[];
  dates: string[];
  dateRanges: Array<{ start: string; end: string }>;
  heure_debut: string;
  heure_fin: string;
  intervale_reservation: number;
  personnes_prestation: number;
  start_date: string;
  expiration_date: string | null;
  conditions: string;
  max_orders: number;
  livraison_in_city: number;
  livraison_out_city: number;
  advantages: string;
  partiel_field: number;
  tva: number;
  commerce_name: string;
  commerce_phone: string;
  is_digital: boolean;
  allow_out_of_city_delivery: boolean;
  type_time: "date" | "time";
  categories_id?: number | null;  // Make this optional
  visibility?: 'private' | 'public' | 'link';
  share_token?: string;
  share_url?: string;  // Add share_url property
  slug?: string;  // Add slug property
}

// Add this interface near the top of the file
interface FormErrors {
  [key: string]: string[];
}

const inputVariants = {
  focus: {
    scale: 1.02,
    boxShadow:
      "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  },
  blur: {
    scale: 1,
    boxShadow: "none",
  },
};

const labelVariants = {
  focus: {
    y: -25,
    scale: 0.85,
    color: "#0D9488",
    transition: { duration: 0.2 },
  },
  blur: {
    y: 0,
    scale: 1,
    color: "#374151",
    transition: { duration: 0.2 },
  },
};

const FormInput = ({
  label,
  type = "text",
  name,
  value,
  onChange,
  required = false,
}: {
  label: string;
  type: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required: boolean;
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(!!value);

  return (
    <motion.div className="relative pt-6 mb-4">
      <motion.label
        initial="blur"
        animate={isFocused || hasValue ? "focus" : "blur"}
        variants={labelVariants}
        className="absolute left-3 text-gray-700 cursor-text pointer-events-none transition-all duration-200"
      >
        {label}
      </motion.label>
      <motion.input
        type={type}
        name={name}
        value={value}
        onChange={(e) => {
          setHasValue(!!e.target.value);
          onChange?.(e);
        }}
        required={required}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        initial="blur"
        animate={isFocused ? "focus" : "blur"}
        variants={inputVariants}
        className="w-full px-3 py-2 bg-transparent border-b-2 border-gray-300 focus:border-teal-500 outline-none transition-colors duration-200"
      />
    </motion.div>
  );
};

const FormTextArea = ({
  label,
  name,
  value,
  onChange,
  rows = 4,
  required = false,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  rows: number;
  required: boolean;
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(!!value);

  return (
    <motion.div className="relative pt-6 mb-4">
      <motion.label
        initial="blur"
        animate={isFocused || hasValue ? "focus" : "blur"}
        variants={labelVariants}
        className="absolute left-3 text-gray-700 cursor-text pointer-events-none transition-all duration-200"
      >
        {label}
      </motion.label>
      <motion.textarea
        name={name}
        value={value}
        rows={rows}
        onChange={(e) => {
          setHasValue(!!e.target.value);
          onChange?.(e);
        }}
        required={required}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        initial="blur"
        animate={isFocused ? "focus" : "blur"}
        variants={inputVariants}
        className="w-full px-3 py-2 bg-transparent border-b-2 border-gray-300 focus:border-teal-500 outline-none transition-colors duration-200 resize-none"
      />
    </motion.div>
  );
};

const convertFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = reader.result as string;
      if (base64String.length > 255) {
        reject(new Error("Image URL is too long (max 255 characters)"));
        return;
      }
      resolve(base64String);
    };
    reader.onerror = (error) => reject(error);
  });
};

// Add this validation function near the other utility functions
// const isValidPhoneNumber = (phone: string): boolean => {
//   return /^212[5-7]\d{8}DH/.test(phone);
// };

// Define the validation schema
const blaneSchema = z.object({
  subcategories_id: z.number().nullable().optional(),
  categories_id: z.number().nullable().optional(),
  name: z
    .string()
    .min(1, "Name is required")
    .max(255, "Name must be less than 255 characters"),
  description: z.string().min(1, "Description is required"),
  commerce_name: z.string().optional(),
  price_current: z.number().min(0, "Current price is required"),
  price_old: z.number().min(0, "Old price is required"),
  city: z.string().min(1, "City is required"),
  status: z.enum(["active", "inactive", "expired", "waiting"]),
  type: z.enum(["reservation", "order"]),
  reservation_type: z.string().nullable().optional(),
  online: z.boolean().optional(),
  partiel: z.boolean().optional(),
  cash: z.boolean().optional(),
  on_top: z.boolean().nullable().optional(),
  start_day: z.string().nullable().optional(),
  end_day: z.string().nullable().optional(),
  stock: z.number().nullable().optional(),
  max_orders: z.number().nullable().optional(),
  livraison_in_city: z.number().nullable().optional(),
  livraison_out_city: z.number().nullable().optional(),
  start_date: z.string().min(1, "Start date is required"),
  expiration_date: z.string().nullable().optional(),
  jours_creneaux: z.array(z.string()).nullable().optional(),
  dates: z.array(z.string()).nullable().optional(),
  heure_debut: z.string().nullable().optional(),
  conditions: z.string().nullable().optional(),
  heure_fin: z.string().nullable().optional(),
  intervale_reservation: z.number().nullable().optional(),
  personnes_prestation: z.number().nullable().optional(),
  nombre_max_reservation: z.number().nullable().optional(),
  max_reservation_par_creneau: z.number().nullable().optional(),
  images: z.array(z.instanceof(File)).nullable().optional(),
  is_digital: z.boolean().optional(),
  allow_out_of_city_delivery: z.boolean().optional(),
  commerce_phone: z.string().optional(),
});

// Update the validateForm function
const validateForm = (formData: BlaneFormData, activeTab: "reservation" | "order"): FormErrors => {
  const errors: FormErrors = {};

  // Only validate name field
  if (!formData.name) {
    errors.name = ["Name is required"];
  }

  return errors;
};

// Add this utility function at the top of the file
const isNumeric = (value: string | number): boolean => {
  if (typeof value === 'number') return true;
  return /^\d*DH/.test(value);
};

// Add this function to normalize date range objects
const normalizeRangeObject = (range: Record<string, any>): { start: string; end: string } | null => {
  // Quick check for null or undefined
  if (!range) {
    console.warn("Received null or undefined range");
    return null;
  }

  // Handle deeply nested date range objects
  if (range.start?.start) {
    return {
      start: typeof range.start.start === 'string' ? range.start.start : range.start,
      end: typeof range.end?.end === 'string' ? range.end.end : range.end
    };
  }

  // Handle single-level nested objects
  if (range.start?.start && range.end?.end) {
    return {
      start: range.start.start,
      end: range.end.end
    };
  }

  // Already has the right structure
  if (typeof range.start === 'string' && typeof range.end === 'string') {
    return {
      start: range.start,
      end: range.end
    };
  }

  console.warn("Could not normalize invalid date range:", JSON.stringify(range));
  return null;
};

const BlaneForm = ({
  categories,
  subcategories,
  citiesList,
  onSubmit,
  initialData,
  onCancel,
  existingImages,
  onImageDelete,
  isDuplicating,
  isEditing,
  onCategoryChange,
}: BlaneFormProps) => {
  const { user } = useAuth();
  const isUserRole = user?.role === 'user';
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [selectedCategory, setSelectedCategory] = useState<string>(
    initialData?.categories_id?.toString() || ""
  );
  const [isOrder, setIsOrder] = useState(initialData?.type === "order");
  const [isLiked, setIsLiked] = useState(false);
  const [status, setStatus] = useState<BlaneStatus>(
    initialData?.status || BLANE_STATUS.EXPIRED
  );
  const [activeTab, setActiveTab] = useState<"reservation" | "order">(
    initialData?.type || "reservation"
  );
  const [formData, setFormData] = useState<BlaneFormState>({
    ...initialData,
    type: initialData?.type || "reservation",
    name: initialData?.name || "",
    description: initialData?.description || "",
    advantages: initialData?.advantages || "",
    city: initialData?.city || "",
    categories_id: initialData?.categories_id || null,
    subcategories_id: initialData?.subcategories_id || null,
    price_current: initialData?.price_current || 0,
    price_old: initialData?.price_old || 0,
    conditions: initialData?.conditions || "",
    status: initialData?.status || "active",
    online: initialData?.online || false,
    partiel: initialData?.partiel || false,
    cash: initialData?.cash || false,
    on_top: initialData?.on_top || false,
    is_digital: initialData?.is_digital ?? false,
    allow_out_of_city_delivery: initialData?.allow_out_of_city_delivery ?? false,
    stock: initialData?.stock || 0,
    start_date: initialData?.start_date || "",
    expiration_date: initialData?.expiration_date || "",
    images: [],
    reservation_type: initialData?.reservation_type as ReservationType || "instante" as ReservationType,
    nombre_max_reservation: initialData?.nombre_max_reservation || 0,
    max_reservation_par_creneau: initialData?.max_reservation_par_creneau || 0,
    reservation_per_day: initialData?.reservation_per_day || 0,
    order_per_day: initialData?.order_per_day || 0,
    jours_creneaux: Array.isArray(initialData?.jours_creneaux)
      ? initialData.jours_creneaux
      : initialData?.jours_creneaux
        ? JSON.parse(initialData.jours_creneaux)
        : [],
    dates: initialData?.dates || [],
    dateRanges: initialData?.dateRanges || [],
    heure_debut: initialData?.heure_debut || "",
    heure_fin: initialData?.heure_fin || "",
    intervale_reservation: initialData?.intervale_reservation || 60,
    personnes_prestation: initialData?.personnes_prestation || 0,
    max_orders: initialData?.max_orders || 0,
    livraison_in_city: initialData?.livraison_in_city || 0,
    livraison_out_city: initialData?.livraison_out_city || 0,
    partiel_field: initialData?.partiel_field || 0,
    tva: initialData?.tva ?? 0,
    commerce_name: initialData?.commerce_name || "",
    commerce_phone: initialData?.commerce_phone || "",
    type_time: initialData?.type_time || "time",
    visibility: initialData?.visibility || 'private',
    share_token: initialData?.share_token || undefined,
  });
  const [conditions, setConditions] = useState<string[]>(
    initialData?.conditions?.split("\n") || []
  );
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReservation, setIsReservation] = useState(false);
  const [selectedTimeSlotType, setSelectedTimeSlotType] = useState<
    "horaire" | "journaliere"
  >("horaire");
  const [modalite, setModalite] = useState<"prix" | "avantage">("prix");
  const [previewCount, setPreviewCount] = useState(1);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [activeTagSection, setActiveTagSection] = useState<
    "advantages" | "conditions"
  >("advantages");
  const [advantageInput, setAdvantageInput] = useState("");
  const [conditionInput, setConditionInput] = useState("");
  const [cities, setCities] = useState<City[]>([]);
  const [loadingCities, setLoadingCities] = useState(true);
  const [datePeriodInput, setDatePeriodInput] = useState("");
  const [datePeriodStartInput, setDatePeriodStartInput] = useState("");
  const [datePeriodEndInput, setDatePeriodEndInput] = useState("");

  // Date range state
  const [dateRanges, setDateRanges] = useState<Array<{ start: string; end: string }>>(
    Array.isArray(initialData?.dateRanges)
      ? initialData.dateRanges
        .map(range => normalizeRangeObject(range as Record<string, unknown>))
        .filter((r): r is { start: string; end: string } => r !== null)
      : []
  );
  const [currentRange, setCurrentRange] = useState<{ start: string; end: string }>({
    start: '',
    end: ''
  });

  // Also force update the DOM by adding a forceUpdate flag to the component
  const [forceUpdate, setForceUpdate] = useState<number>(0);

  // Initialize date ranges from props when component mounts or initialData changes
  useEffect(() => {
    if (initialData?.dateRanges && Array.isArray(initialData.dateRanges)) {
      // Make sure each range object has start and end properties
      const normalizedRanges = initialData.dateRanges
        .map(range => normalizeRangeObject(range as Record<string, unknown>))
        .filter((range): range is { start: string; end: string } => range !== null);

      setDateRanges(normalizedRanges);
    }
  }, [initialData]);

  // When formData.dateRanges changes, ensure it's synchronized with dateRanges state
  useEffect(() => {
    // Check if formData.dateRanges has values but dateRanges state doesn't
    if (formData.dateRanges?.length > 0 && dateRanges.length === 0) {
      setDateRanges(formData.dateRanges);
    }
  }, [formData.dateRanges, dateRanges]);

  useEffect(() => {
    setCities(citiesList);
    setLoadingCities(false);
  }, [citiesList]);

  useEffect(() => {
    if (!isOrder) {
      setFormData((prev) => ({
        ...prev,
        stock: 0,
      }));
    }
  }, [isOrder]);

  useEffect(() => {
    const images = existingImages?.map((img) => img.imageLink) || [];
    setSelectedImages(images);
  }, [existingImages]);

  useEffect(() => {
    return () => {
      // Cleanup preview URLs when component unmounts
      selectedImages.forEach((url) => {
        if (typeof url === 'string' && url?.startsWith("blob:")) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [selectedImages]);

  // Effect to handle existing images
  useEffect(() => {
    if (existingImages?.length) {
      const existingPreviews: ImagePreview[] = existingImages.map((img) => ({
        id: img.id.toString(),
        url: img.imageLink || '',  // Add fallback empty string
        isExisting: true,
      }));
      setImagePreviews(existingPreviews);
    }
  }, [existingImages]);

  // Add debug logging for subcategories prop changes
  useEffect(() => {
  }, [subcategories]);

  // Update the handleAddDateRange function to check if we're in edit mode
  const handleAddDateRange = () => {
    const startDateString = datePeriodStartInput.trim();
    const endDateString = datePeriodEndInput.trim();

    if (!startDateString || !endDateString) {
      toast.error("Please select both start and end dates");
      return;
    }

    const startDate = new Date(startDateString);
    const endDate = new Date(endDateString);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      toast.error("Invalid date format");
      return;
    }

    if (startDate > endDate) {
      toast.error("End date must be after start date");
      return;
    }

    // Check if the date range is within the Blane's overall date range
    const blaneStartDate = formData.start_date ? new Date(formData.start_date) : null;
    const blaneEndDate = formData.expiration_date ? new Date(formData.expiration_date) : null;

    if (blaneStartDate && startDate < blaneStartDate) {
      toast.error("Date range cannot start before the Blane's start date");
      return;
    }

    if (blaneEndDate && endDate > blaneEndDate) {
      toast.error("Date range cannot end after the Blane's expiration date");
      return;
    }

    // Get the normalized existing ranges
    const normalizedExistingRanges = dateRanges.map(range => range).filter(r => r !== null);

    // Check for exact duplicates
    const isDuplicate = normalizedExistingRanges.some(
      range => range.start === startDateString && range.end === endDateString
    );

    if (isDuplicate) {
      toast.error("This exact date range already exists");
      return;
    }

    // Add the new date range
    const newRange = { start: startDateString, end: endDateString };
    setDateRanges([...normalizedExistingRanges, newRange]);

    // Also update individual dates for backward compatibility
    const allDates: string[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      allDates.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    setFormData(prev => ({
      ...prev,
      dates: [...prev.dates, ...allDates]
    }));

    // Clear inputs
    setDatePeriodStartInput("");
    setDatePeriodEndInput("");
  };

  // Update the removeDateRange function for better reliability
  const removeDateRange = (index: number) => {
    try {
      // Get the range being removed
      const rangeToRemove = dateRanges[index];
      if (!rangeToRemove) {
        console.error(`Cannot find date range at index ${index}`);
        toast.error("Erreur: période non trouvée");
        return;
      }
      // First normalize the range to ensure we have a valid object
      const normalizedRange = normalizeRangeObject(rangeToRemove);
      if (!normalizedRange) {
        console.warn("Invalid date range encountered, removing from array only");
        // Just remove the range from the array without trying to process dates
        const newRanges = [...dateRanges];
        newRanges.splice(index, 1);

        // Clear and set to force a re-render
        setDateRanges([]);
        setTimeout(() => {
          setDateRanges(newRanges);
          setForceUpdate(prev => prev + 1);
        }, 0);

        setFormData(prev => ({
          ...prev,
          dateRanges: newRanges
        }));
        return;
      }

      // Generate all dates in the range to remove
      const datesToRemove: string[] = [];
      const start = new Date(normalizedRange.start);
      const end = new Date(normalizedRange.end);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        console.warn("Invalid date range encountered, removing from array only");
        // Just remove the range from the array without trying to process dates
        const newRanges = [...dateRanges];
        newRanges.splice(index, 1);

        // Clear and set to force a re-render
        setDateRanges([]);
        setTimeout(() => {
          setDateRanges(newRanges);
          setForceUpdate(prev => prev + 1);
        }, 0);

        setFormData(prev => ({
          ...prev,
          dateRanges: newRanges
        }));
        return;
      }

      // Generate individual dates in the range
      const currentDate = new Date(start);
      while (currentDate <= end) {
        datesToRemove.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
      }
      // Create a new array without the removed range
      const remainingRanges = [...dateRanges];
      remainingRanges.splice(index, 1);
      // Calculate the remaining dates from the other ranges
      const remainingDates = new Set<string>();

      // Re-add all dates from remaining ranges
      remainingRanges.forEach(range => {
        // First normalize the range
        const normalizedRange = normalizeRangeObject(range);
        if (!normalizedRange) return;

        const rangeStart = new Date(normalizedRange.start);
        const rangeEnd = new Date(normalizedRange.end);

        if (!isNaN(rangeStart.getTime()) && !isNaN(rangeEnd.getTime())) {
          const rangeDateCurrent = new Date(rangeStart);
          while (rangeDateCurrent <= rangeEnd) {
            remainingDates.add(rangeDateCurrent.toISOString().split('T')[0]);
            rangeDateCurrent.setDate(rangeDateCurrent.getDate() + 1);
          }
        }
      });
      // Update dateRanges state in a way that forces a re-render
      setDateRanges([]);
      setTimeout(() => {
        setDateRanges(remainingRanges);
        setForceUpdate(prev => prev + 1);
      }, 0);

      // Also update the form data
      setFormData(prev => ({
        ...prev,
        dateRanges: remainingRanges.slice(), // Create a new array reference
        dates: Array.from(remainingDates)
      }));

      toast.success("Période supprimée avec succès");
    } catch (error) {
      console.error("Error removing date range:", error);
      toast.error("Erreur lors de la suppression de la période");
    }
  };

  // Update the handleSubmit function
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate form data
      const errors = validateForm(formData, activeTab);
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        setIsSubmitting(false);
        toast.error("Please fix form errors.");
        return;
      }

      // Create FormData object for submission
      const submitFormData = new FormData();

      // Base fields
      submitFormData.set("name", formData.name);
      submitFormData.set("description", formData.description);
      submitFormData.set("categories_id", formData.categories_id?.toString() || "");
      submitFormData.set(
        "subcategories_id",
        formData.subcategories_id?.toString() || ""
      );
      submitFormData.set("price_current", formData.price_current.toString());
      submitFormData.set("price_old", formData.price_old.toString());
      submitFormData.set("advantages", formData.advantages || "");
      submitFormData.set("conditions", formData.conditions || "");
      submitFormData.set("commerce_name", formData.commerce_name || "");
      submitFormData.set("commerce_phone", formData.commerce_phone || "");
      submitFormData.set("city", formData.city);
      submitFormData.set("type", formData.type);
      submitFormData.set("status", formData.status);
      submitFormData.set("online", formData.online ? "1" : "0");
      submitFormData.set("partiel", formData.partiel ? "1" : "0");
      submitFormData.set("cash", formData.cash ? "1" : "0");
      submitFormData.set("on_top", formData.on_top ? "1" : "0");
      submitFormData.set("is_digital", formData.is_digital ? "1" : "0");
      submitFormData.set("allow_out_of_city_delivery", formData.allow_out_of_city_delivery ? "1" : "0");
      submitFormData.set("visibility", formData.visibility || "private");
      submitFormData.set("share_token", formData.share_token || "");

      // Critical dates that were missing
      submitFormData.set("start_date", formData.start_date);
      submitFormData.set("expiration_date", formData.expiration_date || "");

      // Reservation-specific fields
      if (formData.type === "reservation") {
        submitFormData.set("nombre_max_reservation", formData.nombre_max_reservation.toString());
        submitFormData.set("max_reservation_par_creneau", formData.max_reservation_par_creneau.toString());
        submitFormData.set("reservation_per_day", (formData.reservation_per_day || 0).toString());
        submitFormData.set("intervale_reservation", formData.intervale_reservation.toString());
        submitFormData.set("personnes_prestation", formData.personnes_prestation.toString());
        submitFormData.set("reservation_type", formData.reservation_type || "instante");

        if (formData.heure_debut) {
          submitFormData.set("heure_debut", formData.heure_debut);
        }

        if (formData.heure_fin) {
          submitFormData.set("heure_fin", formData.heure_fin);
        }
      }

      // Order-specific fields
      if (formData.type === "order") {
        submitFormData.set("stock", formData.stock.toString());
        submitFormData.set("max_orders", formData.max_orders.toString());
        submitFormData.set("order_per_day", (formData.order_per_day || 0).toString());
        submitFormData.set("livraison_in_city", formData.livraison_in_city.toString());
        submitFormData.set("livraison_out_city", formData.livraison_out_city.toString());
      }

      // Payment-related fields
      submitFormData.set("partiel_field", formData.partiel_field.toString());
      submitFormData.set("tva", formData.tva.toString());

      // Handle date type selection
      submitFormData.set("type_time", formData.type_time);

      // Handle date ranges
      if (formData.type_time === "date" && dateRanges.length > 0) {
        // This matches the format expected by the backend: [{"start":"2025-04-15","end":"2025-04-16"},...]
        const dateRangesJson = JSON.stringify(dateRanges);
        submitFormData.set("dates", dateRangesJson);

        // Store the dateRanges separately as well for internal use
        submitFormData.set("dateRanges", dateRangesJson);

      } else if (formData.type_time === "time") {
        // Handle individual dates only for time mode
        if (formData.dates.length > 0) {
          formData.dates.forEach((date, index) => {
            submitFormData.append(`dates[${index}]`, date);
          });
        }
      }

      // Handle time slots
      if (formData.type_time === "time" && formData.jours_creneaux.length > 0) {
        formData.jours_creneaux.forEach((jour, index) => {
          submitFormData.append(`jours_creneaux[${index}]`, jour);
        });
      }

      imageFiles.forEach((file) => submitFormData.append("images[]", file));

      // Submit form and handle API response
      const response = await onSubmit(submitFormData);

      if (response?.errors) {
        // Log validation errors from server
        console.error("Server validation errors:", response.errors);

        // Convert API errors to FormErrors format
        const apiErrors: FormErrors = {};
        Object.entries(response.errors).forEach(([field, messages]) => {
          if (Array.isArray(messages)) {
            apiErrors[field] = messages;
          } else if (typeof messages === "string") {
            apiErrors[field] = [messages];
          }
        });

        setFormErrors(apiErrors);

        // Show toast notifications for each error
        Object.entries(apiErrors).forEach(([field, messages]) => {
          if (Array.isArray(messages) && messages.length > 0) {
            toast.error(`${field}: ${messages[0]}`);
          }
        });
      } else {
        toast.success("Formulaire soumis avec succès");
        setFormErrors({});
      }
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error("Erreur lors de la soumission du formulaire");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArrayUpdate = (
    field: "jours_creneaux" | "dates",
    value: string[]
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Update the handleChange function to handle numeric text inputs
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;

    // Handle numeric fields
    if (
      [
        "stock",
        "price_current",
        "price_old",
        "intervale_reservation",
        "personnes_prestation",
        "nombre_max_reservation",
        "max_reservation_par_creneau",
        "reservation_per_day",
        "order_per_day",
        "max_orders",
        "livraison_in_city",
        "livraison_out_city"
      ].includes(name)
    ) {
      // Only update if the value is numeric or empty
      if (value === "" || isNumeric(value)) {
        setFormData((prev) => ({
          ...prev,
          [name]: value === "" ? 0 : Number(value),
        }));
      }
      return;
    }

    // Rest of the handleChange function remains the same
    if (type === "datetime-local") {
      // Handle datetime inputs
      setFormData((prev) => ({
        ...prev,
        [name]: value ? value : null,
      }));
    } else if (type === "time") {
      // Handle time inputs
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleStatusChange = async (newStatus: BlaneStatus) => {
    if (initialData?.id) {
      try {
        await blaneApi.updateStatusBlane(initialData.id.toString(), {
          status: newStatus,
        });
        setStatus(newStatus);
      } catch (error) {
        toast.error("Failed to update status");
      }
    } else {
      setStatus(newStatus);
    }
  };

  // Updated file handling function
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    // Validate files
    const validFiles = files.filter((file) => {
      if (!file.type.startsWith("image/")) {
        toast.error("Seules les images sont autorisées");
        return false;
      }
      if (file.size > 2 * 1024 * 1024) {
        // 2MB limit
        toast.error("Les images doivent être inférieures à 2MB");
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      const newPreviews = validFiles.map((file) => ({
        id: `${Date.now()}-${file.name}`,
        url: URL.createObjectURL(file),
        file,
      }));

      setImageFiles((prev) => [...prev, ...validFiles]);
      setImagePreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  // Handle image deletion
  const handleImageDelete = async (preview: ImagePreview) => {
    try {
      if (preview.isExisting && onImageDelete) {
        await onImageDelete(parseInt(preview.id));
      }

      if (preview.file) {
        setImageFiles((prev) => prev.filter((f) => f !== preview.file));
      }

      setImagePreviews((prev) => prev.filter((p) => p.id !== preview.id));

      if (typeof preview.url === 'string' && preview.url?.startsWith("blob:")) {
        URL.revokeObjectURL(preview.url);
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error("Failed to delete image");
    }
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);

    // Reset subcategory in formData
    setFormData((prev) => ({
      ...prev,
      categories_id: value === "null" ? null : Number(value),
      subcategories_id: null,
    }));

    // Call parent's onCategoryChange callback
    if (onCategoryChange && value !== "null") {
      onCategoryChange(Number(value));
    }
  };

  const handleTagChange = (
    type: "advantages" | "conditions",
    newTags: string[]
  ) => {
    if (type === "advantages") {
      setFormData((prev) => ({
        ...prev,
        advantages: newTags.join("\n"),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        conditions: newTags.join("\n"),
      }));
    }
  };

  const incrementCount = () =>
    setPreviewCount((prev) => Math.min(prev + 1, 10));
  const decrementCount = () => setPreviewCount((prev) => Math.max(prev - 1, 1));

  const handlePreviewClick = (index: number) => {
    setSelectedImageIndex(index);
    setIsPreviewOpen(true);
  };

  const handleCheckboxChange = (day: string) => {
    setFormData((prev) => {
      const updatedDays = prev.jours_creneaux.includes(day)
        ? prev.jours_creneaux.filter((d) => d !== day)
        : [...prev.jours_creneaux, day];
      return { ...prev, jours_creneaux: updatedDays };
    });
  };

  const handleAddDatePeriod = () => {
    if (datePeriodInput) {
      setFormData((prev) => ({
        ...prev,
        dates: [...prev.dates, datePeriodInput],
      }));
      setDatePeriodInput("");
    }
  };

  const handleRemoveDatePeriod = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      dates: prev.dates.filter((_, i) => i !== index),
    }));
  };

  const formatDateDisplay = (dateString: string) => {
    try {
      // Handle various date formats
      const date = new Date(dateString);

      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.warn("Invalid date format:", dateString);
        return "Invalid date";
      }

      // Format the date in French format (DD/MM/YYYY)
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();

      return `${day}/${month}/${year}`;
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  };

  // Add these handler functions for input changes that were previously inline
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNumericInputChange = (field: string, value: string) => {
    if (isNumeric(value) || value === "") {
      setFormData(prev => ({
        ...prev,
        [field]: value === "" ? 0 : Number(value),
      }));
    }
  };

  // Add handlers for date period inputs
  const handleDatePeriodStartChange = (value: string) => {
    setDatePeriodStartInput(value);
  };

  const handleDatePeriodEndChange = (value: string) => {
    setDatePeriodEndInput(value);
  };

  // Add handler for force update
  const incrementForceUpdate = () => {
    setForceUpdate(prev => prev + 1);
  };

  // Update the handleVisibilityChange function to store the token and share URL
  const handleVisibilityChange = (newVisibility: 'private' | 'public' | 'link', shareToken?: string, shareUrl?: string) => {
    setFormData(prev => ({
      ...prev,
      visibility: newVisibility,
      share_token: shareToken || undefined,
      share_url: shareUrl || undefined,
    }));
  };

  // Add state for phone input
  const [phoneError, setPhoneError] = useState<string>('');

  // Parse phone number from API if available
  const parsedPhone = initialData?.commerce_phone ? parsePhoneNumberFromAPI(initialData.commerce_phone) : { countryCode: '212', phoneNumber: '' };
  const [countryCode, setCountryCode] = useState(parsedPhone.countryCode);
  const [phoneNumber, setPhoneNumber] = useState(parsedPhone.phoneNumber);

  // Update phone handling
  const handlePhoneValidation = (result: { isValid: boolean; errorMessage?: string; formattedNumber?: string }) => {
    setPhoneError(result.errorMessage || '');
    if (result.isValid && result.formattedNumber) {
      // Keep the + sign but remove spaces, then save to formData
      const cleanNumber = result.formattedNumber.replace(/\s/g, '');
      handleInputChange("commerce_phone", cleanNumber);
    }
  };

  // Update phone number when country code or phone number changes
  useEffect(() => {
    const fullNumber = `+${countryCode}${phoneNumber}`;
    handleInputChange("commerce_phone", fullNumber);
  }, [countryCode, phoneNumber]);

  if (!categories || !subcategories || !cities) {
    return <div>Loading...</div>;
  }

  return (
    <div className="">
      <div className="flex justify-between mb-4 items-center bg-white px-6 py-3 rounded-lg">
        <h1 className="text-2xl font-bold text-gray-800">
          {isDuplicating ? "Duplicate Blane" : initialData ? "Edit Blane" : "Create Blane"}
        </h1>
        <Tabs
          value={activeTab}
          onValueChange={(value) => {
            setActiveTab(value as "reservation" | "order");
            setFormData((prev) => ({
              ...prev,
              type: value as "reservation" | "order",
            }));
          }}
          className="w-[300px]"
        >
          <TabsList className="grid w-full grid-cols-2 mb-4 bg-white">
            <TabsTrigger
              value="reservation"
              className="p-3 mr-4 border data-[state=active]:bg-[#197874] data-[state=active]:text-white"
              disabled={isEditing || isDuplicating}
            >
              Réservation
            </TabsTrigger>
            <TabsTrigger
              value="order"
              className="p-3 border data-[state=active]:bg-[#197874] data-[state=active]:text-white"
              disabled={isEditing || isDuplicating}
            >
              Order
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid lg:grid-cols-[1fr,400px] gap-6">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <form className="space-y-8" onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date début</Label>
                    <div className="relative">
                      <Input
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => handleInputChange("start_date", e.target.value)}
                        className="w-full"
                      />
                      <Calendar className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Date fin</Label>
                    <div className="relative">
                      <Input
                        type="date"
                        value={formData.expiration_date || ""}
                        onChange={(e) => handleInputChange("expiration_date", e.target.value)}
                        className="w-full"
                        min={formData.start_date}
                      />
                      <Calendar className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Titre</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      className="w-full"
                      placeholder="Titre du Blane"
                    />
                    {formErrors.name && formErrors.name.length > 0 && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.name[0]}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Catégorie</Label>
                    <Select
                      value={formData.categories_id ? String(formData.categories_id) : undefined}
                      onValueChange={handleCategoryChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une catégorie (optionnel)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="null">Aucune catégorie</SelectItem>
                        {categories.map((category) => (
                          <SelectItem
                            key={category.id}
                            value={String(category.id)}
                          >
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Sous-catégorie</Label>
                    <Select
                      value={formData.subcategories_id ? String(formData.subcategories_id) : "null"}
                      onValueChange={(value) =>
                        setFormData({ ...formData, subcategories_id: value === "null" ? null : Number(value) })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une sous-catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="null">Aucune sous-catégorie</SelectItem>
                        {subcategories.map((subcategory) => (
                          <SelectItem
                            key={subcategory.id}
                            value={String(subcategory.id)}
                          >
                            {subcategory.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Ville</Label>
                    <Select
                      value={formData.city}
                      onValueChange={(value) =>
                        setFormData({ ...formData, city: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une ville" />
                      </SelectTrigger>
                      <SelectContent>
                        {loadingCities ? (
                          <SelectItem value="loading">Chargement...</SelectItem>
                        ) : (
                          cities.map((city) => (
                            <SelectItem
                              key={city.id}
                              value={city.name.toString()}
                            >
                              {city.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Nom du commerce</Label>
                  <Input
                    type="text"
                    value={formData.commerce_name || ''}
                    onChange={(e) => handleInputChange("commerce_name", e.target.value)}
                    className="w-full"
                    placeholder="Nom du commerce (optionnel)"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Téléphone du commerce</Label>
                  <PhoneInput
                    countryCode={countryCode}
                    phoneNumber={phoneNumber}
                    onCountryCodeChange={(newCode) => {
                      setCountryCode(newCode);
                      // Update the full phone number when country code changes
                      const fullNumber = newCode + phoneNumber;
                      handleInputChange("commerce_phone", fullNumber);
                    }}
                    onPhoneNumberChange={(value) => {
                      setPhoneNumber(value);
                      // Always combine country code with phone number when saving
                      const fullNumber = value.startsWith('+')
                        ? value.replace(/[\s+]/g, '')
                        : countryCode + value.replace(/\D/g, '');
                      handleInputChange("commerce_phone", fullNumber);
                    }}
                    onValidationChange={handlePhoneValidation}
                    className="w-full"
                  />
                  {phoneError && (
                    <p className="text-sm text-red-500">{phoneError}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Description du BLANE"
                    className="min-h-[100px] w-full"
                  />
                </div>
              </div>


              <div className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Prix original</Label>
                    <Input
                      type="text"
                      value={formData.price_old === 0 ? "" : formData.price_old.toString()}
                      onChange={(e) => handleNumericInputChange("price_old", e.target.value)}
                      className="w-full"
                      placeholder="Prix original"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Prix réduit</Label>
                    <Input
                      type="text"
                      value={formData.price_current === 0 ? "" : formData.price_current.toString()}
                      onChange={(e) => handleNumericInputChange("price_current", e.target.value)}
                      className="w-full"
                      placeholder="Prix réduit"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Avantages</Label>
                <Input
                  type="text"
                  value={formData.advantages}
                  onChange={(e) => handleInputChange("advantages", e.target.value)}
                  className="w-full"
                  placeholder="Avantages du BLANE"
                />
              </div>
              <div className="space-y-2">
                <Label>Conditions</Label>
                <Input
                  type="text"
                  value={formData.conditions}
                  onChange={(e) => handleInputChange("conditions", e.target.value)}
                  className="w-full"
                  placeholder="Conditions du BLANE"
                />
              </div>

              {activeTab === "order" && (
                <div className="space-y-4 mt-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.is_digital}
                      onCheckedChange={(checked) => handleInputChange("is_digital", checked)}
                    />
                    <Label>Digital (produit numérique)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.allow_out_of_city_delivery}
                      onCheckedChange={(checked) => handleInputChange("allow_out_of_city_delivery", checked)}
                    />
                    <Label>Allow out of city delivery</Label>
                  </div>
                </div>
              )}

              {activeTab === "reservation" ? (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <Label>Type de temps</Label>
                    <RadioGroup
                      value={formData.type_time}
                      onValueChange={(value) => handleInputChange("type_time", value as "date" | "time")}
                    >
                      <div className="flex gap-4">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="time" id="time-type" />
                          <Label htmlFor="time-type">Plage horaire</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem
                            value="date"
                            id="date-type"
                          />
                          <Label htmlFor="date-type">
                            Plage journalière
                          </Label>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>

                  {formData.type_time === "time" ? (
                    <>
                      <div className="space-y-4">
                        <Label>Créneaux horaires</Label>
                        <div className="flex flex-wrap gap-4">
                          {[
                            "Lundi",
                            "Mardi",
                            "Mercredi",
                            "Jeudi",
                            "Vendredi",
                            "Samedi",
                            "Dimanche",
                          ].map((day) => (
                            <div key={day} className="flex items-center space-x-2">
                              <Checkbox
                                id={day}
                                checked={formData.jours_creneaux.includes(day)}
                                onCheckedChange={() => handleCheckboxChange(day)}
                              />
                              <Label htmlFor={day}>{day}</Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Heure début</Label>
                            <Input
                              type="time"
                              value={formData.heure_debut}
                              onChange={(e) => handleInputChange("heure_debut", e.target.value)}
                              className="w-full"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Heure fin</Label>
                            <Input
                              type="time"
                              value={formData.heure_fin}
                              onChange={(e) => handleInputChange("heure_fin", e.target.value)}
                              className="w-full"
                              min={formData.heure_debut}
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <Label>Périodes de dates</Label>
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-4 mb-2">
                          <div className="space-y-1">
                            <Label>Jour début</Label>
                            <div className="relative">
                              <Input
                                type="date"
                                placeholder="dd/mm/yyyy"
                                className="w-full"
                                value={datePeriodStartInput || ""}
                                onChange={(e) => handleDatePeriodStartChange(e.target.value)}
                              />
                              <Calendar className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label>Jour fin</Label>
                            <div className="relative">
                              <Input
                                type="date"
                                placeholder="dd/mm/yyyy"
                                className="w-full"
                                value={datePeriodEndInput || ""}
                                min={datePeriodStartInput}
                                onChange={(e) => handleDatePeriodEndChange(e.target.value)}
                              />
                              <Calendar className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                            </div>
                          </div>
                        </div>

                        <Button
                          type="button"
                          onClick={handleAddDateRange}
                          disabled={!datePeriodStartInput || !datePeriodEndInput}
                          className="mt-2 w-full"
                        >
                          Ajouter cette période
                        </Button>

                        {/* Display date ranges with a dedicated render function for clarity */}
                        {dateRanges.length > 0 ? (
                          <div className="flex flex-col gap-2 mt-4" key={`date-ranges-container-${dateRanges.length}-${forceUpdate}`}>
                            {/* Render each individual date range */}
                            {dateRanges.map((range, index) => {
                              // Normalize the range to ensure proper structure
                              const normalizedRange = normalizeRangeObject(range);

                              // Skip invalid ranges
                              if (!normalizedRange) {
                                console.warn(`Cannot normalize range at index ${index}:`, JSON.stringify(range));
                                return null;
                              }

                              // Ensure we have valid start and end dates
                              const startDate = new Date(normalizedRange.start);
                              const endDate = new Date(normalizedRange.end);
                              const isValidRange = !isNaN(startDate.getTime()) && !isNaN(endDate.getTime());

                              if (!isValidRange) {
                                console.warn(`Invalid date range at index ${index} after normalization:`, JSON.stringify(normalizedRange));
                                return null;
                              }

                              // Generate a unique key for this item based on all available information
                              const itemKey = `date-range-${index}-${normalizedRange.start}-${normalizedRange.end}-${forceUpdate}`;

                              // Return the range item
                              return (
                                <div
                                  key={itemKey}
                                  className="flex items-center justify-between bg-gray-100 p-3 rounded-md w-full"
                                >
                                  <span>{formatDateDisplay(normalizedRange.start)} - {formatDateDisplay(normalizedRange.end)}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      removeDateRange(index);
                                      incrementForceUpdate();
                                    }}
                                    className="text-red-500"
                                    aria-label="Supprimer"
                                  >
                                    <X className="h-5 w-5" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 mt-3">Aucune période de dates ajoutée</p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-4">
                      {formData.type_time !== "date" && (
                        <div className="space-y-2">
                          <Label>Intervalle de réservation (minutes)</Label>
                          <Input
                            type="text"
                            value={formData.intervale_reservation === 0 ? 0 : formData.intervale_reservation.toString()}
                            onChange={(e) => handleNumericInputChange("intervale_reservation", e.target.value)}
                            className="w-full"
                            placeholder="Intervalle de réservation"
                          />
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label>Personnes par prestation</Label>
                        <Input
                          type="text"
                          value={formData.personnes_prestation === 0 ? "" : formData.personnes_prestation.toString()}
                          onChange={(e) => handleNumericInputChange("personnes_prestation", e.target.value)}
                          className="w-full"
                          placeholder="Personnes par prestation"
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Nombre max de réservation</Label>
                        <Input
                          type="text"
                          value={formData.nombre_max_reservation === 0 ? "" : formData.nombre_max_reservation.toString()}
                          onChange={(e) => handleNumericInputChange("nombre_max_reservation", e.target.value)}
                          className="w-full"
                          placeholder="Nombre max de réservation"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Max réservation par créneau</Label>
                        <Input
                          type="text"
                          value={formData.max_reservation_par_creneau === 0 ? "" : formData.max_reservation_par_creneau.toString()}
                          onChange={(e) => handleNumericInputChange("max_reservation_par_creneau", e.target.value)}
                          className="w-full"
                          placeholder="Max réservation par créneau"
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Reservation per day</Label>
                        <Input
                          type="text"
                          value={formData.reservation_per_day === 0 ? "" : formData.reservation_per_day?.toString() || ""}
                          onChange={(e) => handleNumericInputChange("reservation_per_day", e.target.value)}
                          className="w-full"
                          placeholder="Reservation per day"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Stock</Label>
                      <Input
                        type="text"
                        value={formData.stock === 0 ? "" : formData.stock.toString()}
                        onChange={(e) => handleNumericInputChange("stock", e.target.value)}
                        className="w-full"
                        placeholder="Quantité en stock"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Commandes max</Label>
                      <Input
                        type="text"
                        value={formData.max_orders === 0 ? "" : formData.max_orders.toString()}
                        onChange={(e) => handleNumericInputChange("max_orders", e.target.value)}
                        className="w-full"
                        placeholder="Commandes max"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Order per day</Label>
                      <Input
                        type="text"
                        value={formData.order_per_day === 0 ? "" : formData.order_per_day?.toString() || ""}
                        onChange={(e) => handleNumericInputChange("order_per_day", e.target.value)}
                        className="w-full"
                        placeholder="Order per day"
                      />
                    </div>
                  </div>

                  {!formData.is_digital && (
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Livraison en ville (DH)</Label>
                        <Input
                          type="text"
                          value={formData.livraison_in_city === 0 ? "" : formData.livraison_in_city.toString()}
                          onChange={(e) => handleNumericInputChange("livraison_in_city", e.target.value)}
                          className="w-full"
                          placeholder="Livraison en ville"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Livraison hors ville (DH)</Label>
                        <Input
                          type="text"
                          value={formData.livraison_out_city === 0 ? "" : formData.livraison_out_city.toString()}
                          onChange={(e) => handleNumericInputChange("livraison_out_city", e.target.value)}
                          className="w-full"
                          placeholder="Livraison hors ville"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div className="space-y-4">
                <Label>Moyens de paiement</Label>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.online}
                      onCheckedChange={(checked) => handleInputChange("online", checked)}
                    />
                    <Label>En ligne</Label>
                  </div>
                  <div className="relative w-full">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={formData.partiel}
                        onCheckedChange={(checked) => handleInputChange("partiel", checked)}
                        id="partiel-switch"
                      />
                      <Label htmlFor="partiel-switch">Partiel</Label>
                    </div>

                    {formData.partiel && (
                      <div className="ml-4 mt-2 w-full">
                        <Input
                          id="partiel-amount"
                          type="text"
                          value={formData.partiel_field === 0 ? "" : formData.partiel_field.toString()}
                          onChange={(e) => handleNumericInputChange("partiel_field", e.target.value)}
                          className="w-full"
                          placeholder="Montant partiel %"
                        />
                        {!isNumeric(formData.partiel_field) && (
                          <p className="text-sm text-red-500 mt-1">Veuillez entrer un nombre valide.</p>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.cash}
                      onCheckedChange={(checked) => handleInputChange("cash", checked)}
                    />
                    <Label>Cash</Label>
                  </div>
                </div>

                <div className="mt-4 w-full">
                  <Label>TVA (%)</Label>
                  <Input
                    id="tva-input"
                    type="text"
                    value={formData.tva === 0 ? "" : formData.tva.toString()}
                    onChange={(e) => handleNumericInputChange("tva", e.target.value)}
                    className="w-full"
                    placeholder="TVA %"
                  />
                  {!isNumeric(formData.tva) && (
                    <p className="text-sm text-red-500 mt-1">Veuillez entrer un nombre valide.</p>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center">
                {!isUserRole && (
                  <div className="space-y-2">
                    <Label>Statut</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => handleInputChange("status", value as BlaneStatus)}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Sélectionner un statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">{getStatusLabel('active')}</SelectItem>
                        <SelectItem value="waiting">{getStatusLabel('waiting')}</SelectItem>
                        <SelectItem value="inactive">{getStatusLabel('inactive')}</SelectItem>
                        <SelectItem value="expired">{getStatusLabel('expired')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.on_top}
                    onCheckedChange={(checked) => handleInputChange("on_top", checked)}
                  />
                  <Label>Mettre en avant</Label>
                </div>
              </div>

              <div className="space-y-4">
                <Label>Visibility</Label>
                <BlaneVisibilitySelector
                  blaneId={isEditing ? initialData?.id?.toString() : undefined}
                  initialVisibility={formData.visibility || 'private'}
                  initialShareToken={formData.share_token || ''}
                  initialShareUrl={formData.share_url || ''}
                  onChange={handleVisibilityChange}
                />
              </div>

              <div className="flex justify-end gap-4">
                <Button variant="outline" type="button" onClick={onCancel}>
                  Annuler
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg h-fit rounded-lg overflow-hidden">
          <div className="relative h-80">
            {imagePreviews.length > 0 ? (
              <Carousel className="w-full h-full">
                <CarouselContent className="h-full">
                  {imagePreviews.map((preview) => (
                    <CarouselItem key={preview.id} className="h-full">
                      <div className="relative h-80 w-full group">
                        <img
                          src={preview.url || ''}
                          alt={`Preview ${preview.id}`}
                          className="w-full h-full object-cover transform transition-all duration-300 hover:scale-105"
                        />
                        <button
                          onClick={() => handleImageDelete(preview)}
                          className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-all duration-200 shadow-lg"
                          aria-label="Supprimer l'image"
                        >
                          <XMarkIcon className="w-4 h-4 text-gray-800" />
                        </button>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
            ) : (
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 h-full w-full flex items-center justify-center">
                <span className="text-gray-400/80">Aucune image</span>
              </div>
            )}

            <div className="absolute bottom-4 right-4">
              <label htmlFor="image-upload" className="cursor-pointer">
                <Button
                  variant="outline"
                  className="border-2 border-white/80 bg-white/90 backdrop-blur-sm text-black hover:bg-white/20 px-6 py-3 text-sm font-medium rounded-lg transition-all duration-300 hover:scale-105 shadow-lg"
                  type="button"
                  onClick={() =>
                    document.getElementById("image-upload")?.click()
                  }
                >
                  CHARGER PHOTO/VIDEO
                </Button>
              </label>
              <input
                id="image-upload"
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>
          <CardContent className="p-6 space-y-4 bg-gradient-to-br from-white to-gray-50">
            <div>
              <h2 className="text-xl font-bold text-gray-800 truncate">
                {formData.name || "Nouveau Blane"}
              </h2>
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {formData.description || "Description du blane..."}
              </p>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-primary">
                {formData.price_current} DH
              </span>
              {formData.price_old > 0 && (
                <span className="text-gray-400/80 line-through text-sm">
                  {formData.price_old} DH
                </span>
              )}
            </div>

            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>
                  {new Date(formData.start_date).toLocaleDateString()} -{" "}
                  {formData.expiration_date
                    ? new Date(formData.expiration_date).toLocaleDateString()
                    : "N/A"}
                </span>
              </div>
              {activeTab === "order" ? (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>Stock: {formData.stock}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Réservations: {formData.nombre_max_reservation}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BlaneForm;
