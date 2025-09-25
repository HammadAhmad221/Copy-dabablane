import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';
import { Save, ArrowLeft } from 'lucide-react';
import { Button } from '@/admin/components/ui/button';
import { Input } from '@/admin/components/ui/input';
import { Label } from '@/admin/components/ui/label';
import { Textarea } from '@/admin/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/admin/components/ui/select';
import { vendorApi } from '@/admin/lib/api/services/vendorService';
import { Vendor, VendorStatus, CreateVendorRequest, UpdateVendorRequest } from '@/admin/lib/api/types/vendor';
import { getVendorStatusLabel } from '@/admin/lib/constants/vendor';
import { useToast } from '@/admin/hooks/use-toast';

const vendorFormSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  email: z.string().email('Email invalide'),
  phone: z.string().min(1, 'Le téléphone est requis'),
  address: z.string().min(1, 'L\'adresse est requise'),
  city: z.string().min(1, 'La ville est requise'),
  status: z.enum(['pending', 'active', 'suspended', 'blocked']),
  description: z.string().optional(),
  website: z.string().url('URL invalide').optional().or(z.literal('')),
});

type VendorFormData = z.infer<typeof vendorFormSchema>;

const VendorForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState<VendorFormData>({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    status: 'pending',
    description: '',
    website: '',
  });

  const [loading, setLoading] = useState(false);
  const [initialData, setInitialData] = useState<Vendor | null>(null);

  useEffect(() => {
    if (isEdit && id) {
      fetchVendor();
    }
  }, [isEdit, id]);

  const fetchVendor = async () => {
    try {
      setLoading(true);
      const vendor = await vendorApi.getVendorById(id!);
      setInitialData(vendor);
      setFormData({
        name: vendor.name,
        email: vendor.email,
        phone: vendor.phone,
        address: vendor.address,
        city: vendor.city,
        status: vendor.status,
        description: vendor.description || '',
        website: vendor.website || '',
      });
    } catch (error) {
      console.error('Error fetching vendor:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger le vendeur',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof VendorFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleStatusChange = async (newStatus: VendorStatus) => {
    if (initialData?.id) {
      try {
        await vendorApi.updateVendorStatus(initialData.id.toString(), {
          status: newStatus,
        });
        setFormData(prev => ({ ...prev, status: newStatus }));
        toast({
          title: 'Succès',
          description: 'Statut mis à jour avec succès',
        });
      } catch (error) {
        toast({
          title: 'Erreur',
          description: 'Erreur lors de la mise à jour du statut',
          variant: 'destructive',
        });
      }
    } else {
      setFormData(prev => ({ ...prev, status: newStatus }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const validatedData = vendorFormSchema.parse(formData);
      
      if (isEdit && id) {
        const updateData: UpdateVendorRequest = {
          name: validatedData.name,
          email: validatedData.email,
          phone: validatedData.phone,
          address: validatedData.address,
          city: validatedData.city,
          status: validatedData.status,
          description: validatedData.description || undefined,
          website: validatedData.website || undefined,
        };
        await vendorApi.updateVendor(id, updateData);
        toast({
          title: 'Succès',
          description: 'Vendeur mis à jour avec succès',
        });
      } else {
        const createData: CreateVendorRequest = {
          name: validatedData.name,
          email: validatedData.email,
          phone: validatedData.phone,
          address: validatedData.address,
          city: validatedData.city,
          status: validatedData.status,
          description: validatedData.description || undefined,
          website: validatedData.website || undefined,
        };
        await vendorApi.createVendor(createData);
        toast({
          title: 'Succès',
          description: 'Vendeur créé avec succès',
        });
      }
      
      navigate('/admin/vendors');
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        toast({
          title: 'Erreur de validation',
          description: firstError.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Erreur',
          description: 'Une erreur est survenue lors de la sauvegarde',
          variant: 'destructive',
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => navigate('/admin/vendors')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <h1 className="text-2xl font-bold">
          {isEdit ? 'Modifier le Vendeur' : 'Ajouter un Vendeur'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Nom *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Nom du vendeur"
                required
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="email@example.com"
                required
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="+33 1 23 45 67 89"
                required
              />
            </div>

            {/* City */}
            <div className="space-y-2">
              <Label htmlFor="city">Ville *</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="Paris"
                required
              />
            </div>

            {/* Address */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Adresse *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="123 Rue de la Paix"
                required
              />
            </div>

            {/* Website */}
            <div className="space-y-2">
              <Label htmlFor="website">Site Web</Label>
              <Input
                id="website"
                value={formData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                placeholder="https://www.example.com"
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Statut *</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleStatusChange(value as VendorStatus)}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Sélectionner un statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{getVendorStatusLabel('active')}</SelectItem>
                  <SelectItem value="pending">{getVendorStatusLabel('pending')}</SelectItem>
                  <SelectItem value="suspended">{getVendorStatusLabel('suspended')}</SelectItem>
                  <SelectItem value="blocked">{getVendorStatusLabel('blocked')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Description du vendeur..."
                rows={4}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/admin/vendors')}
          >
            Annuler
          </Button>
          <Button type="submit">
            <Save className="h-4 w-4 mr-2" />
            {isEdit ? 'Mettre à jour' : 'Créer'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default VendorForm;
