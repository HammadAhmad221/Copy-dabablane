import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import type { CreateCommissionRequest } from "@/admin/lib/api/types/commission";
import type { Vendor } from "@/admin/lib/api/types/vendor";
import type { Category } from "@/admin/lib/api/types/category";

const CommissionCreate = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loadingVendors, setLoadingVendors] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  const [formData, setFormData] = useState<CreateCommissionRequest>({
    category_id: undefined,
    vendor_id: undefined,
    commission_rate: 0,
    partial_commission_rate: undefined,
    is_active: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch vendors and categories for dropdowns
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
        console.log('✅ Categories loaded:', categoryResponse.data);
      } catch (error) {
        console.error("Error fetching categories:", error);
        toast.error('Failed to load categories. You can still enter category ID manually.');
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validation
    const newErrors: Record<string, string> = {};
    
    // Category ID is ALWAYS required by backend (even for vendor commissions)
    if (!formData.category_id || formData.category_id === 0) {
      newErrors.category_id = 'Category ID is required and must be greater than 0';
    }
    
    // Vendor is optional (null for category default, set for vendor-specific)
    // Note: Backend might require category_id even when vendor_id is set
    
    if (formData.commission_rate === undefined || formData.commission_rate < 0 || formData.commission_rate > 100) {
      newErrors.commission_rate = 'Commission rate is required and must be between 0 and 100';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Prepare clean payload - backend ALWAYS requires category_id
    const payload: CreateCommissionRequest = {
      category_id: formData.category_id!,
      commission_rate: formData.commission_rate,
      is_active: formData.is_active !== false,
    };

    // Set vendor_id (null if not selected, or the vendor ID if selected)
    payload.vendor_id = formData.vendor_id ?? null;

    // Only include optional fields if they have values
    if (formData.partial_commission_rate) {
      payload.partial_commission_rate = formData.partial_commission_rate;
    }

    console.log('📦 Final payload before sending:', payload);

    setIsLoading(true);
    
    try {
      console.log('📤 Creating commission with payload:', payload);
      console.log('📤 Payload JSON:', JSON.stringify(payload, null, 2));
      await commissionApi.create(payload);
      toast.success('Commission created successfully');
      navigate('/admin/commission');
    } catch (error: any) {
      console.error('❌ Error creating commission:', error);
      console.error('❌ Error details:', error.response?.data);
      console.error('❌ Error errors object:', error.response?.data?.errors);
      
      // Show validation errors from backend
      if (error.response?.data?.errors) {
        const validationErrors = error.response.data.errors;
        console.log('📋 Validation errors received:', validationErrors);
        const newErrors: Record<string, string> = {};
        Object.keys(validationErrors).forEach((key) => {
          const errorMessages = validationErrors[key];
          // Handle array of error messages
          if (Array.isArray(errorMessages)) {
            newErrors[key] = errorMessages[0] || 'Validation error';
          } else if (typeof errorMessages === 'string') {
            newErrors[key] = errorMessages;
          } else {
            newErrors[key] = 'Validation error for this field';
          }
        });
        console.log('📋 Processed errors:', newErrors);
        setErrors(newErrors);
        
        // Show first validation error in toast with field name
        const firstKey = Object.keys(newErrors)[0];
        const firstError = newErrors[firstKey];
        if (firstError) {
          toast.error(`${firstKey.replace('_', ' ')}: ${firstError}`);
        }
      } else {
        const errorMessage = error.response?.data?.message || 
                            error.response?.data?.error || 
                            error.message || 
                            'Failed to create commission';
        toast.error(errorMessage);
        setErrors({ submit: errorMessage });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/admin/commission')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-[#00897B]">Create Commission Rate</h1>
          <p className="text-gray-500 mt-1">Create a new commission rate for a category or vendor</p>
        </div>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category - ALWAYS REQUIRED */}
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

            {/* Vendor - Optional (for vendor-specific rates) */}
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
                placeholder="e.g., 7.00"
                required
              />
              {errors.commission_rate && (
                <p className="text-sm text-red-500">{errors.commission_rate}</p>
              )}
              <p className="text-xs text-gray-500">
                Commission percentage (e.g., 7.00 for 7%)
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
                placeholder="e.g., 3.5"
              />
            </div>

            {/* Status */}
            <div className="space-y-2 md:col-span-2">
              <Label>Status</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.is_active !== false}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      is_active: checked
                    })
                  }
                />
                <span className="text-sm">
                  {formData.is_active ? 'Active' : 'Inactive'}
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
              disabled={isLoading}
              className="bg-[#00897B]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Commission"
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default CommissionCreate;
