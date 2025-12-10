import { useState } from "react";
import { Card } from "@/admin/components/ui/card";
import { Input } from "@/admin/components/ui/input";
import { Button } from "@/admin/components/ui/button";
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
  PencilIcon,
  TrashIcon,
  PlusIcon,
  DownloadIcon,
  MapPinIcon,
  TruckIcon,
  DollarSignIcon,
  PackageIcon
} from "lucide-react";

interface ShippingDetail {
  id: number;
  orderId: number;
  addressId: number;
  address: string;
  shippingFee: number;
  createdAt: Date;
}

interface Order {
  id: number;
  reference: string;
}

interface Address {
  id: number;
  fullAddress: string;
}

// Mock data
const mockOrders: Order[] = [
  { id: 1, reference: "ORD-001" },
  { id: 2, reference: "ORD-002" },
];

const mockAddresses: Address[] = [
  { id: 1, fullAddress: "123 Main St, City, Country" },
  { id: 2, fullAddress: "456 Park Ave, Town, Country" },
];

const mockShippingDetails: ShippingDetail[] = [
  {
    id: 1,
    orderId: 1,
    addressId: 1,
    address: "123 Main St, City, Country",
    shippingFee: 15.99,
    createdAt: new Date(),
  },
  // Add more mock data
];

type FormData = {
  orderId: string;
  addressId: string;
  shippingFee: string;
};

