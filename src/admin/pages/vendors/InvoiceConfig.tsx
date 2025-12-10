

import { useState } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { useToast } from "../../hooks/use-toast";
import {
  Card,
  CardContent,
} from "../../components/ui/card";
import { Label } from "../../components/ui/label";
import { motion } from "framer-motion";
import { Upload, Building2 } from "lucide-react";
import { invoiceConfigService } from "../../lib/api/invoice-config";

interface InvoiceTemplate {
  logo: string;
  prefix: string;
  billingEmail: string;
  contactEmail: string;
  contactPhone: string;
  companyInfo: {
    name: string;
    address: string;
    taxId: string;
    legalMentions: string;
  };
}

// Default placeholder logo component
const DefaultLogo = () => (
  <div className="h-24 w-24 bg-gradient-to-br from-[#00897B] to-[#00796B] rounded-lg flex items-center justify-center shadow-md">
    <Building2 className="h-12 w-12 text-white" />
  </div>
);

export default function InvoiceConfig() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [template, setTemplate] = useState<InvoiceTemplate>({
    logo: "", // Empty means use default logo
    prefix: "",
    billingEmail: "",
    contactEmail: "",
    contactPhone: "",
    companyInfo: {
      name: "",
      address: "",
      taxId: "",
      legalMentions: "",
    },
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const resetFormToEmpty = () => {
    const emptyTemplate = {
      logo: "",
      prefix: "",
      billingEmail: "",
      contactEmail: "",
      contactPhone: "",
      companyInfo: {
        name: "",
        address: "",
        taxId: "",
        legalMentions: "",
      },
    };

    setTemplate(emptyTemplate);
    setLogoFile(null);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleReset = () => {
    resetFormToEmpty();
    setLogoFile(null);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }

    toast({
      title: "Reset",
      description: "Form has been reset to empty",
    });
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type (restrict to png/jpeg per backend requirements)
      const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Please upload a PNG or JPEG image",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please upload an image smaller than 5MB",
          variant: "destructive",
        });
        return;
      }

      // Create a preview URL for the uploaded image
      const previewUrl = URL.createObjectURL(file);
      setLogoFile(file);
      setTemplate((prev) => ({
        ...prev,
        logo: previewUrl,
      }));

      toast({
        title: "Logo Uploaded",
        description: "Your invoice logo has been updated",
      });
    }
  };

  const handleRemoveLogo = () => {
    setTemplate((prev) => ({
      ...prev,
      logo: "",
    }));
    setLogoFile(null);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }

    toast({
      title: "Logo Removed",
      description: "Default logo will be used",
    });
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    field: keyof InvoiceTemplate | keyof InvoiceTemplate["companyInfo"],
    isCompanyInfo: boolean = false
  ) => {
    if (isCompanyInfo) {
      setTemplate((prev) => ({
        ...prev,
        companyInfo: {
          ...prev.companyInfo,
          [field]: e.target.value,
        },
      }));
    } else {
      setTemplate((prev) => ({
        ...prev,
        [field]: e.target.value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Basic client-side validation for required fields
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+DH/;
      if (!template.billingEmail || !template.contactEmail || !template.contactPhone || !template.companyInfo.legalMentions || !template.prefix) {
        toast({
          title: "Missing required fields",
          description: "Please fill billing email, contact email, contact phone, legal mentions and prefix.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      if (!emailRegex.test(template.billingEmail)) {
        toast({ title: "Invalid billing email", description: "Enter a valid billing email.", variant: "destructive" });
        setIsLoading(false);
        return;
      }
      if (!emailRegex.test(template.contactEmail)) {
        toast({ title: "Invalid contact email", description: "Enter a valid contact email.", variant: "destructive" });
        setIsLoading(false);
        return;
      }
      if (template.contactPhone.length < 6) {
        toast({ title: "Invalid phone", description: "Enter a valid contact phone number.", variant: "destructive" });
        setIsLoading(false);
        return;
      }

      // Ensure a logo file is provided (backend validation complains on invoice_logo_path)
      if (!logoFile) {
        toast({ title: "Logo required", description: "Please upload an invoice logo image before saving.", variant: "destructive" });
        setIsLoading(false);
        return;
      }

      const payload = {
        billing_email: template.billingEmail,
        contact_email: template.contactEmail,
        contact_phone: template.contactPhone,
        invoice_legal_mentions: template.companyInfo.legalMentions || "",
        invoice_prefix: template.prefix || "",
        invoice_logo_path: logoFile,
      };

      const res = await invoiceConfigService.createConfiguration(payload);

      // Reset form to empty after successful save instead of reloading from API
      resetFormToEmpty();

      toast({
        title: "Success",
        description: res?.message || "Invoice template saved successfully",
      });
    } catch (error) {
      const errData = (error as any)?.response?.data;
      const logoMsgs = errData?.errors?.invoice_logo_path;
      const firstLogoMsg = Array.isArray(logoMsgs) && logoMsgs.length ? logoMsgs[0] : null;
      toast({
        title: "Error",
        description: firstLogoMsg || errData?.message || "Failed to save invoice template",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Animation variants
  const animationVariants = {
    fadeIn: {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
      exit: { opacity: 0, y: -20 },
    },
  };

  return (
    <div className="container mx-auto py-6">
      <Card className="overflow-hidden">
        {/* Header Section */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={animationVariants.fadeIn}
          className="p-2 sm:p-4 md:p-6 bg-gradient-to-r from-[#00897B] to-[#00796B]"
        >
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-1 sm:gap-4">
            <div className="text-white w-full lg:w-auto">
              <h2 className="text-base sm:text-xl md:text-2xl font-bold">
                Configuration des Factures
              </h2>
              <p className="text-gray-100 mt-0.5 sm:mt-1 text-xs sm:text-base">
                Personnalisez vos modèles de factures
              </p>
            </div>
          </div>
        </motion.div>

        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              {/* Logo Upload */}
              <div>
                <Label className="text-sm font-semibold">Invoice Logo</Label>
                <p className="text-xs text-gray-500 mt-1 mb-3">
                  Upload your company logo (PNG, JPG, SVG - Max 5MB)
                </p>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  {/* Logo Preview */}
                  <div className="relative">
                    {template.logo ? (
                      <img
                        src={template.logo}
                        alt="Invoice logo"
                        className="h-24 w-24 object-contain border-2 border-gray-200 rounded-lg p-2"
                      />
                    ) : (
                      <DefaultLogo />
                    )}
                  </div>

                  {/* Upload Controls */}
                  <div className="flex flex-col gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="relative"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Logo
                      <Input
                        type="file"
                        accept="image/png,image/jpeg"
                        onChange={handleLogoUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                    </Button>

                    {template.logo && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveLogo}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        Remove Logo
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Invoice Prefix */}
              <div>
                <Label className="text-sm font-semibold">
                  Invoice Number Prefix
                </Label>
                <p className="text-xs text-gray-500 mt-1 mb-2">
                  This prefix will appear before all invoice numbers
                </p>
                <Input
                  value={template.prefix}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleInputChange(e, "prefix")
                  }
                  placeholder="e.g., INV-"
                  className="max-w-xs"
                />
              </div>

              <h3 className="text-lg font-semibold border-b pb-2">
                Company Information
              </h3>

              <div>
                <Label className="text-sm font-semibold">Company Name</Label>
                <Input
                  value={template.companyInfo.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleInputChange(e, "name", true)
                  }
                  placeholder="Enter company name"
                  className="mt-2"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold">Billing Email</Label>
                  <Input
                    type="email"
                    value={template.billingEmail}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleInputChange(e, "billingEmail")
                    }
                    placeholder="facturation@dabablane.com"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label className="text-sm font-semibold">Contact Email</Label>
                  <Input
                    type="email"
                    value={template.contactEmail}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleInputChange(e, "contactEmail")
                    }
                    placeholder="contact@dabablane.com"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label className="text-sm font-semibold">Contact Phone</Label>
                  <Input
                    value={template.contactPhone}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleInputChange(e, "contactPhone")
                    }
                    placeholder="+212615170064"
                    className="mt-2"
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-semibold">
                  Company Address
                </Label>
                <Textarea
                  value={template.companyInfo.address}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    handleInputChange(e, "address", true)
                  }
                  placeholder="Enter company address"
                  rows={3}
                  className="mt-2"
                />
              </div>

              <div>
                <Label className="text-sm font-semibold">Tax ID</Label>
                <Input
                  value={template.companyInfo.taxId}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleInputChange(e, "taxId", true)
                  }
                  placeholder="Enter tax ID"
                  className="mt-2"
                />
              </div>

              <div>
                <Label className="text-sm font-semibold">
                  Legal Mentions
                </Label>
                <Textarea
                  value={template.companyInfo.legalMentions}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    handleInputChange(e, "legalMentions", true)
                  }
                  placeholder="Enter legal mentions"
                  rows={4}
                  className="mt-2"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-[#00897B] hover:bg-[#00796B]"
              >
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
              >
                Reset
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}


