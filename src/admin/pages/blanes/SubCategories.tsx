import * as React from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card } from "@/admin/components/ui/card";
import { Button } from "@/admin/components/ui/button";
import { Input } from "@/admin/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/admin/components/ui/table";
import { Textarea } from "@/admin/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/admin/components/ui/dialog";
import { format } from 'date-fns';
import { PencilIcon, TrashIcon, PlusIcon, EyeIcon } from "lucide-react";
import { Switch } from "@/admin/components/ui/switch";
import { subcategoryApi } from '@/admin/lib/api/services/subcategoryService';
import { categoryApi } from '@/admin/lib/api/services/categoryService';
import { Category, Subcategory, SubcategoryFormData, SubcategoryResponse } from '@/admin/lib/api/types/subcategory';
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import { debounce } from "lodash";
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from '@/admin/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/admin/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/admin/components/ui/alert-dialog";
import { subcategoryValidationSchema } from '@/lib/types/category';
import { motion } from 'framer-motion';
import { animationVariants } from '@/admin/utils/animations';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/admin/components/ui/dropdown-menu";
import { MoreVerticalIcon } from "lucide-react";

// Add this after the imports and before the subcategorySchema
const InfoField = ({ 
  label, 
  value, 
  icon,
  fullWidth = false 
}: { 
  label: string; 
  value: React.ReactNode; 
  icon?: React.ReactNode;
  fullWidth?: boolean;
}) => (
  <motion.div 
    className={`bg-white rounded-lg p-4 shadow-sm border ${fullWidth ? 'col-span-full' : ''}`}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <div className="flex items-start gap-3">
      {icon && <div className="text-gray-400 mt-1">{icon}</div>}
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-500 mb-1">
          {label}
        </label>
        <div className={`${typeof value === 'string' ? 'text-gray-900 font-medium' : ''} ${fullWidth ? 'whitespace-pre-wrap' : 'truncate'}`}>
          {value}
        </div>
      </div>
    </div>
  </motion.div>
);

// Zod schema for validation
const subcategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name must be less than 50 characters'),
  description: z.string()
    .min(3, 'Description must be at least 3 characters')
    .max(200, 'Description must be less than 200 characters')
    .refine((val) => val.trim().length > 0, 'Description is required')
    .transform(val => val.trim()),
  category_id: z.string().min(1, 'Category is required'),
});

// Add this animation variant after the existing animationVariants
const popupAnimationVariants = {
  overlay: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  },
  content: {
    hidden: { 
      opacity: 0, 
      scale: 0.95, 
      y: 20 
    },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: {
        type: "spring",
        duration: 0.3,
        bounce: 0.25
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.95, 
      y: 20 
    }
  }
};

// Add this utility function at the top of your component
const cleanupPointerEvents = () => {
  // Remove the style immediately
  document.body.style.removeProperty('pointer-events');
  // And also after a short delay to ensure cleanup
  setTimeout(() => {
    document.body.style.removeProperty('pointer-events');
  }, 100);
};

