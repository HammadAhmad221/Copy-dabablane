import { useEffect, useState } from "react";
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
  DollarSignIcon,
  ActivityIcon,
  BookCheck,
  BookmarkCheck,
  BookmarkX,
  TicketCheck
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/admin/components/ui/tabs";
import { Progress } from "@/admin/components/ui/progress";
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
import { getAnalytics } from "@/admin/lib/api/services/Analytics";
import { Loader2 as Loader } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Pagination, PaginationContent, PaginationLink } from "@/admin/components/ui/pagination";

// Add this after the imports and before the interfaces
const animationVariants = {
  fadeIn: {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
      },
    },
  },
  slideIn: {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.3,
      },
    },
  },
};

interface AnalyticsRecord {
  id: number;
  metricName: string;
  metricValue: number;
  recordedAt: Date;
}

interface KPI {
  name: string;
  value: number;
  change: number;
  icon: React.ReactNode;
}

// Mock data
const mockAnalytics: AnalyticsRecord[] = [
  {
    id: 1,
    metricName: "Page Views",
    metricValue: 1500,
    recordedAt: new Date(),
  },
  // Add more mock data
];

// Mock chart data
const lineChartData = [
  { name: "Jan", value: 1200 },
  { name: "Feb", value: 1800 },
  { name: "Mar", value: 1600 },
  { name: "Apr", value: 2200 },
  { name: "May", value: 2800 },
  { name: "Jun", value: 2400 },
];

const barChartData = [
  { name: "Mon", value: 120 },
  { name: "Tue", value: 180 },
  { name: "Wed", value: 160 },
  { name: "Thu", value: 220 },
  { name: "Fri", value: 280 },
  { name: "Sat", value: 240 },
  { name: "Sun", value: 190 },
];

const pieChartData = [
  { name: "Desktop", value: 60 },
  { name: "Mobile", value: 30 },
  { name: "Tablet", value: 10 },
];

