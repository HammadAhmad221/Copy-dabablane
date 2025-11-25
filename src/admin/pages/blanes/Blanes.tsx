
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
  DialogFooter,
} from "@/admin/components/ui/dialog";
import { format, addDays } from "date-fns";
import { PencilIcon, TrashIcon, PlusIcon, EyeIcon, CopyIcon, MoreVerticalIcon, DownloadIcon } from "lucide-react";
import { Switch } from "@/admin/components/ui/switch";
import { blaneApi } from "@/admin/lib/api/services/blaneService";
import { categoryApi } from "@/admin/lib/api/services/categoryService";
import { subcategoryApi } from "@/admin/lib/api/services/subcategoryService";
import { vendorApi } from "@/admin/lib/api/services/vendorService";
import { Blane, BlaneFormData, BlaneStatus } from "@/admin/lib/api/types/blane";
import { Category } from "@/admin/lib/api/types/category";
import { Subcategory } from "@/admin/lib/api/types/subcategory";
import { Vendor } from "@/admin/lib/api/types/vendor";
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
import { City } from "@/admin/lib/api/types/city";
import { useNavigate, useLocation } from 'react-router-dom';
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

// Update the ImportDialog component
const ImportDialog = ({
  isOpen,
  onClose
}: {
  isOpen: boolean;
  onClose: () => void;
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
  const location = useLocation();
  const navigate = useNavigate();

  // State for blanes, categories, subcategories, vendors, loading, and pagination
  const [blanes, setBlanes] = useState<Blane[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
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
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("all");
  const [selectedSubcategoryFilter, setSelectedSubcategoryFilter] = useState<string>("all");
  const [selectedVendorFilter, setSelectedVendorFilter] = useState<string>("all");

  // State for pagination size
  const [paginationSize, setPaginationSize] = useState<number>(10);

  // Add state for import dialog
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

  // Add state for selected blanes
  const [selectedBlanes, setSelectedBlanes] = useState<number[]>([]);

  // Add cities state
  const [cities, setCities] = useState<City[]>([]);

  // Fetch all data (categories, subcategories, vendors, and blanes) during initial load
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        // Fetch all data in parallel
        const [categoriesResponse, subcategoriesResponse, blanesResponse, citiesResponse, vendorsResponse] = await Promise.all([
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
          }),
          cityApi.getCities(),
          vendorApi.getVendors({}, 100, 1)
        ]);

        setCategories(categoriesResponse.data);
        setSubcategories(subcategoriesResponse.data);
        setBlanes(blanesResponse.data);
        setCities(citiesResponse.data);
        setVendors(vendorsResponse.data);
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

  // Read URL parameters on mount and when location changes
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchParam = params.get('search');
    const blaneIdParam = params.get('blaneId');
    
    if (searchParam) {
      console.log('🔍 Setting search term from URL:', searchParam);
      setSearchTerm(searchParam);
    }
    
    if (blaneIdParam) {
      console.log('🔍 Blane ID from URL:', blaneIdParam);
      // If we have a blaneId, we can use it to filter or search
      // For now, we'll just set it as a search term if no search is provided
      if (!searchParam) {
        // Try to find the blane by ID in the list, or search for it
        // The search will be handled by the fetchBlanes function
      }
    }
  }, [location.search]);

  // Update the fetchBlanes function to handle pagination correctly
  const fetchBlanes = useCallback(async () => {
    setIsLoading(true);
    try {
      let response;

      // If vendor filter is selected, use commerce_name parameter
      if (selectedVendorFilter !== 'all') {
        const selectedVendor = vendors.find(v => String(v.id) === selectedVendorFilter);
        if (selectedVendor) {
          response = await blaneApi.getBlanes({
            page: pagination.currentPage,
            paginationSize: pagination.perPage,
            commerce_name: selectedVendor.company_name || selectedVendor.name,
            sortBy: sortBy || undefined,
            sortOrder: sortOrder || undefined,
            search: searchTerm || undefined,
          });
        } else {
          // Fallback to regular getBlanes if vendor not found
          response = await blaneApi.getBlanes({
            page: pagination.currentPage,
            paginationSize: pagination.perPage,
            sortBy: sortBy || undefined,
            sortOrder: sortOrder || undefined,
            search: searchTerm || undefined,
            categories_id: selectedCategoryFilter !== 'all' ? selectedCategoryFilter : undefined,
            subcategories_id: selectedSubcategoryFilter !== 'all' ? selectedSubcategoryFilter : undefined
          });
        }
      } else {
        // Use regular getBlanes API
        response = await blaneApi.getBlanes({
          page: pagination.currentPage,
          paginationSize: pagination.perPage,
          sortBy: sortBy || undefined,
          sortOrder: sortOrder || undefined,
          search: searchTerm || undefined,
          categories_id: selectedCategoryFilter !== 'all' ? selectedCategoryFilter : undefined,
          subcategories_id: selectedSubcategoryFilter !== 'all' ? selectedSubcategoryFilter : undefined
        });
      }

      setBlanes(response.data);
      setPagination(prev => ({
        ...prev,
        currentPage: response.meta.current_page,
        perPage: response.meta.per_page,
        total: response.meta.total,
        lastPage: response.meta.last_page,
      }));
    } catch (error) {
      console.error('Failed to fetch blanes:', error);
      toast.error('Failed to fetch blanes');
    } finally {
      setIsLoading(false);
    }
  }, [
    pagination.currentPage,
    pagination.perPage,
    sortBy,
    sortOrder,
    searchTerm,
    selectedCategoryFilter,
    selectedSubcategoryFilter,
    selectedVendorFilter,
    vendors
  ]);

  // Update the useEffect to trigger fetchBlanes when filters change
  useEffect(() => {
    fetchBlanes();
  }, [fetchBlanes]);

  // Update the category filter handler
  const handleCategoryFilterChange = useCallback((value: string) => {
    setSelectedCategoryFilter(value);
    setSelectedSubcategoryFilter("all"); // Reset subcategory when category changes
  }, []);

  // Update the subcategory filter handler
  const handleSubcategoryFilterChange = useCallback((value: string) => {
    setSelectedSubcategoryFilter(value);
  }, []);

  // Add vendor filter handler
  const handleVendorFilterChange = useCallback((value: string) => {
    setSelectedVendorFilter(value);
    // Reset other filters when vendor is selected
    if (value !== 'all') {
      setSelectedCategoryFilter('all');
      setSelectedSubcategoryFilter('all');
    }
  }, []);

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
      toast.error('Failed to delete selected blanes');
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
                {/* Vendor Filter */}
                <Select
                  value={selectedVendorFilter || "all"}
                  onValueChange={handleVendorFilterChange}
                >
                  <SelectTrigger className="w-full bg-white">
                    <SelectValue placeholder="Filtrer par vendeur" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les vendeurs</SelectItem>
                    {vendors.map((vendor) => (
                      <SelectItem key={vendor.id} value={String(vendor.id)}>
                        {vendor.company_name || vendor.name} ({vendor.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

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
                  disabled={selectedVendorFilter !== "all"}
                >
                  <SelectTrigger className="w-full bg-white">
                    <SelectValue placeholder={
                      selectedVendorFilter !== "all"
                        ? "Désélectionnez le vendeur d'abord"
                        : "Filtrer par catégorie"
                    } />
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
                  disabled={selectedCategoryFilter === "all" || selectedVendorFilter !== "all"}
                >
                  <SelectTrigger className="w-full bg-white">
                    <SelectValue placeholder={
                      selectedVendorFilter !== "all"
                        ? "Désélectionnez le vendeur d'abord"
                        : selectedCategoryFilter === "all"
                          ? "Sélectionnez d'abord une catégorie"
                          : "Filtrer par sous-catégorie"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les sous-catégories</SelectItem>
                    {subcategories
                      .filter(sub => sub.category_id === parseInt(selectedCategoryFilter))
                      .map((subcategory) => (
                        <SelectItem key={subcategory.id} value={String(subcategory.id)}>
                          {subcategory.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>

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
                  </SelectContent>
                </Select>
              </div>
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
                  blanes.map((blane) => (
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
                        {blane.blaneImages?.[0]?.image_url ? (
                          <img
                            src={blane.blaneImages[0].image_url}
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
                                {categories.find(cat => cat.id === blane.categories_id)?.name}
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
                        {categories.find(cat => cat.id === blane.categories_id)?.name}
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
                          <div className="text-gray-500">{blane.expiration_date ? format(new Date(blane.expiration_date), "PP") : 'N/A'}</div>
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

        <ImportDialog
          isOpen={isImportDialogOpen}
          onClose={() => setIsImportDialogOpen(false)}
        />
      </div>
    </TooltipProvider>
  );
};

export default Blanes;