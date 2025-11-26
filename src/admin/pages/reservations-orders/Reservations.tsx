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
import { ReservationFormData, ReservationType } from "@/admin/lib/api/types/reservations";
import { Blane } from "@/admin/lib/api/types/blane";
import { City } from "@/admin/lib/api/types/city";
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
import { CustomerService } from "@/admin/lib/api/services/customerService";
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
    end_date: format(new Date(), "yyyy-MM-dd"), // Add required end_date field
    time: format(new Date(), "HH:mm"),
    comments: "",
    status: "pending",
    quantity: 1,
    total_price: 0,
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
        const [blanesResponse, citiesResponse, customersResponse] = await Promise.all([
          blaneApi.getBlanesByType('reservation'),
          cityApi.getCities(),
          CustomerService.getAll(),
        ]);
        setBlanes(blanesResponse.data);
        setCities(citiesResponse.data);
        setCustomers(customersResponse.data);

        // Fetch all users by making multiple requests if needed
        const fetchAllUsers = async () => {
          let allUsers: User[] = [];
          let currentPage = 1;
          let hasMorePages = true;
          const pageSize = 100; // Fetch 100 users per page
          let totalPages = 1;

          console.log('🔄 Starting to fetch all users...');

          while (hasMorePages) {
            try {
              console.log(`📥 Fetching users page ${currentPage}...`);
              const usersResponse = await userApi.getUsers({
                page: currentPage,
                paginationSize: pageSize
              });

              console.log(`📊 Page ${currentPage} response:`, {
                usersCount: usersResponse.data?.length || 0,
                total: usersResponse.meta?.total || 0,
                currentPage: usersResponse.meta?.current_page || currentPage,
                lastPage: usersResponse.meta?.last_page || 1,
                perPage: usersResponse.meta?.per_page || pageSize
              });

              if (usersResponse.data && usersResponse.data.length > 0) {
                allUsers = [...allUsers, ...usersResponse.data];
                totalPages = usersResponse.meta?.last_page || 1;
                const totalUsers = usersResponse.meta?.total || 0;

                // Check if there are more pages based on meta data
                hasMorePages = currentPage < totalPages;

                // Safety check: if we got a full page of users but haven't reached the total, continue
                if (usersResponse.data.length === pageSize && allUsers.length < totalUsers) {
                  // If we got a full page but haven't reached total, there might be more pages
                  if (currentPage >= totalPages) {
                    console.log(`⚠️ Got full page (${pageSize} users) but meta says no more pages. Total users: ${totalUsers}, fetched: ${allUsers.length}. Trying next page anyway...`);
                    hasMorePages = true; // Try one more page to be safe
                  }
                }

                console.log(`✅ Page ${currentPage}: Fetched ${usersResponse.data.length} users. Total so far: ${allUsers.length}/${totalUsers}. Has more pages: ${hasMorePages} (last_page: ${totalPages})`);

                currentPage++;
              } else {
                console.log(`⚠️ Page ${currentPage}: No users returned, stopping fetch`);
                hasMorePages = false;
              }
            } catch (error) {
              console.error(`❌ Error fetching users page ${currentPage}:`, error);
              // Don't stop on error, try to continue if we haven't reached the last page
              if (currentPage < totalPages) {
                currentPage++;
                console.log(`🔄 Continuing to next page despite error...`);
              } else {
                hasMorePages = false;
              }
            }
          }

          // Filter out vendors - only keep regular users
          // Vendors typically have roles like 'vendor', 'seller', 'vendeur', or 'commercant'
          // Also check user name for vendor-related keywords
          const vendorRoleKeywords = ['vendor', 'seller', 'vendeur', 'commercant', 'merchant'];
          const regularUsers: User[] = [];
          const vendorUsers: User[] = [];

          allUsers.forEach(user => {
            const roles = user.roles || [];
            const userName = user.name?.toLowerCase().trim() || '';
            const userEmail = user.email?.toLowerCase().trim() || '';

            // Check if user has vendor role
            const hasVendorRole = roles.some(role => {
              const roleLower = String(role || '').toLowerCase();
              return vendorRoleKeywords.some(keyword => roleLower.includes(keyword));
            });

            // Also check if name or email contains vendor-related keywords
            const nameContainsVendor = vendorRoleKeywords.some(keyword =>
              userName.includes(keyword)
            );

            // Check if email domain or name suggests vendor (e.g., contains "vendor" in name)
            const isVendor = hasVendorRole || nameContainsVendor;

            if (isVendor) {
              vendorUsers.push(user);
            } else {
              regularUsers.push(user);
            }
          });

          setUsers(regularUsers);
          console.log(`✅ Finished fetching users. Total: ${allUsers.length} users`);
          console.log(`📊 Filtered results: ${regularUsers.length} regular users, ${vendorUsers.length} vendors (excluded)`);
          if (vendorUsers.length > 0) {
            console.log(`🔍 Sample vendors excluded:`, vendorUsers.slice(0, 5).map(u => ({
              name: u.name,
              email: u.email,
              roles: u.roles
            })));
          }
        };

        fetchAllUsers();
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
      // Get selected user - ensure proper type conversion for ID comparison
      const selectedUser = userFilter !== "all"
        ? users.find(u => String(u.id) === String(userFilter) || Number(u.id) === Number(userFilter))
        : null;

      let customerIds: number[] = [];
      const userEmail = selectedUser?.email?.toLowerCase().trim();
      const userName = selectedUser?.name?.toLowerCase().trim();
      const userPhone = selectedUser?.phone?.toLowerCase().trim();

      console.log('🔍 User filter selected:', {
        userFilter,
        selectedUser: selectedUser ? { id: selectedUser.id, name: selectedUser.name, email: selectedUser.email } : null,
        userEmail,
        userName
      });

      if (selectedUser && userEmail) {
        // When filtering by a specific user, match by EXACT email only (like a search function)
        // This ensures we only find customers with the exact email match
        const matchingCustomers = customers.filter(c => {
          const customerEmail = c.email?.toLowerCase().trim();
          // Only match by exact email - like a search function
          return customerEmail === userEmail;
        });
        customerIds = matchingCustomers.map(c => c.id);
        console.log(`📋 Found ${customerIds.length} matching customers for user ${selectedUser.name} (${userEmail})`, {
          matchingCustomers: matchingCustomers.map(c => ({ id: c.id, email: c.email, name: c.name, phone: c.phone }))
        });

        if (customerIds.length === 0) {
          console.log(`ℹ️ No customers found with email "${userEmail}". Will search reservations by exact email match.`);
        }
      }

      // When filtering by user, fetch all matching reservations first, then paginate client-side
      const response = await reservationApi.getReservations({
        page: userEmail ? 1 : pagination.currentPage,
        paginationSize: userEmail ? 9999 : pagination.perPage, // Fetch all when filtering by user
        sortBy,
        sortOrder,
        // Don't use search parameter when filtering by user - fetch all and filter client-side
        search: userEmail ? undefined : (searchTerm || undefined),
        ...(statusFilter !== "all" && { status: statusFilter }),
        // Note: user_id filter may not work on backend, so we filter client-side instead
      });

      // Filter by user if a user is selected
      let filteredData = response.data;
      if (userEmail && selectedUser?.id) {
        console.log(`🔍 API returned ${response.data.length} reservations. Filtering for user: ${selectedUser.name} (${userEmail}, user_id: ${selectedUser.id})`);

        // Debug: Show unique emails in the returned reservations to understand what we're working with
        const uniqueReservationEmails = [...new Set(response.data.map(r => r.email?.toLowerCase().trim()).filter(Boolean))];
        const uniqueCustomerEmails = [...new Set(
          response.data
            .map(r => {
              const customer = customers.find(c => c.id === r.customers_id);
              return customer?.email?.toLowerCase().trim();
            })
            .filter(Boolean)
        )];
        console.log(`📧 Unique reservation emails (${uniqueReservationEmails.length}):`, uniqueReservationEmails.slice(0, 10));
        console.log(`📧 Unique customer emails (${uniqueCustomerEmails.length}):`, uniqueCustomerEmails.slice(0, 10));
        console.log(`🔎 Looking for email: ${userEmail}`);

        // Check if the search email is in the results
        const emailFoundInReservations = uniqueReservationEmails.some(e => e === userEmail);
        const emailFoundInCustomers = uniqueCustomerEmails.some(e => e === userEmail);
        console.log(`✅ Email ${userEmail} - Found in reservations: ${emailFoundInReservations}, Found in customers: ${emailFoundInCustomers}`);

        // When filtering by user, match by EXACT email only (like a search function)
        // This ensures we show only reservations that match the selected user's email exactly
        let matchedByCustomerId = 0;
        let matchedByReservationEmail = 0;
        let matchedByCustomerEmail = 0;

        filteredData = response.data.filter(reservation => {
          // Get reservation email (after customer mapping, this should preserve original email)
          const reservationEmail = reservation.email?.toLowerCase().trim();

          // First priority: match by customer ID (if we found matching customers with exact email)
          if (customerIds.length > 0 && reservation.customers_id && customerIds.includes(reservation.customers_id)) {
            matchedByCustomerId++;
            return true;
          }

          // Second priority: match by EXACT email on the reservation
          // This is the primary search criteria - exact email match
          if (reservationEmail && reservationEmail === userEmail) {
            matchedByReservationEmail++;
            return true;
          }

          // Third priority: match by customer email (check if the reservation's customer has exact email match)
          // This handles cases where reservation email might be null or different from customer email
          if (reservation.customers_id) {
            const customer = customers.find(c => c.id === reservation.customers_id);
            if (customer) {
              const customerEmail = customer.email?.toLowerCase().trim();
              // Only match by exact email - like a search function
              if (customerEmail && customerEmail === userEmail) {
                matchedByCustomerEmail++;
                return true;
              }
            }
          }

          return false;
        });

        console.log(`✅ Filtered results: ${filteredData.length} total reservations for email "${userEmail}"`, {
          byCustomerId: matchedByCustomerId,
          byReservationEmail: matchedByReservationEmail,
          byCustomerEmail: matchedByCustomerEmail
        });

        // Debug: Show sample reservations
        if (filteredData.length > 0) {
          const sampleReservations = filteredData.slice(0, 5).map(r => {
            const customer = customers.find(c => c.id === r.customers_id);
            return {
              reservation_id: r.id,
              reservation_email: r.email,
              customer_email: customer?.email,
              customer_id: r.customers_id,
              name: r.name
            };
          });
          console.log('📋 Sample filtered reservations:', sampleReservations);
        } else {
          console.warn(`⚠️ No reservations found for user ${selectedUser.name} (${userEmail}).`);

          // Show detailed debugging info
          if (response.data.length > 0) {
            // Show sample reservations with both reservation and customer emails
            const sampleReservations = response.data.slice(0, 10).map(r => {
              const customer = customers.find(c => c.id === r.customers_id);
              return {
                id: r.id,
                reservation_email: r.email || '(empty)',
                customer_email: customer?.email || '(no customer)',
                customer_id: r.customers_id,
                name: r.name
              };
            });
            console.log(`   📊 Sample of ${response.data.length} returned reservations:`, sampleReservations);
            console.log(`   🔍 Looking for: "${userEmail}"`);
            console.log(`   💡 Tip: Check if the email matches either reservation_email or customer_email above`);
          } else {
            console.warn(`   No reservations returned from API at all.`);
          }
        }

        // Apply client-side pagination after filtering
        const startIndex = (pagination.currentPage - 1) * pagination.perPage;
        const endIndex = startIndex + pagination.perPage;
        filteredData = filteredData.slice(startIndex, endIndex);
      }

      setReservations(filteredData);

      // Update pagination metadata
      if (userEmail) {
        // Calculate total filtered count using the same logic as filtering (exact email match only)
        const totalFiltered = response.data.filter(reservation => {
          const reservationEmail = reservation.email?.toLowerCase().trim();

          // First priority: match by customer ID (most precise)
          if (customerIds.length > 0 && customerIds.includes(reservation.customers_id)) {
            return true;
          }

          // Second priority: match by EXACT email on the reservation
          if (reservationEmail === userEmail) {
            return true;
          }

          // Third priority: match by customer email (check if the reservation's customer has exact email match)
          if (reservation.customers_id) {
            const customer = customers.find(c => c.id === reservation.customers_id);
            if (customer) {
              const customerEmail = customer.email?.toLowerCase().trim();
              // Only match by exact email - like a search function
              if (customerEmail === userEmail) {
                return true;
              }
            }
          }

          return false;
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
        .map((part: string) => part.padStart(2, '0'))
        .slice(0, 2) // Ensure we only get HH:mm
        .join(':');

      const validatedData = {
        ...formData,
        time: formattedTime,
        date: format(new Date(formData.date), "yyyy-MM-dd"),
        end_date: formData.end_date || format(new Date(formData.date), "yyyy-MM-dd"), // Ensure end_date is set
        comments: formData.comments || "",
      };

      // Parse with schema first (which uses "cancelled")
      const parsedData = reservationSchema.parse(validatedData);

      // Convert to ReservationFormData format (convert "cancelled" to "canceled" and ensure end_date)
      // Also remove number_persons if it exists (not in ReservationFormData)
      const { number_persons, ...dataWithoutNumberPersons } = parsedData as any;
      const statusConversion: Record<string, "pending" | "confirmed" | "canceled" | undefined> = {
        "cancelled": "canceled",
        "paid": undefined, // "paid" is not valid for ReservationFormData
        "pending": "pending",
        "confirmed": "confirmed"
      };
      const formDataForApi: ReservationFormData = {
        ...dataWithoutNumberPersons,
        end_date: validatedData.end_date,
        status: statusConversion[parsedData.status] ?? "pending",
      };

      if (selectedReservation) {
        await reservationApi.updateReservation(selectedReservation.id.toString(), formDataForApi);
        toast.success("Reservation updated successfully");
      } else {
        await reservationApi.createReservation(formDataForApi);
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
      end_date: format(new Date(), "yyyy-MM-dd"), // Add required end_date
      time: format(new Date(), "HH:mm"),
      comments: "",
      status: "pending",
      quantity: 1,
      total_price: 0,
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
      // Get selected user - ensure proper type conversion for ID comparison
      const selectedUser = userFilter !== "all"
        ? users.find(u => String(u.id) === String(userFilter) || Number(u.id) === Number(userFilter))
        : null;
      let customerIds: number[] = [];
      const userEmail = selectedUser?.email?.toLowerCase().trim();
      const userName = selectedUser?.name?.toLowerCase().trim();

      if (selectedUser && userEmail) {
        // Find customers that match the user's email (primary) and optionally name
        const matchingCustomers = customers.filter(c => {
          const customerEmail = c.email?.toLowerCase().trim();
          const emailMatch = customerEmail === userEmail;

          // If both have names, try to match by name too (but email is primary)
          if (userName && c.name) {
            const customerName = c.name?.toLowerCase().trim();
            const nameMatch = customerName === userName;
            // Match if email matches, and if names exist, they should also match
            return emailMatch && (!userName || !c.name || nameMatch);
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
        // Match reservations by email (primary) and optionally by name
        return response.data.filter(reservation => {
          const reservationEmail = reservation.email?.toLowerCase().trim();
          const reservationName = reservation.name?.toLowerCase().trim();

          // First priority: match by customer ID (most precise)
          if (customerIds.length > 0 && customerIds.includes(reservation.customers_id)) {
            return true;
          }

          // Second priority: match by email (primary matching criteria)
          const emailMatch = reservationEmail === userEmail;

          // If both have names, also check name match (but email is still primary)
          if (emailMatch) {
            if (userName && reservationName) {
              // Both have names - they should match
              const nameMatch = reservationName === userName;
              if (nameMatch) {
                return true;
              }
              // If email matches but name doesn't, still return true (email is primary)
              return true;
            }
            // Email matches, return true regardless of name
            return true;
          }

          return false;
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
        // ReservationType uses city as string, not city_id
        const city = cities.find(c => c.name === reservation.city);

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
      end_date: (reservation as any).end_date || format(new Date(reservation.date), "yyyy-MM-dd"), // Add required end_date
      time: reservation.time.substring(0, 5),
      comments: reservation.comments || "",
      status: reservation.status,
      quantity: reservation.quantity,
      total_price: (reservation as any).total_price || 0, // total_price may not be in ReservationType
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

        setFormData((prev: ReservationFormData) => ({
          ...prev,
          total_price: newTotalPrice,
          number_persons: newNumberPersons
        }));
      }
    }
  }, [formData.blane_id, formData.quantity, calculateTotalPrice, blanes]);

  return (
    <div className="w-full">
      <Card className="overflow-hidden w-full">
        {/* Section d'en-tête */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={animationVariants.fadeIn}
          className="p-3 sm:p-4 md:p-6 bg-gradient-to-r from-[#00897B] to-[#00796B]"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
            <div className="text-white flex-1 min-w-0">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold break-words">Gestion des Réservations</h2>
              <p className="text-gray-100 mt-1 text-sm sm:text-base">Gérez vos réservations et réservations</p>
            </div>
            <Button
              onClick={() => {
                resetForm();
                setIsAddEditDialogOpen(true);
              }}
              className="bg-white text-[#00897B] hover:bg-gray-100 transition-colors w-full sm:w-auto shrink-0 text-sm sm:text-base"
            >
              <PlusIcon className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Ajouter une Réservation</span>
              <span className="sm:hidden">Ajouter</span>
            </Button>
          </div>
        </motion.div>

        {/* Section des filtres */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={animationVariants.fadeIn}
          className="p-3 sm:p-4 md:p-6 border-b space-y-3 sm:space-y-4"
        >
          <div className="flex flex-col gap-3 sm:gap-4">
            {/* Barre de recherche */}
            <div className="relative w-full">
              <Input
                placeholder="Rechercher des réservations..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  handleSearch(e.target.value);
                }}
                className="pl-10 w-full text-sm sm:text-base"
              />
              <Icon
                icon="lucide:search"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4"
              />
            </div>

            {/* Grille des filtres */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-3 lg:gap-4">
              <div className="col-span-1 sm:col-span-1 md:col-span-1 lg:col-span-1">
                <Select value={statusFilter} onValueChange={handleStatusChange}>
                  <SelectTrigger className="w-full text-sm md:text-sm lg:text-base">
                    <SelectValue>
                      {statusFilter === "all" ? (
                        "Tous les statuts"
                      ) : (
                        <Badge variant="default" className={cn("text-xs md:text-xs lg:text-sm", getStatusStyle(statusFilter as "pending" | "confirmed" | "cancelled" | "paid"))}>
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
              <div className="col-span-1 sm:col-span-1 md:col-span-1 lg:col-span-1">
                <Select value={userFilter} onValueChange={handleUserFilterChange}>
                  <SelectTrigger className="w-full text-sm md:text-sm lg:text-base">
                    <SelectValue>
                      {userFilter === "all" ? (
                        "User Filter"
                      ) : (
                        <span className="truncate">{users.find(u => u.id === userFilter)?.name || "User Filter"}</span>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        <span className="truncate">{user.name} ({user.email})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-1 sm:col-span-1 md:col-span-1 lg:col-span-1">
                <Select
                  value={pagination.perPage.toString()}
                  onValueChange={handlePerPageChange}
                >
                  <SelectTrigger className="w-full text-sm md:text-sm lg:text-base">
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
              <div className="col-span-1 sm:col-span-2 md:col-span-2 lg:col-span-1">
                <Button
                  variant="outline"
                  onClick={handleExport}
                  className="w-full text-sm md:text-sm lg:text-base"
                >
                  <DownloadIcon className="h-4 w-4 mr-1 md:mr-2" />
                  <span className="hidden sm:inline">Exporter</span>
                  <span className="sm:hidden">Export</span>
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Section du tableau */}
        <div className="w-full overflow-x-auto -mx-0 sm:mx-0">
          {/* Desktop/Tablet Table View */}
          <div className="hidden md:block">
            <div className="overflow-x-auto">
              <Table className="w-full min-w-[700px] md:min-w-0">
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-[20%] md:min-w-[140px] lg:min-w-[150px]">Client</TableHead>
                    <TableHead className="w-[30%] md:min-w-[180px] lg:min-w-[200px]">Détails</TableHead>
                    <TableHead className="w-[100px] md:w-[110px] lg:w-[120px]">Statut</TableHead>
                    <TableHead className="w-[100px] md:w-[110px] lg:w-[120px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <Icon icon="lucide:loader" className="h-6 w-6 animate-spin text-[#00897B]" />
                        <span className="ml-2">Chargement...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : reservations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center text-gray-500">
                        <Icon icon="lucide:calendar" className="h-12 w-12 mb-2" />
                        <p className="text-sm sm:text-base">Aucune réservation trouvée</p>
                        <Button
                          variant="link"
                          onClick={() => setIsAddEditDialogOpen(true)}
                          className="mt-2 text-[#00897B] text-sm sm:text-base"
                        >
                          Créez votre première réservation
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  reservations.map((reservation) => (
                    <TableRow key={reservation.id}>
                      <TableCell className="p-2 md:p-3 lg:p-4">
                        <div className="space-y-1">
                          <div className="font-medium text-xs md:text-sm lg:text-base">{reservation.name}</div>
                          <div className="text-xs text-gray-500 truncate">{reservation.email}</div>
                          <div className="text-xs text-gray-500">{reservation.phone}</div>
                        </div>
                      </TableCell>
                      <TableCell className="p-2 md:p-3 lg:p-4">
                        <div className="space-y-1">
                          <div className="font-medium text-xs md:text-sm lg:text-base truncate">
                            {blanes.find(b => b.id === reservation.blane_id)?.name}
                          </div>
                          <div className="flex items-center gap-1 md:gap-2 text-xs text-gray-500">
                            <Icon icon="lucide:calendar" className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{format(new Date(reservation.date), "PP")}</span>
                            <span className="text-gray-300">•</span>
                            <span>{reservation.time ? reservation.time.substring(0, 5) : "--:--"}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="p-2 md:p-3 lg:p-4">
                        <Select
                          value={reservation.status}
                          onValueChange={(value) => handleStatusUpdate(reservation.id, value as "pending" | "confirmed" | "cancelled" | "paid")}
                        >
                          <SelectTrigger className="w-full md:w-[100px] lg:w-[120px] h-7 md:h-8 text-xs">
                            <SelectValue>
                              <Badge variant="secondary" className={cn("text-xs px-2 py-0.5", getStatusStyle(reservation.status as "pending" | "confirmed" | "cancelled" | "paid"))}>
                                {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
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
                      </TableCell>
                      <TableCell className="text-right p-2 md:p-3 lg:p-4">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 md:h-8 md:w-8"
                            onClick={() => {
                              setSelectedReservation(reservation);
                              setIsViewDialogOpen(true);
                            }}
                          >
                            <EyeIcon className="h-3 w-3 md:h-3.5 md:w-3.5" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 md:h-8 md:w-8"
                            onClick={() => {
                              handleEditReservation(reservation);
                            }}
                          >
                            <PencilIcon className="h-3 w-3 md:h-3.5 md:w-3.5" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            className="h-7 w-7 md:h-8 md:w-8"
                            onClick={() => {
                              setIsDeleteDialogOpen(true);
                              setSelectedReservation(reservation);
                            }}
                          >
                            <TrashIcon className="h-3 w-3 md:h-3.5 md:w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            </div>
          </div>

          {/* Mobile Card View - Show on screens smaller than 768px */}
          <div className="md:hidden space-y-3 p-3 sm:p-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Icon icon="lucide:loader" className="h-6 w-6 animate-spin text-[#00897B]" />
                <span className="ml-2 text-sm">Chargement...</span>
              </div>
            ) : reservations.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-gray-500 py-12">
                <Icon icon="lucide:calendar" className="h-12 w-12 mb-2" />
                <p className="text-sm">Aucune réservation trouvée</p>
                <Button
                  variant="link"
                  onClick={() => setIsAddEditDialogOpen(true)}
                  className="mt-2 text-[#00897B] text-sm"
                >
                  Créez votre première réservation
                </Button>
              </div>
            ) : (
              reservations.map((reservation) => (
                <Card key={reservation.id} className="p-4 space-y-3">
                  {/* Client Info */}
                  <div className="space-y-1 pb-3 border-b">
                    <div className="font-semibold text-base">{reservation.name}</div>
                    <div className="text-sm text-gray-600 truncate">{reservation.email}</div>
                    <div className="text-sm text-gray-600">{reservation.phone}</div>
                  </div>

                  {/* Blane & Date Info */}
                  <div className="space-y-2">
                    <div className="font-medium text-sm text-gray-700">
                      {blanes.find(b => b.id === reservation.blane_id)?.name}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Icon icon="lucide:calendar" className="h-4 w-4" />
                      <span>{format(new Date(reservation.date), "PP")}</span>
                      <span className="text-gray-300">•</span>
                      <span>{reservation.time ? reservation.time.substring(0, 5) : "--:--"}</span>
                    </div>
                  </div>

                  {/* Status & Actions */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <Select
                      value={reservation.status}
                      onValueChange={(value) => handleStatusUpdate(reservation.id, value as "pending" | "confirmed" | "cancelled" | "paid")}
                    >
                      <SelectTrigger className="w-[110px] h-8 text-xs">
                        <SelectValue>
                          <Badge variant="secondary" className={cn("text-xs px-2 py-0.5", getStatusStyle(reservation.status as "pending" | "confirmed" | "cancelled" | "paid"))}>
                            {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
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
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedReservation(reservation);
                            setIsViewDialogOpen(true);
                            document.body.style.pointerEvents = '';
                          }}
                          className="py-2"
                        >
                          <EyeIcon className="h-4 w-4 mr-2" />
                          <span className="text-sm">Voir</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            handleEditReservation(reservation);
                            document.body.style.pointerEvents = '';
                          }}
                          className="py-2"
                        >
                          <PencilIcon className="h-4 w-4 mr-2" />
                          <span className="text-sm">Modifier</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600 py-2"
                          onClick={() => {
                            setIsDeleteDialogOpen(true);
                            setSelectedReservation(reservation);
                            document.body.style.pointerEvents = '';
                          }}
                        >
                          <TrashIcon className="h-4 w-4 mr-2" />
                          <span className="text-sm">Supprimer</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Pagination */}
        <div className="p-3 sm:p-4 md:p-4 border-t">
          <div className="flex flex-col gap-3 md:gap-4 md:flex-row md:items-center md:justify-between">
            <div className="text-xs md:text-sm text-gray-500 text-center md:text-left order-2 md:order-1">
              {pagination.perPage === 999999 ? (
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
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                      aria-disabled={pagination.currentPage <= 1}
                      className={cn(
                        "text-xs md:text-sm h-8 md:h-9 lg:h-10",
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
                            <span className="px-2 md:px-3 lg:px-4 py-2 text-xs md:text-sm">...</span>
                          </PaginationItem>
                        );
                      }
                      return (
                        <PaginationItem key={page}>
                          <PaginationLink
                            isActive={page === pagination.currentPage}
                            onClick={() => handlePageChange(page)}
                            className="text-xs md:text-sm h-8 md:h-9 lg:h-10 min-w-[32px] md:min-w-[36px] lg:min-w-[40px]"
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
                        "text-xs md:text-sm h-8 md:h-9 lg:h-10",
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
        <DialogContent className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] max-w-[95vw] sm:max-w-[90vw] md:max-w-[85vw] lg:max-w-2xl w-full p-0 overflow-hidden bg-white rounded-lg shadow-lg max-h-[95vh] sm:max-h-[90vh] md:max-h-[85vh] flex flex-col">
          <button
            className="absolute right-2 sm:right-3 md:right-4 top-2 sm:top-3 md:top-4 z-30 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
            onClick={() => setIsAddEditDialogOpen(false)}
          >
            <Icon icon="lucide:x" className="h-4 w-4 sm:h-4 sm:w-4 md:h-5 md:w-5" />
            <span className="sr-only">Fermer</span>
          </button>

          <div className="flex-1 overflow-y-auto">
            <div className="sticky top-0 bg-white z-20 px-4 sm:px-5 md:px-6 pt-4 sm:pt-5 md:pt-6 pb-3 sm:pb-3 md:pb-4 border-b">
              <DialogHeader>
                <DialogTitle className="text-lg sm:text-xl md:text-xl lg:text-2xl font-bold text-[#00897B] flex items-center gap-2">
                  <div className="w-8 sm:w-9 md:w-10 h-8 sm:h-9 md:h-10 rounded-full bg-[#00897B]/10 flex items-center justify-center flex-shrink-0">
                    <Icon icon={selectedReservation ? "lucide:edit" : "lucide:plus"} className="h-4 sm:h-4 md:h-5 w-4 sm:w-4 md:w-5 text-[#00897B]" />
                  </div>
                  <span className="break-words">{selectedReservation ? "Modifier la Réservation" : "Ajouter une Nouvelle Réservation"}</span>
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-sm md:text-sm text-gray-500 mt-1">
                  {selectedReservation
                    ? "Modifiez les détails de cette réservation"
                    : "Créez une nouvelle réservation"}
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="p-4 sm:p-5 md:p-6 space-y-4 sm:space-y-5 md:space-y-6">
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 md:space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
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
                        onValueChange={(value: "pending" | "confirmed" | "cancelled" | "paid") => {
                          // Convert "cancelled" to "canceled" and "paid" is not valid for ReservationFormData
                          const convertedStatus = value === "cancelled" ? "canceled" : (value === "paid" ? undefined : value);
                          setFormData({ ...formData, status: convertedStatus });
                        }}
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
                        : parseFloat(String(formData.total_price || 0))).toFixed(2)} DH
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

                <DialogFooter className="mt-6 sm:mt-7 md:mt-8 pt-4 border-t sticky bottom-0 bg-white z-10">
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-2 md:gap-3 w-full">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsAddEditDialogOpen(false);
                        resetForm();
                      }}
                      className="w-full sm:w-auto text-sm md:text-sm lg:text-base order-2 sm:order-1"
                    >
                      Annuler
                    </Button>
                    <Button
                      type="submit"
                      className="w-full sm:w-auto bg-[#00897B] text-white hover:bg-[#00897B]/90 text-sm md:text-sm lg:text-base order-1 sm:order-2"
                    >
                      {selectedReservation ? (
                        <>
                          <Icon icon="lucide:save" className="h-4 w-4 mr-2" />
                          <span className="hidden sm:inline">Enregistrer les modifications</span>
                          <span className="sm:hidden">Enregistrer</span>
                        </>
                      ) : (
                        <>
                          <Icon icon="lucide:plus" className="h-4 w-4 mr-2" />
                          <span className="hidden sm:inline">Créer la Réservation</span>
                          <span className="sm:hidden">Créer</span>
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
        <DialogContent className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] max-w-[95vw] sm:max-w-[90vw] md:max-w-[85vw] lg:max-w-2xl w-full p-0 overflow-hidden bg-white rounded-lg shadow-lg max-h-[95vh] sm:max-h-[90vh] md:max-h-[85vh] flex flex-col">
          <button
            className="absolute right-2 sm:right-3 md:right-4 top-2 sm:top-3 md:top-4 z-30 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
            onClick={() => setIsViewDialogOpen(false)}
          >
            <Icon icon="lucide:x" className="h-4 w-4 sm:h-4 sm:w-4 md:h-5 md:w-5" />
            <span className="sr-only">Fermer</span>
          </button>

          {selectedReservation && (
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
                      <Icon icon="lucide:calendar" className="h-4 sm:h-4 md:h-5 w-4 sm:w-4 md:w-5 text-[#00897B]" />
                    </div>
                    <span className="break-words">Détails de la Réservation</span>
                  </DialogTitle>
                  <DialogDescription className="text-xs sm:text-sm md:text-sm text-gray-500 mt-1">
                    Réservation #{(selectedReservation as any).NUM_RES || selectedReservation.id}
                  </DialogDescription>
                </DialogHeader>
              </div>

              <div className="p-4 sm:p-5 md:p-6 space-y-4 sm:space-y-5 md:space-y-6">
                {/* Informations sur la réservation */}
                <div className="grid gap-4 sm:gap-5 md:gap-6 grid-cols-1 sm:grid-cols-2">
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
                          <span className="font-medium">{(selectedReservation as any).payment_method || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span>Quantité:</span>
                          <span className="font-medium">{selectedReservation.quantity}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span>Montant TTC:</span>
                          <span className="font-medium">
                            {(typeof (selectedReservation as any).total_price === 'number'
                              ? (selectedReservation as any).total_price
                              : parseFloat((selectedReservation as any).total_price || '0')).toFixed(2)} DH
                          </span>
                        </div>
                        {(selectedReservation as any).payment_method === "partiel" && (
                          <div>
                            <div className="flex items-center gap-2 text-[#00897B]">
                              <span>Prix partiel:</span>
                              <span className="font-medium">
                                {(typeof (selectedReservation as any).partiel_price === 'number'
                                  ? (selectedReservation as any).partiel_price
                                  : parseFloat((selectedReservation as any).partiel_price || '0')).toFixed(2)} DH
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span>Le reste:</span>
                              <span className="font-medium">
                                {(typeof (selectedReservation as any).partiel_price === 'number'
                                  ? ((selectedReservation as any).total_price - (selectedReservation as any).partiel_price)
                                  : parseFloat(String((selectedReservation as any).total_price || 0))).toFixed(2)} DH
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
                        getStatusStyle(selectedReservation.status === "canceled" ? "cancelled" : (selectedReservation.status as "pending" | "confirmed" | "cancelled" | "paid"))
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
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] max-w-[95vw] sm:max-w-[90vw] md:max-w-[400px] w-full p-0 overflow-hidden bg-white rounded-lg shadow-lg">
          <motion.div
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={popupAnimationVariants.content}
            className="p-4 sm:p-5 md:p-6"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 sm:w-11 md:w-12 sm:h-11 md:h-12 rounded-full bg-red-50 flex items-center justify-center mb-3 sm:mb-3 md:mb-4">
                <Icon icon="lucide:trash-2" className="h-5 w-5 sm:h-5 sm:w-5 md:h-6 md:w-6 text-red-600" />
              </div>
              <AlertDialogHeader className="space-y-2">
                <AlertDialogTitle className="text-lg sm:text-xl md:text-xl font-semibold">
                  Supprimer la Réservation
                </AlertDialogTitle>
                <AlertDialogDescription className="text-sm md:text-sm lg:text-base text-gray-500">
                  Êtes-vous sûr de vouloir supprimer cette réservation ? Cette action est irréversible.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <div className="w-full mt-4 sm:mt-5 md:mt-6">
                <AlertDialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-2 md:gap-3 w-full">
                  <AlertDialogCancel
                    className="w-full sm:w-auto mt-0 text-sm md:text-sm lg:text-base order-2 sm:order-1"
                    onClick={() => {
                      setIsDeleteDialogOpen(false);
                      setSelectedReservation(null);
                    }}
                  >
                    Annuler
                  </AlertDialogCancel>
                  <AlertDialogAction
                    className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-sm md:text-sm lg:text-base order-1 sm:order-2"
                    onClick={() => {
                      if (selectedReservation) {
                        handleDelete(selectedReservation.id);
                      }
                    }}
                  >
                    <span className="hidden sm:inline">Supprimer la Réservation</span>
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
};

export default Reservations;