// Update the ActionsDropdown component
const ActionsDropdown = ({ 
  subcategory, 
  categories,
  formData,
  setFormData,
  errors,
  handleSubmit,
  onEdit, 
  onDelete, 
  onView,
  setIsDialogOpen,
  setSelectedSubcategory
}: {
  subcategory: Subcategory;
  categories: Category[];
  formData: SubcategoryFormData;
  setFormData: (data: SubcategoryFormData) => void;
  errors: Record<string, string>;
  handleSubmit: (id?: string) => void;
  onEdit: (subcategory: Subcategory) => void;
  onDelete: (id: string) => void;
  onView: (subcategory: Subcategory) => void;
  setIsDialogOpen: (open: boolean) => void;
  setSelectedSubcategory: (subcategory: Subcategory | null) => void;
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <MoreVerticalIcon className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        <Dialog onOpenChange={(open) => {
          if (!open) {
            cleanupPointerEvents();
          }
        }}>
          <DialogTrigger asChild>
            <DropdownMenuItem 
              className="hover:bg-[#00897B]/10 hover:text-[#00897B]"
              onSelect={(e) => e.preventDefault()}
            >
              <EyeIcon className="mr-2 h-4 w-4" />
              View
            </DropdownMenuItem>
          </DialogTrigger>
          <DialogContent className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] max-w-[95vw] w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0 bg-white rounded-lg shadow-lg">
            <motion.div
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={popupAnimationVariants.content}
              className="p-6"
            >
              <DialogHeader className="space-y-4">
                <DialogTitle className="text-2xl font-bold">View Subcategory</DialogTitle>
              </DialogHeader>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoField
                  label="Name"
                  value={subcategory.name}
                  icon={<Icon icon="lucide:tag" className="h-5 w-5" />}
                />
                <InfoField
                  label="Category"
                  value={categories.find((cat) => cat.id.toString() === subcategory.category_id.toString())?.name || "Uncategorized"}
                  icon={<Icon icon="lucide:folder" className="h-5 w-5" />}
                />
                <InfoField
                  label="Description"
                  value={subcategory.description}
                  icon={<Icon icon="lucide:align-left" className="h-5 w-5" />}
                  fullWidth
                />
                <InfoField
                  label="Created At"
                  value={format(new Date(subcategory.created_at), 'PPP')}
                  icon={<Icon icon="lucide:calendar" className="h-5 w-5" />}
                />
                <InfoField
                  label="Updated At"
                  value={format(new Date(subcategory.updated_at), 'PPP')}
                  icon={<Icon icon="lucide:clock" className="h-5 w-5" />}
                />
              </div>
            </motion.div>
          </DialogContent>
        </Dialog>

        <DropdownMenuItem 
          className="hover:bg-[#00897B]/10 hover:text-[#00897B]"
          onClick={() => {
            // Set form data for editing
            setFormData({
              name: subcategory.name,
              description: subcategory.description || '',
              category_id: subcategory.category_id.toString(),
            });
            setSelectedSubcategory(subcategory);
            setIsDialogOpen(true);
          }}
        >
          <PencilIcon className="mr-2 h-4 w-4" />
          Edit
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <AlertDialog onOpenChange={(open) => {
          if (!open) {
            cleanupPointerEvents();
          }
        }}>
          <AlertDialogTrigger asChild>
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600"
              onSelect={(e) => e.preventDefault()}
            >
              <TrashIcon className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the subcategory.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={async () => {
                  try {
                    await onDelete(subcategory.id);
                  } catch (error) {
                  }
                }}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const SubCategories: React.FC = () => {
  // State for subcategories, categories, loading, and pagination
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    perPage: 10,
    total: 0,
    lastPage: 1,
  });

  // State for search, sorting, and filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<string | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | undefined>(undefined);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');

  // State for subcategory form
  const [selectedSubcategory, setSelectedSubcategory] = useState<Subcategory | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<SubcategoryFormData>({
    name: '',
    description: '',
    category_id: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // State for pagination size
  const [paginationSize, setPaginationSize] = useState<number>(10);

  // State for delete confirmation
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [subcategoryToDelete, setSubcategoryToDelete] = useState<string | null>(null);

  // Add state for view dialog
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  // Fetch subcategories with pagination, sorting, and filtering
  const fetchSubcategories = useCallback(
    async ({
      page = 1,
      paginationSize = 10,
      sortBy = null,
      sortOrder = null,
      search = null,
      categoryId = null,
      status = null,
    }: {
      page?: number;
      paginationSize?: number;
      sortBy?: string | null;
      sortOrder?: 'asc' | 'desc' | null;
      search?: string | null;
      categoryId?: string | null;
      status?: string | null;
    } = {}) => {
      setIsLoading(true);
      try {
        const params: Record<string, any> = {
          page,
          paginationSize,
          sortBy,
          sortOrder,
          search,
          categoryId: categoryId === 'all' ? null : categoryId,
          status: status === 'all' ? null : status,
        };

        const response: SubcategoryResponse = await subcategoryApi.getSubcategories(params);
        setSubcategories(response.data);
        setPagination({
          currentPage: response.meta.current_page,
          perPage: response.meta.per_page,
          total: response.meta.total,
          lastPage: response.meta.last_page,
        });
      } catch (error) {
        toast.error('Failed to fetch subcategories. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const categoriesResponse = await categoryApi.getCategories();
      setCategories(categoriesResponse.data);
    } catch (error) {
      toast.error('Failed to fetch categories. Please try again later.');
    }
  }, []);

  // Fetch subcategories and categories on component mount or when dependencies change
  useEffect(() => {
    fetchSubcategories({
      page: pagination.currentPage,
      paginationSize: paginationSize,
      sortBy: sortBy || null,
      sortOrder: sortOrder || null,
      search: searchTerm || null,
      categoryId: selectedCategoryFilter,
      status: selectedStatusFilter,
    });
    fetchCategories();
  }, [fetchSubcategories, fetchCategories, pagination.currentPage, paginationSize, sortBy, sortOrder, searchTerm, selectedCategoryFilter, selectedStatusFilter]);

  // Handle search with debounce
  const handleSearch = useCallback(
    debounce((term: string) => {
      fetchSubcategories({
        page: 1,
        paginationSize: paginationSize,
        search: term,
        sortBy: sortBy || null,
        sortOrder: sortOrder || null,
        categoryId: selectedCategoryFilter,
        status: selectedStatusFilter,
      });
    }, 500),
    [fetchSubcategories, sortBy, sortOrder, paginationSize, selectedCategoryFilter, selectedStatusFilter]
  );

  // Handle page change
  const handlePageChange = useCallback(
    (page: number) => {
      fetchSubcategories({
        page,
        paginationSize: paginationSize,
        search: searchTerm,
        sortBy: sortBy || null,
        sortOrder: sortOrder || null,
        categoryId: selectedCategoryFilter,
        status: selectedStatusFilter,
      });
    },
    [fetchSubcategories, searchTerm, sortBy, sortOrder, paginationSize, selectedCategoryFilter, selectedStatusFilter]
  );

  // Handle pagination size change
  const handlePaginationSizeChange = useCallback(
    (value: string) => {
      const newPaginationSize = parseInt(value, 10);
      setPaginationSize(newPaginationSize);
      fetchSubcategories({
        page: 1, // Reset to the first page when changing pagination size
        paginationSize: newPaginationSize,
        search: searchTerm,
        sortBy: sortBy || null,
        sortOrder: sortOrder || null,
        categoryId: selectedCategoryFilter,
        status: selectedStatusFilter,
      });
    },
    [fetchSubcategories, searchTerm, sortBy, sortOrder, selectedCategoryFilter, selectedStatusFilter]
  );

  // Handle sorting
  const handleSort = useCallback(
    (column: string) => {
      const newSortOrder = sortBy === column && sortOrder === 'asc' ? 'desc' : 'asc';
      setSortBy(column);
      setSortOrder(newSortOrder);
      fetchSubcategories({
        page: pagination.currentPage,
        paginationSize: paginationSize,
        sortBy: column,
        sortOrder: newSortOrder,
        search: searchTerm,
        categoryId: selectedCategoryFilter,
        status: selectedStatusFilter,
      });
    },
    [fetchSubcategories, sortBy, sortOrder, searchTerm, pagination.currentPage, paginationSize, selectedCategoryFilter, selectedStatusFilter]
  );

  // Handle subcategory edit
  const handleEdit = useCallback((subcategory: Subcategory) => {
    setSelectedSubcategory(subcategory);
    setFormData({
      name: subcategory.name,
      description: subcategory.description || '', // Ensure empty string if null
      category_id: subcategory.category_id.toString(),
    });
    setErrors({});
    setIsDialogOpen(true);
  }, []);

  // Handle status change
  const handleStatusChange = useCallback(
    async (subcategoryId: string, checked: boolean) => {
      try {
        const newStatus = checked ? 'active' : 'inactive';
        await subcategoryApi.updateStatusSubcategory(subcategoryId, newStatus);
        setSubcategories((prev) =>
          prev.map((sub) =>
            sub.id === subcategoryId ? { ...sub, status: newStatus } : sub
          )
        );
        toast.success(`Subcategory ${checked ? 'activated' : 'deactivated'} successfully!`);
      } catch (error) {
        toast.error('Failed to update subcategory status. Please try again later.');
      }
    },
    []
  );

  // Handle delete confirmation
  const handleDeleteClick = useCallback(async (subcategoryId: string) => {
    try {
      await subcategoryApi.deleteSubcategory(subcategoryId);
      setSubcategories((prev) => prev.filter((sub) => sub.id !== subcategoryId));
      toast.success('Subcategory deleted successfully!');
      cleanupPointerEvents();
    } catch (error) {
      toast.error('Failed to delete subcategory. Please try again later.');
      cleanupPointerEvents();
    }
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(
    async (id?: string) => {
      try {
        const validatedData = subcategorySchema.parse({
          ...formData,
          description: formData.description?.trim() || '' 
        });
        setErrors({});

        if (id) {
          const updatedSubcategory = await subcategoryApi.updateSubcategory(
            id, 
            validatedData
          );
          setSubcategories((prev) =>
            prev.map((sub) => (sub.id === id ? updatedSubcategory : sub))
          );
          toast.success('Subcategory updated successfully!');
        } else {
          const newSubcategory = await subcategoryApi.createSubcategory(validatedData);
          setSubcategories((prev) => [...prev, newSubcategory]);
          toast.success('Subcategory created successfully!');
        }

        // First close the dialog
        setIsDialogOpen(false);
        
        // Then clean up after a brief delay
        setTimeout(() => {
          resetForm();
          document.body.style.removeProperty('pointer-events');
          document.body.style.removeProperty('overflow');
          document.body.style.removeProperty('padding-right');
        }, 100);

      } catch (error) {
        // Immediately remove pointer-events on error
        document.body.style.removeProperty('pointer-events');
        document.body.style.removeProperty('overflow');
        document.body.style.removeProperty('padding-right');
        
        if (error instanceof z.ZodError) {
          const errorMap: Record<string, string> = {};
          error.errors.forEach((err) => {
            if (err.path) {
              errorMap[err.path[0]] = err.message;
            }
          });
          setErrors(errorMap);
          return;
        }
        toast.error('Failed to save subcategory. Please try again later.');
      }
    },
    [formData]
  );

  // Add a new function to reset the form
  const resetForm = useCallback(() => {
    setSelectedSubcategory(null);
    setFormData({
      name: '',
      description: '',
      category_id: '',
    });
    setErrors({});
    cleanupPointerEvents();
  }, []);

  // Handle category filter change
  const handleCategoryFilterChange = useCallback(
    (value: string) => {
      setSelectedCategoryFilter(value);
      // Reset to first page when changing category filter
      fetchSubcategories({
        page: 1,
        paginationSize,
        search: searchTerm,
        sortBy: sortBy || null,
        sortOrder: sortOrder || null,
        categoryId: value,
        status: selectedStatusFilter,
      });
    },
    [fetchSubcategories, paginationSize, searchTerm, sortBy, sortOrder, selectedStatusFilter]
  );

  // Handle status filter change
  const handleStatusFilterChange = useCallback(
    (value: string) => {
      setSelectedStatusFilter(value);
      fetchSubcategories({
        page: 1,
        paginationSize,
        search: searchTerm,
        sortBy: sortBy || null,
        sortOrder: sortOrder || null,
        categoryId: selectedCategoryFilter,
        status: value,
      });
    },
    [fetchSubcategories, paginationSize, searchTerm, sortBy, sortOrder, selectedCategoryFilter]
  );

  return (
  <div className="">
    <Card className="overflow-hidden">
      {/* Section d'en-tête */}
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={animationVariants.fadeIn}
        className="p-4 md:p-6 bg-gradient-to-r from-[#00897B] to-[#00796B]"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="text-white">
            <h2 className="text-2xl font-bold">Gestion des Sous-catégories</h2>
            <p className="text-gray-100 mt-1">Gérez vos sous-catégories et leurs relations</p>
          </div>
          <Dialog 
            open={isDialogOpen} 
            onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) {
                setTimeout(() => {
                  resetForm();
                  document.body.style.removeProperty('pointer-events');
                  document.body.style.removeProperty('overflow');
                  document.body.style.removeProperty('padding-right');
                }, 100);
              }
            }}
          >
            <DialogTrigger asChild>
              <Button className="bg-white text-[#00897B] hover:bg-gray-100 transition-colors">
                <PlusIcon className="mr-2 h-4 w-4" />
                Ajouter une Sous-catégorie
              </Button>
            </DialogTrigger>
            <DialogContent className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] max-w-[95vw] w-full sm:max-w-[500px] p-0 bg-white rounded-lg shadow-lg">
              <motion.div
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={popupAnimationVariants.content}
                className="p-6"
              >
                <DialogHeader className="space-y-4">
                  <DialogTitle className="text-xl sm:text-2xl font-bold text-[#00897B] flex items-center gap-2">
                    <div className="w-8 sm:w-10 h-8 sm:h-10 rounded-full bg-[#00897B]/10 flex items-center justify-center">
                      <Icon icon={selectedSubcategory ? "lucide:edit" : "lucide:plus"} className="h-4 sm:h-5 w-4 sm:w-5 text-[#00897B]" />
                    </div>
                    {selectedSubcategory ? "Modifier la Sous-catégorie" : "Ajouter une Nouvelle Sous-catégorie"}
                  </DialogTitle>
                  <DialogDescription className="text-sm text-gray-500">
                    {selectedSubcategory 
                      ? "Modifiez les détails de cette sous-catégorie" 
                      : "Créez une nouvelle sous-catégorie pour vos éléments"}
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={(e) => {
                  e.preventDefault();
                  handleSubmit(selectedSubcategory?.id);
                }} className="space-y-6">
                  <div className="mt-6 space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Nom</label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Entrez le nom de la sous-catégorie"
                        className={cn(errors.name && "border-red-500 focus-visible:ring-red-500")}
                      />
                      {errors.name && (
                        <div className="flex items-center gap-x-2 mt-1.5">
                          <Icon icon="lucide:alert-circle" className="h-4 w-4 text-red-500 flex-shrink-0" />
                          <p className="text-sm text-red-500">{errors.name}</p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Catégorie</label>
                      <Select
                        value={formData.category_id}
                        onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                      >
                        <SelectTrigger className={cn(errors.category_id && "border-red-500 focus-visible:ring-red-500")}>
                          <SelectValue placeholder="Sélectionnez une catégorie" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.category_id && (
                        <div className="flex items-center gap-x-2 mt-1.5">
                          <Icon icon="lucide:alert-circle" className="h-4 w-4 text-red-500 flex-shrink-0" />
                          <p className="text-sm text-red-500">{errors.category_id}</p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Description</label>
                      <Textarea
                        value={formData.description || ''}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Entrez la description de la sous-catégorie"
                        className={cn(
                          "resize-none min-h-[100px]",
                          errors.description && "border-red-500 focus-visible:ring-red-500"
                        )}
                      />
                      {errors.description && (
                        <div className="flex items-center gap-x-2 mt-1.5">
                          <Icon icon="lucide:alert-circle" className="h-4 w-4 text-red-500 flex-shrink-0" />
                          <p className="text-sm text-red-500">{errors.description}</p>
                        </div>
                      )}
                      <p className="text-sm text-gray-500">
                        Minimum 3 caractères, maximum 200 caractères
                      </p>
                    </div>
                  </div>

                  <DialogFooter className="mt-6 pt-4 border-t">
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsDialogOpen(false);
                          setTimeout(() => {
                            resetForm();
                            document.body.style.removeProperty('pointer-events');
                            document.body.style.removeProperty('overflow');
                            document.body.style.removeProperty('padding-right');
                          }, 100);
                        }}
                        className="w-full sm:w-auto"
                      >
                        Annuler
                      </Button>
                      <Button
                        type="submit"
                        className="w-full sm:w-auto bg-[#00897B] text-white hover:bg-[#00897B]/90"
                      >
                        {selectedSubcategory ? 'Enregistrer les modifications' : 'Créer la Sous-catégorie'}
                      </Button>
                    </div>
                  </DialogFooter>
                </form>
              </motion.div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Section des filtres */}
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={animationVariants.fadeIn}
        className="p-2 md:p-6 border-b space-y-2 md:space-y-4"
      >
        <div className="flex flex-col md:flex-row gap-4 md:items-center">
          {/* Barre de recherche */}
          <div className="relative w-full md:w-auto md:min-w-[300px]">
            <Input
              placeholder="Rechercher des sous-catégories..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                handleSearch(e.target.value);
              }}
              className="pl-10 w-full border-input"
            />
            <Icon 
              icon="lucide:search" 
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" 
            />
          </div>
          
          {/* Grille des filtres */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:flex gap-2 flex-1">
            <Select
              value={selectedCategoryFilter}
              onValueChange={handleCategoryFilterChange}
            >
              <SelectTrigger className="w-full md:w-[200px] bg-white border-input">
                <SelectValue placeholder="Filtrer par catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedStatusFilter}
              onValueChange={handleStatusFilterChange}
            >
              <SelectTrigger className="w-full md:w-[180px] bg-white border-input">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={paginationSize.toString()}
              onValueChange={handlePaginationSizeChange}
            >
              <SelectTrigger className="w-full md:w-[150px] bg-white border-input">
                <SelectValue placeholder="Éléments par page" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 par page</SelectItem>
                <SelectItem value="20">20 par page</SelectItem>
                <SelectItem value="50">50 par page</SelectItem>
                <SelectItem value="100">100 par page</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </motion.div>

      {/* Section du tableau */}
      <div className="w-full overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              {/* Afficher uniquement l'ID et le nom sur mobile, tout afficher sur les grands écrans */}
              <TableHead 
                onClick={() => handleSort('name')}
                className="cursor-pointer hover:text-[#00897B] transition-colors min-w-[150px]"
              >
                Nom {sortBy === 'name' && (
                  <Icon 
                    icon={sortOrder === 'asc' ? 'lucide:chevron-up' : 'lucide:chevron-down'} 
                    className="inline ml-1"
                  />
                )}
              </TableHead>
              <TableHead className="hidden md:table-cell min-w-[150px]">Catégorie</TableHead>
              <TableHead className="hidden md:table-cell min-w-[200px]">Description</TableHead>
              <TableHead className="hidden lg:table-cell min-w-[180px]">Dates</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right min-w-[130px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subcategories.map((subcategory) => (
              <TableRow key={subcategory.id} className="group hover:bg-gray-50">
                <TableCell>
                  <div className="space-y-1">
                    <div className="font-medium">{subcategory.name}</div>
                    {/* Afficher ces détails uniquement sur mobile */}
                    <div className="md:hidden space-y-1 text-sm text-gray-500">
                      <div>Catégorie : {categories.find((cat) => cat.id.toString() === subcategory.category_id.toString())?.name || "Non catégorisé"}</div>
                      <div className="line-clamp-1">Description : {subcategory.description || 'Aucune description'}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {categories.find((cat) => cat.id.toString() === subcategory.category_id.toString())?.name || "Non catégorisé"}
                </TableCell>
                <TableCell className="hidden md:table-cell max-w-[200px] truncate">
                  {subcategory.description}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <div className="flex flex-col text-sm">
                    <span className="text-gray-600">Créée le : {format(new Date(subcategory.created_at), 'PP')}</span>
                    <span className="text-gray-500">Modifiée le : {format(new Date(subcategory.updated_at), 'PP')}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Switch
                    checked={subcategory.status === true || subcategory.status === 'active'}
                    onCheckedChange={(checked) => handleStatusChange(subcategory.id, checked)}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end">
                    <ActionsDropdown
                      subcategory={subcategory}
                      categories={categories}
                      formData={formData}
                      setFormData={setFormData}
                      errors={errors}
                      handleSubmit={handleSubmit}
                      onEdit={handleEdit}
                      onDelete={handleDeleteClick}
                      onView={(sub) => {
                        setSelectedSubcategory(sub);
                        setIsViewDialogOpen(true);
                      }}
                      setIsDialogOpen={setIsDialogOpen}
                      setSelectedSubcategory={setSelectedSubcategory}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="p-2 md:p-4">
        <Pagination className="justify-end">
          <PaginationContent>
            <PaginationItem>
              {pagination.currentPage > 1 && (
                <PaginationPrevious
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  className="border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-600 transition-colors"
                />
              )}
            </PaginationItem>
            {Array.from({ length: Math.min(5, pagination.lastPage) }, (_, i) => {
              const page = Math.max(1, Math.min(pagination.currentPage - 2, pagination.lastPage - 4)) + i;
              return (
                <PaginationItem key={page}>
                  <PaginationLink
                    isActive={page === pagination.currentPage}
                    onClick={() => handlePageChange(page)}
                    className={cn(
                      "border-gray-200 transition-colors",
                      page === pagination.currentPage 
                        ? "bg-gray-200 text-gray-500 hover:bg-gray-300 border-gray-300" 
                        : "text-gray-500 hover:border-gray-300 hover:text-gray-600"
                    )}
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
                  className="border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-600 transition-colors"
                />
              )}
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </Card>

    {/* Boîte de dialogue de visualisation */}
    <Dialog 
      open={isViewDialogOpen} 
      onOpenChange={(open) => {
        setIsViewDialogOpen(open);
        if (!open) {
          cleanupPointerEvents();
        }
      }}
    >
      <DialogContent className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] max-w-[95vw] w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0 bg-white rounded-lg shadow-lg">
        <button
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
          onClick={() => setIsViewDialogOpen(false)}
        >
          <Icon icon="lucide:x" className="h-4 w-4" />
          <span className="sr-only">Fermer</span>
        </button>

        {selectedSubcategory && (
          <div className="max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white z-20 px-6 pt-6 pb-4 border-b">
              <DialogHeader>
                <DialogTitle className="text-xl sm:text-2xl font-bold text-[#00897B] flex items-center gap-2">
                  <div className="w-8 sm:w-10 h-8 sm:h-10 rounded-full bg-[#00897B]/10 flex items-center justify-center">
                    <Icon icon="lucide:folder-open" className="h-4 sm:h-5 w-4 sm:w-5 text-[#00897B]" />
                  </div>
                  Détails de la Sous-catégorie
                </DialogTitle>
                <DialogDescription className="text-sm text-gray-500">
                  Sous-catégorie #{selectedSubcategory.id}
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <InfoField 
                  label="Nom"
                  value={selectedSubcategory.name}
                  icon={<Icon icon="lucide:tag" className="h-5 w-5" />}
                />
                <InfoField 
                  label="Catégorie Parente"
                  value={categories.find(cat => cat.id === selectedSubcategory.category_id)?.name || 'Inconnue'}
                  icon={<Icon icon="lucide:folder" className="h-5 w-5" />}
                />
                <InfoField 
                  label="Description"
                  value={selectedSubcategory.description || '-'}
                  icon={<Icon icon="lucide:align-left" className="h-5 w-5" />}
                  fullWidth
                />
                <InfoField 
                  label="Créée le"
                  value={format(new Date(selectedSubcategory.created_at), 'PPpp')}
                  icon={<Icon icon="lucide:calendar" className="h-5 w-5" />}
                />
                <InfoField 
                  label="Modifiée le"
                  value={selectedSubcategory.updated_at ? format(new Date(selectedSubcategory.updated_at), 'PPpp') : '-'}
                  icon={<Icon icon="lucide:clock" className="h-5 w-5" />}
                />
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t p-4 sm:p-6">
              <Button
                variant="outline"
                onClick={() => setIsViewDialogOpen(false)}
                className="w-full sm:w-auto"
              >
                Fermer
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  </div>
  );
};

export default SubCategories;