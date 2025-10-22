import { useState, useEffect } from "react";
import { Card } from "@/admin/components/ui/card";
import { Button } from "@/admin/components/ui/button";
import { Input } from "@/admin/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/admin/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/admin/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/admin/components/ui/table";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/admin/components/ui/dialog";
import { Label } from "@/admin/components/ui/label";
import { Upload, FileText, Trash2, Download, Loader2, Edit, X, CheckCircle2, AlertCircle } from "lucide-react";
import { commissionChartApi } from "@/admin/lib/api/services/commissionChartService";
import { categoryApi } from "@/admin/lib/api/services/categoryService";
import { CommissionFile } from "@/admin/lib/api/types/commissionChart";
import { Category } from "@/admin/lib/api/types/category";
import { useToast } from "@/admin/hooks/use-toast";

// Utility function to format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

// Utility function to extract filename from path
const getFileName = (file: CommissionFile): string => {
  if (file.file_name) return file.file_name;
  if (file.commission_file) {
    const parts = file.commission_file.split('/');
    return parts[parts.length - 1];
  }
  return `commission_file_${file.id}.pdf`;
};

const CommissionChart = () => {
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<CommissionFile | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [fileToUpdate, setFileToUpdate] = useState<CommissionFile | null>(null);
  
  // Data states
  const [commissionFiles, setCommissionFiles] = useState<CommissionFile[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [downloading, setDownloading] = useState<number | null>(null);
  
  // Form states
  const [uploadCategoryId, setUploadCategoryId] = useState<string>("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [updateCategoryId, setUpdateCategoryId] = useState<string>("");
  const [updateFile, setUpdateFile] = useState<File | null>(null);

  // Fetch commission files
  const fetchCommissionFiles = async () => {
    setLoading(true);
    try {
      const files = await commissionChartApi.getCommissionFiles();
      setCommissionFiles(files);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to fetch commission files",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await categoryApi.getCategories({ paginationSize: 100 });
      setCategories(response.data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch categories",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchCommissionFiles();
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle file upload
  const handleFileUpload = async () => {
    if (!uploadFile || !uploadCategoryId) {
      toast({
        title: "Error",
        description: "Please select a file and category",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      await commissionChartApi.uploadCommissionFile({
        category_id: uploadCategoryId,
        commission_file: uploadFile,
      });
      
      toast({
        title: "Success",
        description: "Commission file uploaded successfully",
      });
      
      setUploadDialogOpen(false);
      setUploadFile(null);
      setUploadCategoryId("");
      fetchCommissionFiles();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message 
        || (error.response?.data?.errors ? JSON.stringify(error.response.data.errors) : null)
        || error.message 
        || "Failed to upload file";
      
      toast({
        title: "Upload Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  // Handle file update
  const handleFileUpdate = async () => {
    if (!fileToUpdate) return;

    if (!updateFile && !updateCategoryId) {
      toast({
        title: "Error",
        description: "Please select a file or category to update",
        variant: "destructive",
      });
      return;
    }

    setUpdating(true);
    try {
      await commissionChartApi.updateCommissionFile(fileToUpdate.id, {
        category_id: updateCategoryId || undefined,
        commission_file: updateFile || undefined,
      });
      
      toast({
        title: "Success",
        description: "Commission file updated successfully",
      });
      
      setUpdateDialogOpen(false);
      setFileToUpdate(null);
      setUpdateFile(null);
      setUpdateCategoryId("");
      fetchCommissionFiles();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update file",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  // Handle file download
  const handleDownload = async (file: CommissionFile) => {
    setDownloading(file.id);
    try {
      const blob = await commissionChartApi.downloadCommissionFile(file.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.file_name || `commission_${file.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Success",
        description: "File downloaded successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to download file",
        variant: "destructive",
      });
    } finally {
      setDownloading(null);
    }
  };

  // Handle update click
  const handleUpdateClick = (file: CommissionFile) => {
    setFileToUpdate(file);
    setUpdateCategoryId(String(file.category_id));
    setUpdateDialogOpen(true);
  };

  // Handle delete click
  const handleDeleteClick = (file: CommissionFile) => {
    setFileToDelete(file);
    setDeleteDialogOpen(true);
  };

  // Handle delete confirm
  const handleDeleteConfirm = async () => {
    if (!fileToDelete) return;

    setDeleting(true);
    try {
      await commissionChartApi.deleteCommissionFile(fileToDelete.id);
      
      toast({
        title: "Success",
        description: "Commission file deleted successfully",
      });
      
      setDeleteDialogOpen(false);
      setFileToDelete(null);
      fetchCommissionFiles();
      
      const filteredFiles = getFilteredFiles().filter(
        (file) => file.id !== fileToDelete.id
      );
      const newTotalPages = Math.ceil(filteredFiles.length / pageSize);
      if (page > newTotalPages && newTotalPages > 0) {
        setPage(newTotalPages);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete file",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const getFilteredFiles = () => {
    return commissionFiles.filter((file) => {
      const fileName = file.file_name || file.commission_file || "";
      const categoryName = file.category?.name || "";
      
      const matchesSearch =
        search.toLowerCase() === "" ||
        fileName.toLowerCase().includes(search.toLowerCase()) ||
        categoryName.toLowerCase().includes(search.toLowerCase());

      const matchesCategory =
        selectedCategory === "all" || 
        String(file.category_id) === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  };

  const filteredFiles = getFilteredFiles();
  const totalPages = Math.ceil(filteredFiles.length / pageSize);

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-4 lg:p-6">
      <Card className="overflow-hidden">
        {/* Header Section */}
        <div className="p-4 sm:p-6 lg:p-8 bg-gradient-to-r from-[#00897B] to-[#00796B]">
          <div className="flex flex-col gap-4">
            <div className="text-white">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold">
                Commission Charts
              </h2>
              <p className="text-white/80 text-sm sm:text-base mt-1">
                Manage vendor commission charts and rates
              </p>
            </div>
            <div className="flex justify-start">
              <Button 
                className="bg-white text-[#00897B] hover:bg-white/90 w-full sm:w-auto"
                onClick={() => setUploadDialogOpen(true)}
                disabled={loading}
              >
                <Upload className="h-4 w-4 mr-2" />
                <span className="text-sm sm:text-base">Upload New Chart</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
            {/* Search Input */}
            <div className="w-full">
              <Input
                placeholder="Search by name or category..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full"
              />
            </div>

            {/* Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Select
                value={selectedCategory}
                onValueChange={(value: string) => {
                  setSelectedCategory(value);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={String(category.id)}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={String(pageSize)}
                onValueChange={(value: string) => {
                  setPageSize(Number(value));
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Items per page" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 per page</SelectItem>
                  <SelectItem value="10">10 per page</SelectItem>
                  <SelectItem value="20">20 per page</SelectItem>
                  <SelectItem value="50">50 per page</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Upload Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12">
                      <div className="flex flex-col items-center gap-3">
                        <div className="relative">
                          <Loader2 className="h-10 w-10 animate-spin text-[#00897B]" />
                          <div className="absolute inset-0 h-10 w-10 animate-ping text-[#00897B] opacity-20">
                            <Loader2 className="h-10 w-10" />
                          </div>
                        </div>
                        <p className="text-sm font-medium text-gray-600">Loading commission charts...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredFiles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12">
                      <div className="flex flex-col items-center gap-3">
                        <div className="p-4 bg-gray-100 rounded-full">
                          <FileText className="h-8 w-8 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">No commission files found</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {search || selectedCategory !== "all" 
                              ? "Try adjusting your filters" 
                              : "Upload your first commission chart to get started"}
                          </p>
                        </div>
                        {!search && selectedCategory === "all" && (
                          <Button
                            onClick={() => setUploadDialogOpen(true)}
                            className="mt-2 bg-[#00897B] hover:bg-[#00796B]"
                            size="sm"
                          >
                            <Upload className="mr-2 h-4 w-4" />
                            Upload Chart
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredFiles
                    .slice((page - 1) * pageSize, page * pageSize)
                    .map((file) => (
                      <TableRow key={file.id} className="hover:bg-gray-50 transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-[#00897B] to-[#00796B] rounded-lg shadow-sm">
                              <FileText className="h-4 w-4 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 truncate">
                                {getFileName(file)}
                              </p>
                              <p className="text-xs text-gray-500">PDF Document</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center text-xs font-medium">
                            {file.category?.name || "N/A"}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {new Date(file.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1.5 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownload(file)}
                              disabled={downloading === file.id}
                              className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-600"
                              title="Download file"
                            >
                              {downloading === file.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Download className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateClick(file)}
                              className="hover:bg-amber-50 hover:text-amber-600 hover:border-amber-600"
                              title="Edit file"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteClick(file)}
                              className="hover:bg-red-50 hover:text-red-600 hover:border-red-600"
                              title="Delete file"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {loading ? (
              <div className="text-center py-12">
                <div className="flex flex-col items-center gap-3">
                  <div className="relative">
                    <Loader2 className="h-10 w-10 animate-spin text-[#00897B]" />
                    <div className="absolute inset-0 h-10 w-10 animate-ping text-[#00897B] opacity-20">
                      <Loader2 className="h-10 w-10" />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-600">Loading commission charts...</p>
                </div>
              </div>
            ) : filteredFiles.length === 0 ? (
              <div className="text-center py-12">
                <div className="flex flex-col items-center gap-3">
                  <div className="p-4 bg-gray-100 rounded-full">
                    <FileText className="h-8 w-8 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">No commission files found</p>
                    <p className="text-xs text-gray-500 mt-1 px-4">
                      {search || selectedCategory !== "all" 
                        ? "Try adjusting your filters" 
                        : "Upload your first commission chart to get started"}
                    </p>
                  </div>
                  {!search && selectedCategory === "all" && (
                    <Button
                      onClick={() => setUploadDialogOpen(true)}
                      className="mt-2 bg-[#00897B] hover:bg-[#00796B] w-full max-w-xs"
                      size="sm"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Chart
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              filteredFiles
                .slice((page - 1) * pageSize, page * pageSize)
                .map((file) => (
                  <Card key={file.id} className="overflow-hidden border-l-4 border-l-[#00897B] shadow-sm hover:shadow-md transition-shadow">
                    <div className="p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 bg-gradient-to-br from-[#00897B] to-[#00796B] rounded-lg shadow-sm">
                          <FileText className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm text-gray-900 break-words leading-tight">
                            {getFileName(file)}
                          </h3>
                          <p className="text-xs text-gray-500 mt-0.5">PDF Document</p>
                          <div className="flex flex-col gap-1.5 mt-3">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {file.category?.name || "N/A"}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-gray-600">
                              <span className="font-medium">Uploaded:</span>
                              <span>{new Date(file.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-600"
                          onClick={() => handleDownload(file)}
                          disabled={downloading === file.id}
                        >
                          {downloading === file.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Download className="h-4 w-4 sm:mr-1" />
                              <span className="hidden sm:inline">Download</span>
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="hover:bg-amber-50 hover:text-amber-600 hover:border-amber-600"
                          onClick={() => handleUpdateClick(file)}
                        >
                          <Edit className="h-4 w-4 sm:mr-1" />
                          <span className="hidden sm:inline">Edit</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="hover:bg-red-50 hover:text-red-600 hover:border-red-600"
                          onClick={() => handleDeleteClick(file)}
                        >
                          <Trash2 className="h-4 w-4 sm:mr-1" />
                          <span className="hidden sm:inline">Delete</span>
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
            )}
          </div>

          {/* Pagination */}
          <div className="mt-4 sm:mt-6 flex justify-center">
            <Pagination>
              <PaginationContent className="flex-wrap gap-1">
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    aria-disabled={page <= 1}
                    className={`${
                      page <= 1
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    } text-xs sm:text-sm`}
                  />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink className="text-xs sm:text-sm">
                    Page {page} / {totalPages || 1}
                  </PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setPage((prev) => prev + 1)}
                    aria-disabled={page >= totalPages}
                    className={`${
                      page >= totalPages
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    } text-xs sm:text-sm`}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-[90vw] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Upload className="h-5 w-5 text-[#00897B]" />
              Upload Commission Chart
            </DialogTitle>
            <DialogDescription>
              Select a category and upload a PDF file for the commission chart.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label htmlFor="category" className="text-sm font-semibold">
                Category <span className="text-red-500">*</span>
              </Label>
              <Select
                value={uploadCategoryId}
                onValueChange={setUploadCategoryId}
              >
                <SelectTrigger id="category" className="h-11">
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
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="file" className="text-sm font-semibold">
                Commission File <span className="text-red-500">*</span>
              </Label>
              
              <div className="relative">
                <Input
                  id="file"
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="cursor-pointer"
                />
              </div>
              
              {uploadFile && (
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
                          {uploadFile.name}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-600">
                          <span className="font-medium">{formatFileSize(uploadFile.size)}</span>
                          <span>•</span>
                          <span>PDF Document</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setUploadFile(null)}
                      className="flex-shrink-0 h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
              
              {!uploadFile && (
                <div className="flex items-start gap-2 mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-700">
                    Only PDF files are accepted. Maximum file size: 10MB
                  </p>
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter className="flex-col sm:flex-row gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setUploadDialogOpen(false);
                setUploadFile(null);
                setUploadCategoryId("");
              }}
              className="w-full sm:w-auto"
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleFileUpload}
              className="bg-[#00897B] hover:bg-[#00796B] w-full sm:w-auto shadow-md"
              disabled={uploading || !uploadFile || !uploadCategoryId}
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload File
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Dialog */}
      <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
        <DialogContent className="max-w-[90vw] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Edit className="h-5 w-5 text-[#00897B]" />
              Update Commission Chart
            </DialogTitle>
            <DialogDescription>
              Update the category or replace the commission chart file.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label htmlFor="update-category" className="text-sm font-semibold">
                Category
              </Label>
              <Select
                value={updateCategoryId}
                onValueChange={setUpdateCategoryId}
              >
                <SelectTrigger id="update-category" className="h-11">
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
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="update-file" className="text-sm font-semibold">
                Commission File
              </Label>
              
              {/* Current File Preview */}
              {!updateFile && fileToUpdate && (
                <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-l-4 border-blue-500 rounded-md">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        <FileText className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">
                          Current File
                        </p>
                        <p className="text-sm font-semibold text-gray-900 truncate mt-1">
                          {getFileName(fileToUpdate)}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-gray-600">
                            Uploaded {new Date(fileToUpdate.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(fileToUpdate)}
                      disabled={downloading === fileToUpdate.id}
                      className="flex-shrink-0 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-600"
                    >
                      {downloading === fileToUpdate.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-1" />
                          <span className="text-xs">View</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
              
              {/* New File Upload */}
              <div>
                <div className="relative">
                  <Input
                    id="update-file"
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setUpdateFile(e.target.files?.[0] || null)}
                    className="cursor-pointer"
                  />
                </div>
                
                {updateFile && (
                  <div className="mt-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 rounded-md">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                          <FileText className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                            <p className="text-xs font-medium text-green-600 uppercase tracking-wide">
                              New File Selected
                            </p>
                          </div>
                          <p className="text-sm font-semibold text-gray-900 truncate mt-1">
                            {updateFile.name}
                          </p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-600">
                            <span className="font-medium">{formatFileSize(updateFile.size)}</span>
                            <span>•</span>
                            <span>PDF Document</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setUpdateFile(null)}
                        className="flex-shrink-0 h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
                
                {!updateFile && (
                  <div className="flex items-start gap-2 mt-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
                    <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-amber-700">
                      Leave empty to keep the current file. Select a new PDF to replace it.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex-col sm:flex-row gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setUpdateDialogOpen(false);
                setFileToUpdate(null);
                setUpdateFile(null);
                setUpdateCategoryId("");
              }}
              className="w-full sm:w-auto"
              disabled={updating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleFileUpdate}
              className="bg-[#00897B] hover:bg-[#00796B] w-full sm:w-auto shadow-md"
              disabled={updating}
            >
              {updating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Update Chart
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <AlertDialogTitle className="text-lg font-semibold">
                  Delete Commission Chart
                </AlertDialogTitle>
              </div>
            </div>
            <AlertDialogDescription className="text-sm text-gray-600 pt-2">
              Are you sure you want to delete this commission chart?
            </AlertDialogDescription>
            {fileToDelete && (
              <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-md">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-600" />
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {getFileName(fileToDelete)}
                  </p>
                </div>
                <p className="text-xs text-gray-500 mt-1 ml-6">
                  Category: {fileToDelete.category?.name || "N/A"}
                </p>
              </div>
            )}
            <p className="text-xs text-red-600 font-medium mt-3">
              ⚠️ This action cannot be undone
            </p>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 mt-4">
            <AlertDialogCancel
              onClick={() => setFileToDelete(null)}
              className="w-full sm:w-auto"
              disabled={deleting}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 w-full sm:w-auto shadow-md"
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Permanently
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CommissionChart;
