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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/admin/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/admin/components/ui/select";
import { PencilIcon, TrashIcon, PlusIcon, StarIcon, ImageIcon } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

interface BlaneImage {
  id: number;
  blaneId: number;
  blaneName: string;
  imageUrl: string;
  isPrimary: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
}

interface Blane {
  id: number;
  name: string;
  images: BlaneImage[];
}

// Mock data
const mockBlanes: Blane[] = [
  {
    id: 1,
    name: "Blane 1",
    images: [
      {
        id: 1,
        blaneId: 1,
        blaneName: "Blane 1",
        imageUrl: "https://via.placeholder.com/300",
        isPrimary: true,
        position: 1,
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      },
      {
        id: 2,
        blaneId: 1,
        blaneName: "Blane 1",
        imageUrl: "https://via.placeholder.com/300",
        isPrimary: false,
        position: 2,
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      },
    ],
  },
  {
    id: 2,
    name: "Blane 2",
    images: [
      {
        id: 3,
        blaneId: 2,
        blaneName: "Blane 2",
        imageUrl: "https://via.placeholder.com/300",
        isPrimary: true,
        position: 1,
        createdAt: "2024-01-02",
        updatedAt: "2024-01-02",
      },
    ],
  },
];

const Images = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<BlaneImage | null>(null);
  const [blanes, setBlanes] = useState(mockBlanes);
  const [activeTab, setActiveTab] = useState("gallery");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert("File size must be less than 2MB");
        return;
      }
      // Validate file type
      if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
        alert("Only JPEG, JPG, and PNG files are allowed");
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSetPrimary = (blaneId: number, imageId: number) => {
    setBlanes(blanes.map(blane => {
      if (blane.id === blaneId) {
        return {
          ...blane,
          images: blane.images.map(img => ({
            ...img,
            isPrimary: img.id === imageId
          }))
        };
      }
      return blane;
    }));
  };

  const handleDelete = (blaneId: number, imageId: number) => {
    setBlanes(blanes.map(blane => {
      if (blane.id === blaneId) {
        return {
          ...blane,
          images: blane.images.filter(img => img.id !== imageId)
        };
      }
      return blane;
    }));
  };

  const handleDragEnd = (result: any, blaneId: number) => {
    if (!result.destination) return;

    const blane = blanes.find(b => b.id === blaneId);
    if (!blane) return;

    const items = Array.from(blane.images);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update positions
    const updatedItems = items.map((item, index) => ({
      ...item,
      position: index + 1
    }));

    setBlanes(blanes.map(b => 
      b.id === blaneId ? { ...b, images: updatedItems } : b
    ));
  };

  const handleEdit = (image: BlaneImage) => {
    setSelectedImage(image);
    setIsEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (!selectedImage) return;
    
    setBlanes(blanes.map(blane => {
      if (blane.id === selectedImage.blaneId) {
        return {
          ...blane,
          images: blane.images.map(img => 
            img.id === selectedImage.id ? selectedImage : img
          )
        };
      }
      return blane;
    }));
    
    setIsEditDialogOpen(false);
    setSelectedImage(null);
    setPreviewUrl(null);
  };

  const filteredBlanes = blanes.filter(blane =>
    blane.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Images Management</h2>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusIcon className="mr-2 h-4 w-4" />
                Add Image
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Image</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label>Blane</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a blane" />
                    </SelectTrigger>
                    <SelectContent>
                      {blanes.map(blane => (
                        <SelectItem 
                          key={blane.id} 
                          value={blane.id.toString()}
                          disabled={blane.images.length >= 3}
                        >
                          {blane.name} ({blane.images.length}/3 images)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label>Image</label>
                  <Input
                    type="file"
                    accept=".jpg,.jpeg,.png"
                    onChange={handleFileSelect}
                  />
                  {previewUrl && (
                    <div className="mt-2">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="max-w-[200px] rounded"
                      />
                    </div>
                  )}
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsAddDialogOpen(false);
                      setPreviewUrl(null);
                      setSelectedFile(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button>Upload</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mb-4 space-y-4">
          <Input
            placeholder="Search blanes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="gallery">Gallery View</TabsTrigger>
              <TabsTrigger value="table">Table View</TabsTrigger>
            </TabsList>
            <TabsContent value="gallery" className="space-y-6">
              {filteredBlanes.map(blane => (
                <Card key={blane.id} className="p-4">
                  <h3 className="text-lg font-semibold mb-4">{blane.name}</h3>
                  <DragDropContext onDragEnd={(result) => handleDragEnd(result, blane.id)}>
                    <Droppable droppableId={`blane-${blane.id}`} direction="horizontal">
                      {(provided) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className="grid grid-cols-1 md:grid-cols-3 gap-4 min-h-[200px]"
                          style={{ overflow: 'hidden' }}
                        >
                          {blane.images.map((image, index) => (
                            <Draggable
                              key={image.id}
                              draggableId={image.id.toString()}
                              index={index}
                            >
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className="relative group"
                                >
                                  <img
                                    src={image.imageUrl}
                                    alt={`${blane.name} image ${index + 1}`}
                                    className="w-full h-48 object-cover rounded"
                                  />
                                  <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="bg-white"
                                      onClick={() => handleSetPrimary(blane.id, image.id)}
                                    >
                                      <StarIcon className={`h-4 w-4 ${image.isPrimary ? 'text-yellow-400' : ''}`} />
                                    </Button>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button
                                          variant="destructive"
                                          size="icon"
                                          className="bg-red-500 hover:bg-red-600 text-white"
                                        >
                                          <TrashIcon className="h-4 w-4" />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Delete Image</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Are you sure you want to delete this image?
                                            This action cannot be undone.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() => handleDelete(blane.id, image.id)}
                                          >
                                            Delete
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </div>
                                  {image.isPrimary && (
                                    <div className="absolute top-2 right-2 bg-yellow-400 text-white px-2 py-1 rounded text-xs">
                                      Primary
                                    </div>
                                  )}
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                          {blane.images.length < 3 && (
                            <Button
                              variant="outline"
                              className="h-48 w-full flex flex-col items-center justify-center"
                              onClick={() => setIsAddDialogOpen(true)}
                            >
                              <PlusIcon className="h-8 w-8 mb-2" />
                              Add Image
                            </Button>
                          )}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                </Card>
              ))}
            </TabsContent>
            <TabsContent value="table">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead style={{ width: 50 }}>ID</TableHead>
                      <TableHead>Preview</TableHead>
                      <TableHead>Blane</TableHead>
                      <TableHead>Primary</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead>Updated At</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBlanes.flatMap(blane => 
                      blane.images.map(image => (
                        <TableRow key={image.id}>
                          <TableCell>{image.id}</TableCell>
                          <TableCell>
                            <img
                              src={image.imageUrl}
                              alt={`${blane.name} image`}
                              className="w-16 h-16 object-cover rounded"
                            />
                          </TableCell>
                          <TableCell>{blane.name}</TableCell>
                          <TableCell>
                            {image.isPrimary ? (
                              <StarIcon className="h-4 w-4 text-yellow-400" />
                            ) : (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleSetPrimary(blane.id, image.id)}
                              >
                                <StarIcon className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                          <TableCell>{image.position}</TableCell>
                          <TableCell>{image.createdAt}</TableCell>
                          <TableCell>{image.updatedAt}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleEdit(image)}
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
                                    <AlertDialogTitle>Delete Image</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete this image?
                                      This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(blane.id, image.id)}
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Image</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label>Current Image</label>
              <img
                src={selectedImage?.imageUrl || previewUrl || ''}
                alt="Current"
                className="w-full max-w-[200px] rounded"
              />
            </div>
            <div className="space-y-2">
              <label>Replace Image</label>
              <Input
                type="file"
                accept=".jpg,.jpeg,.png"
                onChange={handleFileSelect}
              />
              {previewUrl && (
                <div className="mt-2">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-w-[200px] rounded"
                  />
                </div>
              )}
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setSelectedImage(null);
                  setPreviewUrl(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdate}>Save Changes</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Images;
