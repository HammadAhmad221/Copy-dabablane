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
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import commissionApi from "@/admin/lib/api/services/commissionService";
import type { GlobalCommissionSettings } from "@/admin/lib/api/types/commission";

const CommissionSettings = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<GlobalCommissionSettings | null>(null);
  const [formData, setFormData] = useState({
    partial_payment_commission_rate: undefined as number | undefined,
    vat_rate: undefined as number | undefined,
    daba_blane_account_iban: "",
    transfer_processing_day: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [originalTransferDayFormat, setOriginalTransferDayFormat] = useState<string>("");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const response = await commissionApi.getSettings();
      
      // Backend returns nested structure: {status, code, message, data: {...}}
      // Extract the actual settings data
      const data = (response as any).data || response;
      setSettings(data);
      
      // Log the entire response to see what format backend uses
      console.log("📥 Full settings response from backend:", JSON.stringify(response, null, 2));
      
      // Extract transfer_processing_day from nested structure
      const transferDayValue = data.transfer_processing_day || (response as any).data?.transfer_processing_day;
      console.log("📥 transfer_processing_day value:", transferDayValue);
      console.log("📥 transfer_processing_day type:", typeof transferDayValue);
      
      // Store the original format from backend to use when saving
      let transferDay = "";
      if (transferDayValue !== null && transferDayValue !== undefined && transferDayValue !== "") {
        const originalFormat = String(transferDayValue);
        setOriginalTransferDayFormat(originalFormat);
        transferDay = originalFormat.toLowerCase();
        console.log("📥 Stored original format:", originalFormat);
        console.log("📥 Normalized to lowercase for form:", transferDay);
      } else {
        console.log("📥 No transfer_processing_day in backend response (null/undefined/empty)");
        setOriginalTransferDayFormat("");
      }
      
      // Extract values from nested structure
      const partialRate = data.partial_payment_commission_rate || (response as any).data?.partial_payment_commission_rate;
      const vatRate = data.vat_rate || (response as any).data?.vat_rate;
      const iban = data.daba_blane_account_iban || (response as any).data?.daba_blane_account_iban;
      
      setFormData({
        partial_payment_commission_rate: partialRate !== undefined && partialRate !== null ? Number(partialRate) : undefined,
        vat_rate: vatRate !== undefined && vatRate !== null ? Number(vatRate) : undefined,
        daba_blane_account_iban: iban || "",
        transfer_processing_day: transferDay,
      });
      console.log("✅ Settings loaded:", data);
      console.log("✅ Transfer day for form (lowercase):", transferDay);
    } catch (error: any) {
      console.error("❌ Error loading settings:", error);
      const errorMessage = error.response?.data?.message || "Failed to load settings";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    // Clear previous errors
    setErrors({});
    
    // Client-side validation
    const newErrors: Record<string, string> = {};
    
    if (formData.partial_payment_commission_rate === undefined || formData.partial_payment_commission_rate === null) {
      newErrors.partial_payment_commission_rate = "Partial payment commission rate is required";
    } else if (formData.partial_payment_commission_rate < 0 || formData.partial_payment_commission_rate > 100) {
      newErrors.partial_payment_commission_rate = "Partial payment commission rate must be between 0 and 100";
    }
    
    if (formData.vat_rate === undefined || formData.vat_rate === null) {
      newErrors.vat_rate = "VAT rate is required";
    } else if (formData.vat_rate < 0 || formData.vat_rate > 100) {
      newErrors.vat_rate = "VAT rate must be between 0 and 100";
    }
    
    if (!formData.daba_blane_account_iban || formData.daba_blane_account_iban.trim() === "") {
      newErrors.daba_blane_account_iban = "Daba Blane Account IBAN is required";
    }
    
    if (!formData.transfer_processing_day || formData.transfer_processing_day.trim() === "") {
      newErrors.transfer_processing_day = "Transfer processing day is required";
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please fix the form errors");
      return;
    }
    
    setIsSaving(true);
    try {
      // Transform transfer_processing_day to match backend format
      // Backend accepts lowercase format (e.g., "wednesday" works successfully)
      // Use lowercase format as confirmed by successful "wednesday" save
      const dayValue = formData.transfer_processing_day.trim().toLowerCase();
      
      // Map day names to ensure consistent format
      const dayMap: Record<string, string> = {
        'monday': 'monday',
        'tuesday': 'tuesday',
        'wednesday': 'wednesday',
        'thursday': 'thursday',
        'friday': 'friday',
      };
      
      // Ensure the day is in the correct format
      const formattedDay = dayMap[dayValue] || dayValue;
      console.log("📤 Using lowercase format (confirmed working):", formattedDay);
      console.log("📤 Day value before mapping:", dayValue);
      console.log("📤 Day value after mapping:", formattedDay);
      
      // Prepare payload with proper handling of undefined values
      const payload: any = {
        partial_payment_commission_rate: formData.partial_payment_commission_rate !== undefined ? Number(formData.partial_payment_commission_rate) : 0,
        vat_rate: formData.vat_rate !== undefined ? Number(formData.vat_rate) : 0,
        daba_blane_account_iban: formData.daba_blane_account_iban.trim(),
        transfer_processing_day: formattedDay,
      };
      
      console.log("📤 Transfer processing day (form value):", formData.transfer_processing_day);
      console.log("📤 Transfer processing day (sending):", formattedDay);
      console.log("📤 Original format stored:", originalTransferDayFormat);
      console.log("📤 Full payload:", JSON.stringify(payload, null, 2));
      
      console.log("📤 Saving settings:", payload);
      await commissionApi.updateSettings(payload);
      toast.success("Settings updated successfully");
      setErrors({});
      await fetchSettings();
    } catch (error: any) {
      console.error("❌ Error saving settings:", error);
      console.error("❌ Error response:", error.response?.data);
      
      // Handle 500 server errors (backend SQL issues)
      if (error.response?.status === 500 && error.response?.data) {
        const responseData = error.response.data;
        const errorMessage = responseData.message || "Server error occurred";
        const errors = responseData.errors || [];
        
        // Check if it's a SQL error related to transfer_processing_day
        const sqlError = errors.find((err: string) => 
          typeof err === 'string' && (err.includes('transfer_processing_day') || err.includes('Data truncated'))
        );
        
        if (sqlError) {
          console.error("⚠️ SQL Error detected for transfer_processing_day:", sqlError);
          toast.error(
            "Failed to save transfer processing day. The backend database column may only accept 'wednesday' as a valid value. This is a backend issue that needs to be fixed. Please contact the backend team to update the database column to accept all weekdays (Monday-Friday).",
            { duration: 10000 }
          );
          setErrors({
            transfer_processing_day: "This day is not currently supported by the backend database. Only 'wednesday' is accepted. Please contact the backend team to fix this issue."
          });
        } else {
          toast.error(errorMessage || "Failed to save settings due to a server error. Please try again.");
        }
        return;
      }
      
      // Handle validation errors from API
      if (error.response?.status === 422 && error.response?.data) {
        const responseData = error.response.data;
        const apiErrors: Record<string, string> = {};
        
        // Handle Laravel validation errors format: { errors: { field: ["message"] } }
        if (responseData.errors) {
          Object.entries(responseData.errors).forEach(([key, value]) => {
            apiErrors[key] = Array.isArray(value) ? value[0] : String(value);
          });
          setErrors(apiErrors);
          
          // Check if it's the transfer_processing_day validation error
          if (apiErrors.transfer_processing_day) {
            const errorMsg = apiErrors.transfer_processing_day;
            console.error("⚠️ Backend validation error for transfer_processing_day:", errorMsg);
            console.error("⚠️ This suggests the backend validation rule only allows specific days.");
            console.error("⚠️ Currently only 'wednesday' works. Other days are being rejected by backend validation.");
            console.error("⚠️ Please check backend validation rules - they may need to be updated to allow all weekdays.");
            
            // Show user-friendly error message
            toast.error(
              `Transfer Processing Day validation failed. The backend currently only accepts certain days. Please contact the backend team to update the validation rules to allow all weekdays.`,
              { duration: 6000 }
            );
          } else {
            // Show all validation errors in toast
            const errorMessages = Object.values(apiErrors);
            if (errorMessages.length > 0) {
              toast.error(errorMessages.join(". "));
            } else {
              toast.error("Validation error. Please check the form.");
            }
          }
        } else if (responseData.message) {
          toast.error(responseData.message);
        } else {
          toast.error("Validation error. Please check the form.");
        }
      } else {
        const errorMessage = error.response?.data?.message || error.response?.data?.error || "Failed to save settings";
        toast.error(errorMessage);
      }
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

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate("/admin/commission")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-[#00897B]">Commission Settings</h1>
          <p className="text-gray-500 mt-1">Manage global commission configuration</p>
        </div>
      </div>

      <Card className="p-6 max-w-2xl">
        <div className="space-y-6">
          {/* Partial Payment Commission Rate */}
          <div className="space-y-2">
            <Label>Partial Payment Commission Rate (%)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={formData.partial_payment_commission_rate === undefined || formData.partial_payment_commission_rate === null ? "" : formData.partial_payment_commission_rate}
              onChange={(e) => {
                const inputValue = e.target.value;
                if (inputValue === "" || inputValue === null) {
                  setFormData({
                    ...formData,
                    partial_payment_commission_rate: undefined,
                  });
                } else {
                  const numValue = Number(inputValue);
                  if (!isNaN(numValue)) {
                    // Allow 0 as a valid value, only prevent negative values
                    const clampedValue = Math.max(0, Math.min(100, numValue));
                    setFormData({
                      ...formData,
                      partial_payment_commission_rate: clampedValue,
                    });
                  }
                }
                // Clear error when user starts typing
                if (errors.partial_payment_commission_rate) {
                  setErrors({ ...errors, partial_payment_commission_rate: "" });
                }
              }}
              className={errors.partial_payment_commission_rate ? "border-red-500" : ""}
              placeholder="e.g., 3.5"
            />
            {errors.partial_payment_commission_rate && (
              <p className="text-sm text-red-500">{errors.partial_payment_commission_rate}</p>
            )}
            <p className="text-xs text-gray-500">Commission rate for partial payments</p>
          </div>

          {/* VAT Rate */}
          <div className="space-y-2">
            <Label>VAT Rate (%)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={formData.vat_rate === undefined || formData.vat_rate === null ? "" : formData.vat_rate}
              onChange={(e) => {
                const inputValue = e.target.value;
                if (inputValue === "" || inputValue === null) {
                  setFormData({
                    ...formData,
                    vat_rate: undefined,
                  });
                } else {
                  const numValue = Number(inputValue);
                  if (!isNaN(numValue)) {
                    // Allow 0 as a valid value, only prevent negative values
                    const clampedValue = Math.max(0, Math.min(100, numValue));
                    setFormData({
                      ...formData,
                      vat_rate: clampedValue,
                    });
                  }
                }
                // Clear error when user starts typing
                if (errors.vat_rate) {
                  setErrors({ ...errors, vat_rate: "" });
                }
              }}
              className={errors.vat_rate ? "border-red-500" : ""}
              placeholder="e.g., 20.00"
            />
            {errors.vat_rate && (
              <p className="text-sm text-red-500">{errors.vat_rate}</p>
            )}
            <p className="text-xs text-gray-500">Value Added Tax rate</p>
          </div>

          {/* IBAN */}
          <div className="space-y-2">
            <Label>Daba Blane Account IBAN</Label>
            <Input
              value={formData.daba_blane_account_iban}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  daba_blane_account_iban: e.target.value,
                });
                // Clear error when user starts typing
                if (errors.daba_blane_account_iban) {
                  setErrors({ ...errors, daba_blane_account_iban: "" });
                }
              }}
              className={errors.daba_blane_account_iban ? "border-red-500" : ""}
              placeholder="MA64 0000 0000 0000 0000 0000 000"
            />
            {errors.daba_blane_account_iban && (
              <p className="text-sm text-red-500">{errors.daba_blane_account_iban}</p>
            )}
            <p className="text-xs text-gray-500">Company bank account IBAN for transfers</p>
          </div>

          {/* Transfer Processing Day */}
          <div className="space-y-2">
            <Label>Transfer Processing Day</Label>
            <Select
              value={formData.transfer_processing_day || undefined}
              onValueChange={(value) => {
                try {
                  setFormData({
                    ...formData,
                    transfer_processing_day: value || "",
                  });
                  // Clear error when user selects a value
                  if (errors.transfer_processing_day) {
                    setErrors({ ...errors, transfer_processing_day: "" });
                  }
                } catch (error) {
                  console.error("Error updating transfer processing day:", error);
                  toast.error("Failed to update transfer processing day");
                }
              }}
            >
              <SelectTrigger className={errors.transfer_processing_day ? "border-red-500" : ""}>
                <SelectValue placeholder="Select day" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monday">Monday</SelectItem>
                <SelectItem value="tuesday">Tuesday</SelectItem>
                <SelectItem value="wednesday">Wednesday</SelectItem>
                <SelectItem value="thursday">Thursday</SelectItem>
                <SelectItem value="friday">Friday</SelectItem>
              </SelectContent>
            </Select>
            {errors.transfer_processing_day && (
              <p className="text-sm text-red-500">{errors.transfer_processing_day}</p>
            )}
            <p className="text-xs text-gray-500">Day of week for processing vendor transfers</p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-6">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-[#00897B]"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Settings"
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/admin/commission")}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CommissionSettings;

