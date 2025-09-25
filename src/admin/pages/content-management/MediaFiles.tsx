import { useState } from "react";
import { Card } from "@/admin/components/ui/card";
import { Input } from "@/admin/components/ui/input";
import { Button } from "@/admin/components/ui/button";
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
  AlertDialogTrigger,
} from "@/admin/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/admin/components/ui/select";
import { format } from "date-fns";
import { 
  EyeIcon, 
  TrashIcon, 
  PencilIcon, 
  UploadIcon, 
  DownloadIcon,
  ImageIcon,
  VideoIcon,
  FileIcon,
  TagIcon
} from "lucide-react";
import { Badge } from "@/admin/components/ui/badge";
import { Checkbox } from "@/admin/components/ui/checkbox";

interface MediaFile {
  id: number;
  filePath: string;
  fileName: string;
  fileType: 'image' | 'video' | 'document';
  fileSize: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const fileTypes = ['image', 'video', 'document'] as const;
const allowedExtensions = {
  image: ['.png', '.jpg', '.jpeg', '.svg'],
  video: ['.mp4', '.avi'],
  document: ['.pdf', '.docx']
};

const maxFileSizes = {
  image: 5 * 1024 * 1024, // 5MB
  video: 50 * 1024 * 1024, // 50MB
  document: 50 * 1024 * 1024 // 50MB
};

// Mock data
const mockMediaFiles: MediaFile[] = [
  {
    id: 1,
    filePath: '/uploads/image1.jpg',
    fileName: 'image1.jpg',
    fileType: 'image',
    fileSize: 2 * 1024 * 1024, // 2MB
    tags: ['banner', 'homepage'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  // Add more mock data
];

type FormData = {
  file: File | null;
  tags: string[];
};

const MediaFiles = () => {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>(mockMediaFiles);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterType, setFilterType] = useState<string>("all");
  const [selectedFiles, setSelectedFiles] = useState<number[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [newTag, setNewTag] = useState("");
  const itemsPerPage = 5;

  const [formData, setFormData] = useState<FormData>({
    file: null,
    tags: [],
  });

  const validateFile = (file: File) => {
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    const fileType = Object.entries(allowedExtensions).find(([_, exts]) => 
      exts.includes(extension as string)
    )?.[0] as 'image' | 'video' | 'document' | undefined;

    if (!fileType) {
      return "File type not supported";
    }

    if (file.size > maxFileSizes[fileType]) {
      return `File size exceeds maximum limit (${maxFileSizes[fileType] / (1024 * 1024)}MB)`;
    }

    return null;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const error = validateFile(file);
    if (error) {
      setErrors({ file: error });
      return;
    }

    setFormData(prev => ({ ...prev, file }));
    setErrors({});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!formData.file) {
      setErrors(prev => ({ ...prev, file: "File is required" }));
      return;
    }

    const error = validateFile(formData.file);
    if (error) {
      setErrors({ file: error });
      return;
    }

    // Simulate file upload
    const extension = '.' + formData.file.name.split('.').pop()?.toLowerCase();
    const fileType = Object.entries(allowedExtensions).find(([_, exts]) => 
      exts.includes(extension as string)
    )?.[0] as 'image' | 'video' | 'document';

    const newFile: MediaFile = {
      id: Math.max(...mediaFiles.map(f => f.id)) + 1,
      filePath: `/uploads/${formData.file.name}`,
      fileName: formData.file.name,
      fileType,
      fileSize: formData.file.size,
      tags: formData.tags,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setMediaFiles([...mediaFiles, newFile]);
    setIsUploadDialogOpen(false);
    resetForm();
  };

  const handleDelete = (id: number) => {
    setMediaFiles(mediaFiles.filter(file => file.id !== id));
  };

  const handleBulkDelete = () => {
    setMediaFiles(mediaFiles.filter(file => !selectedFiles.includes(file.id)));
    setSelectedFiles([]);
  };

  const handleAddTag = () => {
    if (!newTag.trim()) return;
    if (formData.tags.includes(newTag.trim())) {
      setErrors(prev => ({ ...prev, tag: "Tag already exists" }));
      return;
    }
    setFormData(prev => ({
      ...prev,
      tags: [...prev.tags, newTag.trim()]
    }));
    setNewTag("");
    setErrors({});
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const resetForm = () => {
    setFormData({
      file: null,
      tags: [],
    });
    setSelectedFile(null);
    setErrors({});
  };

  const handleExport = () => {
    const csvRows = [
      ['ID', 'File Name', 'File Type', 'File Size', 'Tags', 'Created At', 'Updated At'],
      ...mediaFiles.map(file => [
        file.id,
        file.fileName,
        file.fileType,
        `${(file.fileSize / (1024 * 1024)).toFixed(2)}MB`,
        file.tags.join(', '),
        format(file.createdAt, "PP"),
        format(file.updatedAt, "PP"),
      ])
    ];

    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `media_files_${format(new Date(), "yyyy-MM-dd")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'image':
        return <ImageIcon className="h-4 w-4" />;
      case 'video':
        return <VideoIcon className="h-4 w-4" />;
      default:
        return <FileIcon className="h-4 w-4" />;
    }
  };

  const filteredFiles = mediaFiles.filter(file =>
    (filterType === "all" || file.fileType === filterType) &&
    (file.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
     file.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  const paginatedFiles = filteredFiles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Media Files</h2>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExport}>
                <DownloadIcon className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button onClick={() => setIsUploadDialogOpen(true)}>
                <UploadIcon className="h-4 w-4 mr-2" />
                Upload File
              </Button>
            </div>
          </div>

          <div className="flex gap-4">
            <Input
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {fileTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedFiles.length > 0 && (
            <div className="flex items-center gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
              >
                Delete Selected ({selectedFiles.length})
              </Button>
            </div>
          )}

          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[30px]">
                    <Checkbox
                      checked={selectedFiles.length === paginatedFiles.length}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedFiles(paginatedFiles.map(file => file.id));
                        } else {
                          setSelectedFiles([]);
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead>File Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedFiles.map(file => (
                  <TableRow key={file.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedFiles.includes(file.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedFiles([...selectedFiles, file.id]);
                          } else {
                            setSelectedFiles(selectedFiles.filter(id => id !== file.id));
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {getFileIcon(file.fileType)}
                        {file.fileName}
                      </div>
                    </TableCell>
                    <TableCell>{file.fileType}</TableCell>
                    <TableCell>{(file.fileSize / (1024 * 1024)).toFixed(2)}MB</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {file.tags.map(tag => (
                          <Badge key={tag} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{format(file.createdAt, "PP")}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setSelectedFile(file);
                            setIsViewDialogOpen(true);
                          }}
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="icon">
                              <TrashIcon className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete File</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this file?
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(file.id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex justify-end items-center gap-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-sm">
              {currentPage}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => 
                Math.min(Math.ceil(filteredFiles.length / itemsPerPage), prev + 1)
              )}
              disabled={currentPage === Math.ceil(filteredFiles.length / itemsPerPage)}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      {/* Upload File Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload File</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label>File</label>
              <Input
                type="file"
                onChange={handleFileChange}
                accept={Object.values(allowedExtensions).flat().join(',')}
              />
              {errors.file && (
                <p className="text-sm text-red-500">{errors.file}</p>
              )}
              <p className="text-sm text-muted-foreground">
                Supported formats: Images (PNG, JPEG, SVG), Videos (MP4, AVI), Documents (PDF, DOCX)
              </p>
              <p className="text-sm text-muted-foreground">
                Maximum file size: Images - 5MB, Videos/Documents - 50MB
              </p>
            </div>

            <div className="space-y-2">
              <label>Tags</label>
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add a tag"
                />
                <Button type="button" onClick={handleAddTag}>
                  <TagIcon className="h-4 w-4" />
                </Button>
              </div>
              {errors.tag && (
                <p className="text-sm text-red-500">{errors.tag}</p>
              )}
              <div className="flex flex-wrap gap-1">
                {formData.tags.map(tag => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => handleRemoveTag(tag)}
                  >
                    {tag} ×
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsUploadDialogOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                Upload
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View File Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>View File</DialogTitle>
          </DialogHeader>
          {selectedFile && (
            <div className="space-y-4">
              <div className="border rounded-md p-4">
                {selectedFile.fileType === 'image' ? (
                  <img
                    src={selectedFile.filePath}
                    alt={selectedFile.fileName}
                    className="max-w-full h-auto"
                  />
                ) : selectedFile.fileType === 'video' ? (
                  <video
                    src={selectedFile.filePath}
                    controls
                    className="max-w-full"
                  />
                ) : (
                  <div className="flex items-center justify-center p-8 bg-muted">
                    <FileIcon className="h-16 w-16" />
                  </div>
                )}
              </div>
              <div>
                <label className="font-semibold">File Name</label>
                <p>{selectedFile.fileName}</p>
              </div>
              <div>
                <label className="font-semibold">File Type</label>
                <p>{selectedFile.fileType}</p>
              </div>
              <div>
                <label className="font-semibold">File Size</label>
                <p>{(selectedFile.fileSize / (1024 * 1024)).toFixed(2)}MB</p>
              </div>
              <div>
                <label className="font-semibold">Tags</label>
                <div className="flex flex-wrap gap-1">
                  {selectedFile.tags.map(tag => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <label className="font-semibold">Created At</label>
                <p>{format(selectedFile.createdAt, "PPp")}</p>
              </div>
              <div>
                <label className="font-semibold">Updated At</label>
                <p>{format(selectedFile.updatedAt, "PPp")}</p>
              </div>
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setIsViewDialogOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MediaFiles;
