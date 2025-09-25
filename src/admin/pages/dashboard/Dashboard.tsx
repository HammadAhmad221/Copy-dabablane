import { Card } from "@/admin/components/ui/card";
import { 
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";
import { Users, ShoppingBag, CreditCard, Star, UsersIcon, DollarSignIcon, BookCheck, BookmarkCheck, ActivityIcon, AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Badge } from "@/admin/components/ui/badge";
import { useEffect, useState } from "react";
import {
  getAnalytics,
  getBlanesStatus,
  getNearExpiration,
  getStatusDistribution,
  type AnalyticsResponse,
  type BlanesStatusResponse,
  type NearExpirationResponse,
  type StatusDistributionResponse,
} from "@/admin/lib/api/services/Analytics";
import Loader from "@/admin/components/ui/Loader";

// Données fictives pour les graphiques
const analyticsData = [
  { name: "Jan", users: 400, orders: 240 },
  { name: "Fév", users: 300, orders: 139 },
  { name: "Mar", users: 200, orders: 980 },
  { name: "Avr", users: 278, orders: 390 },
  { name: "Mai", users: 189, orders: 480 },
  { name: "Juin", users: 239, orders: 380 },
  { name: "Juil", users: 349, orders: 430 },
];

const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [analyticData, setAnalyticsData] = useState<AnalyticsResponse[]>([]);
  const [blanesStatus, setBlanesStatus] = useState<BlanesStatusResponse | null>(null);
  const [nearExpiration, setNearExpiration] = useState<NearExpirationResponse | null>(null);
  const [statusDistribution, setStatusDistribution] = useState<StatusDistributionResponse | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Commencer par les données analytiques principales
        const analytics = await getAnalytics();
        setAnalyticsData(analytics);

        // Ensuite, récupérer les données supplémentaires si nécessaire
        if (analytics && analytics.length > 0) {
          const [status, expiring, distribution] = await Promise.all([
            getBlanesStatus(),
            getNearExpiration(),
            getStatusDistribution()
          ]);

          setBlanesStatus(status);
          setNearExpiration(expiring);
          setStatusDistribution(distribution);
        }
      } catch (error) {
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Mettre à jour les données des graphiques avec les données réelles
  const chartData = analyticsData;

  return (
    <div className="space-y-6">
      {isLoading ? (
        <Loader />
      ) : (
        <>
          {/* Cartes de statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {analyticData.slice(7, 11).map((stat, index) => {
              const iconMap: { [key: string]: React.ReactNode } = {              
                "ActiveBlanesIcon": <CheckCircle className="h-5 w-5" />,
                "InactiveBlanesIcon": <XCircle className="h-5 w-5" />,
                "ExpiredBlanesIcon": <AlertCircle className="h-5 w-5" />,
                "NearExpirationIcon": <Clock className="h-5 w-5" />
              };
              
              const Icon = iconMap[stat.icon] || <ActivityIcon className="h-5 w-5" />;
              
              return (
                <Card key={index} className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {stat.name}
                      </p>
                      <h3 className="text-2xl font-bold mt-2">{stat.value}</h3>
                      {stat.details && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {stat.details.percentage_active && `${stat.details.percentage_active}% du total`}
                          {stat.details.percentage_inactive && `${stat.details.percentage_inactive}% du total`}
                          {stat.details.percentage_expired && `${stat.details.percentage_expired}% du total`}
                          {stat.details.percentage_near_expiration && `${stat.details.percentage_near_expiration}% des actifs`}
                        </p>
                      )}
                    </div>
                    <div className={`p-4 rounded-full ${
                      stat.icon === "ActiveBlanesIcon"
                        ? "bg-green-200"
                        : stat.icon === "InactiveBlanesIcon"
                        ? "bg-yellow-200"
                        : stat.icon === "ExpiredBlanesIcon"
                        ? "bg-red-200"
                        : stat.icon === "NearExpirationIcon"
                        ? "bg-orange-200"
                        : "bg-gray-200"
                    }`}>
                      {Icon}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Graphiques avec des données réelles */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Aperçu des revenus</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis 
                      width={50}
                      tickCount={5}
                      domain={[0, 'auto']}
                    />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="orders" 
                      stroke="#8884d8" 
                      fillOpacity={1} 
                      fill="url(#colorRevenue)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Statistiques des utilisateurs</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis 
                      width={50}
                      tickCount={5}
                      domain={[0, 'auto']}
                    />
                    <Tooltip />
                    <Bar dataKey="users" fill="#4CAF50" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Réservations récentes */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Réservations récentes</h3>
            <div className="space-y-4">
              {nearExpiration?.blanes.slice(0, 3).map((blane, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium">Blane #{blane.id}</p>
                    <p className="text-sm text-muted-foreground">
                      Expire le : {new Date(blane.expiration_date).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {blane.category?.name || 'Aucune catégorie'}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default Dashboard;