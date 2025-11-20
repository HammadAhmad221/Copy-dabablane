import { useState, useEffect, useCallback } from "react";
import { Card } from "@/admin/components/ui/card";
import { Input } from "@/admin/components/ui/input";
import { Button } from "@/admin/components/ui/button";
import { Badge } from "@/admin/components/ui/badge";
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
  DialogFooter,
  DialogDescription,
} from "@/admin/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/admin/components/ui/alert-dialog";
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
  TrashIcon, 
  PencilIcon, 
  PlusIcon, 
  DownloadIcon,
  SearchIcon,
  MoreVerticalIcon,
} from "lucide-react";
import { reservationApi } from "@/admin/lib/api/services/reservationService";
import { blaneApi } from "@/admin/lib/api/services/blaneService";
import { cityApi } from "@/admin/lib/api/services/cityService";
import { userApi } from "@/admin/lib/api/services/userService";
import { User } from "@/admin/lib/api/types/user";
import { ReservationFormData, ReservationType } from "@/lib/types/reservations";
import { Blane } from "@/lib/types/blane";
import { City } from "@/lib/types/city";
import { toast } from "react-hot-toast";
import { z } from "zod";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/admin/components/ui/pagination";
import { debounce } from "lodash";
import { Label } from "@/admin/components/ui/label";
import { Textarea } from "@/admin/components/ui/textarea";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { read, utils, writeFile } from 'xlsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/admin/components/ui/tabs";
import { useDropzone } from 'react-dropzone';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/admin/components/ui/tooltip";
import {CustomerService} from "@/admin/lib/api/services/customerService";
import { Customer } from "@/admin/lib/api/types/customer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/admin/components/ui/dropdown-menu";

// Update the form validation schema
const reservationSchema = z.object({
  blane_id: z.number().min(1, "Blane is required"),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone is required").max(20, "Phone number too long"),
  city: z.string().min(1, "City is required"),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required").refine(
    (time) => {
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      return timeRegex.test(time);
    },
    "Time must be in 24-hour format (HH:mm)"
  ),
  comments: z.string().optional().default(""),
  status: z.enum(["pending", "confirmed", "cancelled", "paid"]),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  total_price: z.number().min(0, "Total price must be positive"),
  number_persons: z.number().min(0, "Number of persons must be positive"),
});

type FormData = z.infer<typeof reservationSchema>;

// Add these animation variants after the imports
const animationVariants = {
  fadeIn: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -20 }
  },
  slideIn: {
    hidden: { x: -20, opacity: 0 },
    visible: { x: 0, opacity: 1, transition: { duration: 0.3 } },
    exit: { x: 20, opacity: 0 }
  }
};

// Add this animation variant
const popupAnimationVariants = {
  overlay: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  },
  content: {
    hidden: { 
      opacity: 0, 
      scale: 0.95, 
      y: 20 
    },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: {
        type: "spring",
        duration: 0.3,
        bounce: 0.25
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.95, 
      y: 20 
    }
  }
};

// Add these type definitions at the top
type TooltipProps = {
  children: React.ReactNode;
  content: string;
};

// Update the InfoField component
const InfoField = ({ 
  label, 
  value, 
  icon,
  fullWidth = false,
  wrapText = false
}: { 
  label: string; 
  value: React.ReactNode; 
  icon?: React.ReactNode;
  fullWidth?: boolean;
  wrapText?: boolean;
}) => (
  <motion.div 
    className={`bg-white rounded-lg p-4 shadow-sm border ${fullWidth ? 'col-span-full' : ''}`}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <div className="flex items-start gap-3">
      {icon && <div className="text-gray-400 mt-1 flex-shrink-0">{icon}</div>}
      <div className="flex-1 min-w-0">
        <label className="block text-sm font-medium text-gray-500 mb-1">
          {label}
        </label>
        <div className={cn(
          "text-gray-900 font-medium",
          wrapText ? "break-words" : "truncate",
          fullWidth && "whitespace-pre-wrap"
        )}>
          {value}
        </div>
      </div>
    </div>
  </motion.div>
);

