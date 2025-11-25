import * as React from "react";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Card } from "@/admin/components/ui/card";
import { Button } from "@/admin/components/ui/button";
import { Input } from "@/admin/components/ui/input";
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
import { format } from "date-fns";
import { EyeIcon, MoreVerticalIcon, PencilIcon } from "lucide-react";
import { Vendor, VendorStatus } from "@/admin/lib/api/types/vendor";
import { getVendorStatusLabel } from "@/admin/lib/constants/vendor";
import { useVendors } from "@/admin/hooks/useVendors";
import { vendorApi } from "@/admin/lib/api/services/vendorService";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import { debounce } from "lodash";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/admin/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/admin/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/admin/components/ui/dropdown-menu";
import { motion } from "framer-motion";
import {
  TooltipProvider,
} from "@/admin/components/ui/tooltip";
import { Badge } from "@/admin/components/ui/badge";
import ImageLightbox from "@/admin/components/ui/ImageLightbox";
import { Label } from "@/admin/components/ui/label";
import { Textarea } from "@/admin/components/ui/textarea";
import { Switch } from "@/admin/components/ui/switch";

// Status Change Dialog Component
const StatusChangeDialog = React.memo(({
  vendor,
  onStatusChange,
  actionLoading
}: {
  vendor: Vendor;
  onStatusChange: (vendor: Vendor, status: VendorStatus, comment?: string) => Promise<void>;
  actionLoading: Set<number>;
}) => {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [selectedStatus, setSelectedStatus] = React.useState<VendorStatus | null>(null);
  const [comment, setComment] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const requiresComment = (status: VendorStatus) => {
    return status === 'inActive' || status === 'suspended' || status === 'waiting';
  };

  const handleStatusSelect = (value: string) => {
    const status = value as VendorStatus;
    if (requiresComment(status)) {
      setSelectedStatus(status);
      setDialogOpen(true);
      setComment('');
    } else {
      // Directly submit for statuses that don't require comment
      onStatusChange(vendor, status);
    }
  };

  const handleConfirm = async () => {
    if (!selectedStatus || !comment.trim()) {
      return;
    }
    setIsSubmitting(true);
    try {
      await onStatusChange(vendor, selectedStatus, comment);
      setDialogOpen(false);
      setSelectedStatus(null);
      setComment('');
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setDialogOpen(false);
    setSelectedStatus(null);
    setComment('');
  };

  return (
    <>
      <Select
        value={vendor.status}
        onValueChange={handleStatusSelect}
        disabled={actionLoading.has(vendor.id)}
      >
        <SelectTrigger className="w-full h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="active">{getVendorStatusLabel('active')}</SelectItem>
          <SelectItem value="pending">{getVendorStatusLabel('pending')}</SelectItem>
          <SelectItem value="inActive">{getVendorStatusLabel('inActive')}</SelectItem>
          <SelectItem value="suspended">{getVendorStatusLabel('suspended')}</SelectItem>
          <SelectItem value="waiting">{getVendorStatusLabel('waiting')}</SelectItem>
        </SelectContent>
      </Select>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Changer le statut vers {selectedStatus && getVendorStatusLabel(selectedStatus)}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="comment">
                Veuillez décrire la raison du changement de statut *
              </Label>
              <Textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={selectedStatus ? `Expliquez pourquoi vous changez le statut vers ${getVendorStatusLabel(selectedStatus)}...` : '...'}
                rows={5}
                required
              />
            </div>
          </div>
          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isSubmitting || !comment.trim()}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Enregistrement...
                </>
              ) : (
                'Confirmer'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
});
StatusChangeDialog.displayName = 'StatusChangeDialog';

// City-District mapping
const cityDistricts: Record<string, string[]> = {
  'Casablanca': [
    'Ain Chock',
    'Ain Sebaa-Hay Mohammadi',
    'Al Fida-Mers Sultan',
    'Anfa',
    'Hay Hassani',
    'Moulay Rachid',
    'Sidi Bernoussi',
    'Bouskoura',
    'La Ville Verte',
    'Dar Bouazza',
    'Mohammedia',
    'Bouznika',
  ],
  'Rabat': [],
  'Marrakech': [],
  'Fes': [],
  'Tangier': [],
};

// District-Subdistrict mapping
const districtSubdistricts: Record<string, string[]> = {
  'Anfa': [
    'Bourgogne',
    'Sidi Belyout (Centre Ville, Médina)',
    'Maârif',
    'Ain Diab (Corniche)',
    'Gauthier',
    'Racine',
    'Palmier',
    'Triangle d\'Or',
    'Oasis',
    'CIL',
  ],
  'Hay Hassani': [
    'Hay Hassani',
    'Oulfa',
    'Errahma',
    'Lissasfa',
  ],
  'Ain Chock': [
    'Ain Chock',
    'Sidi Maârouf',
    'Californie',
    'Polo',
  ],
  'Ain Sebaa-Hay Mohammadi': [
    'Ain Sebaa',
    'Hay Mohammadi',
    'Roches Noires (Belvédère)',
  ],
  'Al Fida-Mers Sultan': [
    'Al Fida',
    'Mers Sultan',
    'Derb Sultan',
    'Habous',
  ],
  'Sidi Bernoussi': [
    'Sidi Bernoussi',
    'Sidi Moumen',
    'Zenata',
  ],
  'Moulay Rachid': [
    'Moulay Rachid',
    'Sidi Othmane',
    'Ben M\'Sick',
    'Sbata',
  ],
  'Bouskoura': [],
  'La Ville Verte': [],
  'Dar Bouazza': [],
  'Mohammedia': [],
  'Bouznika': [],
};

// Edit Vendor Dialog Component
const EditVendorDialog = React.memo(({
  vendor,
  onSave,
  actionLoading
}: {
  vendor: Vendor;
  onSave: (vendorData: any) => Promise<void>;
  actionLoading: Set<number>;
}) => {
  const [open, setOpen] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: vendor.name || '',
    email: vendor.email || '',
    phone: vendor.phone || '',
    city: vendor.city || '',
    landline: vendor.landline || '',
    businessCategory: vendor.businessCategory || '',
    subCategory: vendor.subCategory || '',
    description: vendor.description || '',
    address: vendor.address || '',
    ice: vendor.ice || '',
    rc: vendor.rc || '',
    vat: vendor.vat || '',
    district: vendor.district || '',
    subdistrict: vendor.subdistrict || '',
    logoUrl: vendor.logoUrl || '',
    facebook: vendor.facebook || '',
    tiktok: vendor.tiktok || '',
    instagram: vendor.instagram || '',
    cover_media_urls: Array.isArray(vendor.cover_media) 
      ? vendor.cover_media.map((m: any) => typeof m === 'string' ? m : (m?.media_url || m?.url || '')).filter(Boolean)
      : [],
    rcCertificateUrl: vendor.rcCertificateUrl || '',
    ribUrl: vendor.ribUrl || '',
    isDiamond: (vendor as any).isDiamond === true || (vendor as any).isDiamond === "1" || (vendor as any).isDiamond === 1,
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // The API expects all fields including empty strings
      const payload: any = { ...formData };
      // Ensure empty strings are sent as empty strings, not undefined
      Object.keys(payload).forEach(key => {
        if (payload[key] === null || payload[key] === undefined) {
          payload[key] = '';
        }
      });
      // Convert isDiamond boolean to string "1" or "0" as API expects
      if (payload.hasOwnProperty('isDiamond')) {
        payload.isDiamond = payload.isDiamond ? "1" : "0";
      }
      await onSave(payload);
      setOpen(false);
    } catch (error) {
      console.error('Error updating vendor:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update form data when vendor changes
  React.useEffect(() => {
    setFormData({
      name: vendor.name || '',
      email: vendor.email || '',
      phone: vendor.phone || '',
      city: vendor.city || '',
      landline: vendor.landline || '',
      businessCategory: vendor.businessCategory || '',
      subCategory: vendor.subCategory || '',
      description: vendor.description || '',
      address: vendor.address || '',
      ice: vendor.ice || '',
      rc: vendor.rc || '',
      vat: vendor.vat || '',
      district: vendor.district || '',
      subdistrict: vendor.subdistrict || '',
      logoUrl: vendor.logoUrl || '',
      facebook: vendor.facebook || '',
      tiktok: vendor.tiktok || '',
      instagram: vendor.instagram || '',
      cover_media_urls: Array.isArray(vendor.cover_media) 
        ? vendor.cover_media.map((m: any) => typeof m === 'string' ? m : (m?.media_url || m?.url || '')).filter(Boolean)
        : [],
      rcCertificateUrl: vendor.rcCertificateUrl || '',
      ribUrl: vendor.ribUrl || '',
      isDiamond: (vendor as any).isDiamond === true || (vendor as any).isDiamond === "1" || (vendor as any).isDiamond === 1,
    });
  }, [vendor]);

  const handleInputChange = (field: string, value: string) => {
    if (field === 'city') {
      // Clear district and subdistrict when city changes (if new city has no districts or current district is not valid)
      const districts = cityDistricts[value] || [];
      setFormData(prev => {
        const currentDistrict = prev.district;
        const isValidDistrict = districts.length > 0 && districts.includes(currentDistrict);
        return {
          ...prev,
          [field]: value,
          district: isValidDistrict ? prev.district : '',
          subdistrict: isValidDistrict ? prev.subdistrict : ''
        };
      });
    } else if (field === 'district') {
      // Clear subdistrict when district changes (if new district has no subdistricts or current subdistrict is not valid)
      const subdistricts = districtSubdistricts[value] || [];
      setFormData(prev => {
        const currentSubdistrict = prev.subdistrict;
        const isValidSubdistrict = subdistricts.length > 0 && subdistricts.includes(currentSubdistrict);
        return {
          ...prev,
          [field]: value,
          subdistrict: isValidSubdistrict ? prev.subdistrict : ''
        };
      });
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleArrayChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value.split(',').map(v => v.trim()).filter(Boolean)
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          disabled={actionLoading.has(vendor.id)}
          className="h-8 w-8"
        >
          {actionLoading.has(vendor.id) ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
          ) : (
            <PencilIcon className="h-4 w-4" />
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] md:max-w-5xl max-h-[90vh] overflow-y-auto p-4 md:p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Modifier le Vendeur</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Informations de Base</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  readOnly={true}
                  disabled={true}
                  className="bg-gray-100 cursor-not-allowed"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  readOnly={true}
                  disabled={true}
                  className="bg-gray-100 cursor-not-allowed"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone Mobile *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="landline">Téléphone Fixe</Label>
                <Input
                  id="landline"
                  value={formData.landline}
                  onChange={(e) => handleInputChange('landline', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Ville *</Label>
                <div className="flex items-center gap-3">
                  <Select
                    value={formData.city}
                    onValueChange={(value) => handleInputChange('city', value)}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Sélectionner une ville" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Casablanca">Casablanca</SelectItem>
                      <SelectItem value="Rabat">Rabat</SelectItem>
                      <SelectItem value="Marrakech">Marrakech</SelectItem>
                      <SelectItem value="Fes">Fes</SelectItem>
                      <SelectItem value="Tangier">Tangier</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Label htmlFor="diamond" className="text-sm font-normal cursor-pointer">
                      Diamond
                    </Label>
                    <Switch
                      id="diamond"
                      checked={formData.isDiamond}
                      onCheckedChange={(checked) => {
                        setFormData({ ...formData, isDiamond: checked });
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Adresse</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Business Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Informations de l'Entreprise</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="businessCategory">Catégorie d'Activité</Label>
                <Input
                  id="businessCategory"
                  value={formData.businessCategory}
                  onChange={(e) => handleInputChange('businessCategory', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subCategory">Sous-Catégorie</Label>
                <Input
                  id="subCategory"
                  value={formData.subCategory}
                  onChange={(e) => handleInputChange('subCategory', e.target.value)}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          </div>

          {/* Registration Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Informations d'Enregistrement</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ice">ICE</Label>
                <Input
                  id="ice"
                  value={formData.ice}
                  onChange={(e) => handleInputChange('ice', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rc">RC</Label>
                <Input
                  id="rc"
                  value={formData.rc}
                  onChange={(e) => handleInputChange('rc', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vat">TVA</Label>
                <Input
                  id="vat"
                  value={formData.vat}
                  onChange={(e) => handleInputChange('vat', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="district">District</Label>
                <Select
                  value={formData.district}
                  onValueChange={(value) => handleInputChange('district', value)}
                  disabled={!formData.city || (cityDistricts[formData.city] || []).length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      !formData.city 
                        ? "Sélectionner d'abord une ville" 
                        : (cityDistricts[formData.city] || []).length === 0
                        ? "Aucun district disponible"
                        : "Sélectionner un district"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {(cityDistricts[formData.city] || []).map((district) => (
                      <SelectItem key={district} value={district}>
                        {district}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subdistrict">Sous-District</Label>
                <Select
                  value={formData.subdistrict}
                  onValueChange={(value) => handleInputChange('subdistrict', value)}
                  disabled={!formData.district || (districtSubdistricts[formData.district] || []).length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      !formData.district 
                        ? "Sélectionner d'abord un district" 
                        : (districtSubdistricts[formData.district] || []).length === 0
                        ? "Aucun sous-district disponible"
                        : "Sélectionner un sous-district"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {(districtSubdistricts[formData.district] || []).map((subdistrict) => (
                      <SelectItem key={subdistrict} value={subdistrict}>
                        {subdistrict}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Social Media */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Réseaux Sociaux</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="facebook">Facebook</Label>
                <Input
                  id="facebook"
                  type="url"
                  value={formData.facebook}
                  onChange={(e) => handleInputChange('facebook', e.target.value)}
                  placeholder="https://www.facebook.com/..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tiktok">TikTok</Label>
                <Input
                  id="tiktok"
                  type="url"
                  value={formData.tiktok}
                  onChange={(e) => handleInputChange('tiktok', e.target.value)}
                  placeholder="https://www.tiktok.com/..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instagram">Instagram</Label>
                <Input
                  id="instagram"
                  type="url"
                  value={formData.instagram}
                  onChange={(e) => handleInputChange('instagram', e.target.value)}
                  placeholder="https://www.instagram.com/..."
                />
              </div>
            </div>
          </div>

          {/* Media Files */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Fichiers Médias</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Logo URL Preview Card */}
              <div className="space-y-2">
                <Label>Logo URL</Label>
                {formData.logoUrl ? (
                  <Card className="p-3 border-2 border-gray-200 hover:border-gray-300 transition-colors">
                    <div className="space-y-2">
                      <div className="relative w-full h-32 bg-gray-100 rounded-md overflow-hidden flex items-center justify-center">
                        <img
                          src={`https://dev.dabablane.com/storage/uploads/vendor_images/${formData.logoUrl}`}
                          alt="Logo"
                          className="max-w-full max-h-full object-contain"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = '<div class="text-gray-400 text-sm">Image non disponible</div>';
                            }
                          }}
                        />
                      </div>
                      <p className="text-xs text-gray-600 truncate" title={formData.logoUrl}>
                        {formData.logoUrl}
                      </p>
                    </div>
                  </Card>
                ) : (
                  <Card className="p-3 border-2 border-dashed border-gray-300">
                    <div className="w-full h-32 bg-gray-50 rounded-md flex items-center justify-center">
                      <p className="text-gray-400 text-sm">Aucun logo</p>
                    </div>
                  </Card>
                )}
              </div>

              {/* RC Certificate URL Preview Card */}
              <div className="space-y-2">
                <Label>Certificat RC URL</Label>
                {formData.rcCertificateUrl ? (
                  <Card className="p-3 border-2 border-gray-200 hover:border-gray-300 transition-colors">
                    <div className="space-y-2">
                      <div className="relative w-full h-32 bg-gray-100 rounded-md overflow-hidden flex items-center justify-center">
                        <img
                          src={`https://dev.dabablane.com/storage/uploads/vendor_images/${formData.rcCertificateUrl}`}
                          alt="RC Certificate"
                          className="max-w-full max-h-full object-contain"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = '<div class="text-gray-400 text-sm">Image non disponible</div>';
                            }
                          }}
                        />
                      </div>
                      <p className="text-xs text-gray-600 truncate" title={formData.rcCertificateUrl}>
                        {formData.rcCertificateUrl}
                      </p>
                    </div>
                  </Card>
                ) : (
                  <Card className="p-3 border-2 border-dashed border-gray-300">
                    <div className="w-full h-32 bg-gray-50 rounded-md flex items-center justify-center">
                      <p className="text-gray-400 text-sm">Aucun certificat</p>
                    </div>
                  </Card>
                )}
              </div>

              {/* RIB URL Preview Card */}
              <div className="space-y-2">
                <Label>RIB URL</Label>
                {formData.ribUrl ? (
                  <Card className="p-3 border-2 border-gray-200 hover:border-gray-300 transition-colors">
                    <div className="space-y-2">
                      <div className="relative w-full h-32 bg-gray-100 rounded-md overflow-hidden flex items-center justify-center">
                        {formData.ribUrl.toLowerCase().endsWith('.pdf') ? (
                          <div className="text-center p-4">
                            <div className="text-4xl mb-2">📄</div>
                            <p className="text-xs text-gray-600">Fichier PDF</p>
                            <a
                              href={`https://dev.dabablane.com/storage/uploads/vendor_images/${formData.ribUrl}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                            >
                              Voir le PDF
                            </a>
                          </div>
                        ) : (
                          <img
                            src={`https://dev.dabablane.com/storage/uploads/vendor_images/${formData.ribUrl}`}
                            alt="RIB"
                            className="max-w-full max-h-full object-contain"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                parent.innerHTML = '<div class="text-gray-400 text-sm">Image non disponible</div>';
                              }
                            }}
                          />
                        )}
                      </div>
                      <p className="text-xs text-gray-600 truncate" title={formData.ribUrl}>
                        {formData.ribUrl}
                      </p>
                    </div>
                  </Card>
                ) : (
                  <Card className="p-3 border-2 border-dashed border-gray-300">
                    <div className="w-full h-32 bg-gray-50 rounded-md flex items-center justify-center">
                      <p className="text-gray-400 text-sm">Aucun RIB</p>
                    </div>
                  </Card>
                )}
              </div>
              <div className="space-y-2 md:col-span-3">
                <Label>URLs des Médias de Couverture</Label>
                
                {/* Cover Media Preview Cards */}
                {formData.cover_media_urls.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {formData.cover_media_urls.map((mediaUrl, index) => {
                      const isVideo = mediaUrl.toLowerCase().match(/\.(mp4|webm|ogg|mov|avi)$/);
                      const isPdf = mediaUrl.toLowerCase().endsWith('.pdf');
                      const isImage = !isVideo && !isPdf;
                      
                      return (
                        <Card key={index} className="p-3 border-2 border-gray-200 hover:border-gray-300 transition-colors">
                          <div className="space-y-2">
                            <div className="relative w-full h-32 bg-gray-100 rounded-md overflow-hidden flex items-center justify-center">
                              {isVideo ? (
                                <video
                                  src={`https://dev.dabablane.com/storage/uploads/vendor_images/${mediaUrl}`}
                                  className="max-w-full max-h-full object-contain"
                                  controls
                                  preload="metadata"
                                  onError={(e) => {
                                    const target = e.target as HTMLVideoElement;
                                    target.style.display = 'none';
                                    const parent = target.parentElement;
                                    if (parent) {
                                      parent.innerHTML = '<div class="text-gray-400 text-sm">Vidéo non disponible</div>';
                                    }
                                  }}
                                />
                              ) : isPdf ? (
                                <div className="text-center p-4">
                                  <div className="text-4xl mb-2">📄</div>
                                  <p className="text-xs text-gray-600">Fichier PDF</p>
                                  <a
                                    href={`https://dev.dabablane.com/storage/uploads/vendor_images/${mediaUrl}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                                  >
                                    Voir le PDF
                                  </a>
                                </div>
                              ) : (
                                <img
                                  src={`https://dev.dabablane.com/storage/uploads/vendor_images/${mediaUrl}`}
                                  alt={`Cover media ${index + 1}`}
                                  className="max-w-full max-h-full object-contain"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    const parent = target.parentElement;
                                    if (parent) {
                                      parent.innerHTML = '<div class="text-gray-400 text-sm">Image non disponible</div>';
                                    }
                                  }}
                                />
                              )}
                            </div>
                            <p className="text-xs text-gray-600 truncate" title={mediaUrl}>
                              {mediaUrl}
                            </p>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <Card className="p-3 border-2 border-dashed border-gray-300">
                    <div className="w-full h-32 bg-gray-50 rounded-md flex items-center justify-center">
                      <p className="text-gray-400 text-sm">Aucun média de couverture</p>
                    </div>
                  </Card>
                )}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-4 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Enregistrement...
                </>
              ) : (
                'Enregistrer'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
});
EditVendorDialog.displayName = 'EditVendorDialog';

// Memoized Vendor Row Component for better performance
const VendorRow = React.memo(({
  vendor,
  onStatusChange,
  actionLoading,
  onImageClick,
  onEdit
}: {
  vendor: Vendor;
  onStatusChange: (vendor: Vendor, status: VendorStatus, comment?: string) => Promise<void>;
  actionLoading: Set<number>;
  onImageClick: (images: string[], index: number) => void;
  onEdit: (vendorData: any) => Promise<void>;
}) => {
  const isActionLoading = actionLoading.has(vendor.id);

  // Helper function to get all vendor images
  const getVendorImages = () => {
    const images: string[] = [];
    const baseUrl = 'https://dev.dabablane.com/storage/uploads/vendor_images/';

    if (vendor.logoUrl) images.push(`${baseUrl}${vendor.logoUrl}`);
    if (vendor.coverPhotoUrl) images.push(`${baseUrl}${vendor.coverPhotoUrl}`);
    if (vendor.rcCertificateUrl) images.push(`${baseUrl}${vendor.rcCertificateUrl}`);
    if (vendor.cover_media && vendor.cover_media.length > 0) {
      vendor.cover_media.forEach((media: any) => {
        if (typeof media === 'string') {
          // Handle string URLs
          images.push(`${baseUrl}${media}`);
        } else if (media && typeof media === 'object') {
          // Handle object with media_url or url property
          const mediaUrl = media.media_url || media.url;
          if (mediaUrl && media.media_type === 'image') {
            images.push(`${baseUrl}${mediaUrl}`);
          }
        }
      });
    }

    return images;
  };

  return (
    <TableRow key={vendor.id} className="hover:bg-gray-50">
      <TableCell className="font-medium w-[180px] min-w-[140px]">
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">{vendor.name}</span>
        </div>
      </TableCell>
      <TableCell className="w-[180px] min-w-[140px]">{vendor.email}</TableCell>
      <TableCell className="w-[120px] min-w-[100px]">{vendor.phone}</TableCell>
      <TableCell className="w-[120px] min-w-[100px]">{vendor.city}</TableCell>
      <TableCell className="w-[140px] min-w-[120px]">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <StatusChangeDialog
              vendor={vendor}
              onStatusChange={onStatusChange}
              actionLoading={actionLoading}
            />
          </div>
          <Badge
            className={cn(
              "text-white whitespace-nowrap text-xs",
              vendor.status === "active" ? "bg-green-500" :
                vendor.status === "pending" ? "bg-blue-500" :
                  vendor.status === "inActive" ? "bg-gray-500" :
                    vendor.status === "suspended" ? "bg-orange-500" :
                      vendor.status === "waiting" ? "bg-yellow-500" : "bg-gray-500"
            )}
          >
            {getVendorStatusLabel(vendor.status)}
          </Badge>
        </div>
      </TableCell>
      <TableCell className="text-right w-[120px] min-w-[100px]">
        <div className="flex items-center justify-end">
          <div className="flex items-center gap-2">
            <EditVendorDialog
              vendor={vendor}
              onSave={onEdit}
              actionLoading={actionLoading}
            />
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={isActionLoading}
                  className="h-8 w-8"
                >
                  {isActionLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                  ) : (
                    <EyeIcon className="h-4 w-4" />
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] md:max-w-4xl max-h-[90vh] overflow-y-auto p-4 md:p-6">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-lg font-semibold text-gray-600">
                        {vendor.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">{vendor.name}</h2>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          className={cn(
                            "text-white font-medium shadow-sm",
                            vendor.status === "active" ? "bg-green-500" :
                              vendor.status === "pending" ? "bg-blue-500" :
                                vendor.status === "inActive" ? "bg-gray-500" :
                                  vendor.status === "suspended" ? "bg-orange-500" :
                                    vendor.status === "waiting" ? "bg-yellow-500" : "bg-gray-500"
                          )}
                        >
                          {getVendorStatusLabel(vendor.status)}
                        </Badge>
                      </div>
                    </div>
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                  {/* Vendor Images */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Images du Vendeur</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {vendor.logoUrl && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-700">Logo</p>
                          <div
                            className="relative group cursor-pointer"
                            onClick={() => {
                              const images = getVendorImages();
                              const logoIndex = 0; // Logo is always first
                              onImageClick(images, logoIndex);
                            }}
                          >
                            <img
                              src={`https://dev.dabablane.com/storage/uploads/vendor_images/${vendor.logoUrl}`}
                              alt="Logo du vendeur"
                              className="w-full h-32 object-contain rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                              onLoad={() => console.log('Logo loaded successfully:', `https://dev.dabablane.com/storage/uploads/vendor_images/${vendor.logoUrl}`)}
                              onError={(e) => {
                                console.error('Logo failed to load:', `https://dev.dabablane.com/storage/uploads/vendor_images/${vendor.logoUrl}`);
                                const target = e.target as HTMLImageElement;
                                target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMiA4VjEyTDE1IDE1IiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjMiIHN0cm9rZT0iIzlDQTNBRiIgc3Ryb2tlLXdpZHRoPSIyIi8+Cjwvc3ZnPgo=';
                              }}
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                              <Icon icon="lucide:zoom-in" className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </div>
                        </div>
                      )}

                      {vendor.coverPhotoUrl && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-700">Photo de Couverture</p>
                          <div
                            className="relative group cursor-pointer"
                            onClick={() => {
                              const images = getVendorImages();
                              const coverIndex = 1; // Cover photo is second
                              onImageClick(images, coverIndex);
                            }}
                          >
                            <img
                              src={`https://dev.dabablane.com/storage/uploads/vendor_images/${vendor.coverPhotoUrl}`}
                              alt="Photo de couverture du vendeur"
                              className="w-full h-32 object-contain rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMiA4VjEyTDE1IDE1IiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjMiIHN0cm9rZT0iIzlDQTNBRiIgc3Ryb2tlLXdpZHRoPSIyIi8+Cjwvc3ZnPgo=';
                              }}
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                              <Icon icon="lucide:zoom-in" className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </div>
                        </div>
                      )}

                      {vendor.rcCertificateUrl && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-700">Certificat RC</p>
                          <div
                            className="relative group cursor-pointer"
                            onClick={() => {
                              const images = getVendorImages();
                              const rcIndex = 2; // RC certificate is third
                              onImageClick(images, rcIndex);
                            }}
                          >
                            <img
                              src={`https://dev.dabablane.com/storage/uploads/vendor_images/${vendor.rcCertificateUrl}`}
                              alt="Certificat RC du vendeur"
                              className="w-full h-32 object-contain rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMiA4VjEyTDE1IDE1IiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjMiIHN0cm9rZT0iIzlDQTNBRiIgc3Ryb2tlLXdpZHRoPSIyIi8+Cjwvc3ZnPgo=';
                              }}
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                              <Icon icon="lucide:zoom-in" className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Cover Media */}
                  {vendor.cover_media && vendor.cover_media.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900">Médias de Couverture</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {vendor.cover_media.map((media: any, index: number) => {
                          // Handle different media structures
                          const mediaUrl = typeof media === 'string' ? media : (media.media_url || media.url);
                          const mediaType = typeof media === 'string' ? 'image' : (media.media_type || 'image');
                          const mediaId = typeof media === 'string' ? index : (media.id || index);
                          const createdAt = typeof media === 'string' ? null : media.created_at;

                          return (
                            <div key={mediaId} className="space-y-2">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-gray-700">
                                  {mediaType === 'image' ? 'Image' : 'Vidéo'} {index + 1}
                                </p>
                                <div className={`px-2 py-1 rounded-full text-xs font-medium ${mediaType === 'image'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-purple-100 text-purple-700'
                                  }`}>
                                  {mediaType === 'image' ? 'Image' : 'Vidéo'}
                                </div>
                              </div>

                              {mediaType === 'image' ? (
                                <div
                                  className="relative group cursor-pointer"
                                  onClick={() => {
                                    const images = getVendorImages();
                                    // Find the index of this image in the images array
                                    const imageIndex = images.findIndex(img => img.includes(mediaUrl));
                                    if (imageIndex !== -1) {
                                      onImageClick(images, imageIndex);
                                    }
                                  }}
                                >
                                  <img
                                    src={`https://dev.dabablane.com/storage/uploads/vendor_images/${mediaUrl}`}
                                    alt={`Média de couverture ${index + 1}`}
                                    className="w-full h-32 object-cover rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMiA4VjEyTDE1IDE1IiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjMiIHN0cm9rZT0iIzlDQTNBRiIgc3Ryb2tlLXdpZHRoPSIyIi8+Cjwvc3ZnPgo=';
                                    }}
                                  />
                                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                                    <Icon icon="lucide:zoom-in" className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </div>
                                </div>
                              ) : (
                                <div className="relative group">
                                  <video
                                    src={`https://dev.dabablane.com/storage/uploads/vendor_images/${mediaUrl}`}
                                    className="w-full h-32 object-cover rounded-lg border border-gray-200"
                                    controls
                                    preload="metadata"
                                    onError={(e) => {
                                      const target = e.target as HTMLVideoElement;
                                      target.style.display = 'none';
                                      const fallback = document.createElement('div');
                                      fallback.className = 'w-full h-32 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center';
                                      fallback.innerHTML = '<div class="text-gray-400 text-sm">Vidéo non disponible</div>';
                                      target.parentNode?.insertBefore(fallback, target);
                                    }}
                                  />
                                  <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                                    <Icon icon="lucide:play" className="h-3 w-3 inline mr-1" />
                                    Vidéo
                                  </div>
                                </div>
                              )}

                              {createdAt && (
                                <div className="text-xs text-gray-500">
                                  Ajouté le {new Date(createdAt).toLocaleDateString('fr-FR')}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Company Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Informations de l'Entreprise</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {vendor.company_name && (
                        <div className="flex items-center gap-3">
                          <Icon icon="lucide:building" className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500">Nom de l'Entreprise</p>
                            <p className="font-medium">{vendor.company_name}</p>
                          </div>
                        </div>
                      )}

                      {vendor.businessCategory && (
                        <div className="flex items-center gap-3">
                          <Icon icon="lucide:tag" className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500">Catégorie d'Activité</p>
                            <p className="font-medium">{vendor.businessCategory}</p>
                          </div>
                        </div>
                      )}

                      {vendor.subCategory && (
                        <div className="flex items-center gap-3">
                          <Icon icon="lucide:folder" className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500">Sous-Catégorie</p>
                            <p className="font-medium">{vendor.subCategory}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Contact Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Informations de Contact</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        <Icon icon="lucide:mail" className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Email</p>
                          <p className="font-medium">{vendor.email}</p>
                          {vendor.email_verified_at && (
                            <div className="flex items-center gap-1 mt-1">
                              <Icon icon="lucide:check-circle" className="h-3 w-3 text-green-500" />
                              <span className="text-xs text-green-600">Vérifié</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Icon icon="lucide:phone" className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Téléphone Mobile</p>
                          <p className="font-medium">{vendor.phone}</p>
                        </div>
                      </div>

                      {vendor.landline && (
                        <div className="flex items-center gap-3">
                          <Icon icon="lucide:phone-call" className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500">Téléphone Fixe</p>
                            <p className="font-medium">{vendor.landline}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Business Registration Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Informations d'Enregistrement</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {vendor.ice && (
                        <div className="flex items-center gap-3">
                          <Icon icon="lucide:file-text" className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500">ICE</p>
                            <p className="font-medium">{vendor.ice}</p>
                          </div>
                        </div>
                      )}

                      {vendor.rc && (
                        <div className="flex items-center gap-3">
                          <Icon icon="lucide:file-check" className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500">RC</p>
                            <p className="font-medium">{vendor.rc}</p>
                          </div>
                        </div>
                      )}
                      {vendor.vat && (
                        <div className="flex items-center gap-3">
                          <Icon icon="lucide:receipt" className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500">TVA</p>
                            <p className="font-medium">{vendor.vat}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Address Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Adresse</h3>
                    <div className="flex items-start gap-3">
                      <Icon icon="lucide:map-pin" className="h-5 w-5 text-gray-400 mt-1" />
                      <div>
                        <p className="font-medium">{vendor.address}</p>
                        <p className="text-gray-600">{vendor.city}</p>
                      </div>
                    </div>
                  </div>
                  {/* Description */}
                  {vendor.description && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900">Description</h3>
                      <div className="flex items-start gap-3">
                        <Icon icon="lucide:file-text" className="h-5 w-5 text-gray-400 mt-1" />
                        <p className="text-gray-700 leading-relaxed">{vendor.description}</p>
                      </div>
                    </div>
                  )}
                  {/* System Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Informations Système</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        <Icon icon="lucide:calendar" className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Créé le</p>
                          <p className="font-medium">
                            {format(new Date(vendor.created_at), 'dd/MM/yyyy HH:mm')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Icon icon="lucide:calendar" className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Modifié le</p>
                          <p className="font-medium">
                            {format(new Date(vendor.updated_at), 'dd/MM/yyyy HH:mm')}
                          </p>
                        </div>
                      </div>

                      {vendor.firebase_uid && (
                        <div className="flex items-center gap-3">
                          <Icon icon="lucide:key" className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500">Firebase UID</p>
                            <p className="font-medium text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                              {vendor.firebase_uid}
                            </p>
                          </div>
                        </div>
                      )}

                      {vendor.provider && (
                        <div className="flex items-center gap-3">
                          <Icon icon="lucide:user" className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500">Fournisseur</p>
                            <p className="font-medium">{vendor.provider}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="lg:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVerticalIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[160px]">
                <DropdownMenuItem disabled>
                  <span className="text-gray-400">Aucune action disponible</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
});
// Add these animation variants at the top of the file, after the imports
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
const Vendors: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    vendors,
    loading,
    error,
    pagination,
    actionLoading,
    fetchVendors,
    updateVendorStatus,
    updateVendor,
    setPagination,
    setError,
  } = useVendors();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [targetVendorId, setTargetVendorId] = useState<number | null>(null); // Track vendor ID we're looking for
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isSearching, setIsSearching] = useState(false);
  const [isPaginationLoading, setIsPaginationLoading] = useState(false);
  // Track initial load and retry attempts
  const [initialLoadAttempted, setInitialLoadAttempted] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true); // Track if we're still in initial load phase
  const retryCountRef = React.useRef(0);
  const maxRetries = 3;
  // Lightbox state
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxCurrentIndex, setLightboxCurrentIndex] = useState(0);
  // Client-side filtered vendors with exact match prioritization
  const filteredVendors = useMemo(() => {
    if (!vendors) return [];
    let filtered = vendors;
    // Apply search filter (name, company_name, and email)
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase().trim();
      filtered = vendors.filter(vendor => {
        // If we're looking for a specific vendor ID, always include it
        if (targetVendorId && vendor.id === targetVendorId) {
          return true;
        }
        
        const vendorName = vendor.name?.toLowerCase().trim() || '';
        const vendorCompanyName = vendor.company_name?.toLowerCase().trim() || '';
        const vendorEmail = vendor.email?.toLowerCase().trim() || '';
        
        // Check for exact matches first (case-insensitive)
        const exactNameMatch = vendorName === lowerSearchTerm;
        const exactCompanyMatch = vendorCompanyName === lowerSearchTerm;
        const exactEmailMatch = vendorEmail === lowerSearchTerm;
        
        // Check for partial matches
        const nameMatch = vendorName.includes(lowerSearchTerm);
        const companyNameMatch = vendorCompanyName.includes(lowerSearchTerm);
        const emailMatch = vendorEmail.includes(lowerSearchTerm);
        
        return exactNameMatch || exactCompanyMatch || exactEmailMatch || nameMatch || companyNameMatch || emailMatch;
      });
      
      // Log filtered results for debugging
      if (filtered.length > 0) {
        console.log(`🔍 Filtered ${filtered.length} vendors for search term: "${searchTerm}"`, filtered.map(v => ({ id: v.id, name: v.name, company: v.company_name })));
      } else {
        console.log(`⚠️ No vendors found for search term: "${searchTerm}" (total vendors: ${vendors.length})`);
        // If we have a target vendor ID, check if it exists in the vendors list
        if (targetVendorId) {
          const targetVendor = vendors.find(v => v.id === targetVendorId);
          if (targetVendor) {
            console.log(`✅ Found target vendor ID ${targetVendorId} in vendors list, adding to results`);
            filtered = [targetVendor];
          }
        }
      }
      
      // Sort: exact matches first, then target vendor ID, then partial matches
      filtered.sort((a, b) => {
        // Prioritize target vendor ID
        if (targetVendorId) {
          if (a.id === targetVendorId && b.id !== targetVendorId) return -1;
          if (a.id !== targetVendorId && b.id === targetVendorId) return 1;
        }
        
        const aName = a.name?.toLowerCase().trim() || '';
        const aCompany = a.company_name?.toLowerCase().trim() || '';
        const bName = b.name?.toLowerCase().trim() || '';
        const bCompany = b.company_name?.toLowerCase().trim() || '';
        
        const aExact = aName === lowerSearchTerm || aCompany === lowerSearchTerm;
        const bExact = bName === lowerSearchTerm || bCompany === lowerSearchTerm;
        
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        return 0;
      });
    }
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(vendor => vendor.status === statusFilter);
    }
    return filtered;
  }, [vendors, searchTerm, statusFilter, targetVendorId]);
  // Client-side sorted vendors
  const sortedVendors = useMemo(() => {
    if (!filteredVendors.length) return [];

    return [...filteredVendors].sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'email':
          aValue = a.email.toLowerCase();
          bValue = b.email.toLowerCase();
          break;
        case 'city':
          aValue = a.city?.toLowerCase() || '';
          bValue = b.city?.toLowerCase() || '';
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredVendors, sortBy, sortOrder]);
  // Client-side pagination
  const paginatedVendors = useMemo(() => {
    const startIndex = (pagination.currentPage - 1) * pagination.perPage;
    const endIndex = startIndex + pagination.perPage;
    return sortedVendors.slice(startIndex, endIndex);
  }, [sortedVendors, pagination.currentPage, pagination.perPage]);
  // Update total count for client-side filtering
  const clientSidePagination = useMemo(() => {
    const total = filteredVendors.length || 0;
    const perPage = pagination.perPage || 10;
    const lastPage = total > 0 ? Math.max(1, Math.ceil(total / perPage)) : 1;
    return {
      ...pagination,
      total,
      lastPage,
    };
  }, [pagination, filteredVendors.length]);
  // Debounced search with proper implementation
  const debouncedSearch = useCallback(
    debounce(async () => {
      setIsSearching(true);
      try {
        // The filtering is handled by useMemo above
        if (pagination.currentPage !== 1) {
          // You might want to handle page reset here if needed
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300),
    [pagination.currentPage]
  );
  // Handle search input with immediate UI feedback
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setIsSearching(true);
    // Trigger debounced search for loading state
    debouncedSearch();
  };
  // Handle status filter change
  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    // Reset to first page when filter changes
    if (pagination.currentPage !== 1) {
      // You might want to handle page reset here if needed
    }
  };
  // Initial load - fetch vendors automatically on page refresh
  // Automatically retry on error to prevent showing error on page refresh
  useEffect(() => {
    if (!initialLoadAttempted) {
      setInitialLoadAttempted(true);
      setIsInitialLoading(true);
      retryCountRef.current = 0;
      setError(null); // Clear any previous errors
      // Use default limit (10) instead of 1000 to avoid validation errors
      // This matches what the "Try again" button does
      fetchVendors({}, 1); // Fetch vendors with default limit
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Auto-retry on error during initial load - always retry regardless of error type
  useEffect(() => {
    // Auto-retry if we're on initial load, have an error, not currently loading, and haven't exceeded max retries
    if (error && initialLoadAttempted && isInitialLoading && !loading && retryCountRef.current < maxRetries && vendors.length === 0) {
      retryCountRef.current += 1;
      const delay = Math.min(1000 * Math.pow(2, retryCountRef.current - 1), 5000);
      
      console.log(`🔄 Auto-retrying vendor fetch (attempt ${retryCountRef.current}/${maxRetries}) after ${delay}ms...`);
      
      const retryTimer = setTimeout(() => {
        setError(null); // Clear error before retry
        // Use same parameters as manual "Try again" button (default limit)
        fetchVendors({}, 1);
      }, delay);
      
      return () => clearTimeout(retryTimer);
    } else if (error && initialLoadAttempted && isInitialLoading && !loading && retryCountRef.current >= maxRetries) {
      // All retries exhausted, allow error to show
      console.log('❌ All retry attempts exhausted, showing error');
      setIsInitialLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error, initialLoadAttempted, isInitialLoading, loading, vendors.length, fetchVendors]);

  // Mark initial loading as complete when we successfully load vendors
  useEffect(() => {
    if (vendors.length > 0 && isInitialLoading) {
      console.log('✅ Vendors loaded successfully, completing initial load');
      setIsInitialLoading(false);
      retryCountRef.current = 0; // Reset retry count on success
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendors.length, isInitialLoading]);

  // Also mark as complete when loading finishes without error (even if no vendors)
  useEffect(() => {
    if (!loading && initialLoadAttempted && isInitialLoading && !error) {
      console.log('✅ Loading completed without error, completing initial load');
      setIsInitialLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, initialLoadAttempted, isInitialLoading, error]);

  // Handle URL parameters for navigation from notifications
  useEffect(() => {
    // Wait for vendors to load before processing URL parameters
    if (loading) {
      return;
    }
    
    const searchParam = searchParams.get('search');
    const vendorIdParam = searchParams.get('vendorId');
    const vendorNameParam = searchParams.get('vendorName');
    
    if (searchParam) {
      // Decode the search parameter
      const decodedSearch = decodeURIComponent(searchParam);
      // Set search term from URL parameter
      setSearchTerm(decodedSearch);
      console.log(`🔍 Setting search term from URL: "${decodedSearch}"`);
      // Clear the URL parameter after reading it
      searchParams.delete('search');
      setSearchParams(searchParams, { replace: true });
    } else if (vendorIdParam) {
      // Find vendor by ID and set search term to vendor name or company_name
      const vendorId = parseInt(vendorIdParam, 10);
      const fallbackVendorName = vendorNameParam ? decodeURIComponent(vendorNameParam) : null;
      
      // Set target vendor ID so we can include it in filtered results even if name doesn't match
      if (!isNaN(vendorId)) {
        setTargetVendorId(vendorId);
        // Clear target vendor ID after 5 seconds (enough time for vendor to be found and displayed)
        setTimeout(() => setTargetVendorId(null), 5000);
      }
      
      if (!isNaN(vendorId) && vendors && vendors.length > 0) {
        const vendor = vendors.find(v => v.id === vendorId);
        if (vendor) {
          // Prefer company_name, then name
          const searchName = vendor.company_name?.trim() || vendor.name?.trim() || '';
          if (searchName) {
            setSearchTerm(searchName);
            console.log(`✅ Found vendor ${vendorId}, setting search to: "${searchName}"`);
          } else {
            console.warn(`⚠️ Vendor ${vendorId} found but has no name or company_name`);
          }
        } else {
          // Vendor not in loaded list - try to load all vendors first (more reliable than name search)
          if (pagination.total > vendors.length && pagination.total < 5000) {
            // Try to fetch all vendors if total is reasonable - this is more reliable than name search
            console.log(`📥 Vendor ID ${vendorId} not in loaded list (${vendors.length}/${pagination.total} loaded), loading all vendors...`);
            fetchVendors({}, 1, pagination.total)
              .then(() => {
                // The useEffect will run again when vendors update and find the vendor by ID
                console.log(`✅ Loaded all vendors, will retry finding vendor ${vendorId}`);
              })
              .catch((error) => {
                console.error(`❌ Failed to load all vendors:`, error);
                // Fallback: use name search if loading all vendors fails
                if (fallbackVendorName) {
                  console.log(`🔍 Fallback: searching server-side for: "${fallbackVendorName}"`);
                  setSearchTerm(fallbackVendorName);
                  fetchVendors({ search: fallbackVendorName }, 1, 1000)
                    .catch((searchError) => {
                      console.error(`❌ Failed to search vendors:`, searchError);
                    });
                }
              });
          } else if (fallbackVendorName) {
            // Too many vendors or all loaded - use server-side search with fallback name
            console.log(`🔍 Vendor ID ${vendorId} not found, searching server-side for: "${fallbackVendorName}"`);
            setSearchTerm(fallbackVendorName);
            // Trigger server-side search
            fetchVendors({ search: fallbackVendorName }, 1, 1000)
              .then(() => {
                console.log(`✅ Searched vendors for "${fallbackVendorName}"`);
              })
              .catch((error) => {
                console.error(`❌ Failed to search vendors:`, error);
              });
          } else {
            console.warn(`⚠️ Vendor ID ${vendorId} not found and no fallback name available`);
          }
        }
      } else if (fallbackVendorName) {
        // No vendors loaded yet, but we have a name - search server-side
        console.log(`🔍 No vendors loaded, searching server-side for: "${fallbackVendorName}"`);
        setSearchTerm(fallbackVendorName);
        // Trigger server-side search
        fetchVendors({ search: fallbackVendorName }, 1, 1000)
          .then(() => {
            console.log(`✅ Searched vendors for "${fallbackVendorName}"`);
          })
          .catch((error) => {
            console.error(`❌ Failed to search vendors:`, error);
          });
      }
      
      // Clear the URL parameters after reading them (but only if we've processed them)
      // Don't clear if we're still waiting for a search to complete
      if (vendorIdParam || vendorNameParam) {
        searchParams.delete('vendorId');
        searchParams.delete('vendorName');
        setSearchParams(searchParams, { replace: true });
      }
    }
  }, [searchParams, setSearchParams, vendors, loading, pagination, fetchVendors]);
  // Handle sorting (client-side)
  const handleSort = useCallback(
    (column: string) => {
      if (!loading && !isPaginationLoading) {
        const newSortOrder =
          sortBy === column && sortOrder === "asc" ? "desc" : "asc";
        setSortBy(column);
        setSortOrder(newSortOrder);
      }
    },
    [sortBy, sortOrder, loading, isPaginationLoading]
  );

  // Handle pagination (client-side)
  const handlePageChange = useCallback((page: number) => {
    if (page !== pagination.currentPage && page >= 1 && page <= clientSidePagination.lastPage && !isPaginationLoading && !loading) {
      setIsPaginationLoading(true);
      setPagination({ currentPage: page });
      // Smooth scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => {
        setIsPaginationLoading(false);
      }, 150);
    }
  }, [pagination.currentPage, clientSidePagination.lastPage, isPaginationLoading, loading, setPagination]);

  // Handle page size change
  const handlePageSizeChange = useCallback(async (newPageSize: number) => {
    if (newPageSize !== pagination.perPage && !loading && !isPaginationLoading) {
      setIsPaginationLoading(true);
      try {
        // For client-side, we just update the perPage value
        // You might need to modify your useVendors hook to handle this
        await fetchVendors({}, 1, newPageSize);
      } catch (error) {
        console.error('Page size change error:', error);
      } finally {
        setIsPaginationLoading(false);
      }
    }
  }, [fetchVendors, pagination.perPage, loading, isPaginationLoading]);

  // Memoized status change handler
  const handleStatusChangeMemo = useCallback(async (vendor: Vendor, newStatus: VendorStatus, comment?: string) => {
    await updateVendorStatus(vendor, newStatus, comment);
  }, [updateVendorStatus]);

  // Handle vendor edit
  const handleEditVendor = useCallback(async (vendorData: any) => {
    // The API expects all fields in the request body, so we pass the complete vendorData
    // Note: The API endpoint /updateVendor uses the authenticated user's token to identify the vendor
    // But we need to ensure we're sending all required fields
    await updateVendor(vendorData);
    // Refresh the vendor list after update
    await fetchVendors({}, pagination.currentPage, pagination.perPage);
  }, [updateVendor, fetchVendors, pagination.currentPage, pagination.perPage]);

  // Handle image click to open lightbox
  const handleImageClick = (images: string[], index: number) => {
    setLightboxImages(images);
    setLightboxCurrentIndex(index);
    setIsLightboxOpen(true);
  };

  // Handle lightbox close
  const handleLightboxClose = () => {
    setIsLightboxOpen(false);
    setLightboxImages([]);
    setLightboxCurrentIndex(0);
  };

  // Handle lightbox index change
  const handleLightboxIndexChange = (index: number) => {
    setLightboxCurrentIndex(index);
  };

  // Use client-side paginated vendors for display
  const displayVendors = paginatedVendors;

  return (
    <TooltipProvider>
      <div className="">
        <Card className="overflow-hidden">
          {/* Header Section */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={animationVariants.fadeIn}
            className="p-2 sm:p-4 md:p-6 bg-gradient-to-r from-[#00897B] to-[#00796B]"
          >
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-1 sm:gap-4">
              <div className="text-white w-full lg:w-auto">
                <h2 className="text-base sm:text-xl md:text-2xl font-bold">Gestion des Vendeurs</h2>
                <p className="text-gray-100 mt-0.5 sm:mt-1 text-xs sm:text-base">Gérez vos vendeurs et leurs statuts</p>
              </div>
            </div>
          </motion.div>

          {/* Filters Section */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={animationVariants.fadeIn}
            className="p-1 sm:p-4 md:p-6 border-b bg-gray-50/50"
          >
            <div className="space-y-2 sm:space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Input
                  placeholder="Rechercher par nom ou email..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="pl-6 pr-6 sm:pl-10 sm:pr-10 h-8 sm:h-11 text-xs sm:text-sm"
                  disabled={loading}
                />
                {isSearching || loading ? (
                  <div className="absolute left-1.5 sm:left-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-[#00897B]"></div>
                  </div>
                ) : (
                  <Icon icon="lucide:search" className="absolute left-1.5 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3 sm:h-4 sm:w-4" />
                )}
                {isSearching && (
                  <div className="absolute right-1.5 sm:right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-500 bg-white px-1 sm:px-2 py-0.5 sm:py-1 rounded">
                    Recherche...
                  </div>
                )}
              </div>

              {/* Filters Row */}
              <div className="flex flex-col sm:flex-row gap-1 sm:gap-3">
                <div className="flex-1">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-0.5">
                    Statut
                  </label>
                  <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                    <SelectTrigger className="w-full h-7 sm:h-10 text-xs sm:text-sm">
                      <SelectValue placeholder="Statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="inActive">inActive</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                      <SelectItem value="waiting">Waiting</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full sm:w-48">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-0.5">
                    Par page
                  </label>
                  <Select value={pagination.perPage.toString()} onValueChange={(value) => handlePageSizeChange(Number(value))}>
                    <SelectTrigger className="w-full h-7 sm:h-10 text-xs sm:text-sm">
                      <SelectValue placeholder="Par page" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Results Summary */}
              {!loading && displayVendors.length > 0 && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs sm:text-sm text-gray-600 bg-white p-1 sm:p-3 rounded-lg border gap-1 sm:gap-2">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Icon icon="lucide:users" className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>
                      {filteredVendors.length} vendeur{filteredVendors.length > 1 ? 's' : ''} trouvé{filteredVendors.length > 1 ? 's' : ''}
                    </span>
                    {searchTerm && (
                      <span className="text-gray-400 hidden sm:inline">pour "{searchTerm}"</span>
                    )}
                    {statusFilter !== 'all' && (
                      <Badge variant="secondary" className="ml-1 sm:ml-2 text-xs">
                        {getVendorStatusLabel(statusFilter as VendorStatus)}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2 text-xs text-gray-500">
                    <Icon icon="lucide:info" className="h-3 w-3" />
                    <span className="hidden sm:inline">Trié par {sortBy === 'name' ? 'nom' : sortBy === 'email' ? 'email' : sortBy === 'city' ? 'ville' : sortBy}</span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Mobile Card View for Small Screens */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={animationVariants.fadeIn}
            className="block lg:hidden"
          >
            {loading || (isInitialLoading && retryCountRef.current < maxRetries) ? (
              <div className="p-8 text-center">
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#00897B]"></div>
                  <span className="ml-2">Chargement...</span>
                </div>
              </div>
            ) : error ? (
              <div className="p-8 text-center">
                <div className="flex flex-col items-center gap-2">
                  <Icon icon="lucide:alert-circle" className="h-8 w-8 text-red-500" />
                  <p className="text-red-600 font-medium">Erreur de chargement</p>
                  <p className="text-gray-500 text-sm">{error}</p>
                  <Button
                    onClick={() => {
                      console.log('🔄 Manual retry triggered');
                      retryCountRef.current = 0; // Reset retry count on manual retry
                      setIsInitialLoading(false); // Allow errors to show on manual retry
                      setError(null); // Clear error before retry
                      const filters = {
                        ...(statusFilter !== 'all' && { status: statusFilter as VendorStatus }),
                        ...(searchTerm && { search: searchTerm }),
                      };
                      fetchVendors(filters, 1);
                    }}
                    variant="outline"
                    size="sm"
                    className="mt-2"
                  >
                    <Icon icon="lucide:refresh-cw" className="h-4 w-4 mr-2" />
                    Réessayer
                  </Button>
                </div>
              </div>
            ) : displayVendors.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                {searchTerm || statusFilter !== 'all' ? 'Aucun vendeur trouvé avec les critères sélectionnés' : 'Aucun vendeur trouvé'}
              </div>
            ) : (
              <div className="space-y-2 p-1 sm:p-4">
                {displayVendors.map((vendor) => (
                  <Card key={vendor.id} className="p-2 sm:p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="space-y-2 sm:space-y-4">
                      {/* Header with vendor info and status */}
                      <div className="flex items-start justify-between gap-1">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 sm:gap-3 mb-1">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-sm sm:text-lg text-gray-900 truncate">{vendor.name}</h3>
                              <p className="text-xs sm:text-sm text-gray-500 truncate">{vendor.city}</p>
                            </div>
                          </div>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1">
                              <Icon icon="lucide:mail" className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                              <p className="text-xs sm:text-sm text-gray-600 truncate">{vendor.email}</p>
                            </div>
                            <div className="flex items-center gap-1">
                              <Icon icon="lucide:phone" className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                              <p className="text-xs sm:text-sm text-gray-600">{vendor.phone}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                          <Badge
                            className={cn(
                              "text-white text-xs px-1 py-0.5 sm:px-2 sm:py-1",
                              vendor.status === "active" ? "bg-green-500" :
                                vendor.status === "pending" ? "bg-blue-500" :
                                  vendor.status === "inActive" ? "bg-gray-500" :
                                    vendor.status === "suspended" ? "bg-orange-500" :
                                      vendor.status === "waiting" ? "bg-yellow-500" : "bg-gray-500"
                            )}
                          >
                            {getVendorStatusLabel(vendor.status)}
                          </Badge>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1 sm:gap-2 pt-1 sm:pt-2 border-t border-gray-100">
                        <div className="flex-1">
                          <StatusChangeDialog
                            vendor={vendor}
                            onStatusChange={handleStatusChangeMemo}
                            actionLoading={actionLoading}
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <EditVendorDialog
                            vendor={vendor}
                            onSave={handleEditVendor}
                            actionLoading={actionLoading}
                          />
                          <Dialog>
                            <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={actionLoading.has(vendor.id)}
                              className="h-7 sm:h-9 px-1 sm:px-3 text-xs sm:text-sm"
                            >
                              {actionLoading.has(vendor.id) ? (
                                <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-gray-600"></div>
                              ) : (
                                <>
                                  <EyeIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-0.5 sm:mr-2" />
                                  <span className="hidden sm:inline">Détails</span>
                                  <span className="sm:hidden text-xs">Voir</span>
                                </>
                              )}
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-[95vw] md:max-w-4xl max-h-[90vh] overflow-y-auto p-4 md:p-6">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                                  <span className="text-lg font-semibold text-gray-600">
                                    {vendor.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <h2 className="text-xl font-bold">{vendor.name}</h2>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge
                                      className={cn(
                                        "text-white font-medium shadow-sm",
                                        vendor.status === "active" ? "bg-green-500" :
                                          vendor.status === "pending" ? "bg-blue-500" :
                                            vendor.status === "inActive" ? "bg-gray-500" :
                                              vendor.status === "suspended" ? "bg-orange-500" :
                                                vendor.status === "waiting" ? "bg-yellow-500" : "bg-gray-500"
                                      )}
                                    >
                                      {getVendorStatusLabel(vendor.status)}
                                    </Badge>
                                  </div>
                                </div>
                              </DialogTitle>
                            </DialogHeader>

                            <div className="space-y-6">
                              {/* Contact Information */}
                              <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-900">Informations de Contact</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="flex items-center gap-3">
                                    <Icon icon="lucide:mail" className="h-5 w-5 text-gray-400" />
                                    <div>
                                      <p className="text-sm text-gray-500">Email</p>
                                      <p className="font-medium">{vendor.email}</p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-3">
                                    <Icon icon="lucide:phone" className="h-5 w-5 text-gray-400" />
                                    <div>
                                      <p className="text-sm text-gray-500">Téléphone</p>
                                      <p className="font-medium">{vendor.phone}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Address Information */}
                              <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-900">Adresse</h3>
                                <div className="flex items-start gap-3">
                                  <Icon icon="lucide:map-pin" className="h-5 w-5 text-gray-400 mt-1" />
                                  <div>
                                    <p className="font-medium">{vendor.address}</p>
                                    <p className="text-gray-600">{vendor.city}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </motion.div>

          {/* Tablet View */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={animationVariants.fadeIn}
            className="hidden lg:block xl:hidden"
          >
            <div className="overflow-x-auto">
              <Table className="min-w-[600px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[160px] min-w-[120px] font-semibold">Vendeur</TableHead>
                    <TableHead className="w-[160px] min-w-[120px] font-semibold">Contact</TableHead>
                    <TableHead className="w-[120px] min-w-[100px] font-semibold">Statut</TableHead>
                    <TableHead className="w-[80px] min-w-[60px] text-right font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading || (isInitialLoading && retryCountRef.current < maxRetries) ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#00897B]"></div>
                          <span className="ml-2">Chargement...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : error ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <Icon icon="lucide:alert-circle" className="h-8 w-8 text-red-500" />
                          <p className="text-red-600 font-medium">Erreur de chargement</p>
                          <p className="text-gray-500 text-sm">{error}</p>
                          <Button
                            onClick={() => {
                              retryCountRef.current = 0; // Reset retry count on manual retry
                              const filters = {
                                ...(statusFilter !== 'all' && { status: statusFilter as VendorStatus }),
                                ...(searchTerm && { search: searchTerm }),
                              };
                              fetchVendors(filters, 1);
                            }}
                            variant="outline"
                            size="sm"
                            className="mt-2"
                          >
                            <Icon icon="lucide:refresh-cw" className="h-4 w-4 mr-2" />
                            Réessayer
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : displayVendors.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                        {searchTerm || statusFilter !== 'all' ? 'Aucun vendeur trouvé avec les critères sélectionnés' : 'Aucun vendeur trouvé'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    displayVendors.map((vendor) => (
                      <TableRow key={vendor.id} className="hover:bg-gray-50">
                        <TableCell className="w-[160px] min-w-[120px]">
                          <div className="flex flex-col">
                            <span className="font-semibold text-gray-900">{vendor.name}</span>
                            <span className="text-sm text-gray-500">{vendor.city}</span>
                          </div>
                        </TableCell>
                        <TableCell className="w-[160px] min-w-[120px]">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{vendor.email}</span>
                            <span className="text-sm text-gray-500">{vendor.phone}</span>
                          </div>
                        </TableCell>
                        <TableCell className="w-[120px] min-w-[100px]">
                          <div className="flex flex-col gap-2">
                            <StatusChangeDialog
                              vendor={vendor}
                              onStatusChange={handleStatusChangeMemo}
                              actionLoading={actionLoading}
                            />
                            <Badge
                              className={cn(
                                "text-white text-xs w-fit",
                                vendor.status === "active" ? "bg-green-500" :
                                  vendor.status === "pending" ? "bg-blue-500" :
                                    vendor.status === "inActive" ? "bg-gray-500" :
                                      vendor.status === "suspended" ? "bg-orange-500" :
                                        vendor.status === "waiting" ? "bg-yellow-500" : "bg-gray-500"
                              )}
                            >
                              {getVendorStatusLabel(vendor.status)}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-right w-[120px] min-w-[100px]">
                          <div className="flex items-center justify-end gap-2">
                            <EditVendorDialog
                              vendor={vendor}
                              onSave={handleEditVendor}
                              actionLoading={actionLoading}
                            />
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  disabled={actionLoading.has(vendor.id)}
                                  className="h-8 w-8"
                                >
                                  {actionLoading.has(vendor.id) ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                                  ) : (
                                    <EyeIcon className="h-4 w-4" />
                                  )}
                                </Button>
                              </DialogTrigger>
                            <DialogContent className="max-w-[95vw] md:max-w-4xl max-h-[90vh] overflow-y-auto p-4 md:p-6">
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-3">
                                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                                    <span className="text-lg font-semibold text-gray-600">
                                      {vendor.name.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                  <div>
                                    <h2 className="text-xl font-bold">{vendor.name}</h2>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Badge
                                        className={cn(
                                          "text-white font-medium shadow-sm",
                                          vendor.status === "active" ? "bg-green-500" :
                                            vendor.status === "pending" ? "bg-blue-500" :
                                              vendor.status === "inActive" ? "bg-gray-500" :
                                                vendor.status === "suspended" ? "bg-orange-500" :
                                                  vendor.status === "waiting" ? "bg-yellow-500" : "bg-gray-500"
                                        )}
                                      >
                                        {getVendorStatusLabel(vendor.status)}
                                      </Badge>
                                    </div>
                                  </div>
                                </DialogTitle>
                              </DialogHeader>
                              <div className="space-y-6">
                                <div className="space-y-4">
                                  <h3 className="text-lg font-semibold text-gray-900">Informations de Contact</h3>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-center gap-3">
                                      <Icon icon="lucide:mail" className="h-5 w-5 text-gray-400" />
                                      <div>
                                        <p className="text-sm text-gray-500">Email</p>
                                        <p className="font-medium">{vendor.email}</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <Icon icon="lucide:phone" className="h-5 w-5 text-gray-400" />
                                      <div>
                                        <p className="text-sm text-gray-500">Téléphone</p>
                                        <p className="font-medium">{vendor.phone}</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className="space-y-4">
                                  <h3 className="text-lg font-semibold text-gray-900">Adresse</h3>
                                  <div className="flex items-start gap-3">
                                    <Icon icon="lucide:map-pin" className="h-5 w-5 text-gray-400 mt-1" />
                                    <div>
                                      <p className="font-medium">{vendor.address}</p>
                                      <p className="text-gray-600">{vendor.city}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </motion.div>

          {/* Desktop Table View */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={animationVariants.fadeIn}
            className="hidden xl:block"
          >
            <div className="overflow-x-auto">
              <Table className="min-w-[900px]">
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className="cursor-pointer hover:bg-gray-50 w-[180px] min-w-[140px]"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center gap-2">
                        Nom
                        <Icon
                          icon={sortBy === 'name' ? (sortOrder === 'asc' ? 'lucide:chevron-up' : 'lucide:chevron-down') : 'lucide:chevrons-up-down'}
                          className="h-4 w-4"
                        />
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-gray-50 w-[180px] min-w-[140px]"
                      onClick={() => handleSort('email')}
                    >
                      <div className="flex items-center gap-2">
                        Email
                        <Icon
                          icon={sortBy === 'email' ? (sortOrder === 'asc' ? 'lucide:chevron-up' : 'lucide:chevron-down') : 'lucide:chevrons-up-down'}
                          className="h-4 w-4"
                        />
                      </div>
                    </TableHead>
                    <TableHead className="w-[120px] min-w-[100px]">Téléphone</TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-gray-50 w-[120px] min-w-[100px]"
                      onClick={() => handleSort('city')}
                    >
                      <div className="flex items-center gap-2">
                        Ville
                        <Icon
                          icon={sortBy === 'city' ? (sortOrder === 'asc' ? 'lucide:chevron-up' : 'lucide:chevron-down') : 'lucide:chevrons-up-down'}
                          className="h-4 w-4"
                        />
                      </div>
                    </TableHead>
                    <TableHead className="w-[140px] min-w-[120px]">Statut</TableHead>
                    <TableHead className="text-right w-[80px] min-w-[60px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading || (isInitialLoading && retryCountRef.current < maxRetries) ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#00897B]"></div>
                          <span className="ml-2">Chargement...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : error ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <Icon icon="lucide:alert-circle" className="h-8 w-8 text-red-500" />
                          <p className="text-red-600 font-medium">Erreur de chargement</p>
                          <p className="text-gray-500 text-sm">{error}</p>
                          <Button
                            onClick={() => {
                              retryCountRef.current = 0; // Reset retry count on manual retry
                              const filters = {
                                ...(statusFilter !== 'all' && { status: statusFilter as VendorStatus }),
                                ...(searchTerm && { search: searchTerm }),
                              };
                              fetchVendors(filters, 1);
                            }}
                            variant="outline"
                            size="sm"
                            className="mt-2"
                          >
                            <Icon icon="lucide:refresh-cw" className="h-4 w-4 mr-2" />
                            Réessayer
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : displayVendors.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        {searchTerm || statusFilter !== 'all' ? 'Aucun vendeur trouvé avec les critères sélectionnés' : 'Aucun vendeur trouvé'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    displayVendors.map((vendor) => (
                      <VendorRow
                        key={vendor.id}
                        vendor={vendor}
                        onStatusChange={handleStatusChangeMemo}
                        actionLoading={actionLoading}
                        onImageClick={handleImageClick}
                        onEdit={handleEditVendor}
                      />
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </motion.div>

          {/* Pagination */}
          {!loading && vendors.length > 0 && (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={animationVariants.fadeIn}
              className="p-4 border-t bg-white"
            >
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                {/* Pagination Info */}
                <div className="text-sm text-gray-600 flex items-center gap-2">
                  {isPaginationLoading && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                  )}
                  {clientSidePagination.total > 0 ? (
                    <>
                      Affichage de {((clientSidePagination.currentPage - 1) * clientSidePagination.perPage) + 1} à {Math.min(clientSidePagination.currentPage * clientSidePagination.perPage, clientSidePagination.total)} sur {clientSidePagination.total} vendeur{clientSidePagination.total > 1 ? 's' : ''}
                    </>
                  ) : (
                    <span>Aucun vendeur trouvé</span>
                  )}
                </div>

                {/* Pagination Controls */}
                {clientSidePagination.total > 0 && clientSidePagination.lastPage > 1 && (
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => !loading && !isPaginationLoading && handlePageChange(clientSidePagination.currentPage - 1)}
                          className={clientSidePagination.currentPage <= 1 || loading || isPaginationLoading ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>

                      {Array.from({ length: clientSidePagination.lastPage }, (_, i) => i + 1)
                        .filter((page) => {
                          if (clientSidePagination.lastPage <= 7) return true;
                          if (page === 1 || page === clientSidePagination.lastPage) return true;
                          if (Math.abs(page - clientSidePagination.currentPage) <= 2) return true;
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
                                isActive={page === clientSidePagination.currentPage}
                                onClick={() => !loading && !isPaginationLoading && handlePageChange(page)}
                                className={loading || isPaginationLoading ? "pointer-events-none opacity-50" : "cursor-pointer"}
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        })}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() => !loading && !isPaginationLoading && handlePageChange(clientSidePagination.currentPage + 1)}
                          className={clientSidePagination.currentPage >= clientSidePagination.lastPage || loading || isPaginationLoading ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </div>
            </motion.div>
          )}
        </Card>
      </div>

      {/* Image Lightbox */}
      <ImageLightbox
        isOpen={isLightboxOpen}
        onClose={handleLightboxClose}
        images={lightboxImages}
        currentIndex={lightboxCurrentIndex}
        onIndexChange={handleLightboxIndexChange}
        alt="Vendor Image"
      />

    </TooltipProvider>
  );
};

export default Vendors;




