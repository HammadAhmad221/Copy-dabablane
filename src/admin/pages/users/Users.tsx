import { useState, useEffect, useCallback } from "react";
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
  DialogTrigger,
  DialogDescription,
  DialogFooter,
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
import { Eye, Pencil, Trash, Plus, Download, Loader2, EyeOff } from "lucide-react";
import { format } from 'date-fns';
import { userApi } from '@/admin/lib/api/services/userService';
import { User, UserFormData, UserFilters, UserResponse } from '@/admin/lib/api/types/user';
import { toast } from 'react-hot-toast';
import { cityApi } from '@/admin/lib/api/services/cityService';
import { CityType } from '@/admin/lib/api/types/cities';
import { PhoneInput } from '@/user/components/ui/PhoneInput';
import { parsePhoneNumberFromAPI, validateInternationalPhone } from '@/user/lib/utils/phoneValidation';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/admin/components/ui/pagination";
import { z } from "zod";
import { DownloadIcon, PlusIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/admin/components/ui/dropdown-menu";
import { MoreVerticalIcon } from "lucide-react";
import { Label } from "@/admin/components/ui/label";
import { utils, writeFile } from 'xlsx';
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";

// Add this after the imports and before the schema definitions
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

// Also add the InfoField component
const InfoField = ({ 
  label, 
  value, 
  icon,
  fullWidth = false 
}: { 
  label: string; 
  value: React.ReactNode; 
  icon?: React.ReactNode;
  fullWidth?: boolean;
}) => (
  <motion.div 
    className={`bg-white rounded-lg p-4 shadow-sm border ${fullWidth ? 'col-span-full' : ''}`}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <div className="flex items-start gap-3">
      {icon && <div className="text-gray-400 mt-1">{icon}</div>}
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-500 mb-1">
          {label}
        </label>
        <div className={`${typeof value === 'string' ? 'text-gray-900 font-medium' : ''} ${fullWidth ? 'whitespace-pre-wrap' : 'truncate'}`}>
          {value}
        </div>
      </div>
    </div>
  </motion.div>
);

// Zod schema for validation
const userSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  password_confirmation: z.string().optional(),
  roles: z.array(z.string()).min(1, 'At least one role is required'),
}).refine((data) => {
  // If password is provided, password_confirmation must match
  if (data.password) {
    return data.password === data.password_confirmation;
  }
  return true;
}, {
  message: "Passwords don't match",
  path: ["password_confirmation"],
});

const passwordSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: z.string().min(6, 'New password must be at least 6 characters'),
  confirm_password: z.string().min(6, 'Password confirmation is required'),
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
});

// Add the random password generator function
const generateRandomPassword = () => {
  const length = 12;
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#DH%^&*()_+-=[]{}|;:,.<>?';
  
  const allChars = uppercase + lowercase + numbers + symbols;
  let password = '';
  
  // Ensure at least one of each type
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

// Add AlertDialog for delete confirmation
const DeleteDialog: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void;
  onConfirm: () => void;
  userName: string;
}> = ({ isOpen, onClose, onConfirm, userName }) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] max-w-[95vw] w-full sm:max-w-[400px] p-0 overflow-hidden bg-white rounded-lg shadow-lg">
        <motion.div
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={popupAnimationVariants.content}
          className="p-6"
        >
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <Icon icon="lucide:trash-2" className="h-6 w-6 text-red-600" />
            </div>
            <AlertDialogHeader className="space-y-2">
              <AlertDialogTitle className="text-xl font-semibold">
                Delete User
              </AlertDialogTitle>
              <AlertDialogDescription className="text-gray-500">
                Are you sure you want to delete user "{userName}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="w-full mt-6">
              <AlertDialogFooter className="flex flex-col sm:flex-row gap-2 w-full">
                <AlertDialogCancel 
                  className="w-full sm:w-auto mt-0"
                  onClick={onClose}
                >
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  className="w-full sm:w-auto bg-red-600 hover:bg-red-700"
                  onClick={onConfirm}
                >
                  Delete User
                </AlertDialogAction>
              </AlertDialogFooter>
            </div>
          </div>
        </motion.div>
      </AlertDialogContent>
    </AlertDialog>
  );
};

