import { useState, useEffect, useCallback } from 'react';
import { Card } from "@/admin/components/ui/card";
import { Button } from "@/admin/components/ui/button";
import { Input } from "@/admin/components/ui/input";
import { Label } from "@/admin/components/ui/label";
import { Switch } from "@/admin/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/admin/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/admin/components/ui/dialog";
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
import { Plus, Edit, Trash2, Percent, Calendar, Copy, CheckCircle2 } from "lucide-react";
import { promoCodeApi, PromoCodeApiItem } from '@/admin/lib/api/services/promoCodeService';
import toast from 'react-hot-toast';

interface PromoCode {
  id: string;
  code: string;
  discountPercentage: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  usageCount: number;
  maxUsage?: number;
  applicablePlans: string[];
}

const PromoCodeManagement = () => {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(false);

  const [promoDialog, setPromoDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null);
  const [promoToDelete, setPromoToDelete] = useState<PromoCode | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  const [promoForm, setPromoForm] = useState<Partial<PromoCode>>({
    code: '',
    discountPercentage: 0,
    startDate: '',
    endDate: '',
    isActive: true,
    usageCount: 0,
    maxUsage: undefined,
    applicablePlans: ['all']
  });

  // Handlers
  const handleOpenPromoDialog = (promo?: PromoCode) => {
    if (promo) {
      setEditingPromo(promo);
      // Ensure date inputs get YYYY-MM-DD format
      setPromoForm({
        ...promo,
        startDate: promo.startDate ? String(promo.startDate).slice(0, 10) : '',
        endDate: promo.endDate ? String(promo.endDate).slice(0, 10) : '',
      });
    } else {
      setEditingPromo(null);
      setPromoForm({
        code: '',
        discountPercentage: 0,
        startDate: '',
        endDate: '',
        isActive: true,
        usageCount: 0,
        maxUsage: undefined,
        applicablePlans: ['all']
      });
    }
    setPromoDialog(true);
  };

  // Load promo codes from API
  const loadPromoCodes = async () => {
    try {
      setLoading(true);
      const data = await promoCodeApi.getAll();
      // Expect data to be an array or object containing data; try to normalize
      const items: PromoCodeApiItem[] = Array.isArray(data) ? data : data.data || [];
      const mapped = items.map((it) => {
        const normalize = (d: any) => {
          if (!d) return '';
          const s = String(d);
          // If it contains a T or space/time, take first 10 chars (YYYY-MM-DD)
          if (s.includes('T')) return s.slice(0, 10);
          if (s.includes(' ')) return s.split(' ')[0];
          return s.slice(0, 10);
        };
        return {
          id: String(it.id),
          code: it.code,
          discountPercentage: Number(it.discount_percentage),
          startDate: normalize(it.valid_from),
          endDate: normalize(it.valid_until),
          isActive: Boolean(it.is_active),
          usageCount: 0,
          maxUsage: undefined,
          applicablePlans: ['all'],
        } as PromoCode;
      });
      setPromoCodes(mapped);
    } catch (err) {
      console.error('Failed to load promo codes', err);
      toast.error('Failed to load promo codes');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePromo = () => {
    if (!promoForm.code || !promoForm.discountPercentage || !promoForm.startDate || !promoForm.endDate) {
      toast.error('Please fill all required fields');
      return;
    }

    if (promoForm.discountPercentage! < 1 || promoForm.discountPercentage! > 100) {
      toast.error('Discount percentage must be between 1 and 100');
      return;
    }

    const startDate = new Date(promoForm.startDate!);
    const endDate = new Date(promoForm.endDate!);
    
    if (endDate <= startDate) {
      toast.error('End date must be after start date');
      return;
    }

    if (editingPromo) {
      // Update via API
      (async () => {
        try {
          await promoCodeApi.update(editingPromo.id, {
            code: promoForm.code!,
            discount_percentage: promoForm.discountPercentage!,
            valid_from: promoForm.startDate!,
            valid_until: promoForm.endDate!,
            is_active: !!promoForm.isActive,
          } as any);
          toast.success('Promo code updated successfully');
          await loadPromoCodes();
        } catch (err) {
          console.error(err);
          toast.error('Failed to update promo code');
        }
      })();
    } else {
      // Check if code already exists
      if (promoCodes.some(p => p.code.toLowerCase() === promoForm.code!.toLowerCase())) {
        toast.error('This promo code already exists');
        return;
      }

      // Create via API
      (async () => {
        try {
          await promoCodeApi.create({
            code: promoForm.code!.toUpperCase(),
            discount_percentage: promoForm.discountPercentage!,
            valid_from: promoForm.startDate!,
            valid_until: promoForm.endDate!,
            is_active: !!promoForm.isActive,
          } as any);
          toast.success('Promo code created successfully');
          await loadPromoCodes();
        } catch (err) {
          console.error(err);
          toast.error('Failed to create promo code');
        }
      })();
    }
    setPromoDialog(false);
  };

  const handleDeleteClick = (promo: PromoCode) => {
    setPromoToDelete(promo);
    setDeleteDialog(true);
  };

  const handleDeleteConfirm = () => {
    if (promoToDelete) {
      (async () => {
        try {
          await promoCodeApi.delete(promoToDelete.id);
          toast.success('Promo code deleted successfully');
          await loadPromoCodes();
        } catch (err) {
          console.error(err);
          toast.error('Failed to delete promo code');
        } finally {
          setDeleteDialog(false);
          setPromoToDelete(null);
        }
      })();
    }
  };

  const handleToggleStatus = (id: string) => {
    const promo = promoCodes.find(p => p.id === id);
    if (!promo) return;

    (async () => {
      try {
        await promoCodeApi.update(id, {
          code: promo.code,
          discount_percentage: promo.discountPercentage,
          valid_from: promo.startDate,
          valid_until: promo.endDate,
          is_active: !promo.isActive,
        } as any);
        toast.success(`Promo code ${promo.isActive ? 'deactivated' : 'activated'}`);
        await loadPromoCodes();
      } catch (err) {
        console.error(err);
        toast.error('Failed to update promo code status');
      }
    })();
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Promo code copied to clipboard');
  };

  // Filter promoCodes
  const filteredPromoCodes = promoCodes.filter(promo => {
    const matchesSearch = promo.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && promo.isActive) ||
      (filterStatus === 'inactive' && !promo.isActive);
    return matchesSearch && matchesStatus;
  });

  // Load on mount
  useEffect(() => {
    loadPromoCodes();
  }, []);

  // Check if promo is expired
  const isExpired = (endDate: string) => {
    return new Date(endDate) < new Date();
  };

  // Get status badge
  const getStatusBadge = (promo: PromoCode) => {
    if (!promo.isActive) {
      return <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">Inactive</span>;
    }
    if (isExpired(promo.endDate)) {
      return <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-700">Expired</span>;
    }
    if (promo.maxUsage && promo.usageCount >= promo.maxUsage) {
      return <span className="px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-700">Limit Reached</span>;
    }
    return <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">Active</span>;
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-4 lg:p-6">
      <Card className="overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-6 lg:p-8 bg-gradient-to-r from-[#00897B] to-[#00796B]">
          <div className="flex flex-col gap-4">
            <div className="text-white">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold">Promo Code Management</h2>
              <p className="text-white/80 text-sm sm:text-base mt-1">
                Create and manage discount codes for vendors
              </p>
            </div>
            <div className="flex justify-start">
              <Button 
                onClick={() => handleOpenPromoDialog()} 
                className="bg-white text-[#00897B] hover:bg-white/90 w-full sm:w-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Promo Code
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search promo codes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select 
              value={filterStatus} 
              onValueChange={(value: 'all' | 'active' | 'inactive') => setFilterStatus(value)}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="inactive">Inactive Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Valid Period</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPromoCodes.map((promo) => (
                  <TableRow key={promo.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="px-2 py-1 bg-gray-100 rounded font-mono text-sm">
                          {promo.code}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyCode(promo.code)}
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Percent className="h-4 w-4 text-[#00897B]" />
                        {promo.discountPercentage}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{new Date(promo.startDate).toLocaleDateString()}</div>
                        <div className="text-gray-500">to {new Date(promo.endDate).toLocaleDateString()}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {promo.usageCount} / {promo.maxUsage || '∞'}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(promo)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleStatus(promo.id)}
                        >
                          {promo.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenPromoDialog(promo)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteClick(promo)}
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

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {filteredPromoCodes.map((promo) => (
              <Card key={promo.id} className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <code className="px-2 py-1 bg-gray-100 rounded font-mono text-sm">
                        {promo.code}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyCode(promo.code)}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    {getStatusBadge(promo)}
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Percent className="h-4 w-4 text-[#00897B]" />
                      <span className="font-medium">{promo.discountPercentage} Discount %</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">
                        {new Date(promo.startDate).toLocaleDateString()} - {new Date(promo.endDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-gray-600">
                      <span className="font-medium">Usage:</span> {promo.usageCount} / {promo.maxUsage || '∞'}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleToggleStatus(promo.id)}
                    >
                      {promo.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenPromoDialog(promo)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteClick(promo)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {filteredPromoCodes.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Percent className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No promo codes found</p>
            </div>
          )}
        </div>
      </Card>

      {/* Promo Code Dialog */}
      <Dialog open={promoDialog} onOpenChange={setPromoDialog}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPromo ? 'Edit Promo Code' : 'Create Promo Code'}</DialogTitle>
            <DialogDescription>
              {editingPromo ? 'Update the details of this promo code' : 'Create a new discount code for vendors'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Promo Code *</Label>
              <Input
                value={promoForm.code}
                onChange={(e) => setPromoForm({...promoForm, code: e.target.value.toUpperCase()})}
                placeholder="WELCOME20"
                className="mt-2 font-mono"
                maxLength={20}
              />
              <p className="text-xs text-gray-500 mt-1">Use uppercase letters and numbers only</p>
            </div>

            <div>
              <Label>Discount Percentage (%) *</Label>
              <div className="relative mt-2">
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={promoForm.discountPercentage}
                  onChange={(e) => setPromoForm({...promoForm, discountPercentage: parseInt(e.target.value)})}
                  placeholder="20"
                />
                <Percent className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date *</Label>
                <Input
                  type="date"
                  value={promoForm.startDate}
                  onChange={(e) => setPromoForm({...promoForm, startDate: e.target.value})}
                  className="mt-2"
                />
              </div>
              <div>
                <Label>End Date *</Label>
                <Input
                  type="date"
                  value={promoForm.endDate}
                  onChange={(e) => setPromoForm({...promoForm, endDate: e.target.value})}
                  className="mt-2"
                />
              </div>
            </div>

            <div>
              <Label>Max Usage Limit (Optional)</Label>
              <Input
                type="number"
                min="1"
                value={promoForm.maxUsage || ''}
                onChange={(e) => setPromoForm({...promoForm, maxUsage: e.target.value ? parseInt(e.target.value) : undefined})}
                placeholder="Leave empty for unlimited"
                className="mt-2"
              />
              <p className="text-xs text-gray-500 mt-1">Leave empty for unlimited usage</p>
            </div>

            <div>
              <Label>Applicable Plans</Label>
              <Select
                value={promoForm.applicablePlans?.[0] || 'all'}
                onValueChange={(value) => setPromoForm({...promoForm, applicablePlans: [value]})}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  <SelectItem value="basic">Basic Plan Only</SelectItem>
                  <SelectItem value="premium">Premium Plan Only</SelectItem>
                  <SelectItem value="enterprise">Enterprise Plan Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <Switch
                checked={promoForm.isActive}
                onCheckedChange={(checked) => setPromoForm({...promoForm, isActive: checked})}
              />
              <Label>Active (users can use this code)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPromoDialog(false)}>Cancel</Button>
            <Button onClick={handleSavePromo} className="bg-[#00897B] hover:bg-[#00796B]">
              {editingPromo ? 'Update' : 'Create'} Promo Code
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Promo Code?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the promo code <code className="font-mono font-bold">{promoToDelete?.code}</code>? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel onClick={() => setPromoToDelete(null)} className="w-full sm:w-auto">
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

export default PromoCodeManagement;