const Reservations: React.FC = () => {
  // State for reservations and pagination
  const [reservations, setReservations] = useState<ReservationType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    perPage: 10,
    total: 0,
    lastPage: 1,
  });

  // State for blanes and cities
  const [blanes, setBlanes] = useState<Blane[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  // State for search and sorting
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<string | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | undefined>(undefined);

  // State for reservation form
  const [selectedReservation, setSelectedReservation] = useState<ReservationType | null>(null);
  const [isAddEditDialogOpen, setIsAddEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState<ReservationFormData>({
    blane_id: 0,
    name: "",
    email: "",
    phone: "",
    city: "",
    date: format(new Date(), "yyyy-MM-dd"),
    time: format(new Date(), "HH:mm"),
    comments: "",
    status: "pending",
    quantity: 1,
    total_price: 0,
    number_persons: 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Add this state at the top with other states
  const [blaneSearch, setBlaneSearch] = useState("");

  // Add this with other state declarations at the top of the component
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  // Update the status filter state
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [userFilter, setUserFilter] = useState<string>("all");

  // Add this state for managing dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Fetch blanes, cities, users, and customers
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [blanesResponse, citiesResponse, usersResponse, customersResponse] = await Promise.all([
          blaneApi.getBlanesByType('reservation'),
          cityApi.getCities(),
          userApi.getUsers({ paginationSize: 9999 }),
          CustomerService.getAll(),
        ]);
        setBlanes(blanesResponse.data);
        setCities(citiesResponse.data);
        setUsers(usersResponse.data);
        setCustomers(customersResponse.data);
      } catch (error) {
        toast.error("Failed to fetch necessary data");
      }
    };
    fetchData();
  }, []);

  // Fetch reservations with pagination, sorting, and filtering
  const fetchReservations = useCallback(async () => {
    setIsLoading(true);
    try {
      // Get selected user and find matching customers
      const selectedUser = userFilter !== "all" ? users.find(u => u.id === userFilter) : null;
      let customerIds: number[] = [];
      const userEmail = selectedUser?.email;
      const userName = selectedUser?.name;
      
      if (selectedUser && userEmail) {
        // Find customers that match the user's email AND name (more precise matching)
        const matchingCustomers = customers.filter(c => {
          const emailMatch = c.email?.toLowerCase() === userEmail.toLowerCase();
          // If user has a name, also match by name for precision
          if (userName) {
            const nameMatch = c.name?.toLowerCase() === userName.toLowerCase();
            return emailMatch && nameMatch;
          }
          // Fallback to email-only if no name
          return emailMatch;
        });
        customerIds = matchingCustomers.map(c => c.id);
      }

      // When filtering by user, fetch all matching reservations first, then paginate client-side
      // Otherwise, use normal server-side pagination
      const response = await reservationApi.getReservations({
        page: userEmail ? 1 : pagination.currentPage, // Always fetch page 1 when filtering by user
        paginationSize: userEmail ? 9999 : pagination.perPage, // Fetch all when filtering by user
        sortBy,
        sortOrder,
        search: searchTerm || undefined,
        ...(statusFilter !== "all" && { status: statusFilter }),
      });

      // Filter by user if a user is selected
      let filteredData = response.data;
      if (userEmail) {
        // Use precise matching: match by customer IDs first, then fallback to email+name matching
        filteredData = response.data.filter(reservation => {
          // First priority: match by customer ID (most precise)
          if (customerIds.length > 0 && customerIds.includes(reservation.customers_id)) {
            return true;
          }
          
          // Second priority: match by email AND name (if both are available)
          const emailMatch = reservation.email?.toLowerCase() === userEmail.toLowerCase();
          if (userName && reservation.name) {
            const nameMatch = reservation.name?.toLowerCase() === userName.toLowerCase();
            return emailMatch && nameMatch;
          }
          
          // Fallback: match by email only (if no name available)
          return emailMatch;
        });
        
        // Apply client-side pagination after filtering
        const startIndex = (pagination.currentPage - 1) * pagination.perPage;
        const endIndex = startIndex + pagination.perPage;
        filteredData = filteredData.slice(startIndex, endIndex);
      }

      setReservations(filteredData);
      
      // Update pagination metadata
      if (userEmail) {
        // Calculate total filtered count using the same logic as filtering
        const totalFiltered = response.data.filter(reservation => {
          // First priority: match by customer ID
          if (customerIds.length > 0 && customerIds.includes(reservation.customers_id)) {
            return true;
          }
          
          // Second priority: match by email AND name
          const emailMatch = reservation.email?.toLowerCase() === userEmail.toLowerCase();
          if (userName && reservation.name) {
            const nameMatch = reservation.name?.toLowerCase() === userName.toLowerCase();
            return emailMatch && nameMatch;
          }
          
          // Fallback: match by email only
          return emailMatch;
        }).length;
        
        setPagination({
          currentPage: pagination.currentPage,
          perPage: pagination.perPage,
          total: totalFiltered,
          lastPage: Math.max(1, Math.ceil(totalFiltered / pagination.perPage)),
        });
      } else {
        // Use server-side pagination metadata
        setPagination({
          currentPage: response.meta.current_page,
          perPage: response.meta.per_page,
          total: response.meta.total,
          lastPage: response.meta.last_page,
        });
      }
    } catch (error) {
      toast.error("Failed to fetch reservations");
    } finally {
      setIsLoading(false);
    }
  }, [pagination.currentPage, pagination.perPage, sortBy, sortOrder, searchTerm, statusFilter, userFilter, users, customers]);

  // Initial fetch
  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  // Handle search with debounce
  const handleSearch = debounce((term: string) => {
    setSearchTerm(term);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, 500);

  // Handle page change
  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  // Handle sort
  const handleSort = (column: string) => {
    const newSortOrder = sortBy === column && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortBy(column);
    setSortOrder(newSortOrder);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      // Format the time to ensure HH:mm format
      const formattedTime = formData.time.split(':')
        .map(part => part.padStart(2, '0'))
        .slice(0, 2) // Ensure we only get HH:mm
        .join(':');

      const validatedData = {
        ...formData,
        time: formattedTime,
        date: format(new Date(formData.date), "yyyy-MM-dd"),
        comments: formData.comments || "",
      };
      
      const parsedData = reservationSchema.parse(validatedData);

      if (selectedReservation) {
        await reservationApi.updateReservation(selectedReservation.id.toString(), parsedData);
        toast.success("Reservation updated successfully");
      } else {
        await reservationApi.createReservation(parsedData);
        toast.success("Reservation created successfully");
      }

      setIsAddEditDialogOpen(false);
      resetForm();
      fetchReservations();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMap: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path) {
            errorMap[err.path[0]] = err.message;
          }
        });
        setErrors(errorMap);
        toast.error("Please fix the errors in the form.");
      } else {
        toast.error("Failed to save reservation");
      }
    }
  };

  // Handle delete
  const handleDelete = async (id: number) => {
    try {
      await reservationApi.deleteReservation(id.toString());
      toast.success("Reservation deleted successfully");
      fetchReservations();
      setIsDeleteDialogOpen(false); // Close dialog after successful deletion
    } catch (error) {
      toast.error("Failed to delete reservation");
    }
  };

  // Handle status change
  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  // Handle user filter change
  const handleUserFilterChange = (value: string) => {
    setUserFilter(value);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const resetForm = () => {
    setFormData({
      blane_id: 0,
      name: "",
      email: "",
      phone: "",
      city: "",
      date: format(new Date(), "yyyy-MM-dd"),
      time: format(new Date(), "HH:mm"),
      comments: "",
      status: "pending",
      quantity: 1,
      total_price: 0,
      number_persons: 0,
    });
    setSelectedReservation(null);
    setErrors({});
    setIsViewDialogOpen(false);
  };

  // Status badge styles
  const getStatusStyle = (status: "pending" | "confirmed" | "cancelled" | "paid") => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100/80";
      case "confirmed":
        return "bg-green-100 text-green-800 hover:bg-green-100/80";
      case "cancelled":
        return "bg-red-100 text-red-800 hover:bg-red-100/80";
      case "paid":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100/80";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100/80";
    }
  };

  // Add this function to fetch all reservations for export
  const fetchAllReservations = async () => {
    try {
      // Get selected user and find matching customers
      const selectedUser = userFilter !== "all" ? users.find(u => u.id === userFilter) : null;
      let customerIds: number[] = [];
      const userEmail = selectedUser?.email;
      const userName = selectedUser?.name;
      
      if (selectedUser && userEmail) {
        // Find customers that match the user's email AND name (more precise matching)
        const matchingCustomers = customers.filter(c => {
          const emailMatch = c.email?.toLowerCase() === userEmail.toLowerCase();
          // If user has a name, also match by name for precision
          if (userName) {
            const nameMatch = c.name?.toLowerCase() === userName.toLowerCase();
            return emailMatch && nameMatch;
          }
          // Fallback to email-only if no name
          return emailMatch;
        });
        customerIds = matchingCustomers.map(c => c.id);
      }

      const response = await reservationApi.getReservations({
        page: 1,
        paginationSize: 999999, // Large number to get all reservations
        sortBy,
        sortOrder,
        search: searchTerm || undefined,
        ...(statusFilter !== "all" && { status: statusFilter }),
      });

      // Filter by user if a user is selected
      if (userEmail) {
        // Use precise matching: match by customer IDs first, then fallback to email+name matching
        return response.data.filter(reservation => {
          // First priority: match by customer ID
          if (customerIds.length > 0 && customerIds.includes(reservation.customers_id)) {
            return true;
          }
          
          // Second priority: match by email AND name
          const emailMatch = reservation.email?.toLowerCase() === userEmail.toLowerCase();
          if (userName && reservation.name) {
            const nameMatch = reservation.name?.toLowerCase() === userName.toLowerCase();
            return emailMatch && nameMatch;
          }
          
          // Fallback: match by email only
          return emailMatch;
        });
      }
      
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch all reservations');
    }
  };

  // Update the handleExport function
  const handleExport = async () => {
    try {
      const loadingToast = toast.loading('Preparing export...');
      
      const allReservations = await fetchAllReservations();
      
      const exportData = allReservations.map(reservation => {
        const blane = blanes.find(b => b.id === reservation.blane_id);
        const city = cities.find(c => c.id === reservation.city_id);

        return {
          "id": reservation.id,
          "blane": blane?.name || '',
          "city": city?.name || '',
          "date": format(new Date(reservation.date), "yyyy-MM-dd"),
          "time": reservation.time,
          "phone": reservation.phone,
          "comments": reservation.comments || "",
          "status": reservation.status,
          "created_at": format(new Date(reservation.created_at), "yyyy-MM-dd'T'HH:mm:ss.SSSXXX"),
          "updated_at": format(new Date(reservation.updated_at), "yyyy-MM-dd'T'HH:mm:ss.SSSXXX")
        };
      });

      const ws = utils.json_to_sheet(exportData);
      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, "Reservations");

      // Set column widths
      ws['!cols'] = [
        { width: 8 },   // id
        { width: 30 },  // blane name
        { width: 20 },  // city name
        { width: 20 },  // date
        { width: 15 },  // time
        { width: 15 },  // phone
        { width: 30 },  // comments
        { width: 1 },  // status
        { width: 25 },  // created_at
        { width: 25 }   // updated_at
      ];

      const fileName = `reservations_export_${format(new Date(), "yyyy-MM-dd")}.xlsx`;
      writeFile(wb, fileName);
      
      toast.dismiss(loadingToast);
      toast.success(`Successfully exported ${allReservations.length} reservations`);
    } catch (error) {
      toast.error("Failed to export data");
    }
  };

  // First, add this new function to handle status updates
  const handleStatusUpdate = async (id: number, newStatus: "pending" | "confirmed" | "cancelled" | "paid") => {
    try {
      await reservationApi.updateReservationStatus(id.toString(), newStatus);
      toast.success("Status updated successfully");
      fetchReservations();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  // Update the handlePageChange function
  const handlePerPageChange = (value: string) => {
    setPagination(prev => ({ 
                        ...prev,
      perPage: parseInt(value), 
      currentPage: 1 
    }));
  };

  // Update where we handle setting form data from existing reservation
  const handleEditReservation = (reservation: ReservationType) => {
    setSelectedReservation(reservation);
    setFormData({
      blane_id: reservation.blane_id,
      name: reservation.name,
      email: reservation.email,
      phone: reservation.phone,
      city: reservation.city,
      date: format(new Date(reservation.date), "yyyy-MM-dd"),
      time: reservation.time.substring(0, 5),
      comments: reservation.comments || "",
      status: reservation.status,
      quantity: reservation.quantity,
      total_price: reservation.total_price,
      number_persons: reservation.number_persons,
    });
    setIsAddEditDialogOpen(true);
  };

  // Add function to calculate total price
  const calculateTotalPrice = useCallback((blaneId: number, quantity: number) => {
    const selectedBlane = blanes.find(b => b.id === blaneId);
    if (selectedBlane) {
      const basePrice = selectedBlane.price_current * quantity;
      const tvaAmount = basePrice * (selectedBlane.tva / 100);
      return basePrice + tvaAmount;
    }
    return 0;
  }, [blanes]);

  // Update the form when blane or quantity changes
  useEffect(() => {
    if (formData.blane_id && formData.quantity) {
      const selectedBlane = blanes.find(b => b.id === formData.blane_id);
      if (selectedBlane) {
        const newTotalPrice = calculateTotalPrice(formData.blane_id, formData.quantity);
        const newNumberPersons = selectedBlane.personnes_prestation * formData.quantity;
        
        setFormData(prev => ({
          ...prev,
          total_price: newTotalPrice,
          number_persons: newNumberPersons
        }));
      }
    }
  }, [formData.blane_id, formData.quantity, calculateTotalPrice, blanes]);

  return (
  <div className="">
    <Card className="overflow-hidden">
      {/* Section d'en-tête */}
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={animationVariants.fadeIn}
        className="p-4 md:p-6 bg-gradient-to-r from-[#00897B] to-[#00796B]"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="text-white">
            <h2 className="text-2xl font-bold">Gestion des Réservations</h2>
            <p className="text-gray-100 mt-1">Gérez vos réservations et réservations</p>
          </div>
          <Button 
            onClick={() => {
              resetForm();
              setIsAddEditDialogOpen(true);
            }}
            className="bg-white text-[#00897B] hover:bg-gray-100 transition-colors"
          >
            <PlusIcon className="mr-2 h-4 w-4" />
            Ajouter une Réservation
          </Button>
        </div>
      </motion.div>

      {/* Section des filtres */}
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={animationVariants.fadeIn}
        className="p-4 border-b space-y-4"
      >
        <div className="flex flex-col gap-4">
          {/* Barre de recherche et bouton Ajouter - Mobile */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Input
                placeholder="Rechercher des réservations..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  handleSearch(e.target.value);
                }}
                className="pl-10"
              />
              <Icon 
                icon="lucide:search" 
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" 
              />
            </div>
            <Button 
              onClick={() => {
                resetForm();
                setIsAddEditDialogOpen(true);
              }}
              className="sm:hidden bg-[#00897B] hover:bg-[#00796B] text-white"
            >
              <PlusIcon className="mr-2 h-4 w-4" />
              Ajouter une Réservation
            </Button>
          </div>
          
          {/* Grille des filtres */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="col-span-1 sm:col-span-2 lg:col-span-1">
              <Select value={statusFilter} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {statusFilter === "all" ? (
                      "Tous les statuts"
                    ) : (
                      <Badge variant="default" className={getStatusStyle(statusFilter)}>
                        {statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                      </Badge>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="pending">
                    <Badge variant="secondary" className={getStatusStyle("pending")}>
                      En attente
                    </Badge>
                  </SelectItem>
                  <SelectItem value="confirmed">
                    <Badge variant="secondary" className={getStatusStyle("confirmed")}>
                      Confirmé
                    </Badge>
                  </SelectItem>
                  <SelectItem value="cancelled">
                    <Badge variant="secondary" className={getStatusStyle("cancelled")}>
                      Annulé
                    </Badge>
                  </SelectItem>
                  <SelectItem value="paid">
                    <Badge variant="secondary" className={getStatusStyle("paid")}>
                      Payé
                    </Badge>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-1 sm:col-span-2 lg:col-span-1">
              <Select value={userFilter} onValueChange={handleUserFilterChange}>
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {userFilter === "all" ? (
                      "User Filter"
                    ) : (
                      users.find(u => u.id === userFilter)?.name || "User Filter"
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-1">
              <Select
                value={pagination.perPage.toString()}
                onValueChange={handlePerPageChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {pagination.perPage === 999999 ? 'Tout' : `${pagination.perPage} par page`}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 par page</SelectItem>
                  <SelectItem value="20">20 par page</SelectItem>
                  <SelectItem value="50">50 par page</SelectItem>
                  <SelectItem value="100">100 par page</SelectItem>
                  <SelectItem value="999999">Tout</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-1">
              <Button 
                variant="outline"
                onClick={handleExport}
                className="w-full"
              >
                <DownloadIcon className="h-4 w-4 mr-2" />
                Exporter
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Section du tableau */}
      <div className="w-full overflow-x-auto">
        <Table className="min-w-[300px]">
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="hidden md:table-cell w-[20%]">Client</TableHead>
              <TableHead className="w-[30%]">Détails</TableHead>
              <TableHead className="w-[90px]">Statut</TableHead>
              <TableHead className="w-[68px] sm:w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <div className="flex items-center justify-center">
                    <Icon icon="lucide:loader" className="h-6 w-6 animate-spin text-[#00897B]" />
                    <span className="ml-2">Chargement...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : reservations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <div className="flex flex-col items-center justify-center text-gray-500">
                    <Icon icon="lucide:calendar" className="h-12 w-12 mb-2" />
                    <p>Aucune réservation trouvée</p>
                    <Button
                      variant="link"
                      onClick={() => setIsAddEditDialogOpen(true)}
                      className="mt-2 text-[#00897B]"
                    >
                      Créez votre première réservation
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              reservations.map((reservation) => (
                <TableRow key={reservation.id}>
                  <TableCell className="hidden md:table-cell">
                    <div className="space-y-1">
                      <div className="font-medium">{reservation.name}</div>
                      <div className="text-sm text-gray-500">{reservation.email}</div>
                      <div className="text-sm text-gray-500">{reservation.phone}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {/* Afficher les informations du client uniquement sur les petits écrans */}
                      <div className="md:hidden space-y-1 mb-2 pb-2 border-b">
                        <div className="font-medium">{reservation.name}</div>
                        <div className="text-sm text-gray-500">{reservation.email}</div>
                        <div className="text-sm text-gray-500">{reservation.phone}</div>
                      </div>

                      {/* Informations sur le Blane - Simplifiées */}
                      <div className="flex items-center justify-between">
                        <div className="font-medium truncate">
                          {blanes.find(b => b.id === reservation.blane_id)?.name}
                        </div>
                      </div>

                      {/* Date et Heure - Combinées */}
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Icon icon="lucide:calendar" className="h-4 w-4" />
                        <span>{format(new Date(reservation.date), "PP")}</span>
                        <span className="text-gray-300">•</span>
                        <span>{reservation.time ? reservation.time.substring(0, 5) : "--:--"}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={reservation.status}
                      onValueChange={(value) => handleStatusUpdate(reservation.id, value as "pending" | "confirmed" | "cancelled" | "paid")}
                    >
                      <SelectTrigger className="w-[90px] sm:w-[110px] h-7 sm:h-8 text-xs sm:text-sm">
                        <SelectValue>
                          <Badge variant="secondary" className={cn("text-[11px] sm:text-xs px-1.5 py-0.5", getStatusStyle(reservation.status as "pending" | "confirmed" | "cancelled" | "paid"))}>
                            {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                          </Badge>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">
                          <Badge variant="secondary" className={cn("text-[11px] sm:text-xs px-1.5 py-0.5", getStatusStyle("pending"))}>
                            En attente
                          </Badge>
                        </SelectItem>
                        <SelectItem value="confirmed">
                          <Badge variant="secondary" className={cn("text-[11px] sm:text-xs px-1.5 py-0.5", getStatusStyle("confirmed"))}>
                            Confirmé
                          </Badge>
                        </SelectItem>
                        <SelectItem value="paid">
                          <Badge variant="secondary" className={cn("text-[11px] sm:text-xs px-1.5 py-0.5", getStatusStyle("paid"))}>
                            Payé
                          </Badge>
                        </SelectItem>
                        <SelectItem value="cancelled">
                          <Badge variant="secondary" className={cn("text-[11px] sm:text-xs px-1.5 py-0.5", getStatusStyle("cancelled"))}>
                            Annulé
                          </Badge>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right p-1 md:p-4">
                    {/* Actions pour les grands écrans */}
                    <div className="hidden sm:flex items-center justify-end gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setSelectedReservation(reservation);
                          setIsViewDialogOpen(true);
                        }}
                      >
                        <EyeIcon className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          handleEditReservation(reservation);
                        }}
                      >
                        <PencilIcon className="h-3.5 w-3.5" />
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => {
                          setIsDeleteDialogOpen(true);
                          setSelectedReservation(reservation);
                        }}
                      >
                        <TrashIcon className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    {/* Menu déroulant pour les petits écrans */}
                    <div className="sm:hidden">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <MoreVerticalIcon className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[110px]">
                          <DropdownMenuItem 
                            onClick={() => {
                              setSelectedReservation(reservation);
                              setIsViewDialogOpen(true);
                              document.body.style.pointerEvents = ''; // Réinitialiser les événements de pointeur
                            }}
                            className="py-0.5"
                          >
                            <EyeIcon className="h-3 w-3 mr-1" />
                            <span className="text-[11px]">Voir</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => {
                              handleEditReservation(reservation);
                              document.body.style.pointerEvents = ''; // Réinitialiser les événements de pointeur
                            }}
                            className="py-0.5"
                          >
                            <PencilIcon className="h-3 w-3 mr-1" />
                            <span className="text-[11px]">Modifier</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600 py-0.5"
                            onClick={() => {
                              setIsDeleteDialogOpen(true);
                              setSelectedReservation(reservation);
                              document.body.style.pointerEvents = ''; // Réinitialiser les événements de pointeur
                            }}
                          >
                            <TrashIcon className="h-3 w-3 mr-1" />
                            <span className="text-[11px]">Supprimer</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="p-4 border-t">
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:justify-between">
          <div className="text-sm text-gray-500 order-2 sm:order-1">
            {pagination.perPage === 999999 ? (
              `Affichage de toutes les ${pagination.total} entrées`
            ) : (
              `Affichage de ${((pagination.currentPage - 1) * pagination.perPage) + 1} à ${Math.min(pagination.currentPage * pagination.perPage, pagination.total)} sur ${pagination.total} entrées`
            )}
          </div>
          <div className="w-full sm:w-auto flex justify-end order-1 sm:order-2">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    aria-disabled={pagination.currentPage <= 1}
                    className={cn(
                      pagination.currentPage <= 1 && "pointer-events-none opacity-50"
                    )}
                  />
                </PaginationItem>
                
                {Array.from({ length: pagination.lastPage }, (_, i) => i + 1)
                  .filter(page => {
                    if (pagination.lastPage <= 5) return true;
                    if (page === 1 || page === pagination.lastPage) return true;
                    if (Math.abs(page - pagination.currentPage) <= 1) return true;
                    return false;
                  })
                  .map((page, i, array) => {
                    if (i > 0 && array[i - 1] !== page - 1) {
                      return (
                        <PaginationItem key={`ellipsis-${page}`}>
                          <span className="px-4 py-2">...</span>
                        </PaginationItem>
                      );
                    }
                    return (
                      <PaginationItem key={page}>
                        <PaginationLink
                          isActive={page === pagination.currentPage}
                          onClick={() => handlePageChange(page)}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                
                <PaginationItem>
                  <PaginationNext
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    aria-disabled={pagination.currentPage >= pagination.lastPage}
                    className={cn(
                      pagination.currentPage >= pagination.lastPage && "pointer-events-none opacity-50"
                    )}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      </div>
    </Card>

    {/* Boîtes de dialogue */}
    <Dialog open={isAddEditDialogOpen} onOpenChange={setIsAddEditDialogOpen}>
      <DialogContent className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] max-w-[95vw] w-full sm:max-w-2xl p-0 overflow-hidden bg-white rounded-lg shadow-lg">
        <button
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
          onClick={() => setIsAddEditDialogOpen(false)}
        >
          <Icon icon="lucide:x" className="h-4 w-4" />
          <span className="sr-only">Fermer</span>
        </button>

        <div className="max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white z-20 px-6 pt-6 pb-4 border-b">
            <DialogHeader>
              <DialogTitle className="text-xl sm:text-2xl font-bold text-[#00897B] flex items-center gap-2">
                <div className="w-8 sm:w-10 h-8 sm:h-10 rounded-full bg-[#00897B]/10 flex items-center justify-center">
                  <Icon icon={selectedReservation ? "lucide:edit" : "lucide:plus"} className="h-4 sm:h-5 w-4 sm:w-5 text-[#00897B]" />
                </div>
                {selectedReservation ? "Modifier la Réservation" : "Ajouter une Nouvelle Réservation"}
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500">
                {selectedReservation 
                  ? "Modifiez les détails de cette réservation" 
                  : "Créez une nouvelle réservation"}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-6 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {/* Colonne de gauche */}
                <div className="space-y-6">
                  {/* Nom */}
                  <div className="space-y-2">
                    <Label className="text-gray-700">Nom</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Entrez le nom"
                    />
                    {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label className="text-gray-700">Email</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Entrez l'email"
                    />
                    {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                  </div>

                  {/* Ville */}
                  <div className="space-y-2">
                    <Label className="text-gray-700">Ville</Label>
                    <Select
                      value={formData.city}
                      onValueChange={(value) => setFormData({ ...formData, city: value })}
                    >
                      <SelectTrigger className="w-full bg-white">
                        <SelectValue placeholder="Sélectionnez une ville" />
                      </SelectTrigger>
                      <SelectContent>
                        {cities.map((city) => (
                          <SelectItem key={city.id} value={city.name}>
                            {city.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.city && <p className="text-sm text-red-500">{errors.city}</p>}
                  </div>

                  {/* Sélection du Blane */}                     
                    <div className="space-y-2">
                      <Label className="text-gray-700">Blane</Label>
                      <Select
                        value={formData.blane_id ? formData.blane_id.toString() : undefined}
                        onValueChange={(value) => setFormData({ ...formData, blane_id: parseInt(value) })}
                      >
                        <SelectTrigger className="w-full bg-white">
                          <SelectValue placeholder="Sélectionnez un blane" />
                        </SelectTrigger>
                        <SelectContent>
                          {blanes.map((blane) => (
                            <SelectItem key={blane.id} value={blane.id.toString()}>
                              {blane.name} - {blane.price_current} DH
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.blane_id && <p className="text-sm text-red-500">{errors.blane_id}</p>}
                    </div>                                      
                 

                  {/* Téléphone */}
                  <div className="space-y-2">
                    <Label className="text-gray-700">Téléphone</Label>
                    <Input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      maxLength={20}
                      placeholder="Entrez le numéro de téléphone"
                    />
                    {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
                  </div>
                </div>

                {/* Colonne de droite */}
                <div className="space-y-6">
                  {/* Date */}
                  <div className="space-y-2">
                    <Label className="text-gray-700">Date</Label>
                    <Input
                      type="date"
                      value={formData.date}
                      min={format(new Date(), "yyyy-MM-dd")}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    />
                    {errors.date && <p className="text-sm text-red-500">{errors.date}</p>}
                  </div>

                  {/* Heure */}
                  <div className="space-y-2">
                    <Label className="text-gray-700">Heure</Label>
                    <Input
                      type="time"
                      value={formData.time}
                      onChange={(e) => {
                        const timeValue = e.target.value;
                        // Assurez-vous que l'heure est au format HH:mm
                        const formattedTime = timeValue.split(':')
                          .map(part => part.padStart(2, '0'))
                          .slice(0, 2)
                          .join(':');
                        setFormData({ ...formData, time: formattedTime });
                      }}
                      step="60" // Restreint aux heures et minutes uniquement
                    />
                    {errors.time && <p className="text-sm text-red-500">{errors.time}</p>}
                  </div>
                  <div className="space-y-2">
                      <Label className="text-gray-700">Quantité</Label>
                      <Input
                        type="number"
                        min="1"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          quantity: parseInt(e.target.value) || 1 
                        })}
                      />
                      {errors.quantity && <p className="text-sm text-red-500">{errors.quantity}</p>}
                    </div>

                  {/* Statut */}
                  <div className="space-y-2">
                    <Label className="text-gray-700">Statut</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: "pending" | "confirmed" | "cancelled" | "paid") => 
                        setFormData({ ...formData, status: value })
                      }
                    >
                      <SelectTrigger className="w-full bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">En attente</SelectItem>
                        <SelectItem value="confirmed">Confirmé</SelectItem>
                        <SelectItem value="paid">Payé</SelectItem>
                        <SelectItem value="cancelled">Annulé</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.status && <p className="text-sm text-red-500">{errors.status}</p>}
                  </div>
                </div>
              </div>

              {/* Add total price display */}
              {formData.blane_id > 0 && (
                <div className="space-y-2">
                  <Label className="text-gray-700">Prix Total (TVA incluse)</Label>
                  <div className="text-lg font-semibold text-[#00897B]">
                    {(typeof formData.total_price === 'number' 
                      ? formData.total_price
                      : parseFloat(formData.total_price?.toString() || '0')).toFixed(2)} DH
                  </div>
                  {errors.total_price && <p className="text-sm text-red-500">{errors.total_price}</p>}
                </div>
              )}

              {/* Commentaires - Pleine largeur */}
              <div className="space-y-2">
                <Label className="text-gray-700">Commentaires</Label>
                <Textarea
                  value={formData.comments}
                  onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                  placeholder="Ajoutez des commentaires supplémentaires..."
                />
                {errors.comments && <p className="text-sm text-red-500">{errors.comments}</p>}
              </div>

              <DialogFooter className="mt-8 pt-4 border-t">
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsAddEditDialogOpen(false);
                      resetForm();
                    }}
                    className="w-full sm:w-auto"
                  >
                    Annuler
                  </Button>
                  <Button 
                    type="submit"
                    className="w-full sm:w-auto bg-[#00897B] text-white hover:bg-[#00897B]/90"
                  >
                    {selectedReservation ? (
                      <>
                        <Icon icon="lucide:save" className="h-4 w-4 mr-2" />
                        Enregistrer les modifications
                      </>
                    ) : (
                      <>
                        <Icon icon="lucide:plus" className="h-4 w-4 mr-2" />
                        Créer la Réservation
                      </>
                    )}
                  </Button>
                </div>
              </DialogFooter>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Boîte de dialogue de visualisation */}
    <Dialog 
      open={isViewDialogOpen} 
      onOpenChange={(open) => {
        setIsViewDialogOpen(open);
        if (!open) {
          setSelectedReservation(null);
          document.body.style.pointerEvents = ''; // Réinitialiser les événements de pointeur
        }
      }}
    >
      <DialogContent className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] max-w-[95vw] w-full sm:max-w-2xl p-0 overflow-hidden bg-white rounded-lg shadow-lg">
        <button
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
          onClick={() => setIsViewDialogOpen(false)}
        >
          <Icon icon="lucide:x" className="h-4 w-4" />
          <span className="sr-only">Fermer</span>
        </button>

        {selectedReservation && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={popupAnimationVariants.content}
            className="max-h-[90vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-white z-20 px-6 pt-6 pb-4 border-b">
              <DialogHeader>
                <DialogTitle className="text-xl sm:text-2xl font-bold text-[#00897B] flex items-center gap-2">
                  <div className="w-8 sm:w-10 h-8 sm:h-10 rounded-full bg-[#00897B]/10 flex items-center justify-center">
                    <Icon icon="lucide:calendar" className="h-4 sm:h-5 w-4 sm:w-5 text-[#00897B]" />
                  </div>
                  Détails de la Réservation
                </DialogTitle>
                <DialogDescription className="text-sm text-gray-500">
                  Réservation #{selectedReservation.NUM_RES}
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="p-6 space-y-6">
              {/* Informations sur la réservation */}
              <div className="grid gap-6 sm:grid-cols-2">
                <InfoField 
                  label="Blane"
                  value={
                    <div className="flex flex-col gap-1">
                      <p>{blanes.find(b => b.id === selectedReservation.blane_id)?.name}</p>
                      <p className="text-sm text-gray-500">
                        {blanes.find(b => b.id === selectedReservation.blane_id)?.price_current} DH
                      </p>
                    </div>
                  }
                  icon={<Icon icon="lucide:box" className="h-5 w-5" />}
                />
                <InfoField 
                  label="Coordonnées"
                  value={
                    <div className="flex flex-col gap-1">
                      <p>{selectedReservation.name}</p>
                      <p className="text-sm text-gray-500">{selectedReservation.email}</p>
                      <p className="text-sm text-gray-500">{selectedReservation.phone}</p>
                      <p className="text-sm text-gray-500">{selectedReservation.city}</p>
                    </div>
                  }
                  icon={<Icon icon="lucide:user" className="h-5 w-5" />}
                />
                <InfoField 
                  label="Détails de la commande"
                  value={
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span>Methode de paiment:</span>
                        <span className="font-medium">{selectedReservation.payment_method}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>Quantité:</span>
                        <span className="font-medium">{selectedReservation.quantity}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>Montant TTC:</span>
                        <span className="font-medium">
                          {(typeof selectedReservation.total_price === 'number' 
                            ? selectedReservation.total_price
                            : parseFloat(selectedReservation.total_price || '0')).toFixed(2)} DH
                        </span>
                      </div>
                      {selectedReservation.payment_method === "partiel" && (
                      <div>
                        <div className="flex items-center gap-2 text-[#00897B]">
                          <span>Prix partiel:</span>
                          <span className="font-medium">
                            {(typeof selectedReservation.partiel_price === 'number'
                              ? selectedReservation.partiel_price
                              : parseFloat(selectedReservation.partiel_price || '0')).toFixed(2)} DH
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                        <span>Le reste:</span>
                        <span className="font-medium">
                          {(typeof selectedReservation.partiel_price === 'number'
                            ? selectedReservation.partiel_price
                            : parseFloat(selectedReservation.total_price - selectedReservation.partiel_price)).toFixed(2)} DH
                        </span>
                      </div>
                      </div>
                      )}
                    </div>
                  }
                  icon={<Icon icon="lucide:receipt" className="h-5 w-5" />}
                />
                <InfoField 
                  label="Date & Heure"
                  value={
                    <div className="flex flex-col gap-1">
                      <p>{format(new Date(selectedReservation.date), "PPP")}</p>
                      <p className="text-sm text-gray-500">{selectedReservation.time ? selectedReservation.time.substring(0, 5) : "--:--"}</p>
                    </div>
                  }
                  icon={<Icon icon="lucide:calendar" className="h-5 w-5" />}
                />
                <InfoField 
                  label="Statut"
                  value={
                    <Badge variant="default" className={cn(
                      getStatusStyle(selectedReservation.status)
                    )}>
                      <Icon 
                        icon={
                          selectedReservation.status === "confirmed" ? "lucide:check-circle" :
                          selectedReservation.status === "pending" ? "lucide:clock" :
                          "lucide:x-circle"
                        } 
                        className="h-4 w-4 mr-1 inline-block" 
                      />
                      {selectedReservation.status.charAt(0).toUpperCase() + selectedReservation.status.slice(1)}
                    </Badge>
                  }
                  icon={<Icon icon="lucide:activity" className="h-5 w-5" />}
                />
                {selectedReservation.comments && (
                  <InfoField 
                    label="Commentaires"
                    value={selectedReservation.comments}
                    icon={<Icon icon="lucide:message-square" className="h-5 w-5" />}
                    wrapText
                    fullWidth
                  />
                )}
                <InfoField 
                  label="Créée le"
                  value={format(new Date(selectedReservation.created_at), "PPpp")}
                  icon={<Icon icon="lucide:clock" className="h-5 w-5" />}
                />
                <InfoField 
                  label="Modifiée le"
                  value={selectedReservation.updated_at ? format(new Date(selectedReservation.updated_at), "PPpp") : '-'}
                  icon={<Icon icon="lucide:refresh-cw" className="h-5 w-5" />}
                />
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t p-4 sm:p-6">
              <Button
                variant="outline"
                onClick={() => setIsViewDialogOpen(false)}
                className="w-full sm:w-auto"
              >
                Fermer
              </Button>
            </div>
          </motion.div>
        )}
      </DialogContent>
    </Dialog>

    {/* Boîte de dialogue de confirmation de suppression */}
    <AlertDialog 
      open={isDeleteDialogOpen} 
      onOpenChange={setIsDeleteDialogOpen}
    >
      <AlertDialogContent className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] max-w-[95vw] w-full sm:max-w-[400px] p-0 overflow-hidden bg-white rounded-lg shadow-lg">
        <motion.div
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={popupAnimationVariants.content}
          className="p-6"
        >
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <Icon icon="lucide:trash-2" className="h-6 w-6 text-red-600" />
            </div>
            <AlertDialogHeader className="space-y-2">
              <AlertDialogTitle className="text-xl font-semibold">
                Supprimer la Réservation
              </AlertDialogTitle>
              <AlertDialogDescription className="text-gray-500">
                Êtes-vous sûr de vouloir supprimer cette réservation ? Cette action est irréversible.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="w-full mt-6">
              <AlertDialogFooter className="flex flex-col sm:flex-row gap-2 w-full">
                <AlertDialogCancel 
                  className="w-full sm:w-auto mt-0"
                  onClick={() => {
                    setIsDeleteDialogOpen(false);
                    setSelectedReservation(null);
                  }}
                >
                  Annuler
                </AlertDialogCancel>
                <AlertDialogAction
                  className="w-full sm:w-auto bg-red-600 hover:bg-red-700"
                  onClick={() => {
                    if (selectedReservation) {
                      handleDelete(selectedReservation.id);
                    }
                  }}
                >
                  Supprimer la Réservation
                </AlertDialogAction>
              </AlertDialogFooter>
            </div>
          </div>
        </motion.div>
      </AlertDialogContent>
    </AlertDialog>
  </div>
  );
};

export default Reservations;