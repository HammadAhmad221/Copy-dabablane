import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/admin/components/ui/card";
import { Button } from "@/admin/components/ui/button";
import { Badge } from "@/admin/components/ui/badge";
import { ArrowLeft, History, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "react-hot-toast";
import vendorPaymentApi from "@/admin/lib/api/services/vendorPaymentService";
import type { PaymentLog } from "@/admin/lib/api/types/vendorPayment";

const VendorPaymentHistory = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<PaymentLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      try {
        console.log('Fetching payment history logs...');
        const response = await vendorPaymentApi.getLogs(undefined, 50);
        console.log('Payment history logs received:', response);
        
        setLogs(response.data);
        
        if (response.data.length > 0) {
          toast.success(`Loaded ${response.data.length} log entries`);
        } else {
          toast("No payment history found", { icon: 'ℹ️' });
        }
      } catch (error: any) {
        console.error('Error fetching payment history:', error);
        console.error('Full error response:', error.response);
        const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to load payment history';
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, []);

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/admin/vendor-payments")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-[#00897B]">Payment History</h1>
          <History className="h-8 w-8 text-gray-400" />
        </div>
      </div>

      <Card className="p-6">
        {isLoading ? (
          <div className="text-center p-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">Loading payment history...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center p-12">
            <p className="text-gray-500">No payment history found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => (
              <div key={log.id} className="flex justify-between items-center border-b pb-4">
                <div>
                  <p className="font-medium">Payment #{log.vendor_payment_id}</p>
                  <p className="text-sm text-gray-500">{log.admin_name} - {log.action}</p>
                  {log.note && <p className="text-xs text-gray-400 mt-1">{log.note}</p>}
                  {log.old_values && (
                    <details className="text-xs text-gray-400 mt-1">
                      <summary className="cursor-pointer">View changes</summary>
                      <div className="mt-1 bg-gray-50 p-2 rounded">
                        <p className="font-semibold">Old Values:</p>
                        <pre>{JSON.stringify(log.old_values, null, 2)}</pre>
                        {log.new_values && (
                          <>
                            <p className="font-semibold mt-2">New Values:</p>
                            <pre>{JSON.stringify(log.new_values, null, 2)}</pre>
                          </>
                        )}
                      </div>
                    </details>
                  )}
                </div>
                <div className="text-right">
                  <Badge>{log.action}</Badge>
                  <p className="text-xs text-gray-500 mt-1">
                    {format(new Date(log.created_at), "PPpp")}
                  </p>
                  {log.ip_address && (
                    <p className="text-xs text-gray-400">IP: {log.ip_address}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default VendorPaymentHistory;
