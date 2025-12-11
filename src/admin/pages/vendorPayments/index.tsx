import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/admin/components/ui/select";
import { Badge } from "@/admin/components/ui/badge";
import { Label } from "@/admin/components/ui/label";
import {
  Download,
  FileSpreadsheet,
  Eye,
  Calendar,
  Loader2,
  FileText,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "react-hot-toast";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/admin/components/ui/pagination";
import vendorPaymentApi from "@/admin/lib/api/services/vendorPaymentService";
import { vendorApi } from "@/admin/lib/api/services/vendorService";
import { categoryApi } from "@/admin/lib/api/services/categoryService";
import type { VendorPayment } from "@/admin/lib/api/types/vendorPayment";
import type { Vendor } from "@/admin/lib/api/types/vendor";

// Hook to detect mobile/tablet screen
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 900);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  return isMobile;
};

const VendorPaymentsIndex = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPaymentType, setSelectedPaymentType] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [payments, setPayments] = useState<VendorPayment[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoadingVendors, setIsLoadingVendors] = useState(false);
  const [vendorMap, setVendorMap] = useState<Record<number, string>>({});
  const [categoryMap, setCategoryMap] = useState<Record<number, string>>({});
  const [allVendorIdsWithPayments, setAllVendorIdsWithPayments] = useState<Set<number>>(new Set());

  const [pagination, setPagination] = useState({
    currentPage: 1,
    perPage: 10,
    total: 0,
    lastPage: 1,
  });

  // Fetch vendor payments from API
  const fetchPayments = async () => {
    console.log('🚀 fetchPayments called - API Integration Active!');
    console.log('🚀 Vendor map size:', Object.keys(vendorMap).length);
    console.log('🚀 Category map size:', Object.keys(categoryMap).length);
    
    setIsFetching(true);
    try {
      const filters: any = {
        paginationSize: pagination.perPage,
      };

      if (searchTerm) filters.search = searchTerm;
      if (selectedVendor && selectedVendor !== "all") {
        filters.vendor_id = Number(selectedVendor);
      }
      if (selectedCategory) filters.category_id = selectedCategory;
      if (selectedPaymentType) filters.payment_type = selectedPaymentType;
      if (selectedStatus) filters.transfer_status = selectedStatus;
      if (startDate) filters.start_date = startDate;
      if (endDate) filters.end_date = endDate;
      if (pagination.currentPage > 1) filters.page = pagination.currentPage;

      console.log('🚀 Calling API with filters:', filters);
      const response = await vendorPaymentApi.getPayments(filters);

      console.log('✅ API Response:', response);
      console.log('✅ Total records in database:', response.meta.total);
      
      // Log first payment to see structure
      if (response.data && response.data.length > 0) {
        console.log('📊 First payment raw data:', response.data[0]);
        console.log('📊 Payment amounts:', {
          total_amount: response.data[0].total_amount,
          commission_amount: response.data[0].commission_amount,
          commission_vat: response.data[0].commission_vat,
          net_amount: response.data[0].net_amount,
        });
      }

      // Map vendor names to payments
      const paymentsWithNames = (response.data || []).map((payment: any) => {
        // Try to get vendor name from multiple sources
        let vendorName = payment.vendor_company;
        
        // Check if vendor object exists in the response
        if (!vendorName || vendorName === 'N/A') {
          if (payment.vendor && payment.vendor.name) {
            vendorName = payment.vendor.company_name || payment.vendor.name;
            console.log(`✅ Got vendor name from nested vendor object: ${vendorName}`);
          } else if (payment.vendor_id && vendorMap[payment.vendor_id]) {
            vendorName = vendorMap[payment.vendor_id];
            console.log(`✅ Mapped vendor ${payment.vendor_id} -> ${vendorName}`);
          } else {
            vendorName = 'N/A';
            console.warn(`⚠️ No vendor name found for vendor_id: ${payment.vendor_id}`);
          }
        }
        
        return {
          ...payment,
          vendor_company: vendorName,
        };
      });

      console.log('✅ Payments with mapped names:', paymentsWithNames);
      if (paymentsWithNames.length > 0) {
        console.log('📊 First mapped payment:', paymentsWithNames[0]);
      }
      setPayments(paymentsWithNames);
      
      // Track all unique vendor IDs from payments
      setAllVendorIdsWithPayments(prev => {
        const newSet = new Set(prev);
        paymentsWithNames.forEach(payment => {
          if (payment.vendor_id) {
            newSet.add(payment.vendor_id);
          }
        });
        console.log('📊 Total unique vendors with payments:', newSet.size);
        return newSet;
      });
      
      setPagination((prev) => ({
        ...prev,
        currentPage: response.meta.current_page,
        total: response.meta.total,
        lastPage: response.meta.last_page,
        perPage: response.meta.per_page,
      }));

      if (response.data && response.data.length > 0) {
        toast.success(`Loaded ${response.data.length} payment(s)`);
      } else {
        if (response.meta.total === 0) {
          toast.error('Backend database has NO payment records. Please add payment data.', {
            duration: 8000,
          });
        } else {
          toast('No payments match your filters. Try clearing filters.', { icon: 'ℹ️' });
        }
      }
    } catch (error: any) {
      console.error('❌ API Error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to load vendor payments';
      toast.error(errorMessage);
      setPayments([]);
    } finally {
      setIsFetching(false);
    }
  };

  // Fetch all vendors and categories for mapping
  useEffect(() => {
    const fetchMappingData = async () => {
      setIsLoadingVendors(true);
      try {
        console.log('🚀 Starting to fetch vendors and categories...');
        
        // Fetch vendors
        console.log('📤 Fetching vendors...');
        const vendorResponse = await vendorApi.getVendors(undefined, 1000, 1);
        console.log('✅ Vendors fetched:', vendorResponse.data.length);
        setVendors(vendorResponse.data);
        
        // Build vendor map
        const vMap: Record<number, string> = {};
        vendorResponse.data.forEach((vendor: Vendor) => {
          vMap[vendor.id] = vendor.company_name || vendor.name || `Vendor #${vendor.id}`;
        });
        setVendorMap(vMap);
        console.log('✅ Vendor map created with', Object.keys(vMap).length, 'vendors');

        // Fetch categories
        console.log('📤 Fetching categories...');
        const categoryResponse = await categoryApi.getCategories({ paginationSize: 1000 });
        console.log('✅ Categories fetched:', categoryResponse.data.length);
        
        // Build category map
        const cMap: Record<number, string> = {};
        categoryResponse.data.forEach((category: any) => {
          cMap[category.id] = category.name;
        });
        setCategoryMap(cMap);
        console.log('✅ Category map created with', Object.keys(cMap).length, 'categories');
        
        console.log('✅ All mapping data loaded successfully');
      } catch (error: any) {
        console.error('❌ Failed to load vendors/categories:', error);
        console.error('❌ Error details:', error.response?.data);
        console.error('❌ Error message:', error.message);
        // Don't show error toast - let the page work without names if needed
        // Just log the error for debugging
      } finally {
        setIsLoadingVendors(false);
      }
    };
    fetchMappingData();
  }, []);

  // Fetch payments when maps are ready or filters change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPayments();
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedVendor,
    selectedCategory,
    selectedPaymentType,
    selectedStatus,
    startDate,
    endDate,
    pagination.currentPage,
    pagination.perPage,
    vendorMap,
    categoryMap,
  ]);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > pagination.lastPage) return;
    setPagination((prev) => ({ ...prev, currentPage: page }));
  };

  const handleViewDetails = (paymentId: number) => {
    navigate(`/admin/vendor-payments/details/${paymentId}`);
  };

  const handleExportExcel = async () => {
    setIsLoading(true);
    try {
      console.log('📤 Starting Excel export...');
      const filters: any = {};
      if (selectedVendor && selectedVendor !== "all") filters.vendor_id = Number(selectedVendor);
      if (selectedStatus) filters.transfer_status = selectedStatus;
      if (startDate) filters.start_date = startDate;
      if (endDate) filters.end_date = endDate;

      console.log('📤 Export filters:', filters);
      const blob = await vendorPaymentApi.exportExcel(filters);
      console.log('✅ Excel blob received:', blob);
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `vendor-payments-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Excel export completed!');
    } catch (error: any) {
      console.error('❌ Excel export error:', error);
      
      // Try to read error message from blob if it's JSON
      if (error.response?.data instanceof Blob) {
        try {
          const text = await error.response.data.text();
          console.error('❌ Error blob content:', text);
          const errorData = JSON.parse(text);
          const errorMessage = errorData.message || errorData.error || 'Failed to export to Excel';
          toast.error(errorMessage);
          return;
        } catch (e) {
          console.error('❌ Could not parse error blob:', e);
        }
      }
      
      const errorMessage = error.response?.data?.message || error.message || 'Failed to export to Excel';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };



  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const clearAllFilters = () => {
    setSelectedVendor(null);
    setSelectedCategory(null);
    setSelectedPaymentType(null);
    setSelectedStatus(null);
    setStartDate("");
    setEndDate("");
    setSearchTerm("");
    toast.success("All filters cleared");
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-5 lg:p-6 xl:p-8 w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:gap-4 lg:gap-5">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#00897B] break-words">Vendor Payments</h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base lg:text-lg">
            Manage and track vendor payment transactions
          </p>
          {(selectedVendor || selectedStatus || selectedPaymentType || startDate || endDate) && (
            <div className="mt-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs text-blue-600 underline p-0"
                onClick={clearAllFilters}
              >
                Clear all filters
              </Button>
            </div>
          )}
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 lg:gap-3 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={handleExportExcel}
            disabled={isLoading}
            className="w-full sm:w-auto lg:min-w-[140px] xl:min-w-[160px]"
            size={isMobile ? "default" : "default"}
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            {isMobile ? "Excel" : "Export to Excel"}
          </Button>
          <Button
            onClick={() => navigate("/admin/vendor-payments/report")}
            className="bg-[#00897B] hover:bg-[#00796B] w-full sm:w-auto lg:min-w-[140px] xl:min-w-[160px]"
            size={isMobile ? "default" : "default"}
          >
            <Calendar className="h-4 w-4 mr-2" />
            {isMobile ? "Report" : "Generate Report"}
          </Button>
          <Button
            onClick={() => navigate("/admin/vendor-payments/manual-transfer")}
            className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto lg:min-w-[140px] xl:min-w-[160px]"
            size={isMobile ? "default" : "default"}
          >
            <Download className="h-4 w-4 mr-2" />
            {isMobile ? "Transfer" : "Manual Transfer"}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-3 sm:p-4 lg:p-5 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
          <div className="space-y-2">
            <Label className="text-sm lg:text-base">Select Vendor</Label>
            <Select
              value={selectedVendor || "all"}
              onValueChange={(value) => {
                setSelectedVendor(value === "all" ? null : value);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={isLoadingVendors ? "Loading..." : "All Vendors"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Vendors</SelectItem>
                {(() => {
                  // Extract unique vendors directly from payments data
                  const vendorMap = new Map<number, { id: number; name: string }>();
                  
                  payments.forEach(payment => {
                    if (payment.vendor_id && !vendorMap.has(payment.vendor_id)) {
                      const vendorName = payment.vendor_company 
                        || payment.vendor_name 
                        || (payment as any).vendor?.company_name 
                        || (payment as any).vendor?.name 
                        || `Vendor #${payment.vendor_id}`;
                      
                      vendorMap.set(payment.vendor_id, {
                        id: payment.vendor_id,
                        name: vendorName
                      });
                    }
                  });
                  
                  // Convert to array and sort
                  const uniqueVendors = Array.from(vendorMap.values());
                  uniqueVendors.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
                  
                  console.log('📊 Unique vendors from payments:', uniqueVendors);
                  
                  return uniqueVendors.map((vendor) => (
                    <SelectItem key={vendor.id} value={String(vendor.id)}>
                      {vendor.name}
                    </SelectItem>
                  ));
                })()}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-sm lg:text-base">Start Date</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm lg:text-base">End Date</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm lg:text-base">Payment Type</Label>
            <Select
              value={selectedPaymentType || "all-types"}
              onValueChange={(value) => setSelectedPaymentType(value === "all-types" ? null : value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-types">All Types</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="full">Full</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-sm lg:text-base">Status</Label>
            <Select
              value={selectedStatus || "all-status"}
              onValueChange={(value) => setSelectedStatus(value === "all-status" ? null : value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-status">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processed">Processed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Data Display */}
      {isFetching ? (
        <Card>
          <div className="text-center p-8 sm:p-12">
            <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin mx-auto mb-4 text-[#00897B]" />
            <p className="text-gray-500 text-sm sm:text-base">Loading payments from API...</p>
          </div>
        </Card>
      ) : (
        <>
          {payments.length > 0 ? (
            isMobile ? (
              /* Mobile Card View */
              <div className="space-y-3 w-full">
                {payments.map((payment) => (
                  <Card key={payment.id} className="p-4 border-l-4 border-l-[#00897B] w-full">
                    <div className="space-y-3">
                      {/* Header Row */}
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <span className="text-xs text-gray-500 font-mono">#{payment.id}</span>
                          <div className="font-semibold text-sm mt-0.5 truncate">
                            {payment.vendor_company}
                          </div>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <Badge className={getStatusBadgeColor(payment.transfer_status)}>
                            {payment.transfer_status}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleViewDetails(payment.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Type */}
                      <div>
                        <Label className="text-xs text-gray-500">Type</Label>
                        <Badge variant="outline" className="mt-0.5">
                          {payment.payment_type || 'N/A'}
                        </Badge>
                      </div>

                      {/* Period */}
                      {payment.booking_date && (
                        <div>
                          <Label className="text-xs text-gray-500">Booking Date</Label>
                          <p className="text-xs text-gray-600 mt-0.5">
                            {format(new Date(payment.booking_date), 'MMMM dd, yyyy')}
                          </p>
                        </div>
                      )}

                      {/* Amounts */}
                      <div className="flex flex-col gap-2 pt-2 border-t">
                        <div className="flex justify-between items-center">
                          <Label className="text-xs text-gray-500">Total Amount</Label>
                          <p className="text-sm font-medium">
                            {(() => {
                              const amount = (payment as any).total_amount_ttc || payment.total_amount || 0;
                              return Number(amount).toFixed(2);
                            })()}DH
                          </p>
                        </div>
                        <div className="flex justify-between items-center">
                          <Label className="text-xs text-gray-500">Commission</Label>
                          <p className="text-sm font-medium text-red-600">
                            {(() => {
                              const amount = (payment as any).commission_amount_incl_vat || (payment as any).commission_amount_ttc || payment.commission_amount || 0;
                              return Number(amount).toFixed(2);
                            })()}DH
                          </p>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t">
                          <Label className="text-sm font-semibold text-gray-700">Net Amount</Label>
                          <p className="text-lg font-bold text-[#00897B]">
                            {(() => {
                              const amount = (payment as any).net_amount_ttc || payment.net_amount || 0;
                              return Number(amount).toFixed(2);
                            })()}DH
                          </p>
                        </div>
                      </div>

                      {/* Date */}
                      <div>
                        <Label className="text-xs text-gray-500">Transfer Date</Label>
                        <p className="text-sm mt-0.5">
                          {payment.transfer_date 
                            ? format(new Date(payment.transfer_date), 'MMM dd, yyyy') 
                            : 'Pending'}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              /* Desktop Table View */
              <Card className="w-full overflow-hidden">
                <div className="overflow-x-auto w-full">
                  <div className="min-w-[900px]">
                  <Table className="w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="whitespace-nowrap text-xs lg:text-sm">ID</TableHead>
                        <TableHead className="whitespace-nowrap text-xs lg:text-sm">Vendor</TableHead>
                        <TableHead className="whitespace-nowrap text-xs lg:text-sm">Period</TableHead>
                        <TableHead className="text-right whitespace-nowrap text-xs lg:text-sm">Amount</TableHead>
                        <TableHead className="text-right whitespace-nowrap text-xs lg:text-sm">Commission</TableHead>
                        <TableHead className="text-right whitespace-nowrap text-xs lg:text-sm">Net Amount</TableHead>
                        <TableHead className="whitespace-nowrap text-xs lg:text-sm">Type</TableHead>
                        <TableHead className="whitespace-nowrap text-xs lg:text-sm">Status</TableHead>
                        <TableHead className="whitespace-nowrap text-xs lg:text-sm">Date</TableHead>
                        <TableHead className="whitespace-nowrap text-xs lg:text-sm">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-mono text-xs lg:text-sm whitespace-nowrap">#{payment.id}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            <div className="font-medium text-xs lg:text-sm">{payment.vendor_company}</div>
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-xs lg:text-sm">
                            {payment.booking_date 
                              ? format(new Date(payment.booking_date), 'MMM dd, yyyy')
                              : 'N/A'}
                          </TableCell>
                          <TableCell className="text-right whitespace-nowrap text-xs lg:text-sm">
                            {(() => {
                              const amount = (payment as any).total_amount_ttc || payment.total_amount || 0;
                              return Number(amount).toFixed(2);
                            })()}DH
                          </TableCell>
                          <TableCell className="text-right whitespace-nowrap text-xs lg:text-sm">
                            {(() => {
                              const amount = (payment as any).commission_amount_incl_vat || (payment as any).commission_amount_ttc || payment.commission_amount || 0;
                              return Number(amount).toFixed(2);
                            })()}DH
                          </TableCell>
                          <TableCell className="text-right font-semibold whitespace-nowrap text-xs lg:text-sm">
                            {(() => {
                              const amount = (payment as any).net_amount_ttc || payment.net_amount || 0;
                              return Number(amount).toFixed(2);
                            })()}DH
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <Badge variant="outline" className="text-xs">
                              {payment.payment_type || 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <Badge className={`${getStatusBadgeColor(payment.transfer_status)} text-xs`}>
                              {payment.transfer_status}
                            </Badge>
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-xs lg:text-sm">
                            {payment.transfer_date 
                              ? format(new Date(payment.transfer_date), 'MMM dd, yyyy') 
                              : 'Pending'}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(payment.id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  </div>
                </div>

                {/* Pagination */}
                {pagination.lastPage > 1 && (
              isMobile ? (
                /* Mobile Pagination */
                <div className="p-4 border-t">
                  <div className="flex justify-between items-center mb-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                      disabled={pagination.currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-gray-600">
                      Page {pagination.currentPage} of {pagination.lastPage}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                      disabled={pagination.currentPage === pagination.lastPage}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              ) : (
                /* Desktop Pagination */
                <div className="p-4 border-t">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => handlePageChange(pagination.currentPage - 1)}
                          className={pagination.currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                      {[...Array(pagination.lastPage)].map((_, index) => {
                        const page = index + 1;
                        if (
                          page === 1 ||
                          page === pagination.lastPage ||
                          (page >= pagination.currentPage - 1 && page <= pagination.currentPage + 1)
                        ) {
                          return (
                            <PaginationItem key={page}>
                              <PaginationLink
                                onClick={() => handlePageChange(page)}
                                isActive={pagination.currentPage === page}
                                className="cursor-pointer"
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        } else if (
                          page === pagination.currentPage - 2 ||
                          page === pagination.currentPage + 2
                        ) {
                          return <PaginationItem key={page}>...</PaginationItem>;
                        }
                        return null;
                      })}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => handlePageChange(pagination.currentPage + 1)}
                          className={pagination.currentPage === pagination.lastPage ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )
            )}
              </Card>
            )
          ) : (
          <Card>
            <div className="text-center p-8 sm:p-12">
              <FileText className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                No payments found
              </h3>
              <p className="text-sm sm:text-base text-gray-500 mb-4">
                {(selectedVendor || selectedCategory || selectedPaymentType || selectedStatus || startDate || endDate)
                  ? 'No vendor payments match your current filters. Try adjusting or clearing the filters.'
                  : 'No payment records found.'}
              </p>
              {(selectedVendor || selectedCategory || selectedPaymentType || selectedStatus || startDate || endDate) && (
                <Button onClick={clearAllFilters} className="w-full sm:w-auto">
                  Clear Filters
                </Button>
              )}
            </div>
          </Card>
        )}
      </>
      )}
    </div>
  );
};

export default VendorPaymentsIndex;

