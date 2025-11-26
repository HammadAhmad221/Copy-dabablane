import { useState, useEffect, useCallback, useMemo } from "react";
import { Card } from "@/admin/components/ui/card";
import { Input } from "@/admin/components/ui/input";
import { Button } from "@/admin/components/ui/button";
import { Customer } from "@/lib/types/customer";
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
  DialogTrigger,
  DialogDescription,
  DialogClose,
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
  Trash2Icon
} from "lucide-react";
import { orderApi } from "@/admin/lib/api/services/orderService";
import { cityApi } from "@/admin/lib/api/services/cityService";
import { userApi } from "@/admin/lib/api/services/userService";
import { blaneApi } from "@/admin/lib/api/services/blaneService";
import { OrderFormData, OrderType } from "@/lib/types/orders";
import { CityType } from "@/lib/types/cities";
import { User } from "@/lib/types/user";
import { Blane } from "@/lib/types/blane";
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
import { Badge } from "@/admin/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import { Switch } from "@/admin/components/ui/switch";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/admin/components/ui/dropdown-menu";
import { utils, writeFile } from 'xlsx';
import { Label } from "@/admin/components/ui/label";
import { Textarea } from "@/admin/components/ui/textarea";
import {CustomerService} from "@/admin/lib/api/services/customerService";

