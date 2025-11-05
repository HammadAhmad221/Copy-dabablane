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

// Hook to detect mobile/tablet screen
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 900); // Changed from 768 to 900 (md breakpoint)
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  return isMobile;
};

const CommissionManagement = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
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
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6 w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#00897B] break-words">Commission Management</h1>
            <p className="text-gray-500 mt-1 text-sm sm:text-base">Manage commission rates for categories and vendors</p>
          </div>
          <Button 
            onClick={() => navigate('/admin/commission/create')} 
            className="bg-[#00897B] w-full sm:w-auto whitespace-nowrap flex-shrink-0"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Commission
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-3 sm:p-4 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="space-y-2">
            <Label className="text-sm">Category ID</Label>
            <Input
              placeholder="Filter by category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-10 w-full"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Vendor ID</Label>
            <Input
              placeholder="Filter by vendor"
              value={vendorFilter}
              onChange={(e) => setVendorFilter(e.target.value)}
              className="h-10 w-full"
            />
          </div>
        </div>
      </Card>

      {/* Data Display */}
      {isLoading ? (
        <Card>
          <div className="text-center p-8 sm:p-12">
            <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin mx-auto mb-4 text-[#00897B]" />
            <p className="text-gray-500 text-sm sm:text-base">Loading commissions...</p>
          </div>
        </Card>
      ) : commissions.length > 0 ? (
        isMobile ? (
          /* Mobile/Tablet Card View */
          <div className="space-y-3 w-full">
            {commissions.map((commission) => (
              <Card key={commission.id} className="p-4 border-l-4 border-l-[#00897B] w-full">
                <div className="space-y-3">
                  {/* Header Row */}
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <span className="text-xs text-gray-500 font-mono">#{commission.id}</span>
                      <Badge 
                        className={`ml-2 ${commission.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                      >
                        {commission.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => navigate(`/admin/commission/edit/${commission.id}`)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleDelete(commission.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>

                  {/* Category & Vendor */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="min-w-0">
                      <Label className="text-xs text-gray-500">Category</Label>
                      <p className="text-sm font-medium mt-0.5 truncate">
                        {commission.category_name || commission.category_id || '-'}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <Label className="text-xs text-gray-500">Vendor</Label>
                      <p className="text-sm font-medium mt-0.5 truncate">
                        {commission.vendor_name || commission.vendor_id || '-'}
                      </p>
                    </div>
                  </div>

                  {/* Rates */}
                  <div className="flex items-center justify-between pt-2 border-t gap-4">
                    <div className="flex-1">
                      <Label className="text-xs text-gray-500">Commission Rate</Label>
                      <p className="text-lg font-bold text-[#00897B] mt-0.5">
                        {commission.commission_rate}%
                      </p>
                    </div>
                    <div className="text-right flex-1">
                      <Label className="text-xs text-gray-500">Partial Rate</Label>
                      <p className="text-base font-semibold text-gray-700 mt-0.5">
                        {commission.partial_commission_rate}%
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          /* Desktop Table View */
          <Card className="w-full overflow-hidden">
            <div className="overflow-x-auto w-full">
              <Table className="w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap min-w-[60px]">ID</TableHead>
                    <TableHead className="whitespace-nowrap min-w-[100px]">Category</TableHead>
                    <TableHead className="whitespace-nowrap min-w-[100px]">Vendor</TableHead>
                    <TableHead className="text-right whitespace-nowrap min-w-[120px]">Commission Rate</TableHead>
                    <TableHead className="text-right whitespace-nowrap min-w-[100px]">Partial Rate</TableHead>
                    <TableHead className="whitespace-nowrap min-w-[80px]">Status</TableHead>
                    <TableHead className="whitespace-nowrap min-w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commissions.map((commission) => (
                    <TableRow key={commission.id}>
                      <TableCell className="font-mono whitespace-nowrap">#{commission.id}</TableCell>
                      <TableCell className="whitespace-nowrap">{commission.category_name || commission.category_id || '-'}</TableCell>
                      <TableCell className="whitespace-nowrap">{commission.vendor_name || commission.vendor_id || '-'}</TableCell>
                      <TableCell className="text-right font-semibold whitespace-nowrap">
                        {commission.commission_rate}%
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        {commission.partial_commission_rate}%
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge className={commission.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {commission.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex gap-2">
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
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        )
      ) : (
        <Card>
          <div className="text-center p-8 sm:p-12">
            <p className="text-gray-500 text-sm sm:text-base">No commissions found</p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default CommissionManagement;

