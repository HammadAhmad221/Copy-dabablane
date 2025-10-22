import * as React from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card } from "@/admin/components/ui/card";
import { Button } from "@/admin/components/ui/button";
import { Input } from "@/admin/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/admin/components/ui/table";
import { Textarea } from "@/admin/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/admin/components/ui/dialog";
import { format } from 'date-fns';
import { PencilIcon, TrashIcon, PlusIcon, ImageIcon, EyeIcon } from "lucide-react";
import { categoryApi } from '@/admin/lib/api/services/categoryService';
import { categoryValidationSchema, CategoryFormData, Category } from '@/lib/types/category';
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
import { motion } from 'framer-motion';
import { getPlaceholderImage } from '@/user/lib/utils/home';
import { Switch } from "@/admin/components/ui/switch";

const InfoField = ({ 
  label, 
  value, 
  icon,
  fullWidth = false,
  wrapText = false // New prop to control text wrapping
}: { 
  label: string; 
  value: React.ReactNode; 
  icon?: React.ReactNode;
  fullWidth?: boolean;
  wrapText?: boolean; // Add this prop
}) => (
  <motion.div 
    className={`bg-white rounded-lg p-4 shadow-sm border ${fullWidth ? 'col-span-full' : ''}`}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <div className="flex items-start gap-3">
      {icon && <div className="text-gray-400 mt-1 flex-shrink-0">{icon}</div>}
      <div className="flex-1 min-w-0"> {/* Add min-w-0 to enable text truncation */}
        <label className="block text-sm font-medium text-gray-500 mb-1">
          {label}
        </label>
        <div className={cn(
          "text-gray-900 font-medium",
          wrapText ? "break-words" : "truncate",
          fullWidth && "whitespace-pre-wrap"
        )}>
          {value}
        </div>
      </div>
    </div>
  </motion.div>
);

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

