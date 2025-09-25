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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/admin/components/ui/select";
import { contactApi } from "@/admin/lib/api/services/contact";
import { format } from "date-fns";
import { motion } from 'framer-motion';
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
  EyeIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import { Contact, ContactStatus, ContactFormData } from "@/lib/types/contact";

interface PaginationMeta {
  current_page: number;
  from: number | null;
  last_page: number;
  per_page: number;
  total: number;
}

interface ApiResponse {
  data: Contact[];
  meta: PaginationMeta;
}

const animationVariants = {
  fadeIn: {
    hidden: { opacity: 0, y: -20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.3
      }
    }
  }
};

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

interface InfoFieldProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

const InfoField: React.FC<InfoFieldProps> = ({ 
  label, 
  value, 
  icon,
  fullWidth = false 
}) => (
  <div className={cn(
    "bg-white rounded-lg p-4 shadow-sm border",
    fullWidth ? "col-span-2" : ""
  )}>
    <div className="flex items-start gap-3">
      {icon && <div className="text-gray-400 mt-1">{icon}</div>}
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-500 mb-1">
          {label}
        </label>
        <div className={cn(
          "text-gray-900",
          typeof value === 'string' && "font-medium",
          fullWidth && "whitespace-pre-wrap"
        )}>
          {value}
        </div>
      </div>
    </div>
  </div>
);

