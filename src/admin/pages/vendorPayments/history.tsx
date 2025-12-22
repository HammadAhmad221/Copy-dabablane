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

  const toNumber = (value: unknown): number => {
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    if (typeof value === 'string') {
      const cleaned = value.replace(/[^0-9.-]+/g, '');
      const n = Number(cleaned);
      return Number.isFinite(n) ? n : 0;
    }
    return 0;
  };

  const getStatusLabel = (action: string): 'pending' | 'processed' | 'complete' | 'unknown' => {
    const a = String(action || '').toLowerCase();

    if (a.includes('pending') || a.includes('status_changed_to_pending')) return 'pending';
    if (a.includes('complete') || a.includes('status_changed_to_complete')) return 'complete';
    if (a.includes('processed') || a.includes('marked_processed') || a.includes('mark_processed')) return 'processed';

    return 'unknown';
  };

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
            {logs.map((log) => {
              const totalAmount = toNumber(
                log.vendor_payment?.total_amount_ttc ??
                  log.vendor_payment?.total_amount_incl_vat ??
                  log.vendor_payment?.total_amount
              );

              const status = getStatusLabel(log.action);

              return (
                <div key={log.id} className="flex justify-between items-center border-b pb-4">
                  <div>
                    <p className="font-medium">Payment #{log.vendor_payment_id}</p>

                    {log.vendor_payment && (
                      <div className="text-sm text-gray-600 mt-1">
                        <p>
                          Vendor: {log.vendor_payment.vendor?.company_name || log.vendor_payment.vendor?.name || 'N/A'}
                        </p>
                        {log.vendor_payment.category_name && (
                          <p>Category: {log.vendor_payment.category_name}</p>
                        )}
                        <p className="font-semibold text-gray-800 mt-1">
                          Total Amount: {totalAmount.toFixed(2)} DH
                        </p>
                      </div>
                    )}

                    {log.admin_name && (
                      <p className="text-sm text-gray-500 mt-1">{log.admin_name}</p>
                    )}
                    {log.note && <p className="text-xs text-gray-400 mt-1">Note: {log.note}</p>}
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
                    <Badge className="bg-red-500 text-white">
                      {status === 'unknown' ? log.action : status}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">
                      {format(new Date(log.created_at), "PPpp")}
                    </p>
                    {log.ip_address && (
                      <p className="text-xs text-gray-400">IP: {log.ip_address}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};

export default VendorPaymentHistory;
