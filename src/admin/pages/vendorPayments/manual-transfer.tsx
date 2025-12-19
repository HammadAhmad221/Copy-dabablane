import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/admin/components/ui/card";
import { Button } from "@/admin/components/ui/button";
import { Checkbox } from "@/admin/components/ui/checkbox";
import { Badge } from "@/admin/components/ui/badge";
import { Input } from "@/admin/components/ui/input";
import { Label } from "@/admin/components/ui/label";
import { ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "react-hot-toast";
import vendorPaymentApi from "@/admin/lib/api/services/vendorPaymentService";
import type { VendorPayment } from "@/admin/lib/api/types/vendorPayment";

const ManualTransfer = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [payments, setPayments] = useState<VendorPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transferDate, setTransferDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [note, setNote] = useState<string>("");

  const fetchPendingPayments = async () => {
    setIsLoading(true);
    try {
      console.log('Fetching pending payments...');
      const response = await vendorPaymentApi.getPayments({
        transfer_status: 'pending',
        paginationSize: 100,
      });
      console.log('Pending payments response:', response);
      
      // Map vendor names from nested vendor object
      const paymentsWithNames = (response.data || []).map((payment: any) => {
        let vendorName = payment.vendor_company;
        
        // Check if vendor object exists in the response
        if (!vendorName || vendorName === 'N/A') {
          if (payment.vendor && payment.vendor.name) {
            vendorName = payment.vendor.company_name || payment.vendor.name;
            console.log(`✅ Got vendor name from nested vendor object: ${vendorName}`);
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
      
      setPayments(paymentsWithNames);
      
      if (paymentsWithNames.length > 0) {
        toast.success(`Found ${paymentsWithNames.length} pending payment(s)`);
      } else {
        toast("No pending payments found", { icon: 'ℹ️' });
      }
    } catch (error: any) {
      console.error('Error fetching pending payments:', error);
      console.error('Full error response:', error.response);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to load pending payments';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingPayments();
  }, []);

  const toNumber = (value: unknown): number => {
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    if (typeof value === 'string') {
      const cleaned = value.replace(/[^0-9.-]+/g, '');
      const n = Number(cleaned);
      return Number.isFinite(n) ? n : 0;
    }
    return 0;
  };

  const getNetAmount = (payment: VendorPayment) =>
    toNumber((payment as any).net_amount_ttc ?? payment.net_amount ?? (payment as any).net_amount_incl_vat);

  const getTotalAmount = (payment: VendorPayment) =>
    toNumber((payment as any).total_amount_ttc ?? payment.total_amount ?? (payment as any).total_amount_incl_vat);

  const handleProcess = async () => {
    if (selected.size === 0) {
      toast.error("Select at least one payment");
      return;
    }

    if (!transferDate) {
      toast.error("Please select a transfer date");
      return;
    }

    setIsProcessing(true);
    try {
      console.log('📤 Processing payments:', {
        payment_ids: Array.from(selected),
        transfer_date: transferDate,
        note: note || undefined,
      });
      
      await vendorPaymentApi.markProcessed({
        payment_ids: Array.from(selected),
        transfer_date: transferDate,
        note: note || undefined,
      });
      
      toast.success(`Successfully processed ${selected.size} payment(s)`);
      setSelected(new Set());
      setNote("");
      
      // Refresh the payments list
      await fetchPendingPayments();
    } catch (error: any) {
      console.error('❌ Error processing payments:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error response errors:', error.response?.data?.errors);
      
      // Try to extract detailed error message
      let errorMessage = 'Failed to mark payments as processed';
      
      if (error.response?.data) {
        // First try to get the main message
        if (error.response.data.message) {
          errorMessage = error.response.data.message;
        }
        
        // Then append detailed errors if available
        if (error.response.data.errors) {
          const errors = error.response.data.errors;
          console.log('📋 Errors array:', errors);
          
          if (Array.isArray(errors) && errors.length > 0) {
            // Check if it's a database error
            const firstError = errors[0];
            if (typeof firstError === 'string' && firstError.includes('SQLSTATE')) {
              // Database error - show user-friendly message
              errorMessage = 'Database error: Please contact the administrator. The payment log table needs to be updated.';
            } else {
              // Join all error messages
              const errorDetails = errors.join(', ');
              errorMessage = `${errorMessage}: ${errorDetails}`;
            }
          } else if (typeof errors === 'object') {
            const errorDetails = Object.values(errors).flat().join(', ');
            if (errorDetails) {
              errorMessage = `${errorMessage}: ${errorDetails}`;
            }
          }
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        }
      }
      
      console.log('📋 Final error message:', errorMessage);
      toast.error(errorMessage, { duration: 5000 });
    } finally {
      setIsProcessing(false);
    }
  };

  const totalSelected = Array.from(selected).reduce((sum, id) => {
    const payment = payments.find(p => p.id === id);
    if (!payment) return sum;
    return sum + getNetAmount(payment);
  }, 0);

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/admin/vendor-payments")}
          className="text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold text-[#00897B]">Manual Transfer</h1>
      </div>

      {selected.size > 0 && (
        <Card className="p-4 bg-blue-50">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-semibold">{selected.size} payment(s) selected</p>
                  <p className="text-sm text-gray-600">Total: {totalSelected.toFixed(2)} DH</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Transfer Date *</Label>
                <Input
                  type="date"
                  value={transferDate}
                  onChange={(e) => setTransferDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Note (Optional)</Label>
                <Input
                  placeholder="Add a note..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
            </div>
            <Button 
              onClick={handleProcess} 
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={isProcessing || !transferDate}
            >
              {isProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Process Selected Payments
            </Button>
          </div>
        </Card>
      )}

      <Card className="p-6">
        {isLoading ? (
          <div className="text-center p-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">Loading pending payments...</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center p-12">
            <p className="text-gray-500">No pending payments found</p>
            <p className="text-sm text-gray-400">All payments have been processed</p>
          </div>
        ) : (
          <div className="space-y-4">
            {payments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-4">
                  <Checkbox
                    checked={selected.has(payment.id)}
                    onCheckedChange={(checked) => {
                      const newSelected = new Set(selected);
                      checked ? newSelected.add(payment.id) : newSelected.delete(payment.id);
                      setSelected(newSelected);
                    }}
                  />
                  <div>
                    <p className="font-medium">{payment.vendor_company || 'N/A'}</p>
                    <p className="text-sm text-gray-500">Payment ID: {payment.id}</p>
                    <p className="text-xs text-gray-400">
                      Booking: {payment.booking_date ? format(new Date(payment.booking_date), "PP") : 'N/A'}
                    </p>
                    {payment.category_name && (
                      <p className="text-xs text-gray-400">Category: {payment.category_name}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600">
                    {getNetAmount(payment).toFixed(2)} DH
                  </p>
                  <p className="text-xs text-gray-500">
                    Total: {getTotalAmount(payment).toFixed(2)} DH
                  </p>
                  <Badge className="bg-yellow-500 mt-1">{payment.transfer_status}</Badge>
                  <p className="text-xs text-gray-500 mt-1">{payment.payment_type}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default ManualTransfer;