// Form validation schema
const orderSchema = z.object({
  blane_id: z.number().min(1, "Blane is required"),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone is required").max(20, "Phone number too long"),
  city: z.string().min(1, "City is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  delivery_address: z.string().min(1, "Delivery address is required"),
  status: z.enum(["pending", "confirmed", "shipped", "cancelled", "paid"]),
  total_price: z.number(),
  comments: z.string().optional()
});

type FormData = z.infer<typeof orderSchema>;

// First, add these animation variants at the top of the file
const popupAnimationVariants = {
  overlay: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  content: {
    hidden: { 
      opacity: 0, 
      scale: 0.95, 
      y: 10 
    },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: {
        type: "spring",
        duration: 0.5,
      }
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: 10
    }
  }
};

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<OrderType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    perPage: 10,
    total: 0,
    lastPage: 1,
  });

  const [cities, setCities] = useState<CityType[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [blanes, setBlanes] = useState<Blane[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<string | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | undefined>(undefined);

  const [selectedOrder, setSelectedOrder] = useState<OrderType | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [formData, setFormData] = useState<OrderFormData>({
    blane_id: 0,
    name: "",
    email: "",
    phone: "",
    city: "",
    quantity: 1,
    delivery_address: "",
    status: "pending",
    comments: "",
    total_price: 0
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // First, add a state for delete confirmation
  const [orderToDelete, setOrderToDelete] = useState<OrderType | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // First, add these state variables at the top with other state declarations
  const [filters, setFilters] = useState({
    page: 1,
    paginationSize: 10,
    search: '',
    sortBy: undefined as string | undefined,
    sortOrder: undefined as 'asc' | 'desc' | undefined,
    customerId: undefined as number | undefined
  });

  const fetchCustomers = async () => {
    try {
      const response = await CustomerService.getAll({ paginationSize: 9999 });
      // Remove duplicate customers by email - keep only the first occurrence of each email
      const uniqueCustomers = response.data.filter((customer, index, self) => 
        index === self.findIndex((c) => c.email?.toLowerCase().trim() === customer.email?.toLowerCase().trim())
      );
      setCustomers(uniqueCustomers);
      console.log(`✅ Loaded ${uniqueCustomers.length} unique customers (removed ${response.data.length - uniqueCustomers.length} duplicates)`);
    } catch (error) {
      toast.error("Failed to fetch customers");
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [citiesResponse, usersResponse, blanesResponse] = await Promise.all([
          cityApi.getCities(),
          userApi.getUsers(),
          blaneApi.getBlaneType("order"),
        ]);
        setCities(citiesResponse.data);
        setUsers(usersResponse.data);
        setBlanes(blanesResponse || []);

        // Fetch customers after other data is loaded
        const customersResponse = await CustomerService.getAll({ paginationSize: 9999 });
        // Remove duplicate customers by email - keep only the first occurrence of each email
        const uniqueCustomers = customersResponse.data.filter((customer, index, self) => 
          index === self.findIndex((c) => c.email?.toLowerCase().trim() === customer.email?.toLowerCase().trim())
        );
        setCustomers(uniqueCustomers);
        console.log(`✅ Loaded ${uniqueCustomers.length} unique customers (removed ${customersResponse.data.length - uniqueCustomers.length} duplicates)`);
      } catch (error) {
        toast.error("Failed to fetch necessary data");
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (isDialogOpen) {
      fetchCustomers();
    }
  }, [isDialogOpen]);

  const fetchOrders = useCallback(async (currentFilters = filters) => {
    try {
      setIsLoading(true);
      
      // Fetch all orders if filtering by customer (we'll filter client-side)
      const response = await orderApi.getOrders({
        page: currentFilters.customerId ? 1 : currentFilters.page,
        paginationSize: currentFilters.customerId ? 9999 : currentFilters.paginationSize,
        search: currentFilters.search,
        sortBy: currentFilters.sortBy,
        sortOrder: currentFilters.sortOrder,
      });
      
      // Filter by customer if customer filter is set
      let filteredOrders = response.data;
      if (currentFilters.customerId) {
        filteredOrders = response.data.filter(order => 
          order.customers_id === currentFilters.customerId
        );
        
        // Apply client-side pagination after filtering
        const startIndex = (currentFilters.page - 1) * currentFilters.paginationSize;
        const endIndex = startIndex + currentFilters.paginationSize;
        filteredOrders = filteredOrders.slice(startIndex, endIndex);
      }
      
      setOrders(filteredOrders);
      
      // Update pagination metadata
      if (currentFilters.customerId) {
        const totalFiltered = response.data.filter(order => 
          order.customers_id === currentFilters.customerId
        ).length;
        setPagination(prev => ({
          ...prev,
          currentPage: currentFilters.page,
          perPage: currentFilters.paginationSize,
          total: totalFiltered,
          lastPage: Math.max(1, Math.ceil(totalFiltered / currentFilters.paginationSize)),
        }));
      } else {
        setPagination(prev => ({
          ...prev,
          currentPage: response.meta.current_page,
          perPage: response.meta.per_page,
          total: response.meta.total,
          lastPage: response.meta.last_page,
        }));
      }
    } catch (error) {
      toast.error('Failed to fetch orders');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleSearch = debounce((term: string) => {
    const newFilters = {
      ...filters,
      search: term,
      page: 1
    };
    setFilters(newFilters);
    fetchOrders(newFilters);
  }, 500);

  const handlePageChange = (page: number) => {
    const newFilters = {
      ...filters,
      page: page
    };
    setFilters(newFilters);
    fetchOrders(newFilters);
  };

  const handleSort = (column: string) => {
    const newSortOrder = filters.sortBy === column && filters.sortOrder === 'asc' ? 'desc' : 'asc';
    const newFilters = {
      ...filters,
      sortBy: column,
      sortOrder: newSortOrder as 'asc' | 'desc'
    };
    setFilters(newFilters);
    fetchOrders(newFilters);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsSaving(true);

    try {
      // Check if this is an update and the order is not pending
      if (selectedOrder && selectedOrder.status !== "pending") {
        toast.error("Only pending orders can be updated");
        setIsSaving(false);
        return;
      }

      // Calculate total price
      const selectedBlane = blanes.find(b => b.id === formData.blane_id);
      if (!selectedBlane) {
        toast.error("Selected blane not found");
        setIsSaving(false);
        return;
      }

      const basePrice = selectedBlane.price_current * formData.quantity;
      const tvaAmount = (basePrice * (selectedBlane.tva || 0)) / 100;
      const calculatedTotalPrice = basePrice + tvaAmount;

      // Create validated data with total price
      const validatedData = {
        ...orderSchema.parse(formData),
        total_price: calculatedTotalPrice
      };

      if (selectedOrder) {
        // For updates, prepare the payload matching the API structure
        const updatePayload: any = {
          blane_id: validatedData.blane_id,
          name: validatedData.name.trim(),
          email: validatedData.email.trim(),
          phone: validatedData.phone.trim(),
          city: validatedData.city.trim(),
          quantity: Number(validatedData.quantity),
          delivery_address: validatedData.delivery_address.trim(),
          status: validatedData.status,
          total_price: Number(calculatedTotalPrice.toFixed(2)),
          payment_method: (selectedOrder as any).payment_method || 'cash',
          is_digital: selectedBlane.is_digital || false, // Include is_digital from blane
          partiel_price: (selectedOrder as any).partiel_price || null, // Preserve or set to null
          comments: validatedData.comments && validatedData.comments.trim() ? validatedData.comments.trim() : null, // Use null instead of empty string
        };
        
        console.log('📤 Updating order:', {
          orderId: selectedOrder.id,
          payload: updatePayload,
          payloadTypes: Object.keys(updatePayload).reduce((acc, key) => {
            acc[key] = typeof updatePayload[key];
            return acc;
          }, {} as Record<string, string>)
        });

        await orderApi.updateOrder(selectedOrder.id.toString(), updatePayload);
        toast.success("Order updated successfully");
      } else {
        // For creation, ensure all required fields are included
        const createPayload: any = {
          blane_id: validatedData.blane_id,
          name: validatedData.name.trim(),
          email: validatedData.email.trim(),
          phone: validatedData.phone.trim(),
          city: validatedData.city.trim(),
          quantity: Number(validatedData.quantity),
          delivery_address: validatedData.delivery_address.trim(),
          status: validatedData.status,
          total_price: Number(calculatedTotalPrice.toFixed(2)),
          source: 'web', // Required by backend
          payment_method: 'cash', // Required by backend - default to 'cash' for admin-created orders
          is_digital: selectedBlane.is_digital || false, // Include is_digital from blane
          partiel_price: null, // Set to null for new orders
          comments: validatedData.comments && validatedData.comments.trim() ? validatedData.comments.trim() : null, // Use null instead of empty string
        };
        
        console.log('📤 Creating order:', createPayload);
        await orderApi.createOrder(createPayload);
        toast.success("Order created successfully");
      }

      // Fetch customers after successful submission
      await fetchCustomers();

      // Close dialog and refresh data
      handleDialogClose();
      await fetchOrders();
    } catch (error: any) {
      console.error('❌ Error saving order:', error);
      console.error('❌ Error response:', error.response);
      console.error('❌ Error data:', error.response?.data);
      console.error('❌ Full error data (expanded):', JSON.stringify(error.response?.data, null, 2));
      
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
        // Extract error message from response
        let errorMessage = "Failed to save order";
        const errorData = error.response?.data;
        
        if (errorData) {
          // Check for validation errors object
          if (errorData.error && typeof errorData.error === 'object') {
            const errorObj = errorData.error;
            const errorMessages: string[] = [];
            
            // Extract all error messages from the error object
            Object.keys(errorObj).forEach((key) => {
              const fieldErrors = Array.isArray(errorObj[key]) ? errorObj[key] : [errorObj[key]];
              fieldErrors.forEach((msg: string) => {
                errorMessages.push(`${key}: ${msg}`);
              });
            });
            
            if (errorMessages.length > 0) {
              errorMessage = errorMessages.join(', ');
              console.error('❌ Validation errors:', errorMessages);
            } else {
              errorMessage = errorData.message || errorData.error || error.message || errorMessage;
            }
          } else if (errorData.message) {
            errorMessage = errorData.message;
          } else if (typeof errorData.error === 'string') {
            errorMessage = errorData.error;
          }
        }
        
        // Log detailed error information
        if (error.response?.status === 500) {
          console.error('❌ Server Error (500):', {
            status: error.response.status,
            data: error.response.data,
            message: errorMessage
          });
          toast.error(`Server error: ${errorMessage}`);
        } else if (error.response?.status === 400) {
          console.error('❌ Validation Error (400):', {
            status: error.response.status,
            data: error.response.data,
            message: errorMessage
          });
          toast.error(`Validation error: ${errorMessage}`);
        } else if (error.response?.data?.message === "Only pending orders can be updated") {
          toast.error("Only pending orders can be updated");
        } else {
          toast.error(errorMessage);
        }
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await orderApi.deleteOrder(id.toString());
      await fetchOrders(); // Refresh the orders list
      return true;
    } catch (error) {
      throw error;
    }
  };

  const handleStatusChange = async (id: number, newStatus: OrderType["status"]) => {
    try {
      await orderApi.updateOrderStatus(id.toString(), newStatus);
      toast.success("Status updated successfully");
      fetchOrders();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleExport = async () => {
    try {
      const ordersWithTotalPrice = orders.map(order => {
        const blane = blanes.find(b => b.id === order.blane_id);
        const price = blane ? blane.price_current : 0;
        const basePrice = price * order.quantity;
        const tvaAmount = blane ? (basePrice * (blane.tva || 0)) / 100 : 0;
        const total_price = basePrice + tvaAmount;

        return {
          ID: order.id,
          Blane: findBlaneName(order.blane_id),
          Customer: findCustomerName(order.customers_id),
          Quantity: order.quantity,
          "Unit Price": `${price} DH`,
          "TVA": `${blane?.tva || 0}%`,
          "Total Price": `${total_price} DH`,
          "Delivery Address": order.delivery_address,
          Phone: order.phone,
          Status: order.status.charAt(0).toUpperCase() + order.status.slice(1),
          "Created At": format(new Date(order.created_at), "PPp")
        };
      });

      // Create workbook and worksheet
      const wb = utils.book_new();
      const ws = utils.json_to_sheet(ordersWithTotalPrice);

      // Set column widths
      const colWidths = [
        { wch: 5 },  // ID
        { wch: 20 }, // Blane
        { wch: 20 }, // Customer
        { wch: 10 }, // Quantity
        { wch: 15 }, // Unit Price
        { wch: 15 }, // TVA
        { wch: 15 }, // Total Price
        { wch: 30 }, // Delivery Address
        { wch: 15 }, // Phone
        { wch: 12 }, // Status
        { wch: 20 }, // Created At
      ];
      ws['!cols'] = colWidths;

      utils.book_append_sheet(wb, ws, "Orders");

      // Generate & download the file
      const fileName = `orders_export_${format(new Date(), "yyyy-MM-dd_HH-mm")}.xlsx`;
      writeFile(wb, fileName);

      toast.success("Orders exported successfully");
    } catch (error) {
      toast.error("Failed to export orders");
    }
  };

  const resetForm = () => {
    setFormData({
      blane_id: 0,
      name: "",
      email: "",
      phone: "",
      city: "",
      quantity: 1,
      delivery_address: "",
      status: "pending",
      comments: "",
      total_price: 0
    });
    setSelectedOrder(null);
    setErrors({});
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setIsViewDialogOpen(false);
    resetForm();
    fetchOrders();
  };

  const handleEditOrder = (order: OrderType) => {
    if (order.status !== "pending") {
      toast.error("Only pending orders can be updated");
      return;
    }

    // Find the customer data
    const customer = customers.find(c => c.id === order.customers_id);
    
    // Set form data
    setFormData({
      blane_id: order.blane_id,
      name: customer?.name || order.name || '',
      email: customer?.email || order.email || '',
      phone: customer?.phone || order.phone || '',
      city: customer?.city || order.city || '',
      quantity: order.quantity || 1,
      delivery_address: order.delivery_address || '',
      status: order.status || 'pending',
      comments: order.comments || '',
    });

    // Open the dialog
    setIsDialogOpen(true);
  };

  const handleViewClick = (order: OrderType) => {
    setSelectedOrder(order);
    setIsViewDialogOpen(true);
  };

  const findBlaneName = (blaneId: number) => {
    if (!blanes || blanes.length === 0) return `Blane ${blaneId}`;
    const blane = blanes.find(b => String(b.id) === String(blaneId));
    return blane ? blane.name : `Blane ${blaneId}`;
  };

  const findCustomerName = (customerId: number) => {
    if (!customers || customers.length === 0) return `Customer ${customerId}`;
    const customer = customers.find(c => String(c.id) === String(customerId));
    return customer ? customer.name : `Customer ${customerId}`;
  };

  const findCustomerEmail = (customerId: number) => {
    if (!customers || customers.length === 0) return '';
    const customer = customers.find(c => String(c.id) === String(customerId));
    return customer ? customer.email : '';
  };

  const findCustomerCity = (customerId: number) => {
    if (!customers || customers.length === 0) return '';
    const customer = customers.find(c => String(c.id) === String(customerId));
    return customer ? customer.city : '';
  };

  const getStatusStyle = (status: OrderType["status"]) => {
    // Base rounded-full class to ensure all badges are pill-shaped
    const baseClasses = "rounded-full";
    switch (status) {
      case "pending":
        return `${baseClasses} bg-yellow-100 text-yellow-800 hover:bg-yellow-100/80`;
      case "confirmed":
      case "paid":
        // Extra rounded with more padding for confirmed/paid status to make it more pill-shaped
        return `${baseClasses} bg-green-100 text-green-800 hover:bg-green-100/80`;
      case "shipped":
        return `${baseClasses} bg-blue-100 text-blue-800 hover:bg-blue-100/80`;
      case "cancelled":
        return `${baseClasses} bg-red-100 text-red-800 hover:bg-red-100/80`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 hover:bg-gray-100/80`;
    }
  };

  const handlePaginationChange = useCallback((value: string) => {
    const newPerPage = parseInt(value);
    const newFilters = {
      ...filters,
      page: 1,
      paginationSize: newPerPage
    };
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, perPage: newPerPage, currentPage: 1 }));
    fetchOrders(newFilters);
  }, [filters, fetchOrders]);

  useEffect(() => {
    const selectedBlane = blanes.find(b => b.id === formData.blane_id);
    if (selectedBlane) {
      const basePrice = selectedBlane.price_current * formData.quantity;
      const tvaAmount = (basePrice * (selectedBlane.tva || 0)) / 100;
      const calculatedTotalPrice = basePrice + tvaAmount;
      
      setFormData(prev => ({
        ...prev,
        total_price: calculatedTotalPrice
      }));
    }
  }, [formData.quantity, formData.blane_id, blanes]);

  useEffect(() => {
    // Cleanup function to ensure pointer-events are reset
    return () => {
      document.body.style.pointerEvents = 'auto';
    };
  }, []);

  return (
  <div className="w-full">
    <Card className="overflow-hidden w-full">
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
        className="p-3 sm:p-4 md:p-6 bg-gradient-to-r from-[#00897B] to-[#00796B]"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div className="text-white flex-1 min-w-0">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold break-words">Gestion des Commandes</h2>
            <p className="text-gray-100 mt-1 text-sm sm:text-base">Gérez vos commandes et réservations</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-2 w-full sm:w-auto shrink-0">
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="bg-white text-[#00897B] hover:bg-gray-100 transition-colors text-sm sm:text-base w-full sm:w-auto"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Ajouter une Commande</span>
              <span className="sm:hidden">Ajouter</span>
            </Button>
            <Button
              onClick={handleExport}
              className="bg-white text-[#00897B] hover:bg-gray-100 transition-colors text-sm sm:text-base w-full sm:w-auto"
            >
              <DownloadIcon className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Exporter</span>
              <span className="sm:hidden">Export</span>
            </Button>
          </div>
        </div>
      </motion.div>

      <motion.div 
        initial="hidden"
        animate="visible"
        variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
        className="p-3 sm:p-4 md:p-6 border-b space-y-3 sm:space-y-4"
      >
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="relative w-full">
            <Input
              placeholder="Rechercher des commandes..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                handleSearch(e.target.value);
              }}
              className="pl-10 w-full text-xs md:text-xs lg:text-base h-9 md:h-9 lg:h-10"
            />
            <Icon 
              icon="lucide:search" 
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" 
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-2 sm:gap-3 md:gap-3 lg:gap-4">
            <Select
              value={filters.customerId ? filters.customerId.toString() : "all"}
              onValueChange={(value) => {
                const newFilters = {
                  ...filters,
                  customerId: value === "all" ? undefined : parseInt(value),
                  page: 1
                };
                setFilters(newFilters);
                fetchOrders(newFilters);
              }}
            >
              <SelectTrigger className="h-9 md:h-9 lg:h-10 w-full bg-white text-xs md:text-xs lg:text-base">
                <SelectValue placeholder="All Customers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Customers</SelectItem>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id.toString()}>
                    <span className="truncate">{customer.name} ({customer.email})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={pagination.perPage.toString()}
              onValueChange={handlePaginationChange}
            >
              <SelectTrigger className="h-9 md:h-9 lg:h-10 w-full bg-white text-xs md:text-xs lg:text-base">
                <SelectValue placeholder="Éléments par page" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 par page</SelectItem>
                <SelectItem value="20">20 par page</SelectItem>
                <SelectItem value="50">50 par page</SelectItem>
                <SelectItem value="100">100 par page</SelectItem>
                <SelectItem value="99999">999+ par page</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </motion.div>

      <div className="w-full overflow-x-auto -mx-0 sm:mx-0">
        {/* Desktop/Tablet Table View */}
        <div className="hidden md:block">
          <div className="overflow-x-auto">
            <Table className="w-full md:min-w-[680px] lg:min-w-0">
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-[20%] md:w-[20%] lg:w-[15%] md:min-w-[130px] lg:min-w-[150px] text-xs md:text-xs lg:text-base px-1 md:px-2">Client</TableHead>
                  <TableHead className="w-[30%] md:w-[30%] lg:w-[25%] md:min-w-[180px] lg:min-w-[200px] text-xs md:text-xs lg:text-base px-1 md:px-2">Détails</TableHead>
                  <TableHead className="w-[15%] hidden lg:table-cell text-sm md:text-base">Blane</TableHead>
                  <TableHead className="w-[15%] hidden lg:table-cell text-sm md:text-base">Prix-Qté</TableHead>
                  <TableHead className="w-[15%] hidden lg:table-cell text-sm md:text-base">Localisation</TableHead>
                  <TableHead className="w-[20%] md:w-[20%] lg:w-[10%] md:min-w-[100px] lg:w-[120px] text-xs md:text-xs lg:text-base px-1 md:px-2">Statut</TableHead>
                  <TableHead className="w-[30%] md:w-[30%] lg:w-[5%] md:min-w-[120px] lg:w-[120px] text-right text-xs md:text-xs lg:text-base px-1 md:px-2">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <Icon icon="lucide:loader" className="h-6 w-6 animate-spin text-[#00897B]" />
                        <span className="ml-2 text-sm sm:text-base">Chargement...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center text-gray-500">
                        <Icon icon="lucide:inbox" className="h-12 w-12 mb-2" />
                        <p className="text-sm sm:text-base">Aucune commande trouvée</p>
                        <Button
                          variant="link"
                          onClick={() => setIsDialogOpen(true)}
                          className="mt-2 text-[#00897B] text-sm sm:text-base"
                        >
                          Créez votre première commande
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => (
                    <TableRow key={order.id} className="group hover:bg-gray-50">
                      <TableCell className="p-1.5 md:p-2 lg:p-4">
                        <div className="flex flex-col space-y-0.5 md:space-y-1">
                          <div className="font-medium text-xs leading-tight truncate">
                            {findCustomerName(order.customers_id)}
                          </div>
                          <div className="text-[10px] md:text-[10px] lg:text-xs text-gray-600 truncate leading-tight">
                            {findCustomerEmail(order.customers_id)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="p-1.5 md:p-2 lg:p-4">
                        <div className="flex flex-col space-y-0.5 md:space-y-1">
                          <div className="font-medium text-xs leading-tight truncate">
                            {findBlaneName(order.blane_id)}
                          </div>
                          <div className="text-[10px] md:text-[10px] lg:text-xs text-gray-600 leading-tight">
                            {order.quantity} × {blanes.find(b => b.id === order.blane_id)?.price_current || 0} DH
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell p-2 md:p-3 lg:p-4">
                        <div className="text-xs md:text-sm lg:text-base">
                          {findBlaneName(order.blane_id)}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell p-2 md:p-3 lg:p-4">
                        <div className="text-xs md:text-sm lg:text-base">
                          {order.quantity} × {blanes.find(b => b.id === order.blane_id)?.price_current || 0} DH
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Total: {(blanes.find(b => b.id === order.blane_id)?.price_current || 0) * order.quantity} DH
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell p-2 md:p-3 lg:p-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-xs md:text-sm">{findCustomerCity(order.customers_id)}</span>
                          <span className="text-xs text-gray-500 truncate">{order.delivery_address}</span>
                        </div>
                      </TableCell>
                      <TableCell className="p-1.5 md:p-2 lg:p-4">
                        <Select
                          value={order.status}
                          onValueChange={(value: OrderType["status"]) => handleStatusChange(order.id, value)}
                        >
                          <SelectTrigger className={cn(
                            "w-full md:w-[100px] lg:w-[120px] h-6 md:h-7 text-[10px] md:text-[10px]",
                            order.status === "confirmed" || order.status === "paid" ? "md:w-[110px] lg:w-[130px]" : "md:w-[90px] lg:w-[110px]"
                          )}>
                            <SelectValue>
                              <Badge variant="secondary" className={cn(
                                "text-[10px] md:text-[10px] px-1 py-0.5",
                                getStatusStyle(order.status)
                              )}>
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              </Badge>
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">
                              <Badge variant="secondary" className={cn("text-[10px] px-1 py-0.5", getStatusStyle("pending"))}>
                                En attente
                              </Badge>
                            </SelectItem>
                            <SelectItem value="confirmed">
                              <Badge variant="secondary" className={cn("text-[10px] px-1 py-0.5", getStatusStyle("confirmed"))}>
                                Confirmé
                              </Badge>
                            </SelectItem>
                            <SelectItem value="shipped">
                              <Badge variant="secondary" className={cn("text-[10px] px-1 py-0.5", getStatusStyle("shipped"))}>
                                Expédié
                              </Badge>
                            </SelectItem>
                            <SelectItem value="paid">
                              <Badge variant="secondary" className={cn("text-[10px] px-1 py-0.5", getStatusStyle("paid"))}>
                                Payé
                              </Badge>
                            </SelectItem>
                            <SelectItem value="cancelled">
                              <Badge variant="secondary" className={cn("text-[10px] px-1 py-0.5", getStatusStyle("cancelled"))}>
                                Annulé
                              </Badge>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right p-1.5 md:p-2 lg:p-4">
                        <div className="flex items-center justify-end gap-0.5 md:gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6 md:h-7 md:w-7"
                            onClick={() => handleViewClick(order)}
                          >
                            <EyeIcon className="h-3 w-3 md:h-3.5 md:w-3.5" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6 md:h-7 md:w-7"
                            onClick={() => handleEditOrder(order)}
                          >
                            <PencilIcon className="h-3 w-3 md:h-3.5 md:w-3.5" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="destructive" 
                                size="icon"
                                className="h-6 w-6 md:h-7 md:w-7"
                              >
                                <Trash2Icon className="h-3 w-3 md:h-3.5 md:w-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="sm:max-w-[425px]">
                              <AlertDialogHeader>
                                <AlertDialogTitle>Supprimer la Commande</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Êtes-vous sûr de vouloir supprimer cette commande ? Cette action est irréversible.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(order.id)}
                                >
                                  Supprimer
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-3 p-3 sm:p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Icon icon="lucide:loader" className="h-6 w-6 animate-spin text-[#00897B]" />
              <span className="ml-2 text-sm">Chargement...</span>
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-gray-500 py-12">
              <Icon icon="lucide:inbox" className="h-12 w-12 mb-2" />
              <p className="text-sm">Aucune commande trouvée</p>
              <Button
                variant="link"
                onClick={() => setIsDialogOpen(true)}
                className="mt-2 text-[#00897B] text-sm"
              >
                Créez votre première commande
              </Button>
            </div>
          ) : (
            orders.map((order) => (
              <Card key={order.id} className="p-4 space-y-3">
                {/* Customer Info */}
                <div className="space-y-1 pb-3 border-b">
                  <div className="font-semibold text-base">{findCustomerName(order.customers_id)}</div>
                  <div className="text-sm text-gray-600 truncate">{findCustomerEmail(order.customers_id)}</div>
                </div>

                {/* Order Details */}
                <div className="space-y-2">
                  <div className="font-medium text-sm text-gray-700">
                    {findBlaneName(order.blane_id)}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Icon icon="lucide:package" className="h-4 w-4" />
                    <span>{order.quantity} × {blanes.find(b => b.id === order.blane_id)?.price_current || 0} DH</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Icon icon="lucide:map-pin" className="h-4 w-4" />
                    <span className="break-words">{findCustomerCity(order.customers_id)} - {order.delivery_address}</span>
                  </div>
                  <div className="text-sm font-medium text-gray-700">
                    Total: {(blanes.find(b => b.id === order.blane_id)?.price_current || 0) * order.quantity} DH
                  </div>
                </div>

                {/* Status & Actions */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <Select
                    value={order.status}
                    onValueChange={(value: OrderType["status"]) => handleStatusChange(order.id, value)}
                  >
                    <SelectTrigger className="w-[110px] h-8 text-xs">
                      <SelectValue>
                        <Badge variant="secondary" className={cn("text-xs px-2 py-0.5", getStatusStyle(order.status))}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Badge>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">
                        <Badge variant="secondary" className={cn("text-xs px-2 py-0.5", getStatusStyle("pending"))}>
                          En attente
                        </Badge>
                      </SelectItem>
                      <SelectItem value="confirmed">
                        <Badge variant="secondary" className={cn("text-xs px-2 py-0.5", getStatusStyle("confirmed"))}>
                          Confirmé
                        </Badge>
                      </SelectItem>
                      <SelectItem value="shipped">
                        <Badge variant="secondary" className={cn("text-xs px-2 py-0.5", getStatusStyle("shipped"))}>
                          Expédié
                        </Badge>
                      </SelectItem>
                      <SelectItem value="paid">
                        <Badge variant="secondary" className={cn("text-xs px-2 py-0.5", getStatusStyle("paid"))}>
                          Payé
                        </Badge>
                      </SelectItem>
                      <SelectItem value="cancelled">
                        <Badge variant="secondary" className={cn("text-xs px-2 py-0.5", getStatusStyle("cancelled"))}>
                          Annulé
                        </Badge>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVerticalIcon className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[120px]">
                      <DropdownMenuItem onClick={() => handleViewClick(order)} className="py-2">
                        <EyeIcon className="h-4 w-4 mr-2" />
                        <span className="text-sm">Voir</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleEditOrder(order)}
                        className="py-2"
                      >
                        <PencilIcon className="h-4 w-4 mr-2" />
                        <span className="text-sm">Modifier</span>
                      </DropdownMenuItem>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem 
                            className="text-red-600 py-2"
                            onSelect={(e) => e.preventDefault()}
                          >
                            <TrashIcon className="h-4 w-4 mr-2" />
                            <span className="text-sm">Supprimer</span>
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="sm:max-w-[425px]">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Supprimer la Commande</AlertDialogTitle>
                            <AlertDialogDescription>
                              Êtes-vous sûr de vouloir supprimer cette commande ? Cette action est irréversible.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(order.id)}
                            >
                              Supprimer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      <div className="p-3 sm:p-4 border-t">
        <div className="flex flex-col gap-3 md:gap-4 md:flex-row md:items-center md:justify-between">
          <div className="text-xs md:text-sm text-gray-500 text-center md:text-left order-2 md:order-1">
            {pagination.perPage === 99999 ? (
              <span className="break-words">Affichage de toutes les {pagination.total} entrées</span>
            ) : (
              <span className="break-words">
                Affichage de {((pagination.currentPage - 1) * pagination.perPage) + 1} à {Math.min(pagination.currentPage * pagination.perPage, pagination.total)} sur {pagination.total} entrées
              </span>
            )}
          </div>
          <div className="w-full md:w-auto flex justify-center md:justify-end order-1 md:order-2">
            <Pagination>
              <PaginationContent className="flex-wrap gap-1 md:gap-0">
                {pagination.currentPage > 1 && (
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                      className="text-xs md:text-sm h-8 md:h-10"
                    />
                  </PaginationItem>
                )}
                {Array.from({ length: pagination.lastPage }, (_, i) => i + 1)
                  .filter(page => {
                    if (pagination.lastPage <= 7) return true;
                    if (page === 1 || page === pagination.lastPage) return true;
                    if (Math.abs(page - pagination.currentPage) <= 2) return true;
                    return false;
                  })
                  .map((page, i, array) => {
                    if (i > 0 && array[i - 1] !== page - 1) {
                      return (
                        <PaginationItem key={`ellipsis-${page}`}>
                          <span className="px-2 md:px-4 py-2 text-xs md:text-sm">...</span>
                        </PaginationItem>
                      );
                    }
                    return (
                      <PaginationItem key={page}>
                        <PaginationLink
                          isActive={page === pagination.currentPage}
                          onClick={() => handlePageChange(page)}
                          className="text-xs md:text-sm h-8 md:h-10 min-w-[32px] md:min-w-[40px]"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                {pagination.currentPage < pagination.lastPage && (
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                      className="text-xs md:text-sm h-8 md:h-10"
                    />
                  </PaginationItem>
                )}
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      </div>
    </Card>

    <Dialog 
      open={isDialogOpen}
      onOpenChange={(open) => {
        if (!open) {
          resetForm();
          setSelectedOrder(null);
        }
        setIsDialogOpen(open);
        // Reset pointer-events when dialog closes
        if (!open) {
          document.body.style.pointerEvents = 'auto';
        }
      }}
    >
      <DialogContent className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] max-w-[95vw] sm:max-w-[90vw] md:max-w-[85vw] lg:max-w-3xl w-full p-0 overflow-hidden bg-white rounded-lg shadow-lg max-h-[95vh] sm:max-h-[90vh] md:max-h-[85vh] flex flex-col">
        <motion.div
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={popupAnimationVariants.content}
          className="flex-1 overflow-y-auto"
        >
          <div className="sticky top-0 bg-white z-20 px-4 sm:px-5 md:px-6 pt-4 sm:pt-5 md:pt-6 pb-3 sm:pb-3 md:pb-4 border-b">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl md:text-xl lg:text-2xl font-bold text-[#00897B] flex items-center gap-2">
                <div className="w-8 sm:w-9 md:w-10 h-8 sm:h-9 md:h-10 rounded-full bg-[#00897B]/10 flex items-center justify-center flex-shrink-0">
                  <Icon 
                    icon={selectedOrder ? "lucide:edit" : "lucide:plus"} 
                    className="h-4 sm:h-4 md:h-5 w-4 sm:w-4 md:w-5 text-[#00897B]" 
                  />
                </div>
                <span className="break-words">{selectedOrder ? 'Modifier la Commande' : 'Ajouter une Commande'}</span>
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm md:text-sm text-gray-500 mt-1">
                {selectedOrder ? 'Modifiez les détails de la commande ci-dessous.' : 'Remplissez les détails de la commande ci-dessous.'}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-4 sm:p-5 md:p-6">
            <form id="orderForm" onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 md:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
                <div className="space-y-4">
                  <Label>Nom</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Entrez le nom"
                  />
                  {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                </div>

                <div className="space-y-4">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Entrez l'email"
                  />
                  {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                </div>

                <div className="space-y-4">
                  <Label>Téléphone</Label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Entrez le numéro de téléphone"
                  />
                  {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
                </div>

                <div className="space-y-4">
                  <Label>Ville</Label>
                  <Select
                    value={formData.city}
                    onValueChange={(value) => setFormData({ ...formData, city: value })}
                  >
                    <SelectTrigger>
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <Label>Blane</Label>
                  <Select
                    value={formData.blane_id ? formData.blane_id.toString() : undefined}
                    onValueChange={(value) => setFormData({ ...formData, blane_id: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un blane" />
                    </SelectTrigger>
                    <SelectContent>
                      {blanes.map((blane) => (
                        <SelectItem key={blane.id} value={String(blane.id ?? '')}>
                          {blane.name} - {blane.price_current} DH
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.blane_id && <p className="text-sm text-red-500">{errors.blane_id}</p>}
                </div>

                <div className="space-y-4">
                  <Label>Quantité</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                  />
                  {errors.quantity && <p className="text-sm text-red-500">{errors.quantity}</p>}
                </div>

                <div className="space-y-4 md:col-span-2">
                  <Label>Adresse de livraison</Label>
                  <Textarea
                    value={formData.delivery_address}
                    onChange={(e) => setFormData({ ...formData, delivery_address: e.target.value })}
                    placeholder="Entrez l'adresse de livraison"
                  />
                  {errors.delivery_address && (
                    <p className="text-sm text-red-500">{errors.delivery_address}</p>
                  )}
                </div>

                <div className="space-y-4 md:col-span-2">
                  <Label>Statut</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: OrderType["status"]) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue>
                        <Badge 
                          variant="secondary" 
                          className={cn(
                            "text-xs px-2 py-0.5", 
                            getStatusStyle(formData.status || 'pending')
                          )}
                        >
                          {formData.status 
                            ? formData.status.charAt(0).toUpperCase() + formData.status.slice(1) 
                            : "Sélectionnez un statut"}
                        </Badge>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">
                        <Badge variant="secondary" className={cn("text-xs px-2 py-0.5", getStatusStyle("pending"))}>
                          En attente
                        </Badge>
                      </SelectItem>
                      <SelectItem value="confirmed">
                        <Badge variant="secondary" className={cn("text-xs px-2.5 py-1", getStatusStyle("confirmed"))}>
                          Confirmé
                        </Badge>
                      </SelectItem>
                      <SelectItem value="shipped">
                        <Badge variant="secondary" className={cn("text-xs px-2 py-0.5", getStatusStyle("shipped"))}>
                          Expédié
                        </Badge>
                      </SelectItem>
                      <SelectItem value="paid">
                        <Badge variant="secondary" className={cn("text-xs px-2.5 py-1", getStatusStyle("paid"))}>
                          Payé
                        </Badge>
                      </SelectItem>
                      <SelectItem value="cancelled">
                        <Badge variant="secondary" className={cn("text-xs px-2 py-0.5", getStatusStyle("cancelled"))}>
                          Annulé
                        </Badge>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.status && <p className="text-sm text-red-500">{errors.status}</p>}
                </div>
              </div>
            </form>
          </div>

          <div className="sticky bottom-0 bg-white border-t p-4 sm:p-5 md:p-6 z-10">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-2 md:gap-3 sm:justify-end">
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto text-sm md:text-sm lg:text-base order-2 sm:order-1"
                >
                  Annuler
                </Button>
              </DialogClose>
              <Button 
                type="submit"
                form="orderForm"
                disabled={isSaving}
                className="w-full sm:w-auto bg-[#00897B] hover:bg-[#00796B] text-white text-sm md:text-sm lg:text-base order-1 sm:order-2"
              >
                {isSaving ? (
                  <div className="flex items-center gap-2">
                    <Icon icon="lucide:loader" className="h-4 w-4 animate-spin" />
                    <span className="hidden sm:inline">{selectedOrder ? 'Mise à jour...' : 'Ajout...'}</span>
                    <span className="sm:hidden">{selectedOrder ? 'Mise à jour...' : 'Ajout...'}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Icon icon={selectedOrder ? "lucide:check" : "lucide:plus"} className="h-4 w-4" />
                    <span className="hidden sm:inline">{selectedOrder ? 'Mettre à jour la Commande' : 'Ajouter la Commande'}</span>
                    <span className="sm:hidden">{selectedOrder ? 'Mettre à jour' : 'Ajouter'}</span>
                  </div>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>

    <Dialog 
      open={isViewDialogOpen} 
      onOpenChange={(open) => {
        setIsViewDialogOpen(open);
        if (!open) {
          setSelectedOrder(null);
        }
        // Reset pointer-events when dialog closes
        if (!open) {
          document.body.style.pointerEvents = 'auto';
        }
      }}
    >
      <DialogContent className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] max-w-[95vw] sm:max-w-[90vw] md:max-w-[85vw] lg:max-w-2xl w-full p-0 overflow-hidden bg-white rounded-lg shadow-lg max-h-[95vh] sm:max-h-[90vh] md:max-h-[85vh] flex flex-col">
        <button
          className="absolute right-2 sm:right-3 md:right-4 top-2 sm:top-3 md:top-4 z-30 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
          onClick={() => setIsViewDialogOpen(false)}
        >
          <Icon icon="lucide:x" className="h-4 w-4 sm:h-4 sm:w-4 md:h-5 md:w-5" />
          <span className="sr-only">Fermer</span>
        </button>
        
        {selectedOrder && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={popupAnimationVariants.content}
            className="flex-1 overflow-y-auto"
          >
            <div className="sticky top-0 bg-white z-20 px-4 sm:px-5 md:px-6 pt-4 sm:pt-5 md:pt-6 pb-3 sm:pb-3 md:pb-4 border-b">
              <DialogHeader>
                <DialogTitle className="text-lg sm:text-xl md:text-xl lg:text-2xl font-bold text-[#00897B] flex items-center gap-2">
                  <div className="w-8 sm:w-9 md:w-10 h-8 sm:h-9 md:h-10 rounded-full bg-[#00897B]/10 flex items-center justify-center flex-shrink-0">
                    <Icon icon="lucide:package" className="h-4 sm:h-4 md:h-5 w-4 sm:w-4 md:w-5 text-[#00897B]" />
                  </div>
                  <span className="break-words">Détails de la Commande</span>
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-sm md:text-sm text-gray-500 mt-1">
                  Commande #{selectedOrder.NUM_ORD}
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="p-4 sm:p-5 md:p-6 space-y-4 sm:space-y-5 md:space-y-6">
              {/* Informations sur la commande */}
              <div className="grid gap-4 sm:gap-5 md:gap-6 grid-cols-1 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-500">Blane</label>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                      <Icon icon="lucide:shopping-bag" className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium">{findBlaneName(selectedOrder.blane_id)}</p>
                      <p className="text-sm text-gray-500">
                        {blanes.find(b => b.id === selectedOrder.blane_id)?.price_current} DH
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-500">Informations du Client</label>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                      <Icon icon="lucide:user" className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-800 font-bold">{customers.find(b => b.id === selectedOrder.customers_id)?.name}</p>
                      <p className="text-sm text-gray-500">{customers.find(b => b.id === selectedOrder.customers_id)?.email}</p>
                      <p className="text-sm text-gray-800 font-bold">{selectedOrder.phone}</p>
                      <p className="text-sm text-gray-500">{customers.find(b => b.id === selectedOrder.customers_id)?.city}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-500">Détails de la Commande</label>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                      <Icon icon="lucide:list" className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        Quantité: {selectedOrder.quantity}
                      </p>
                      <p className="text-sm text-gray-800 font-bold">
                        Montant TTC: {selectedOrder.total_price} DH
                      </p>
                      {selectedOrder.payment_method == "partiel" && (
                        <div>
                      <p className="text-sm text-gray-500 font-bold">
                        Prix partiel: {selectedOrder.partiel_price} DH
                      </p>
                      <p className="text-sm text-yellow-800 font-bold">
                        Le reste: {(selectedOrder.total_price - selectedOrder.partiel_price)} DH
                      </p>
                      </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-500">Statut</label>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                      <Icon icon="lucide:check-circle" className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <Badge variant="secondary" className={cn(
                        "text-xs",
                        selectedOrder.status === "confirmed" || selectedOrder.status === "paid" ? "px-2.5 py-1" : "px-2 py-0.5",
                        getStatusStyle(selectedOrder.status)
                      )}>
                        {selectedOrder.status?.charAt(0).toUpperCase() + selectedOrder.status?.slice(1)}
                      </Badge>
                      <p className="text-sm text-gray-500 mt-1">
                        {format(new Date(selectedOrder.created_at), "PPp")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              
              {/* Adresse de livraison */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500">Adresse de livraison</label>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Icon icon="lucide:map-pin" className="h-5 w-5 text-gray-600" />
                  </div>
                  <p className="text-sm leading-relaxed break-words">
                    {selectedOrder.delivery_address} ,{findCustomerCity(selectedOrder.customers_id)}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500">Commentaire</label>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Icon icon="lucide:message-square" className="h-5 w-5 text-gray-600" />
                  </div>
                  <p className="text-sm leading-relaxed break-words">
                  {selectedOrder.comments}
                  </p>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t p-4 sm:p-5 md:p-6 z-10">
              <Button
                variant="outline"
                onClick={() => setIsViewDialogOpen(false)}
                className="w-full sm:w-auto text-sm md:text-sm lg:text-base"
              >
                Fermer
              </Button>
            </div>
          </motion.div>
        )}
      </DialogContent>
    </Dialog>

    {/* Boîte de dialogue de confirmation de suppression */}
    <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
      <AlertDialogContent className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] max-w-[95vw] sm:max-w-[90vw] md:max-w-[400px] w-full p-0 overflow-hidden bg-white rounded-lg shadow-lg">
        <motion.div
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={popupAnimationVariants.content}
          className="p-4 sm:p-5 md:p-6"
        >
          <div className="flex flex-col items-center text-center">
            <div className="w-10 h-10 sm:w-11 md:w-12 sm:h-11 md:h-12 rounded-full bg-red-100 flex items-center justify-center mb-3 sm:mb-3 md:mb-4">
              <Icon icon="lucide:trash-2" className="h-5 w-5 sm:h-5 sm:w-5 md:h-6 md:w-6 text-red-600" />
            </div>
            <AlertDialogHeader className="space-y-2">
              <AlertDialogTitle className="text-lg sm:text-xl md:text-xl font-semibold">
                Supprimer la Commande
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm md:text-sm lg:text-base text-gray-500">
                Êtes-vous sûr de vouloir supprimer cette commande ? Cette action est irréversible.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="w-full mt-4 sm:mt-5 md:mt-6">
              <AlertDialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-2 md:gap-3 w-full">
                <AlertDialogCancel 
                  className="w-full sm:w-auto mt-0 text-sm md:text-sm lg:text-base order-2 sm:order-1"
                  onClick={() => {
                    setOrderToDelete(null);
                    setIsDeleteDialogOpen(false);
                  }}
                >
                  Annuler
                </AlertDialogCancel>
                <AlertDialogAction
                  className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-sm md:text-sm lg:text-base order-1 sm:order-2"
                  onClick={async () => {
                    if (orderToDelete) {
                      try {
                        await handleDelete(orderToDelete.id);
                        setIsDeleteDialogOpen(false);
                        setOrderToDelete(null);
                        toast.success("Commande supprimée avec succès");
                      } catch (error) {
                        toast.error("Échec de la suppression de la commande");
                      }
                    }
                  }}
                >
                  <span className="hidden sm:inline">Supprimer la Commande</span>
                  <span className="sm:hidden">Supprimer</span>
                </AlertDialogAction>
              </AlertDialogFooter>
            </div>
          </div>
        </motion.div>
      </AlertDialogContent>
    </AlertDialog>
  </div>
  );
}

export default Orders;