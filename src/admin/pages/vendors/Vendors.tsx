import * as React from "react";
import { useState, useEffect, useCallback } from "react";
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
import { EyeIcon, MoreVerticalIcon } from "lucide-react";
import { Vendor, VendorStatus } from "@/admin/lib/api/types/vendor";
import { getVendorStatusLabel } from "@/admin/lib/constants/vendor";
import { useVendors } from "@/admin/hooks/useVendors";
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

// Memoized Vendor Row Component for better performance
const VendorRow = React.memo(({ 
  vendor, 
  onStatusChange, 
  actionLoading,
  onImageClick
}: { 
  vendor: Vendor; 
  onStatusChange: (vendor: Vendor, status: VendorStatus) => void;
  actionLoading: Set<number>;
  onImageClick: (images: string[], index: number) => void;
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
          <Select
            value={vendor.status}
            onValueChange={(value) => onStatusChange(vendor, value as VendorStatus)}
            disabled={isActionLoading}
          >
              <SelectTrigger className="w-full h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">{getVendorStatusLabel('active')}</SelectItem>
              <SelectItem value="pending">{getVendorStatusLabel('pending')}</SelectItem>
              <SelectItem value="suspended">{getVendorStatusLabel('suspended')}</SelectItem>
              <SelectItem value="blocked">{getVendorStatusLabel('blocked')}</SelectItem>
            </SelectContent>
          </Select>
          </div>
          <Badge
            className={cn(
              "text-white whitespace-nowrap text-xs",
              vendor.status === "active" ? "bg-green-500" :
              vendor.status === "pending" ? "bg-blue-500" :
              vendor.status === "suspended" ? "bg-orange-500" :
              vendor.status === "blocked" ? "bg-red-500" : "bg-gray-500"
            )}
          >
            {getVendorStatusLabel(vendor.status)}
          </Badge>
        </div>
      </TableCell>
      <TableCell className="text-right w-[80px] min-w-[60px]">
        <div className="flex items-center justify-end">
          <div className="flex items-center gap-2">
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
                                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  mediaType === 'image' 
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
  const {
    vendors,
    loading,
    error,
    pagination,
    actionLoading,
    fetchVendors,
    updateVendorStatus,
  } = useVendors();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isSearching, setIsSearching] = useState(false);
  const [isPaginationLoading, setIsPaginationLoading] = useState(false);
  
  // Lightbox state
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxCurrentIndex, setLightboxCurrentIndex] = useState(0);

  // Debounced search with proper implementation
  const debouncedSearch = useCallback(
    debounce(async (term: string, status: string, page: number = 1) => {
      if (!loading && !isPaginationLoading) {
        setIsSearching(true);
        try {
          const filters = {
            ...(status !== 'all' && { status: status as VendorStatus }),
            ...(term && { search: term }),
          };
          
          await fetchVendors(filters, page);
        } catch (error) {
          console.error('Search error:', error);
        } finally {
          setIsSearching(false);
        }
      }
    }, 500),
    [fetchVendors, loading, isPaginationLoading]
  );

  // Handle search input with immediate UI feedback
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Trigger debounced search
    debouncedSearch(value, statusFilter, 1);
  };

  // Handle status filter change
  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    debouncedSearch(searchTerm, value, 1);
  };

  // Initial load
  useEffect(() => {
    fetchVendors({}, 1);
  }, [fetchVendors]);

  // Handle sorting with server-side implementation
  const handleSort = useCallback(
    async (column: string) => {
      if (!loading && !isPaginationLoading) {
        const newSortOrder =
          sortBy === column && sortOrder === "asc" ? "desc" : "asc";
        setSortBy(column);
        setSortOrder(newSortOrder);
        
        try {
          // Reset to first page when sorting changes
          const filters = {
            ...(statusFilter !== 'all' && { status: statusFilter as VendorStatus }),
            ...(searchTerm && { search: searchTerm }),
            sortBy: column,
            sortOrder: newSortOrder as 'asc' | 'desc',
          };
          await fetchVendors(filters, 1, pagination.perPage);
        } catch (error) {
          console.error('Sorting error:', error);
        }
      }
    },
    [fetchVendors, statusFilter, searchTerm, sortBy, sortOrder, pagination.perPage, loading, isPaginationLoading]
  );

  // Handle pagination with proper state management
  const handlePageChange = useCallback(async (page: number) => {
    if (page !== pagination.currentPage && page >= 1 && page <= pagination.lastPage && !isPaginationLoading && !loading) {
      setIsPaginationLoading(true);
      try {
        const filters = {
          ...(statusFilter !== 'all' && { status: statusFilter as VendorStatus }),
          ...(searchTerm && { search: searchTerm }),
          ...(sortBy && { sortBy }),
          ...(sortOrder && { sortOrder }),
        };
        await fetchVendors(filters, page, pagination.perPage);
      } catch (error) {
        console.error('Pagination error:', error);
      } finally {
        setIsPaginationLoading(false);
      }
    }
  }, [fetchVendors, statusFilter, searchTerm, sortBy, sortOrder, pagination.currentPage, pagination.lastPage, pagination.perPage, isPaginationLoading, loading]);

  // Handle page size change with proper reset
  const handlePageSizeChange = useCallback(async (newPageSize: number) => {
    if (newPageSize !== pagination.perPage && !loading && !isPaginationLoading) {
      setIsPaginationLoading(true);
      try {
        const filters = {
          ...(statusFilter !== 'all' && { status: statusFilter as VendorStatus }),
          ...(searchTerm && { search: searchTerm }),
          ...(sortBy && { sortBy }),
          ...(sortOrder && { sortOrder }),
        };
        await fetchVendors(filters, 1, newPageSize);
      } catch (error) {
        console.error('Page size change error:', error);
      } finally {
        setIsPaginationLoading(false);
      }
    }
  }, [fetchVendors, statusFilter, searchTerm, sortBy, sortOrder, pagination.perPage, loading, isPaginationLoading]);

  // Use vendors directly since sorting is handled server-side
  const sortedVendors = vendors;

  // Memoized status change handler
  const handleStatusChangeMemo = useCallback((vendor: Vendor, newStatus: VendorStatus) => {
    updateVendorStatus(vendor, newStatus);
  }, [updateVendorStatus]);


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
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="pl-6 pr-6 sm:pl-10 sm:pr-10 h-8 sm:h-11 text-xs sm:text-sm"
                  disabled={isSearching}
                />
                {isSearching ? (
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
                          <SelectItem value="active">Actif</SelectItem>
                          <SelectItem value="pending">En attente</SelectItem>
                          <SelectItem value="suspended">Suspendu</SelectItem>
                          <SelectItem value="blocked">Bloqué</SelectItem>
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
              {!loading && sortedVendors.length > 0 && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs sm:text-sm text-gray-600 bg-white p-1 sm:p-3 rounded-lg border gap-1 sm:gap-2">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Icon icon="lucide:users" className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>
                      {sortedVendors.length} vendeur{sortedVendors.length > 1 ? 's' : ''}
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
            {loading ? (
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
            ) : sortedVendors.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                Aucun vendeur trouvé
              </div>
            ) : (
              <div className="space-y-2 p-1 sm:p-4">
                {sortedVendors.map((vendor) => (
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
                              vendor.status === "suspended" ? "bg-orange-500" :
                              vendor.status === "blocked" ? "bg-red-500" : "bg-gray-500"
                            )}
                          >
                            {getVendorStatusLabel(vendor.status)}
                          </Badge>
                        </div>
            </div>
            
                      {/* Actions */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1 sm:gap-2 pt-1 sm:pt-2 border-t border-gray-100">
                        <div className="flex-1">
                          <Select
                            value={vendor.status}
                            onValueChange={(value) => handleStatusChangeMemo(vendor, value as VendorStatus)}
                            disabled={actionLoading.has(vendor.id)}
                          >
                            <SelectTrigger className="w-full h-7 sm:h-9 text-xs sm:text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">{getVendorStatusLabel('active')}</SelectItem>
                              <SelectItem value="pending">{getVendorStatusLabel('pending')}</SelectItem>
                              <SelectItem value="suspended">{getVendorStatusLabel('suspended')}</SelectItem>
                              <SelectItem value="blocked">{getVendorStatusLabel('blocked')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
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
                  {loading ? (
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
                  ) : sortedVendors.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                        Aucun vendeur trouvé
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedVendors.map((vendor) => (
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
                            <Select
                              value={vendor.status}
                              onValueChange={(value) => handleStatusChangeMemo(vendor, value as VendorStatus)}
                              disabled={actionLoading.has(vendor.id)}
                            >
                              <SelectTrigger className="w-full h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="active">{getVendorStatusLabel('active')}</SelectItem>
                                <SelectItem value="pending">{getVendorStatusLabel('pending')}</SelectItem>
                                <SelectItem value="suspended">{getVendorStatusLabel('suspended')}</SelectItem>
                                <SelectItem value="blocked">{getVendorStatusLabel('blocked')}</SelectItem>
                              </SelectContent>
                            </Select>
                            <Badge
                              className={cn(
                                "text-white text-xs w-fit",
                                vendor.status === "active" ? "bg-green-500" :
                                vendor.status === "pending" ? "bg-blue-500" :
                                vendor.status === "suspended" ? "bg-orange-500" :
                                vendor.status === "blocked" ? "bg-red-500" : "bg-gray-500"
                              )}
                            >
                              {getVendorStatusLabel(vendor.status)}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-right w-[80px] min-w-[60px]">
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
                  {loading ? (
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
                  ) : sortedVendors.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        Aucun vendeur trouvé
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedVendors.map((vendor) => (
                      <VendorRow
                        key={vendor.id}
                        vendor={vendor}
                        onStatusChange={handleStatusChangeMemo}
                        actionLoading={actionLoading}
                        onImageClick={handleImageClick}
                      />
                    ))
                  )}
                </TableBody>
                </Table>
            </div>
          </motion.div>

          {/* Pagination */}
          {pagination.total > 0 && (
            <motion.div 
              initial="hidden"
              animate="visible"
              variants={animationVariants.fadeIn}
              className="p-4 border-t"
            >
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                {/* Pagination Info */}
                <div className="text-sm text-gray-600 flex items-center gap-2">
                  {isPaginationLoading && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                  )}
                  Affichage de {pagination.total > 0 ? ((pagination.currentPage - 1) * pagination.perPage) + 1 : 0} à {Math.min(pagination.currentPage * pagination.perPage, pagination.total)} sur {pagination.total} vendeurs
                </div>
                
                {/* Pagination Controls */}
                {pagination.lastPage > 1 && (
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => !loading && !isPaginationLoading && handlePageChange(pagination.currentPage - 1)}
                          className={pagination.currentPage <= 1 || loading || isPaginationLoading ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                      
                      {Array.from({ length: pagination.lastPage }, (_, i) => i + 1)
                        .filter((page) => {
                          if (pagination.lastPage <= 7) return true;
                          if (page === 1 || page === pagination.lastPage) return true;
                          if (Math.abs(page - pagination.currentPage) <= 2) return true;
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
                          onClick={() => !loading && !isPaginationLoading && handlePageChange(pagination.currentPage + 1)}
                          className={pagination.currentPage >= pagination.lastPage || loading || isPaginationLoading ? "pointer-events-none opacity-50" : "cursor-pointer"}
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
