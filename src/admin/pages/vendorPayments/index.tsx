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

const VendorPaymentsIndex = () => {
  const navigate = useNavigate();
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
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#00897B]">Vendor Payments</h1>
          <p className="text-gray-500 mt-1">
            Manage and track vendor payment transactions
          </p>
          {(selectedVendor || selectedStatus || selectedPaymentType || startDate || endDate) && (
            <div className="mt-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs text-blue-600 underline"
                onClick={clearAllFilters}
              >
                Clear all filters
              </Button>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleExportExcel}
            disabled={isLoading}
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
          <Button
            variant="outline"
            onClick={handleExportPDF}
            disabled={isLoading}
          >
            <FileText className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button
            onClick={() => navigate("/admin/vendor-payments/report")}
            className="bg-[#00897B] hover:bg-[#00796B]"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
          <Button
            onClick={() => navigate("/admin/vendor-payments/manual-transfer")}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Manual Transfer
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>Select Vendor</Label>
            <Select
              value={selectedVendor || "all"}
              onValueChange={(value) => {
                setSelectedVendor(value === "all" ? null : value);
              }}
            >
              <SelectTrigger>
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
            <Label>Start Date</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>End Date</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Payment Type</Label>
            <Select
              value={selectedPaymentType || "all-types"}
              onValueChange={(value) => setSelectedPaymentType(value === "all-types" ? null : value)}
            >
              <SelectTrigger>
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
            <Label>Status</Label>
            <Select
              value={selectedStatus || "all-status"}
              onValueChange={(value) => setSelectedStatus(value === "all-status" ? null : value)}
            >
              <SelectTrigger>
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

      {/* Table */}
      <Card>
        {isFetching ? (
          <div className="text-center p-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">Loading payments from API...</p>
          </div>
        ) : (
          <>
            {payments.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Vendor</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Period</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">Commission</TableHead>
                        <TableHead className="text-right">Net Amount</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-mono text-sm">#{payment.id}</TableCell>
                          <TableCell>
                            <div className="font-medium">{payment.vendor_company}</div>
                          </TableCell>
                          <TableCell>{payment.category_name || 'N/A'}</TableCell>
                          <TableCell>
                            {payment.week_start && payment.week_end 
                              ? `${payment.week_start} to ${payment.week_end}` 
                              : 'N/A'}
                          </TableCell>
                          <TableCell className="text-right">
                            MAD {payment.total_amount?.toFixed(2) || '0.00'}
                          </TableCell>
                          <TableCell className="text-right">
                            MAD {payment.commission?.toFixed(2) || '0.00'}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            MAD {payment.net_amount?.toFixed(2) || '0.00'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {payment.payment_type || 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusBadgeColor(payment.transfer_status)}>
                              {payment.transfer_status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {payment.transfer_date 
                              ? format(new Date(payment.transfer_date), 'MMM dd, yyyy') 
                              : 'Pending'}
                          </TableCell>
                          <TableCell>
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
                )}
              </>
            ) : (
              <div className="text-center p-12">
                <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No payments found
                </h3>
                <p className="text-gray-500 mb-4">
                  {(selectedVendor || selectedCategory || selectedPaymentType || selectedStatus || startDate || endDate)
                    ? 'No vendor payments match your current filters. Try adjusting or clearing the filters.'
                    : 'No payment records found.'}
                </p>
                {(selectedVendor || selectedCategory || selectedPaymentType || selectedStatus || startDate || endDate) && (
                  <Button onClick={clearAllFilters}>
                    Clear Filters
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
};

export default VendorPaymentsIndex;

