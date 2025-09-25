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
import { format } from "date-fns";
import { 
  EyeIcon, 
  TrashIcon, 
  PencilIcon, 
  PlusIcon, 
  DownloadIcon,
  TagIcon 
} from "lucide-react";
import { Link } from "react-router-dom";

interface Merchant {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  offersCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Mock data
const mockMerchants: Merchant[] = [
  {
    id: 1,
    name: "Merchant 1",
    email: "merchant1@example.com",
    phone: "+1234567890",
    address: "123 Main St",
    offersCount: 5,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  // Add more mock data as needed
];

type FormData = {
  name: string;
  email: string;
  phone: string;
  address: string;
};

const Merchants = () => {
  const [merchants, setMerchants] = useState<Merchant[]>(mockMerchants);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const itemsPerPage = 5;

  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePhone = (phone: string) => {
    return /^\+?[\d\s-]{10,}$/.test(phone);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validation
    if (!formData.name.trim()) {
      setErrors(prev => ({ ...prev, name: "Name is required" }));
      return;
    }

    if (!formData.email || !validateEmail(formData.email)) {
      setErrors(prev => ({ ...prev, email: "Valid email is required" }));
      return;
    }

    if (!formData.phone || !validatePhone(formData.phone)) {
      setErrors(prev => ({ ...prev, phone: "Valid phone number is required" }));
      return;
    }

    // Check for duplicate name
    const isDuplicateName = merchants.some(
      merchant => 
        merchant.name.toLowerCase() === formData.name.toLowerCase() &&
        merchant.id !== selectedMerchant?.id
    );

    if (isDuplicateName) {
      setErrors(prev => ({ ...prev, name: "Merchant name must be unique" }));
      return;
    }

    if (selectedMerchant) {
      // Update existing merchant
      setMerchants(merchants.map(merchant =>
        merchant.id === selectedMerchant.id
          ? {
              ...merchant,
              name: formData.name,
              email: formData.email,
              phone: formData.phone,
              address: formData.address,
              updatedAt: new Date(),
            }
          : merchant
      ));
    } else {
      // Add new merchant
      setMerchants([
        ...merchants,
        {
          id: Math.max(...merchants.map(m => m.id)) + 1,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          offersCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
    }

    setIsAddDialogOpen(false);
    resetForm();
  };

  const handleDelete = (id: number) => {
    setMerchants(merchants.filter(merchant => merchant.id !== id));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      address: "",
    });
    setSelectedMerchant(null);
    setErrors({});
  };

  const handleExport = () => {
    const csvRows = [];
    
    // Add headers
    csvRows.push([
      'ID',
      'Name',
      'Email',
      'Phone',
      'Address',
      'Offers Count',
      'Created At',
      'Updated At'
    ].join(','));

    // Add data rows
    filteredMerchants.forEach(merchant => {
      const row = [
        merchant.id,
        `"${merchant.name}"`,
        merchant.email,
        merchant.phone,
        `"${merchant.address}"`,
        merchant.offersCount,
        format(merchant.createdAt, "PP"),
        format(merchant.updatedAt, "PP")
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', `merchants_${format(new Date(), "yyyy-MM-dd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredMerchants = merchants.filter(merchant =>
    merchant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    merchant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    merchant.phone.includes(searchTerm) ||
    merchant.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedMerchants = filteredMerchants.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Merchants Management</h2>
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={handleExport}
              >
                <DownloadIcon className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button onClick={() => {
                resetForm();
                setIsAddDialogOpen(true);
              }}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Merchant
              </Button>
            </div>
          </div>

          <Input
            placeholder="Search merchants..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Offers</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Updated At</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedMerchants.map((merchant) => (
                  <TableRow key={merchant.id}>
                    <TableCell>{merchant.id}</TableCell>
                    <TableCell>{merchant.name}</TableCell>
                    <TableCell>{merchant.email}</TableCell>
                    <TableCell>{merchant.phone}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {merchant.address}
                    </TableCell>
                    <TableCell>
                      <Link 
                        to={`/admin/merchants/${merchant.id}/offers`}
                        className="flex items-center text-blue-600 hover:text-blue-800"
                      >
                        <TagIcon className="h-4 w-4 mr-1" />
                        {merchant.offersCount}
                      </Link>
                    </TableCell>
                    <TableCell>{format(merchant.createdAt, "PP")}</TableCell>
                    <TableCell>{format(merchant.updatedAt, "PP")}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setSelectedMerchant(merchant);
                            setIsViewDialogOpen(true);
                          }}
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setSelectedMerchant(merchant);
                            setFormData({
                              name: merchant.name,
                              email: merchant.email,
                              phone: merchant.phone,
                              address: merchant.address,
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
                              <AlertDialogTitle>Delete Merchant</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this merchant?
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(merchant.id)}
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
                Math.min(Math.ceil(filteredMerchants.length / itemsPerPage), prev + 1)
              )}
              disabled={currentPage === Math.ceil(filteredMerchants.length / itemsPerPage)}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      {/* Add/Edit Merchant Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedMerchant ? "Edit Merchant" : "Add New Merchant"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label>Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter merchant name"
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <label>Email</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter email address"
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <label>Phone</label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Enter phone number"
              />
              {errors.phone && (
                <p className="text-sm text-red-500">{errors.phone}</p>
              )}
            </div>

            <div className="space-y-2">
              <label>Address</label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Enter address"
              />
            </div>

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
                {selectedMerchant ? "Update" : "Add"} Merchant
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Merchant Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>View Merchant</DialogTitle>
          </DialogHeader>
          {selectedMerchant && (
            <div className="space-y-4">
              <div>
                <label className="font-semibold">Name</label>
                <p>{selectedMerchant.name}</p>
              </div>
              <div>
                <label className="font-semibold">Email</label>
                <p>{selectedMerchant.email}</p>
              </div>
              <div>
                <label className="font-semibold">Phone</label>
                <p>{selectedMerchant.phone}</p>
              </div>
              <div>
                <label className="font-semibold">Address</label>
                <p>{selectedMerchant.address}</p>
              </div>
              <div>
                <label className="font-semibold">Offers Count</label>
                <p>{selectedMerchant.offersCount}</p>
              </div>
              <div>
                <label className="font-semibold">Created At</label>
                <p>{format(selectedMerchant.createdAt, "PPp")}</p>
              </div>
              <div>
                <label className="font-semibold">Updated At</label>
                <p>{format(selectedMerchant.updatedAt, "PPp")}</p>
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

export default Merchants;
