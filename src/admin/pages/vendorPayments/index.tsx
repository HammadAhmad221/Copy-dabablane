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
  FileText,
  FileSpreadsheet,
  Eye,
  Calendar,
  Loader2,
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

  const [pagination, setPagination] = useState({
    currentPage: 1,
    perPage: 10,
    total: 0,
    lastPage: 1,
  });

  // Fetch vendor payments from API
  const fetchPayments = async () => {
    console.log('🚀 fetchPayments called - API Integration Active!');
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

      setPayments(response.data || []);
      
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

  // Fetch all vendors for dropdown
  useEffect(() => {
    const fetchVendors = async () => {
      setIsLoadingVendors(true);
      try {
        const response = await vendorApi.getVendors(undefined, 100, 1);
        setVendors(response.data);
      } catch (error) {
        toast.error('Failed to load vendors list');
      } finally {
        setIsLoadingVendors(false);
      }
    };
    fetchVendors();
  }, []);

  // Fetch payments on mount
  useEffect(() => {
    fetchPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch payments when filters change
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
      const filters: any = {};
      if (selectedVendor && selectedVendor !== "all") filters.vendor_id = Number(selectedVendor);
      if (selectedStatus) filters.transfer_status = selectedStatus;
      if (startDate) filters.start_date = startDate;
      if (endDate) filters.end_date = endDate;

      const blob = await vendorPaymentApi.exportExcel(filters);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `vendor-payments-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      link.click();
      toast.success('Excel export completed!');
    } catch (error) {
      toast.error('Failed to export to Excel');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPDF = async () => {
    setIsLoading(true);
    try {
      const filters: any = {};
      if (selectedVendor && selectedVendor !== "all") filters.vendor_id = Number(selectedVendor);
      if (selectedStatus) filters.transfer_status = selectedStatus;
      if (startDate) filters.start_date = startDate;
      if (endDate) filters.end_date = endDate;

      const blob = await vendorPaymentApi.exportPDF(filters);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `vendor-payments-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      link.click();
      toast.success('PDF export completed!');
    } catch (error) {
      toast.error('Failed to export to PDF');
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
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6 w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#00897B] break-words">Vendor Payments</h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">
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
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={handleExportExcel}
            disabled={isLoading}
            className="w-full sm:w-auto"
            size={isMobile ? "default" : "default"}
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            {isMobile ? "Excel" : "Export Excel"}
          </Button>
          <Button
            variant="outline"
            onClick={handleExportPDF}
            disabled={isLoading}
            className="w-full sm:w-auto"
            size={isMobile ? "default" : "default"}
          >
            <FileText className="h-4 w-4 mr-2" />
            {isMobile ? "PDF" : "Export PDF"}
          </Button>
          <Button
            onClick={() => navigate("/admin/vendor-payments/report")}
            className="bg-[#00897B] hover:bg-[#00796B] w-full sm:w-auto"
            size={isMobile ? "default" : "default"}
          >
            <Calendar className="h-4 w-4 mr-2" />
            {isMobile ? "Report" : "Generate Report"}
          </Button>
          <Button
            onClick={() => navigate("/admin/vendor-payments/manual-transfer")}
            className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
            size={isMobile ? "default" : "default"}
          >
            <Download className="h-4 w-4 mr-2" />
            {isMobile ? "Transfer" : "Manual Transfer"}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-3 sm:p-4 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
          <div className="space-y-2">
            <Label className="text-sm">Select Vendor</Label>
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
                {vendors.map((vendor) => (
                  <SelectItem key={vendor.id} value={String(vendor.id)}>
                    {vendor.company_name || vendor.name || `Vendor #${vendor.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Start Date</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm">End Date</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Payment Type</Label>
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
            <Label className="text-sm">Status</Label>
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

                      {/* Category & Period */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="min-w-0">
                          <Label className="text-xs text-gray-500">Category</Label>
                          <p className="text-sm font-medium mt-0.5 truncate">
                            {payment.category_name || 'N/A'}
                          </p>
                        </div>
                        <div className="min-w-0">
                          <Label className="text-xs text-gray-500">Type</Label>
                          <Badge variant="outline" className="mt-0.5">
                            {payment.payment_type || 'N/A'}
                          </Badge>
                        </div>
                      </div>

                      {/* Period */}
                      {payment.week_start && payment.week_end && (
                        <div>
                          <Label className="text-xs text-gray-500">Period</Label>
                          <p className="text-xs text-gray-600 mt-0.5">
                            {payment.week_start} to {payment.week_end}
                          </p>
                        </div>
                      )}

                      {/* Amounts */}
                      <div className="flex flex-col gap-2 pt-2 border-t">
                        <div className="flex justify-between items-center">
                          <Label className="text-xs text-gray-500">Total Amount</Label>
                          <p className="text-sm font-medium">
                            MAD {payment.total_amount?.toFixed(2) || '0.00'}
                          </p>
                        </div>
                        <div className="flex justify-between items-center">
                          <Label className="text-xs text-gray-500">Commission</Label>
                          <p className="text-sm font-medium text-red-600">
                            MAD {payment.commission?.toFixed(2) || '0.00'}
                          </p>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t">
                          <Label className="text-sm font-semibold text-gray-700">Net Amount</Label>
                          <p className="text-lg font-bold text-[#00897B]">
                            MAD {payment.net_amount?.toFixed(2) || '0.00'}
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
                  <Table className="w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="whitespace-nowrap">ID</TableHead>
                        <TableHead className="whitespace-nowrap">Vendor</TableHead>
                        <TableHead className="whitespace-nowrap">Category</TableHead>
                        <TableHead className="whitespace-nowrap">Period</TableHead>
                        <TableHead className="text-right whitespace-nowrap">Amount</TableHead>
                        <TableHead className="text-right whitespace-nowrap">Commission</TableHead>
                        <TableHead className="text-right whitespace-nowrap">Net Amount</TableHead>
                        <TableHead className="whitespace-nowrap">Type</TableHead>
                        <TableHead className="whitespace-nowrap">Status</TableHead>
                        <TableHead className="whitespace-nowrap">Date</TableHead>
                        <TableHead className="whitespace-nowrap">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-mono text-sm whitespace-nowrap">#{payment.id}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            <div className="font-medium">{payment.vendor_company}</div>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">{payment.category_name || 'N/A'}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            {payment.week_start && payment.week_end 
                              ? `${payment.week_start} to ${payment.week_end}` 
                              : 'N/A'}
                          </TableCell>
                          <TableCell className="text-right whitespace-nowrap">
                            MAD {payment.total_amount?.toFixed(2) || '0.00'}
                          </TableCell>
                          <TableCell className="text-right whitespace-nowrap">
                            MAD {payment.commission?.toFixed(2) || '0.00'}
                          </TableCell>
                          <TableCell className="text-right font-semibold whitespace-nowrap">
                            MAD {payment.net_amount?.toFixed(2) || '0.00'}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <Badge variant="outline">
                              {payment.payment_type || 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <Badge className={getStatusBadgeColor(payment.transfer_status)}>
                              {payment.transfer_status}
                            </Badge>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
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

