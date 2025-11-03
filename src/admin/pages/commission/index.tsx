import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { Badge } from "@/admin/components/ui/badge";
import { Loader2, Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";
import commissionApi from "@/admin/lib/api/services/commissionService";
import type { Commission } from "@/admin/lib/api/types/commission";

const CommissionManagement = () => {
  const navigate = useNavigate();
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [vendorFilter, setVendorFilter] = useState<string>("");

  const fetchCommissions = async () => {
    setIsLoading(true);
    try {
      console.log('🚀 Fetching commissions...');
      const response = await commissionApi.getAll(
        categoryFilter ? Number(categoryFilter) : undefined,
        vendorFilter ? Number(vendorFilter) : undefined
      );
      console.log('✅ Commissions loaded:', response.data);
      console.log('✅ Commissions count:', response.data.length);
      console.log('✅ Meta total:', response.meta.total);
      setCommissions(response.data);
      if (response.data.length > 0) {
        toast.success(`Loaded ${response.data.length} commission(s)`);
      } else if (response.meta.total === 0) {
        toast.error('Backend database has NO commission records. Click "New Commission" to create one.', {
          duration: 6000,
        });
      } else {
        toast('No commissions match your filters. Try clearing filters.', { icon: 'ℹ️' });
      }
    } catch (error: any) {
      console.error('❌ Error:', error);
      toast.error('Failed to load commissions');
      setCommissions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCommissions();
  }, [categoryFilter, vendorFilter]);

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure?')) {
      try {
        await commissionApi.delete(id);
        toast.success('Commission deleted');
        await fetchCommissions();
      } catch (error) {
        toast.error('Failed to delete');
      }
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[#00897B]">Commission Management</h1>
          <p className="text-gray-500 mt-1">Manage commission rates for categories and vendors</p>
        </div>
        <Button onClick={() => navigate('/admin/commission/create')} className="bg-[#00897B]">
          <Plus className="h-4 w-4 mr-2" />
          New Commission
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Category ID</Label>
            <Input
              placeholder="Filter by category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Vendor ID</Label>
            <Input
              placeholder="Filter by vendor"
              value={vendorFilter}
              onChange={(e) => setVendorFilter(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card>
        {isLoading ? (
          <div className="text-center p-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Loading commissions...</p>
          </div>
        ) : commissions.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead className="text-right">Commission Rate</TableHead>
                  <TableHead className="text-right">Partial Rate</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commissions.map((commission) => (
                  <TableRow key={commission.id}>
                    <TableCell className="font-mono">#{commission.id}</TableCell>
                    <TableCell>{commission.category_name || commission.category_id || '-'}</TableCell>
                    <TableCell>{commission.vendor_name || commission.vendor_id || '-'}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {commission.commission_rate}%
                    </TableCell>
                    <TableCell className="text-right">
                      {commission.partial_commission_rate}%
                    </TableCell>
                    <TableCell>
                      <Badge className={commission.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {commission.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/admin/commission/edit/${commission.id}`)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(commission.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center p-12">
            <p className="text-gray-500">No commissions found</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default CommissionManagement;

