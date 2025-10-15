import { useState } from "react";
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
  PaginationEllipsis,
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
import { Upload, FileText, Trash2, Download, Filter } from "lucide-react";

interface CommissionFile {
  id: string;
  fileName: string;
  uploadDate: Date;
  category: string;
  url: string;
}

const CommissionChart = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<CommissionFile | null>(null);

  const [commissionFiles, setCommissionFiles] = useState<CommissionFile[]>([
    {
      id: "1",
      fileName: "Restaurant_Commission_2025.pdf",
      uploadDate: new Date(),
      category: "Restaurants",
      url: "#",
    },
    {
      id: "2",
      fileName: "Hotels_Commission_2025.pdf",
      uploadDate: new Date(),
      category: "Hotels",
      url: "#",
    },
  ]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "application/pdf") {
      const newFile: CommissionFile = {
        id: String(commissionFiles.length + 1),
        fileName: file.name,
        uploadDate: new Date(),
        category: "New Category",
        url: URL.createObjectURL(file),
      };
      setCommissionFiles([...commissionFiles, newFile]);
    }
  };

  const handleDownload = (url: string, fileName: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteClick = (file: CommissionFile) => {
    setFileToDelete(file);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (fileToDelete) {
      setCommissionFiles(
        commissionFiles.filter((file) => file.id !== fileToDelete.id)
      );
      setDeleteDialogOpen(false);
      setFileToDelete(null);

      const filteredFiles = getFilteredFiles().filter(
        (file) => file.id !== fileToDelete.id
      );
      const newTotalPages = Math.ceil(filteredFiles.length / pageSize);
      if (page > newTotalPages && newTotalPages > 0) {
        setPage(newTotalPages);
      }
    }
  };

  const getFilteredFiles = () => {
    return commissionFiles.filter((file) => {
      const matchesSearch =
        search.toLowerCase() === "" ||
        file.fileName.toLowerCase().includes(search.toLowerCase()) ||
        file.category.toLowerCase().includes(search.toLowerCase());

      const matchesCategory =
        selectedCategory === "all" || file.category === selectedCategory;

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
              <Button className="bg-white text-[#00897B] hover:bg-white/90 w-full sm:w-auto">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Upload className="h-4 w-4" />
                  <span className="text-sm sm:text-base">Upload New Chart</span>
                  <Input
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </label>
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
                  <SelectItem value="Restaurants">Restaurants</SelectItem>
                  <SelectItem value="Hotels">Hotels</SelectItem>
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
                {filteredFiles
                  .slice((page - 1) * pageSize, page * pageSize)
                  .map((file) => (
                    <TableRow key={file.id}>
                      <TableCell className="flex items-center gap-2">
                        <FileText className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{file.fileName}</span>
                      </TableCell>
                      <TableCell>{file.category}</TableCell>
                      <TableCell>
                        {file.uploadDate.toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleDownload(file.url, file.fileName)
                            }
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteClick(file)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {filteredFiles
              .slice((page - 1) * pageSize, page * pageSize)
              .map((file) => (
                <Card key={file.id} className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 flex-shrink-0 text-[#00897B] mt-1" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm break-words">
                        {file.fileName}
                      </h3>
                      <div className="flex flex-col gap-1 mt-2 text-xs text-gray-600">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Category:</span>
                          <span>{file.category}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Uploaded:</span>
                          <span>{file.uploadDate.toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleDownload(file.url, file.fileName)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleDeleteClick(file)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </Card>
              ))}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg">
              Are you sure?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              This will permanently delete "{fileToDelete?.fileName}". This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel
              onClick={() => setFileToDelete(null)}
              className="w-full sm:w-auto"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CommissionChart;
