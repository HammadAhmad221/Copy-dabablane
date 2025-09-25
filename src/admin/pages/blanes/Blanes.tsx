import * as React from "react";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Card } from "@/admin/components/ui/card";
import { Button } from "@/admin/components/ui/button";
import { Input } from "@/admin/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/admin/components/ui/table";
import { Textarea } from "@/admin/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/admin/components/ui/dialog";
import { format, addDays } from "date-fns";
import { PencilIcon, TrashIcon, PlusIcon, EyeIcon, CopyIcon, MoreVerticalIcon, DownloadIcon } from "lucide-react";
import { Switch } from "@/admin/components/ui/switch";
import { blaneApi } from "@/admin/lib/api/services/blaneService";
import { categoryApi } from "@/admin/lib/api/services/categoryService";
import { subcategoryApi } from "@/admin/lib/api/services/subcategoryService";
import { Blane, BlaneFormData, BlaneStatus } from "@/lib/types/blane";
import { Category } from "@/lib/types/category";
import { Subcategory } from "@/lib/types/subcategory";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import { debounce } from "lodash";
import { z } from "zod";
import { toast } from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/admin/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/admin/components/ui/select";
import { Badge } from "@/admin/components/ui/badge";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
  AlertDialogAction,
  AlertDialogTrigger,
} from "@/admin/components/ui/alert-dialog";
import { Label } from "@/admin/components/ui/label";
import { Checkbox } from "@/admin/components/ui/checkbox";
import { motion, AnimatePresence } from "framer-motion";
import { cityApi } from "@/admin/lib/api/services/cityService";
import { City } from "@/lib/types/city";
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/admin/components/ui/dropdown-menu";
import { useDropzone } from "react-dropzone";
import { utils, writeFile } from "xlsx";
import {
  TooltipProvider,
} from "@/admin/components/ui/tooltip";
import { BlaneViewDialog } from "../../../admin/components/BlaneViewDialog";
import { adminApiClient } from '@/admin/lib/api/client';
import { AxiosError } from 'axios';
import { getStatusLabel } from "@/admin/lib/constants/status";
import * as XLSX from 'xlsx';
import { read } from 'xlsx';

// Add these animation variants at the top of the file, after the imports
const animationVariants = {
  fadeIn: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -20 }
  },
  slideIn: {
    hidden: { x: -20, opacity: 0 },
    visible: { x: 0, opacity: 1, transition: { duration: 0.3 } },
    exit: { x: 20, opacity: 0 }
  }
};

// Add this after the imports
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("fr-MA", {
    style: "currency",
    currency: "MAD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Update the Zod schema to match backend validation
const blaneSchema = z.object({
  id: z.number().optional(),
  subcategories_id: z.string().min(1, "Subcategory is required"),
  categories_id: z.string().min(1, "Category is required"),
  name: z.string().min(1, "Name is required").max(255, "Name must be less than 255 characters"),
  description: z.string().min(1, "Description is required"),
  price_current: z.number().optional(),
  price_old: z.number().optional(),
  advantages: z.string().optional(),
  conditions: z.string().optional(),
  city: z.string().min(1, "City is required").max(255, "City must be less than 255 characters"),
  type: z.enum(["order", "reservation"]),
  status: z.enum(["active", "inactive", "expired", "waiting"]),
  stock: z.number().optional(),
  start_date: z.string().min(1, "Start date is required"),
  expiration_date: z.string().nullable(),
  heure_debut: z.string().optional(),
  heure_fin: z.string().optional(),
  jours_creneaux: z.array(z.string()).optional(),
  dates: z.array(z.string()).optional(),

});


// Add these color constants at the top
const COLORS = {
  primary: "#00897B", // The teal/green color from your image
  secondary: "#F5F5F5", // Light gray background
  text: "#333333",
  border: "#E0E0E0",
};

// Add this interface before the BlaneViewDialog component
interface BlaneViewDialogProps {
  blane: Blane;
  categories: Category[];
  subcategories: Subcategory[];
}

// Add the BlaneViewDialog component
// This section will be removed
// const BlaneViewDialog: React.FC<BlaneViewDialogProps> = ({ 
//   blane, 
//   categories, 
//   subcategories,
// }) => {
//   return (
//     <DialogContent 
//       className="max-w-[95vw] md:max-w-2xl h-[90vh] md:h-auto p-0 gap-0 overflow-hidden"
//       onCloseAutoFocus={(e) => {
//         e.preventDefault();
//         // Clean up styles when dialog closes
//         document.body.style.pointerEvents = '';
//         document.body.style.overflow = '';
//       }}
//       onEscapeKeyDown={() => {
//         // Clean up styles when dialog closes via escape key
//         document.body.style.pointerEvents = '';
//         document.body.style.overflow = '';
//       }}
//       onInteractOutside={() => {
//         // Clean up styles when clicking outside
//         document.body.style.pointerEvents = '';
//         document.body.style.overflow = '';
//       }}
//     >
//       <div className="h-full flex flex-col">
//         {/* Header Section - Fixed */}
//         <div className="p-4 md:p-6 border-b flex items-center justify-between">
//           <DialogHeader className="flex-1">
//             <div className="flex items-center justify-between">
//               <div className="flex items-center gap-4">
//                 <div className="p-2 rounded-full bg-[#00897B]/10">
//                   <Icon icon="lucide:eye" className="h-6 w-6 text-[#00897B]" />
//                 </div>
//                 <div>
//                   <DialogTitle className="text-xl font-bold">{blane.name}</DialogTitle>
//                   <p className="text-sm text-gray-500">ID: {blane.id}</p>
//                 </div>
//               </div>
//             </div>
//           </DialogHeader>
//           {/* Remove the DialogClose component since Dialog already provides a close button */}
//         </div>

//         {/* Content Section - Scrollable */}
//         <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
//           {/* Price Section */}
//           <div className="bg-gray-50 rounded-lg p-4">
//             <h3 className="text-sm font-medium text-gray-500 mb-2">Pricing</h3>
//             <div className="flex items-center gap-4">
//               <div>
//                 <p className="text-2xl font-bold text-[#00897B]">
//                   {formatCurrency(Number(blane.price_current))}
//                 </p>
//                 <p className="text-sm text-gray-500">Current Price</p>
//               </div>
//               {blane.price_old && (
//                 <div>
//                   <p className="text-xl text-gray-400 line-through">
//                     {formatCurrency(Number(blane.price_old))}
//                   </p>
//                   <p className="text-sm text-gray-500">Original Price</p>
//                 </div>
//               )}
//             </div>
//           </div>

//           {/* Basic Info Grid */}
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <div className="space-y-1">
//               <Label className="text-xs text-gray-500">Category</Label>
//               <p className="font-medium">
//                 {categories.find(cat => String(cat.id) === String(blane.categories_id))?.name}
//               </p>
//             </div>
//             <div className="space-y-1">
//               <Label className="text-xs text-gray-500">Subcategory</Label>
//               <p className="font-medium">
//                 {subcategories.find(sub => String(sub.id) === String(blane.subcategories_id))?.name}
//               </p>
//             </div>
//             <div className="space-y-1">
//               <Label className="text-xs text-gray-500">Type</Label>
//               <Badge className={cn(
//                 "text-white",
//                 blane.type === "reservation" ? "bg-blue-500" : "bg-purple-500"
//               )}>
//                 {blane.type === "reservation" ? "Réservation" : "Commande"}
//               </Badge>
//             </div>
//             <div className="space-y-1">
//               <Label className="text-xs text-gray-500">City</Label>
//               <p className="font-medium">{blane.city}</p>
//             </div>
//           </div>

//           {/* Description */}
//           <div className="space-y-2">
//             <Label className="text-xs text-gray-500">Description</Label>
//             <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">
//               {blane.description}
//             </p>
//           </div>

//           {/* Type-specific Info */}
//           {blane.type === "reservation" && (
//             <>
//               <div className="space-y-2">
//                 <Label className="text-xs text-gray-500">Advantages</Label>
//                 <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">
//                   {blane.advantages}
//                 </p>
//               </div>
//               {blane.conditions && (
//                 <div className="space-y-2">
//                   <Label className="text-xs text-gray-500">Conditions</Label>
//                   <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">
//                     {blane.conditions}
//                   </p>
//                 </div>
//               )}
//             </>
//           )}

//           {/* Dates */}
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <div className="space-y-1">
//               <Label className="text-xs text-gray-500">Start Date</Label>
//               <p className="font-medium">{format(new Date(blane.start_date), "PP")}</p>
//             </div>
//             {blane.expiration_date && (
//               <div className="space-y-1">
//                 <Label className="text-xs text-gray-500">Expiration Date</Label>
//                 <p className="font-medium">{format(new Date(blane.expiration_date), "PP")}</p>
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Footer Section - Fixed */}
//         <div className="p-4 md:p-6 border-t bg-gray-50">
//           <div className="flex justify-end gap-2">
//             <DialogClose asChild>
//               <Button variant="outline">Close</Button>
//             </DialogClose>
//           </div>
//         </div>
//       </div>
//     </DialogContent>
//   );
// };

// Add this interface for the action menu props
interface BlaneActionMenuProps {
  blane: Blane;
  onEdit: () => void;
  onView: () => void;
  onDelete: () => void;
}

// Update the BlaneActionMenu component
const BlaneActionMenu: React.FC<BlaneActionMenuProps> = ({ blane, onEdit, onView, onDelete }) => {
  const navigate = useNavigate();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreVerticalIcon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={onEdit}>
          <PencilIcon className="h-4 w-4 mr-2" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate(`/admin/blanes/duplicate/${blane.id}`)}>
              <CopyIcon className="h-4 w-4 mr-2" />
              Duplicate
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onView}>
          <EyeIcon className="h-4 w-4 mr-2" />
          View Details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onDelete} className="text-red-600">
          <TrashIcon className="h-4 w-4 mr-2" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Update the PreviewData type to match export format
