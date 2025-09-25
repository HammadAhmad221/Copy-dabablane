import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { Card } from "@/admin/components/ui/card";
import { Button } from "@/admin/components/ui/button";
import { Input } from "@/admin/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/admin/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/admin/components/ui/dialog";
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
import { format } from 'date-fns';
import { PencilIcon, TrashIcon, PlusIcon, SearchIcon } from "lucide-react";
import { cityApi } from '@/admin/lib/api/services/cityService';
import { CityType, CitiesFormData } from '@/lib/types/cities';
import { debounce } from "lodash";
import { z } from 'zod';
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
import { Switch } from "@/admin/components/ui/switch";
import { Label } from "@/admin/components/ui/label";
import { Separator } from "@/admin/components/ui/separator";
import { Icon } from "@iconify/react";
import { motion } from 'framer-motion';
import { cn } from "@/lib/utils";

interface CityFilters {
  page?: number;
  paginationSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

// Zod schema for validation
const citySchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name must be less than 50 characters'),
  is_active: z.boolean().optional(),
});

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

const Cities: React.FC = () => {
  // State for cities, loading, and pagination
  const [cities, setCities] = useState<CityType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    perPage: 10,
    total: 0,
    lastPage: 1,
  });

  // State for search and sorting
  const [searchTerm, setSearchTerm] = useState('');

  // State for city form
  const [selectedCity, setSelectedCity] = useState<CityType | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CitiesFormData>({
    name: '',
    is_active: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // State for pagination size
  const [paginationSize, setPaginationSize] = useState<number>(10);

  // State for delete confirmation
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [cityToDelete, setCityToDelete] = useState<string | null>(null);

  // Add new state for all cities data
  const [allCities, setAllCities] = useState<CityType[]>([]);

  // Add state for view dialog in the Cities component
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedViewCity, setSelectedViewCity] = useState<CityType | null>(null);

  // Fetch cities with pagination, sorting, and filtering
  const fetchCities = useCallback(
    async (filters: CityFilters = {}) => {
      setIsLoading(true);
      try {
        const response = await cityApi.getCities(filters);
        setAllCities(response.data); // Store all cities
        
        // Filter cities based on search term
        const filteredCities = response.data.filter(city => 
          city.name.toLowerCase().includes((searchTerm || '').toLowerCase())
        );
        
        setCities(filteredCities);
        setPagination({
          currentPage: response.meta.current_page,
          perPage: response.meta.per_page,
          total: response.meta.total,
          lastPage: response.meta.last_page,
        });
      } catch (error) {
        toast.error('Failed to fetch cities. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Fetch cities on component mount or when dependencies change
  useEffect(() => {
    fetchCities({
      page: pagination.currentPage,
      paginationSize: paginationSize,
    });
  }, [fetchCities, pagination.currentPage, paginationSize]);

  // Replace the handleSearch function with a debounced version
  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    
    debouncedFilter(term);
  }, []);

  // Add this debounced filter function
  const debouncedFilter = useCallback(
    debounce((term: string) => {
      const filteredCities = allCities.filter(city =>
        city.name.toLowerCase().includes(term.toLowerCase())
      );
      
      setCities(filteredCities);
      // Update pagination for filtered results
      setPagination(prev => ({
        ...prev,
        total: filteredCities.length,
        lastPage: Math.ceil(filteredCities.length / prev.perPage),
        currentPage: 1,
      }));
    }, 500),
    [allCities]
  );

  // Handle page change
  const handlePageChange = useCallback(
    (page: number) => {
      fetchCities({
        page,
        paginationSize,
      });
    },
    [fetchCities, paginationSize]
  );

  // Handle pagination size change
  const handlePaginationSizeChange = useCallback(
    (value: string) => {
      const newPaginationSize = parseInt(value, 10);
      setPaginationSize(newPaginationSize);
      fetchCities({
        page: 1,
        paginationSize: newPaginationSize,
      });
    },
    [fetchCities]
  );

  // Handle city edit
  const handleEdit = useCallback((city: CityType) => {
    setSelectedCity(city);
    setFormData({
      name: city.name,
      is_active: Boolean(city.is_active),
    });
    setIsDialogOpen(true);
  }, []);

  // Handle delete confirmation
  const handleDeleteClick = useCallback((cityId: string) => {
    setCityToDelete(cityId);
    setIsDeleteDialogOpen(true);
  }, []);

  // Handle actual deletion
  const handleDeleteConfirm = useCallback(async () => {
    if (!cityToDelete) return;

    try {
      await cityApi.deleteCity(cityToDelete);
      setCities((prev) => prev.filter((city) => city.id.toString() !== cityToDelete));
      toast.success('City deleted successfully!');
    } catch (error) {
      toast.error('Failed to delete city. Please try again later.');
    } finally {
      setIsDeleteDialogOpen(false);
      setCityToDelete(null);
    }
  }, [cityToDelete]);

  // Handle form submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      try {
        citySchema.parse(formData);
        setErrors({});

        const submitData = {
          ...formData,
          is_active: formData.is_active ? 1 : 0,
        };

        if (selectedCity) {
          const updatedCity = await cityApi.updateCity(selectedCity.id.toString(), submitData);
          setCities((prev) =>
            prev.map((city) => (city.id === selectedCity.id ? updatedCity : city))
          );
          toast.success('City updated successfully!');
        } else {
          const newCity = await cityApi.createCity(submitData);
          setCities((prev) => [...prev, newCity]);
          toast.success('City created successfully!');
        }
        setIsDialogOpen(false);
        setSelectedCity(null);
        setFormData({
          name: '',
          is_active: true,
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          const errorMap: Record<string, string> = {};
          error.errors.forEach((err) => {
            if (err.path) {
              errorMap[err.path[0]] = err.message;
            }
          });
          setErrors(errorMap);
          toast.error('Please fix the errors in the form.');
          return;
        }
        toast.error('Failed to save city. Please try again later.');
      }
    },
    [formData, selectedCity]
  );

  // Add handleView function
  const handleView = useCallback((city: CityType) => {
    setSelectedViewCity(city);
    setIsViewDialogOpen(true);
  }, []);

  return (
  <div className="">
    <Card className="p-6 shadow-lg border-0">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* En-tête avec fond dégradé */}
        <div className="p-6 -mx-6 -mt-6 mb-6 bg-gradient-to-r from-[#00897B] to-[#00796B] rounded-t-lg">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="text-white">
              <h2 className="text-2xl font-bold">Gestion des villes</h2>
              <p className="text-gray-100 mt-1">Gérez et organisez vos villes</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-white text-[#00897B] hover:bg-gray-100 transition-colors">
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Ajouter une ville
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>
        </div>

        {/* Recherche et Filtres */}
        <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            {/* Barre de recherche */}
            <div className="relative w-full sm:w-96">
              <Input
                placeholder="Rechercher des villes..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
              <Icon 
                icon="lucide:search" 
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" 
              />
            </div>

            {/* Sélection du nombre d'éléments par page */}
            <Select
              value={paginationSize.toString()}
              onValueChange={handlePaginationSizeChange}
            >
              <SelectTrigger className="w-[180px] bg-white">
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

        {/* Tableau */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 border-b border-gray-200">
                  <TableHead className="w-[300px] font-semibold">Nom</TableHead>
                  <TableHead className="w-[100px] font-semibold">Statut</TableHead>
                  <TableHead className="hidden lg:table-cell w-[180px] font-semibold">Dates</TableHead>
                  <TableHead className="w-[120px] text-right font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <Icon icon="lucide:loader" className="h-6 w-6 animate-spin text-primary" />
                        <span className="ml-2">Chargement...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : cities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center text-gray-500">
                        <Icon icon="lucide:inbox" className="h-12 w-12 mb-2" />
                        <p>Aucune ville trouvée</p>
                        <Button
                          variant="link"
                          onClick={() => setIsDialogOpen(true)}
                          className="mt-2 text-primary"
                        >
                          Créez votre première ville
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  cities.map((city) => (
                    <TableRow key={city.id} className="group hover:bg-gray-50">
                      <TableCell>
                        <div className="font-medium text-base">{city.name}</div>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={Boolean(city.is_active)}
                          onCheckedChange={async (checked) => {
                            try {
                              const updatedCity = await cityApi.updateCity(city.id.toString(), {
                                ...city,
                                is_active: checked ? 1 : 0,
                              });
                              setCities(prev => prev.map(c => c.id === city.id ? updatedCity : c));
                              toast.success('Statut mis à jour avec succès');
                            } catch (error) {
                              toast.error('Échec de la mise à jour du statut');
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-1">
                            <Icon icon="lucide:clock" className="h-4 w-4" />
                            <span>{format(new Date(city.created_at), 'PP')}</span>
                          </div>
                          <div className="flex items-center gap-1 text-gray-500">
                            <Icon icon="lucide:refresh-cw" className="h-4 w-4" />
                            <span>{format(new Date(city.updated_at), 'PP')}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleView(city)}
                            title="Voir les détails"
                          >
                            <Icon icon="lucide:eye" className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEdit(city)}
                            title="Modifier"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => handleDeleteClick(city.id.toString())}
                            title="Supprimer"
                            className="h-8 w-8"
                          >
                            <TrashIcon className="h-3.5 w-3.5" />
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

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="text-sm text-gray-700">
            Affichage de{' '}
            <span className="font-medium">
              {((pagination.currentPage - 1) * pagination.perPage) + 1}
            </span>
            {' '}-{' '}
            <span className="font-medium">
              {Math.min(pagination.currentPage * pagination.perPage, pagination.total)}
            </span>
            {' '}sur{' '}
            <span className="font-medium">{pagination.total}</span>
            {' '}résultats
          </div>

          <Pagination className="flex items-end justify-end px-4 py-3">
            <PaginationContent>
              {pagination.currentPage > 1 && (
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    className="hover:bg-gray-100"
                  />
                </PaginationItem>
              )}

              {Array.from({ length: Math.min(5, pagination.lastPage) }, (_, i) => {
                const page = Math.max(
                  1,
                  Math.min(pagination.currentPage - 2, pagination.lastPage - 4)
                ) + i;
                return (
                  <PaginationItem key={page}>
                    <PaginationLink
                      isActive={page === pagination.currentPage}
                      onClick={() => handlePageChange(page)}
                      className={cn(
                        "min-w-[2.25rem] justify-center",
                        page === pagination.currentPage 
                          ? "bg-gray-200 text-gray-800 hover:bg-gray-300" 
                          : "hover:bg-gray-100"
                      )}
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
                    className="hover:bg-gray-100"
                  />
                </PaginationItem>
              )}
            </PaginationContent>
          </Pagination>
        </div>
      </motion.div>

      {/* Dialogue Ajouter/Modifier */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
                    <Icon icon={selectedCity ? "lucide:edit" : "lucide:plus"} className="h-4 sm:h-5 w-4 sm:w-5 text-[#00897B]" />
                  </div>
                  {selectedCity ? "Modifier la ville" : "Ajouter une nouvelle ville"}
                </DialogTitle>
              </DialogHeader>
            </div>

            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">
                      Nom <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={cn(
                        "mt-1.5",
                        errors.name && "border-red-500 focus-visible:ring-red-500"
                      )}
                      placeholder="Entrez le nom de la ville"
                      maxLength={255}
                    />
                    {errors.name && (
                      <p className="text-sm text-red-500 mt-1 flex items-center">
                        <span className="mr-1">⚠</span> {errors.name}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active as boolean}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, is_active: checked })
                      }
                    />
                    <Label htmlFor="is_active">Actif</Label>
                  </div>
                </div>

                <div className="sticky bottom-0 bg-white border-t mt-6 px-6 py-4">
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => {
                      setIsDialogOpen(false);
                      setSelectedCity(null);
                      setFormData({
                        name: '',
                        is_active: true,
                      });
                    }}>
                      Annuler
                    </Button>
                    <Button type="submit">
                      {selectedCity ? 'Enregistrer les modifications' : 'Ajouter la ville'}
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialogue de confirmation de suppression */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
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
                  Supprimer la ville
                </AlertDialogTitle>
                <AlertDialogDescription className="text-gray-500">
                  Êtes-vous sûr de vouloir supprimer cette ville ? Cette action est irréversible.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <div className="w-full mt-6">
                <AlertDialogFooter className="flex flex-col sm:flex-row gap-2 w-full">
                  <AlertDialogCancel 
                    className="w-full sm:w-auto mt-0"
                    onClick={() => {
                      setIsDeleteDialogOpen(false);
                      setCityToDelete(null);
                    }}
                  >
                    Annuler
                  </AlertDialogCancel>
                  <AlertDialogAction
                    className="w-full sm:w-auto bg-red-600 hover:bg-red-700"
                    onClick={handleDeleteConfirm}
                  >
                    Supprimer la ville
                  </AlertDialogAction>
                </AlertDialogFooter>
              </div>
            </div>
          </motion.div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialogue de visualisation */}
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
                    <Icon icon="lucide:map-pin" className="h-4 sm:h-5 w-4 sm:w-5 text-[#00897B]" />
                  </div>
                  Détails de la ville
                </DialogTitle>
                <DialogDescription className="text-sm text-gray-500">
                  Ville #{selectedViewCity?.id}
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <InfoField 
                  label="Nom"
                  value={selectedViewCity?.name}
                  icon={<Icon icon="lucide:map-pin" className="h-5 w-5" />}
                />
                <InfoField 
                  label="Statut"
                  value={selectedViewCity?.is_active ? 'Actif' : 'Inactif'}
                  icon={<Icon icon="lucide:activity" className="h-5 w-5" />}
                />
                <InfoField 
                  label="Créé le"
                  value={selectedViewCity?.created_at ? format(new Date(selectedViewCity.created_at), 'PPpp') : '-'}
                  icon={<Icon icon="lucide:calendar" className="h-5 w-5" />}
                />
                <InfoField 
                  label="Mis à jour le"
                  value={selectedViewCity?.updated_at ? format(new Date(selectedViewCity.updated_at), 'PPpp') : '-'}
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
    </Card>
  </div>
  );
};

export default Cities; 