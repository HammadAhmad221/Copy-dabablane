import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/admin/components/ui/dialog";
import { format } from 'date-fns';
import { PencilIcon, TrashIcon, PlusIcon } from "lucide-react";
import { Switch } from "@/admin/components/ui/switch";
import { couponApi } from '@/admin/lib/api/services/couponService';
import { Coupon, CouponFormData, CouponResponse } from '@/lib/types/coupon';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from '@/admin/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/admin/components/ui/select";
import { categoryApi } from '@/admin/lib/api/services/categoryService';
import { Category } from '@/lib/types/category';
import { motion } from 'framer-motion';
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/admin/components/ui/dropdown-menu";
import { MoreVertical as MoreVerticalIcon, Eye as EyeIcon } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/admin/components/ui/alert-dialog";

// Update the Zod schema to match backend validation
const couponSchema = z.object({
  code: z.string()
    .min(1, 'Code is required')
    .max(255, 'Code must be less than 255 characters'),
  discount: z.number()
    .min(0, 'Discount must be at least 0'),
  validity: z.string()
    .min(1, 'Validity date is required'),
  minPurchase: z.number()
    .min(0, 'Minimum purchase must be at least 0')
    .optional(),
  max_usage: z.number()
    .int()
    .min(0, 'Maximum usage must be at least 0')
    .optional(),
  description: z.string().optional(),
  categories_id: z.number()
    .min(1, 'Category is required'),
  is_active: z.boolean(),
});

// Add InfoField component at the top of the file
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

// Add popupAnimationVariants
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

