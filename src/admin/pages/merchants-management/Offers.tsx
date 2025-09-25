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
  UserIcon 
} from "lucide-react";
import { Link } from "react-router-dom";
import { Checkbox } from "@/admin/components/ui/checkbox";

interface Offer {
  id: number;
  merchantId: number;
  merchantName: string;
  offerDetails: string;
  validityStart: Date;
  validityEnd: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface Merchant {
  id: number;
  name: string;
}

// Mock data
const mockMerchants: Merchant[] = [
  { id: 1, name: "Merchant 1" },
  { id: 2, name: "Merchant 2" },
];

const mockOffers: Offer[] = [
  {
    id: 1,
    merchantId: 1,
    merchantName: "Merchant 1",
    offerDetails: "50% off on all items",
    validityStart: new Date(),
    validityEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  // Add more mock data as needed
];

type FormData = {
  merchantId: string;
  offerDetails: string;
  validityStart: string;
  validityEnd: string;
};

const Offers = () => {
  const [offers, setOffers] = useState<Offer[]>(mockOffers);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedOffers, setSelectedOffers] = useState<number[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const itemsPerPage = 5;

  const [formData, setFormData] = useState<FormData>({
    merchantId: "",
    offerDetails: "",
    validityStart: "",
    validityEnd: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validation
    if (!formData.merchantId) {
      setErrors(prev => ({ ...prev, merchantId: "Merchant is required" }));
      return;
    }

    if (!formData.offerDetails.trim()) {
      setErrors(prev => ({ ...prev, offerDetails: "Offer details are required" }));
      return;
    }

    if (formData.offerDetails.length > 500) {
      setErrors(prev => ({ ...prev, offerDetails: "Offer details must not exceed 500 characters" }));
      return;
    }

    if (!formData.validityStart || !formData.validityEnd) {
      setErrors(prev => ({ ...prev, validity: "Validity dates are required" }));
      return;
    }

    const startDate = new Date(formData.validityStart);
    const endDate = new Date(formData.validityEnd);

    if (endDate <= startDate) {
      setErrors(prev => ({ ...prev, validity: "End date must be later than start date" }));
      return;
    }

    if (selectedOffer) {
      // Update existing offer
      setOffers(offers.map(offer =>
        offer.id === selectedOffer.id
          ? {
              ...offer,
              merchantId: parseInt(formData.merchantId),
              merchantName: mockMerchants.find(m => m.id === parseInt(formData.merchantId))?.name || "",
              offerDetails: formData.offerDetails,
              validityStart: new Date(formData.validityStart),
              validityEnd: new Date(formData.validityEnd),
              updatedAt: new Date(),
            }
          : offer
      ));
    } else {
      // Add new offer
      setOffers([
        ...offers,
        {
          id: Math.max(...offers.map(o => o.id)) + 1,
          merchantId: parseInt(formData.merchantId),
          merchantName: mockMerchants.find(m => m.id === parseInt(formData.merchantId))?.name || "",
          offerDetails: formData.offerDetails,
          validityStart: new Date(formData.validityStart),
          validityEnd: new Date(formData.validityEnd),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
    }

    setIsAddDialogOpen(false);
    resetForm();
  };

  const handleDelete = (id: number) => {
    setOffers(offers.filter(offer => offer.id !== id));
    setSelectedOffers(selectedOffers.filter(offerId => offerId !== id));
  };

  const handleBulkDelete = () => {
    setOffers(offers.filter(offer => !selectedOffers.includes(offer.id)));
    setSelectedOffers([]);
  };

  const resetForm = () => {
    setFormData({
      merchantId: "",
      offerDetails: "",
      validityStart: "",
      validityEnd: "",
    });
    setSelectedOffer(null);
    setErrors({});
  };

  const handleExport = () => {
    const csvRows = [];
    
    // Add headers
    csvRows.push([
      'ID',
      'Merchant',
      'Offer Details',
      'Validity Start',
      'Validity End',
      'Created At',
      'Updated At'
    ].join(','));

    // Add data rows
    filteredOffers.forEach(offer => {
      const row = [
        offer.id,
        `"${offer.merchantName}"`,
        `"${offer.offerDetails}"`,
        format(offer.validityStart, "PP"),
        format(offer.validityEnd, "PP"),
        format(offer.createdAt, "PP"),
        format(offer.updatedAt, "PP")
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', `offers_${format(new Date(), "yyyy-MM-dd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isOfferActive = (offer: Offer) => {
    const now = new Date();
    return offer.validityStart <= now && offer.validityEnd >= now;
  };

  const filteredOffers = offers.filter(offer => {
    const matchesSearch =
      offer.merchantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      offer.offerDetails.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = 
      filterStatus === "all" ||
      (filterStatus === "active" && isOfferActive(offer)) ||
      (filterStatus === "expired" && !isOfferActive(offer));

    return matchesSearch && matchesStatus;
  });

  const paginatedOffers = filteredOffers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Merchant Offers Management</h2>
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={handleExport}
              >
                <DownloadIcon className="h-4 w-4 mr-2" />
                Export
              </Button>
              {selectedOffers.length > 0 && (
                <Button
                  variant="destructive"
                  onClick={handleBulkDelete}
                >
                  Delete Selected ({selectedOffers.length})
                </Button>
              )}
              <Button onClick={() => {
                resetForm();
                setIsAddDialogOpen(true);
              }}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Offer
              </Button>
            </div>
          </div>

          <div className="flex gap-4">
            <Input
              placeholder="Search offers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All offers</SelectItem>
                <SelectItem value="active">Active offers</SelectItem>
                <SelectItem value="expired">Expired offers</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">
                    <Checkbox
                      checked={selectedOffers.length === paginatedOffers.length}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedOffers(paginatedOffers.map(o => o.id));
                        } else {
                          setSelectedOffers([]);
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Merchant</TableHead>
                  <TableHead>Offer Details</TableHead>
                  <TableHead>Validity Start</TableHead>
                  <TableHead>Validity End</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Updated At</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedOffers.map((offer) => (
                  <TableRow key={offer.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedOffers.includes(offer.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedOffers([...selectedOffers, offer.id]);
                          } else {
                            setSelectedOffers(selectedOffers.filter(id => id !== offer.id));
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>{offer.id}</TableCell>
                    <TableCell>
                      <Link 
                        to={`/admin/merchants`}
                        className="flex items-center text-blue-600 hover:text-blue-800"
                      >
                        <UserIcon className="h-4 w-4 mr-1" />
                        {offer.merchantName}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {offer.offerDetails}
                    </TableCell>
                    <TableCell>{format(offer.validityStart, "PP")}</TableCell>
                    <TableCell>{format(offer.validityEnd, "PP")}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        isOfferActive(offer) 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {isOfferActive(offer) ? 'Active' : 'Expired'}
                      </span>
                    </TableCell>
                    <TableCell>{format(offer.createdAt, "PP")}</TableCell>
                    <TableCell>{format(offer.updatedAt, "PP")}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setSelectedOffer(offer);
                            setIsViewDialogOpen(true);
                          }}
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setSelectedOffer(offer);
                            setFormData({
                              merchantId: offer.merchantId.toString(),
                              offerDetails: offer.offerDetails,
                              validityStart: format(offer.validityStart, "yyyy-MM-dd"),
                              validityEnd: format(offer.validityEnd, "yyyy-MM-dd"),
                            });
                            setIsAddDialogOpen(true);
                          }}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="icon">
                              <TrashIcon className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Offer</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this offer?
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(offer.id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex justify-end items-center gap-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-sm">
              {currentPage}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => 
                Math.min(Math.ceil(filteredOffers.length / itemsPerPage), prev + 1)
              )}
              disabled={currentPage === Math.ceil(filteredOffers.length / itemsPerPage)}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      {/* Add/Edit Offer Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedOffer ? "Edit Offer" : "Add New Offer"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label>Merchant</label>
              <Select
                value={formData.merchantId}
                onValueChange={(value) => setFormData({ ...formData, merchantId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a merchant" />
                </SelectTrigger>
                <SelectContent>
                  {mockMerchants.map(merchant => (
                    <SelectItem key={merchant.id} value={merchant.id.toString()}>
                      {merchant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.merchantId && (
                <p className="text-sm text-red-500">{errors.merchantId}</p>
              )}
            </div>

            <div className="space-y-2">
              <label>Offer Details</label>
              <Textarea
                value={formData.offerDetails}
                onChange={(e) => setFormData({ ...formData, offerDetails: e.target.value })}
                placeholder="Enter offer details"
              />
              {errors.offerDetails && (
                <p className="text-sm text-red-500">{errors.offerDetails}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label>Validity Start</label>
                <Input
                  type="date"
                  value={formData.validityStart}
                  onChange={(e) => setFormData({ ...formData, validityStart: e.target.value })}
                  min={format(new Date(), "yyyy-MM-dd")}
                />
              </div>

              <div className="space-y-2">
                <label>Validity End</label>
                <Input
                  type="date"
                  value={formData.validityEnd}
                  onChange={(e) => setFormData({ ...formData, validityEnd: e.target.value })}
                  min={formData.validityStart || format(new Date(), "yyyy-MM-dd")}
                />
              </div>
            </div>
            {errors.validity && (
              <p className="text-sm text-red-500">{errors.validity}</p>
            )}

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddDialogOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                {selectedOffer ? "Update" : "Add"} Offer
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Offer Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>View Offer</DialogTitle>
          </DialogHeader>
          {selectedOffer && (
            <div className="space-y-4">
              <div>
                <label className="font-semibold">Merchant</label>
                <p>{selectedOffer.merchantName}</p>
              </div>
              <div>
                <label className="font-semibold">Offer Details</label>
                <p className="whitespace-pre-wrap">{selectedOffer.offerDetails}</p>
              </div>
              <div>
                <label className="font-semibold">Validity Period</label>
                <p>
                  {format(selectedOffer.validityStart, "PP")} to{" "}
                  {format(selectedOffer.validityEnd, "PP")}
                </p>
              </div>
              <div>
                <label className="font-semibold">Status</label>
                <p className={isOfferActive(selectedOffer) ? "text-green-600" : "text-red-600"}>
                  {isOfferActive(selectedOffer) ? "Active" : "Expired"}
                </p>
              </div>
              <div>
                <label className="font-semibold">Created At</label>
                <p>{format(selectedOffer.createdAt, "PPp")}</p>
              </div>
              <div>
                <label className="font-semibold">Updated At</label>
                <p>{format(selectedOffer.updatedAt, "PPp")}</p>
              </div>
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setIsViewDialogOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Offers;
