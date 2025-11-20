import { useState, useEffect } from "react";
import { Card } from "@/admin/components/ui/card";
import { Button } from "@/admin/components/ui/button";
import { Input } from "@/admin/components/ui/input";
import { Label } from "@/admin/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/admin/components/ui/dialog";
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
import { Loader2, Upload, FileText, Eye, Edit, Trash2, X, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "react-hot-toast";
import termsConditionsApi from "@/admin/lib/api/services/termsConditionsService";
import type { TermsAndCondition } from "@/admin/lib/api/types/termsConditions";

// Helper to get full PDF URL
const getPdfUrl = (pdfPath: string): string => {
  if (!pdfPath) return "";
  
  // If it's already a full URL, return it
  if (pdfPath.startsWith("http://") || pdfPath.startsWith("https://")) {
    return pdfPath;
  }
  
  // Get the base URL (main domain, not API domain)
  // In Laravel, storage files are served from the main domain
  const apiBaseUrl = import.meta.env.VITE_API_URL || "https://dev.dabablane.com/api";
  const baseDomain = apiBaseUrl.replace("/api", ""); // Remove /api to get main domain
  
  // Handle different path formats
  let cleanPath = pdfPath;
  
  // Remove leading slash if present
  if (cleanPath.startsWith("/")) {
    cleanPath = cleanPath.slice(1);
  }
  
  // If path already starts with 'storage/', use it directly
  if (cleanPath.startsWith("storage/")) {
    return `${baseDomain}/${cleanPath}`;
  }
  
  // If path starts with 'public/' or 'uploads/', construct accordingly
  if (cleanPath.startsWith("public/") || cleanPath.startsWith("uploads/")) {
    return `${baseDomain}/${cleanPath}`;
  }
  
  // For other paths, try common Laravel storage patterns
  // Laravel typically stores files in storage/app/public and serves via /storage route
  if (cleanPath.includes("terms") || cleanPath.includes("conditions")) {
    // If it looks like a terms-conditions file, try storage path
    return `${baseDomain}/storage/${cleanPath}`;
  }
  
  // Default: try with storage prefix
  return `${baseDomain}/storage/${cleanPath}`;
};

const TermsAndCondition = () => {
  const [pdfFile, setPdfFile] = useState<TermsAndCondition | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    version: "1.0",
  });

  // Fetch existing PDF
  useEffect(() => {
    const fetchPDF = async () => {
      setIsLoading(true);
      try {
        const response = await termsConditionsApi.getActive();
        if (response) {
          setPdfFile(response);
        } else {
          setPdfFile(null);
        }
      } catch (error: any) {
        console.error("Error fetching PDF:", error);
        // If it's a 404, that's fine - no active terms exist
        if (error.response?.status !== 404) {
          toast.error("Failed to load Terms & Conditions");
        }
        setPdfFile(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPDF();
  }, []);

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return "Unknown size";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const validateFile = (file: File): string | null => {
    // Check file type
    if (file.type !== "application/pdf") {
      return "Only PDF files are allowed";
    }

    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return "File size must be less than 10MB";
    }

    return null;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      return;
    }

    const error = validateFile(file);
    if (error) {
      toast.error(error);
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a PDF file");
      return;
    }

    if (!formData.title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    if (!formData.version.trim()) {
      toast.error("Please enter a version");
      return;
    }

    setIsUploading(true);
    try {
      // If PDF exists, delete old one first (API handles this automatically when uploading new one)
      if (pdfFile?.id) {
        try {
          await termsConditionsApi.delete(pdfFile.id);
        } catch (error) {
          console.warn("Error deleting old PDF (may not exist):", error);
          // Continue anyway - the upload will create a new one
        }
      }

      // Upload new PDF
      const response = await termsConditionsApi.upload({
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        version: formData.version.trim(),
        is_active: 1,
        pdf_file: selectedFile,
      });

      setPdfFile(response);
      setSelectedFile(null);
      setFormData({ title: "", description: "", version: "1.0" });
      setIsUploadDialogOpen(false);
      toast.success("Terms & Conditions PDF uploaded successfully");
    } catch (error: any) {
      console.error("Error uploading PDF:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to upload PDF";
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!pdfFile?.id) return;

    setIsDeleting(true);
    try {
      await termsConditionsApi.delete(pdfFile.id);
      setPdfFile(null);
      setIsDeleteDialogOpen(false);
      toast.success("Terms & Conditions PDF deleted successfully");
    } catch (error: any) {
      console.error("Error deleting PDF:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to delete PDF";
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleView = () => {
    if (!pdfFile) {
      toast.error("No PDF file available");
      return;
    }

    console.log("📄 PDF File data:", pdfFile);
    
    // Try different possible field names for the PDF URL/path
    const pdfPath = pdfFile.pdf_file || (pdfFile as any).file_url || (pdfFile as any).file_path;
    
    if (!pdfPath) {
      console.error("❌ No PDF path found in response:", pdfFile);
      toast.error("PDF URL not available. Please check the file data.");
      return;
    }
    
    // Get full PDF URL
    let pdfUrl = getPdfUrl(pdfPath);
    console.log("🔗 Constructed PDF URL:", pdfUrl);
    
    // If we have an ID, also try the API endpoint as fallback
    if (pdfFile.id && !pdfUrl.includes("http")) {
      const apiBaseUrl = import.meta.env.VITE_API_URL || "https://dev.dabablane.com/api";
      const apiUrl = `${apiBaseUrl}/terms-conditions/${pdfFile.id}/download`;
      console.log("🔗 Alternative API URL:", apiUrl);
      // Try API endpoint if storage URL construction failed
      if (!pdfUrl || pdfUrl === "") {
        pdfUrl = apiUrl;
      }
    }
    
    if (pdfUrl) {
      try {
        // Open in new tab
        const newWindow = window.open(pdfUrl, "_blank");
        if (!newWindow) {
          toast.error("Popup blocked. Please allow popups for this site.");
        }
      } catch (error) {
        console.error("❌ Error opening PDF:", error);
        toast.error("Failed to open PDF. Please check the URL.");
      }
    } else {
      toast.error("PDF URL not available");
    }
  };

  const handleEdit = () => {
    // Pre-fill form with existing data
    if (pdfFile) {
      setFormData({
        title: pdfFile.title || "",
        description: pdfFile.description || "",
        version: pdfFile.version || "1.0",
      });
    }
    setSelectedFile(null);
    setIsUploadDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6 w-full max-w-full overflow-x-hidden">
        <Card>
          <div className="text-center p-8 sm:p-12">
            <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin mx-auto mb-4 text-[#00897B]" />
            <p className="text-gray-500 text-sm sm:text-base">Loading Terms & Conditions...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6 w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:gap-4 md:gap-4">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-3 md:gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#00897B] break-words">
              Terms & Conditions
            </h1>
            <p className="text-gray-500 mt-1 text-xs sm:text-sm md:text-base">
              Manage Terms & Conditions PDF document
            </p>
          </div>
          {!pdfFile && (
            <Button
              onClick={() => {
                setFormData({ title: "", description: "", version: "1.0" });
                setSelectedFile(null);
                setIsUploadDialogOpen(true);
              }}
              className="bg-[#00897B] hover:bg-[#00796B] w-full md:w-auto whitespace-nowrap flex-shrink-0 text-sm sm:text-sm md:text-base"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload PDF
            </Button>
          )}
        </div>
      </div>

      {/* PDF Display Card */}
      {pdfFile ? (
        <Card className="p-4 sm:p-5 md:p-6 border-l-4 border-l-[#00897B]">
          <div className="flex flex-col lg:flex-row lg:items-start gap-4 sm:gap-4 lg:gap-6">
            {/* PDF Info */}
            <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0 w-full">
              <div className="p-2 sm:p-3 bg-[#00897B]/10 rounded-lg flex-shrink-0">
                <FileText className="h-7 w-7 sm:h-8 sm:w-8 md:h-10 md:w-10 text-[#00897B]" />
              </div>
              <div className="flex-1 min-w-0 w-full">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <h3 className="text-base sm:text-lg md:text-lg font-semibold text-gray-900 break-words">
                    {pdfFile.title || pdfFile.pdf_file_name || "Terms & Conditions"}
                  </h3>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600 mb-2">
                  {pdfFile.version && (
                    <>
                      <span className="font-medium">Version: {pdfFile.version}</span>
                      <span>•</span>
                    </>
                  )}
                  {pdfFile.pdf_file_size && (
                    <>
                      <span className="font-medium">{formatFileSize(pdfFile.pdf_file_size)}</span>
                      <span>•</span>
                    </>
                  )}
                  <span>PDF Document</span>
                  {pdfFile.created_at && (
                    <>
                      <span>•</span>
                      <span>
                        Uploaded: {new Date(pdfFile.created_at).toLocaleDateString()}
                      </span>
                    </>
                  )}
                </div>
                {pdfFile.description && (
                  <div className="mt-2 w-full">
                    <p className="text-xs sm:text-sm text-gray-500 break-words whitespace-normal overflow-wrap-anywhere" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                      {pdfFile.description}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row md:flex-row lg:flex-col xl:flex-row gap-2.5 sm:gap-2 md:gap-2 flex-shrink-0 w-full sm:w-auto md:w-auto lg:w-auto mt-2 sm:mt-0">
              <Button
                onClick={handleView}
                variant="outline"
                className="border-[#00897B] text-[#00897B] hover:bg-[#00897B] hover:text-white w-full sm:w-auto md:w-auto lg:w-full xl:w-auto text-sm py-2.5 sm:py-2 h-auto min-h-[44px] sm:min-h-0"
              >
                <Eye className="h-4 w-4 mr-2" />
                View PDF
              </Button>
              <Button
                onClick={handleEdit}
                variant="outline"
                className="border-[#00897B] text-[#00897B] hover:bg-[#00897B] hover:text-white w-full sm:w-auto md:w-auto lg:w-full xl:w-auto text-sm py-2.5 sm:py-2 h-auto min-h-[44px] sm:min-h-0"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                onClick={() => setIsDeleteDialogOpen(true)}
                variant="outline"
                className="border-red-500 text-red-600 hover:bg-red-50 hover:border-red-600 w-full sm:w-auto md:w-auto lg:w-full xl:w-auto text-sm py-2.5 sm:py-2 h-auto min-h-[44px] sm:min-h-0"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="p-6 sm:p-8 md:p-10 lg:p-12">
          <div className="text-center">
            <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-gray-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
              <FileText className="h-7 w-7 sm:h-8 sm:w-8 md:h-10 md:w-10 text-gray-400" />
            </div>
            <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mb-2">
              No Terms & Conditions PDF
            </h3>
            <p className="text-gray-500 text-xs sm:text-sm md:text-base mb-4 sm:mb-5 md:mb-6 px-2">
              Upload a PDF file to get started. Only one PDF can be stored at a time.
            </p>
            <Button
              onClick={() => {
                setFormData({ title: "", description: "", version: "1.0" });
                setSelectedFile(null);
                setIsUploadDialogOpen(true);
              }}
              className="bg-[#00897B] hover:bg-[#00796B] text-sm sm:text-sm md:text-base"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload PDF
            </Button>
          </div>
        </Card>
      )}

      {/* Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="w-[95%] sm:max-w-[500px] md:max-w-[550px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {pdfFile ? "Edit Terms & Conditions" : "Upload Terms & Conditions"}
            </DialogTitle>
            <DialogDescription>
              {pdfFile
                ? "Upload a new PDF to replace the existing one. The old PDF will be deleted automatically."
                : "Upload a PDF file for Terms & Conditions. Only PDF files are accepted."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Title Field */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-semibold">
                Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                type="text"
                placeholder="e.g., Terms & Conditions v1.0"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="h-10"
              />
            </div>

            {/* Description Field */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-semibold">
                Description
              </Label>
              <Input
                id="description"
                type="text"
                placeholder="e.g., Updated terms and conditions for 2025"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="h-10"
              />
            </div>

            {/* Version Field */}
            <div className="space-y-2">
              <Label htmlFor="version" className="text-sm font-semibold">
                Version <span className="text-red-500">*</span>
              </Label>
              <Input
                id="version"
                type="text"
                placeholder="e.g., 1.0"
                value={formData.version}
                onChange={(e) =>
                  setFormData({ ...formData, version: e.target.value })
                }
                className="h-10"
              />
            </div>

            {/* PDF File Field */}
            <div className="space-y-2">
              <Label htmlFor="pdf-file" className="text-sm font-semibold">
                PDF File <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="pdf-file"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
              </div>

              {selectedFile && (
                <div className="mt-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 rounded-md">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        <FileText className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <p className="text-sm font-semibold text-gray-900">File selected</p>
                        </div>
                        <p className="text-sm text-gray-700 truncate mt-1">
                          {selectedFile.name}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-600">
                          <span className="font-medium">{formatFileSize(selectedFile.size)}</span>
                          <span>•</span>
                          <span>PDF Document</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedFile(null)}
                      className="flex-shrink-0 h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {!selectedFile && (
                <div className="flex items-start gap-2 mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-700">
                    Only PDF files are accepted. Maximum file size: 10MB
                  </p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row md:flex-row gap-2 sm:gap-2 md:gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsUploadDialogOpen(false);
                setSelectedFile(null);
                setFormData({ title: "", description: "", version: "1.0" });
              }}
              className="w-full sm:w-auto md:w-auto text-sm sm:text-sm"
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              className="bg-[#00897B] hover:bg-[#00796B] w-full sm:w-auto md:w-auto text-sm sm:text-sm"
              disabled={isUploading || !selectedFile || !formData.title.trim() || !formData.version.trim()}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  {pdfFile ? "Replace PDF" : "Upload PDF"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Terms & Conditions PDF?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the Terms & Conditions PDF? This action cannot be
              undone. You will need to upload a new PDF file.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row md:flex-row gap-2 sm:gap-2 md:gap-3">
            <AlertDialogCancel className="w-full sm:w-auto md:w-auto text-sm sm:text-sm" disabled={isDeleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 w-full sm:w-auto md:w-auto text-sm sm:text-sm"
              disabled={isDeleting}
            >
              {isDeleting ? (
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

export default TermsAndCondition;

