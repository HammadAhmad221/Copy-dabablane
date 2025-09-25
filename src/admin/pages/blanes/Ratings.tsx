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
  StarIcon,
} from "lucide-react";
import { ratingApi } from "@/admin/lib/api/services/ratingService";
import { blaneApi } from "@/admin/lib/api/services/blaneService";
import { userApi } from "@/admin/lib/api/services/userService";
import { RatingType, RatingFormData } from "@/lib/types/ratings";
import { Blane } from "@/lib/types/blane";
import { User } from "@/lib/types/user";
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
import { motion } from "framer-motion";
import { useAuth } from '@/contexts/AuthContext';

// Add this near the top of the file, after imports
const getUserIdFromSession = () => {
  const userStr = sessionStorage.getItem('user');
  if (!userStr) return null;
  try {
    const user = JSON.parse(userStr);
    return user.id;
  } catch (e) {
    return null;
  }
};

// Add this function after imports
const getCurrentAdminId = () => {
  const userStr = localStorage.getItem('userData');
  if (!userStr) return null;
  try {
    const user = JSON.parse(userStr);
    return user.id;
  } catch (e) {
    return null;
  }
};

// Add this after the imports and before the animationVariants
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

// Add this after the imports
const animationVariants = {
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
  },
  content: {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
  },
};

// Form validation schema
const ratingSchema = z.object({
  blane_id: z.number().min(1, "Blane is required"),
  user_id: z.number().min(1, "User is required"),
  rating: z.number().min(1).max(5),
  isFlagged: z.boolean().default(false),
});

type FormData = z.infer<typeof ratingSchema>;