type PreviewData = {
  ID?: number;
  Name: string;
  Description: string;
  'Category ID': string;
  'Category Name'?: string;
  'Subcategory ID': string;
  'Subcategory Name'?: string;
  'City ID': string;
  'City Name'?: string;
  'Current Price': string;
  'Old Price'?: string;
  Advantages?: string;
  Conditions?: string;
  Status: BlaneStatus;
  Type: "order" | "reservation";
  Online: string;
  Partiel: string;
  Cash: string;
  'On Top': string;
  Stock?: string;
  'Max Orders'?: string;
  'Delivery In City'?: string;
  'Delivery Out City'?: string;
  'Start Date'?: string;
  'Expiration Date'?: string;
  isValid: boolean;
  errors?: string[];
};

// Update the ImportDialog component
const ImportDialog = ({ 
  isOpen, 
  onClose,
  cities,
  categories,
  subcategories
}: { 
  isOpen: boolean; 
  onClose: () => void;
  cities: City[];
  categories: Category[];
  subcategories: Subcategory[];
}) => {
  const [acceptedFiles, setAcceptedFiles] = useState<File[]>([]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv']
    },
    maxFiles: 1,
    onDrop: (accepted) => {
      setAcceptedFiles(accepted);
      if (accepted.length > 0) {
        toast.success('File selected successfully');
      }
    }
  });

  const handleImport = async () => {
    const loadingToast = toast.loading('Importing blanes...');
    
    try {
      if (!acceptedFiles?.[0]) {
        toast.error('Please select a file to import');
        return;
      }

      // Read the Excel file
      const file = acceptedFiles[0];
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = read(data, { type: 'array' });

          // Get the first worksheet
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          
          // Convert to JSON
          const jsonData = utils.sheet_to_json(worksheet);

          // Send the JSON data to the server
          await adminApiClient.post('back/v1/blanes/import', {
            blanes: jsonData
          }, {
            headers: {
              'Content-Type': 'application/json',
            },
          });

          // Handle success
          toast.success('Blanes imported successfully');
          onClose();
          
          // Refresh the blanes list
          await blaneApi.getBlanes({
            page: 1,
            paginationSize: 10,
          });

        } catch (error) {
          console.error('Import error:', error);
          const axiosError = error as AxiosError<{ message: string; errors?: Record<string, string[]>; error?: { blanes?: string[] } }>;
          
          // Log detailed validation errors if available
          if (axiosError.response?.status === 422) {
            console.error('Validation errors:', axiosError.response.data);
            const validationErrors = axiosError.response.data.errors || axiosError.response.data.error;
            if (validationErrors) {
              // Show the first validation error message
              const firstError = Object.values(validationErrors)[0]?.[0];
              toast.error(`Import failed: ${firstError || 'Validation error'}`);
              return;
            }
          }
          
          toast.error(`Import failed: ${axiosError.response?.data?.message || axiosError.message || 'Unknown error'}`);
        }
      };

      reader.onerror = () => {
        toast.error('Failed to read the file');
      };

      // Read the file as array buffer
      reader.readAsArrayBuffer(file);

    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to process the file');
    } finally {
      toast.dismiss(loadingToast);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-full md:max-w-[800px] lg:max-w-[1000px]">
        <DialogHeader>
          <DialogTitle>Import Blanes</DialogTitle>
          <DialogDescription>
            Upload an Excel file to import blanes. Make sure to use the template format.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Drop zone UI */}
          <div {...getRootProps()} className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
            isDragActive 
              ? "border-[#00897B] bg-[#00897B]/10" 
              : "border-gray-300 hover:border-[#00897B] hover:bg-gray-50"
          )}>
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-2">
              <Icon 
                icon={isDragActive ? "lucide:file-check" : "lucide:upload-cloud"} 
                className={cn(
                  "h-10 w-10",
                  isDragActive ? "text-[#00897B]" : "text-gray-400"
                )}
              />
              {isDragActive ? (
                <p className="text-[#00897B] font-medium">Drop the file here</p>
              ) : (
                <>
                  <p className="font-medium">Drag & drop a file here, or click to select</p>
                  <p className="text-sm text-gray-500">Supports Excel and CSV files</p>
                </>
              )}
            </div>
          </div>

          {/* Selected file info */}
          {acceptedFiles.length > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <Icon icon="lucide:file" className="h-5 w-5 text-[#00897B]" />
                <span className="font-medium">{acceptedFiles[0].name}</span>
                <span className="text-sm text-gray-500">
                  ({(acceptedFiles[0].size / 1024).toFixed(2)} KB)
                </span>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex justify-end gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setAcceptedFiles([]);
                onClose();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={acceptedFiles.length === 0}
              className="bg-[#00897B] hover:bg-[#00796B] text-white"
            >
              <Icon icon="lucide:upload" className="h-4 w-4 mr-2" />
              Import
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const Blanes: React.FC = () => {
  const { user } = useAuth();
  const isUserRole = user?.role === 'user';
  
  // State for blanes, categories, subcategories, loading, and pagination
  const [blanes, setBlanes] = useState<Blane[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    perPage: 10,
    total: 0,
    lastPage: 1,
  });

  // State for search, sorting, and filtering
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] =
    useState<string>("all");
  const [selectedSubcategoryFilter, setSelectedSubcategoryFilter] =
    useState<string>("all");

  // State for pagination size
  const [paginationSize, setPaginationSize] = useState<number>(10);

  // Add back the form state
  const [selectedBlane, setSelectedBlane] = useState<Blane | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Blane>({
    name: "",
    description: "",
    categories_id: "",
    subcategories_id: "",
    price_current: "",
    price_old: "",
    advantages: "",
    conditions: "",
    city: "",
    type: "order",
    status: "active",
    stock: 0,
    start_date: new Date().toISOString().split('T')[0],
    expiration_date: "",
    on_top: false,
    images: [],
  });
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  // Add cities state
  const [cities, setCities] = useState<City[]>([]);

  // Add state for import dialog
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

  // Add state for selected blanes
  const [selectedBlanes, setSelectedBlanes] = useState<number[]>([]);

  // Filter blanes based on selected category and subcategory
  const filteredBlanes = useMemo(() => {
    return blanes.filter((blane) => {
      const categoryMatch =
        selectedCategoryFilter === "all" ||
        String(blane.categories_id) === selectedCategoryFilter;
      const subcategoryMatch =
        selectedSubcategoryFilter === "all" ||
        String(blane.subcategories_id) === selectedCategoryFilter;
      return categoryMatch && subcategoryMatch;
    });
  }, [blanes, selectedCategoryFilter, selectedSubcategoryFilter]);

  // Fetch all data (categories, subcategories, and blanes) during initial load
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        // Fetch all data in parallel
        const [categoriesResponse, subcategoriesResponse, blanesResponse, citiesResponse] = await Promise.all([
          categoryApi.getCategories(),
          subcategoryApi.getSubcategories({
            page: 1,
            paginationSize: 100,
            sortBy: null,
            sortOrder: null,
            search: null,
          }),
          blaneApi.getBlanes({
            page: 1,
            paginationSize: 10,
            sortBy: null,
            sortOrder: null,
            search: null,
            include: 'blaneImages',
          }),
          cityApi.getCities()
        ]);

        setCategories(categoriesResponse.data);
        setSubcategories(subcategoriesResponse.data);
        setBlanes(blanesResponse.data);
        setCities(citiesResponse.data);
        setPagination({
          currentPage: blanesResponse.meta.current_page,
          perPage: blanesResponse.meta.per_page,
          total: blanesResponse.meta.total,
          lastPage: blanesResponse.meta.last_page,
        });
      } catch (error) {
        toast.error("Failed to load initial data. Please refresh the page.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Update the fetchBlanes function to handle pagination correctly
  const fetchBlanes = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await blaneApi.getBlanes({
        page: pagination.currentPage,
        paginationSize: pagination.perPage, // Use pagination.perPage instead of paginationSize
        sortBy: sortBy || undefined,
        sortOrder: sortOrder || undefined,
        search: searchTerm || undefined,
        categories_id: selectedCategoryFilter !== 'all' ? selectedCategoryFilter : undefined,
        subcategories_id: selectedSubcategoryFilter !== 'all' ? selectedSubcategoryFilter : undefined
      });
      
      setBlanes(response.data);
      setPagination(prev => ({
        ...prev,
        currentPage: response.meta.current_page,
        perPage: response.meta.per_page,
        total: response.meta.total,
        lastPage: response.meta.last_page,
      }));
    } catch (error) {
      toast.error('Failed to fetch blanes');
    } finally {
      setIsLoading(false);
    }
  }, [pagination.currentPage, pagination.perPage, sortBy, sortOrder, searchTerm, selectedCategoryFilter, selectedSubcategoryFilter]);

  // Update the handleExport function
  const handleExport = async () => {
    try {
      const loadingToast = toast.loading('Preparing export...');

      // Fetch all required data with include parameter for blane images
      const [categoriesData, subcategoriesData, citiesData, blanesWithImages] = await Promise.all([
        categoryApi.getCategories(),
        subcategoryApi.getSubcategories({
          page: 1,
          paginationSize: 100,
          sortBy: null,
          sortOrder: null,
          search: null
        }),
        cityApi.getCities(),
        blaneApi.getBlanes({
          page: 1,
          paginationSize: 9999, // Get all blanes
          include: 'blaneImages' // Include images in the response
        })
      ]);

      // Create export data with only names (no IDs)
      const exportData = blanesWithImages.data.map(blane => {
        // Find the city by name first (since blane.city might be the name)
        const cityByName = citiesData.data.find(c => c.name === blane.city);
        // If not found by name, try to find by ID
        const cityById = citiesData.data.find(c => c.id === parseInt(blane.city));
        // Use whichever city was found
        const city = cityByName || cityById;

        return {
          'Nom': blane.name,
          'Description': blane.description,
          'Catégorie': categoriesData.data.find(c => c.id === blane.categories_id)?.name || '',
          'Sous-catégorie': subcategoriesData.data.find(s => s.id === blane.subcategories_id)?.name || '',
          'Ville': city?.name || '',
          'Prix actuel': blane.price_current,
          'Ancien prix': blane.price_old || '',
          'Nom du commerce': blane.commerce_name || '',
          'Téléphone du commerce': blane.commerce_phone || '',
          'Produit numérique': blane.is_digital ? 'Oui' : 'Non',
          'Créneau horaire journalier': blane.type_time === 'time' ? 'Oui' : 'Non',
          'Avantages': blane.advantages || '',
          'Conditions': blane.conditions || '',
          'Statut': blane.status,
          'Type': blane.type,
          'En ligne': blane.online ? 'Oui' : 'Non',
          'Paiement partiel': blane.partiel ? 'Oui' : 'Non',
          'Paiement en espèces': blane.cash ? 'Oui' : 'Non',
          'En vedette': blane.on_top ? 'Oui' : 'Non',
          'Stock': blane.stock || 0,
          'Commandes maximum': blane.max_orders || 0,
          'Frais de livraison en ville': blane.livraison_in_city || 0,
          'Frais de livraison hors ville': blane.livraison_out_city || 0,
          'Date de début': blane.start_date ? format(new Date(blane.start_date), "dd/MM/yyyy HH:mm") : '',
          'Date d\'expiration': blane.expiration_date ? format(new Date(blane.expiration_date), "dd/MM/yyyy HH:mm") : '',
          'Jours disponibles': Array.isArray(blane.jours_creneaux) ? blane.jours_creneaux.join(', ') : '',
          'Dates disponibles': blane.dates ? blane.dates.join(', ') : '',
          'Heure de début': blane.heure_debut || '',
          'Heure de fin': blane.heure_fin || '',
          'Intervalle de réservation (min)': blane.intervale_reservation || 0,
          'Personnes par service': blane.personnes_prestation || 0,
          'Réservations maximum': blane.nombre_max_reservation || 0,
          'Maximum par créneau': blane.max_reservation_par_creneau || 0,
          'Montant partiel': blane.partiel_field || 0,
          'TVA (%)': blane.tva || 0,
          'Images': blane.blaneImages?.map(img => img.image_url).join(', ') || '',
          'Date de création': blane.created_at ? format(new Date(blane.created_at), "dd/MM/yyyy HH:mm") : '',
          'Dernière modification': blane.updated_at ? format(new Date(blane.updated_at), "dd/MM/yyyy HH:mm") : '',
          'Slug': blane.slug || '',
          'Note': blane.rating || 0,
        };
      });

      // Create filename based on filters
      let fileName = 'blanes_export';
      if (selectedCategoryFilter !== 'all') {
        const category = categories.find(c => String(c.id) === selectedCategoryFilter);
        fileName += `_${category?.name || 'category'}`;
        
        if (selectedSubcategoryFilter !== 'all') {
          const subcategory = subcategories.find(s => String(s.id) === selectedSubcategoryFilter);
          fileName += `_${subcategory?.name || 'subcategory'}`;
        }
      }
      fileName += `_${format(new Date(), "yyyy-MM-dd")}.xlsx`;

      // Create and write Excel file
      const ws = utils.json_to_sheet(exportData);
      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, "Blanes");

      // Auto-size columns
      const maxWidth = 50;
      const colWidths = Object.keys(exportData[0] || {}).map(key => {
        const maxContentLength = Math.max(
          key.length,
          ...exportData.map(row => String(row[key as keyof typeof row] || '').length)
        );
        return { wch: Math.min(maxContentLength + 2, maxWidth) };
      });
      ws['!cols'] = colWidths;

      writeFile(wb, fileName);
      
      toast.dismiss(loadingToast);
      toast.success(`Successfully exported ${exportData.length} blanes`);
    } catch (error) {
      toast.error("Failed to export data");
    }
  };

  // Update the useEffect to trigger fetchBlanes when pagination changes
  useEffect(() => {
    fetchBlanes();
  }, [fetchBlanes]);

  // Update the category filter handler
  const handleCategoryFilterChange = useCallback((value: string) => {
    setSelectedCategoryFilter(value);
    setSelectedSubcategoryFilter("all"); // Reset subcategory when category changes
    fetchBlanes(); // Trigger data refresh
  }, [fetchBlanes]);

  // Update the subcategory filter handler
  const handleSubcategoryFilterChange = useCallback((value: string) => {
    setSelectedSubcategoryFilter(value);
    fetchBlanes(); // Trigger data refresh
  }, [fetchBlanes]);

  // Handle pagination size change
  const handlePaginationSizeChange = useCallback((value: string) => {
    const newPaginationSize = parseInt(value, 10);
    setPagination(prev => ({ 
      ...prev,
      perPage: newPaginationSize,
      currentPage: 1 // Reset to first page when changing page size
    }));
  }, []);

  // Update the handlePageChange function to properly handle page changes
  const handlePageChange = useCallback((page: number) => {
    setPagination(prev => {
      if (prev.currentPage !== page) {
        return { ...prev, currentPage: page };
      }
      return prev;
    });
  }, []);

  // Handle sorting
  const handleSort = useCallback(
    (column: string) => {
      const newSortOrder =
        sortBy === column && sortOrder === "asc" ? "desc" : "asc";
      setSortBy(column);
      setSortOrder(newSortOrder);
    },
    [sortBy, sortOrder]
  );

  // Handle search with debounce
  const handleSearch = useCallback(
    debounce((term: string) => {
      setSearchTerm(term);
    }, 500),
    []
  );

  // Update handleCategoryChange function
  const handleCategoryChange = useCallback(async (value: string) => {
    try {
      setIsLoading(true);
      setFormData(prev => ({
        ...prev,
        categories_id: value,
        subcategories_id: ""
      }));


      // Convert value to number or null
      const categoryId = value ? parseInt(value) : null;

      const response = await subcategoryApi.getSubcategories({
        page: 1,
        paginationSize: 100,
        categoryId, // Now it's number | null
        sortBy: null,
        sortOrder: null,
        search: null
      });

      if (response.data) {
        setSubcategories(response.data);
      }
    } catch (error) {
      toast.error('Failed to fetch subcategories');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle blane edit
  const handleEdit = useCallback((blane: Blane) => {
    setSelectedBlane(blane);
    setFormData({
      name: blane.name,
      description: blane.description,
      categories_id: String(blane.categories_id),
      subcategories_id: String(blane.subcategories_id),
      price_current: String(blane.price_current),
      price_old: blane.price_old ? String(blane.price_old) : "",
      advantages: blane.advantages || "",
      conditions: blane.conditions || "",
      city: blane.city,
      type: blane.type,
      status: blane.status,
      stock: blane.stock,
      start_date: blane.start_date,
      expiration_date: blane.expiration_date,
      on_top: false,
      images: [],
    });
    setIsDialogOpen(true);
  }, []);

  // Handle blane delete
  const handleDelete = useCallback(async (blaneId: number) => {
    try {
      await blaneApi.deleteBlane(String(blaneId));
      await fetchBlanes();
      toast.success("Blane deleted successfully!");
    } catch (error) {
      toast.error("Failed to delete blane. Please try again later.");
    }
  }, [fetchBlanes]);

  // Add this function to handle status toggle
  const handleStatusToggle = async (blane: Blane) => {
    // Toggle only between active and inactive
    const newStatus: BlaneStatus = blane.status === 'active' ? 'inactive' : 'active';
    const originalStatus = blane.status;
    
    try {
      // Optimistic update
      setBlanes(prev => prev.map(b => 
        b.id === blane.id ? { ...b, status: newStatus } : b
      ));

      await blaneApi.updateStatusBlane(String(blane.id), { status: newStatus });
    } catch (error) {
      // Revert on failure
      setBlanes(prev => prev.map(b => 
        b.id === blane.id ? { ...b, status: originalStatus } : b
      ));
    }
  };

  // Update the handleSubmit function
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      try {
        const formDataToSubmit = new FormData();
        
        // Only append fillable fields
        formDataToSubmit.append('subcategories_id', String(parseInt(formData.subcategories_id || '')));
        formDataToSubmit.append('categories_id', String(parseInt(formData.categories_id)));
        formDataToSubmit.append('name', formData.name);
        formDataToSubmit.append('description', formData.description);
        formDataToSubmit.append('price_current', String(formData.price_current));
        formDataToSubmit.append('price_old', formData.price_old ? String(formData.price_old) : '');
        formDataToSubmit.append('advantages', formData.advantages || '');
        formDataToSubmit.append('conditions', formData.conditions || '');
        formDataToSubmit.append('city', formData.city);
        formDataToSubmit.append('type', formData.type);
        formDataToSubmit.append('status', formData.status);
        formDataToSubmit.append('stock', String(formData.stock));
        
        // Format dates properly for MySQL
        const startDate = new Date(formData.start_date);
        formDataToSubmit.append('start_date', startDate.toISOString().split('T')[0]);
        
        if (formData.expiration_date) {
          const expirationDate = new Date(formData.expiration_date);
          formDataToSubmit.append('expiration_date', expirationDate.toISOString().split('T')[0]);
        }

        // Append images separately
        if (formData.images.length > 0) {
          formData.images.forEach((image) => {
            formDataToSubmit.append('images[]', image);
          });
        }

        // Validate required fields
        const errors: Record<string, string> = {};
        if (!formData.name) errors.name = 'Name is required';
        if (!formData.description) errors.description = 'Description is required';
        if (!formData.categories_id) errors.categories_id = 'Category is required';
        if (!formData.subcategories_id) errors.subcategories_id = 'Subcategory is required';
        if (!formData.city) errors.city = 'City is required';
        if (formData.type === 'reservation' && !formData.advantages) {
          errors.advantages = 'Advantages are required for reservations';
        }

        if (Object.keys(errors).length > 0) {
          setErrors(errors);
          toast.error('Please fill in all required fields');
          return;
        }

        if (selectedBlane) {
          const updatedBlane = await blaneApi.updateBlane(String(selectedBlane.id), formDataToSubmit as unknown as BlaneFormData);
          setBlanes((prev) =>
            prev.map((blane) => (blane.id === selectedBlane.id ? updatedBlane : blane))
          );
          toast.success("Blane updated successfully!");
        } else {
          const newBlane = await blaneApi.createBlane(formDataToSubmit as unknown as BlaneFormData );
          await fetchBlanes();
          toast.success("Blane created successfully!");
        }

        setIsDialogOpen(false);
        setSelectedBlane(null);
        resetForm();
      } catch (error: any) {
        if (error.response?.data?.error) {
          setErrors(error.response.data.error);
          const firstError = Object.values(error.response.data.error)[0];
          toast.error(Array.isArray(firstError) ? firstError[0] : firstError);
        } else {
          toast.error(error.response?.data?.message || "Failed to save blane. Please try again later.");
        }
      }
    },
    [formData, selectedBlane, fetchBlanes]
  );

  // Add the resetForm function
  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      categories_id: "",
      subcategories_id: "",
      price_current: "",
      price_old: "",
      advantages: "",
      conditions: "",
      city: "",
      type: "order",
      status: "active",
      stock: 0,
      start_date: new Date().toISOString().split('T')[0],
      expiration_date: "",
      on_top: false,
      images: [],
    });
    setErrors({});
  };

  // Add this inside the Blanes component, before the return statement
  const renderDialogContent = () => (
    <DialogContent className="max-w-[95vw] md:max-w-4xl max-h-[90vh] overflow-y-auto p-4 md:p-6">
      <motion.div
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={animationVariants.fadeIn}
        transition={{ duration: 0.3 }}
      >
        <DialogHeader className="mb-6">
          <motion.div 
            variants={animationVariants.slideIn}
            className="flex items-center gap-3"
          >
            <div className="p-2 rounded-full bg-[#00897B]/10">
              <Icon 
                icon={selectedBlane ? "lucide:edit" : "lucide:plus"} 
                className="h-6 w-6 text-[#00897B]" 
              />
            </div>
            <div>
              <DialogTitle className="text-xl md:text-2xl font-bold">
                {selectedBlane ? "Modifier" : "Créer"} un Blane
              </DialogTitle>
              <p className="text-sm text-gray-500 mt-1">
                {selectedBlane 
                  ? "Modifier les détails du blane existant" 
                  : "Créer un nouveau blane avec les détails requis"}
              </p>
            </div>
          </motion.div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Type Selection with improved UI */}
          <motion.div 
            variants={animationVariants.fadeIn}
            className="bg-gray-50 p-4 rounded-lg"
          >
            <Label className="text-sm font-medium mb-3 block">Type de Blane</Label>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                type="button"
                className={cn(
                  "flex-1 px-6 py-3 rounded-lg transition-all duration-200",
                  formData.type === "order" 
                    ? "bg-[#00897B] text-white shadow-lg" 
                    : "bg-white text-gray-700 border-2 border-gray-200 hover:border-[#00897B]"
                )}
                onClick={() => setFormData(prev => ({ ...prev, type: "order" }))}
              >
                <Icon icon="lucide:shopping-cart" className="h-5 w-5 mr-2" />
                Order
              </Button>
              <Button
                type="button"
                className={cn(
                  "flex-1 px-6 py-3 rounded-lg transition-all duration-200",
                  formData.type === "reservation" 
                    ? "bg-[#00897B] text-white shadow-lg" 
                    : "bg-white text-gray-700 border-2 border-gray-200 hover:border-[#00897B]"
                )}
                onClick={() => setFormData(prev => ({ ...prev, type: "reservation" }))}
              >
                <Icon icon="lucide:calendar" className="h-5 w-5 mr-2" />
                Reservation
              </Button>
            </div>
          </motion.div>

          {/* Categories and Subcategories Section */}
          <motion.div 
            variants={animationVariants.fadeIn}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {/* Category Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Catégorie <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.categories_id || ""}
                onValueChange={(value) => {
                  setFormData(prev => ({
                    ...prev,
                    categories_id: value,
                    subcategories_id: "" // Reset subcategory when category changes
                  }));
                  setErrors(prev => ({  
                    ...prev,
                    categories_id: undefined,
                    subcategories_id: undefined
                  }));
                }}
              >
                <SelectTrigger className={cn(
                  "w-full",
                  errors.categories_id && "border-red-500 focus:ring-red-500"
                )}>
                  <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={String(category.id)}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.categories_id && (
                <p className="text-sm text-red-500">{errors.categories_id}</p>
              )}
            </div>

            {/* Subcategory Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Sous-catégorie <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.subcategories_id || ""}
                onValueChange={(value) => {
                  setFormData(prev => ({
                    ...prev,
                    subcategories_id: value
                  }));
                  setErrors(prev => ({
                    ...prev,
                    subcategories_id: undefined
                  }));
                }}
                disabled={!formData.categories_id}
              >
                <SelectTrigger className={cn(
                  "w-full",
                  errors.subcategories_id && "border-red-500 focus:ring-red-500"
                )}>
                  <SelectValue placeholder={
                    formData.categories_id 
                      ? "Sélectionner une sous-catégorie" 
                      : "Sélectionner d'abord une catégorie"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {subcategories
                    .filter(sub => String(sub.category_id) === formData.categories_id)
                    .map((subcategory) => (
                      <SelectItem key={subcategory.id} value={String(subcategory.id)}>
                        {subcategory.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {errors.subcategories_id && (
                <p className="text-sm text-red-500">{errors.subcategories_id}</p>
              )}
            </div>
          </motion.div>

          {/* Basic Information */}
          <motion.div variants={animationVariants.fadeIn} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    name: e.target.value
                  }))}
                  className={cn(
                    errors.name && "border-red-500 focus:ring-red-500"
                  )}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name}</p>
                )}
              </div>

              {/* City */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  City <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.city}
                  onValueChange={(value) => setFormData(prev => ({
                    ...prev,
                    city: value
                  }))}
                >
                  <SelectTrigger className={cn(
                    errors.city && "border-red-500 focus:ring-red-500"
                  )}>
                    <SelectValue placeholder="Select a city" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((city) => (
                      <SelectItem key={city.id} value={city.name}>
                        {city.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.city && (
                  <p className="text-sm text-red-500">{errors.city}</p>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Description <span className="text-red-500">*</span>
              </Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  description: e.target.value
                }))}
                className={cn(
                  "min-h-[100px]",
                  errors.description && "border-red-500 focus:ring-red-500"
                )}
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description}</p>
              )}
            </div>
          </motion.div>

          {/* Type-specific fields */}
          <AnimatePresence mode="wait">
            {formData.type === "order" ? (
              <motion.div
                key="order"
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={animationVariants.fadeIn}
                className="space-y-6"
              >
                {/* Order fields */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Stock</Label>
                  <Input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      stock: parseInt(e.target.value)
                    }))}
                    min="0"
                    className="w-full"
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="reservation"
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={animationVariants.fadeIn}
                className="space-y-6"
              >
                {/* Reservation fields */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Advantages <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    value={formData.advantages}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      advantages: e.target.value
                    }))}
                    className={cn(
                      "min-h-[100px]",
                      errors.advantages && "border-red-500 focus:ring-red-500"
                    )}
                  />
                  {errors.advantages && (
                    <p className="text-sm text-red-500">{errors.advantages}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Conditions</Label>
                  <Textarea
                    value={formData.conditions || ""}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      conditions: e.target.value
                    }))}
                    className="min-h-[100px]"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Prices */}
          <motion.div variants={animationVariants.fadeIn} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Current Price <span className="text-red-500">*</span>
              </Label>
              <Input
                type="number"
                value={formData.price_current}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  price_current: e.target.value
                }))}
                min="0"
                step="0.01"

                className={cn(
                  errors.price_current && "border-red-500 focus:ring-red-500"
                )}
              />
              {errors.price_current && (
                <p className="text-sm text-red-500">{errors.price_current}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Old Price</Label>
              <Input
                type="number"
                value={formData.price_old || ""}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  price_old: e.target.value
                }))}
                min="0"
                step="0.01"
              />
            </div>
          </motion.div>

          {/* Dates */}
          <motion.div variants={animationVariants.fadeIn} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Start Date <span className="text-red-500">*</span>
              </Label>
              <Input
                type="datetime-local"
                value={formData.start_date}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  start_date: e.target.value
                }))}
                className={cn(
                  errors.start_date && "border-red-500 focus:ring-red-500"
                )}
              />
              {errors.start_date && (
                <p className="text-sm text-red-500">{errors.start_date}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Expiration Date</Label>
              <Input
                type="datetime-local"
                value={formData.expiration_date || ""}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  expiration_date: e.target.value || null
                }))}
                min={formData.start_date}
              />
            </div>
          </motion.div>

          <DialogFooter className="mt-8 pt-4 border-t">
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="w-full sm:w-auto bg-[#00897B] text-white hover:bg-[#00897B]/90"
              >
                {selectedBlane ? (
                  <>
                    <Icon icon="lucide:save" className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                ) : (
                  <>
                    <Icon icon="lucide:plus" className="h-4 w-4 mr-2" />
                    Create Blane
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </motion.div>
    </DialogContent>
  );

  const navigate = useNavigate()

  useEffect(() => {
    fetchBlanes();
  }, [fetchBlanes, selectedCategoryFilter, selectedSubcategoryFilter]);

  // First, update the mobile dropdown menu implementation
  const MobileActions: React.FC<{ blane: Blane }> = ({ blane }) => {
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVerticalIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[160px]">
            <DropdownMenuItem onClick={() => navigate(`/admin/blanes/edit/${blane.id}`)}>
              <PencilIcon className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>            
            <DropdownMenuItem onClick={() => navigate(`/admin/blanes/duplicate/${blane.id}`)}>
              <CopyIcon className="h-4 w-4 mr-2" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setIsViewOpen(true)}>
              <EyeIcon className="h-4 w-4 mr-2" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="text-red-600"
              onSelect={() => setIsDeleteOpen(true)}
            >
              <TrashIcon className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* View Dialog */}
        <Dialog 
          open={isViewOpen} 
          onOpenChange={(open) => {
            setIsViewOpen(open);
            if (!open) {
              // Clean up styles when dialog closes
              document.body.style.pointerEvents = '';
              document.body.style.overflow = '';
            }
          }}
        >
          <BlaneViewDialog 
            blane={blane} 
            categories={categories} 
            subcategories={subcategories}
          />
        </Dialog>

        {/* Delete Dialog */}
        <AlertDialog 
          open={isDeleteOpen} 
          onOpenChange={(open) => {
            setIsDeleteOpen(open);
            if (!open) {
              // Clean up styles when dialog closes
              document.body.style.pointerEvents = '';
              document.body.style.overflow = '';
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Blane</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this blane?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  handleDelete(Number(blane.id));
                  setIsDeleteOpen(false);
                }}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  };

  // Add this function to fetch subcategories for a category
  const fetchSubcategoriesForCategory = async (categoryId: string) => {
    try {
      const response = await subcategoryApi.getSubcategories({
        page: 1,
        paginationSize: 100,
        categoryId: parseInt(categoryId),
        sortBy: null,
        sortOrder: null,
        search: null
      });
      setSubcategories(response.data);
    } catch (error) {
      toast.error('Failed to fetch subcategories');
    }
  };

  // Update the fetchAllBlanes function with more logging
  const fetchAllBlanes = async (filters?: {
    categoryId?: string;
    subcategoryId?: string;
  }) => {
    try {
      let allBlanes: Blane[] = [];
      let currentPage = 1;
      let hasMorePages = true;

      while (hasMorePages) {
        const params = {
          page: currentPage,
          paginationSize: 100,
          categories_id: filters?.categoryId !== 'all' ? filters?.categoryId : null,
          subcategories_id: filters?.subcategoryId !== 'all' ? filters?.subcategoryId : null
        };


        const response = await blaneApi.getBlanes(params);



        if (!response.data.length) {
          break;
        }

        allBlanes = [...allBlanes, ...response.data];
        hasMorePages = currentPage < response.meta.last_page;
        currentPage++;
      }

      return allBlanes;
    } catch (error) {
      throw new Error('Failed to fetch all blanes');
    }
  };

  // Add this function before the Blanes component
  const downloadImportTemplate = () => {
    // Create template data with example row
    const templateData = [{
      'name': 'Example Blane',
      'description': 'Example description of the blane',
      'categorie': 'Example Category',
      'subcategorie': 'Example Subcategory',
      'is_digital': 'non',
      'price_current': '100',
      'price_old': '120',
      'advantages': 'Example advantages',
      'conditions': 'Example conditions',
      'city': 'Casablanca',
      'status': 'active',
      'type': 'order',
      'online': 'oui',
      'partiel': 'non',
      'cash': 'non',
      'partiel_field': '50',
      'tva': '20',
      'stock': '10',
      'max_orders': '100',
      'livraison_in_city': '20',
      'livraison_out_city': '30',
      'start_date': format(new Date(), "yyyy-MM-dd"),
      'expiration_date': format(addDays(new Date(), 30), "yyyy-MM-dd"),
      'type_time': 'time',
      'jours_creneaux': 'lundi,mardi,mercredi',
      'dates': '2024-03-20,2024-03-21',
      'heure_debut': '09:00',
      'heure_fin': '18:00',
      'intervale_reservation': '30',
      'nombre_personnes': '2',
      'personnes_prestation': '1',
      'nombre_max_reservation': '10',
      'max_reservation_par_creneau': '5',
      'commerce_name': 'Example Commerce',
      'commerce_phone': '+212600000000'
    }];

    // Create workbook and worksheet
    const ws = utils.json_to_sheet(templateData);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Template");

    // Auto-size columns
    const maxWidth = 50;
    const colWidths = Object.keys(templateData[0]).map(key => {
      const maxContentLength = Math.max(
        key.length,
        String(templateData[0][key as keyof typeof templateData[0]]).length
      );
      return { wch: Math.min(maxContentLength + 2, maxWidth) };
    });
    ws['!cols'] = colWidths;

    // Add comments/notes to help users understand the format
    const notes = {
      'status': 'Values: active, inactive',
      'type': 'Values: order, reservation',
      'online': 'Values: oui, non',
      'partiel': 'Values: oui, non',
      'cash': 'Values: oui, non',
      'is_digital': 'Values: oui, non',
      'type_time': 'Values: time, date',
      'jours_creneaux': 'Format: comma-separated list of days (lundi,mardi,mercredi,etc.)',
      'dates': 'Format: comma-separated list of dates (YYYY-MM-DD)',
      'start_date': 'Format: YYYY-MM-DD',
      'expiration_date': 'Format: YYYY-MM-DD',
      'heure_debut': 'Format: HH:mm (24h)',
      'heure_fin': 'Format: HH:mm (24h)',
      'categorie': 'Must match an existing category name',
      'subcategorie': 'Must match an existing subcategory name',
      'commerce_phone': 'Format: +212XXXXXXXXX'
    };

    // Add notes to the first row
    Object.entries(notes).forEach(([col, note]) => {
      const cellRef = utils.encode_cell({ r: 0, c: Object.keys(templateData[0]).indexOf(col) });
      if (!ws[cellRef].c) ws[cellRef].c = [];
      ws[cellRef].c.push({ t: note, a: 'Author' });
    });

    // Download the file
    writeFile(wb, 'blanes_import_template.xlsx');
  };

  // Add bulk delete handler
  const handleBulkDelete = useCallback(async () => {
    try {
      await blaneApi.bulkDelete(selectedBlanes);
      setSelectedBlanes([]); // Clear selection
      await fetchBlanes(); // Refresh the list
    } catch (error) {
      console.error('Failed to delete blanes:', error);
    }
  }, [selectedBlanes, fetchBlanes]);

  // Add selection handlers
  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedBlanes(blanes.map(blane => Number(blane.id)));
    } else {
      setSelectedBlanes([]);
    }
  }, [blanes]);

  const handleSelectBlane = useCallback((blaneId: number, checked: boolean) => {
    setSelectedBlanes(prev => {
      if (checked) {
        return [...prev, blaneId];
      } else {
        return prev.filter(id => id !== blaneId);
      }
    });
  }, []);

  return (
<TooltipProvider>
  <div className="">
    <Card className="overflow-hidden">
      {/* Header Section - Translated */}
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={animationVariants.fadeIn}
        className="p-4 md:p-6 bg-gradient-to-r from-[#00897B] to-[#00796B]"
      >
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="text-white w-full lg:w-auto">
            <h2 className="text-2xl font-bold">Gestion des Blanes</h2>
            <p className="text-gray-100 mt-1">Gérez vos blanes, commandes et réservations</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
            {/* Add bulk delete button */}
            {selectedBlanes.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="destructive"
                    className="w-full sm:w-auto"
                  >
                    <TrashIcon className="h-4 w-4 mr-2" />
                    Delete ({selectedBlanes.length})
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Selected Blanes</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete {selectedBlanes.length} selected blanes? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleBulkDelete}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <div className="grid grid-cols-2 sm:flex gap-2 w-full sm:w-auto">
              <Button 
                onClick={() => setIsImportDialogOpen(true)}
                className="bg-white text-[#00897B] hover:bg-gray-100 transition-colors w-full sm:w-auto"
              >
                <Icon icon="lucide:upload" className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Importer</span>
                <span className="sm:hidden">Imp.</span>
              </Button>
              <Button 
                onClick={downloadImportTemplate}
                className="bg-white text-[#00897B] hover:bg-gray-100 transition-colors w-full sm:w-auto"
              >
                <Icon icon="lucide:file-text" className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Template</span>
                <span className="sm:hidden">Temp.</span>
              </Button>
              <Button 
                onClick={handleExport}
                className="bg-white text-[#00897B] hover:bg-gray-100 transition-colors w-full sm:w-auto"
              >
                <DownloadIcon className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Exporter</span>
                <span className="sm:hidden">Exp.</span>
              </Button>
              <Button 
                onClick={() => navigate('/admin/blanes/create')}
                className="bg-white text-[#00897B] hover:bg-gray-100 transition-colors w-full col-span-2 sm:col-span-1 sm:w-auto mt-2 sm:mt-0"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Ajouter un Blane</span>
                <span className="sm:hidden">Ajouter</span>
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Filters Section - Translated */}
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={animationVariants.fadeIn}
        className="p-2 md:p-6 border-b space-y-2 md:space-y-4"
      >
        <div className="flex flex-col gap-4">
          {/* Search */}
          <div className="relative">
            <Input
              placeholder="Rechercher des blanes..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                handleSearch(e.target.value);
              }}
              className="pl-10"
            />
            <Icon 
              icon="lucide:search" 
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" 
            />
          </div>
          
          {/* Filters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
            {/* Category Filter */}
            <Select
              value={selectedCategoryFilter || "all"}
              onValueChange={(value) => {
                handleCategoryFilterChange(value);
                setSelectedSubcategoryFilter("all");
                if (value !== "all") {
                  fetchSubcategoriesForCategory(value);
                }
              }}
            >
              <SelectTrigger className="w-full bg-white">
                <SelectValue placeholder="Filtrer par catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={String(category.id)}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Subcategory Filter */}
            <Select
              value={selectedSubcategoryFilter}
              onValueChange={handleSubcategoryFilterChange}
              disabled={selectedCategoryFilter === "all"}
            >
              <SelectTrigger className="w-full bg-white">
                <SelectValue placeholder={
                  selectedCategoryFilter === "all" 
                    ? "Sélectionnez d'abord une catégorie" 
                    : "Filtrer par sous-catégorie"
                } />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les sous-catégories</SelectItem>
                {subcategories
                  .filter(sub => String(sub.category_id) === selectedCategoryFilter)
                  .map((subcategory) => (
                    <SelectItem key={subcategory.id} value={String(subcategory.id)}>
                      {subcategory.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Items Per Page */}
          <Select
            value={paginationSize.toString()}
            onValueChange={handlePaginationSizeChange}
          >
            <SelectTrigger className="w-full bg-white">
              <SelectValue placeholder="Éléments par page" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 par page</SelectItem>
              <SelectItem value="20">20 par page</SelectItem>
              <SelectItem value="50">50 par page</SelectItem>
              <SelectItem value="9999">Tous (100+)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* Table Section - Translated */}
      <div className="w-full overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              {/* Add select all checkbox */}
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={selectedBlanes.length === blanes.length && blanes.length > 0}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead className="w-[50px] hidden md:table-cell">Image</TableHead>
              <TableHead className="w-[2px] md:w-[200px]">Détails</TableHead>
              <TableHead className="w-[100px] hidden lg:table-cell">Catégorie</TableHead>          
              <TableHead className="w-[100px] hidden lg:table-cell">Type</TableHead>
              <TableHead className="w-[120px] hidden lg:table-cell">Dates</TableHead>
              {!isUserRole && <TableHead className="w-[80px]">Statut</TableHead>}
              <TableHead className="w-[50px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  <div className="flex items-center justify-center">
                    <Icon icon="lucide:loader" className="h-6 w-6 animate-spin text-primary" />
                    <span className="ml-2">Chargement...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : blanes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  <div className="flex flex-col items-center justify-center text-gray-500">
                    <Icon icon="lucide:inbox" className="h-12 w-12 mb-2" />
                    <p>Aucun blane trouvé</p>
                    <Button
                      variant="link"
                      onClick={() => navigate('/admin/blanes/create')}
                      className="mt-2 text-[#00897B]"
                    >
                      Créez votre premier blane
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredBlanes.map((blane) => (
                <TableRow key={blane.id} className="group hover:bg-gray-50">
                  {/* Add row checkbox */}
                  <TableCell>
                    <Checkbox
                      checked={selectedBlanes.includes(Number(blane.id))}
                      onCheckedChange={(checked) => handleSelectBlane(Number(blane.id), checked as boolean)}
                      aria-label={`Select ${blane.name}`}
                    />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {blane.blane_images?.[0]?.image_link ? (
                      <img
                        src={blane.blane_images[0].image_link}
                        alt={blane.name}
                        className="w-10 h-10 rounded-md"
                      />
                    ) : (
                      'Pas d\'image'
                    )}
                  </TableCell>
                  <TableCell className="w-[20px] md:w-[200px] bg-opacity-10 py-2">
                    <div className="flex flex-col space-y-1">
                      <div className="font-medium text-base truncate" title={blane.name}>
                        {blane?.name?.length > 15
                          ? `${blane.name.slice(0, blane.name.lastIndexOf(' ', 15))}...`
                          : blane?.name}
                      </div>
                      {blane.rating && (
                        <div className="flex items-center gap-1 text-sm text-yellow-500">
                          <Icon icon="lucide:star" className="h-4 w-4" />
                          <span>{Number(blane.rating).toFixed(1)}</span>
                        </div>
                      )}
                      <div className="lg:hidden space-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Icon icon="lucide:tag" className="h-4 w-4" />
                          <span className="truncate">
                            {categories.find(cat => String(cat.id) === String(blane.categories_id))?.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Icon icon="lucide:bookmark" className="h-4 w-4" />
                          <span className="capitalize">{blane.type === "reservation" ? "Réservation" : "Commande"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Icon icon="lucide:map-pin" className="h-4 w-4" />
                          <span className="truncate">{blane.city}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Icon icon="lucide:tag" className="h-4 w-4" />
                          <span>{formatCurrency(Number(blane.price_current))}</span>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {categories.find(cat => String(cat.id) === String(blane.categories_id))?.name}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <Badge className={cn(
                      "text-white",
                      blane.type === "reservation" ? "bg-blue-500" : "bg-purple-500"
                    )}>
                      {blane.type === "reservation" ? "Réservation" : "Commande"}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm">
                    <div className="flex flex-col">
                      <div>{format(new Date(blane.start_date), "PP")}</div>
                      <div className="text-gray-500">{format(new Date(blane.expiration_date), "PP")}</div>
                    </div>
                  </TableCell>
                  {!isUserRole && (
                    <TableCell className="table-cell-interactive">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                        <Switch
                          checked={blane.status === 'active'}
                          onCheckedChange={() => handleStatusToggle(blane)}
                          className="data-[state=checked]:bg-[#00897B]"
                        />
                        <Badge
                          className={cn(
                            "text-white whitespace-nowrap",
                            blane.status === "active" ? "bg-green-500" : 
                            blane.status === "waiting" ? "bg-blue-500" : 
                            blane.status === "expired" ? "bg-red-500" : "bg-yellow-500"
                          )}
                        >
                          {getStatusLabel(blane.status)}
                        </Badge>
                      </div>
                    </TableCell>
                  )}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end">
                      <div className="hidden md:flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => navigate(`/admin/blanes/duplicate/${blane.id}`)}
                        >
                          <CopyIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => navigate(`/admin/blanes/edit/${blane.id}`)}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        <Dialog
                          onOpenChange={(isOpen) => {
                            if (!isOpen) {
                              // Clean up styles when dialog closes
                              document.body.style.pointerEvents = '';
                              document.body.style.overflow = '';
                            }
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button variant="outline" size="icon">
                              <EyeIcon className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <BlaneViewDialog 
                            blane={blane} 
                            categories={categories} 
                            subcategories={subcategories}
                          />
                        </Dialog>
                        <AlertDialog
                          onOpenChange={(isOpen) => {
                            if (!isOpen) {
                              // Clean up styles when dialog closes
                              document.body.style.pointerEvents = '';
                              document.body.style.overflow = '';
                            }
                          }}
                        >
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="icon">
                              <TrashIcon className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Supprimer le Blane</AlertDialogTitle>
                              <AlertDialogDescription>
                                Êtes-vous sûr de vouloir supprimer ce blane ?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(Number(blane.id))}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Supprimer
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                      <div className="md:hidden">
                        <MobileActions blane={blane} />
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination - Translated */}
      <div className="p-2 md:p-4">
        <Pagination className="justify-end">
          <PaginationContent>
            <PaginationItem>
              {pagination.currentPage > 1 && (
                <PaginationPrevious
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  aria-disabled={pagination.currentPage <= 1}
                  className={cn(
                    pagination.currentPage <= 1 && "pointer-events-none opacity-50"
                  )}
                />
              )}
            </PaginationItem>
            
            {Array.from({ length: pagination.lastPage }, (_, i) => i + 1)
              .filter(page => {
                if (pagination.lastPage <= 5) return true;
                if (page === 1 || page === pagination.lastPage) return true;
                if (Math.abs(page - pagination.currentPage) <= 1) return true;
                return false;
              })
              .map((page, i, array) => {
                if (i > 0 && array[i - 1] !== page - 1) {
                  return (
                    <PaginationItem key={`ellipsis-${page}`}>
                      <span className="px-4 py-2">...</span>
                    </PaginationItem>
                  );
                }
                return (
                  <PaginationItem key={page}>
                    <PaginationLink
                      isActive={page === pagination.currentPage}
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
            
            <PaginationItem>
              {pagination.currentPage < pagination.lastPage && (
                <PaginationNext
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  aria-disabled={pagination.currentPage >= pagination.lastPage}
                  className={cn(
                    pagination.currentPage >= pagination.lastPage && "pointer-events-none opacity-50"
                  )}
                />
              )}
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </Card>

    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <AnimatePresence mode="wait">
        {isDialogOpen && renderDialogContent()}
      </AnimatePresence>
    </Dialog>
    
    <ImportDialog 
      isOpen={isImportDialogOpen} 
      onClose={() => setIsImportDialogOpen(false)}
      cities={cities}
      categories={categories}
      subcategories={subcategories}
    />
  </div>
</TooltipProvider>
  );
};

export default Blanes;