import { useState } from "react";
import { Card } from "@/admin/components/ui/card";
import { Input } from "@/admin/components/ui/input";
import { Button } from "@/admin/components/ui/button";
import { Textarea } from "@/admin/components/ui/textarea";
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
import { PencilIcon, TrashIcon, PlusIcon, Eye } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/admin/components/ui/dropdown-menu";
import { MoreVerticalIcon } from "lucide-react";
import { Label } from "@/admin/components/ui/label";
import { DialogFooter } from "@/admin/components/ui/dialog";
import { z } from "zod";

// Mock data - Replace with actual API data
const mockRoles = [
  {
    id: 1,
    name: "Admin",
    description: "Full system access",
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
  },
  {
    id: 2,
    name: "User",
    description: "Regular user access",
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
  },
  // Add more mock roles...
];

interface RoleFormData {
  name: string;
  description: string;
}

// Add validation schema
const roleSchema = z.object({
  name: z.string()
    .min(1, 'Role name is required')
    .max(50, 'Role name must be less than 50 characters'),
  description: z.string()
    .min(1, 'Description is required')
    .max(200, 'Description must be less than 200 characters'),
});

// Add View Dialog Component
const ViewRoleDialog: React.FC<{
  role: any;
  isOpen: boolean;
  onClose: () => void;
}> = ({ role, isOpen, onClose }) => {
  if (!role) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Role Details</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium leading-none mb-2">Role Name</h4>
              <p className="text-sm text-muted-foreground">{role.name}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium leading-none mb-2">Description</h4>
              <p className="text-sm text-muted-foreground">{role.description}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium leading-none mb-2">Created At</h4>
              <p className="text-sm text-muted-foreground">{role.createdAt}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Add Edit/Add Dialog Component
const RoleFormDialog: React.FC<{
  role: any;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: RoleFormData) => void;
}> = ({ role, isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<RoleFormData>({
    name: role?.name || '',
    description: role?.description || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      roleSchema.parse(formData);
      setErrors({});
      onSubmit(formData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMap: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path) {
            errorMap[err.path[0]] = err.message;
          }
        });
        setErrors(errorMap);
      }
    }
  };

  return (
<Dialog open={isOpen} onOpenChange={onClose}>
  <DialogContent className="sm:max-w-[425px]">
    <DialogHeader>
      <DialogTitle>{role ? 'Modifier le Rôle' : 'Ajouter un Nouveau Rôle'}</DialogTitle>
    </DialogHeader>
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="name">Nom du Rôle</Label>
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
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className={errors.description ? "border-red-500" : ""}
          />
          {errors.description && (
            <p className="text-sm text-red-500">{errors.description}</p>
          )}
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Annuler
        </Button>
        <Button type="submit">
          {role ? 'Enregistrer les Modifications' : 'Créer le Rôle'}
        </Button>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>
  );
};

// Add Delete Dialog Component - Translated
const DeleteRoleDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  roleName: string;
}> = ({ isOpen, onClose, onConfirm, roleName }) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer le rôle</AlertDialogTitle>
          <AlertDialogDescription>
            Êtes-vous sûr de vouloir supprimer le rôle "{roleName}" ? Cette action est irréversible.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive hover:bg-destructive/90"
          >
            Supprimer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
// Add Mobile Actions Component - Translated
const MobileActions: React.FC<{ role: any }> = ({ role }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreVerticalIcon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        <DropdownMenuItem onClick={() => {
          setSelectedRole(role);
          setIsViewDialogOpen(true);
        }}>
          <Eye className="h-4 w-4 mr-2" />
          Voir
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => {
          setSelectedRole(role);
          setFormData({
            name: role.name,
            description: role.description,
          });
          setIsAddDialogOpen(true);
        }}>
          <PencilIcon className="h-4 w-4 mr-2" />
          Modifier
        </DropdownMenuItem>
        <DropdownMenuItem 
          className="text-red-600"
          onClick={() => {
            setSelectedRole(role);
            setIsDeleteDialogOpen(true);
          }}
        >
          <TrashIcon className="h-4 w-4 mr-2" />
          Supprimer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
const Roles = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [formData, setFormData] = useState<RoleFormData>({
    name: "",
    description: "",
  });
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const handleSubmit = (data: RoleFormData) => {
    setIsAddDialogOpen(false);
    // Add your API call here
  };

  const handleDelete = (roleId: number) => {
    // Handle role deletion
    setIsDeleteDialogOpen(false);
  };

  const filteredRoles = mockRoles.filter(
    (role) =>
      role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="">
      <Card className="overflow-hidden">
        {/* Header Section - Translated */}
        <div className="p-4 md:p-6 bg-gradient-to-r from-[#00897B] to-[#00796B]">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="text-white">
              <h2 className="text-2xl font-bold">Gestion des rôles</h2>
              <p className="text-gray-100 mt-1">Gérez les rôles et permissions du système</p>
            </div>
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="bg-white text-[#00897B] hover:bg-gray-100 transition-colors"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Ajouter un rôle
            </Button>
          </div>
        </div>

        {/* Search Section - Translated */}
        <div className="p-4 border-b">
          <Input
            placeholder="Rechercher des rôles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>

        {/* Table Section - Translated */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>Détails</TableHead>
                <TableHead className="hidden md:table-cell">Description</TableHead>
                <TableHead className="hidden lg:table-cell">Créé le</TableHead>
                <TableHead className="w-[50px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRoles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell>
                    <div className="flex flex-col space-y-1">
                      <div className="font-medium text-base">{role.name}</div>
                      <div className="md:hidden space-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">ID :</span>
                          {role.id}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Description :</span>
                          {role.description}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Créé le :</span>
                          {role.createdAt}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{role.description}</TableCell>
                  <TableCell className="hidden lg:table-cell">{role.createdAt}</TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      {/* Desktop Actions - Translated */}
                      <div className="hidden md:flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setSelectedRole(role);
                            setIsViewDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setSelectedRole(role);
                            setFormData({
                              name: role.name,
                              description: role.description,
                            });
                            setIsAddDialogOpen(true);
                          }}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => {
                            setSelectedRole(role);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                      {/* Mobile Actions - Translated */}
                      <div className="md:hidden">
                        <MobileActions role={role} />
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Add the dialogs - Translated */}
      <ViewRoleDialog 
        role={selectedRole}
        isOpen={isViewDialogOpen}
        onClose={() => {
          setIsViewDialogOpen(false);
          setSelectedRole(null);
        }}
      />

      <RoleFormDialog
        role={selectedRole}
        isOpen={isAddDialogOpen}
        onClose={() => {
          setIsAddDialogOpen(false);
          setSelectedRole(null);
        }}
        onSubmit={handleSubmit}
      />

      <DeleteRoleDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setSelectedRole(null);
        }}
        onConfirm={() => {
          handleDelete(selectedRole?.id);
          setIsDeleteDialogOpen(false);
        }}
        roleName={selectedRole?.name || ''}
      />
    </div>
  );
};

export default Roles; 