const Categories: React.FC = () => {
  // State for search, sorting, and filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null);
  const [paginationSize, setPaginationSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    perPage: 10,
    total: 0,
    lastPage: 1,
  });

  // Query params for categories
  const queryParams = useMemo(() => ({
    page: currentPage,
    paginationSize,
    sortBy,
    sortOrder,
    search: searchTerm,
  }), [currentPage, paginationSize, sortBy, sortOrder, searchTerm]);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await categoryApi.getCategories(queryParams);
      setCategories(response.data || []);
      setPagination({
        currentPage: response.meta?.current_page || 1,
        perPage: response.meta?.per_page || 10,
        total: response.meta?.total || 0,
        lastPage: response.meta?.last_page || 1,
      });
    } catch (error) {
      toast.error('Failed to fetch categories. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, [queryParams]);

  // Fetch categories on component mount or when dependencies change
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // State for category form
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: '',
    image_file: null,
    subcategories: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Add state for selected file
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);

  // Add state for delete dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  // Add state for view dialog
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  // Add new state for tracking form interaction
  const [formTouched, setFormTouched] = useState({
    name: false,
    image: false
  });

  // Handle search with debounce
  const handleSearch = useCallback(
    debounce((term: string) => {
      setSearchTerm(term);
      setCurrentPage(1); // Reset to page 1 when searching
    }, 500),
    []
  );

  // Handle page change
  const handlePageChange = useCallback(
    (page: number) => {
      setCurrentPage(page);
    },
    []
  );

  // Handle pagination size change
  const handlePaginationSizeChange = useCallback(
    (value: string) => {
      const newPaginationSize = parseInt(value, 10);
      setPaginationSize(newPaginationSize);
      setCurrentPage(1); // Reset to page 1 when changing page size
    },
    []
  );

  // Handle sorting
  const handleSort = useCallback(
    (column: string) => {
      const newSortOrder = sortBy === column && sortOrder === 'asc' ? 'desc' : 'asc';
      setSortBy(column);
      setSortOrder(newSortOrder);
      setCurrentPage(1); // Reset to page 1 when sorting
    },
    [sortBy, sortOrder]
  );

  // Handle category edit
  const handleEdit = useCallback((category: Category) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      description: category.description,
      image_file: null,
      subcategories: category.subcategories?.map(sub => ({
        id: sub.id,
        name: sub.name,
        description: sub.description
      })) || [],
    });
    setIsDialogOpen(true);
  }, []);

  // Handle delete 
  const handleDelete = useCallback(async (categoryId: string) => {
    try {
      await categoryApi.deleteCategory(categoryId);
      await fetchCategories(); // Refresh the list after deletion
      toast.success('Category deleted successfully!');
      setIsDeleteDialogOpen(false); // Close dialog after successful deletion
    } catch (error) {
      toast.error('Failed to delete category. Please try again later.');
    }
  }, [fetchCategories]);

  // Update the image handling in the file input section
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImageFile(file);
      setFormData(prev => ({ ...prev, image_file: file }));
      // Remove validation check
      if (errors.image_file) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.image_file;
          return newErrors;
        });
      }
    }
  };

  // Add cleanup for image preview when dialog closes
  useEffect(() => {
    if (!isDialogOpen) {
      // Cleanup image preview URL when dialog closes
      if (selectedImageFile) {
        URL.revokeObjectURL(URL.createObjectURL(selectedImageFile));
      }
      // Reset form and selected files
      setSelectedImageFile(null);
      setFormData({
        name: '',
        description: '',
        image_file: null,
        subcategories: [],
      });
      setErrors({});
    }
  }, [isDialogOpen]);

  // Add dialog close handler
  const handleDialogClose = useCallback(() => {
    setIsDialogOpen(false);
    setSelectedCategory(null);
    setSelectedImageFile(null);
    setFormData({
      name: '',
      description: '',
      image_file: null,
      subcategories: [],
    });
    setErrors({});
    setFormTouched({ name: false, image: false });
  }, []);

  // Simplify handleDescriptionChange to just update form data
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, description: value }));
  };

  // Update handleSubmit to check for duplicate category names
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Show all validation errors on submit
      const newErrors: Record<string, string> = {};
      if (!formData.name.trim()) {
        newErrors.name = 'Le champ nom est requis.';
      } else {
        // Check for duplicate names, but ignore the current category when editing
        const isDuplicate = categories.some(category => 
          category.name.toLowerCase() === formData.name.trim().toLowerCase() && 
          category.id !== selectedCategory?.id
        );
        
        if (isDuplicate) {
          newErrors.name = 'Une catégorie avec ce nom existe déjà.';
        }
      }

      if (!selectedCategory && !selectedImageFile) {
        newErrors.image_file = 'An image is required for new categories.';
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        // Set all fields as touched when submitting
        setFormTouched({ name: true, image: true });
        return;
      }

      try {
        const categoryFormData = new FormData();
        
        // Append form data
        categoryFormData.append('name', formData.name.trim());
        
        // Only append description if it has content
        if (formData.description?.trim()) {
          categoryFormData.append('description', formData.description.trim());
        }
        
        // Handle image file
        if (selectedImageFile) {
          categoryFormData.append('image_file', selectedImageFile);
        } else if (selectedCategory?.image_link && !selectedImageFile) {
          categoryFormData.append('image_link', selectedCategory.image_link);
        }

        // Only append subcategories if they exist
        if (formData.subcategories?.length) {
          categoryFormData.append('subcategories', JSON.stringify(formData.subcategories));
        }

        if (selectedCategory) {
          // For edit, call the updateCategory API directly instead of using mutation
          const updatedCategory = await categoryApi.updateCategory(
            selectedCategory.id,
            categoryFormData
          );
          await fetchCategories(); // Refresh the list after update
          toast.success('Category updated successfully!');
        } else {
          // For create, call the createCategory API directly instead of using mutation
          const newCategory = await categoryApi.createCategory(categoryFormData);
          await fetchCategories(); // Refresh the list after create
          toast.success('Category created successfully!');
        }

        handleDialogClose();
      } catch (error) {
        
        if (error instanceof z.ZodError) {
          const errorMap: Record<string, string> = {};
          error.errors.forEach((err) => {
            if (err.path) {
              errorMap[err.path[0]] = err.message;
            }
          });
          setErrors(errorMap);
          toast.error('Please fix the form errors.');
        } else if (error.response?.data?.error) {
          // Handle Laravel validation errors
          const backendErrors = error.response.data.error;
          const formattedErrors: Record<string, string> = {};
          
          Object.keys(backendErrors).forEach((key) => {
            formattedErrors[key] = Array.isArray(backendErrors[key]) 
              ? backendErrors[key][0] 
              : backendErrors[key];
          });
          
          setErrors(formattedErrors);
          toast.error(Object.values(formattedErrors)[0] || 'Validation failed');
        } else {
          toast.error('Failed to save category. Please try again later.');
        }
      }
    },
    [formData, selectedCategory, selectedImageFile, handleDialogClose, categories, fetchCategories]
  );

  // Update handleNameChange to only update form data
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, name: value }));
    // Remove validation check
    if (value.trim() && errors.name) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.name;
        return newErrors;
      });
    }
  };

  return (
<div className="">
  <Card className="p-6 shadow-lg border-0">
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* En-tête avec fond dégradé */}
      <div className="p-6 -mx-6 -mt-6 mb-6 bg-gradient-to-r from-[#00897B] to-[#00796B] rounded-t-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="text-white">
            <h2 className="text-2xl font-bold">Gestion des Catégories</h2>
            <p className="text-gray-100 mt-1">Organisez et gérez vos catégories</p>
          </div>
          <Button 
            onClick={() => setIsDialogOpen(true)}
            className="bg-white text-[#00897B] hover:bg-gray-100 transition-colors"
          >
            <PlusIcon className="mr-2 h-4 w-4" />
            Ajouter une Catégorie
          </Button>
        </div>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
        {/* Barre de recherche */}
        <div className="relative w-full">
          <Input
            placeholder="Rechercher des catégories..."
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

        {/* Filtres */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Select
            value={sortBy || "created_at"}
            onValueChange={(value) => handleSort(value)}
          >
            <SelectTrigger className="w-full bg-white">
              <SelectValue placeholder="Trier par" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at">Date de création</SelectItem>
              <SelectItem value="name">Nom</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={sortOrder || "desc"}
            onValueChange={(value) => setSortOrder(value as 'asc' | 'desc')}
          >
            <SelectTrigger className="w-full bg-white">
              <SelectValue placeholder="Ordre de tri" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">Croissant</SelectItem>
              <SelectItem value="desc">Décroissant</SelectItem>
            </SelectContent>
          </Select>

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

      {/* Tableau des catégories */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 border-b border-gray-200">
                <TableHead className="w-[300px] font-semibold">Détails</TableHead>
                <TableHead className="hidden lg:table-cell font-semibold">Description</TableHead>
                <TableHead className="hidden lg:table-cell w-[180px] font-semibold">Dates</TableHead>
                <TableHead className="w-[100px] text-center font-semibold">Statut</TableHead>
                <TableHead className="w-[120px] text-right font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <div className="flex items-center justify-center">
                      <Icon icon="lucide:loader" className="h-6 w-6 animate-spin text-primary" />
                      <span className="ml-2">Chargement...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <Icon icon="lucide:inbox" className="h-12 w-12 mb-2" />
                      <p>Aucune catégorie trouvée</p>
                      <Button
                        variant="link"
                        onClick={() => setIsDialogOpen(true)}
                        className="mt-2 text-primary"
                      >
                        Créez votre première catégorie
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((category) => (
                  <TableRow key={category.id} className="group hover:bg-gray-50">
                    <TableCell>
                      <div className="flex flex-col space-y-1">
                        <div className="font-medium text-base truncate">
                          {category.name}
                        </div>
                        <div className="lg:hidden space-y-1 text-sm text-gray-600">
                          <div className="line-clamp-2">{category.description}</div>
                          <div className="flex items-center gap-2">
                            <Icon icon="lucide:calendar" className="h-4 w-4" />
                            <span>{format(new Date(category.created_at), 'PP')}</span>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="line-clamp-2">{category.description}</div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-1">
                          <Icon icon="lucide:clock" className="h-4 w-4" />
                          <span>{format(new Date(category.created_at), 'PP')}</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-500">
                          <Icon icon="lucide:refresh-cw" className="h-4 w-4" />
                          <span>{format(new Date(category.updated_at), 'PP')}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={category.status === true || category.status === 'active'}
                        onCheckedChange={async (checked) => {
                          try {
                            // Convert boolean to expected status string
                            const newStatus = checked ? 'active' : 'inactive';
                            await categoryApi.updateStatusCategory(category.id, newStatus);
                            await fetchCategories(); // Refresh the list
                            toast.success(`Catégorie ${checked ? 'activée' : 'désactivée'} avec succès`);
                          } catch (error) {
                            // Show more specific error message based on the error response
                            const errorMessage = error.response?.data?.message 
                              || error.response?.data?.error 
                              || 'Erreur lors de la mise à jour du statut. Veuillez réessayer.';
                            toast.error(errorMessage);
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setSelectedCategory(category);
                            setIsViewDialogOpen(true);
                          }}
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEdit(category)}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => {
                            setCategoryToDelete(category.id);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
        <div className="flex flex-1 justify-end sm:hidden">
          {pagination.currentPage > 1 && (
            <PaginationPrevious
              onClick={() => handlePageChange(pagination.currentPage - 1)}
            />
          )}
          {pagination.currentPage < pagination.lastPage && (
            <PaginationNext
              onClick={() => handlePageChange(pagination.currentPage + 1)}
            />
          )}
        </div>

        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div className="text-sm text-gray-700">
            Affichage de{' '}
            <span className="font-medium">
              {((pagination.currentPage - 1) * pagination.perPage) + 1}
            </span>
            {' '}-{' '}
            <span className="font-medium">
              {Math.min(pagination.currentPage * pagination.perPage, pagination.total)}
            </span>
            {' '}sur{' '}
            <span className="font-medium">{pagination.total}</span>
            {' '}résultats
          </div>

          <div className="mt-0">
            <Pagination>
              <PaginationContent>
                {pagination.currentPage > 1 && (
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                      className="hover:bg-gray-100"
                    />
                  </PaginationItem>
                )}

                {Array.from(
                  { length: Math.min(5, pagination.lastPage) },
                  (_, i) => {
                    const page = Math.max(
                      1,
                      Math.min(pagination.currentPage - 2, pagination.lastPage - 4)
                    ) + i;
                    return (
                      <PaginationItem key={page}>
                        <PaginationLink
                          isActive={page === pagination.currentPage}
                          onClick={() => handlePageChange(page)}
                          className={cn(
                            "min-w-[2.25rem] justify-center",
                            page === pagination.currentPage 
                              ? "bg-gray-200 text-gray-800 hover:bg-gray-300" 
                              : "hover:bg-gray-100"
                          )}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  }
                )}

                {pagination.currentPage < pagination.lastPage && (
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                      className="hover:bg-gray-100"
                    />
                  </PaginationItem>
                )}
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      </div>
    </motion.div>

    {/* Boîte de dialogue pour ajouter/modifier une catégorie */}
    <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] max-w-[95vw] w-full sm:max-w-2xl p-0 overflow-hidden bg-white rounded-lg shadow-lg">
        <button
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
          onClick={() => setIsDialogOpen(false)}
        >
          <Icon icon="lucide:x" className="h-4 w-4" />
          <span className="sr-only">Fermer</span>
        </button>

        <div className="max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white z-20 px-6 pt-6 pb-4 border-b">
            <DialogHeader>
              <DialogTitle className="text-xl sm:text-2xl font-bold text-[#00897B] flex items-center gap-2">
                <div className="w-8 sm:w-10 h-8 sm:h-10 rounded-full bg-[#00897B]/10 flex items-center justify-center">
                  <Icon icon={selectedCategory ? "lucide:edit" : "lucide:plus"} className="h-4 sm:h-5 w-4 sm:w-5 text-[#00897B]" />
                </div>
                {selectedCategory ? "Modifier la Catégorie" : "Ajouter une Nouvelle Catégorie"}
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500">
                {selectedCategory 
                  ? "Modifiez les détails de cette catégorie" 
                  : "Créez une nouvelle catégorie pour vos éléments"}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-6 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">
                    Image {!selectedCategory && <span className="text-red-500">*</span>}
                  </label>
                  <div className="mt-1.5 grid gap-4">
                    <div className="relative">
                      <label 
                        htmlFor="image-upload" 
                        className={cn(
                          "flex flex-col items-center justify-center w-full h-40 px-4 transition bg-white border-2 border-dashed rounded-lg appearance-none cursor-pointer",
                          errors.image_file 
                            ? "border-red-500 hover:border-red-600" 
                            : "border-gray-300 hover:border-gray-400",
                          "focus:outline-none"
                        )}
                      >
                        <div className="flex flex-col items-center space-y-2">
                          {selectedImageFile ? (
                            <div className="relative w-full h-32">
                              <img 
                                src={URL.createObjectURL(selectedImageFile)}
                                alt="Preview" 
                                className="w-full h-full object-contain rounded-md"
                              />
                            </div>
                          ) : selectedCategory?.image_link ? (
                            <div className="relative w-full h-32">
                              <img 
                                src={getPlaceholderImage(selectedCategory.image_link, 400, 240)} 
                                alt={selectedCategory.name} 
                                className="w-full h-full object-contain rounded-md"
                              />
                            </div>
                          ) : (
                            <>
                              <ImageIcon className="w-8 h-8 text-gray-400" />
                              <span className="text-sm text-gray-500 text-center">
                                Cliquez ou glissez une image pour l'uploader
                              </span>
                              <span className="text-xs text-gray-400">
                                Formats supportés : PNG, JPG, GIF
                              </span>
                            </>
                          )}
                        </div>
                        <input
                          id="image-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageChange}
                        />
                      </label>
                      {(selectedImageFile || selectedCategory?.image_link) && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-6 w-6"
                          onClick={() => {
                            if (selectedImageFile) {
                              URL.revokeObjectURL(URL.createObjectURL(selectedImageFile));
                            }
                            setSelectedImageFile(null);
                            setFormData(prev => ({ ...prev, image_file: null }));
                          }}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  {errors.image_file && (
                    <p className="text-sm text-red-500 mt-1 flex items-center">
                      <span className="mr-1">⚠</span> {errors.image_file}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium">
                    Nom <span className="text-red-500">*</span>
                  </label>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleNameChange}
                    className={cn(
                      "mt-1.5",
                      errors.name && "border-red-500 focus-visible:ring-red-500"
                    )}
                    placeholder="Entrez le nom de la catégorie"
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500 mt-1 flex items-center">
                      <span className="mr-1">⚠</span> {errors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium">
                    Description
                  </label>
                  <Textarea
                    name="description"
                    value={formData.description}
                    onChange={handleDescriptionChange}
                    className="mt-1.5"
                    placeholder="Entrez la description de la catégorie"
                    rows={4}
                  />
                </div>
              </div>

              <DialogFooter className="mt-8 pt-4 border-t">
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleDialogClose}
                    className="w-full sm:w-auto"
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    className="w-full sm:w-auto bg-[#00897B] text-white hover:bg-[#00897B]/90"
                  >
                    {selectedCategory ? (
                      <>
                        <Icon icon="lucide:save" className="h-4 w-4 mr-2" />
                        Enregistrer les modifications
                      </>
                    ) : (
                      <>
                        <Icon icon="lucide:plus" className="h-4 w-4 mr-2" />
                        Créer la Catégorie
                      </>
                    )}
                  </Button>
                </div>
              </DialogFooter>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Boîte de dialogue de confirmation de suppression */}
    <AlertDialog 
      open={isDeleteDialogOpen} 
      onOpenChange={setIsDeleteDialogOpen}
    >
      <AlertDialogContent className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] max-w-[95vw] w-full sm:max-w-[400px] p-0 overflow-hidden bg-white rounded-lg shadow-lg">
        <motion.div
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={popupAnimationVariants.content}
          className="p-6"
        >
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <Icon icon="lucide:trash-2" className="h-6 w-6 text-red-600" />
            </div>
            <AlertDialogHeader className="space-y-2">
              <AlertDialogTitle className="text-xl font-semibold">
                Supprimer la Catégorie
              </AlertDialogTitle>
              <AlertDialogDescription className="text-gray-500">
                Êtes-vous sûr de vouloir supprimer cette catégorie ? Cette action est irréversible.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="w-full mt-6">
              <AlertDialogFooter className="flex flex-col sm:flex-row gap-2 w-full">
                <AlertDialogCancel 
                  className="w-full sm:w-auto mt-0"
                  onClick={() => {
                    setIsDeleteDialogOpen(false);
                    setCategoryToDelete(null);
                  }}
                >
                  Annuler
                </AlertDialogCancel>
                <AlertDialogAction
                  className="w-full sm:w-auto bg-red-600 hover:bg-red-700"
                  onClick={() => {
                    if (categoryToDelete) {
                      handleDelete(categoryToDelete);
                    }
                  }}
                >
                  Supprimer la Catégorie
                </AlertDialogAction>
              </AlertDialogFooter>
            </div>
          </div>
        </motion.div>
      </AlertDialogContent>
    </AlertDialog>

    {/* Boîte de dialogue de visualisation */}
    <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
      <DialogContent className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] max-w-[95vw] w-full sm:max-w-2xl p-0 overflow-hidden bg-white rounded-lg shadow-lg">
        <button
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
          onClick={() => setIsViewDialogOpen(false)}
        >
          <Icon icon="lucide:x" className="h-4 w-4" />
          <span className="sr-only">Fermer</span>
        </button>

        {selectedCategory && (
          <div className="max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white z-20 px-6 pt-6 pb-4 border-b">
              <DialogHeader>
                <DialogTitle className="text-xl sm:text-2xl font-bold text-[#00897B] flex items-center gap-2">
                  <div className="w-8 sm:w-10 h-8 sm:h-10 rounded-full bg-[#00897B]/10 flex items-center justify-center">
                    <Icon icon="lucide:folder" className="h-4 sm:h-5 w-4 sm:w-5 text-[#00897B]" />
                  </div>
                  Détails de la Catégorie
                </DialogTitle>
                <DialogDescription className="text-sm text-gray-500">
                  Catégorie #{selectedCategory.id}
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <InfoField 
                  label="Nom"
                  value={selectedCategory.name}
                  icon={<Icon icon="lucide:tag" className="h-5 w-5" />}
                />
                <InfoField 
                  label="Description"
                  value={selectedCategory.description || '-'}
                  icon={<Icon icon="lucide:align-left" className="h-5 w-5" />}
                />
                {selectedCategory.image_link && (
                  <InfoField 
                    label="Image"
                    value={
                      <div className="relative w-full h-32">
                        <img 
                          src={getPlaceholderImage(selectedCategory.image_link, 200, 120)} 
                          alt={selectedCategory.name} 
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>
                    }
                    icon={<Icon icon="lucide:image" className="h-5 w-5" />}
                    fullWidth
                  />
                )}
                <InfoField 
                  label="Créée le"
                  value={format(new Date(selectedCategory.created_at), 'PPpp')}
                  icon={<Icon icon="lucide:calendar" className="h-5 w-5" />}
                />
                <InfoField 
                  label="Modifiée le"
                  value={selectedCategory.updated_at ? format(new Date(selectedCategory.updated_at), 'PPpp') : '-'}
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
  </Card>
</div>
  );
};

export default Categories;