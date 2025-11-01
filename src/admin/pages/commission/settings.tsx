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
    partial_payment_commission_rate: 0,
    vat_rate: 0,
    daba_blane_account_iban: "",
    transfer_processing_day: "",
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const data = await commissionApi.getSettings();
      setSettings(data);
      setFormData({
        partial_payment_commission_rate: data.partial_payment_commission_rate,
        vat_rate: data.vat_rate,
        daba_blane_account_iban: data.daba_blane_account_iban,
        transfer_processing_day: data.transfer_processing_day,
      });
      toast.success("Settings loaded");
    } catch (error) {
      toast.error("Failed to load settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await commissionApi.updateSettings(formData);
      toast.success("Settings updated successfully");
      await fetchSettings();
    } catch (error) {
      toast.error("Failed to save settings");
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
      <div className="flex items-center gap-4">
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
              value={formData.partial_payment_commission_rate}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  partial_payment_commission_rate: Number(e.target.value),
                })
              }
              placeholder="e.g., 3.5"
            />
            <p className="text-xs text-gray-500">Commission rate for partial payments</p>
          </div>

          {/* VAT Rate */}
          <div className="space-y-2">
            <Label>VAT Rate (%)</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.vat_rate}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  vat_rate: Number(e.target.value),
                })
              }
              placeholder="e.g., 20.00"
            />
            <p className="text-xs text-gray-500">Value Added Tax rate</p>
          </div>

          {/* IBAN */}
          <div className="space-y-2">
            <Label>Daba Blane Account IBAN</Label>
            <Input
              value={formData.daba_blane_account_iban}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  daba_blane_account_iban: e.target.value,
                })
              }
              placeholder="MA64 0000 0000 0000 0000 0000 000"
            />
            <p className="text-xs text-gray-500">Company bank account IBAN for transfers</p>
          </div>

          {/* Transfer Processing Day */}
          <div className="space-y-2">
            <Label>Transfer Processing Day</Label>
            <Select
              value={formData.transfer_processing_day}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  transfer_processing_day: value,
                })
              }
            >
              <SelectTrigger>
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

