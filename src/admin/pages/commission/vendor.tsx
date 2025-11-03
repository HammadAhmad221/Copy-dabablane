import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card } from "@/admin/components/ui/card";
import { Button } from "@/admin/components/ui/button";
import { Input } from "@/admin/components/ui/input";
import { Label } from "@/admin/components/ui/label";
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
  DialogDescription,
  DialogFooter,
} from "@/admin/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/admin/components/ui/select";
import { ArrowLeft, Loader2, Plus, Pencil, Eye, Trash } from "lucide-react";
import { CommissionRate, CommissionFormData } from '@/admin/lib/api/types/commission';
import { toast } from 'react-hot-toast';
import { Badge } from "@/admin/components/ui/badge";
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

const CommissionVendor = () => {
  const navigate = useNavigate();
  const { vendorId } = useParams<{ vendorId: string }>();
  const [isLoading, setIsLoading] = useState(false);
  
  // Mock data
  const vendor = {
    id: Number(vendorId) || 1,
    name: 'Vendor 1',
    company_name: 'Company A',
  };

  const categories = [
    { id: 1, name: 'Food & Beverage' },
    { id: 2, name: 'Retail' },
    { id: 3, name: 'Services' },
    { id: 4, name: 'Electronics' },
    { id: 5, name: 'Fashion' },
  ];

  // Mock commissions data
  const mockCommissions: CommissionRate[] = [
    {
      id: 1,
      category_id: 1,
      vendor_id: Number(vendorId) || 1,
      rate: 12.0,
      status: 'active',
      is_default: false,
      created_at: '2024-01-16T14:20:00Z',
      updated_at: '2024-01-16T14:20:00Z',
      category: { id: 1, name: 'Food & Beverage' },
    },
    {
      id: 2,
      category_id: 2,
      vendor_id: Number(vendorId) || 1,
      rate: 15.0,
      status: 'active',
      is_default: false,
      created_at: '2024-01-17T09:15:00Z',
      updated_at: '2024-01-17T09:15:00Z',
      category: { id: 2, name: 'Retail' },
    },
  ];

  const [commissions, setCommissions] = useState<CommissionRate[]>(mockCommissions);
  
  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCommission, setSelectedCommission] = useState<CommissionRate | null>(null);

  const [formData, setFormData] = useState<CommissionFormData>({
    category_id: 0,
    vendor_id: vendorId ? Number(vendorId) : null,
    rate: 0,
    status: 'active',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleCreate = async () => {
    setErrors({});

    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.category_id || formData.category_id === 0) {
      newErrors.category_id = 'Category is required';
    }
    if (formData.rate < 0 || formData.rate > 100) {
      newErrors.rate = 'Rate must be between 0 and 100';
    }
    if (formData.rate === 0) {
      newErrors.rate = 'Rate is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      const newCommission: CommissionRate = {
        id: commissions.length + 1,
        category_id: formData.category_id,
        vendor_id: formData.vendor_id,
        rate: formData.rate,
        status: formData.status,
        is_default: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        category: categories.find(c => c.id === formData.category_id),
      };
      
      setCommissions(prev => [...prev, newCommission]);
      toast.success('Vendor commission created successfully');
      setIsCreateDialogOpen(false);
      setFormData({
        category_id: 0,
        vendor_id: vendorId ? Number(vendorId) : null,
        rate: 0,
        status: 'active',
      });
      setIsLoading(false);
    }, 500);
  };

  const handleUpdate = async () => {
    if (!selectedCommission) return;

    setErrors({});

    const newErrors: Record<string, string> = {};
    if (!formData.category_id || formData.category_id === 0) {
      newErrors.category_id = 'Category is required';
    }
    if (formData.rate === undefined || formData.rate < 0 || formData.rate > 100) {
      newErrors.rate = 'Rate must be between 0 and 100';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      setCommissions(prev =>
        prev.map(item =>
          item.id === selectedCommission.id
            ? {
                ...item,
                category_id: formData.category_id,
                rate: formData.rate,
                status: formData.status,
                updated_at: new Date().toISOString(),
                category: categories.find(c => c.id === formData.category_id),
              }
            : item
        )
      );
      toast.success('Vendor commission updated successfully');
      setIsEditDialogOpen(false);
      setSelectedCommission(null);
      setIsLoading(false);
    }, 500);
  };

  const handleDelete = async () => {
    if (!selectedCommission) return;

    setIsLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      setCommissions(prev => prev.filter(item => item.id !== selectedCommission.id));
      toast.success('Vendor commission deleted successfully');
      setIsDeleteDialogOpen(false);
      setSelectedCommission(null);
      setIsLoading(false);
    }, 500);
  };

  const handleEditClick = (commission: CommissionRate) => {
    setSelectedCommission(commission);
    setFormData({
      category_id: commission.category_id,
      vendor_id: commission.vendor_id || null,
      rate: commission.rate,
      status: commission.status,
    });
    setIsEditDialogOpen(true);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin/commission')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Vendor Commission Rates
            </h1>
            <p className="text-gray-500 mt-1">
              Manage commission rates for {vendor?.company_name || vendor?.name}
            </p>
          </div>
        </div>
        <Button 
          onClick={() => setIsCreateDialogOpen(true)}
          className="bg-[#00897B] hover:bg-[#00796B]"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Override
        </Button>
      </div>

      {/* Commissions Table */}
      <Card>
        {commissions.length === 0 ? (
          <div className="text-center p-12">
            <p className="text-gray-500">No custom commission rates for this vendor</p>
            <p className="text-sm text-gray-400 mt-2">Default category rates will apply</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commissions.map((commission) => (
                  <TableRow key={commission.id}>
                    <TableCell>{commission.category?.name || 'N/A'}</TableCell>
                    <TableCell>{commission.rate}%</TableCell>
                    <TableCell>
                      <Badge variant={commission.status === 'active' ? 'default' : 'secondary'}>
                        {commission.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(commission.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedCommission(commission);
                            setIsViewDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClick(commission)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedCommission(commission);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Vendor Commission Override</DialogTitle>
            <DialogDescription>
              Create a custom commission rate for this vendor
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="category_id">Category</Label>
              <Select
                value={formData.category_id ? String(formData.category_id) : undefined}
                onValueChange={(value) =>
                  setFormData({ ...formData, category_id: Number(value) })
                }
              >
                <SelectTrigger>
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
              {errors.category_id && (
                <p className="text-sm text-red-500">{errors.category_id}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="rate">Commission Rate (%)</Label>
              <Input
                id="rate"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formData.rate}
                onChange={(e) =>
                  setFormData({ ...formData, rate: Number(e.target.value) })
                }
                placeholder="e.g., 15 for 15%"
              />
              {errors.rate && (
                <p className="text-sm text-red-500">{errors.rate}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={isLoading}
              className="bg-[#00897B] hover:bg-[#00796B]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Vendor Commission</DialogTitle>
            <DialogDescription>
              Update commission rate for this vendor
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="category_id">Category</Label>
              <Select
                value={formData.category_id ? String(formData.category_id) : undefined}
                onValueChange={(value) =>
                  setFormData({ ...formData, category_id: Number(value) })
                }
              >
                <SelectTrigger>
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
              {errors.category_id && (
                <p className="text-sm text-red-500">{errors.category_id}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="rate">Commission Rate (%)</Label>
              <Input
                id="rate"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formData.rate}
                onChange={(e) =>
                  setFormData({ ...formData, rate: Number(e.target.value) })
                }
                placeholder="e.g., 15 for 15%"
              />
              {errors.rate && (
                <p className="text-sm text-red-500">{errors.rate}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={isLoading}
              className="bg-[#00897B] hover:bg-[#00796B]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Commission Details</DialogTitle>
            <DialogDescription>
              View commission rate information
            </DialogDescription>
          </DialogHeader>
          {selectedCommission && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <p className="text-sm font-medium">{selectedCommission.category?.name || 'N/A'}</p>
                </div>
                <div>
                  <Label>Rate</Label>
                  <p className="text-sm font-medium">{selectedCommission.rate}%</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge variant={selectedCommission.status === 'active' ? 'default' : 'secondary'}>
                    {selectedCommission.status}
                  </Badge>
                </div>
                <div>
                  <Label>Created</Label>
                  <p className="text-sm font-medium">
                    {new Date(selectedCommission.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Commission</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this commission rate? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CommissionVendor;