const Coupons: React.FC = () => {
  // State for coupons, loading, and pagination
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    perPage: 10,
    total: 0,
    lastPage: 1,
  });

  // State for search and sorting
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<string | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | undefined>(undefined);

  // State for coupon form
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CouponFormData>({
    code: '',
    discount: 0,
    validity: '',
    minPurchase: 0,
    max_usage: 0,
    description: '',
    is_active: true,
    categories_id: 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // State for delete confirmation
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [couponToDelete, setCouponToDelete] = useState<string | null>(null);

  // State for categories
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Available page sizes
  const pageSizes = [5, 10, 20, 50, 100];

  // Add new state for categories
  const [categories, setCategories] = useState<Category[]>([]);

  // Add new state for view dialog
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedViewCoupon, setSelectedViewCoupon] = useState<Coupon | null>(null);

  // Add new state for filters
  const [filters, setFilters] = useState({});

  // Update the pagination size state and handler
  const [paginationSize, setPaginationSize] = useState<number>(10);

  // Update the fetchCoupons function
  const fetchCoupons = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await couponApi.getCoupons({
        page: pagination.currentPage,
        paginationSize: paginationSize,
        search: filters.search || '',
        category_id: filters.category_id || undefined,
      });
      
      setCoupons(response.data);
      setPagination(prev => ({
        ...prev,
        total: response.meta.total,
        lastPage: response.meta.last_page
      }));
    } catch (error) {
      toast.error('Failed to fetch coupons');
    } finally {
      setIsLoading(false);
    }
  }, [pagination.currentPage, paginationSize, filters]);

  // Then add handlePaginationSizeChange after fetchCoupons
  const handlePaginationSizeChange = useCallback(
    (value: string) => {
      const newPaginationSize = parseInt(value, 10);
      setPaginationSize(newPaginationSize);
      setPagination(prev => ({
        ...prev,
        perPage: newPaginationSize,
        currentPage: 1 // Reset to first page when changing size
      }));
      fetchCoupons();
    },
    [fetchCoupons]
  );

  // Fetch coupons on component mount or when dependencies change
  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoryApi.getCategories({});
        setCategories(response.data);
      } catch (error) {
        toast.error('Failed to fetch categories');
      }
    };
    fetchCategories();
  }, []);

  // Handle search
  const handleSearch = useCallback(
    (term: string) => {
      setSearchTerm(term);
      setFilters(prev => ({ ...prev, search: term }));
    },
    []
  );

  // Handle page change
  const handlePageChange = useCallback(
    (page: number) => {
      setPagination(prev => ({ ...prev, currentPage: page }));
      fetchCoupons();
    },
    [fetchCoupons]
  );

  // Handle sorting
  const handleSort = useCallback(
    (column: string) => {
      const newSortOrder = sortBy === column && sortOrder === 'asc' ? 'desc' : 'asc';
      setSortBy(column);
      setSortOrder(newSortOrder);
      setFilters(prev => ({ ...prev, sortBy: column, sortOrder: newSortOrder }));
      fetchCoupons();
    },
    [fetchCoupons, sortBy, sortOrder]
  );

  // Handle coupon edit
  const handleEdit = useCallback((coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setFormData({
      code: coupon.code,
      discount: coupon.discount,
      validity: format(new Date(coupon.validity), 'yyyy-MM-dd'),
      minPurchase: coupon.minPurchase,
      max_usage: coupon.max_usage,
      description: coupon.description,
      is_active: coupon.is_active === 1,
      categories_id: coupon.categories_id,
    });
    setIsDialogOpen(true);
  }, []);

  // Handle delete confirmation
  const handleDeleteClick = useCallback((couponId: string) => {
    setCouponToDelete(couponId);
    setIsDeleteDialogOpen(true);
  }, []);

  // Handle actual deletion
  const handleDeleteConfirm = useCallback(async () => {
    if (!couponToDelete) return;

    try {
      await couponApi.deleteCoupon(couponToDelete);
      setCoupons((prev) => prev.filter((coupon) => coupon.id.toString() !== couponToDelete));
      toast.success('Coupon deleted successfully!');
    } catch (error) {
      toast.error('Failed to delete coupon. Please try again later.');
    } finally {
      setIsDeleteDialogOpen(false);
      setCouponToDelete(null);
    }
  }, [couponToDelete]);

  // Handle form submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      try {
        couponSchema.parse(formData);
        setErrors({});

        if (selectedCoupon) {
          const updatedCoupon = await couponApi.updateCoupon(selectedCoupon.id.toString(), formData);
          setCoupons((prev) =>
            prev.map((coupon) => (coupon.id === selectedCoupon.id ? updatedCoupon : coupon))
          );
          toast.success('Coupon updated successfully!');
        } else {
          const newCoupon = await couponApi.createCoupon(formData);
          setCoupons((prev) => [...prev, newCoupon]);
          toast.success('Coupon created successfully!');
        }
        setIsDialogOpen(false);
        setSelectedCoupon(null);
        setFormData({
          code: '',
          discount: 0,
          validity: '',
          minPurchase: 0,
          max_usage: 0,
          description: '',
          is_active: true,
          categories_id: 0,
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          const errorMap: Record<string, string> = {};
          error.errors.forEach((err) => {
            if (err.path) {
              errorMap[err.path[0]] = err.message;
            }
          });
          setErrors(errorMap);
          toast.error('Please fix the errors in the form.');
          return;
        }
        // Handle backend validation errors
        if (error.response?.data?.error) {
          const backendErrors = error.response.data.error;
          setErrors(backendErrors);
          // Show the specific error message for duplicate code
          if (backendErrors.code) {
            toast.error(backendErrors.code[0]);
          } else {
            toast.error('Failed to save coupon. Please try again later.');
          }
          return;
        }
        toast.error('Failed to save coupon. Please try again later.');
      }
    },
    [formData, selectedCoupon]
  );

  // Handle page size change
  const handlePageSizeChange = useCallback((newSize: string) => {
    setPagination(prev => ({ ...prev, perPage: parseInt(newSize) }));
    fetchCoupons();
  }, [fetchCoupons]);

  // Update the handleCategoryChange function
  const handleCategoryChange = useCallback((category: string) => {
    setSelectedCategory(category);
    setFilters(prev => ({ ...prev, category_id: category === 'all' ? undefined : parseInt(category) }));
    fetchCoupons();
  }, [fetchCoupons]);

  // Update the category select in the form
  const categorySelectJSX = (
    <div>
      <label className="text-sm font-medium">Category</label>
      <Select
        value={filters.category_id?.toString() || 'all'}
        onValueChange={(value) => {
          const newFilters = {
            ...filters,
            category_id: value === 'all' ? undefined : parseInt(value),
          };
          setFilters(newFilters);
          setPagination(prev => ({ ...prev, currentPage: 1 })); // Reset to first page
          fetchCoupons();
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select a category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {categories.map((category) => (
            <SelectItem 
              key={category.id} 
              value={category.id.toString()}
            >
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {errors.categories_id && <p className="text-sm text-red-500">{errors.categories_id}</p>}
    </div>
  );

  const handleCancel = useCallback(() => {
    setIsDialogOpen(false);
    setSelectedCoupon(null);
    setFormData({
      code: '',
      discount: 0,
      validity: '',
      minPurchase: 0,
      max_usage: 0,
      description: '',
      is_active: true,
      categories_id: 0,
    });
  }, []);

  // Add handleView function
  const handleView = useCallback((coupon: Coupon) => {
    setSelectedViewCoupon(coupon);
    setIsViewDialogOpen(true);
  }, []);

  return (
<div className="space-y-6 max-w-[350px] lg:max-w-full w-full">
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
            <h2 className="text-2xl font-bold">Gestion des coupons</h2>
            <p className="text-gray-100 mt-1">Créer et gérer des coupons de réduction</p>
          </div>
          <Button 
            onClick={() => setIsDialogOpen(true)}
            className="bg-white text-[#00897B] hover:bg-gray-100 transition-colors"
          >
            <Icon icon="lucide:plus" className="mr-2 h-4 w-4" />
            Ajouter un coupon
          </Button>
        </div>
      </div>

      {/* Recherche et filtres avec un meilleur espacement */}
      <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
        <div className="flex flex-col gap-4 md:flex-row md:items-center mb-6">
          <div className="flex-1">
            <Input
              placeholder="Rechercher des coupons..."
              value={filters.search || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="max-w-xs"
            />
          </div>
          
          <div className="flex gap-2 items-center">
            <Select
              value={filters.category_id?.toString() || 'all'}
              onValueChange={(value) => {
                const newFilters = {
                  ...filters,
                  category_id: value === 'all' ? undefined : parseInt(value),
                };
                setFilters(newFilters);
                setPagination(prev => ({ ...prev, currentPage: 1 })); // Réinitialiser à la première page
                fetchCoupons();
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sélectionner une catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                {categories.map((category) => (
                  <SelectItem 
                    key={category.id} 
                    value={category.id.toString()}
                  >
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={paginationSize.toString()}
              onValueChange={handlePaginationSizeChange}
            >
              <SelectTrigger className="w-[140px]">
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
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 border-b border-gray-200">
                <TableHead className="font-semibold w-[50px] hidden md:table-cell">ID</TableHead>
                <TableHead className="font-semibold cursor-pointer">
                  Code {sortBy === 'code' && (sortOrder === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead className="font-semibold hidden md:table-cell">Détails</TableHead>
                <TableHead className="font-semibold">Statut</TableHead>
                <TableHead className="font-semibold w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex items-center justify-center">
                      <Icon icon="lucide:loader" className="h-6 w-6 animate-spin text-primary" />
                      <span className="ml-2">Chargement...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : coupons.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <Icon icon="lucide:ticket" className="h-12 w-12 mb-2" />
                      <p>Aucun coupon trouvé</p>
                      <Button
                        variant="link"
                        onClick={() => setIsDialogOpen(true)}
                        className="mt-2 text-primary"
                      >
                        Créez votre premier coupon
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                coupons.map((coupon) => (
                  <React.Fragment key={coupon.id}>
                    <TableRow className="md:hidden">
                      <TableCell>
                        <div className="flex flex-col space-y-1">
                          <div className="font-medium">{coupon.code}</div>
                          <div className="text-sm text-gray-500">
                            Réduction : {Math.round(coupon.discount)}%
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={cn(
                          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                          coupon.is_active === 1 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        )}>
                          {coupon.is_active === 1 ? 'Actif' : 'Inactif'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="relative" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu modal={false}>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                className="h-9 w-9 p-0"
                              >
                                <MoreVerticalIcon className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent 
                              align="end" 
                              className="w-[160px] z-[100]"
                            >
                              <DropdownMenuItem 
                                onClick={() => handleView(coupon)}
                                className="cursor-pointer"
                              >
                                <EyeIcon className="mr-2 h-4 w-4" />
                                Voir les détails
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleEdit(coupon)}
                                className="cursor-pointer"
                              >
                                <PencilIcon className="mr-2 h-4 w-4" />
                                Modifier
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteClick(coupon.id.toString())}
                                className="cursor-pointer text-red-600"
                              >
                                <TrashIcon className="mr-2 h-4 w-4" />
                                Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>

                    <TableRow className="hidden md:table-row">
                      <TableCell>{coupon.id}</TableCell>
                      <TableCell>{coupon.code}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p><span className="font-medium">Réduction :</span> {Math.round(coupon.discount)}%</p>
                          <p><span className="font-medium">Achat min. :</span> {coupon.minPurchase || '-'}</p>
                          <p><span className="font-medium">Utilisation max :</span> {coupon.max_usage || '-'}</p>
                          <p><span className="font-medium">Validité :</span> {format(new Date(coupon.validity), 'PP')}</p>
                          {coupon.description && (
                            <p className="truncate max-w-[200px]" title={coupon.description}>
                              <span className="font-medium">Description :</span> {coupon.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={cn(
                          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                          coupon.is_active === 1 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        )}>
                          {coupon.is_active === 1 ? 'Actif' : 'Inactif'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleView(coupon)}
                            title="Voir les détails"
                          >
                            <Icon icon="lucide:eye" className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEdit(coupon)}
                            title="Modifier"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => handleDeleteClick(coupon.id.toString())}
                            title="Supprimer"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
        {/* Pagination mobile */}
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

        {/* Pagination desktop */}
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

      {/* Dialogues */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
                    <Icon icon={selectedCoupon ? "lucide:edit" : "lucide:plus"} className="h-4 sm:h-5 w-4 sm:w-5 text-[#00897B]" />
                  </div>
                  {selectedCoupon ? "Modifier le coupon" : "Ajouter un nouveau coupon"}
                </DialogTitle>
                <DialogDescription className="text-sm text-gray-500">
                  {selectedCoupon 
                    ? "Mettez à jour les détails de ce coupon" 
                    : "Créez un nouveau coupon de réduction"}
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Code</label>
                    <Input
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      placeholder="Entrez le code du coupon"
                    />
                    {errors.code && <p className="text-sm text-red-500 mt-1">{errors.code}</p>}
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Réduction (%)</label>
                    <Input
                      type="number"
                      value={formData.discount}
                      onChange={(e) => setFormData({ ...formData, discount: Number(e.target.value) })}
                      placeholder="Entrez le pourcentage de réduction"
                    />
                    {errors.discount && <p className="text-sm text-red-500 mt-1">{errors.discount}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Achat minimum</label>
                    <Input
                      type="number"
                      value={formData.minPurchase}
                      onChange={(e) => setFormData({ ...formData, minPurchase: Number(e.target.value) })}
                      placeholder="Entrez l'achat minimum"
                    />
                    {errors.minPurchase && <p className="text-sm text-red-500 mt-1">{errors.minPurchase}</p>}
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Utilisation maximale</label>
                    <Input
                      type="number"
                      value={formData.max_usage}
                      onChange={(e) => setFormData({ ...formData, max_usage: Number(e.target.value) })}
                      placeholder="Entrez l'utilisation maximale"
                    />
                    {errors.max_usage && <p className="text-sm text-red-500 mt-1">{errors.max_usage}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Date de validité</label>
                    <Input
                      type="date"
                      value={formData.validity}
                      onChange={(e) => setFormData({ ...formData, validity: e.target.value })}
                    />
                    {errors.validity && <p className="text-sm text-red-500 mt-1">{errors.validity}</p>}
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Catégorie</label>
                    <Select
                      value={formData.categories_id ? formData.categories_id.toString() : ""}
                      onValueChange={(value) => setFormData({ ...formData, categories_id: parseInt(value) })}
                    >
                      <SelectTrigger className="w-full">
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
                    {errors.categories_id && <p className="text-sm text-red-500 mt-1">{errors.categories_id}</p>}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Description</label>
                  <Input
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Entrez la description du coupon"
                  />
                  {errors.description && <p className="text-sm text-red-500 mt-1">{errors.description}</p>}
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <label className="text-sm font-medium">Actif</label>
                </div>

                <div className="sticky bottom-0 bg-white border-t mt-6 px-6 py-4">
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={handleCancel}>Annuler</Button>
                    <Button type="submit">{selectedCoupon ? 'Enregistrer' : 'Ajouter le coupon'}</Button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] max-w-[95vw] w-full sm:max-w-[400px] p-0 overflow-hidden bg-white rounded-lg shadow-lg">
          <motion.div
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={popupAnimationVariants.content}
            className="p-6"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
                <Icon icon="lucide:trash-2" className="h-6 w-6 text-red-600" />
              </div>
              <AlertDialogHeader className="space-y-2">
                <AlertDialogTitle className="text-xl font-semibold">
                  Supprimer le coupon
                </AlertDialogTitle>
                <AlertDialogDescription className="text-gray-500">
                  Êtes-vous sûr de vouloir supprimer ce coupon ? Cette action est irréversible.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <div className="w-full mt-6">
                <AlertDialogFooter className="flex flex-col sm:flex-row gap-2 w-full">
                  <AlertDialogCancel 
                    className="w-full sm:w-auto mt-0"
                    onClick={() => setIsDeleteDialogOpen(false)}
                  >
                    Annuler
                  </AlertDialogCancel>
                  <AlertDialogAction
                    className="w-full sm:w-auto bg-red-600 hover:bg-red-700"
                    onClick={handleDeleteConfirm}
                  >
                    Supprimer le coupon
                  </AlertDialogAction>
                </AlertDialogFooter>
              </div>
            </div>
          </motion.div>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] max-w-[95vw] w-full sm:max-w-2xl p-0 overflow-hidden bg-white rounded-lg shadow-lg">
          <button
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
            onClick={() => setIsViewDialogOpen(false)}
          >
            <Icon icon="lucide:x" className="h-4 w-4" />
            <span className="sr-only">Fermer</span>
          </button>

          <div className="max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white z-20 px-6 pt-6 pb-4 border-b">
              <DialogHeader>
                <DialogTitle className="text-xl sm:text-2xl font-bold text-[#00897B] flex items-center gap-2">
                  <div className="w-8 sm:w-10 h-8 sm:h-10 rounded-full bg-[#00897B]/10 flex items-center justify-center">
                    <Icon icon="lucide:ticket" className="h-4 sm:h-5 w-4 sm:w-5 text-[#00897B]" />
                  </div>
                  Détails du coupon
                </DialogTitle>
                <DialogDescription className="text-sm text-gray-500">
                  Coupon #{selectedViewCoupon?.id}
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <InfoField 
                  label="Code"
                  value={selectedViewCoupon?.code}
                  icon={<Icon icon="lucide:tag" className="h-5 w-5" />}
                />
                <InfoField 
                  label="Réduction"
                  value={`${Math.round(selectedViewCoupon?.discount || 0)}%`}
                  icon={<Icon icon="lucide:percent" className="h-5 w-5" />}
                />
                <InfoField 
                  label="Achat minimum"
                  value={selectedViewCoupon?.minPurchase || '-'}
                  icon={<Icon icon="lucide:shopping-cart" className="h-5 w-5" />}
                />
                <InfoField 
                  label="Utilisation maximale"
                  value={selectedViewCoupon?.max_usage || '-'}
                  icon={<Icon icon="lucide:users" className="h-5 w-5" />}
                />
                <InfoField 
                  label="Validité"
                  value={selectedViewCoupon?.validity ? format(new Date(selectedViewCoupon.validity), 'PPpp') : '-'}
                  icon={<Icon icon="lucide:calendar" className="h-5 w-5" />}
                />
                <InfoField 
                  label="Statut"
                  value={selectedViewCoupon?.is_active === 1 ? 'Actif' : 'Inactif'}
                  icon={<Icon icon="lucide:activity" className="h-5 w-5" />}
                />
                {selectedViewCoupon?.description && (
                  <InfoField 
                    label="Description"
                    value={selectedViewCoupon.description}
                    icon={<Icon icon="lucide:file-text" className="h-5 w-5" />}
                    fullWidth
                  />
                )}
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
        </DialogContent>
      </Dialog>

    </motion.div>
  </Card>
</div>
  );
};

export default Coupons;