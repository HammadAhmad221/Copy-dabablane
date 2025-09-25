import React from 'react';
import { Calendar, Mail, Phone, MapPin, Globe, FileText } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/admin/components/ui/dialog';
import { Badge } from '@/admin/components/ui/badge';
import { Vendor } from '@/admin/lib/api/types/vendor';
import { getVendorStatusLabel } from '@/admin/lib/constants/vendor';
import { cn } from '@/admin/utils/classnames';

interface VendorViewDialogProps {
  vendor: Vendor;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const VendorViewDialog: React.FC<VendorViewDialogProps> = ({
  vendor,
  open,
  onOpenChange,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
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
                    vendor.status === "suspended" ? "bg-orange-500" :
                    vendor.status === "blocked" ? "bg-red-500" : "bg-gray-500"
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
                <Mail className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{vendor.email}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-gray-400" />
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
              <MapPin className="h-5 w-5 text-gray-400 mt-1" />
              <div>
                <p className="font-medium">{vendor.address}</p>
                <p className="text-gray-600">{vendor.city}</p>
              </div>
            </div>
          </div>

          {/* Website */}
          {vendor.website && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Site Web</h3>
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-gray-400" />
                <a
                  href={vendor.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  {vendor.website}
                </a>
              </div>
            </div>
          )}

          {/* Description */}
          {vendor.description && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Description</h3>
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-gray-400 mt-1" />
                <p className="text-gray-700 leading-relaxed">{vendor.description}</p>
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Informations Système</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Créé le</p>
                  <p className="font-medium">
                    {new Date(vendor.created_at).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Modifié le</p>
                  <p className="font-medium">
                    {new Date(vendor.updated_at).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VendorViewDialog;