const Shipping = () => {
  const [shippingDetails, setShippingDetails] = useState<ShippingDetail[]>(mockShippingDetails);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDetail, setSelectedDetail] = useState<ShippingDetail | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isAddEditDialogOpen, setIsAddEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const itemsPerPage = 10;

  const [formData, setFormData] = useState<FormData>({
    orderId: "",
    addressId: "",
    shippingFee: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!formData.orderId) {
      setErrors(prev => ({ ...prev, orderId: "Order is required" }));
      return;
    }

    if (!formData.addressId) {
      setErrors(prev => ({ ...prev, addressId: "Address is required" }));
      return;
    }

    if (!formData.shippingFee || parseFloat(formData.shippingFee) <= 0) {
      setErrors(prev => ({ ...prev, shippingFee: "Valid shipping fee is required" }));
      return;
    }

    const newDetail: ShippingDetail = {
      id: selectedDetail?.id || Math.max(...shippingDetails.map(d => d.id)) + 1,
      orderId: parseInt(formData.orderId),
      addressId: parseInt(formData.addressId),
      address: mockAddresses.find(a => a.id === parseInt(formData.addressId))?.fullAddress || "",
      shippingFee: parseFloat(formData.shippingFee),
      createdAt: selectedDetail?.createdAt || new Date(),
    };

    if (selectedDetail) {
      setShippingDetails(prev => 
        prev.map(detail => detail.id === selectedDetail.id ? newDetail : detail)
      );
    } else {
      setShippingDetails(prev => [...prev, newDetail]);
    }

    setIsAddEditDialogOpen(false);
    resetForm();
  };

  const handleDelete = () => {
    if (selectedDetail) {
      setShippingDetails(prev => 
        prev.filter(detail => detail.id !== selectedDetail.id)
      );
      setIsDeleteDialogOpen(false);
      setSelectedDetail(null);
    }
  };

  const resetForm = () => {
    setFormData({
      orderId: "",
      addressId: "",
      shippingFee: "",
    });
    setErrors({});
    setSelectedDetail(null);
  };

  const handleExport = () => {
    const csvRows = [
      ['ID', 'Order ID', 'Address', 'Shipping Fee', 'Created At'],
      ...shippingDetails.map(detail => [
        detail.id,
        detail.orderId,
        detail.address,
        detail.shippingFee,
        format(detail.createdAt, "PP"),
      ])
    ];

    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `shipping_details_${format(new Date(), "yyyy-MM-dd")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getMetrics = () => {
    const total = shippingDetails.length;
    const totalFees = shippingDetails.reduce((sum, detail) => sum + detail.shippingFee, 0);
    const avgFee = totalFees / total;

    return {
      total,
      totalFees,
      avgFee,
    };
  };

  const filteredDetails = shippingDetails.filter(detail => {
    // Text search filter
    const matchesSearch = 
      detail.orderId.toString().includes(searchTerm) ||
      detail.address.toLowerCase().includes(searchTerm.toLowerCase());

    // Date range filter
    const detailDate = new Date(detail.createdAt);
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    // Set end date to end of day
    if (end) {
      end.setHours(23, 59, 59, 999);
    }

    const withinDateRange = 
      (!start || detailDate >= start) && 
      (!end || detailDate <= end);

    return matchesSearch && withinDateRange;
  });

  const paginatedDetails = filteredDetails.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      {/* Metrics */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-sm font-medium text-muted-foreground">Total Shipments</div>
          <div className="text-2xl font-bold">{getMetrics().total}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-muted-foreground">Total Shipping Fees</div>
          <div className="text-2xl font-bold">{getMetrics().totalFees.toFixed(2)} DH</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-muted-foreground">Average Shipping Fee</div>
          <div className="text-2xl font-bold">{getMetrics().avgFee.toFixed(2)} DH</div>
        </Card>
      </div>

      {/* Data Table */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <div className="text-sm font-medium mb-2">Start Date</div>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-[180px]"
              />
            </div>
            <div>
              <div className="text-sm font-medium mb-2">End Date</div>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-[180px]"
              />
            </div>
            <Input
              placeholder="Search shipping details..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Button
              variant="outline"
              onClick={handleExport}
              className="flex items-center gap-2 ml-auto"
            >
              Export
              <DownloadIcon className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => {
                setIsAddEditDialogOpen(true);
                resetForm();
              }}
              className="flex items-center gap-2"
            >
              <PlusIcon className="h-4 w-4" />
              Add Shipping
            </Button>
          </div>

          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Shipping Fee</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedDetails.map(detail => (
                  <TableRow key={detail.id}>
                    <TableCell>#{detail.orderId}</TableCell>
                    <TableCell>{detail.address}</TableCell>
                    <TableCell>{detail.shippingFee.toFixed(2)} DH</TableCell>
                    <TableCell>{format(detail.createdAt, "PP")}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setSelectedDetail(detail);
                            setIsViewDialogOpen(true);
                          }}
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setSelectedDetail(detail);
                            setFormData({
                              orderId: detail.orderId.toString(),
                              addressId: detail.addressId.toString(),
                              shippingFee: detail.shippingFee.toString(),
                            });
                            setIsAddEditDialogOpen(true);
                          }}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setSelectedDetail(detail);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
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
                Math.min(Math.ceil(filteredDetails.length / itemsPerPage), prev + 1)
              )}
              disabled={currentPage === Math.ceil(filteredDetails.length / itemsPerPage)}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Shipping Details</DialogTitle>
          </DialogHeader>
          {selectedDetail && (
            <div className="space-y-4">
              <div>
                <label className="font-semibold">Order ID</label>
                <p>#{selectedDetail.orderId}</p>
              </div>
              <div>
                <label className="font-semibold">Address</label>
                <p>{selectedDetail.address}</p>
              </div>
              <div>
                <label className="font-semibold">Shipping Fee</label>
                <p>{selectedDetail.shippingFee.toFixed(2)} DH</p>
              </div>
              <div>
                <label className="font-semibold">Created At</label>
                <p>{format(selectedDetail.createdAt, "PPp")}</p>
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

      {/* Add/Edit Dialog */}
      <Dialog open={isAddEditDialogOpen} onOpenChange={setIsAddEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedDetail ? "Edit Shipping Detail" : "Add Shipping Detail"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label>Order</label>
              <Select
                value={formData.orderId}
                onValueChange={(value) => setFormData({ ...formData, orderId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an order" />
                </SelectTrigger>
                <SelectContent>
                  {mockOrders.map(order => (
                    <SelectItem key={order.id} value={order.id.toString()}>
                      {order.reference}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.orderId && (
                <p className="text-sm text-red-500">{errors.orderId}</p>
              )}
            </div>

            <div className="space-y-2">
              <label>Address</label>
              <Select
                value={formData.addressId}
                onValueChange={(value) => setFormData({ ...formData, addressId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an address" />
                </SelectTrigger>
                <SelectContent>
                  {mockAddresses.map(address => (
                    <SelectItem key={address.id} value={address.id.toString()}>
                      {address.fullAddress}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.addressId && (
                <p className="text-sm text-red-500">{errors.addressId}</p>
              )}
            </div>

            <div className="space-y-2">
              <label>Shipping Fee</label>
              <Input
                type="number"
                step="0.01"
                value={formData.shippingFee}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  shippingFee: e.target.value 
                })}
                placeholder="Enter shipping fee"
              />
              {errors.shippingFee && (
                <p className="text-sm text-red-500">{errors.shippingFee}</p>
              )}
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddEditDialogOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                {selectedDetail ? "Update" : "Add"} Shipping
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the shipping detail
              for order #{selectedDetail?.orderId}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Shipping;