// Add View Dialog
const ViewDialog: React.FC<{
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
}> = ({ user, isOpen, onClose }) => {
  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] max-w-[95vw] w-full sm:max-w-2xl p-0 overflow-hidden bg-white rounded-lg shadow-lg">
        <button
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
          onClick={onClose}
        >
          <Icon icon="lucide:x" className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        <div className="max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white z-20 px-6 pt-6 pb-4 border-b">
            <DialogHeader>
              <DialogTitle className="text-xl sm:text-2xl font-bold text-[#00897B] flex items-center gap-2">
                <div className="w-8 sm:w-10 h-8 sm:h-10 rounded-full bg-[#00897B]/10 flex items-center justify-center">
                  <Icon icon="lucide:user" className="h-4 sm:h-5 w-4 sm:w-5 text-[#00897B]" />
                </div>
                User Details
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500">
                User #{user.id}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <InfoField 
                label="Name"
                value={user.name}
                icon={<Icon icon="lucide:user" className="h-5 w-5" />}
              />
              <InfoField 
                label="Email"
                value={user.email}
                icon={<Icon icon="lucide:mail" className="h-5 w-5" />}
              />
              <InfoField 
                label="Phone"
                value={user.phone || 'Not provided'}
                icon={<Icon icon="lucide:phone" className="h-5 w-5" />}
              />
              <InfoField 
                label="City"
                value={user.city || 'Not provided'}
                icon={<Icon icon="lucide:map-pin" className="h-5 w-5" />}
              />
              <InfoField 
                label="Roles"
                value={user.roles?.join(', ') || 'No roles assigned'}
                icon={<Icon icon="lucide:shield" className="h-5 w-5" />}
              />
              <InfoField 
                label="Created At"
                value={format(new Date(user.created_at), 'PPpp')}
                icon={<Icon icon="lucide:calendar" className="h-5 w-5" />}
              />
            </div>
          </div>

          <div className="sticky bottom-0 bg-white border-t p-4 sm:p-6">
            <Button
              variant="outline"
              onClick={onClose}
              className="w-full sm:w-auto"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Add this function at the top level
const generatePassword = () => {
  const length = 12;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#DH%^&*";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
};

