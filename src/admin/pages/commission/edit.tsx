import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card } from "@/admin/components/ui/card";
import { Button } from "@/admin/components/ui/button";
import { Input } from "@/admin/components/ui/input";
import { Label } from "@/admin/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/admin/components/ui/select";
import { Switch } from "@/admin/components/ui/switch";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import commissionApi from "@/admin/lib/api/services/commissionService";
import { vendorApi } from "@/admin/lib/api/services/vendorService";
import { categoryApi } from "@/admin/lib/api/services/categoryService";
import type { Commission, UpdateCommissionRequest } from "@/admin/lib/api/types/commission";
import type { Vendor } from "@/admin/lib/api/types/vendor";
import type { Category } from "@/admin/lib/api/types/category";

const CommissionEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [commission, setCommission] = useState<Commission | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loadingVendors, setLoadingVendors] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  const [formData, setFormData] = useState<UpdateCommissionRequest & { category_id?: number; vendor_id?: number | null }>({
    commission_rate: undefined,
    partial_commission_rate: undefined,
    is_active: undefined,
    category_id: undefined,
    vendor_id: undefined,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch vendors and categories
  useEffect(() => {
    const fetchData = async () => {
      // Fetch vendors
      setLoadingVendors(true);
      try {
        const vendorResponse = await vendorApi.getVendors(undefined, 100, 1);
        setVendors(vendorResponse.data);
      } catch (error) {
        console.error("Error fetching vendors:", error);
      } finally {
        setLoadingVendors(false);
      }

      // Fetch categories
      setLoadingCategories(true);
      try {
        const categoryResponse = await categoryApi.getCategories({ paginationSize: 100 });
        setCategories(categoryResponse.data || []);
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchData();
  }, []);

  // Fetch commission data
  useEffect(() => {
    if (id) {
      fetchCommission();
    }
  }, [id]);

  const fetchCommission = async () => {
    setIsLoading(true);
    try {
      // Get all commissions and find the one with matching ID
      const response = await commissionApi.getAll();
      const found = response.data.find((c) => c.id === Number(id));
      
      if (found) {
        setCommission(found);
        setFormData({
          commission_rate: found.commission_rate,
          partial_commission_rate: found.partial_commission_rate,
          is_active: found.is_active,
          category_id: found.category_id,
          vendor_id: found.vendor_id ?? null,
        });
        console.log('✅ Commission loaded for edit:', found);
      } else {
        toast.error('Commission not found');
        navigate('/admin/commission');
      }
    } catch (error: any) {
      console.error('Error fetching commission:', error);
      toast.error('Failed to load commission');
      navigate('/admin/commission');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id) return;

    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.category_id || formData.category_id === 0) {
      newErrors.category_id = 'Category ID is required and must be greater than 0';
    }
    if (formData.commission_rate === undefined || formData.commission_rate < 0 || formData.commission_rate > 100) {
      newErrors.commission_rate = 'Commission rate is required and must be between 0 and 100';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSaving(true);
    
    try {
      // Prepare update data - try to include category_id and vendor_id if API supports it
      const updateData: any = {
        commission_rate: formData.commission_rate,
        is_active: formData.is_active !== false,
      };

      // Include optional fields
      if (formData.partial_commission_rate !== undefined) {
        updateData.partial_commission_rate = formData.partial_commission_rate;
      }

      // Try to update category_id and vendor_id if they changed
      if (formData.category_id && commission && formData.category_id !== commission.category_id) {
        updateData.category_id = formData.category_id;
      }
      if (commission && formData.vendor_id !== commission.vendor_id) {
        updateData.vendor_id = formData.vendor_id ?? null;
      }

      console.log('📤 Updating commission:', id, updateData);
      await commissionApi.update(Number(id), updateData);
      toast.success('Commission updated successfully');
      navigate('/admin/commission');
    } catch (error: any) {
      console.error('❌ Error updating commission:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update commission';
      
      // Show validation errors if any
      if (error.response?.data?.errors) {
        const validationErrors = error.response.data.errors;
        const newErrors: Record<string, string> = {};
        Object.keys(validationErrors).forEach((key) => {
          const errorMessages = validationErrors[key];
          newErrors[key] = Array.isArray(errorMessages) 
            ? errorMessages[0] 
            : String(errorMessages);
        });
        setErrors(newErrors);
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!commission) {
    return null;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/admin/commission')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-[#00897B]">Edit Commission Rate</h1>
          <p className="text-gray-500 mt-1">Update commission rate #{id}</p>
        </div>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category - Editable */}
            <div className="space-y-2">
              <Label htmlFor="category_id">
                Category <span className="text-red-500">*</span>
              </Label>
              {categories.length > 0 ? (
                <Select
                  value={formData.category_id ? String(formData.category_id) : ""}
                  onValueChange={(value) => {
                    setFormData({ 
                      ...formData, 
                      category_id: value ? Number(value) : undefined
                    });
                  }}
                >
                  <SelectTrigger className={errors.category_id ? "border-red-500" : ""}>
                    <SelectValue placeholder={loadingCategories ? "Loading categories..." : "Select category"} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={String(category.id)}>
                        {category.name} (ID: {category.id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="category_id"
                  type="number"
                  min="1"
                  value={formData.category_id || ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData({ 
                      ...formData, 
                      category_id: value ? Number(value) : undefined
                    });
                  }}
                  className={errors.category_id ? "border-red-500" : ""}
                  placeholder="Enter category ID (must exist in database)"
                  required
                />
              )}
              {errors.category_id && (
                <p className="text-sm text-red-500">{errors.category_id}</p>
              )}
              <p className="text-xs text-gray-500">
                {categories.length > 0 
                  ? "Select a category (required for all commissions)"
                  : "⚠️ Category ID must exist in your categories table."}
              </p>
            </div>

            {/* Vendor - Editable */}
            <div className="space-y-2">
              <Label htmlFor="vendor_id">
                Vendor (Optional - Leave empty for category default)
              </Label>
              <Select
                value={formData.vendor_id ? String(formData.vendor_id) : "none"}
                onValueChange={(value) => {
                  setFormData({
                    ...formData,
                    vendor_id: value === "none" ? undefined : Number(value)
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingVendors ? "Loading vendors..." : "No vendor (Category default)"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Vendor (Category Default Rate)</SelectItem>
                  {vendors.map((vendor) => (
                    <SelectItem key={vendor.id} value={String(vendor.id)}>
                      {vendor.company_name || vendor.name || `Vendor #${vendor.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Leave empty for category default rate, or select vendor for vendor-specific rate
              </p>
            </div>
            {/* Commission Rate */}
            <div className="space-y-2">
              <Label htmlFor="commission_rate">
                Commission Rate (%) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="commission_rate"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formData.commission_rate === undefined ? "" : formData.commission_rate}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData({ 
                    ...formData, 
                    commission_rate: value === "" ? undefined : Number(value) 
                  });
                }}
                className={errors.commission_rate ? "border-red-500" : ""}
                placeholder="e.g., 8.00"
                required
              />
              {errors.commission_rate && (
                <p className="text-sm text-red-500">{errors.commission_rate}</p>
              )}
              <p className="text-xs text-gray-500">
                Commission percentage (e.g., 8.00 for 8%)
              </p>
            </div>

            {/* Partial Commission Rate */}
            <div className="space-y-2">
              <Label htmlFor="partial_commission_rate">Partial Commission Rate (%) (Optional)</Label>
              <Input
                id="partial_commission_rate"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formData.partial_commission_rate || ""}
                onChange={(e) =>
                  setFormData({ 
                    ...formData, 
                    partial_commission_rate: e.target.value ? Number(e.target.value) : undefined 
                  })
                }
                placeholder="e.g., 4.0"
              />
              <p className="text-xs text-gray-500">
                Partial payment commission rate (optional)
              </p>
            </div>

            {/* Status */}
            <div className="space-y-2 md:col-span-2">
              <Label>Status</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.is_active !== false && commission.is_active}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      is_active: checked
                    })
                  }
                />
                <span className="text-sm">
                  {formData.is_active !== false && commission.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/admin/commission')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-[#00897B]"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Commission"
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default CommissionEdit;
