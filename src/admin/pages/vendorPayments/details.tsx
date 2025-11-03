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
        const data = await vendorPaymentApi.getPaymentById(id);
        setPayment(data);
      } catch (error: any) {
        console.error('Error fetching payment details:', error);
        toast.error(error.response?.data?.message || 'Failed to load payment details');
        navigate('/admin/vendor-payments');
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin/vendor-payments")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Payment Details #{payment.id}</h1>
          </div>
        </div>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Payment Summary</h2>
        <div className="space-y-4">
          <div className="flex justify-between">
            <Label>Vendor:</Label>
            <span>{payment.vendor_company}</span>
          </div>
          <div className="flex justify-between">
            <Label>Vendor Name:</Label>
            <span>{payment.vendor_name}</span>
          </div>
          <div className="flex justify-between">
            <Label>Category:</Label>
            <span>{payment.category_name || '-'}</span>
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
            <span>${payment.total_amount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-red-600">
            <Label>Commission:</Label>
            <span>-${payment.commission_amount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-red-600">
            <Label>Commission VAT:</Label>
            <span>-${payment.commission_vat.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-xl">
            <Label>Net Amount:</Label>
            <span className="text-green-600">${payment.net_amount.toFixed(2)}</span>
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
