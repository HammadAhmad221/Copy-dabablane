import { useState, useCallback, useEffect } from "react";
import { Card } from "@/admin/components/ui/card";
import { Input } from "@/admin/components/ui/input";
import { Button } from "@/admin/components/ui/button";
import { Switch } from "@/admin/components/ui/switch";
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
import { PencilIcon, TrashIcon, PlusIcon, GripVertical, EyeIcon } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from '@/admin/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/admin/components/ui/select";
import type { MenuItem, MenuItemFormData } from '@/admin/lib/api/types/menuItems';
import { menuItemApi } from "@/admin/lib/api/services/menuItemService";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { animationVariants } from "@/admin/utils/animations";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Label } from "@/admin/components/ui/label";

// Update the InfoField component styling
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
    className={`bg-white rounded-lg p-3 sm:p-4 shadow-sm border ${fullWidth ? 'col-span-full' : ''}`}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <div className="flex items-start gap-2 sm:gap-3">
      {icon && <div className="text-gray-400 mt-1 flex-shrink-0">{icon}</div>}
      <div className="flex-1 min-w-0"> {/* Add min-w-0 to enable text truncation */}
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

// Also add the popupAnimationVariants since it's used in the delete dialog
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

// Helper function to add at the top of the file
const truncateUrl = (url: string, maxLength: number = 30, halfOnly: boolean = false) => {
  if (halfOnly) {
    return url.substring(0, maxLength) + '...';
  }
  if (url.length <= maxLength) return url;
  const start = url.substring(0, maxLength / 2);
  const end = url.substring(url.length - maxLength / 2);
  return `${start}...${end}`;
};

// First, add a new component for the Detail cell that combines Label and URL
const DetailCell = ({ item }: { item: MenuItem }) => (
  <div className="flex flex-col gap-1">
    <div className="font-medium">{item.label}</div>
    <div className="text-xs text-gray-500 font-mono truncate">
      {truncateUrl(item.url, 20, true)}
    </div>
  </div>
);

