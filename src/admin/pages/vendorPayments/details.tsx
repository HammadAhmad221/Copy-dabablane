import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card } from "@/admin/components/ui/card";
import { Button } from "@/admin/components/ui/button";
import { Badge } from "@/admin/components/ui/badge";
import { Label } from "@/admin/components/ui/label";
import { ArrowLeft, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "react-hot-toast";
import vendorPaymentApi from "@/admin/lib/api/services/vendorPaymentService";
import type { VendorPayment } from "@/admin/lib/api/types/vendorPayment";

const VendorPaymentDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [payment, setPayment] = useState<VendorPayment | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPaymentDetails = async () => {
      if (!id) return;

      setIsLoading(true);
      try {
        console.log('📤 Fetching payment details for ID:', id);
        const data = await vendorPaymentApi.getPaymentById(id);
        console.log('✅ Payment details received:', data);
        console.log('📊 Full payment object:', JSON.stringify(data, null, 2));
        console.log('📊 Payment amounts:', {
          total_amount: data.total_amount,
          total_amount_ttc: (data as any).total_amount_ttc,
          commission_amount: data.commission_amount,
          commission_amount_ttc: (data as any).commission_amount_ttc,
          commission_amount_incl_vat: (data as any).commission_amount_incl_vat,
          net_amount: data.net_amount,
          net_amount_ttc: (data as any).net_amount_ttc,
        });
        console.log('📊 Vendor info:', {
          vendor_company: data.vendor_company,
          vendor_name: data.vendor_name,
          vendor_object: (data as any).vendor,
        });
        console.log('📊 Category info:', {
          category_name: data.category_name,
          category_object: (data as any).category,
        });
        setPayment(data);
        toast.success('Payment details loaded');
      } catch (error: any) {
        console.error('❌ Error fetching payment details:', error);
        console.error('❌ Error response:', error.response?.data);
        const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to load payment details';
        toast.error(errorMessage);
        // Don't navigate away immediately, let user see the error
        setTimeout(() => {
          navigate('/admin/vendor-payments');
        }, 2000);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPaymentDetails();
  }, [id, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="text-center p-12">
        <p className="text-gray-500">Payment not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/admin/vendor-payments")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Payment Details #{payment.id}</h1>
        </div>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Payment Summary</h2>
        <div className="space-y-4">
          <div className="flex justify-between">
            <Label>Vendor:</Label>
            <span>{(() => {
              const vendorCompany = payment.vendor_company 
                || (payment as any).vendor?.company_name 
                || (payment as any).vendor?.name 
                || 'N/A';
              return vendorCompany;
            })()}</span>
          </div>
          <div className="flex justify-between">
            <Label>Vendor Name:</Label>
            <span>{(() => {
              const vendorName = payment.vendor_name 
                || (payment as any).vendor?.name 
                || (payment as any).vendor?.company_name 
                || 'N/A';
              return vendorName;
            })()}</span>
          </div>
          <div className="flex justify-between">
            <Label>Category:</Label>
            <span>{(() => {
              const categoryName = payment.category_name 
                || (payment as any).category?.name 
                || '-';
              return categoryName;
            })()}</span>
          </div>
          <div className="flex justify-between">
            <Label>Booking Date:</Label>
            <span>{format(new Date(payment.booking_date), "PPP")}</span>
          </div>
          <div className="flex justify-between">
            <Label>Total Bookings:</Label>
            <span>{payment.total_bookings}</span>
          </div>
          <div className="flex justify-between">
            <Label>Total Amount:</Label>
            <span>{(() => {
              const amount = (payment as any).total_amount_ttc || payment.total_amount || 0;
              return Number(amount).toFixed(2);
            })()}DH</span>
          </div>
          <div className="flex justify-between text-red-600">
            <Label>Commission:</Label>
            <span>-{(() => {
              const amount = (payment as any).commission_amount_incl_vat || (payment as any).commission_amount_ttc || payment.commission_amount || 0;
              return Number(amount).toFixed(2);
            })()}DH</span>
          </div>
          <div className="flex justify-between text-red-600">
            <Label>Commission VAT:</Label>
            <span>-{(() => {
              const amount = payment.commission_vat || 0;
              return Number(amount).toFixed(2);
            })()}DH</span>
          </div>
          <div className="flex justify-between font-bold text-xl">
            <Label>Net Amount:</Label>
            <span className="text-green-600">{(() => {
              const amount = (payment as any).net_amount_ttc || payment.net_amount || 0;
              return Number(amount).toFixed(2);
            })()}DH</span>
          </div>
          <div className="flex justify-between">
            <Label>Payment Type:</Label>
            <Badge variant={payment.payment_type === 'full' ? 'default' : 'outline'}>
              {payment.payment_type}
            </Badge>
          </div>
          <div className="flex justify-between">
            <Label>Transfer Status:</Label>
            <Badge className={
              payment.transfer_status === 'processed' ? 'bg-green-500' : 'bg-yellow-500'
            }>
              {payment.transfer_status}
            </Badge>
          </div>
          {payment.payment_date && (
            <div className="flex justify-between">
              <Label>Payment Date:</Label>
              <span>{format(new Date(payment.payment_date), "PPP")}</span>
            </div>
          )}
          {payment.transfer_date && (
            <div className="flex justify-between">
              <Label>Transfer Date:</Label>
              <span>{format(new Date(payment.transfer_date), "PPP")}</span>
            </div>
          )}
          {payment.note && (
            <div className="flex flex-col gap-2">
              <Label>Note:</Label>
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{payment.note}</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default VendorPaymentDetails;
