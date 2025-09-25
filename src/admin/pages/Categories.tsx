import { useState } from 'react';
import { Card } from "@/admin/components/ui/card";
import { Button } from "@/admin/components/ui/button";
import { Input } from "@/admin/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/admin/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/admin/components/ui/select";
import { Textarea } from "@/admin/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/admin/components/ui/dialog";
import { format } from 'date-fns';
import { PencilIcon, TrashIcon, PlusIcon, EyeIcon } from "lucide-react";
import { Switch } from "@/admin/components/ui/switch";

interface Category {
  id: string;
  name: string;
  parentId: string | null;
  icon: string;
  description: string;
  status: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const Categories = () => {
  const [categories, setCategories] = useState<Category[]>([
    {
      id: "1",
      name: "Electronics",
      parentId: null,
      icon: "https://via.placeholder.com/32",
      description: "Electronic devices and accessories",
      status: true,
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01")
    },
    {
      id: "2",
      name: "Smartphones",
      parentId: "1",
      icon: "https://via.placeholder.com/32",
      description: "Mobile phones and accessories",
      status: true,
      createdAt: new Date("2024-01-02"),
      updatedAt: new Date("2024-01-02")
    },
    {
      id: "3",
      name: "Laptops",
      parentId: "1",
      icon: "https://via.placeholder.com/32",
      description: "Portable computers",
      status: true,
      createdAt: new Date("2024-01-03"),
      updatedAt: new Date("2024-01-03")
    },
    {
      id: "4",
      name: "Clothing",
      parentId: null,
      icon: "https://via.placeholder.com/32",
      description: "Apparel and fashion items",
      status: true,
      createdAt: new Date("2024-01-04"),
      updatedAt: new Date("2024-01-04")
    }
  ]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    setIsDialogOpen(true);
  };

  const handleDelete = (categoryId: string) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      setCategories(categories.filter(cat => cat.id !== categoryId));
    }
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStatusChange = (categoryId: string) => {
    setCategories(categories.map(cat => 
      cat.id === categoryId ? { ...cat, status: !cat.status } : cat
    ));
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Categories Management</h2>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusIcon className="mr-2 h-4 w-4" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {selectedCategory ? 'Edit Category' : 'Add New Category'}
                </DialogTitle>
              </DialogHeader>
              <form className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <Input required />
                </div>
                <div>
                  <label className="text-sm font-medium">Parent Category</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select parent category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None (Top Level)</SelectItem>
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Icon</label>
                  <Input type="file" accept=".png,.jpg,.jpeg,.svg" />
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Save</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mb-4">
          <Input
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead style={{ width: 50 }}>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Parent Category</TableHead>
                <TableHead>Icon</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Updated At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCategories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>{category.id}</TableCell>
                  <TableCell>{category.name}</TableCell>
                  <TableCell>
                    {categories.find(cat => cat.id === category.parentId)?.name || '-'}
                  </TableCell>
                  <TableCell>
                    <img
                      src={category.icon}
                      alt={`${category.name} icon`}
                      className="w-8 h-8 object-contain"
                    />
                  </TableCell>
                  <TableCell>{category.description}</TableCell>
                  <TableCell>
                    <Switch
                      checked={category.status}
                      onCheckedChange={() => handleStatusChange(category.id)}
                    />
                  </TableCell>
                  <TableCell>{format(category.createdAt, 'PP')}</TableCell>
                  <TableCell>{format(category.updatedAt, 'PP')}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEdit(category)}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="icon">
                            <EyeIcon className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Category Details</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <p className="font-semibold">ID</p>
                              <p>{category.id}</p>
                            </div>
                            <div>
                              <p className="font-semibold">Name</p>
                              <p>{category.name}</p>
                            </div>
                            <div>
                              <p className="font-semibold">Parent Category</p>
                              <p>{categories.find(cat => cat.id === category.parentId)?.name || '-'}</p>
                            </div>
                            <div>
                              <p className="font-semibold">Description</p>
                              <p>{category.description}</p>
                            </div>
                            <div>
                              <p className="font-semibold">Status</p>
                              <p>{category.status ? 'Active' : 'Inactive'}</p>
                            </div>
                            <div>
                              <p className="font-semibold">Created At</p>
                              <p>{format(category.createdAt, 'PPpp')}</p>
                            </div>
                            <div>
                              <p className="font-semibold">Updated At</p>
                              <p>{format(category.updatedAt, 'PPpp')}</p>
                            </div>
                            <div>
                              <p className="font-semibold">Icon</p>
                              <img src={category.icon} alt={`${category.name} icon`} className="w-16 h-16 object-contain mt-1" />
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleDelete(category.id)}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};

export default Categories;