const MenuItems: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [formData, setFormData] = useState<MenuItemFormData>({
    label: "",
    url: "",
    position: 1,
    is_active: true,
    updated_at: null,
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    paginationSize: 10,
    total: 0,
    lastPage: 1,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [maxPosition, setMaxPosition] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ 
    field: 'created_at' | 'label' | 'position'; 
    order: 'asc' | 'desc' 
  }>({
    field: 'created_at',
    order: 'desc'
  });
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  // Update the validation schema to make fields optional
  const menuItemSchema = z.object({
    label: z.string()
      .max(255, "Label must be less than 255 characters")
      .optional(),
    url: z.string()
      .max(255, "URL must be less than 255 characters")
      .optional(),
    position: z.number()
      .min(1, "Position must be at least 1")
      .max(10000, "Position is too high")
      .optional(),
    is_active: z.boolean().optional(),
  });

  // Fetch menu items
  const fetchMenuItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await menuItemApi.getMenuItems({
        page: pagination.currentPage,
        paginationSize: pagination.paginationSize,
        search: searchTerm || undefined,
        sort_by: 'position',
        sort_order: 'asc',
      });
      
      setMenuItems(response.data);
      setPagination({
        currentPage: response.meta.current_page,
        paginationSize: response.meta.per_page,
        total: response.meta.total,
        lastPage: response.meta.last_page,
      });
      setMaxPosition(response.meta.total + 1);
    } catch (error) {
      toast.error('Failed to fetch menu items. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, [pagination.currentPage, pagination.paginationSize, searchTerm]);

  useEffect(() => {
    fetchMenuItems();
  }, [fetchMenuItems]);

  // Update the handleSubmit function
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Create the data object directly from form state
      const submitData = {
        ...formData,
        position: selectedMenuItem ? selectedMenuItem.position : formData.position
      };

      if (selectedMenuItem) {
        // When updating, send the data as is
        await menuItemApi.updateMenuItem(selectedMenuItem.id, submitData);
        toast.success('Menu item updated successfully!');
      } else {
        await menuItemApi.createMenuItem(submitData);
        toast.success('Menu item added successfully!');
      }

      setIsDialogOpen(false);
      setSelectedMenuItem(null);
      resetForm();
      fetchMenuItems();
    } catch (error) {
      toast.error('Failed to save menu item. Please try again later.');
    }
  };

  // Handle delete
  const handleDelete = async (menuItemId: string) => {
    try {
      await menuItemApi.deleteMenuItem(menuItemId);
      toast.success('Menu item deleted successfully!');
      fetchMenuItems(); // Refresh the list
    } catch (error) {
      toast.error('Failed to delete menu item. Please try again later.');
    }
  };

  // Handle drag-and-drop reordering
  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
    
    if (sourceIndex === destinationIndex) return;

    try {
      const items = Array.from(menuItems);
      const [reorderedItem] = items.splice(sourceIndex, 1);
      items.splice(destinationIndex, 0, reorderedItem);

      // Update positions for all items
      const updatedItems = items.map((item, index) => ({
        ...item,
        position: index + 1
      }));

      // Optimistically update UI
      setMenuItems(updatedItems);

      // Update the positions in the backend
      await Promise.all(
        updatedItems.map(item =>
          menuItemApi.updateMenuItem(item.id, {
            ...item,
            position: item.position,
            label: item.label,
            url: item.url,
            is_active: item.is_active,
          })
        )
      );

      toast.success('Positions updated successfully!');
    } catch (error) {
      toast.error('Failed to update positions. Please try again.');
      // Revert to original state
      fetchMenuItems();
    }
  };

  // Handle status toggle
  const handleStatusChange = async (item: MenuItem) => {
    try {
      await menuItemApi.updateMenuItem(item.id, {
        ...item,
        is_active: !item.is_active,
      });
      toast.success('Status updated successfully!');
      fetchMenuItems(); // Refresh the list
    } catch (error) {
      toast.error('Failed to update status. Please try again.');
    }
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  // Handle pagination size change
  const handlePaginationSizeChange = (value: string) => {
    setPagination(prev => ({ ...prev, paginationSize: parseInt(value), currentPage: 1 }));
  };

  // Handle search
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setPagination(prev => ({ ...prev, currentPage: 1 })); // Reset to first page on search
  };

  // Toggle sort
  const toggleSort = (field: 'created_at' | 'label' | 'position') => {
    setSortConfig(current => ({
      field,
      order: current.field === field && current.order === 'asc' ? 'desc' : 'asc'
    }));
  };

  // First, add a function to get the next available position
  const getNextPosition = () => {
    if (menuItems.length === 0) return 1;
    const maxCurrentPosition = Math.max(...menuItems.map(item => item.position));
    return maxCurrentPosition + 1;
  };

  // Update the resetForm function to use the next available position
  const resetForm = () => {
    setFormData({
      label: "",
      url: "",
      position: getNextPosition(), // Use next available position
      is_active: true,
      updated_at: null,
    });
    setErrors({});
    setSelectedMenuItem(null);
  };

  return (
  <div className="space-y-4 sm:space-y-6 w-full max-w-full px-2 sm:px-4 overflow-x-hidden">
    <Card className="overflow-hidden shadow-sm w-full max-w-full">
      <motion.div 
        className="p-4 sm:p-6 bg-gradient-to-r from-[#00897B] to-[#00796B]"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div className="text-white min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold">Gestion des Menus</h2>
            <p className="text-sm sm:text-base text-gray-100 mt-1">Gérez les éléments de navigation de votre site web</p>
          </div>
          <Dialog 
            open={isDialogOpen} 
            onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (open && selectedMenuItem) {
                // Définir les données du formulaire directement à partir de l'élément sélectionné
                setFormData({
                  label: selectedMenuItem.label,
                  url: selectedMenuItem.url,
                  position: selectedMenuItem.position,
                  is_active: selectedMenuItem.is_active,
                  updated_at: selectedMenuItem.updated_at,
                });
              } else if (open) {
                // Pour les nouveaux éléments, définir les valeurs par défaut
                setFormData({
                  label: "",
                  url: "",
                  position: getNextPosition(),
                  is_active: true,
                  updated_at: null,
                });
              }
            }}
          >
            <DialogTrigger asChild>
              <Button className="bg-white text-[#00897B] hover:bg-gray-100 transition-colors w-full sm:w-auto">
                <PlusIcon className="mr-2 h-4 w-4" />
                Ajouter un élément de menu
              </Button>
            </DialogTrigger>
            <DialogContent className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] max-w-[95vw] w-full sm:max-w-2xl p-0 overflow-hidden bg-white rounded-lg shadow-lg">
              <button
                className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
                onClick={() => setIsDialogOpen(false)}
              >
                <Icon icon="lucide:x" className="h-4 w-4" />
                <span className="sr-only">Fermer</span>
              </button>

              <div className="max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white z-20 px-6 pt-6 pb-4 border-b">
                  <DialogHeader>
                    <DialogTitle className="text-xl sm:text-2xl font-bold text-[#00897B] flex items-center gap-2">
                      <div className="w-8 sm:w-10 h-8 sm:h-10 rounded-full bg-[#00897B]/10 flex items-center justify-center">
                        <Icon icon={selectedMenuItem ? "lucide:edit" : "lucide:plus"} className="h-4 sm:h-5 w-4 sm:w-5 text-[#00897B]" />
                      </div>
                      {selectedMenuItem ? "Modifier l'élément de menu" : "Ajouter un nouvel élément de menu"}
                    </DialogTitle>
                    <DialogDescription className="text-sm text-gray-500">
                      {selectedMenuItem 
                        ? "Mettez à jour les détails de cet élément de menu" 
                        : "Créez un nouvel élément de menu pour votre navigation"}
                    </DialogDescription>
                  </DialogHeader>
                </div>

                <div className="p-6 space-y-6">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                      {/* Champ Label */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">
                          Libellé <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          value={formData.label}
                          onChange={(e) => {
                            setFormData((prev) => ({ ...prev, label: e.target.value }));
                            setErrors((prev) => ({ ...prev, label: undefined }));
                          }}
                          className={cn(
                            errors.label && "border-red-500 focus:ring-red-500"
                          )}
                          placeholder="Entrez le libellé de l'élément de menu"
                        />

                        {errors.label && (
                          <p className="text-sm text-red-500">{errors.label}</p>
                        )}
                      </div>

                      {/* Champ URL */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">
                          URL <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="text"
                          value={formData.url}
                          onChange={(e) => {
                            setFormData((prev) => ({ ...prev, url: e.target.value }));
                            setErrors((prev) => ({ ...prev, url: undefined }));
                          }}
                          className={cn(
                            errors.url && "border-red-500 focus:ring-red-500"
                          )}
                          placeholder="Entrez l'URL ou le chemin"
                        />

                        {errors.url && (
                          <p className="text-sm text-red-500">{errors.url}</p>
                        )}
                        <p className="text-sm text-gray-500">
                          Vous pouvez entrer une URL complète (https://exemple.com) ou un chemin (/apropos)
                        </p>
                      </div>

                      {/* Champ Position - Seulement affiché lors de l'ajout d'un nouvel élément */}
                      {!selectedMenuItem && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">
                            Position <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            type="number"
                            value={formData.position}
                            readOnly
                            className={cn(
                              "bg-gray-100 cursor-not-allowed",
                              errors.position && "border-red-500 focus:ring-red-500"
                            )}
                          />

                          {errors.position && (
                            <p className="text-sm text-red-500">{errors.position}</p>
                          )}
                          <p className="text-sm text-gray-500">
                            Cet élément sera ajouté à la position {formData.position}
                          </p>
                        </div>
                      )}

                      {/* Bouton de bascule pour le statut */}
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <Label className="text-sm font-medium">Statut</Label>
                          <p className="text-sm text-gray-500">Activer ou désactiver cet élément de menu</p>
                        </div>
                        <Switch
                          checked={formData.is_active}
                          onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_active: checked }))}
                          className="data-[state=checked]:bg-[#00897B]"
                        />

                      </div>
                    </div>

                    <DialogFooter className="mt-8 pt-4 border-t">
                      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setIsDialogOpen(false);
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
                          {selectedMenuItem ? (
                            <>
                              <Icon icon="lucide:save" className="h-4 w-4 mr-2" />
                              Enregistrer les modifications
                            </>
                          ) : (
                            <>
                              <Icon icon="lucide:plus" className="h-4 w-4 mr-2" />
                              Créer un élément de menu
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
        </div>
      </motion.div>

      <motion.div 
        className="p-4 sm:p-6 border-b space-y-4"
      >
        <div className="flex flex-col sm:flex-row items-stretch gap-4">
          <div className="relative flex-1 min-w-0">
            <Input
              placeholder="Rechercher des éléments de menu..."
              className="pl-10 w-full"
            />

            <Icon 
              icon="lucide:search" 
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" 
            />
          </div>
          <div className="w-full sm:w-[200px] flex-shrink-0">
            <Select>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Éléments par page" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="10">10 par page</SelectItem>
                <SelectItem value="20">20 par page</SelectItem>
                <SelectItem value="50">50 par page</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </motion.div>

      <div className="sm:hidden px-2 pb-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-gray-600">
            <Icon icon="lucide:loader" className="h-6 w-6 animate-spin text-[#00897B]" />
            <span className="ml-2">Chargement...</span>
          </div>
        ) : menuItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-gray-500 py-8">
            <Icon icon="lucide:inbox" className="h-12 w-12 mb-2" />
            <p>Aucun élément de menu trouvé</p>
            <Button
              variant="link"
              onClick={() => setIsDialogOpen(true)}
              className="mt-2 text-[#00897B]"
            >
              Créez votre premier élément de menu
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {menuItems.map((item) => (
              <div key={item.id} className="bg-white rounded-lg border shadow-sm p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-900 truncate">{item.label}</div>
                    <div className="text-xs text-gray-500 font-mono truncate mt-1">
                      {truncateUrl(item.url, 28, true)}
                    </div>
                  </div>
                  <Switch
                    checked={item.is_active}
                    onCheckedChange={() => handleStatusChange(item)}
                    className="data-[state=checked]:bg-[#00897B] flex-shrink-0"
                  />
                </div>

                <div className="flex items-center justify-between mt-3">
                  <div className="text-xs text-gray-500">Position: {item.position}</div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        setSelectedMenuItem(item);
                        setFormData({
                          label: item.label,
                          url: item.url,
                          position: item.position,
                          is_active: item.is_active,
                          updated_at: item.updated_at,
                        });
                        setIsDialogOpen(true);
                      }}
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Button>

                    <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="icon" className="h-8 w-8">
                          <EyeIcon className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
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
                                  <Icon icon="lucide:menu" className="h-4 sm:h-5 w-4 sm:w-5 text-[#00897B]" />
                                </div>
                                Détails de l'élément de menu
                              </DialogTitle>
                              <DialogDescription className="text-sm text-gray-500">
                                Élément de menu #{item.id}
                              </DialogDescription>
                            </DialogHeader>
                          </div>

                          <div className="p-6 space-y-6">
                            <div className="grid gap-6 sm:grid-cols-2">
                              <InfoField 
                                label="Libellé"
                                value={item.label}
                                icon={<Icon icon="lucide:tag" className="h-5 w-5" />}
                              />
                              <InfoField 
                                label="URL"
                                value={
                                  <div className="flex flex-col gap-2">
                                    <div className="border rounded p-2 bg-gray-50 font-mono text-sm">
                                      {truncateUrl(item.url, 25, true)}
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="w-fit text-xs hover:bg-gray-100 flex items-center gap-1"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigator.clipboard.writeText(item.url);
                                        toast.success('URL copiée dans le presse-papiers');
                                      }}
                                    >
                                      <Icon icon="lucide:copy" className="h-3 w-3" />
                                      Copier l'URL complète
                                    </Button>
                                  </div>
                                }
                                icon={<Icon icon="lucide:link" className="h-5 w-5" />}
                              />
                              <InfoField 
                                label="Position"
                                value={item.position}
                                icon={<Icon icon="lucide:move" className="h-5 w-5" />}
                              />
                              <InfoField 
                                label="Statut"
                                value={item.is_active ? 'Actif' : 'Inactif'}
                                icon={<Icon icon="lucide:activity" className="h-5 w-5" />}
                              />
                              <InfoField 
                                label="Créé le"
                                value={format(new Date(item.created_at), 'PPpp')}
                                icon={<Icon icon="lucide:calendar" className="h-5 w-5" />}
                              />
                              <InfoField 
                                label="Mis à jour le"
                                value={item.updated_at ? format(new Date(item.updated_at), 'PPpp') : '-'}
                                icon={<Icon icon="lucide:clock" className="h-5 w-5" />}
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

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="icon" className="h-8 w-8">
                          <TrashIcon className="h-4 w-4" />
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
                                Supprimer l'élément de menu
                              </AlertDialogTitle>
                              <AlertDialogDescription className="text-gray-500">
                                Êtes-vous sûr de vouloir supprimer cet élément de menu ? Cette action ne peut pas être annulée.
                              </AlertDialogDescription>
                            </AlertDialogHeader>

                            <div className="w-full mt-6">
                              <AlertDialogFooter className="flex flex-col sm:flex-row gap-2 w-full">
                                <AlertDialogCancel className="w-full sm:w-auto mt-0">
                                  Annuler
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  className="w-full sm:w-auto bg-red-600 hover:bg-red-700"
                                  onClick={() => handleDelete(item.id)}
                                >
                                  Supprimer l'élément de menu
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </div>
                          </div>
                        </motion.div>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="hidden sm:block w-full overflow-x-auto -mx-2 sm:mx-0">
        <div className="min-w-[640px] lg:min-w-0 px-2 sm:px-0">
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="menu-items">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef}>
                  <Table className="min-w-[640px] lg:min-w-0">
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="w-[40px] hidden lg:table-cell"></TableHead>
                        <TableHead className="hidden lg:table-cell">Libellé</TableHead>

                        <TableHead className="hidden lg:table-cell">URL</TableHead>
                        <TableHead className="hidden lg:table-cell">Position</TableHead>
                        <TableHead>Détails</TableHead>
                        <TableHead className="w-[80px]">Statut</TableHead>
                        <TableHead className="text-right w-[120px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-8">
                            <div className="flex items-center justify-center">
                              <Icon icon="lucide:loader" className="h-6 w-6 animate-spin text-[#00897B]" />
                              <span className="ml-2">Chargement...</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : menuItems.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-8">
                            <div className="flex flex-col items-center justify-center text-gray-500">
                              <Icon icon="lucide:inbox" className="h-12 w-12 mb-2" />
                              <p>Aucun élément de menu trouvé</p>
                              <Button
                                variant="link"
                                onClick={() => setIsDialogOpen(true)}
                                className="mt-2 text-[#00897B]"
                              >
                                Créez votre premier élément de menu
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        menuItems.map((item, index) => (
                          <Draggable 
                            key={item.id} 
                            draggableId={item.id.toString()}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <TableRow 
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={cn(
                                  "group hover:bg-gray-50/50",
                                  snapshot.isDragging && "bg-gray-100"
                                )}
                              >
                                {/* Masqué sur mobile */}
                                <TableCell className="hidden lg:table-cell w-[40px]">
                                  <div 
                                    {...provided.dragHandleProps}
                                    className="w-8 h-8 flex items-center justify-center cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <GripVertical className="h-4 w-4 text-gray-400" />
                                  </div>
                                </TableCell>
                                <TableCell className="hidden lg:table-cell">{item.label}</TableCell>
                                <TableCell className="hidden lg:table-cell">
                                  <div className="flex flex-col gap-2">
                                    <div className="border rounded p-1.5 sm:p-2 bg-gray-50 font-mono text-xs sm:text-sm">
                                      {truncateUrl(item.url, 20, true)}
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="w-fit text-xs hover:bg-gray-100 flex items-center gap-1"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigator.clipboard.writeText(item.url);
                                        toast.success('URL copiée dans le presse-papiers');
                                      }}
                                    >
                                      <Icon icon="lucide:copy" className="h-3 w-3" />
                                      <span className="hidden sm:inline">Copier l'URL complète</span>
                                    </Button>
                                  </div>
                                </TableCell>
                                <TableCell className="hidden lg:table-cell">{item.position}</TableCell>

                                {/* Visible sur tous les écrans */}
                                <TableCell>
                                  <DetailCell item={item} />
                                </TableCell>
                                <TableCell className="text-center">
                                  <Switch
                                    checked={item.is_active}
                                    onCheckedChange={() => handleStatusChange(item)}
                                    className="data-[state=checked]:bg-[#00897B]"
                                  />
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex flex-wrap items-center justify-end gap-1 sm:gap-2">
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-7 w-7 sm:h-8 sm:w-8"
                                      onClick={() => {
                                        setSelectedMenuItem(item);
                                        setFormData({
                                          label: item.label,
                                          url: item.url,
                                          position: item.position,
                                          is_active: item.is_active,
                                          updated_at: item.updated_at,
                                        });
                                        setIsDialogOpen(true);
                                      }}
                                    >
                                      <PencilIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                    </Button>
                                    <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                                      <DialogTrigger asChild>
                                        <Button variant="outline" size="icon">
                                          <EyeIcon className="h-4 w-4" />
                                        </Button>
                                      </DialogTrigger>
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
                                                  <Icon icon="lucide:menu" className="h-4 sm:h-5 w-4 sm:w-5 text-[#00897B]" />
                                                </div>
                                                Détails de l'élément de menu
                                              </DialogTitle>
                                              <DialogDescription className="text-sm text-gray-500">
                                                Élément de menu #{item.id}
                                              </DialogDescription>
                                            </DialogHeader>
                                          </div>

                                          <div className="p-6 space-y-6">
                                            <div className="grid gap-6 sm:grid-cols-2">
                                              <InfoField 
                                                label="Libellé"
                                                value={item.label}
                                                icon={<Icon icon="lucide:tag" className="h-5 w-5" />}
                                              />
                                              <InfoField 
                                                label="URL"
                                                value={
                                                  <div className="flex flex-col gap-2">
                                                    <div className="border rounded p-2 bg-gray-50 font-mono text-sm">
                                                      {truncateUrl(item.url, 25, true)}
                                                    </div>
                                                    <Button
                                                      variant="ghost"
                                                      size="sm"
                                                      className="w-fit text-xs hover:bg-gray-100 flex items-center gap-1"
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigator.clipboard.writeText(item.url);
                                                        toast.success('URL copiée dans le presse-papiers');
                                                      }}
                                                    >
                                                      <Icon icon="lucide:copy" className="h-3 w-3" />
                                                      Copier l'URL complète
                                                    </Button>
                                                  </div>
                                                }
                                                icon={<Icon icon="lucide:link" className="h-5 w-5" />}
                                              />
                                              <InfoField 
                                                label="Position"
                                                value={item.position}
                                                icon={<Icon icon="lucide:move" className="h-5 w-5" />}
                                              />
                                              <InfoField 
                                                label="Statut"
                                                value={item.is_active ? 'Actif' : 'Inactif'}
                                                icon={<Icon icon="lucide:activity" className="h-5 w-5" />}
                                              />
                                              <InfoField 
                                                label="Créé le"
                                                value={format(new Date(item.created_at), 'PPpp')}
                                                icon={<Icon icon="lucide:calendar" className="h-5 w-5" />}
                                              />
                                              <InfoField 
                                                label="Mis à jour le"
                                                value={item.updated_at ? format(new Date(item.updated_at), 'PPpp') : '-'}
                                                icon={<Icon icon="lucide:clock" className="h-5 w-5" />}
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
                                                Supprimer l'élément de menu
                                              </AlertDialogTitle>
                                              <AlertDialogDescription className="text-gray-500">
                                                Êtes-vous sûr de vouloir supprimer cet élément de menu ? Cette action ne peut pas être annulée.
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
                                                  onClick={() => handleDelete(item.id)}
                                                >
                                                  Supprimer l'élément de menu
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
                            )}
                          </Draggable>
                        ))
                      )}
                      {provided.placeholder}
                    </TableBody>
                  </Table>
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-500 order-2 sm:order-1">
            Total {pagination.total} éléments
          </div>
          <Pagination className="order-1 sm:order-2">
            <PaginationContent>
              <PaginationItem>
                {pagination.currentPage > 1 && (
                  <PaginationPrevious
                    onClick={() => !isLoading && handlePageChange(pagination.currentPage - 1)}
                    className={isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                  />
                )}
              </PaginationItem>
              {Array.from(
                { length: Math.min(5, pagination.lastPage) },
                (_, i) => {
                  const page = Math.max(
                    1,
                    Math.min(
                      pagination.currentPage - 2,
                      pagination.lastPage - 4
                    )
                  ) + i;
                  return (
                    <PaginationItem key={page}>
                      <PaginationLink
                        isActive={page === pagination.currentPage}
                        onClick={() => !isLoading && handlePageChange(page)}
                        className={isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  );
                }
              )}
              <PaginationItem>
                {pagination.currentPage < pagination.lastPage && (
                  <PaginationNext
                    onClick={() => !isLoading && handlePageChange(pagination.currentPage + 1)}
                    className={isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                  />
                )}
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </Card>
  </div>
  );
};

export default MenuItems;