const Ratings: React.FC = () => {
  const { user } = useAuth(); // Get authenticated user
  const [ratings, setRatings] = useState<RatingType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    perPage: 10,
    total: 0,
    lastPage: 1,
  });

  const [blanes, setBlanes] = useState<Blane[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRating, setSelectedRating] = useState<RatingType | null>(null);
  const [isAddEditDialogOpen, setIsAddEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [formData, setFormData] = useState<RatingFormData>({
    blane_id: 0,
    user_id: user?.id ? parseInt(user.id) : null, // Set user_id from authenticated user
    rating: 0,
    comment: "",
    isFlagged: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch blanes and users
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [blanesResponse, usersResponse] = await Promise.all([
          blaneApi.getBlanes({ paginationSize: 1000 }),
          userApi.getUsers(),
        ]);
        setBlanes(blanesResponse.data);
        setUsers(usersResponse.data);
      } catch (error) {
        toast.error("Failed to fetch necessary data");
      }
    };
    fetchData();
  }, []);

  // Fetch ratings
  const fetchRatings = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await ratingApi.getRatings();
      setRatings(response || []);
    } catch (error) {
      toast.error("Failed to fetch ratings");
      setRatings([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRatings();
  }, [fetchRatings]);

  const handleSearch = debounce((term: string) => {
    setSearchTerm(term);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, 500);

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      if (selectedRating) {
        await ratingApi.updateRating(selectedRating.id.toString(), formData);
        toast.success("Rating updated successfully");
      } else {
        await ratingApi.createRating(formData);
        toast.success("Rating created successfully");
      }

      setIsAddEditDialogOpen(false);
      resetForm();
      fetchRatings();
    } catch (error) {
      toast.error("Failed to save rating");
      console.error("Error saving rating:", error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await ratingApi.deleteRating(id.toString());
      toast.success("Rating deleted successfully");
      fetchRatings();
    } catch (error) {
      toast.error("Failed to delete rating");
      console.error("Error deleting rating:", error);
    }
  };

  const handleFlag = async (id: number, isFlagged: boolean) => {
    try {
      if (isFlagged) {
        await ratingApi.unmarkAsFlagged(id.toString());
      } else {
        await ratingApi.markAsFlagged(id.toString());
      }
      toast.success(`Rating ${isFlagged ? 'unflagged' : 'flagged'} successfully`);
      fetchRatings();
    } catch (error) {
      toast.error(`Failed to ${isFlagged ? 'unflag' : 'flag'} rating`);
      console.error("Error updating rating flag:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      blane_id: 0,
      user_id: user?.id ? parseInt(user.id) : null,
      rating: 0,
      comment: "",
      isFlagged: false,
    });
    setSelectedRating(null);
    setErrors({});
    setIsViewDialogOpen(false);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {Array.from({ length: 5 }).map((_, i) => (
          <StarIcon
            key={i}
            className={`h-4 w-4 ${
              i < rating
                ? "text-yellow-400 fill-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

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
          <h2 className="text-2xl font-bold">Gestion des Évaluations</h2>
          <p className="text-gray-100 mt-1">Gérez vos évaluations et commentaires</p>
        </div>
        <Button 
          onClick={() => {
            resetForm();
            setIsAddEditDialogOpen(true);
          }}
          className="bg-white text-[#00897B] hover:bg-gray-100 transition-colors"
        >
          <PlusIcon className="mr-2 h-4 w-4" />
          Ajouter une Évaluation
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
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Input
              placeholder="Rechercher des évaluations..."
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
            Ajouter une Évaluation
          </Button>
        </div>
      </div>
    </motion.div>

    {/* Section du tableau */}
    <div className="w-full overflow-x-auto">
      <Table className="">
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="w-[200px] md:w-[200px]">Blane</TableHead>
            <TableHead className="hidden md:table-cell w-[180px]">Utilisateur</TableHead>
            <TableHead className="hidden md:table-cell w-[250px]">Commentaire</TableHead>
            <TableHead className="hidden md:table-cell w-[120px]">Évaluation</TableHead>
            <TableHead className="w-[100px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8">
                <div className="flex items-center justify-center">
                  <Icon icon="lucide:loader" className="h-6 w-6 animate-spin text-[#00897B]" />
                  <span className="ml-2">Chargement...</span>
                </div>
              </TableCell>
            </TableRow>
          ) : (ratings && ratings.length === 0) ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8">
                <div className="flex flex-col items-center justify-center text-gray-500">
                  <Icon icon="lucide:star" className="h-12 w-12 mb-2" />
                  <p>Aucune évaluation trouvée</p>
                  <Button
                    variant="link"
                    onClick={() => setIsAddEditDialogOpen(true)}
                    className="mt-2 text-[#00897B]"
                  >
                    Créez votre première évaluation
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            ratings && ratings.map((rating) => (
              <TableRow key={rating.id}>
                <TableCell>
                  <div className="md:hidden space-y-3">
                    {/* Vue mobile - informations combinées */}
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#00897B]/10 flex items-center justify-center">
                        <Icon icon="lucide:box" className="h-4 w-4 text-[#00897B]" />
                      </div>
                      <span className="font-medium truncate">
                        {blanes.find(b => b.id === rating.blane_id)?.name}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Icon icon="lucide:user" className="h-4 w-4" />
                        <span>{users.find(u => u.id === rating.user_id)?.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {renderStars(rating.rating)}
                        <span>({rating.rating.toFixed(1)}/5)</span>
                      </div>
                      <div className="truncate">{rating.comment}</div>
                    </div>
                  </div>
                  {/* Vue desktop */}
                  <div className="hidden md:flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#00897B]/10 flex items-center justify-center">
                      <Icon icon="lucide:box" className="h-4 w-4 text-[#00897B]" />
                    </div>
                    <span className="font-medium truncate">
                      {blanes.find(b => b.id === rating.blane_id)?.name}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                      <Icon icon="lucide:user" className="h-4 w-4 text-gray-600" />
                    </div>
                    <span className="truncate">
                      {users.find(u => u.id === rating.user_id)?.name}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className="max-w-[250px]">
                    <p className="truncate text-sm text-gray-600">
                      {rating.comment}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className="flex items-center gap-1">
                    {renderStars(rating.rating)}
                    <span className="ml-1 text-sm text-gray-600">
                      ({rating.rating.toFixed(1)}/5)
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setSelectedRating(rating);
                        setIsViewDialogOpen(true);
                      }}
                      className="h-8 w-8"
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
                          variants={animationVariants.content}
                          className="p-6"
                        >
                          <div className="flex flex-col items-center text-center">
                            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
                              <Icon icon="lucide:trash-2" className="h-6 w-6 text-red-600" />
                            </div>
                            <AlertDialogHeader className="space-y-2">
                              <AlertDialogTitle className="text-xl font-semibold">
                                Supprimer l'Évaluation
                              </AlertDialogTitle>
                              <AlertDialogDescription className="text-gray-500">
                                Êtes-vous sûr de vouloir supprimer cette évaluation ? Cette action est irréversible.
                              </AlertDialogDescription>
                            </AlertDialogHeader>

                            <div className="w-full mt-6">
                              <AlertDialogFooter className="flex flex-col sm:flex-row gap-2 w-full">
                                <AlertDialogCancel className="w-full sm:w-auto mt-0">
                                  Annuler
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  className="w-full sm:w-auto bg-red-600 hover:bg-red-700"
                                  onClick={() => handleDelete(rating.id)}
                                >
                                  Supprimer l'Évaluation
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
      <div className="flex flex-col sm:flex-row items-center gap-4 sm:justify-between">
        <div className="text-sm text-gray-500 order-2 sm:order-1">
          Affichage de {((pagination.currentPage - 1) * pagination.perPage) + 1} à {Math.min(pagination.currentPage * pagination.perPage, pagination.total)} sur {pagination.total} entrées
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

  {/* Boîte de dialogue pour ajouter/modifier une évaluation */}
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
                <Icon icon={selectedRating ? "lucide:edit" : "lucide:plus"} className="h-4 sm:h-5 w-4 sm:w-5 text-[#00897B]" />
              </div>
              {selectedRating ? "Modifier l'Évaluation" : "Ajouter une Nouvelle Évaluation"}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              {selectedRating 
                ? "Modifiez les détails de cette évaluation" 
                : "Créez une nouvelle évaluation"}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              {/* Sélection du Blane */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Blane <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.blane_id.toString()}
                  onValueChange={(value) => setFormData({ ...formData, blane_id: parseInt(value) })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionnez un blane" />
                  </SelectTrigger>
                  <SelectContent>
                    <div 
                      className="max-h-[300px] overflow-y-auto custom-scrollbar"
                      style={{ 
                        scrollBehavior: 'smooth',
                        WebkitOverflowScrolling: 'touch'
                      }}
                    >
                      {blanes.map((blane) => (
                        <SelectItem key={blane.id} value={blane.id.toString()}>
                          {blane.name}
                        </SelectItem>
                      ))}
                    </div>
                  </SelectContent>
                </Select>
                {errors.blane_id && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <Icon icon="lucide:alert-circle" className="h-4 w-4" />
                    {errors.blane_id}
                  </p>
                )}
              </div>

              {/* Sélection de l'évaluation */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Évaluation <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.rating.toString()}
                  onValueChange={(value) => setFormData({ ...formData, rating: parseInt(value) })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionnez une évaluation" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <SelectItem key={rating} value={rating.toString()}>
                        {renderStars(rating)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.rating && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <Icon icon="lucide:alert-circle" className="h-4 w-4" />
                    {errors.rating}
                  </p>
                )}
              </div>

              {/* Commentaire */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Commentaire <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  value={formData.comment}
                  onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                  placeholder="Entrez votre commentaire..."
                  className="min-h-[100px] resize-none"
                />
                {errors.review && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <Icon icon="lucide:alert-circle" className="h-4 w-4" />
                    {errors.review}
                  </p>
                )}
              </div>
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
                  {selectedRating ? (
                    <>
                      <Icon icon="lucide:save" className="h-4 w-4 mr-2" />
                      Enregistrer les modifications
                    </>
                  ) : (
                    <>
                      <Icon icon="lucide:plus" className="h-4 w-4 mr-2" />
                      Créer l'Évaluation
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
  <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
    <DialogContent className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] max-w-[95vw] w-full sm:max-w-2xl p-0 overflow-hidden bg-white rounded-lg shadow-lg">
      <button
        className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
        onClick={() => setIsViewDialogOpen(false)}
      >
        <Icon icon="lucide:x" className="h-4 w-4" />
        <span className="sr-only">Fermer</span>
      </button>

      {selectedRating && (
        <div className="max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white z-20 px-6 pt-6 pb-4 border-b">
            <DialogHeader>
              <DialogTitle className="text-xl sm:text-2xl font-bold text-[#00897B] flex items-center gap-2">
                <div className="w-8 sm:w-10 h-8 sm:h-10 rounded-full bg-[#00897B]/10 flex items-center justify-center">
                  <Icon icon="lucide:star" className="h-4 sm:h-5 w-4 sm:w-5 text-[#00897B]" />
                </div>
                Détails de l'Évaluation
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500">
                Évaluation #{selectedRating.id}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <InfoField 
                label="Blane"
                value={blanes.find(b => b.id === selectedRating.blane_id)?.name}
                icon={<Icon icon="lucide:box" className="h-5 w-5" />}
              />
              <InfoField 
                label="Utilisateur"
                value={users.find(u => u.id === selectedRating.user_id)?.name}
                icon={<Icon icon="lucide:user" className="h-5 w-5" />}
              />
              <InfoField 
                label="Évaluation"
                value={renderStars(selectedRating.rating)}
                icon={<Icon icon="lucide:star" className="h-5 w-5" />}
              />
              <InfoField 
                label="Commentaire"
                value={selectedRating.comment}
                icon={<Icon icon="lucide:message-square" className="h-5 w-5" />}
                wrapText
                fullWidth
              />
              <InfoField 
                label="Créée le"
                value={format(new Date(selectedRating.created_at), 'PPpp')}
                icon={<Icon icon="lucide:calendar" className="h-5 w-5" />}
              />
              <InfoField 
                label="Modifiée le"
                value={selectedRating.updated_at ? format(new Date(selectedRating.updated_at), 'PPpp') : '-'}
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
      )}
    </DialogContent>
  </Dialog>
</div>
  );
};

export default Ratings;