const ContactPage = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({
    currentPage: 1,
    paginationSize: 10,
    total: 0,
    lastPage: 1,
  });
  const [sortConfig, setSortConfig] = useState<{
    field: 'created_at' | 'fullName' | 'email' | 'status';
    order: 'asc' | 'desc';
  }>({
    field: 'created_at',
    order: 'desc'
  });
  const [formData, setFormData] = useState<ContactFormData>({
    fullName: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    status: 'pending'
  });

  const fetchContacts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await contactApi.getContacts({
        page: pagination.currentPage,
        paginationSize: pagination.paginationSize,
        sortBy: sortConfig.field,
        sortOrder: sortConfig.order,
        search: searchTerm || undefined,
      });
      
      setContacts(response.data);
      setPagination(prev => ({
        ...prev,
        total: response.meta.total,
        lastPage: response.meta.last_page,
      }));
    } catch (error) {
      toast.error('Failed to fetch contacts');
    } finally {
      setLoading(false);
    }
  }, [pagination.currentPage, pagination.paginationSize, sortConfig, searchTerm]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const handleStatusChange = async (contact: Contact, newStatus: ContactStatus) => {
    try {
      await contactApi.updateContact(contact.id, {
        ...contact,
        status: newStatus,
      });

      // Show different success messages based on status
      const successMessages = {
        pending: "Le message a été mis en attente",
        read: "Le message a été marqué comme lu",
        replied: "Merci de votre message ! Notre équipe vous contactera dans les plus brefs délais.",
        archived: "Le message a été archivé"
      };

      toast.success(successMessages[newStatus]);
      fetchContacts();
    } catch (error) {
      toast.error('Échec de la mise à jour du statut');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await contactApi.deleteContact(id);
      toast.success('Contact deleted successfully');
      fetchContacts();
    } catch (error) {
      toast.error('Failed to delete contact');
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  const handlePaginationSizeChange = (value: string) => {
    setPagination(prev => ({
      ...prev,
      paginationSize: parseInt(value),
      currentPage: 1,
    }));
  };

  const toggleSort = (field: typeof sortConfig.field) => {
    setSortConfig(current => ({
      field,
      order: current.field === field && current.order === 'asc' ? 'desc' : 'asc'
    }));
  };

  return (
  <div className="space-y-6">
    <Card className="overflow-hidden">
      {/* Section En-tête */}
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={animationVariants.fadeIn}
        className="p-4 md:p-6 bg-gradient-to-r from-[#00897B] to-[#00796B]"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="text-white">
            <h2 className="text-2xl font-bold">Gestion des contacts</h2>
            <p className="text-gray-100 mt-1">Voir et gérer les soumissions de formulaire de contact</p>
          </div>
        </div>
      </motion.div>

      {/* Section Filtres */}
      <div className="p-4 border-b space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="relative">
            <Input
              placeholder="Rechercher des contacts..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
            <Icon 
              icon="lucide:search" 
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" 
            />
          </div>
          <Select
            value={pagination.paginationSize.toString()}
            onValueChange={handlePaginationSizeChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Éléments par page" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 par page</SelectItem>
              <SelectItem value="25">25 par page</SelectItem>
              <SelectItem value="50">50 par page</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Section Tableau */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="hidden md:table-cell">Nom complet</TableHead>
              <TableHead className="hidden md:table-cell">Email</TableHead>
              <TableHead className="hidden md:table-cell">Téléphone</TableHead>
              <TableHead className="hidden md:table-cell">Sujet</TableHead>
              <TableHead className="hidden md:table-cell">Type</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="hidden md:table-cell">Créé le</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <div className="flex items-center justify-center">
                    <Icon icon="lucide:loader" className="h-6 w-6 animate-spin text-primary" />
                    <span className="ml-2">Chargement...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : contacts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <div className="flex flex-col items-center justify-center text-gray-500">
                    <Icon icon="lucide:inbox" className="h-12 w-12 mb-2" />
                    <p>Aucun contact trouvé</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              contacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell className="hidden md:table-cell">{contact.fullName}</TableCell>
                  <TableCell className="hidden md:table-cell">{contact.email}</TableCell>
                  <TableCell className="hidden md:table-cell">{contact.phone}</TableCell>
                  <TableCell className="hidden md:table-cell">{contact.subject}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      <Icon 
                        icon={contact.type === 'commercant' ? "lucide:shopping-bag" : "lucide:user"} 
                        className="h-4 w-4 text-gray-500" 
                      />
                      <span>{contact.type === 'commercant' ? 'Commerçant' : 'Client'}</span>
                    </div>
                  </TableCell>
                  
                  {/* Colonne Statut - visible sur tous les écrans */}
                  <TableCell>
                    <Select
                      value={contact.status}
                      onValueChange={(value: ContactStatus) => 
                        handleStatusChange(contact, value)
                      }
                    >
                      <SelectTrigger className="w-[100px]">
                        <SelectValue>
                          <div className="flex items-center gap-1">
                            <span className={cn(
                              "h-1.5 w-1.5 rounded-full",
                              contact.status === 'pending' && "bg-yellow-500",
                              contact.status === 'read' && "bg-blue-500",
                            )} />
                            <span className="truncate text-sm">
                              {contact.status === 'pending' ? 'En attente' : 'Lu'}
                            </span>
                          </div>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">
                          <div className="flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
                            <span className="text-sm">En attente</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="read">
                          <div className="flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                            <span className="text-sm">Lu</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  
                  <TableCell className="hidden md:table-cell">
                    {format(new Date(contact.created_at), 'PP')}
                  </TableCell>

                  {/* Colonne Actions */}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setSelectedContact(contact);
                          setIsViewDialogOpen(true);
                        }}
                      >
                        <EyeIcon className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="destructive" 
                            size="icon"
                            className="h-8 w-8"
                          >
                            <TrashIcon className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
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
                                  Supprimer le contact
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-gray-500">
                                  Êtes-vous sûr de vouloir supprimer ce contact ? Cette action est irréversible.
                                </AlertDialogDescription>
                              </AlertDialogHeader>

                              <div className="w-full mt-6">
                                <AlertDialogFooter className="flex flex-col sm:flex-row gap-2 w-full">
                                  <AlertDialogCancel 
                                    className="w-full sm:w-auto mt-0"
                                  >
                                    Annuler
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    className="w-full sm:w-auto bg-red-600 hover:bg-red-700"
                                    onClick={() => handleDelete(contact.id)}
                                  >
                                    Supprimer le contact
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </div>
                            </div>
                          </motion.div>
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

      {/* Pagination */}
      <div className="p-4 border-t">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Affichage de {contacts.length} sur {pagination.total} résultats
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
            >
              Précédent
            </Button>
            {Array.from({ length: pagination.lastPage }, (_, i) => i + 1)
              .filter(page => {
                const current = pagination.currentPage;
                return page === 1 || 
                      page === pagination.lastPage || 
                      (page >= current - 1 && page <= current + 1);
              })
              .map((page) => (
                <Button
                  key={page}
                  variant={page === pagination.currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </Button>
              ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.lastPage}
            >
              Suivant
            </Button>
          </div>
        </div>
      </div>
    </Card>

    {/* Dialogue de visualisation */}
    {selectedContact && (
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] max-w-[95vw] w-full sm:max-w-2xl p-0 overflow-hidden bg-white rounded-lg shadow-lg">
          <button
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
            onClick={() => setIsViewDialogOpen(false)}
          >
            <Icon icon="lucide:x" className="h-4 w-4" />
            <span className="sr-only">Fermer</span>
          </button>

          <div className="max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white z-20 px-6 pt-6 pb-4 border-b">
              <DialogHeader>
                <DialogTitle className="text-xl sm:text-2xl font-bold text-[#00897B] flex items-center gap-2">
                  <div className="w-8 sm:w-10 h-8 sm:h-10 rounded-full bg-[#00897B]/10 flex items-center justify-center">
                    <Icon icon="lucide:mail" className="h-4 sm:h-5 w-4 sm:w-5 text-[#00897B]" />
                  </div>
                  Détails du contact
                </DialogTitle>
                <DialogDescription className="text-sm text-gray-500">
                  Contact #{selectedContact.id} - {selectedContact.type === 'commercant' ? 'Demande de commerçant' : 'Demande de client'}
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <InfoField 
                  label="Nom complet"
                  value={selectedContact.fullName}
                  icon={<Icon icon="lucide:user" className="h-5 w-5" />}
                />
                <InfoField 
                  label="Email"
                  value={selectedContact.email}
                  icon={<Icon icon="lucide:mail" className="h-5 w-5" />}
                />
                <InfoField 
                  label="Téléphone"
                  value={selectedContact.phone}
                  icon={<Icon icon="lucide:phone" className="h-5 w-5" />}
                />
                <InfoField 
                  label="Type"
                  value={
                    <div className="flex items-center gap-2">
                      <Icon 
                        icon={selectedContact.type === 'commercant' ? "lucide:shopping-bag" : "lucide:user"} 
                        className="h-4 w-4 text-gray-500" 
                      />
                      {selectedContact.type === 'commercant' ? 'Commerçant' : 'Client'}
                    </div>
                  }
                  icon={<Icon icon="lucide:tag" className="h-5 w-5" />}
                />
                <InfoField 
                  label="Statut"
                  value={
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "h-2 w-2 rounded-full",
                        selectedContact.status === 'pending' && "bg-yellow-500",
                        selectedContact.status === 'read' && "bg-blue-500",
                      )} />
                      {selectedContact.status === 'pending' ? 'En attente' : 'Lu'}
                    </div>
                  }
                  icon={<Icon icon="lucide:activity" className="h-5 w-5" />}
                />
                <InfoField 
                  label="Créé le"
                  value={format(new Date(selectedContact.created_at), 'PPpp')}
                  icon={<Icon icon="lucide:calendar" className="h-5 w-5" />}
                />
                <InfoField 
                  label="Sujet"
                  value={selectedContact.subject}
                  icon={<Icon icon="lucide:tag" className="h-5 w-5" />}
                  fullWidth
                />
                <InfoField 
                  label="Message"
                  value={selectedContact.message}
                  icon={<Icon icon="lucide:message-square" className="h-5 w-5" />}
                  fullWidth
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
          </div>
        </DialogContent>
      </Dialog>
    )}
  </div>
  );
};

export default ContactPage; 