// Add Edit/Add Dialog
const UserFormDialog: React.FC<{
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UserFormData) => void;
}> = ({ user, isOpen, onClose, onSubmit }) => {
  const [countryCode, setCountryCode] = useState('212');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState<string>('');
  
  const [formData, setFormData] = useState<UserFormData>(() => ({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    city: user?.city || '',
    password: '',
    password_confirmation: '',
    roles: user?.roles || [],
  }));
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [cities, setCities] = useState<CityType[]>([]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);

  // Fetch cities when dialog opens
  const fetchCities = useCallback(async () => {
    try {
      setIsLoadingCities(true);
      const response = await cityApi.getCities({ paginationSize: 1000 });
      setCities(response.data || []);
    } catch (error) {
      toast.error('Failed to fetch cities');
    } finally {
      setIsLoadingCities(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchCities();
    }
  }, [isOpen, fetchCities]);

  // Reset form when user changes or dialog opens
  useEffect(() => {
    if (!isOpen) return;
    
    try {
      const parsedPhone = user?.phone ? parsePhoneNumberFromAPI(user.phone) : { countryCode: '212', phoneNumber: '' };
      setCountryCode(parsedPhone.countryCode);
      setPhoneNumber(parsedPhone.phoneNumber);
      setFormData({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        city: user?.city || '',
        password: '',
        password_confirmation: '',
        roles: user?.roles || [],
      });
      setErrors({});
      setPhoneError('');
    } catch (error) {
      console.error('Error parsing phone number:', error);
      setCountryCode('212');
      setPhoneNumber('');
      setFormData({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        city: user?.city || '',
        password: '',
        password_confirmation: '',
        roles: user?.roles || [],
      });
      setErrors({});
      setPhoneError('');
    }
  }, [user, isOpen]);

  // Handle phone validation
  const handlePhoneValidation = (result: { isValid: boolean; errorMessage?: string; formattedNumber?: string }) => {
    setPhoneError(result.errorMessage || '');
    if (result.isValid && result.formattedNumber) {
      const cleanNumber = result.formattedNumber.replace(/\s/g, '');
      setFormData(prev => ({ ...prev, phone: cleanNumber }));
    }
  };

  // Update phone in formData when country code or phone number changes
  useEffect(() => {
    if (countryCode && phoneNumber) {
      const fullNumber = `+${countryCode}${phoneNumber}`;
      const validation = validateInternationalPhone(countryCode, phoneNumber);
      if (validation.isValid) {
        setFormData(prev => ({ ...prev, phone: fullNumber }));
        setPhoneError('');
      } else if (!phoneNumber) {
        // If phone number is empty, clear the phone field
        setFormData(prev => ({ ...prev, phone: '' }));
      }
    } else if (!phoneNumber) {
      // If no phone number, clear the phone field
      setFormData(prev => ({ ...prev, phone: '' }));
    }
  }, [countryCode, phoneNumber]);

  const handleGeneratePassword = () => {
    const newPassword = generatePassword();
    setFormData(prev => ({ 
      ...prev, 
      password: newPassword,
      password_confirmation: newPassword // Set confirmation to match
    }));
    setShowPassword(true);
    toast.success('Password generated!');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Create validation schema based on whether we're editing or creating
      const validationSchema = user 
        ? z.object({
            name: z.string().min(1, 'Name is required'),
            email: z.string().email('Invalid email address'),
            roles: z.array(z.string()).optional(),
            password: z.preprocess(
              (val) => (typeof val === 'string' && val.trim() === '' ? undefined : val),
              z.string().min(6, 'Password must be at least 6 characters').optional()
            ),
            password_confirmation: z.preprocess(
              (val) => (typeof val === 'string' && val.trim() === '' ? undefined : val),
              z.string().optional()
            )
          }).refine((data) => {
            if (data.password) {
              return data.password === data.password_confirmation;
            }
            return true;
          }, {
            message: "Passwords don't match",
            path: ["password_confirmation"],
          })
        : userSchema;

      validationSchema.parse(formData);
      setErrors({});
      
      
      await onSubmit(formData);
      onClose();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMap: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path) {
            errorMap[err.path[0]] = err.message;
          }
        });
        setErrors(errorMap);
        toast.error('Please fix the form errors');
      } else {
        toast.error('Failed to save user');
      }
    }
  };

  return (
<Dialog open={isOpen} onOpenChange={onClose}>
  <DialogContent className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] max-w-[95vw] w-full sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-0">
    <div className="sticky top-0 bg-white z-20 px-6 pt-6 pb-4 border-b">
      <DialogHeader>
        <DialogTitle className="text-xl sm:text-2xl font-bold text-[#00897B] flex items-center gap-2">
          <div className="w-8 sm:w-10 h-8 sm:h-10 rounded-full bg-[#00897B]/10 flex items-center justify-center">
            <Icon icon="lucide:user-plus" className="h-4 sm:h-5 w-4 sm:w-5 text-[#00897B]" />
          </div>
          {user ? 'Modifier l\'Utilisateur' : 'Ajouter un Nouvel Utilisateur'}
        </DialogTitle>
        <DialogDescription className="text-sm text-gray-500">
          {user ? 'Mettez à jour les détails de l\'utilisateur ci-dessous' : 'Remplissez les détails de l\'utilisateur ci-dessous'}
        </DialogDescription>
      </DialogHeader>
    </div>

    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      <div className="grid gap-2">
        <Label htmlFor="name">Nom</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className={errors.name ? "border-red-500" : ""}
        />
        {errors.name && (
          <p className="text-sm text-red-500">{errors.name}</p>
        )}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className={errors.email ? "border-red-500" : ""}
        />
        {errors.email && (
          <p className="text-sm text-red-500">{errors.email}</p>
        )}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="phone">Numéro de Téléphone</Label>
        <PhoneInput
          countryCode={countryCode}
          phoneNumber={phoneNumber}
          onCountryCodeChange={(value) => setCountryCode(value)}
          onPhoneNumberChange={(value) => setPhoneNumber(value)}
          onValidationChange={handlePhoneValidation}
        />
        {phoneError && (
          <p className="text-sm text-red-500">{phoneError}</p>
        )}
        {errors.phone && (
          <p className="text-sm text-red-500">{errors.phone}</p>
        )}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="city">Ville</Label>
        <Select
          value={formData.city || undefined}
          onValueChange={(value) => setFormData({ ...formData, city: value })}
        >
          <SelectTrigger className={errors.city ? "border-red-500" : ""}>
            <SelectValue placeholder="Sélectionnez une ville" />
          </SelectTrigger>
          <SelectContent>
            {isLoadingCities ? (
              <div className="px-2 py-1.5 text-sm text-gray-500">Chargement des villes...</div>
            ) : cities.length > 0 ? (
              cities.map((city) => (
                <SelectItem key={city.id} value={city.name}>
                  {city.name}
                </SelectItem>
              ))
            ) : (
              <div className="px-2 py-1.5 text-sm text-gray-500">Aucune ville disponible</div>
            )}
          </SelectContent>
        </Select>
        {errors.city && (
          <p className="text-sm text-red-500">{errors.city}</p>
        )}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password">
          {user ? 'Nouveau Mot de Passe (laissez vide pour conserver l\'actuel)' : 'Mot de Passe'}
        </Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                password: e.target.value,
                password_confirmation: e.target.value // Remplissage automatique de la confirmation
              }))}
              className={errors.password ? "border-red-500 pr-10" : "pr-10"}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleGeneratePassword}
          >
            Générer
          </Button>
        </div>
        {errors.password && (
          <p className="text-sm text-red-500">{errors.password}</p>
        )}
        {errors.password_confirmation && (
          <p className="text-sm text-red-500">{errors.password_confirmation}</p>
        )}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="role">Rôle</Label>
        <Select
          value={formData.roles[0] || undefined}
          onValueChange={(value) => setFormData({ ...formData, roles: [value] })}
        >
          <SelectTrigger className={errors.roles ? "border-red-500" : ""}>
            <SelectValue placeholder="Sélectionnez un rôle" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="user">Utilisateur</SelectItem>
          </SelectContent>
        </Select>
        {errors.roles && (
          <p className="text-sm text-red-500">{errors.roles}</p>
        )}
      </div>

      <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="w-full sm:w-auto"
        >
          Annuler
        </Button>
        <Button 
          type="submit"
          className="w-full sm:w-auto bg-[#00897B] hover:bg-[#00796B]"
        >
          {user ? 'Mettre à jour' : 'Créer'} l'Utilisateur
        </Button>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>
  );
};

