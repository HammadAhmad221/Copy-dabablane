import { DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/admin/components/ui/dialog";
import { Badge } from "@/admin/components/ui/badge";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import { Blane } from "@/lib/types/blane";
import { Category } from "@/lib/types/category";
import { Subcategory } from "@/lib/types/subcategory";
import { Button } from "@/admin/components/ui/button";
import { format } from "date-fns";
import { Label } from "@/admin/components/ui/label";
import { useState } from "react";
import { Input } from "@/admin/components/ui/input";
import { toast } from "react-hot-toast";
import { blaneApi } from "@/admin/lib/api/services/blaneService";
import { CopyIcon, RefreshCwIcon, CheckIcon, LinkIcon, GlobeIcon, EyeOffIcon } from "lucide-react";
import { getStatusLabel } from "@/admin/lib/constants/status";

interface BlaneViewDialogProps {
  blane: Blane;
  categories: Category[];
  subcategories: Subcategory[];
}

export function BlaneViewDialog({ 
  blane, 
  categories, 
  subcategories
}: BlaneViewDialogProps) {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState<string>(blane.share_url || '');
  const [shareToken, setShareToken] = useState<string>(blane.share_token || '');

  const handleOpenInNewTab = () => {
    if (blane.visibility === "link" && shareUrl) {
      // Use the share URL for link-based visibility
      window.open(shareUrl, '_blank');
    } else if (blane.slug) {
      // Use the regular slug URL for public blanes
      window.open(`/blane/${blane.slug}`, '_blank');
    } else if (blane.id) {
      // Fallback to ID-based URL
      window.open(`/blane/${blane.id}`, '_blank');
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const copyToClipboard = () => {
    if (!shareUrl) return;
    
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        setCopied(true);
        toast.success('Link copied to clipboard');
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy:', err);
        toast.error('Failed to copy link');
      });
  };

  const regenerateShareLink = async () => {
    if (!blane.id) {
      toast.error('Cannot regenerate link for unsaved blane');
      return;
    }
    
    setLoading(true);
    try {
      const response = await blaneApi.generateShareLink(blane.id.toString());
      if (response?.data?.data) {
        const { share_token, share_url } = response.data.data;
        setShareToken(share_token);
        setShareUrl(share_url);
        toast.success('Share link regenerated successfully');
      }
    } catch (error) {
      console.error('Error regenerating share link:', error);
      toast.error('Failed to regenerate share link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DialogContent 
      className="max-w-[95vw] md:max-w-3xl max-h-[95vh] h-auto p-0 gap-0 overflow-y-auto bg-white rounded-lg shadow-lg border border-gray-200"
    >
      {/* Added min-h-0 to allow proper overflow */}
      <div className="h-full flex flex-col min-h-0">
        {/* Header Section - Fixed */}
        <div className="p-4 top-0 sticky md:p-6 border-b flex items-center justify-between bg-gradient-to-r from-[#00897B]/10 to-white shrink-0 bg-white">
          <DialogHeader className="flex-1 ">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-full bg-[#00897B]/10">
                  <Icon icon="lucide:eye" className="h-6 w-6 text-[#00897B]" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold text-gray-800 truncate max-w-[180px] sm:max-w-full">{blane.name}</DialogTitle>
                  <p className="text-sm text-gray-500">ID: {blane.id}</p>
                </div>
              </div>
              <Badge
                className={cn(
                  "text-white font-medium shadow-sm",
                  blane.status === "active" ? "bg-green-500" : 
                  blane.status === "waiting" ? "bg-blue-500" : 
                  blane.status === "expired" ? "bg-red-500" : "bg-yellow-500"
                )}
              >
                {getStatusLabel(blane.status)}
              </Badge>
            </div>
          </DialogHeader>
          <DialogClose className="h-8 w-8 rounded-full bg-gray-100 opacity-70 hover:opacity-100 flex items-center justify-center transition-all hover:bg-gray-200 ml-2">
            <Icon icon="lucide:x" className="h-4 w-4 text-gray-600" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>

        {/* Content Section - Scrollable with min-h-0 */}
        <div className="flex-1 min-h-0  p-4 md:p-6 space-y-6 bg-white custom-scrollbar">
          {/* Action buttons */}
          <div className="flex justify-end gap-3 mb-4 bg-white py-2 sticky top-24 z-10">
            <Button 
              onClick={handleOpenInNewTab}
              className="flex items-center gap-2 bg-[#00897B] hover:bg-[#00897B]/90 text-white shadow-sm transition-all"
            >
              <Icon icon="lucide:external-link" className="h-4 w-4" />
              <span className="hidden sm:inline">Preview</span>
              <span className="sm:hidden">View</span>
            </Button>
          </div>

          {/* Visibility & Share URL Section */}
          <div className="border rounded-lg p-4 md:p-5 bg-white shadow-sm">
            <h3 className="text-sm font-medium text-gray-500 mb-4 flex items-center">
              <Icon icon="lucide:link" className="h-4 w-4 mr-2 text-[#00897B]" />
              Visibility & Sharing
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge 
                  className={cn(
                    "text-white font-medium",
                    blane.visibility === "public" 
                      ? "bg-green-500" 
                      : blane.visibility === "link" 
                        ? "bg-blue-500" 
                        : "bg-gray-500"
                  )}
                >
                  {blane.visibility === "public" && (
                    <GlobeIcon className="h-3 w-3 mr-1" />
                  )}
                  {blane.visibility === "link" && (
                    <LinkIcon className="h-3 w-3 mr-1" />
                  )}
                  {blane.visibility === "private" && (
                    <EyeOffIcon className="h-3 w-3 mr-1" />
                  )}
                  {blane.visibility || "private"}
                </Badge>
                <span className="text-sm text-gray-500">
                  {blane.visibility === "public" && "Anyone can view this blane"}
                  {blane.visibility === "link" && "Only people with the link can view this blane"}
                  {blane.visibility === "private" && "Only you can view this blane"}
                </span>
              </div>
              
              {(blane.visibility === "link" || shareToken) && (
                <>
                  <div className="space-y-2">
                    <Label className="text-xs text-gray-500">Share URL</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        value={shareUrl}
                        readOnly
                        placeholder={loading ? 'Generating share link...' : 'Share link will appear here'}
                        className="flex-grow"
                      />
                      <Button
                        type="button"
                        onClick={copyToClipboard}
                        disabled={loading || !shareUrl}
                        variant="outline"
                        size="icon"
                        className="flex-shrink-0"
                      >
                        {copied ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  
                  <Button
                    type="button"
                    onClick={regenerateShareLink}
                    disabled={loading}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <RefreshCwIcon className="h-4 w-4" />
                    {shareToken ? 'Regenerate Link' : 'Generate Link'}
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Price Section */}
          <div className="bg-gradient-to-r from-[#f9fafb] to-white rounded-lg p-4 md:p-5 border border-gray-100 shadow-sm">
            <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center">
              <Icon icon="lucide:tag" className="h-4 w-4 mr-2 text-[#00897B]" />
              Pricing Information
            </h3>
            <div className="flex flex-wrap items-center gap-3 md:gap-5">
              <div>
                <p className="text-xl md:text-2xl font-bold text-[#00897B]">
                  {formatCurrency(Number(blane.price_current))}
                </p>
                <p className="text-xs md:text-sm text-gray-500">Current Price</p>
              </div>
              {blane.price_old && Number(blane.price_old) > 0 && (
                <div>
                  <p className="text-lg md:text-xl text-gray-400 line-through">
                    {formatCurrency(Number(blane.price_old))}
                  </p>
                  <p className="text-xs md:text-sm text-gray-500">Original Price</p>
                </div>
              )}
              {blane.price_old && Number(blane.price_old) > 0 && (
                <div className="bg-green-50 px-2 py-1 md:px-3 md:py-1 rounded-full">
                  <p className="text-xs md:text-sm font-medium text-green-600">
                    {Math.round((1 - Number(blane.price_current) / Number(blane.price_old)) * 100)}% Off
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Basic Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {/* Left column */}
            <div className="space-y-4 md:space-y-5">
              <div className="border rounded-lg p-4 md:p-5 bg-white shadow-sm">
                <h3 className="text-sm font-medium text-gray-500 mb-4 flex items-center">
                  <Icon icon="lucide:info" className="h-4 w-4 mr-2 text-[#00897B]" />
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                  <div className="space-y-1 space-x-2">
                    <Label className="text-xs text-gray-500">Type</Label>
                    <Badge className={cn(
                      "text-white font-medium",
                      blane.type === "reservation" ? "bg-blue-500" : "bg-purple-500"
                    )}>
                      {blane.type === "reservation" ? "Réservation" : "Commande"}
                    </Badge>
                  </div>
                  <div className="space-y-1 space-x-2">
                    <Label className="text-xs text-gray-500">Is Digital</Label>
                    <Badge className={blane.is_digital ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"}>
                      {blane.is_digital ? "Digital" : "Physical"}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">City</Label>
                    <p className="font-medium flex items-center text-sm">
                      <Icon icon="lucide:map-pin" className="h-3 w-3 mr-1 text-gray-400" />
                      {blane.city}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Category</Label>
                    <p className="font-medium text-sm">
                      {categories.find(cat => String(cat.id) === String(blane.categories_id))?.name || '-'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Subcategory</Label>
                    <p className="font-medium text-sm">
                      {subcategories.find(sub => String(sub.id) === String(blane.subcategories_id))?.name || '-'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Dates section */}
              <div className="border rounded-lg p-4 md:p-5 bg-white shadow-sm">
                <h3 className="text-sm font-medium text-gray-500 mb-4 flex items-center">
                  <Icon icon="lucide:calendar" className="h-4 w-4 mr-2 text-[#00897B]" />
                  Time Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Start Date</Label>
                    <p className="font-medium flex items-center text-sm">
                      <Icon icon="lucide:calendar-check" className="h-3 w-3 mr-1 text-green-500" />
                      {blane.start_date ? format(new Date(blane.start_date), "PPP") : '-'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Expiration Date</Label>
                    <p className="font-medium flex items-center text-sm">
                      <Icon icon="lucide:calendar-x" className="h-3 w-3 mr-1 text-amber-500" />
                      {blane.expiration_date ? format(new Date(blane.expiration_date), "PPP") : 'No expiration'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Delivery section (only show for orders that are not digital) */}
              {blane.type === "order" && !blane.is_digital && (
                <div className="border rounded-lg p-4 md:p-5 bg-white shadow-sm">
                  <h3 className="text-sm font-medium text-gray-500 mb-4 flex items-center">
                    <Icon icon="lucide:truck" className="h-4 w-4 mr-2 text-[#00897B]" />
                    Delivery Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">In City Delivery</Label>
                      <p className="font-medium text-sm">
                        {blane.livraison_in_city ? formatCurrency(Number(blane.livraison_in_city)) : 'Free'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">Out of City Delivery</Label>
                      <p className="font-medium text-sm">
                        {blane.livraison_out_city ? formatCurrency(Number(blane.livraison_out_city)) : 'Free'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">Stock</Label>
                      <p className="font-medium flex items-center text-sm">
                        {Number(blane.stock) > 10 ? (
                          <Icon icon="lucide:check-circle" className="h-3 w-3 mr-1 text-green-500" />
                        ) : Number(blane.stock) > 0 ? (
                          <Icon icon="lucide:alert-circle" className="h-3 w-3 mr-1 text-amber-500" />
                        ) : (
                          <Icon icon="lucide:x-circle" className="h-3 w-3 mr-1 text-red-500" />
                        )}
                        {blane.stock || 0} units
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Digital indicator (only for digital blanes) */}
              {blane.is_digital && (
                <div className="border rounded-lg p-4 md:p-5 bg-white shadow-sm">
                  <h3 className="text-sm font-medium text-gray-500 mb-4 flex items-center">
                    <Icon icon="lucide:globe" className="h-4 w-4 mr-2 text-[#00897B]" />
                    Digital Product
                  </h3>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-500 text-white">
                      Digital
                    </Badge>
                    <p className="text-xs md:text-sm text-gray-500">
                      This is a digital product, no physical delivery required.
                    </p>
                  </div>
                  {blane.type === "order" && (
                    <div className="mt-4 space-y-1">
                      <Label className="text-xs text-gray-500">Stock</Label>
                      <p className="font-medium flex items-center text-sm">
                        {Number(blane.stock) > 10 ? (
                          <Icon icon="lucide:check-circle" className="h-3 w-3 mr-1 text-green-500" />
                        ) : Number(blane.stock) > 0 ? (
                          <Icon icon="lucide:alert-circle" className="h-3 w-3 mr-1 text-amber-500" />
                        ) : (
                          <Icon icon="lucide:x-circle" className="h-3 w-3 mr-1 text-red-500" />
                        )}
                        {blane.stock || 0} units
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right column */}
            <div className="space-y-4 md:space-y-5">
              {/* Description */}
              <div className="border rounded-lg p-4 md:p-5 bg-white shadow-sm">
                <h3 className="text-sm font-medium text-gray-500 mb-4 flex items-center">
                  <Icon icon="lucide:file-text" className="h-4 w-4 mr-2 text-[#00897B]" />
                  Description
                </h3>
                <div className="bg-gray-50 p-3 md:p-4 rounded-md whitespace-pre-wrap text-xs md:text-sm text-gray-700">
                  {blane.description || 'No description provided.'}
                </div>
              </div>

              {/* Advantages */}
              {blane.advantages && (
                <div className="border rounded-lg p-4 md:p-5 bg-white shadow-sm">
                  <h3 className="text-sm font-medium text-gray-500 mb-4 flex items-center">
                    <Icon icon="lucide:thumbs-up" className="h-4 w-4 mr-2 text-[#00897B]" />
                    Advantages
                  </h3>
                  <div className="bg-gray-50 p-3 md:p-4 rounded-md whitespace-pre-wrap text-xs md:text-sm text-gray-700">
                    {blane.advantages}
                  </div>
                </div>
              )}

              {/* Conditions */}
              {blane.conditions && (
                <div className="border rounded-lg p-4 md:p-5 bg-white shadow-sm">
                  <h3 className="text-sm font-medium text-gray-500 mb-4 flex items-center">
                    <Icon icon="lucide:alert-triangle" className="h-4 w-4 mr-2 text-[#00897B]" />
                    Conditions
                  </h3>
                  <div className="bg-gray-50 p-3 md:p-4 rounded-md whitespace-pre-wrap text-xs md:text-sm text-gray-700">
                    {blane.conditions}
                  </div>
                </div>
              )}

              {/* Payment Methods */}
              <div className="border rounded-lg p-4 md:p-5 bg-white shadow-sm">
                <h3 className="text-sm font-medium text-gray-500 mb-4 flex items-center">
                  <Icon icon="lucide:credit-card" className="h-4 w-4 mr-2 text-[#00897B]" />
                  Payment Methods
                </h3>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className={cn(
                    "border-2 text-xs md:text-sm",
                    blane.online ? "border-green-500 bg-green-50" : "border-gray-200 bg-gray-50"
                  )}>
                    <Icon icon="lucide:globe" className={cn(
                      "h-3 w-3 mr-1",
                      blane.online ? "text-green-500" : "text-gray-400"
                    )} />
                    Online Payment
                  </Badge>
                  <Badge variant="outline" className={cn(
                    "border-2 text-xs md:text-sm",
                    blane.cash ? "border-green-500 bg-green-50" : "border-gray-200 bg-gray-50"
                  )}>
                    <Icon icon="lucide:wallet" className={cn(
                      "h-3 w-3 mr-1",
                      blane.cash ? "text-green-500" : "text-gray-400"
                    )} />
                    Cash Payment
                  </Badge>
                  <Badge variant="outline" className={cn(
                    "border-2 text-xs md:text-sm",
                    blane.partiel ? "border-green-500 bg-green-50" : "border-gray-200 bg-gray-50"
                  )}>
                    <Icon icon="lucide:percent" className={cn(
                      "h-3 w-3 mr-1",
                      blane.partiel ? "text-green-500" : "text-gray-400"
                    )} />
                    Partial Payment
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Section - Fixed */}
        <div className="p-4 md:p-6 border-t bg-gray-50 shrink-0">
          <div className="flex justify-end gap-2">
            <DialogClose asChild>
              <Button variant="outline" className="hover:bg-gray-100 transition-colors">Close</Button>
            </DialogClose>
          </div>
        </div>
      </div>
    </DialogContent>
  );
}