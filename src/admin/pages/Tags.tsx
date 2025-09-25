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
  DialogTrigger,
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
import { PencilIcon, TrashIcon, PlusIcon, UploadIcon, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { Checkbox } from "@/admin/components/ui/checkbox";

interface Tag {
  id: number;
  blaneId: number;
  blaneName: string;
  tagName: string;
  createdAt: string;
  updatedAt: string;
}

interface Blane {
  id: number;
  name: string;
}

// Mock data
const mockTags: Tag[] = [
  {
    id: 1,
    blaneId: 1,
    blaneName: "Blane 1",
    tagName: "Popular",
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
  },
  {
    id: 2,
    blaneId: 1,
    blaneName: "Blane 1",
    tagName: "Featured",
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
  },
];

const mockBlanes: Blane[] = [
  { id: 1, name: "Blane 1" },
  { id: 2, name: "Blane 2" },
];

// Add interface for CSV data structure
interface CSVTag {
  blaneId: string;
  tagName: string;
}

const Tags = () => {
  const [tags, setTags] = useState<Tag[]>(mockTags);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
  const [selectedBlaneId, setSelectedBlaneId] = useState<string>("");
  const [tagName, setTagName] = useState("");
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [fileError, setFileError] = useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validation
    if (!selectedBlaneId) {
      setErrors(prev => ({ ...prev, blaneId: "Blane is required" }));
      return;
    }

    if (!tagName.trim()) {
      setErrors(prev => ({ ...prev, tagName: "Tag name is required" }));
      return;
    }

    // Check for duplicate tag names for the same blane
    const isDuplicate = tags.some(
      tag => 
        tag.blaneId === parseInt(selectedBlaneId) && 
        tag.tagName.toLowerCase() === tagName.toLowerCase() &&
        tag.id !== selectedTag?.id
    );

    if (isDuplicate) {
      setErrors(prev => ({ ...prev, tagName: "Tag name already exists for this blane" }));
      return;
    }

    if (selectedTag) {
      // Update existing tag
      setTags(tags.map(tag =>
        tag.id === selectedTag.id
          ? {
              ...tag,
              blaneId: parseInt(selectedBlaneId),
              blaneName: mockBlanes.find(b => b.id === parseInt(selectedBlaneId))?.name || "",
              tagName,
              updatedAt: new Date().toISOString(),
            }
          : tag
      ));
    } else {
      // Add new tag
      setTags([
        ...tags,
        {
          id: Math.max(...tags.map(t => t.id)) + 1,
          blaneId: parseInt(selectedBlaneId),
          blaneName: mockBlanes.find(b => b.id === parseInt(selectedBlaneId))?.name || "",
          tagName,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]);
    }

    setIsAddDialogOpen(false);
    resetForm();
  };

  const handleEdit = (tag: Tag) => {
    setSelectedTag(tag);
    setSelectedBlaneId(tag.blaneId.toString());
    setTagName(tag.tagName);
    setIsAddDialogOpen(true);
  };

  const handleDelete = (tagId: number) => {
    setTags(tags.filter(tag => tag.id !== tagId));
  };

  const handleBulkDelete = () => {
    setTags(tags.filter(tag => !selectedTags.includes(tag.id)));
    setSelectedTags([]);
  };

  const resetForm = () => {
    setSelectedTag(null);
    setSelectedBlaneId("");
    setTagName("");
    setErrors({});
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileError("");

    if (!file) return;

    // Validate file type
    const validTypes = [
      'text/csv',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    
    if (!validTypes.includes(file.type)) {
      setFileError("Please upload a CSV or Excel file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setFileError("File size should be less than 5MB");
      return;
    }

    try {
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        const csvData = event.target?.result as string;
        const lines = csvData.split('\n');
        
        // Validate CSV structure
        const headers = lines[0].toLowerCase().trim().split(',');
        if (!headers.includes('blaneid') || !headers.includes('tagname')) {
          setFileError("Invalid file format. Please use the correct template");
          return;
        }

        const newTags: Tag[] = [];
        const errors: string[] = [];

        // Process each line
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue; // Skip empty lines
          
          const values = lines[i].trim().split(',');
          const blaneId = parseInt(values[0]);
          const tagName = values[1].trim();

          // Validate blaneId exists
          const blaneExists = mockBlanes.some(blane => blane.id === blaneId);
          if (!blaneExists) {
            errors.push(`Line ${i + 1}: Blane ID ${blaneId} does not exist`);
            continue;
          }

          // Check for duplicate tags
          const isDuplicate = tags.some(
            tag => tag.blaneId === blaneId && 
                   tag.tagName.toLowerCase() === tagName.toLowerCase()
          );
          if (isDuplicate) {
            errors.push(`Line ${i + 1}: Tag "${tagName}" already exists for Blane ${blaneId}`);
            continue;
          }

          // Add valid tag
          newTags.push({
            id: Math.max(...tags.map(t => t.id), 0) + 1 + newTags.length,
            blaneId,
            blaneName: mockBlanes.find(b => b.id === blaneId)?.name || "",
            tagName,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }

        // Show errors if any
        if (errors.length > 0) {
          setFileError(`Upload failed:\n${errors.join('\n')}`);
          return;
        }

        // Add valid tags
        setTags([...tags, ...newTags]);
        e.target.value = ''; // Reset file input
      };

      reader.readAsText(file);
    } catch (error) {
      setFileError("Error processing file. Please try again.");
    }
  };

  const filteredTags = tags.filter(
    tag =>
      tag.tagName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tag.blaneName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tag.id.toString().includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Tags Management</h2>
          <div className="flex gap-2">
            <div className="space-y-2">
              <Input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
                className="max-w-xs"
              />
              {fileError && (
                <div className="flex items-center gap-2 text-red-500 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <pre className="whitespace-pre-wrap">{fileError}</pre>
                </div>
              )}
            </div>
            <Button
              variant="outline"
              onClick={() => {
                // Create and download template
                const template = "blaneId,tagName\n1,Example Tag";
                const blob = new Blob([template], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'tags_template.csv';
                a.click();
                window.URL.revokeObjectURL(url);
              }}
            >
              Download Template
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Add Tag
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {selectedTag ? "Edit Tag" : "Add New Tag"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label>Blane</label>
                    <Select
                      value={selectedBlaneId}
                      onValueChange={setSelectedBlaneId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a blane" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockBlanes.map(blane => (
                          <SelectItem
                            key={blane.id}
                            value={blane.id.toString()}
                          >
                            {blane.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.blaneId && (
                      <p className="text-sm text-red-500">{errors.blaneId}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label>Tag Name</label>
                    <Input
                      value={tagName}
                      onChange={(e) => setTagName(e.target.value)}
                      placeholder="Enter tag name"
                    />
                    {errors.tagName && (
                      <p className="text-sm text-red-500">{errors.tagName}</p>
                    )}
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsAddDialogOpen(false);
                        resetForm();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">Save</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Input
              placeholder="Search tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            {selectedTags.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    Delete Selected ({selectedTags.length})
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Tags</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete {selectedTags.length} selected tags?
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleBulkDelete}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={selectedTags.length === filteredTags.length}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedTags(filteredTags.map(tag => tag.id));
                        } else {
                          setSelectedTags([]);
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Blane</TableHead>
                  <TableHead>Tag Name</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Updated At</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTags.map((tag) => (
                  <TableRow key={tag.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedTags.includes(tag.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedTags([...selectedTags, tag.id]);
                          } else {
                            setSelectedTags(selectedTags.filter(id => id !== tag.id));
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>{tag.id}</TableCell>
                    <TableCell>{tag.blaneName}</TableCell>
                    <TableCell>{tag.tagName}</TableCell>
                    <TableCell>{tag.createdAt}</TableCell>
                    <TableCell>{tag.updatedAt}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEdit(tag)}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="icon">
                              <TrashIcon className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Tag</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this tag?
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(tag.id)}
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
        </div>
      </Card>
    </div>
  );
};

export default Tags;
