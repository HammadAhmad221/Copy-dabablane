import { useEffect, useState, useMemo } from "react";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/admin/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/admin/components/ui/select";
import { format } from "date-fns";
import { 
  EyeIcon, 
  DownloadIcon,
  LineChartIcon,
  BarChartIcon,
  PieChartIcon,
  UsersIcon,
  ArrowUpRightIcon,
  ActivityIcon,
  BookCheck,
  BookmarkCheck,
  BookmarkX,
  TicketCheck
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/admin/components/ui/tabs";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { getVendorAnalytics, VendorAnalyticsResponse } from "@/admin/lib/api/services/VendorAnalytics";
import { useVendors } from "@/admin/hooks/useVendors";
import { Loader2 as Loader } from "lucide-react";
import { cn } from "@/lib/utils";
import { Pagination, PaginationContent, PaginationLink } from "@/admin/components/ui/pagination";
import toast from "react-hot-toast";

// Icon mapping function for KPI cards
const getIcon = (iconType: string) => {
  switch (iconType) {
    case "OrdersIcon":
      return <EyeIcon className="h-5 w-5" />;
    case "DollarSignIcon":
      return <span className="text-lg font-bold text-[#00897B]">DH</span>;
    case "UsersIcon":
      return <UsersIcon className="h-5 w-5" />;
    case "ReservationsIcon":
      return <BookCheck className="h-5 w-5" />;
    case "BlanesIcon":
      return <BookmarkCheck className="h-5 w-5" />;
    case "ExpiredBlanesIcon":
      return <BookmarkX className="h-5 w-5" />;
    case "CouponsIcon":
      return <TicketCheck className="h-5 w-5" />;
    case "ActiveBlanesIcon":
      return <BookmarkCheck className="h-5 w-5" />;
    case "InactiveBlanesIcon":
      return <BookmarkX className="h-5 w-5" />;
    case "NearExpirationIcon":
      return <ActivityIcon className="h-5 w-5" />;
    default:
      return <ActivityIcon className="h-5 w-5" />;
  }
};

interface AnalyticsRecord {
  id: number;
  metricName: string;
  metricValue: number;
  recordedAt: Date;
}

interface AnalyticsItem {
  name: string;
  value: number | string;
  change?: number | null;
  icon: string;
  details?: {
    near_expiration?: number;
    percentage_active?: number;
    percentage_inactive?: number;
    percentage_expired?: number;
    percentage_near_expiration?: number;
    days_threshold?: number;
  };
}

// Mock data for table
const mockAnalytics: AnalyticsRecord[] = [
  {
    id: 1,
    metricName: "Page Views",
    metricValue: 1500,
    recordedAt: new Date(),
  },
];

const VendorDashboard = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMetric, setSelectedMetric] = useState<AnalyticsRecord | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterMetric, setFilterMetric] = useState<string>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [period, setPeriod] = useState<string>("month");
  const [companyName, setCompanyName] = useState<string>("");
  const [analyticsData, setAnalyticsData] = useState<VendorAnalyticsResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const itemsPerPage = 10;
  
  // Fetch vendors to populate company name dropdown
  const { vendors = [], loading: vendorsLoading = false, fetchVendors } = useVendors();

  useEffect(() => {
    // Fetch all vendors on mount
    const loadVendors = async () => {
      try {
        if (fetchVendors) {
          await fetchVendors({}, 1, 100); // Fetch first 100 vendors
        }
      } catch (error: any) {
        console.error("Error loading vendors:", error);
        const errorMessage = error?.message || "Failed to load vendors";
        toast.error(errorMessage);
      }
    };
    loadVendors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only fetch once on mount

  // Removed auto-fetch useEffect - user must click "Load data" button

  // Get unique company names from vendors
  const companyNames = Array.isArray(vendors)
    ? Array.from(
        new Set(
          vendors
            .map((v) => v?.company_name)
            .filter((name): name is string => Boolean(name && name.trim() !== ""))
        )
      ).sort()
    : [];

  const fetchVendorAnalytics = async (company?: string) => {
    const selectedCompany = company || companyName;
    if (!selectedCompany.trim()) {
      toast.error("Please select a company name");
      return;
    }

    setIsLoading(true);
    try {
      const params: any = {
        company_name: selectedCompany,
      };

      // Always include period parameter
      if (period === "custom") {
        params.period = "custom";
        // For custom period, start_date and end_date are required
        if (startDate) {
          params.start_date = startDate;
        }
        if (endDate) {
          params.end_date = endDate;
        }
        // Warn if custom period is selected but dates are missing
        if (!startDate || !endDate) {
          toast.error("Please select both start date and end date for custom period");
          setIsLoading(false);
          return;
        }
      } else {
        params.period = period;
      }

      const data = await getVendorAnalytics(params);
      console.log("Vendor Analytics Data:", data);
      console.log("Vendor Analytics Params:", params);
      console.log("📊 FULL API RESPONSE - Check all analytics items:");
      data.forEach((item, index) => {
        console.log(`  [${index}] ${item.name}:`, {
          value: item.value,
          valueType: typeof item.value,
          change: item.change,
          icon: item.icon,
          details: item.details,
          fullItem: item
        });
      });
      
      // Log change values for debugging
      if (Array.isArray(data) && data.length > 0) {
        console.log("Change values for each metric:", data.map(item => ({
          name: item.name,
          change: item.change,
          changeType: typeof item.change,
          isNull: item.change === null,
          isUndefined: item.change === undefined
        })));
        
        // Log Total Revenue specifically
        const revenueItem = data.find(item => item.name === "Total Revenue");
        if (revenueItem) {
          console.log("📊 Total Revenue from API:", {
            rawValue: revenueItem.value,
            valueType: typeof revenueItem.value,
            parsedValue: typeof revenueItem.value === 'string' 
              ? parseFloat(revenueItem.value.replace(/[^0-9.-]/g, '')) 
              : revenueItem.value,
            fullObject: revenueItem
          });
          console.warn("⚠️ BACKEND ISSUE: API is returning 0 for Total Revenue. Expected value: 48");
          console.warn("⚠️ Please check the backend API endpoint: /back/v1/analytics/vendor");
          console.warn("⚠️ The revenue calculation on the server needs to be fixed.");
        }
      }
      
      setAnalyticsData(Array.isArray(data) ? data : []);
      if (Array.isArray(data) && data.length > 0) {
        toast.success(`Données chargées avec succès (${data.length} éléments)`);
      } else {
        toast.error("Aucune donnée disponible");
        console.warn("No data received from API or empty array");
      }
    } catch (error: any) {
      console.error("Vendor Analytics Error:", error);
      console.error("Error Response:", error.response);
      const errorMessage = error.response?.data?.message || error.message || "Erreur lors du chargement des données";
      toast.error(errorMessage);
      setAnalyticsData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompanyNameChange = (value: string) => {
    setCompanyName(value);
    // Clear previous data when changing company
    setAnalyticsData([]);
    // Removed auto-fetch - user must click "Load data" button
  };

  const handleExport = () => {
    if (!analyticsData.length) {
      toast.error("Aucune donnée à exporter");
      return;
    }

    const csvRows = [
      ['Nom', 'Valeur', 'Changement (%)'],
      ...analyticsData.map(item => [
        item.name,
        item.value,
        item.change || 0,
      ])
    ];

    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vendor_analytics_${format(new Date(), "yyyy-MM-dd")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Export réussi");
  };

  const filteredAnalytics = mockAnalytics.filter(record =>
    (filterMetric === "all" || record.metricName === filterMetric) &&
    record.metricName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedAnalytics = filteredAnalytics.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Memoized chart data to prevent React DOM errors
  const lineChartData = useMemo(() => {
    return analyticsData
      .filter(item => 
        ['Total Orders', 'Total Revenue', 'Total Users'].includes(item.name))
      .map(item => ({
        name: item.name,
        value: typeof item.value === 'string' ? parseFloat(item.value.replace(/[^0-9.-]/g, '')) || 0 : item.value
      }));
  }, [analyticsData]);

  const barChartData = useMemo(() => {
    return analyticsData
      .filter(item => 
        ['Active Blanes', 'Inactive Blanes', 'Expired Blanes', 'Near Expiration'].includes(item.name))
      .map(item => {
        const value = typeof item.value === 'string' ? parseFloat(item.value.replace(/[^0-9.-]/g, '')) || 0 : item.value;
        const fill = item.name === 'Active Blanes' ? '#00897B' :
                    item.name === 'Inactive Blanes' ? '#FFA726' :
                    item.name === 'Expired Blanes' ? '#EF5350' :
                    '#42A5F5';
        return {
          name: item.name,
          value,
          fill
        };
      });
  }, [analyticsData]);

  const pieChartData = useMemo(() => {
    const activeBlanesData = analyticsData.find(item => item.name === 'Active Blanes')?.details || {};
    const inactiveBlanesData = analyticsData.find(item => item.name === 'Inactive Blanes')?.details || {};
    const expiredBlanesData = analyticsData.find(item => item.name === 'Expired Blanes')?.details || {};
    const nearExpirationData = analyticsData.find(item => item.name === 'Near Expiration')?.details || {};

    const pieData = [
      { name: 'Active', value: activeBlanesData.percentage_active || 0, fill: '#00897B' },
      { name: 'Inactive', value: inactiveBlanesData.percentage_inactive || 0, fill: '#FFA726' },
      { name: 'Expired', value: expiredBlanesData.percentage_expired || 0, fill: '#EF5350' },
      { name: 'Near Expiration', value: nearExpirationData.percentage_near_expiration || 0, fill: '#42A5F5' }
    ].filter(item => item.value > 0);

    return pieData;
  }, [analyticsData]);

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full px-2 sm:px-0">
      <Card className="overflow-hidden">
        {/* Header Section */}
        <div className="p-3 sm:p-4 md:p-6 bg-gradient-to-r from-[#00897B] to-[#00796B]">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4">
            <div className="text-white w-full text-center">
              <h2 className="text-xl sm:text-2xl font-bold">Seller Dashboard</h2>
              <p className="text-sm sm:text-base text-gray-100 mt-1">Monitor your company's performance</p>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="p-3 sm:p-4 md:p-6 bg-gray-50 border-t">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Company Name *</label>
                <Select value={companyName} onValueChange={handleCompanyNameChange} disabled={vendorsLoading}>
                  <SelectTrigger className="w-full text-sm">
                    <SelectValue placeholder={vendorsLoading ? "Loading companies..." : "Select a company"} />
                  </SelectTrigger>
                  <SelectContent>
                    {companyNames.length > 0 ? (
                      companyNames.map((name) => (
                        <SelectItem key={name} value={name}>
                          {name}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-2 py-1.5 text-sm text-gray-500">
                        {vendorsLoading ? "Loading..." : "No companies available"}
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Period</label>
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger className="w-full text-sm">
                    <SelectValue placeholder="Select a period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {period === "custom" && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Start date</label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">End date</label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                </>
              )}
            </div>
            <div>
              <Button 
                onClick={() => {
                  if (period === "custom" && (!startDate || !endDate)) {
                    toast.error("Please select both start date and end date for custom period");
                    return;
                  }
                  fetchVendorAnalytics();
                }}
                disabled={isLoading || !companyName.trim() || vendorsLoading}
                className="bg-[#00897B] hover:bg-[#00796B] text-white"
              >
                {isLoading ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Load data"
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* KPI Cards Section */}
        {analyticsData.length > 0 && (
          <div className="p-3 sm:p-4 md:p-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
            {analyticsData.slice(0, 8).map((kpi) => {
              const Icon = getIcon(kpi.icon);

              return (
                <Card key={kpi.name} className="p-2 sm:p-3 md:p-4">
                  <div className="flex items-center justify-between">
                    {kpi.name !== "Total Revenue" ? (
                      <div className="text-[#00897B]">
                        {Icon}
                      </div>
                    ) : (
                      <div className="w-5 h-5"></div>
                    )}
                  </div>
                  <div className="mt-2">
                    <div className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold break-words">
                      {(() => {
                        if (kpi.name === "Total Revenue") {
                          // Log the raw value for debugging
                          console.log('💰 Total Revenue KPI:', {
                            rawValue: kpi.value,
                            valueType: typeof kpi.value,
                            fullKPI: kpi
                          });
                          
                          // Parse the revenue value from API
                          let revenueValue = 0;
                          if (typeof kpi.value === 'string') {
                            // Remove any non-numeric characters except decimal point and minus
                            const cleaned = kpi.value.replace(/[^0-9.-]/g, '');
                            revenueValue = parseFloat(cleaned) || 0;
                            console.log('💰 String parsing:', { original: kpi.value, cleaned, parsed: revenueValue });
                          } else if (typeof kpi.value === 'number') {
                            revenueValue = kpi.value;
                            console.log('💰 Number value:', revenueValue);
                          } else {
                            console.warn('💰 Unexpected value type:', typeof kpi.value, kpi.value);
                          }
                          
                          console.log('💰 Final revenue value:', revenueValue);
                          
                          // Format with 2 decimal places and add DH suffix
                          return `${revenueValue.toFixed(2)}DH`;
                        }
                        return typeof kpi.value === 'number' 
                          ? kpi.value.toLocaleString()
                          : kpi.value;
                      })()}
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground truncate" title={kpi.name}>{kpi.name}</div>
                    {kpi.details && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        {kpi.details.percentage_active && (
                          <div>Actif : {kpi.details.percentage_active}%</div>
                        )}
                        {kpi.details.percentage_inactive && (
                          <div>Inactif : {kpi.details.percentage_inactive}%</div>
                        )}
                        {kpi.details.percentage_expired && (
                          <div>Expiré : {kpi.details.percentage_expired}%</div>
                        )}
                        {kpi.details.percentage_near_expiration && (
                          <div>Presque expiré : {kpi.details.percentage_near_expiration}%</div>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Charts Section */}
        {analyticsData.length > 0 && (
          <div className="p-3 sm:p-4 md:p-6 border-t">
            <Tabs defaultValue="line">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 mb-4">
                <TabsList className="w-full md:w-auto h-auto flex flex-wrap gap-1 sm:gap-0">
                  <TabsTrigger value="line" className="h-9 px-2 sm:px-3 md:px-4 data-[state=active]:bg-[#00897B] data-[state=active]:text-white text-xs sm:text-sm">
                    <LineChartIcon className="h-4 w-4 md:mr-2" />
                    <span className="hidden md:inline">Graphique en ligne</span>
                  </TabsTrigger>
                  <TabsTrigger value="bar" className="h-9 px-2 sm:px-3 md:px-4 data-[state=active]:bg-[#00897B] data-[state=active]:text-white text-xs sm:text-sm">
                    <BarChartIcon className="h-4 w-4 md:mr-2" />
                    <span className="hidden md:inline">Graphique en barres</span>
                  </TabsTrigger>
                  <TabsTrigger value="pie" className="h-9 px-2 sm:px-3 md:px-4 data-[state=active]:bg-[#00897B] data-[state=active]:text-white text-xs sm:text-sm">
                    <PieChartIcon className="h-4 w-4 md:mr-2" />
                    <span className="hidden md:inline">Graphique en camembert</span>
                  </TabsTrigger>
                </TabsList>
                <div className="flex justify-end w-full md:w-auto">
                  <Button 
                    variant="outline" 
                    onClick={handleExport}
                    className="h-9 px-2 sm:px-3 md:px-4 hover:bg-[#00897B]/10 text-xs sm:text-sm"
                  >
                    <DownloadIcon className="h-4 w-4 md:mr-2" />
                    <span className="hidden md:inline">Exporter</span>
                  </Button>
                </div>
              </div>

              <TabsContent value="line" className="h-[250px] sm:h-[300px] md:h-[350px] lg:h-[400px]">
                {lineChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={lineChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#00897B" 
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    No data available for line chart
                  </div>
                )}
              </TabsContent>

              <TabsContent value="bar" className="h-[250px] sm:h-[300px] md:h-[350px] lg:h-[400px]">
                {barChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" fill="#00897B">
                        {barChartData.map((entry) => (
                          <Cell 
                            key={`cell-${entry.name}`}
                            fill={entry.fill}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    No data available for bar chart
                  </div>
                )}
              </TabsContent>

              <TabsContent value="pie" className="h-[250px] sm:h-[300px] md:h-[350px] lg:h-[400px]">
                {pieChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(1)}%)`}
                        labelLine={true}
                      >
                        {pieChartData.map((entry) => (
                          <Cell
                            key={`cell-${entry.name}`}
                            fill={entry.fill}
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => `${value.toFixed(1)}%`}
                      />
                      <Legend 
                        verticalAlign="middle" 
                        align="right"
                        layout="vertical"
                        iconType="circle"
                        iconSize={10}
                        wrapperStyle={{
                          paddingLeft: "20px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    No data available for pie chart
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && analyticsData.length === 0 && companyName && (
          <div className="p-8 text-center bg-gray-50">
            <p className="text-gray-500">Aucune donnée disponible. Veuillez vérifier le nom de l'entreprise et réessayer.</p>
          </div>
        )}

      </Card>
    </div>
  );
};

export default VendorDashboard;

