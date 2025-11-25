import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
import { vendorApi } from "@/admin/lib/api/services/vendorService";
import { categoryApi } from "@/admin/lib/api/services/categoryService";
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
  const location = useLocation();
  const isMobile = useIsMobile();
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [vendorFilter, setVendorFilter] = useState<string>("");
  const [vendorMap, setVendorMap] = useState<Record<number, string>>({});
  const [categoryMap, setCategoryMap] = useState<Record<number, string>>({});

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
      
      // Extract vendor IDs and category IDs from commissions
      const vendorIds = new Set<number>();
      const categoryIds = new Set<number>();
      response.data.forEach((commission: any) => {
        // Log commission structure for debugging
        console.log(`📋 Commission ${commission.id}:`, {
          vendor_id: commission.vendor_id,
          has_vendor_object: !!commission.vendor,
          category_id: commission.category_id,
          has_category_object: !!commission.category
        });
        
        // Check if commission has vendor_id
        if (commission.vendor_id !== null && commission.vendor_id !== undefined && commission.vendor_id !== '') {
          const vendorId = Number(commission.vendor_id);
          if (!isNaN(vendorId) && vendorId > 0) {
            vendorIds.add(vendorId);
            console.log(`📋 Found vendor_id ${vendorId} in commission ${commission.id}`);
          }
        }
        // Also check if commission has vendor data nested in it
        if (commission.vendor && commission.vendor.id) {
          const vendorId = Number(commission.vendor.id);
          if (!isNaN(vendorId) && vendorId > 0) {
            vendorIds.add(vendorId);
            console.log(`📋 Found nested vendor ${vendorId} in commission ${commission.id}`);
          }
        }
        // Check if commission has category_id
        if (commission.category_id !== null && commission.category_id !== undefined && commission.category_id !== '') {
          const categoryId = Number(commission.category_id);
          if (!isNaN(categoryId) && categoryId > 0) {
            categoryIds.add(categoryId);
          }
        }
        // Also check if commission has category data nested in it
        if (commission.category && commission.category.id) {
          const categoryId = Number(commission.category.id);
          if (!isNaN(categoryId) && categoryId > 0) {
            categoryIds.add(categoryId);
          }
        }
      });
      
      console.log(`📊 Extracted ${vendorIds.size} unique vendor IDs:`, Array.from(vendorIds).sort((a, b) => a - b));
      console.log(`📊 Extracted ${categoryIds.size} unique category IDs:`, Array.from(categoryIds).sort((a, b) => a - b));
      
      // Build vendor map from commission data first (if vendor objects are included)
      const vendorMapData: Record<number, string> = {};
      response.data.forEach((commission: any) => {
        if (commission.vendor && commission.vendor.id) {
          const vendor = commission.vendor;
          const vendorId = Number(vendor.id);
          const vendorName = vendor.company_name?.trim() || vendor.name?.trim() || '';
          if (vendorName && !isNaN(vendorId) && vendorId > 0) {
            vendorMapData[vendorId] = vendorName;
            console.log(`✅ Mapped vendor ${vendorId} -> "${vendorName}" from commission data (commission ${commission.id})`);
          }
        }
        // Also check if vendor_name is directly on the commission object
        if (commission.vendor_name && commission.vendor_id) {
          const vendorId = Number(commission.vendor_id);
          if (!isNaN(vendorId) && vendorId > 0) {
            vendorMapData[vendorId] = commission.vendor_name.trim();
            console.log(`✅ Mapped vendor ${vendorId} -> "${commission.vendor_name}" from commission.vendor_name (commission ${commission.id})`);
          }
        }
      });
      
      // Fetch vendors for any vendor IDs that don't have names yet
      if (vendorIds.size > 0) {
        const missingVendorIds = Array.from(vendorIds).filter(id => !vendorMapData[id]);
        if (missingVendorIds.length > 0) {
          console.log(`📤 Fetching vendor names for ${missingVendorIds.length} vendors (IDs: ${Array.from(missingVendorIds).join(', ')})`);
          try {
            // Fetch vendors with pagination to get all vendors
            let allVendors: any[] = [];
            let currentPage = 1;
            let hasMorePages = true;
            const pageSize = 1000;
            
            while (hasMorePages && currentPage <= 10) { // Limit to 10 pages to avoid infinite loops
              const vendorResponse = await vendorApi.getVendors(undefined, pageSize, currentPage);
              if (vendorResponse.data && vendorResponse.data.length > 0) {
                allVendors = [...allVendors, ...vendorResponse.data];
                // Check if there are more pages
                const totalPages = vendorResponse.meta?.last_page || 1;
                hasMorePages = currentPage < totalPages;
                currentPage++;
              } else {
                hasMorePages = false;
              }
            }
            
            console.log(`✅ Fetched ${allVendors.length} total vendors from API`);
            
            // Map all fetched vendors - ensure ID is converted to number for consistent lookup
            allVendors.forEach((vendor: any) => {
              const vendorId = Number(vendor.id);
              if (!isNaN(vendorId) && vendorId > 0 && vendorIds.has(vendorId)) {
                const vendorName = vendor.company_name?.trim() || vendor.name?.trim() || '';
                if (vendorName) {
                  vendorMapData[vendorId] = vendorName;
                  console.log(`✅ Mapped vendor ${vendorId} -> "${vendorName}" from vendor API`);
                } else {
                  console.warn(`⚠️ Vendor ${vendorId} has no name or company_name`);
                }
              }
            });
            
            // Check if we still have missing vendors
            const stillMissing = Array.from(vendorIds).filter(id => !vendorMapData[id]);
            if (stillMissing.length > 0) {
              console.warn(`⚠️ Could not find vendor names for IDs: ${stillMissing.join(', ')}`);
            }
          } catch (error) {
            console.error('❌ Error fetching vendors:', error);
          }
        }
      }
      
      if (Object.keys(vendorMapData).length > 0) {
        console.log('📊 Vendor map created with', Object.keys(vendorMapData).length, 'entries');
        setVendorMap(vendorMapData);
      } else {
        console.log('⚠️ No vendor names found in commission data or vendor API');
      }

      // Build category map from commission data first (if category objects are included)
      const categoryMapData: Record<number, string> = {};
      response.data.forEach((commission: any) => {
        if (commission.category && commission.category.id) {
          const category = commission.category;
          const categoryName = category.name?.trim() || '';
          if (categoryName) {
            categoryMapData[category.id] = categoryName;
            console.log(`✅ Mapped category ${category.id} -> "${categoryName}" from commission data`);
          }
        }
        // Also check if category_name is directly on the commission
        if (commission.category_name && commission.category_id) {
          categoryMapData[commission.category_id] = commission.category_name.trim();
          console.log(`✅ Mapped category ${commission.category_id} -> "${commission.category_name}" from commission data`);
        }
      });
      
      // Fetch categories for any category IDs that don't have names yet
      if (categoryIds.size > 0) {
        const missingCategoryIds = Array.from(categoryIds).filter(id => !categoryMapData[id]);
        if (missingCategoryIds.length > 0) {
          console.log(`📤 Fetching category names for ${missingCategoryIds.length} categories`);
          try {
            // Fetch all categories to build the map
            const categoryResponse = await categoryApi.getCategories({ paginationSize: 1000 });
            categoryResponse.data.forEach((category: any) => {
              if (categoryIds.has(category.id)) {
                const categoryName = category.name?.trim() || '';
                if (categoryName) {
                  categoryMapData[category.id] = categoryName;
                  console.log(`✅ Mapped category ${category.id} -> "${categoryName}" from category API`);
                }
              }
            });
          } catch (error) {
            console.error('❌ Error fetching categories:', error);
          }
        }
      }
      
      if (Object.keys(categoryMapData).length > 0) {
        console.log('📊 Category map created with', Object.keys(categoryMapData).length, 'entries');
        setCategoryMap(categoryMapData);
      } else {
        console.log('⚠️ No category names found in commission data or category API');
      }
      
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

  const isMountedRef = useRef<boolean>(false);
  const prevPathRef = useRef<string>(location.pathname);

  // Initial fetch and fetch when filters change
  useEffect(() => {
    fetchCommissions();
  }, [categoryFilter, vendorFilter]);

  // Refresh commissions when navigating back to this page (e.g., after creating/editing)
  useEffect(() => {
    const currentPath = location.pathname;
    const isOnCommissionPage = currentPath === '/admin/commission';
    const wasOnDifferentPage = prevPathRef.current !== '/admin/commission';
    
    // Refresh if we're navigating TO the commission page from a different route
    // Skip on initial mount (handled by the filter useEffect above)
    if (isMountedRef.current && isOnCommissionPage && wasOnDifferentPage) {
      console.log('🔄 Refreshing commissions after navigation from:', prevPathRef.current);
      
      // Clear filters to ensure we see all commissions including the newly created one
      setCategoryFilter('');
      setVendorFilter('');
      
      // Small delay to ensure navigation and state updates are complete
      const timer = setTimeout(() => {
        fetchCommissions();
      }, 300);
      return () => clearTimeout(timer);
    }
    
    // Mark as mounted after first render
    if (!isMountedRef.current) {
      isMountedRef.current = true;
    }
    
    // Update previous path for next comparison
    prevPathRef.current = currentPath;
  }, [location.pathname]);

  // Helper function to get vendor name
  const getVendorName = (vendorId?: number | null | string): string => {
    if (!vendorId || vendorId === null || vendorId === undefined || vendorId === '') return '-';
    
    // Convert to number for consistent lookup
    const vendorIdNum = Number(vendorId);
    if (isNaN(vendorIdNum) || vendorIdNum <= 0) return '-';
    
    // Try both number and string keys in case of type mismatch
    const vendorName = vendorMap[vendorIdNum] || vendorMap[String(vendorIdNum)];
    if (vendorName) {
      return vendorName;
    }
    
    // If not found in map, log for debugging
    const mapSize = Object.keys(vendorMap).length;
    const mapKeys = Object.keys(vendorMap).map(k => Number(k)).sort((a, b) => a - b);
    console.warn(`⚠️ Vendor ID ${vendorIdNum} (type: ${typeof vendorId}) not found in vendor map. Map has ${mapSize} entries: [${mapKeys.join(', ')}]`);
    
    return `Vendor #${vendorIdNum}`;
  };

  // Helper function to get category name
  const getCategoryName = (categoryId?: number): string => {
    if (!categoryId) return '-';
    
    const categoryName = categoryMap[categoryId];
    if (categoryName) {
      return categoryName;
    }
    
    // If not found in map, log for debugging
    const mapSize = Object.keys(categoryMap).length;
    if (mapSize > 0) {
      console.warn(`⚠️ Category ID ${categoryId} not found in category map (map has ${mapSize} entries)`);
    }
    
    return `Category #${categoryId}`;
  };

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
                        {getCategoryName(commission.category_id)}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <Label className="text-xs text-gray-500">Vendor</Label>
                      <p className="text-sm font-medium mt-0.5 truncate">
                        {getVendorName(commission.vendor_id)}
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
                      <TableCell className="whitespace-nowrap">{getCategoryName(commission.category_id)}</TableCell>
                      <TableCell className="whitespace-nowrap">{getVendorName(commission.vendor_id)}</TableCell>
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