const Users = () => {
  // State for users and pagination
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    perPage: 10,
    total: 0,
    lastPage: 1,
  });

  // State for search and sorting
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | undefined>(undefined);

  // State for user form
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    name: "",
    email: "",
    phone: "",
    city: "",
    password: "",
    roles :[],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // State for filters
  const [filters, setFilters] = useState<UserFilters>({});

  // Add new state for password change
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

  // Add state for password visibility
  const [showPassword, setShowPassword] = useState(false);

  // Add state for delete confirmation
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const fetchUsers = useCallback(async (params: UserFilters = {}) => {
    try {
      setIsLoading(true);
      const response = await userApi.getUsers(params);
      
      if (!response || !response.data) {
        throw new Error('Invalid response format from API');
      }

      setUsers(response.data);
      setPagination({
        currentPage: response.meta.current_page,
        perPage: params.paginationSize || 10,
        total: response.meta.total,
        lastPage: response.meta.last_page,
      });
    } catch (error) {
      if (error instanceof Error) {
        toast.error(`Failed to fetch users: ${error.message}`);
      } else {
        toast.error('Failed to fetch users. Please try again later.');
      }
      setUsers([]);
      setPagination({
        currentPage: 1,
        perPage: 10,
        total: 0,
        lastPage: 1,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchUsers({
      page: 1,
      paginationSize: 10
    });
  }, [fetchUsers]);

  // Update handleItemsPerPageChange
  const handleItemsPerPageChange = useCallback((value: string) => {
    const newSize = parseInt(value, 10);
    setPagination(prev => ({ ...prev, perPage: newSize }));
    fetchUsers({
      page: 1,
      paginationSize: newSize,
      sortBy: sortBy === null ? undefined : sortBy,
      sortOrder: sortOrder === null ? undefined : sortOrder,
      search: searchTerm,
    });
  }, [fetchUsers, sortBy, sortOrder, searchTerm]);

  // Update handleSort
  const handleSort = useCallback(
    (column: string) => {
      const newSortOrder = sortBy === column && sortOrder === 'asc' ? 'desc' : 'asc';
      setSortBy(column);
      setSortOrder(newSortOrder);
      fetchUsers({
        page: pagination.currentPage,
        paginationSize: pagination.perPage,
        sortBy: column,
        sortOrder: newSortOrder,
        search: searchTerm,
        filters,
      });
    },
    [fetchUsers, sortBy, sortOrder, searchTerm, pagination, filters]
  );

  // Update handleSearch
  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    setFilters(prev => ({ ...prev, search: term }));
    fetchUsers({
      page: 1,
      paginationSize: pagination.perPage,
      sortBy: sortBy === null ? undefined : sortBy,
      sortOrder: sortOrder === null ? undefined : sortOrder,
      search: term,
      filters: { ...filters, search: term },
    });
  }, [fetchUsers, pagination.perPage, sortBy, sortOrder, filters]);

  // Update handlePageChange
  const handlePageChange = useCallback((page: number) => {
    fetchUsers({
      page,
      paginationSize: pagination.perPage,
      sortBy: sortBy === null ? undefined : sortBy,
      sortOrder: sortOrder === null ? undefined : sortOrder,
      search: searchTerm,
    });
  }, [fetchUsers, pagination.perPage, sortBy, sortOrder, searchTerm]);

  // Create user
  const handleCreate = async (data: UserFormData) => {
    try {
      const response = await userApi.createUser({
        name: data.name,
        email: data.email,
        phone: data.phone || '',
        city: data.city || '',
        password: data.password,
        password_confirmation: data.password,
        roles: data.roles
      });
      
      toast.success('User created successfully');
      setIsAddDialogOpen(false);
      fetchUsers({
        page: pagination.currentPage,
        paginationSize: pagination.perPage,
      });
    } catch (error: any) {
      if (error.response?.data?.error?.password) {
        toast.error('Password validation failed');
      } else {
        toast.error('Failed to create user');
      }
    }
  };

  // Update user
  const handleUpdate = async (data: UserFormData) => {
    if (!selectedUser) return;
    
    try {
      const updateData: Partial<UserFormData> = {
        name: data.name,
        email: data.email,
        phone: data.phone || '',
        city: data.city || '',
      };

      // Only include roles if provided (optional on edit)
      if (data.roles && data.roles.length > 0) {
        updateData.roles = data.roles;
      }

      // Only include password fields if password is provided
      if (data.password) {
        updateData.password = data.password;
        updateData.password_confirmation = data.password;
      }


      const response = await userApi.updateUser(selectedUser.id.toString(), updateData);
      
      if (response) {
        toast.success('User updated successfully');
        setIsAddDialogOpen(false);
        setSelectedUser(null);
        fetchUsers({
          page: pagination.currentPage,
          paginationSize: pagination.perPage,
        });
      }
    } catch (error: any) {
      // Handle specific API error responses
      if (error.response?.data?.error) {
        const errorMessages = Object.values(error.response.data.error).flat();
        toast.error(errorMessages[0] as string || 'Failed to update user');
      } else {
        toast.error('Failed to update user');
      }
    }
  };

  // Delete user
  const handleDelete = async (userId: string | number) => {
    try {
      await userApi.deleteUser(typeof userId === 'string' ? userId : userId.toString());
      toast.success('User deleted successfully');
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
      fetchUsers({
        page: pagination.currentPage,
        paginationSize: pagination.perPage,
      });
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  // Combined submit handler for create/update
  const handleSubmit = async (data: UserFormData) => {
    if (selectedUser) {
      await handleUpdate(data);
    } else {
      await handleCreate(data);
    }
  };

  // Handle export
  const handleExport = () => {
    try {
      const exportData = users.map(user => ({
        ID: user.id,
        Name: user.name,
        Email: user.email,
        Role: user.roles?.join(', ') || 'No roles',
        'Created At': format(new Date(user.created_at), "yyyy-MM-dd HH:mm:ss"),
        'Updated At': format(new Date(user.updated_at), "yyyy-MM-dd HH:mm:ss"),
      }));

      const ws = utils.json_to_sheet(exportData);
      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, "Users");

      // Auto-size columns
      const maxWidth = 50;
      const colWidths = Object.keys(exportData[0] || {}).map(key => {
        const maxContentLength = Math.max(
          key.length,
          ...exportData.map(row => String(row[key as keyof typeof row] || '').length)
        );
        return { wch: Math.min(maxContentLength + 2, maxWidth) };
      });
      ws['!cols'] = colWidths;

      writeFile(wb, `users_export_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
      toast.success(`Successfully exported ${exportData.length} users`);
    } catch (error) {
      toast.error("Failed to export data");
    }
  };

  // Handle password change
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
    
      setPasswordErrors({});

      // Here you would call your API to change the password
      // await userApi.changePassword(selectedUser!.id, passwordData);
      toast.success('Password changed successfully!');
      setIsPasswordDialogOpen(false);
   
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMap: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path) {
            errorMap[err.path[0]] = err.message;
          }
        });
        setPasswordErrors(errorMap);
        toast.error('Please fix the errors in the form.');
      } else {
        toast.error('Failed to change password. Please try again later.');
      }
    }
  };

  // Add this mobile actions component
  const MobileActions: React.FC<{ user: User }> = ({ user }) => {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreVerticalIcon className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[160px]">
          <DropdownMenuItem onClick={() => {
            setSelectedUser(user);
            setIsViewDialogOpen(true);
          }}>
            <Eye className="h-4 w-4 mr-2" />
            View
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => {
            setSelectedUser(user);
            setFormData({
              name: user.name,
              email: user.email,
              phone: user.phone || '',
              city: user.city || '',
              password: '',
              roles: user.roles || [],
            });
            setIsAddDialogOpen(true);
          }}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem 
            className="text-red-600"
            onClick={() => {
              setSelectedUser(user);
              setIsDeleteDialogOpen(true);
            }}
          >
            <Trash className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  return (
    <div className="">
      <Card className="overflow-hidden">
        {/* Header Section - Translated */}
        <div className="p-4 md:p-6 bg-gradient-to-r from-[#00897B] to-[#00796B]">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="text-white">
              <h2 className="text-2xl font-bold">Gestion des utilisateurs</h2>
              <p className="text-gray-100 mt-1">Gérez les utilisateurs de votre système</p>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleExport}
                className="bg-white text-[#00897B] hover:bg-gray-100 transition-colors"
              >
                <DownloadIcon className="h-4 w-4 mr-2" />
                Exporter
              </Button>
              <Button
                onClick={() => setIsAddDialogOpen(true)}
                className="bg-white text-[#00897B] hover:bg-gray-100 transition-colors"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Ajouter un utilisateur
              </Button>
            </div>
          </div>
        </div>

        {/* Search and Pagination Size Section - Translated */}
        <div className="p-4 border-b">
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="Rechercher des utilisateurs..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="max-w-md"
            />
            <Select
              value={pagination.perPage.toString()}
              onValueChange={handleItemsPerPageChange}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Éléments par page" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 par page</SelectItem>
                <SelectItem value="20">20 par page</SelectItem>
                <SelectItem value="50">50 par page</SelectItem>
                <SelectItem value="100">100 par page</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Détails</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead className="hidden lg:table-cell">Créé le</TableHead>
                <TableHead className="w-[50px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    <span className="text-sm text-muted-foreground">Chargement des utilisateurs...</span>
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    <p className="text-muted-foreground">Aucun utilisateur trouvé</p>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex flex-col space-y-1">
                        <div className="font-medium text-base">
                          {user.name}
                        </div>
                        <div className="md:hidden space-y-1 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">ID :</span>
                            {user.id}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Email :</span>
                            {user.email}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Créé le :</span>
                            {format(new Date(user.created_at), "PP")}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{user.email}</TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {format(new Date(user.created_at), "PP")}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        {/* Desktop Actions - Translated */}
                        <div className="hidden md:flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              setSelectedUser(user);
                              setIsViewDialogOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              setSelectedUser(user);
                              setFormData({
                                name: user.name,
                                email: user.email,
                                phone: user.phone || '',
                                city: user.city || '',
                                password: '',
                                roles: user.roles || [],
                              });
                              setIsAddDialogOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => {
                              setSelectedUser(user);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                        {/* Mobile Actions - Translated */}
                        <div className="md:hidden">
                          <MobileActions user={user} />
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {users.length > 0 && (
          <div className="mt-4 flex justify-self-end px-2">
            <Pagination>
              <PaginationContent className="justify-center">
                <PaginationItem>
                  {pagination.currentPage > 1 && (
                    <PaginationPrevious
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                    />
                  )}
                </PaginationItem>
                {Array.from({ length: Math.min(5, pagination.lastPage) }, (_, i) => {
                  const page = Math.max(1, Math.min(pagination.currentPage - 2, pagination.lastPage - 4)) + i;
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
                  {pagination.currentPage < pagination.lastPage && (
                    <PaginationNext
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                    />
                  )}
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </Card>

      {/* Add the dialogs - Translated */}
      <UserFormDialog
        user={selectedUser}
        isOpen={isAddDialogOpen}
        onClose={() => {
          setIsAddDialogOpen(false);
          setSelectedUser(null);
          setFormData({ name: '', email: '', phone: '', city: '', password: '', roles: [] });
        }}
        onSubmit={handleSubmit}
      />

      <DeleteDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setSelectedUser(null);
        }}
        onConfirm={() => selectedUser && handleDelete(selectedUser.id)}
        userName={selectedUser?.name || ''}
      />

      <ViewDialog 
        user={selectedUser}
        isOpen={isViewDialogOpen}
        onClose={() => {
          setIsViewDialogOpen(false);
          setSelectedUser(null);
        }}
      />
    </div>
  );
};

export default Users;