// Add proper type for the analytics data
interface AnalyticsItem {
  name: string;
  value: number | string;
  change?: number;
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

const Analytics = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMetric, setSelectedMetric] = useState<AnalyticsRecord | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterMetric, setFilterMetric] = useState<string>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [isRealTime, setIsRealTime] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Add loading state
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true); // Set loading to true before fetching data
      const data = await getAnalytics();
      setAnalyticsData(data);
      setIsLoading(false); // Set loading to false after data is fetched
    };
    fetchData();
  }, []);

  const handleExport = () => {
    const csvRows = [
      ['ID', 'Metric Name', 'Value', 'Recorded At'],
      ...mockAnalytics.map(record => [
        record.id,
        record.metricName,
        record.metricValue,
        format(record.recordedAt, "PPp"),
      ])
    ];

    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics_${format(new Date(), "yyyy-MM-dd")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredAnalytics = mockAnalytics.filter(record =>
    (filterMetric === "all" || record.metricName === filterMetric) &&
    record.metricName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedAnalytics = filteredAnalytics.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Helper functions to transform data for charts
  const prepareLineChartData = (data: AnalyticsItem[]) => {
    // Focus on Total Orders, Revenue, and Users over time
    return data
      .filter(item => 
        ['Total Orders', 'Total Revenue', 'Total Users'].includes(item.name))
      .map(item => ({
        name: item.name,
        value: typeof item.value === 'string' ? parseFloat(item.value) : item.value
      }));
  };

  const prepareBarChartData = (data: AnalyticsItem[]) => {
    // Focus on Blanes statistics
    return data
      .filter(item => 
        ['Active Blanes', 'Inactive Blanes', 'Expired Blanes', 'Near Expiration'].includes(item.name))
      .map(item => ({
        name: item.name,
        value: typeof item.value === 'string' ? parseFloat(item.value) : item.value
      }));
  };

  const preparePieChartData = (data: AnalyticsItem[]) => {
    // Get all Blanes data
    const activeBlanesData = data.find(item => item.name === 'Active Blanes')?.details || {};
    const inactiveBlanesData = data.find(item => item.name === 'Inactive Blanes')?.details || {};
    const expiredBlanesData = data.find(item => item.name === 'Expired Blanes')?.details || {};
    const nearExpirationData = data.find(item => item.name === 'Near Expiration')?.details || {};

    // Calculate total to ensure percentages add up to 100
    const total = [
      activeBlanesData.percentage_active || 0,
      inactiveBlanesData.percentage_inactive || 0,
      expiredBlanesData.percentage_expired || 0,
      nearExpirationData.percentage_near_expiration || 0
    ].reduce((sum, val) => sum + val, 0);

    // Only include non-zero values
    const pieData = [
      { name: 'Active', value: activeBlanesData.percentage_active || 0 },
      { name: 'Inactive', value: inactiveBlanesData.percentage_inactive || 0 },
      { name: 'Expired', value: expiredBlanesData.percentage_expired || 0 },
      { name: 'Near Expiration', value: nearExpirationData.percentage_near_expiration || 0 }
    ].filter(item => item.value > 0);

    return pieData;
  };

  return (
  <div className="space-y-6 max-w-[350px] lg:max-w-full w-full">
    <Card className="overflow-hidden">
      {/* Section En-tête - Mise à jour pour correspondre au style de MenuItems */}
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={animationVariants.fadeIn}
        className="p-3 sm:p-4 md:p-6 bg-gradient-to-r from-[#00897B] to-[#00796B]"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4">
          <div className="text-white w-full">
            <h2 className="text-xl sm:text-2xl font-bold">Tableau de bord analytique</h2>
            <p className="text-sm sm:text-base text-gray-100 mt-1">Surveillez les performances de votre site web</p>
          </div>
        </div>
      </motion.div>

      {/* Section des cartes KPI - Couleurs mises à jour */}
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={animationVariants.fadeIn}
        className="p-3 sm:p-4 md:p-6 grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4"
      >
        {analyticsData && analyticsData.slice(0, 8).map((kpi: AnalyticsItem, index: number) => {
          const iconMap: { [key: string]: React.ReactNode } = {
            "OrdersIcon": <EyeIcon className="h-5 w-5" />,
            "DollarSignIcon": <DollarSignIcon className="h-5 w-5" />,
            "UsersIcon": <UsersIcon className="h-5 w-5" />,
            "ReservationsIcon": <BookCheck className="h-5 w-5" />,
            "BlanesIcon": <BookmarkCheck className="h-5 w-5" />,
            "ExpiredBlanesIcon": <BookmarkX className="h-5 w-5" />,
            "CouponsIcon": <TicketCheck className="h-5 w-5" />,
            "ActiveBlanesIcon": <BookmarkCheck className="h-5 w-5" />,
            "InactiveBlanesIcon": <BookmarkX className="h-5 w-5" />,
            "NearExpirationIcon": <ActivityIcon className="h-5 w-5" />,
          };

          const Icon = iconMap[kpi.icon] || <ActivityIcon className="h-5 w-5" />;

          return (
            <Card key={index} className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="text-[#00897B]">
                  {Icon}
                </div>
                {kpi.change !== undefined && (
                  <div className={`text-xs sm:text-sm font-medium ${
                    kpi.change > 0 ? 'text-green-600' : kpi.change < 0 ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {kpi.change > 0 ? '+' : ''}{kpi.change}%
                  </div>
                )}
              </div>
              <div className="mt-2">
                <div className="text-lg sm:text-2xl font-bold">
                  {kpi.name === "Total Revenue"
                    ? `$${Number(kpi.value).toLocaleString(undefined, {minimumFractionDigits: 2})}`
                    : typeof kpi.value === 'number' 
                      ? kpi.value.toLocaleString()
                      : kpi.value}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">{kpi.name}</div>
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
                    {kpi.details.days_threshold && (
                      <div>Seuil de jours : {kpi.details.days_threshold}</div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </motion.div>

      {/* Section des graphiques */}
      <Card className="p-3 sm:p-4 md:p-6">
        <Tabs defaultValue="line">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 mb-4">
            <TabsList className="w-full sm:w-auto h-auto flex flex-wrap gap-1 sm:gap-0">
              <TabsTrigger value="line" className="h-9 px-2 sm:px-4 data-[state=active]:bg-[#00897B] data-[state=active]:text-white">
                <LineChartIcon className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Graphique en ligne</span>
              </TabsTrigger>
              <TabsTrigger value="bar" className="h-9 px-2 sm:px-4 data-[state=active]:bg-[#00897B] data-[state=active]:text-white">
                <BarChartIcon className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Graphique en barres</span>
              </TabsTrigger>
              <TabsTrigger value="pie" className="h-9 px-2 sm:px-4 data-[state=active]:bg-[#00897B] data-[state=active]:text-white">
                <PieChartIcon className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Graphique en camembert</span>
              </TabsTrigger>
            </TabsList>
            <div className="flex justify-end w-full sm:w-auto">
              <Button 
                variant="outline" 
                onClick={handleExport}
                className="h-9 px-2 sm:px-4 hover:bg-[#00897B]/10"
              >
                <DownloadIcon className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Exporter</span>
              </Button>
            </div>
          </div>

          <TabsContent value="line" className="h-[300px] sm:h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analyticsData ? prepareLineChartData(analyticsData) : []}>
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
          </TabsContent>

          <TabsContent value="bar" className="h-[300px] sm:h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsData ? prepareBarChartData(analyticsData) : []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#00897B">
                  {/* Ajouter des couleurs personnalisées pour différents statuts */}
                  {analyticsData && prepareBarChartData(analyticsData).map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`}
                      fill={
                        entry.name === 'Active Blanes' ? '#00897B' :
                        entry.name === 'Inactive Blanes' ? '#FFA726' :
                        entry.name === 'Expired Blanes' ? '#EF5350' :
                        '#42A5F5'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="pie" className="h-[300px] sm:h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analyticsData ? preparePieChartData(analyticsData) : []}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  label={({ name, value, percent }) => `${name} (${(percent * 100).toFixed(1)}%)`}
                  labelLine={true}
                >
                  {/* Ajouter des couleurs personnalisées pour différents statuts */}
                  {analyticsData && preparePieChartData(analyticsData).map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.name === 'Active' ? '#00897B' :
                        entry.name === 'Inactive' ? '#FFA726' :
                        entry.name === 'Expired' ? '#EF5350' :
                        '#42A5F5'
                      }
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
          </TabsContent>
        </Tabs>
      </Card>

      {/* Section Tableau de données - Couleur du spinner de chargement mise à jour */}
      <Card className="p-3 sm:p-4 md:p-6">
        <div className="space-y-3 sm:space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
            <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-4 w-full sm:w-auto">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-xs sm:text-sm sm:w-[180px]"
              />
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full text-xs sm:text-sm sm:w-[180px]"
              />
            </div>
            <div className="grid gap-2 sm:flex sm:gap-4 w-full sm:w-auto">
              <Input
                placeholder="Rechercher des métriques..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs sm:text-sm sm:max-w-sm"
              />
              <Select value={filterMetric} onValueChange={setFilterMetric}>
                <SelectTrigger className="w-full text-xs sm:text-sm sm:w-[180px]">
                  <SelectValue placeholder="Filtrer par métrique" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les métriques</SelectItem>
                  <SelectItem value="Page Views">Vues de page</SelectItem>
                  <SelectItem value="Sign-Ups">Inscriptions</SelectItem>
                  <SelectItem value="Conversions">Conversions</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="border rounded-md overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs sm:text-sm">Nom de la métrique</TableHead>
                  <TableHead className="text-xs sm:text-sm">Valeur</TableHead>
                  <TableHead className="text-xs sm:text-sm whitespace-nowrap">Enregistré le</TableHead>
                  <TableHead className="text-xs sm:text-sm w-[60px] sm:w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4">
                      <Loader className="w-6 h-6 animate-spin mx-auto text-[#00897B]" />
                    </TableCell>
                  </TableRow>
                ) : paginatedAnalytics.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4 text-sm text-gray-500">
                      Aucune donnée trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedAnalytics.map(record => (
                    <TableRow key={record.id}>
                      <TableCell className="text-xs sm:text-sm font-medium">{record.metricName}</TableCell>
                      <TableCell className="text-xs sm:text-sm">{record.metricValue}</TableCell>
                      <TableCell className="text-xs sm:text-sm whitespace-nowrap">
                        {format(new Date(record.recordedAt), "PPp")}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7 sm:h-9 sm:w-9"
                          onClick={() => {
                            setSelectedMetric(record);
                            setIsViewDialogOpen(true);
                          }}
                        >
                          <EyeIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex justify-end p-2 sm:p-4">
            <Pagination>
              <PaginationContent className="gap-1 sm:gap-2">
                <PaginationLink
                  isActive={currentPage === 1}
                  onClick={() => !isLoading && currentPage > 1 && setCurrentPage(prev => prev - 1)}
                  className={cn(
                    "text-xs sm:text-sm px-2 py-1 sm:px-4 sm:py-2",
                    (isLoading || currentPage === 1) ? "opacity-50 pointer-events-none" : "cursor-pointer",
                    "data-[active=true]:bg-[#00897B] data-[active=true]:text-white"
                  )}
                >
                  Précédent
                </PaginationLink>
                <PaginationLink
                  isActive={currentPage === Math.ceil(filteredAnalytics.length / itemsPerPage)}
                  onClick={() => !isLoading && currentPage < Math.ceil(filteredAnalytics.length / itemsPerPage) && 
                    setCurrentPage(prev => prev + 1)
                  }
                  className={cn(
                    "text-xs sm:text-sm px-2 py-1 sm:px-4 sm:py-2",
                    (isLoading || currentPage === Math.ceil(filteredAnalytics.length / itemsPerPage)) 
                      ? "opacity-50 pointer-events-none" 
                      : "cursor-pointer",
                    "data-[active=true]:bg-[#00897B] data-[active=true]:text-white"
                  )}
                >
                  Suivant
                </PaginationLink>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      </Card>

      {/* Dialogue de visualisation des métriques */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[425px] w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle>Détails de la métrique</DialogTitle>
          </DialogHeader>
          {selectedMetric && (
            <div className="space-y-4">
              <div>
                <label className="font-semibold">Nom de la métrique</label>
                <p>{selectedMetric.metricName}</p>
              </div>
              <div>
                <label className="font-semibold">Valeur</label>
                <p>{selectedMetric.metricValue}</p>
              </div>
              <div>
                <label className="font-semibold">Enregistré le</label>
                <p>{format(selectedMetric.recordedAt, "PPp")}</p>
              </div>
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setIsViewDialogOpen(false)}
                >
                  Fermer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  </div>
  );
};

export default Analytics;
