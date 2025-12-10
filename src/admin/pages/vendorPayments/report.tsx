import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/admin/components/ui/card";
import { Button } from "@/admin/components/ui/button";
import { Input } from "@/admin/components/ui/input";
import { Label } from "@/admin/components/ui/label";
import { ArrowLeft, Printer, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "react-hot-toast";
import vendorPaymentApi from "@/admin/lib/api/services/vendorPaymentService";
import type { BankingReportItem } from "@/admin/lib/api/types/vendorPayment";

const VendorPaymentReport = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<BankingReportItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [weekStart, setWeekStart] = useState<string>("");
  const [weekEnd, setWeekEnd] = useState<string>("");



  // Auto-fetch on mount with default dates
  useEffect(() => {
    // Set default dates to previous week (where data exists)
    const today = new Date();
    // Go back 7 days to get to previous week
    const previousWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const firstDayOfWeek = new Date(previousWeek.setDate(previousWeek.getDate() - previousWeek.getDay()));
    const lastDayOfWeek = new Date(previousWeek.setDate(previousWeek.getDate() - previousWeek.getDay() + 6));
    
    const startDate = format(firstDayOfWeek, "yyyy-MM-dd");
    const endDate = format(lastDayOfWeek, "yyyy-MM-dd");
    
    setWeekStart(startDate);
    setWeekEnd(endDate);
    
    // Auto-fetch report data with default dates
    console.log('Auto-fetching report with default dates (previous week):', { startDate, endDate });
    fetchReportDataWithDates(startDate, endDate);
  }, []);

  const fetchReportDataWithDates = async (start: string, end: string) => {
    if (!start || !end) {
      setIsLoading(false);
      toast.error("Please select both week start and end dates");
      return;
    }

    setIsLoading(true);
    try {
      console.log('Fetching banking report with dates:', { weekStart: start, weekEnd: end });
      const data = await vendorPaymentApi.getBankingReport(start, end);
      console.log('Banking report data received:', data);
      
      setItems(data);
      
      if (data.length === 0) {
        toast("No data available for the selected period", { icon: 'ℹ️' });
      } else {
        toast.success(`Report generated successfully with ${data.length} vendor(s)`);
      }
    } catch (error: any) {
      console.error('Error fetching report data:', error);
      console.error('Full error response:', error.response);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to load report data';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateReport = () => {
    fetchReportDataWithDates(weekStart, weekEnd);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/admin/vendor-payments")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-[#00897B]">Weekly Transfer Order</h1>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      {/* Date Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="space-y-2">
            <Label>Week Start</Label>
            <Input
              type="date"
              value={weekStart}
              onChange={(e) => setWeekStart(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Week End</Label>
            <Input
              type="date"
              value={weekEnd}
              onChange={(e) => setWeekEnd(e.target.value)}
            />
          </div>
          <Button onClick={handleGenerateReport} disabled={isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Generate Report
          </Button>
        </div>
      </Card>

      <Card className="p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">DabaBlane</h2>
          <h3 className="text-xl font-semibold">Weekly Transfer Order</h3>
          <p className="text-gray-600 mt-2">Report Date: {format(new Date(), "PPP")}</p>
          {weekStart && weekEnd && (
            <p className="text-gray-500 text-sm mt-1">
              Period: {format(new Date(weekStart), "PP")} - {format(new Date(weekEnd), "PP")}
            </p>
          )}
        </div>

        {!weekStart || !weekEnd ? (
          <div className="text-center p-12">
            <p className="text-gray-500">Please select week start and end dates, then click "Generate Report"</p>
          </div>
        ) : isLoading ? (
          <div className="text-center p-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">Loading report data...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center p-12">
            <p className="text-gray-500">No data available for report</p>
            <p className="text-sm text-gray-400">Try selecting a different date range</p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.vendor_id} className="flex justify-between border-b pb-2">
                <div>
                  <p className="font-medium">{item.vendor_company || 'N/A'}</p>
                  <p className="text-xs text-gray-500">{item.vendor_name || 'N/A'}</p>
                  {item.bank_name && (
                    <p className="text-xs text-gray-400">Bank: {item.bank_name}</p>
                  )}
                  {item.rib && (
                    <code className="text-xs text-gray-400">RIB: {item.rib}</code>
                  )}
                  <p className="text-xs text-gray-500">Payments: {item.payments_count || 0}</p>
                </div>
                <p className="font-semibold">{(item.total_amount || 0).toFixed(2)} DH</p>
              </div>
            ))}
            <div className="flex justify-between font-bold text-lg pt-4">
              <span>Total:</span>
              <span>{items.reduce((sum, i) => sum + (i.total_amount || 0), 0).toFixed(2)} DH</span>
            </div>
            <div className="text-sm text-gray-500 mt-2">
              <p>Total Vendors: {items.length}</p>
              <p>Total Payments: {items.reduce((sum, i) => sum + (i.payments_count || 0), 0)}</p>
            </div>
          </div>
        )}

        <div className="mt-12">
          <h4 className="font-semibold mb-6">Signature Zone:</h4>
          <div className="grid grid-cols-3 gap-8">
            <div className="border-t-2 pt-2 mt-16">
              <p className="font-semibold">Prepared By</p>
            </div>
            <div className="border-t-2 pt-2 mt-16">
              <p className="font-semibold">Reviewed By</p>
            </div>
            <div className="border-t-2 pt-2 mt-16">
              <p className="font-semibold">Approved By</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default VendorPaymentReport;
