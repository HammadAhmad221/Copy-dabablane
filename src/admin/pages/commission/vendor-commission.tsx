import { useState, useEffect } from "react";
import { Card } from "@/admin/components/ui/card";
import { Button } from "@/admin/components/ui/button";
import { Input } from "@/admin/components/ui/input";
import { Label } from "@/admin/components/ui/label";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/admin/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/admin/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/admin/components/ui/alert-dialog";
import { Loader2, Plus, Edit } from "lucide-react";
import { toast } from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import { categoryApi } from "@/admin/lib/api/services/categoryService";
import { commissionApi } from "@/admin/lib/api/services/commissionService";
import type { Category } from "@/admin/lib/api/types/category";

// Hook to detect mobile/tablet screen
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 900);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
};

interface VendorCommission {
  id: number;
  category: string;
  categoryId: number;
  vendor: string;
  vendorId: number;
  percentage: number;
  partialPercentage: number;
  isActive: boolean;
}

const VendorCommission = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isMobile = useIsMobile();
  const [commissions, setCommissions] = useState<VendorCommission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCommission, setSelectedCommission] = useState<VendorCommission | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    category: "",
    categoryId: "",
    percentage: undefined as number | undefined,
    partialPercentage: undefined as number | undefined,
    isActive: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch categories for dropdown
  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true);
      try {
        const categoryResponse = await categoryApi.getCategories({ paginationSize: 100 });
        setCategories(categoryResponse.data || []);
        console.log('✅ Categories loaded:', categoryResponse.data);
      } catch (error) {
        console.error("Error fetching categories:", error);
        toast.error('Failed to load categories');
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);


  // Map API response to component format
  const mapApiResponseToCommission = (apiData: any, categoryNameMap?: Record<number, string>): VendorCommission => {
    const categoryId = apiData.category_id || 0;
    const vendorId = apiData.vendor_id || 0;
    
    // Try to get category name from map, then from apiData, then fallback to ID
    const categoryName = (categoryNameMap && categoryId ? categoryNameMap[categoryId] : undefined)
      || apiData.category_name 
      || categories.find(cat => Number(cat.id) === categoryId)?.name
      || `Category ${categoryId}`;
    
    // Try to get vendor name from apiData, then fallback to ID
    const vendorName = apiData.vendor_name || `Vendor ${vendorId}`;
    
    return {
      id: apiData.id || 0,
      category: categoryName,
      categoryId: categoryId,
      vendor: vendorName,
      vendorId: vendorId,
      percentage: apiData.commission_rate || apiData.custom_commission_rate || 0,
      partialPercentage: apiData.partial_commission_rate || 0,
      isActive: apiData.is_active !== false,
    };
  };

  // Function to fetch commissions from API
  const fetchCommissions = async () => {
    setIsLoading(true);
    try {
      // Use the general commissions endpoint to get vendor-category combinations
      const response = await commissionApi.getAllVendorCategoryCommissions();
      
      // Build category map from categories already loaded
      const categoryNameMap: Record<number, string> = {};
      categories.forEach((category) => {
        const categoryId = Number(category.id);
        if (!isNaN(categoryId)) {
          categoryNameMap[categoryId] = category.name;
        }
      });
      
      // Also check if category names are in the API response
      response.forEach((commission: any) => {
        if (commission.category_name && commission.category_id && typeof commission.category_id === 'number') {
          categoryNameMap[commission.category_id] = commission.category_name;
        }
      });
      
      // If we still have missing category names, fetch them
      const categoryIds = new Set(response.map((c: any) => c.category_id));
      const missingCategoryIds = Array.from(categoryIds).filter(id => !categoryNameMap[id]);
      
      if (missingCategoryIds.length > 0) {
        try {
          const categoryResponse = await categoryApi.getCategories({ paginationSize: 1000 });
          categoryResponse.data.forEach((category: any) => {
            if (categoryIds.has(category.id)) {
              categoryNameMap[category.id] = category.name;
              console.log(`✅ Mapped category ${category.id} -> "${category.name}" from category API`);
            }
          });
        } catch (error) {
          console.error("Error fetching categories for mapping:", error);
        }
      }
      

      console.log("✅ Category map created with", Object.keys(categoryNameMap).length, "entries:", categoryNameMap);
      
      // Map all commissions (including inactive ones for reference)
      const allCommissions = response.map((apiData: any) => 
        mapApiResponseToCommission(apiData, categoryNameMap)
      );
      // Only display active commissions in the UI
      const activeCommissions = allCommissions.filter(commission => commission.isActive);
      setCommissions(activeCommissions);
      console.log("✅ Vendor commissions loaded:", activeCommissions);
      console.log("✅ All commissions (including inactive):", allCommissions);
    } catch (error: any) {
      console.error("Error fetching vendor commissions:", error);
      const errorMessage = error.response?.data?.message || "Failed to load vendor commissions";
      toast.error(errorMessage);
      setCommissions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch commissions from API
  useEffect(() => {
    fetchCommissions();
  }, [categories]); // Re-fetch when categories are loaded

  const handleCreate = async () => {
    setErrors({});

    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.categoryId) {
      newErrors.category = "Category is required";
    }
    if (formData.percentage === undefined || formData.percentage === null) {
      newErrors.percentage = "Percentage is required";
    } else if (formData.percentage < 0 || formData.percentage > 100) {
      newErrors.percentage = "Percentage must be between 0 and 100";
    }
    if (formData.partialPercentage === undefined || formData.partialPercentage === null) {
      newErrors.partialPercentage = "Partial percentage is required";
    } else if (formData.partialPercentage < 0 || formData.partialPercentage > 100) {
      newErrors.partialPercentage = "Partial percentage must be between 0 and 100";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Get selected category
    const selectedCategory = categories.find(cat => String(cat.id) === formData.categoryId);
    if (!selectedCategory) {
      setErrors({ category: "Please select a valid category" });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await commissionApi.createCategoryDefault({
        category_id: Number(formData.categoryId),
        commission_rate: parseFloat(String(formData.percentage)),
        partial_commission_rate: parseFloat(String(formData.partialPercentage)),
        is_active: formData.isActive,
      });

      const newCommission = mapApiResponseToCommission(response);
      setCommissions([...commissions, newCommission]);
      setFormData({ category: "", categoryId: "", percentage: undefined, partialPercentage: undefined, isActive: true });
      setIsCreateDialogOpen(false);
      toast.success("Vendor commission created successfully");
    } catch (error: any) {
      console.error("Error creating commission:", error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || "Failed to create commission";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedCommission) return;

    setErrors({});

    const newErrors: Record<string, string> = {};
    if (!formData.categoryId) {
      newErrors.category = "Category is required";
    }
    if (formData.percentage === undefined || formData.percentage === null) {
      newErrors.percentage = "Percentage is required";
    } else if (formData.percentage < 0 || formData.percentage > 100) {
      newErrors.percentage = "Percentage must be between 0 and 100";
    }
    if (formData.partialPercentage === undefined || formData.partialPercentage === null) {
      newErrors.partialPercentage = "Partial percentage is required";
    } else if (formData.partialPercentage < 0 || formData.partialPercentage > 100) {
      newErrors.partialPercentage = "Partial percentage must be between 0 and 100";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Get selected category
    const selectedCategory = categories.find(cat => String(cat.id) === formData.categoryId);
    if (!selectedCategory) {
      setErrors({ category: "Please select a valid category" });
      return;
    }

    setIsSubmitting(true);
    try {
      // Use the original category_id from selectedCommission, not from form
      // The API identifies the record by category_id, so we must use the original one
      const categoryId = Number(selectedCommission.categoryId);

      console.log("📤 Attempting to update commission for category_id:", categoryId);
      console.log("📤 Selected commission:", selectedCommission);
      console.log("📤 Form data:", formData);

      // Use vendor rate update API instead of category default
      const response = await commissionApi.updateVendorRate(selectedCommission.vendorId, {
        custom_commission_rate: parseFloat(String(formData.percentage)),
        partial_commission_rate: parseFloat(String(formData.partialPercentage)),
      });

      console.log("🔥 DEBUG: Update API call completed successfully");
      console.log("✅ Update response received:", response);

      // Close dialog immediately
      setIsEditDialogOpen(false);
      setSelectedCommission(null);
      
      // Reset form data
      setFormData({ 
        category: "", 
        categoryId: "", 
        percentage: undefined, 
        partialPercentage: undefined, 
        isActive: true 
      });

      // Show success message
      toast.success("Vendor commission updated successfully");
      
      // Force immediate refresh from server - don't trust local state
      console.log("🔄 Forcing immediate data refresh from server...");
      
      // Wait a bit for the server to process the update
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Force refresh
      await fetchCommissions();
      
      console.log("🔄 Data refresh completed");

    } catch (error: any) {
      console.error("Error updating commission:", error);
      // Log full error details for debugging
      if (error.response?.data?.errors) {
        console.error("Validation errors:", error.response.data.errors);
        const validationErrors = error.response.data.errors;
        if (Array.isArray(validationErrors) && validationErrors.length > 0) {
          const errorMsg = validationErrors[0];

          // For vendor rate updates, we don't need to create - just show the error
          console.log("⚠️ Vendor rate update failed:", errorMsg);

          toast.error(errorMsg || "Validation error occurred");
          return;
        }
      }
      const errorMessage = error.response?.data?.message || error.response?.data?.error || "Failed to update commission";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCommission) return;

    setIsSubmitting(true);
    try {
      // For vendor rates, we might need to reset to default or delete the custom rate
      // This depends on your API - you might need to call a different endpoint
      await commissionApi.updateVendorRate(selectedCommission.vendorId, {
        custom_commission_rate: 0,
        partial_commission_rate: 0,
      });

      // Refresh data from server
      await fetchCommissions();
      
      setIsDeleteDialogOpen(false);
      setSelectedCommission(null);
      toast.success("Vendor commission reset successfully");
    } catch (error: any) {
      console.error("Error resetting commission:", error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || "Failed to reset commission";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (commission: VendorCommission) => {
    setSelectedCommission(commission);
    setFormData({
      category: commission.category,
      categoryId: String(commission.categoryId),
      percentage: commission.percentage,
      partialPercentage: commission.partialPercentage,
      isActive: commission.isActive,
    });
    setIsEditDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6 w-full max-w-full overflow-x-hidden">
        <Card>
          <div className="text-center p-8 sm:p-12">
            <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin mx-auto mb-4 text-[#00897B]" />
            <p className="text-gray-500 text-sm sm:text-base">Loading vendor commissions...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6 w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#00897B] break-words">
              Vendor Commission
            </h1>
            <p className="text-gray-500 mt-1 text-sm sm:text-base">
              Global commission chart for all vendors
            </p>
          </div>
          {isAdmin && (
            <Button
              onClick={() => {
                setFormData({ category: "", categoryId: "", percentage: undefined, partialPercentage: undefined, isActive: true });
                setErrors({});
                setIsCreateDialogOpen(true);
              }}
              className="bg-[#00897B] hover:bg-[#00796B] w-full sm:w-auto whitespace-nowrap flex-shrink-0"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Commission
            </Button>
          )}
        </div>
      </div>

      {/* Commissions Table */}
      {commissions.length > 0 ? (
        isMobile ? (
          /* Mobile/Tablet Card View */
          <div className="space-y-3 w-full">
            {commissions.map((commission) => (
              <Card key={commission.id} className="p-4 border-l-4 border-l-[#00897B] w-full">
                <div className="space-y-3">
                  {/* Header Row */}
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <span className="text-xs text-gray-500 font-mono">#{commission.id}</span>
                    </div>
                    {isAdmin && (
                      <div className="flex gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleEditClick(commission)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Category, Vendor & Rates */}
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-gray-500">Category</Label>
                        <p className="text-sm font-medium mt-0.5">{commission.category}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Vendor</Label>
                        <p className="text-sm font-medium mt-0.5">{commission.vendor}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-gray-500">Percentage</Label>
                        <p className="text-lg font-bold text-[#00897B] mt-0.5">
                          {commission.percentage}%
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Partial Percentage</Label>
                        <p className="text-base font-semibold text-gray-700 mt-0.5">
                          {commission.partialPercentage}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          /* Desktop Table View */
          <Card className="w-full overflow-hidden">
            <div className="overflow-x-auto w-full">
              <Table className="w-full">
                <TableHeader>
                  <TableRow className="bg-[#00897B] border-b border-gray-200 hover:bg-[#00897B]">
                    <TableHead className="whitespace-nowrap min-w-[60px] font-semibold text-white hover:bg-[#00897B]">ID</TableHead>
                    <TableHead className="whitespace-nowrap min-w-[200px] font-semibold text-white hover:bg-[#00897B]">Category</TableHead>
                    <TableHead className="whitespace-nowrap min-w-[200px] font-semibold text-white hover:bg-[#00897B]">Vendor</TableHead>
                    <TableHead className="text-right whitespace-nowrap min-w-[120px] font-semibold text-white hover:bg-[#00897B]">
                      Commission Rate
                    </TableHead>
                    <TableHead className="text-right whitespace-nowrap min-w-[120px] font-semibold text-white hover:bg-[#00897B]">
                      Partial Rate
                    </TableHead>
                    {isAdmin && (
                      <TableHead className="whitespace-nowrap min-w-[100px] font-semibold text-white hover:bg-[#00897B]">Actions</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commissions.map((commission) => (
                    <TableRow key={commission.id}>
                      <TableCell className="font-mono whitespace-nowrap">
                        #{commission.id}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{commission.category}</TableCell>
                      <TableCell className="whitespace-nowrap">{commission.vendor}</TableCell>
                      <TableCell className="text-right font-semibold whitespace-nowrap text-[#00897B]">
                        {commission.percentage}%
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap text-gray-700">
                        {commission.partialPercentage}%
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="whitespace-nowrap">
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditClick(commission)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        )
      ) : (
        <Card>
          <div className="text-center p-8 sm:p-12">
            <p className="text-gray-500 text-sm sm:text-base">No vendor commissions found</p>
            {isAdmin && (
              <Button
                onClick={() => {
                  setFormData({ category: "", categoryId: "", percentage: undefined, partialPercentage: undefined, isActive: true });
                  setErrors({});
                  setIsCreateDialogOpen(true);
                }}
                className="mt-4 bg-[#00897B] hover:bg-[#00796B]"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add First Commission
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-[#00897B]">Add Vendor Commission</DialogTitle>
            <DialogDescription>
              Add a new commission rate to the global chart for all vendors
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="category" className="text-sm font-semibold">
                Category <span className="text-red-500">*</span>
              </Label>
              {loadingCategories ? (
                <div className="flex items-center gap-2 h-10">
                  <Loader2 className="h-4 w-4 animate-spin text-[#00897B]" />
                  <span className="text-sm text-gray-500">Loading categories...</span>
                </div>
              ) : categories.length > 0 ? (
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) => {
                    const selectedCategory = categories.find(cat => String(cat.id) === value);
                    setFormData({
                      ...formData,
                      categoryId: value,
                      category: selectedCategory?.name || ""
                    });
                    if (errors.category) setErrors({ ...errors, category: "" });
                  }}
                >
                  <SelectTrigger className={`h-10 ${errors.category ? "border-red-500" : ""}`}>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={String(category.id)}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="category"
                  type="text"
                  placeholder="e.g., Food & Beverage"
                  value={formData.category}
                  onChange={(e) => {
                    setFormData({ ...formData, category: e.target.value });
                    if (errors.category) setErrors({ ...errors, category: "" });
                  }}
                  className={`h-10 ${errors.category ? "border-red-500" : ""}`}
                />
              )}
              {errors.category && (
                <p className="text-sm text-red-500">{errors.category}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="percentage" className="text-sm font-semibold">
                Commission Rate (%) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="percentage"
                type="number"
                min="0"
                max="100"
                step="0.01"
                placeholder="e.g., 10.5"
                value={formData.percentage === undefined || formData.percentage === null ? "" : formData.percentage}
                onChange={(e) => {
                  const inputValue = e.target.value;
                  if (inputValue === "" || inputValue === null) {
                    setFormData({ ...formData, percentage: undefined });
                  } else {
                    const numValue = Number(inputValue);
                    if (!isNaN(numValue)) {
                      // Allow 0 as a valid value, only prevent negative values
                      const clampedValue = Math.max(0, Math.min(100, numValue));
                      setFormData({ ...formData, percentage: clampedValue });
                    }
                  }
                  if (errors.percentage) setErrors({ ...errors, percentage: "" });
                }}
                className="h-10"
              />
              {errors.percentage && (
                <p className="text-sm text-red-500">{errors.percentage}</p>
              )}
              <p className="text-xs text-gray-500">Enter a value between 0 and 100</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="partialPercentage" className="text-sm font-semibold">
                Partial Commission Rate (%) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="partialPercentage"
                type="number"
                min="0"
                max="100"
                step="0.01"
                placeholder="e.g., 3.5"
                value={formData.partialPercentage === undefined || formData.partialPercentage === null ? "" : formData.partialPercentage}
                onChange={(e) => {
                  const inputValue = e.target.value;
                  if (inputValue === "" || inputValue === null) {
                    setFormData({ ...formData, partialPercentage: undefined });
                  } else {
                    const numValue = Number(inputValue);
                    if (!isNaN(numValue)) {
                      // Allow 0 as a valid value, only prevent negative values
                      const clampedValue = Math.max(0, Math.min(100, numValue));
                      setFormData({ ...formData, partialPercentage: clampedValue });
                    }
                  }
                  if (errors.partialPercentage) setErrors({ ...errors, partialPercentage: "" });
                }}
                className="h-10"
              />
              {errors.partialPercentage && (
                <p className="text-sm text-red-500">{errors.partialPercentage}</p>
              )}
              <p className="text-xs text-gray-500">Enter a value between 0 and 100</p>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                setFormData({ category: "", categoryId: "", percentage: undefined, partialPercentage: undefined, isActive: true });
                setErrors({});
              }}
              className="w-full sm:w-auto"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              className="bg-[#00897B] hover:bg-[#00796B] w-full sm:w-auto"
              disabled={isSubmitting || !formData.categoryId || formData.percentage === undefined || formData.percentage === null || formData.partialPercentage === undefined || formData.partialPercentage === null}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Commission
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-[#00897B]">Edit Vendor Commission</DialogTitle>
            <DialogDescription>
              Update the commission rate for this category
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-category" className="text-sm font-semibold">
                Category <span className="text-red-500">*</span>
              </Label>
              {loadingCategories ? (
                <div className="flex items-center gap-2 h-10">
                  <Loader2 className="h-4 w-4 animate-spin text-[#00897B]" />
                  <span className="text-sm text-gray-500">Loading categories...</span>
                </div>
              ) : categories.length > 0 ? (
                <Select
                  value={formData.categoryId}
                  disabled={true}
                  onValueChange={(value) => {
                    // Category cannot be changed when editing - it's the identifier for the API
                    const selectedCategory = categories.find(cat => String(cat.id) === value);
                    setFormData({
                      ...formData,
                      categoryId: value,
                      category: selectedCategory?.name || ""
                    });
                    if (errors.category) setErrors({ ...errors, category: "" });
                  }}
                >
                  <SelectTrigger className={`h-10 ${errors.category ? "border-red-500" : ""} bg-gray-50`}>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={String(category.id)}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="edit-category"
                  type="text"
                  placeholder="e.g., Food & Beverage"
                  value={formData.category}
                  onChange={(e) => {
                    setFormData({ ...formData, category: e.target.value });
                    if (errors.category) setErrors({ ...errors, category: "" });
                  }}
                  className={`h-10 ${errors.category ? "border-red-500" : ""}`}
                />
              )}
              {errors.category && (
                <p className="text-sm text-red-500">{errors.category}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-percentage" className="text-sm font-semibold">
                Commission Rate (%) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-percentage"
                type="number"
                min="0"
                max="100"
                step="0.01"
                placeholder="e.g., 10.5"
                value={formData.percentage === undefined || formData.percentage === null ? "" : formData.percentage}
                onChange={(e) => {
                  const inputValue = e.target.value;
                  if (inputValue === "" || inputValue === null) {
                    setFormData({ ...formData, percentage: undefined });
                  } else {
                    const numValue = Number(inputValue);
                    if (!isNaN(numValue)) {
                      // Allow 0 as a valid value, only prevent negative values
                      const clampedValue = Math.max(0, Math.min(100, numValue));
                      setFormData({ ...formData, percentage: clampedValue });
                    }
                  }
                  if (errors.percentage) setErrors({ ...errors, percentage: "" });
                }}
                className="h-10"
              />
              {errors.percentage && (
                <p className="text-sm text-red-500">{errors.percentage}</p>
              )}
              <p className="text-xs text-gray-500">Enter a value between 0 and 100</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-partialPercentage" className="text-sm font-semibold">
                Partial Commission Rate (%) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-partialPercentage"
                type="number"
                min="0"
                max="100"
                step="0.01"
                placeholder="e.g., 3.5"
                value={formData.partialPercentage === undefined || formData.partialPercentage === null ? "" : formData.partialPercentage}
                onChange={(e) => {
                  const inputValue = e.target.value;
                  if (inputValue === "" || inputValue === null) {
                    setFormData({ ...formData, partialPercentage: undefined });
                  } else {
                    const numValue = Number(inputValue);
                    if (!isNaN(numValue)) {
                      // Allow 0 as a valid value, only prevent negative values
                      const clampedValue = Math.max(0, Math.min(100, numValue));
                      setFormData({ ...formData, partialPercentage: clampedValue });
                    }
                  }
                  if (errors.partialPercentage) setErrors({ ...errors, partialPercentage: "" });
                }}
                className="h-10"
              />
              {errors.partialPercentage && (
                <p className="text-sm text-red-500">{errors.partialPercentage}</p>
              )}
              <p className="text-xs text-gray-500">Enter a value between 0 and 100</p>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setSelectedCommission(null);
                setFormData({ category: "", categoryId: "", percentage: undefined, partialPercentage: undefined, isActive: true });
                setErrors({});
              }}
              className="w-full sm:w-auto"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              className="bg-[#00897B] hover:bg-[#00796B] w-full sm:w-auto"
              disabled={isSubmitting || !formData.categoryId || formData.percentage === undefined || formData.percentage === null || formData.partialPercentage === undefined || formData.partialPercentage === null}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Commission"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Vendor Commission?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the commission for "{selectedCommission?.category}"?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto" disabled={isSubmitting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default VendorCommission;

