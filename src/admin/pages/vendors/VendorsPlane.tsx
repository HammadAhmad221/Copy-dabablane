// import { useState } from 'react';
// import { Card } from "@/admin/components/ui/card";
// import { Button } from "@/admin/components/ui/button";
// import { Input } from "@/admin/components/ui/input";
// import { Label } from "@/admin/components/ui/label";
// import {
//     Select,
//     SelectContent,
//     SelectItem,
//     SelectTrigger,
//     SelectValue,
// } from "@/admin/components/ui/select";
// import {
//     Table,
//     TableBody,
//     TableCell,
//     TableHead,
//     TableHeader,
//     TableRow,
// } from "@/admin/components/ui/table";
// import {
//     Dialog,
//     DialogContent,
//     DialogDescription,
//     DialogFooter,
//     DialogHeader,
//     DialogTitle,
// } from "@/admin/components/ui/dialog";
// import { Plus, Edit, Trash2, Upload, Download, Eye, FileText } from "lucide-react";
// import toast from 'react-hot-toast';
// import {
//     DropdownMenu,
//     DropdownMenuContent,
//     DropdownMenuItem,
//     DropdownMenuTrigger,
// } from "@/admin/components/ui/dropdown-menu";

// interface VendorPlan {
//     id: string;
//     vendorName: string;
//     email: string;
//     planType: 'basic' | 'premium';
//     invoiceData?: string; // Store as data URL
//     fileName?: string;
//     startDate: string;
//     status: 'active' | 'inactive' | 'pending';
// }

// const VendorsPlane = () => {
//     const [isLoading, setIsLoading] = useState(false);
//     const [vendors, setVendors] = useState<VendorPlan[]>(() => {
//         try {
//             const savedVendors = localStorage.getItem('vendors');
//             if (!savedVendors) return [];
//             return JSON.parse(savedVendors);
//         } catch (error) {
//             console.error('Error loading vendors:', error);
//             return [];
//         }
//     });

//     const [isDialogOpen, setIsDialogOpen] = useState(false);
//     const [isPdfDialogOpen, setIsPdfDialogOpen] = useState(false);
//     const [selectedVendor, setSelectedVendor] = useState<VendorPlan | null>(null);
//     const [selectedInvoiceData, setSelectedInvoiceData] = useState<string>("");
//     const [formData, setFormData] = useState<{
//         vendorName: string;
//         email: string;
//         planType: 'basic' | 'premium';
//         startDate: string;
//         status: 'active' | 'inactive' | 'pending';
//         invoiceFile?: File;
//     }>({
//         vendorName: '',
//         email: '',
//         planType: 'basic',
//         startDate: new Date().toISOString().split('T')[0],
//         status: 'pending'
//     });

//     const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//         if (e.target.files && e.target.files[0]) {
//             const file = e.target.files[0];
//             // Check if file is PDF
//             if (file.type !== 'application/pdf') {
//                 toast.error('Please upload a PDF file');
//                 e.target.value = ''; // Reset input
//                 return;
//             }
//             setFormData(prev => ({
//                 ...prev,
//                 invoiceFile: file
//             }));
//         }
//     };

//     const handleOpenDialog = (vendor?: VendorPlan) => {
//         if (vendor) {
//             setSelectedVendor(vendor);
//             setFormData({
//                 vendorName: vendor.vendorName,
//                 email: vendor.email,
//                 planType: vendor.planType,
//                 startDate: vendor.startDate,
//                 status: vendor.status
//             });
//         } else {
//             setSelectedVendor(null);
//             setFormData({
//                 vendorName: '',
//                 email: '',
//                 planType: 'basic',
//                 startDate: new Date().toISOString().split('T')[0],
//                 status: 'pending'
//             });
//         }
//         setIsDialogOpen(true);
//     };

//     const handleSubmit = async () => {
//         try {
//             setIsLoading(true);

//             if (!formData.vendorName || !formData.email || !formData.planType) {
//                 toast.error('Please fill all required fields');
//                 return;
//             }

//             if (!selectedVendor && !formData.invoiceFile) {
//                 toast.error('Please upload an invoice PDF');
//                 return;
//             }

//             if (selectedVendor) {
//                 // Update existing vendor
//                 const updatedVendor: VendorPlan = {
//                     ...selectedVendor,
//                     vendorName: formData.vendorName,
//                     email: formData.email,
//                     planType: formData.planType,
//                     startDate: formData.startDate,
//                     status: formData.status
//                 };

//                 const updatedVendors = vendors.map(v =>
//                     v.id === selectedVendor.id ? updatedVendor : v
//                 );
//                 setVendors(updatedVendors);
//                 localStorage.setItem('vendors', JSON.stringify(updatedVendors));
//                 toast.success('Vendor plan updated successfully');
//             } else {
//                 // Create new vendor
//                 if (formData.invoiceFile) {
//                     const reader = new FileReader();

//                     reader.onload = function (e) {
//                         const dataUrl = e.target?.result as string;

//                         const newVendor: VendorPlan = {
//                             id: Date.now().toString(),
//                             vendorName: formData.vendorName,
//                             email: formData.email,
//                             planType: formData.planType,
//                             startDate: formData.startDate,
//                             status: formData.status,
//                             invoiceData: dataUrl,
//                             fileName: formData.invoiceFile?.name
//                         };

//                         const updatedVendors = [...vendors, newVendor];
//                         setVendors(updatedVendors);
//                         localStorage.setItem('vendors', JSON.stringify(updatedVendors));
//                         toast.success('Vendor plan created successfully');
//                         setIsDialogOpen(false);
//                     };

//                     reader.onerror = function () {
//                         toast.error('Error reading file');
//                         setIsLoading(false);
//                     };

//                     reader.readAsDataURL(formData.invoiceFile);
//                     return; // Exit early, the rest happens in onload
//                 }
//             }

//             setIsDialogOpen(false);
//         } catch (error) {
//             toast.error('Failed to submit vendor plan');
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     const handleDelete = (id: string) => {
//         const updatedVendors = vendors.filter(v => v.id !== id);
//         setVendors(updatedVendors);
//         localStorage.setItem('vendors', JSON.stringify(updatedVendors));
//         toast.success('Vendor plan deleted successfully');
//     };

//     const handleViewInvoice = (vendor: VendorPlan) => {
//         if (vendor.invoiceData) {
//             setSelectedInvoiceData(vendor.invoiceData);
//             setIsPdfDialogOpen(true);
//         } else {
//             toast.error('No invoice available for this vendor');
//         }
//     };

//     const handleDownloadInvoice = (vendor: VendorPlan) => {
//         if (vendor.invoiceData) {
//             try {
//                 // Create a temporary link to trigger download
//                 const link = document.createElement('a');
//                 link.href = vendor.invoiceData;
//                 link.download = vendor.fileName || `invoice-${vendor.vendorName}.pdf`;
//                 document.body.appendChild(link);
//                 link.click();
//                 document.body.removeChild(link);
//             } catch (error) {
//                 toast.error('Error downloading invoice');
//             }
//         } else {
//             toast.error('No invoice available for download');
//         }
//     };

//     const getStatusStyle = (status: VendorPlan['status']) => {
//         switch (status) {
//             case 'active':
//                 return 'bg-green-100 text-green-800';
//             case 'inactive':
//                 return 'bg-red-100 text-red-800';
//             case 'pending':
//                 return 'bg-yellow-100 text-yellow-800';
//             default:
//                 return 'bg-gray-100 text-gray-800';
//         }
//     };

//     return (
//         <div className="space-y-4 p-4">
//             <Card className="overflow-hidden">
//                 {/* Header */}
//                 <div className="p-3 sm:p-4 md:p-5 lg:p-6 bg-gradient-to-r from-[#00897B] to-[#00796B]">
//                     <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-between items-start sm:items-center">
//                         <div className="text-white w-full sm:w-auto">
//                             <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-2xl font-bold">Vendor Plans</h2>
//                             <p className="text-white/80 text-xs sm:text-sm md:text-base lg:text-base">Manage vendor subscriptions and plans</p>
//                         </div>
//                         <Button
//                             onClick={() => handleOpenDialog()}
//                             className="w-full sm:w-auto h-9 sm:h-10 bg-white text-[#00897B] hover:bg-gray-100"
//                             disabled={isLoading}
//                         >
//                             {isLoading ? (
//                                 <>
//                                     <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-[#00897B]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                                         <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                                         <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//                                     </svg>
//                                     Processing...
//                                 </>
//                             ) : (
//                                 <>
//                                     <Plus className="h-4 w-4 mr-2" />
//                                     <span className="hidden sm:inline">Add Vendor Plan</span>
//                                     <span className="sm:hidden">Add Plan</span>
//                                 </>
//                             )}
//                         </Button>
//                     </div>
//                 </div>

//                 {/* Search and Filter Section */}
//                 <div className="p-2 md:p-3 lg:p-4 space-y-3 sm:space-y-4">
//                     <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 lg:gap-4">
//                         <div className="w-full sm:w-[250px] md:w-[300px] lg:w-[350px] xl:w-[400px]">
//                             <Input
//                                 placeholder="Search vendors..."
//                                 className="w-full h-9 sm:h-10"
//                                 onChange={(e) => {
//                                     const searchValue = e.target.value.toLowerCase();
//                                     if (searchValue === '') {
//                                         // Restore original data from localStorage
//                                         const savedVendors = localStorage.getItem('vendors');
//                                         if (savedVendors) {
//                                             setVendors(JSON.parse(savedVendors));
//                                         }
//                                     } else {
//                                         const filtered = vendors.filter(vendor =>
//                                             vendor.vendorName.toLowerCase().includes(searchValue) ||
//                                             vendor.email.toLowerCase().includes(searchValue)
//                                         );
//                                         setVendors(filtered);
//                                     }
//                                 }}
//                             />
//                         </div>
//                         <Select defaultValue="all">
//                             <SelectTrigger className="w-full sm:w-[140px] md:w-[160px] lg:w-[180px] h-9 sm:h-10">
//                                 <SelectValue placeholder="Filter by status" />
//                             </SelectTrigger>
//                             <SelectContent>
//                                 <SelectItem value="all">All Status</SelectItem>
//                                 <SelectItem value="active">Active</SelectItem>
//                                 <SelectItem value="inactive">Inactive</SelectItem>
//                                 <SelectItem value="pending">Pending</SelectItem>
//                             </SelectContent>
//                         </Select>
//                     </div>
//                 </div>

//                 {/* Desktop/Tablet Table View */}
//                 <div className="hidden sm:block p-2 md:p-3 lg:p-4">
//                     <div className="rounded-md border overflow-x-auto">
//                         <Table className="min-w-[700px] md:min-w-[768px] lg:min-w-[1024px] xl:min-w-[1200px] 2xl:w-full">
//                             <TableHeader>
//                                 <TableRow>
//                                     <TableHead className="whitespace-nowrap w-[16%] md:w-[18%] lg:w-[20%]">Vendor Name</TableHead>
//                                     <TableHead className="whitespace-nowrap w-[20%] md:w-[22%] lg:w-[25%]">Email</TableHead>
//                                     <TableHead className="whitespace-nowrap w-[12%] md:w-[12%] lg:w-[12%]">Plan Type</TableHead>
//                                     <TableHead className="whitespace-nowrap w-[16%] md:w-[15%] lg:w-[15%]">Start Date</TableHead>
//                                     <TableHead className="whitespace-nowrap w-[12%] md:w-[12%] lg:w-[12%]">Status</TableHead>
//                                     <TableHead className="whitespace-nowrap w-[10%] md:w-[8%] lg:w-[6%]">Invoice</TableHead>
//                                     <TableHead className="text-right whitespace-nowrap w-[14%] md:w-[13%] lg:w-[10%]">Actions</TableHead>
//                                 </TableRow>
//                             </TableHeader>
//                             <TableBody>
//                                 {vendors.map((vendor) => (
//                                     <TableRow key={vendor.id} className="group hover:bg-gray-50/50">
//                                         <TableCell className="font-medium py-3 md:py-4">{vendor.vendorName}</TableCell>
//                                         <TableCell className="py-3 md:py-4 text-sm md:text-base">{vendor.email}</TableCell>
//                                         <TableCell className="capitalize py-3 md:py-4">{vendor.planType}</TableCell>
//                                         <TableCell className="py-3 md:py-4 text-sm md:text-base">{vendor.startDate}</TableCell>
//                                         <TableCell className="py-3 md:py-4">
//                                             <span className={`px-2 py-1 rounded-full text-xs md:text-sm ${getStatusStyle(vendor.status)}`}>
//                                                 {vendor.status}
//                                             </span>
//                                         </TableCell>
//                                         <TableCell>
//                                             <DropdownMenu>
//                                                 <DropdownMenuTrigger asChild>
//                                                     <Button
//                                                         variant="outline"
//                                                         size="icon"
//                                                         className="h-8 w-8"
//                                                     >
//                                                         <FileText className="h-4 w-4" />
//                                                     </Button>
//                                                 </DropdownMenuTrigger>
//                                                 <DropdownMenuContent align="end">
//                                                     <DropdownMenuItem
//                                                         onClick={() => handleViewInvoice(vendor)}
//                                                         className="cursor-pointer"
//                                                     >
//                                                         <Eye className="h-4 w-4 mr-2" />
//                                                         View Invoice
//                                                     </DropdownMenuItem>
//                                                     <DropdownMenuItem
//                                                         onClick={() => handleDownloadInvoice(vendor)}
//                                                         className="cursor-pointer"
//                                                     >
//                                                         <Download className="h-4 w-4 mr-2" />
//                                                         Download
//                                                     </DropdownMenuItem>
//                                                 </DropdownMenuContent>
//                                             </DropdownMenu>
//                                         </TableCell>
//                                         <TableCell>
//                                             <div className="flex gap-2 justify-end">
//                                                 <Button
//                                                     variant="outline"
//                                                     size="icon"
//                                                     className="h-8 w-8"
//                                                     onClick={() => handleOpenDialog(vendor)}
//                                                 >
//                                                     <Edit className="h-4 w-4" />
//                                                 </Button>
//                                                 <Button
//                                                     variant="destructive"
//                                                     size="icon"
//                                                     className="h-8 w-8"
//                                                     onClick={() => handleDelete(vendor.id)}
//                                                 >
//                                                     <Trash2 className="h-4 w-4" />
//                                                 </Button>
//                                             </div>
//                                         </TableCell>
//                                     </TableRow>
//                                 ))}
//                             </TableBody>
//                         </Table>
//                     </div>
//                 </div>

//                 {/* Mobile Card View */}
//                 <div className="sm:hidden p-2 space-y-3">
//                     {vendors.map((vendor) => (
//                         <Card key={vendor.id} className="p-3">
//                             <div className="space-y-2.5">
//                                 <div className="flex items-start justify-between gap-2">
//                                     <div className="min-w-0 flex-1">
//                                         <h3 className="font-medium text-sm truncate">{vendor.vendorName}</h3>
//                                         <p className="text-xs text-gray-500 truncate">{vendor.email}</p>
//                                     </div>
//                                     <span className={`shrink-0 px-2 py-1 rounded-full text-[11px] ${getStatusStyle(vendor.status)}`}>
//                                         {vendor.status}
//                                     </span>
//                                 </div>

//                                 <div className="grid grid-cols-2 gap-2 text-xs">
//                                     <div>
//                                         <p className="text-gray-500">Plan Type</p>
//                                         <p className="font-medium capitalize">{vendor.planType}</p>
//                                     </div>
//                                     <div>
//                                         <p className="text-gray-500">Start Date</p>
//                                         <p className="font-medium">{vendor.startDate}</p>
//                                     </div>
//                                 </div>

//                                 <div className="grid grid-cols-3 gap-1.5">
//                                     <DropdownMenu>
//                                         <DropdownMenuTrigger asChild>
//                                             <Button
//                                                 variant="outline"
//                                                 size="icon"
//                                                 className="h-8 w-full"
//                                             >
//                                                 <FileText className="h-4 w-4" />
//                                             </Button>
//                                         </DropdownMenuTrigger>
//                                         <DropdownMenuContent align="end">
//                                             <DropdownMenuItem
//                                                 onClick={() => handleViewInvoice(vendor)}
//                                                 className="cursor-pointer"
//                                             >
//                                                 <Eye className="h-4 w-4 mr-2" />
//                                                 View Invoice
//                                             </DropdownMenuItem>
//                                             <DropdownMenuItem
//                                                 onClick={() => handleDownloadInvoice(vendor)}
//                                                 className="cursor-pointer"
//                                             >
//                                                 <Download className="h-4 w-4 mr-2" />
//                                                 Download
//                                             </DropdownMenuItem>
//                                         </DropdownMenuContent>
//                                     </DropdownMenu>
//                                     <Button
//                                         variant="outline"
//                                         size="icon"
//                                         className="h-8 w-full"
//                                         onClick={() => handleOpenDialog(vendor)}
//                                     >
//                                         <Edit className="h-4 w-4" />
//                                     </Button>
//                                     <Button
//                                         variant="destructive"
//                                         size="icon"
//                                         className="h-8 w-full"
//                                         onClick={() => handleDelete(vendor.id)}
//                                     >
//                                         <Trash2 className="h-4 w-4" />
//                                     </Button>
//                                 </div>
//                             </div>
//                         </Card>
//                     ))}
//                 </div>
//             </Card>

//             {/* Add/Edit Dialog */}
//             <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
//                 <DialogContent className="max-w-md">
//                     <DialogHeader>
//                         <DialogTitle>{selectedVendor ? 'Edit Vendor Plan' : 'Add New Vendor Plan'}</DialogTitle>
//                         <DialogDescription>
//                             {selectedVendor
//                                 ? 'Update the vendor\'s plan details'
//                                 : 'Enter the vendor\'s information and select their plan'
//                             }
//                         </DialogDescription>
//                     </DialogHeader>

//                     <div className="space-y-4">
//                         <div>
//                             <Label htmlFor="vendorName">Vendor Name *</Label>
//                             <Input
//                                 id="vendorName"
//                                 value={formData.vendorName}
//                                 onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
//                                 placeholder="Enter vendor name"
//                             />
//                         </div>

//                         <div>
//                             <Label htmlFor="email">Email *</Label>
//                             <Input
//                                 id="email"
//                                 type="email"
//                                 value={formData.email}
//                                 onChange={(e) => setFormData({ ...formData, email: e.target.value })}
//                                 placeholder="vendor@example.com"
//                             />
//                         </div>

//                         <div>
//                             <Label htmlFor="planType">Plan Type *</Label>
//                             <Select
//                                 value={formData.planType}
//                                 onValueChange={(value: 'basic' | 'premium') =>
//                                     setFormData({ ...formData, planType: value })
//                                 }
//                             >
//                                 <SelectTrigger>
//                                     <SelectValue placeholder="Select a plan" />
//                                 </SelectTrigger>
//                                 <SelectContent>
//                                     <SelectItem value="basic">Basic Plan</SelectItem>
//                                     <SelectItem value="premium">Premium Plan</SelectItem>
//                                 </SelectContent>
//                             </Select>
//                         </div>

//                         <div>
//                             <Label htmlFor="startDate">Start Date *</Label>
//                             <Input
//                                 id="startDate"
//                                 type="date"
//                                 value={formData.startDate}
//                                 onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
//                             />
//                         </div>

//                         <div>
//                             <Label htmlFor="status">Status *</Label>
//                             <Select
//                                 value={formData.status}
//                                 onValueChange={(value: 'active' | 'inactive' | 'pending') =>
//                                     setFormData({ ...formData, status: value })
//                                 }
//                             >
//                                 <SelectTrigger>
//                                     <SelectValue placeholder="Select status" />
//                                 </SelectTrigger>
//                                 <SelectContent>
//                                     <SelectItem value="active">Active</SelectItem>
//                                     <SelectItem value="inactive">Inactive</SelectItem>
//                                     <SelectItem value="pending">Pending</SelectItem>
//                                 </SelectContent>
//                             </Select>
//                         </div>

//                         {!selectedVendor && (
//                             <div>
//                                 <Label htmlFor="invoice">Upload Invoice PDF *</Label>
//                                 <div className="mt-2">
//                                     <Input
//                                         id="invoice"
//                                         type="file"
//                                         onChange={handleFileChange}
//                                         accept=".pdf"
//                                         className="hidden"
//                                     />
//                                     <Button
//                                         type="button"
//                                         variant="outline"
//                                         className="w-full"
//                                         onClick={() => document.getElementById('invoice')?.click()}
//                                     >
//                                         <Upload className="h-4 w-4 mr-2" />
//                                         {formData.invoiceFile ? formData.invoiceFile.name : 'Choose PDF File'}
//                                     </Button>
//                                     {formData.invoiceFile && (
//                                         <p className="text-xs text-green-600 mt-1">
//                                             Selected: {formData.invoiceFile.name}
//                                         </p>
//                                     )}
//                                 </div>
//                             </div>
//                         )}
//                     </div>

//                     <DialogFooter>
//                         <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
//                             Cancel
//                         </Button>
//                         <Button onClick={handleSubmit} className="bg-[#00897B] hover:bg-[#00796B]">
//                             {selectedVendor ? 'Update' : 'Add'} Vendor Plan
//                         </Button>
//                     </DialogFooter>
//                 </DialogContent>
//             </Dialog>

//             {/* PDF Preview Dialog */}
//             <Dialog open={isPdfDialogOpen} onOpenChange={setIsPdfDialogOpen}>
//                 <DialogContent className="max-w-4xl h-[80vh]">
//                     <DialogHeader>
//                         <DialogTitle>Invoice Preview</DialogTitle>
//                     </DialogHeader>
//                     <div className="flex-1 w-full h-full min-h-[60vh]">
//                         {selectedInvoiceData ? (
//                             <iframe
//                                 src={selectedInvoiceData}
//                                 className="w-full h-full rounded-md border"
//                                 title="Invoice Preview"
//                             />
//                         ) : (
//                             <div className="flex items-center justify-center h-full">
//                                 <p className="text-gray-500">No invoice available</p>
//                             </div>
//                         )}
//                     </div>
//                     <DialogFooter className="gap-2">
//                         <Button
//                             variant="outline"
//                             onClick={() => setIsPdfDialogOpen(false)}
//                         >
//                             Close
//                         </Button>
//                         <Button
//                             onClick={() => {
//                                 if (selectedInvoiceData) {
//                                     const link = document.createElement('a');
//                                     link.href = selectedInvoiceData;
//                                     link.download = 'invoice-preview.pdf';
//                                     document.body.appendChild(link);
//                                     link.click();
//                                     document.body.removeChild(link);
//                                 }
//                             }}
//                         >
//                             <Download className="h-4 w-4 mr-2" />
//                             Download
//                         </Button>
//                     </DialogFooter>
//                 </DialogContent>
//             </Dialog>
//         </div>
//     );
// };

// export default VendorsPlane;


import { useState } from 'react';
import { Card } from "@/admin/components/ui/card";
import { Button } from "@/admin/components/ui/button";
import { Input } from "@/admin/components/ui/input";
import { Label } from "@/admin/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/admin/components/ui/select";
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
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/admin/components/ui/dialog";
import { Plus, Edit, Trash2, Upload, Download, Eye, FileText } from "lucide-react";
import toast from 'react-hot-toast';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/admin/components/ui/dropdown-menu";

interface VendorPlan {
    id: string;
    vendorName: string;
    email: string;
    planType: 'basic' | 'premium';
    invoiceData?: string;
    fileName?: string;
    startDate: string;
    status: 'active' | 'inactive' | 'pending';
}

const VendorsPlane = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [vendors, setVendors] = useState<VendorPlan[]>(() => {
        try {
            const savedVendors = localStorage.getItem('vendors');
            if (!savedVendors) return [];
            return JSON.parse(savedVendors);
        } catch (error) {
            console.error('Error loading vendors:', error);
            return [];
        }
    });

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isPdfDialogOpen, setIsPdfDialogOpen] = useState(false);
    const [selectedVendor, setSelectedVendor] = useState<VendorPlan | null>(null);
    const [selectedInvoiceData, setSelectedInvoiceData] = useState<string>("");
    const [formData, setFormData] = useState<{
        vendorName: string;
        email: string;
        planType: 'basic' | 'premium';
        startDate: string;
        status: 'active' | 'inactive' | 'pending';
        invoiceFile?: File;
    }>({
        vendorName: '',
        email: '',
        planType: 'basic',
        startDate: new Date().toISOString().split('T')[0],
        status: 'pending'
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.type !== 'application/pdf') {
                toast.error('Please upload a PDF file');
                e.target.value = '';
                return;
            }
            setFormData(prev => ({
                ...prev,
                invoiceFile: file
            }));
        }
    };

    const handleOpenDialog = (vendor?: VendorPlan) => {
        if (vendor) {
            setSelectedVendor(vendor);
            setFormData({
                vendorName: vendor.vendorName,
                email: vendor.email,
                planType: vendor.planType,
                startDate: vendor.startDate,
                status: vendor.status
            });
        } else {
            setSelectedVendor(null);
            setFormData({
                vendorName: '',
                email: '',
                planType: 'basic',
                startDate: new Date().toISOString().split('T')[0],
                status: 'pending'
            });
        }
        setIsDialogOpen(true);
    };

    const handleSubmit = async () => {
        try {
            setIsLoading(true);

            if (!formData.vendorName?.trim() || !formData.email?.trim() || !formData.planType) {
                toast.error('Please fill all required fields');
                return;
            }

            if (!selectedVendor && !formData.invoiceFile) {
                toast.error('Please upload an invoice PDF');
                return;
            }

            if (selectedVendor) {
                const updatedVendor: VendorPlan = {
                    ...selectedVendor,
                    vendorName: formData.vendorName,
                    email: formData.email,
                    planType: formData.planType,
                    startDate: formData.startDate,
                    status: formData.status
                };

                const updatedVendors = vendors.map(v =>
                    v.id === selectedVendor.id ? updatedVendor : v
                );
                setVendors(updatedVendors);
                localStorage.setItem('vendors', JSON.stringify(updatedVendors));
                toast.success('Vendor plan updated successfully');
                setIsDialogOpen(false);
            } else {
                if (formData.invoiceFile) {
                    const reader = new FileReader();

                    reader.onload = function (e) {
                        const dataUrl = e.target?.result as string;

                        const newVendor: VendorPlan = {
                            id: Date.now().toString(),
                            vendorName: formData.vendorName,
                            email: formData.email,
                            planType: formData.planType,
                            startDate: formData.startDate,
                            status: formData.status,
                            invoiceData: dataUrl,
                            fileName: formData.invoiceFile?.name
                        };

                        const updatedVendors = [...vendors, newVendor];
                        setVendors(updatedVendors);
                        localStorage.setItem('vendors', JSON.stringify(updatedVendors));
                        toast.success('Vendor plan created successfully');
                        setIsDialogOpen(false);
                    };

                    reader.onerror = function () {
                        toast.error('Error reading file');
                        setIsLoading(false);
                    };

                    reader.readAsDataURL(formData.invoiceFile);
                    return;
                }
            }
        } catch (error) {
            toast.error('Failed to submit vendor plan');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = (id: string) => {
        const updatedVendors = vendors.filter(v => v.id !== id);
        setVendors(updatedVendors);
        localStorage.setItem('vendors', JSON.stringify(updatedVendors));
        toast.success('Vendor plan deleted successfully');
    };

    const handleViewInvoice = (vendor: VendorPlan) => {
        if (vendor.invoiceData) {
            setSelectedInvoiceData(vendor.invoiceData);
            setIsPdfDialogOpen(true);
        } else {
            toast.error('No invoice available for this vendor');
        }
    };

    const handleDownloadInvoice = (vendor: VendorPlan) => {
        if (vendor.invoiceData) {
            try {
                const link = document.createElement('a');
                link.href = vendor.invoiceData;
                link.download = vendor.fileName || `invoice-${vendor.vendorName}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } catch (error) {
                toast.error('Error downloading invoice');
            }
        } else {
            toast.error('No invoice available for download');
        }
    };

    const getStatusStyle = (status: VendorPlan['status']) => {
        switch (status) {
            case 'active':
                return 'bg-green-100 text-green-800';
            case 'inactive':
                return 'bg-red-100 text-red-800';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="space-y-4 p-3 sm:p-4 md:p-6">
            <Card className="overflow-hidden">
                {/* Header */}
                <div className="p-4 sm:p-5 md:p-6 bg-gradient-to-r from-[#00897B] to-[#00796B]">
                    <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-between items-start sm:items-center">
                        <div className="text-white flex-1 min-w-0">
                            <h2 className="text-lg sm:text-xl md:text-2xl font-bold truncate">Vendor Plans</h2>
                            <p className="text-white/80 text-sm sm:text-base mt-1">Manage vendor subscriptions and plans</p>
                        </div>
                        <Button
                            onClick={() => handleOpenDialog()}
                            className="w-full sm:w-auto h-10 sm:h-11 bg-white text-[#00897B] hover:bg-gray-100 shrink-0 mt-2 sm:mt-0"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <div className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-[#00897B]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span className="hidden sm:inline">Processing...</span>
                                    <span className="sm:hidden">Processing</span>
                                </div>
                            ) : (
                                <div className="flex items-center">
                                    <Plus className="h-4 w-4 mr-2" />
                                    <span className="hidden sm:inline">Add Vendor Plan</span>
                                    <span className="sm:hidden">Add Plan</span>
                                </div>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Search and Filter Section */}
                <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                        <div className="flex-1 min-w-0">
                            <Input
                                placeholder="Search vendors..."
                                className="w-full h-10 sm:h-11 text-sm sm:text-base"
                                onChange={(e) => {
                                    const searchValue = e.target.value.toLowerCase();
                                    if (searchValue === '') {
                                        const savedVendors = localStorage.getItem('vendors');
                                        if (savedVendors) {
                                            setVendors(JSON.parse(savedVendors));
                                        }
                                    } else {
                                        const filtered = vendors.filter(vendor =>
                                            vendor.vendorName.toLowerCase().includes(searchValue) ||
                                            vendor.email.toLowerCase().includes(searchValue)
                                        );
                                        setVendors(filtered);
                                    }
                                }}
                            />
                        </div>
                        <Select defaultValue="all">
                            <SelectTrigger className="w-full sm:w-[140px] h-10 sm:h-11 text-sm sm:text-base">
                                <SelectValue placeholder="Filter status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Desktop/Tablet Table View */}
                <div className="hidden sm:block p-3 sm:p-4 md:p-6">
                    <div className="rounded-lg border overflow-hidden">
                        <div className="overflow-x-auto">
                            <Table className="min-w-full">
                                <TableHeader>
                                    <TableRow className="bg-gray-50/80 hover:bg-gray-50">
                                        <TableHead className="w-[20%] py-3 text-xs sm:text-sm font-medium text-gray-700">Vendor Name</TableHead>
                                        <TableHead className="w-[25%] py-3 text-xs sm:text-sm font-medium text-gray-700">Email</TableHead>
                                        <TableHead className="w-[12%] py-3 text-xs sm:text-sm font-medium text-gray-700">Plan Type</TableHead>
                                        <TableHead className="w-[15%] py-3 text-xs sm:text-sm font-medium text-gray-700">Start Date</TableHead>
                                        <TableHead className="w-[12%] py-3 text-xs sm:text-sm font-medium text-gray-700">Status</TableHead>
                                        <TableHead className="w-[8%] py-3 text-xs sm:text-sm font-medium text-gray-700">Invoice</TableHead>
                                        <TableHead className="w-[8%] py-3 text-xs sm:text-sm font-medium text-gray-700 text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {vendors.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="py-8 text-center text-gray-500">
                                                No vendor plans found. Click "Add Vendor Plan" to get started.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        vendors.map((vendor) => (
                                            <TableRow key={vendor.id} className="group hover:bg-gray-50/50 border-b">
                                                <TableCell className="py-3">
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-medium text-gray-900 truncate">{vendor.vendorName}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-3">
                                                    <p className="text-sm text-gray-600 truncate">{vendor.email}</p>
                                                </TableCell>
                                                <TableCell className="py-3">
                                                    <span className="text-sm capitalize text-gray-700">{vendor.planType}</span>
                                                </TableCell>
                                                <TableCell className="py-3">
                                                    <p className="text-sm text-gray-600">{vendor.startDate}</p>
                                                </TableCell>
                                                <TableCell className="py-3">
                                                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getStatusStyle(vendor.status)}`}>
                                                        {vendor.status}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="py-3">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button
                                                                variant="outline"
                                                                size="icon"
                                                                className="h-8 w-8 shrink-0"
                                                            >
                                                                <FileText className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-48">
                                                            <DropdownMenuItem
                                                                onClick={() => handleViewInvoice(vendor)}
                                                                className="cursor-pointer text-sm"
                                                            >
                                                                <Eye className="h-4 w-4 mr-2" />
                                                                View Invoice
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => handleDownloadInvoice(vendor)}
                                                                className="cursor-pointer text-sm"
                                                            >
                                                                <Download className="h-4 w-4 mr-2" />
                                                                Download
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                                <TableCell className="py-3">
                                                    <div className="flex gap-1 justify-end">
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="h-8 w-8 shrink-0"
                                                            onClick={() => handleOpenDialog(vendor)}
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="destructive"
                                                            size="icon"
                                                            className="h-8 w-8 shrink-0"
                                                            onClick={() => handleDelete(vendor.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>

                {/* Mobile Card View */}
                <div className="sm:hidden p-3 space-y-3">
                    {vendors.length === 0 ? (
                        <Card className="p-6 text-center">
                            <p className="text-gray-500">No vendor plans found.</p>
                            <Button
                                onClick={() => handleOpenDialog()}
                                className="mt-3 bg-[#00897B] hover:bg-[#00796B]"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Vendor Plan
                            </Button>
                        </Card>
                    ) : (
                        vendors.map((vendor) => (
                            <Card key={vendor.id} className="p-4">
                                <div className="space-y-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0 flex-1">
                                            <h3 className="font-semibold text-sm text-gray-900 truncate">{vendor.vendorName}</h3>
                                            <p className="text-xs text-gray-500 truncate mt-0.5">{vendor.email}</p>
                                        </div>
                                        <span className={`shrink-0 px-2 py-1 rounded-full text-[10px] font-medium ${getStatusStyle(vendor.status)}`}>
                                            {vendor.status}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 text-xs">
                                        <div>
                                            <p className="text-gray-500 text-[10px] uppercase tracking-wide">Plan Type</p>
                                            <p className="font-medium text-sm capitalize mt-0.5">{vendor.planType}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500 text-[10px] uppercase tracking-wide">Start Date</p>
                                            <p className="font-medium text-sm mt-0.5">{vendor.startDate}</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 pt-1">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex-1 h-9 text-xs"
                                                >
                                                    <FileText className="h-3.5 w-3.5 mr-1.5" />
                                                    Invoice
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="start" className="w-48">
                                                <DropdownMenuItem
                                                    onClick={() => handleViewInvoice(vendor)}
                                                    className="cursor-pointer text-xs"
                                                >
                                                    <Eye className="h-3.5 w-3.5 mr-2" />
                                                    View Invoice
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleDownloadInvoice(vendor)}
                                                    className="cursor-pointer text-xs"
                                                >
                                                    <Download className="h-3.5 w-3.5 mr-2" />
                                                    Download
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-9 w-9 shrink-0"
                                            onClick={() => handleOpenDialog(vendor)}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            size="icon"
                                            className="h-9 w-9 shrink-0"
                                            onClick={() => handleDelete(vendor.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))
                    )}
                </div>
            </Card>

            {/* Add/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-md w-[95vw] sm:w-full mx-auto">
                    <DialogHeader className="space-y-3">
                        <DialogTitle className="text-lg sm:text-xl">
                            {selectedVendor ? 'Edit Vendor Plan' : 'Add New Vendor Plan'}
                        </DialogTitle>
                        <DialogDescription className="text-sm sm:text-base">
                            {selectedVendor
                                ? 'Update the vendor\'s plan details'
                                : 'Enter the vendor\'s information and select their plan'
                            }
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1">
                        <div className="space-y-2">
                            <Label htmlFor="vendorName" className="text-sm font-medium">Vendor Name *</Label>
                            <Input
                                id="vendorName"
                                value={formData.vendorName}
                                onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
                                placeholder="Enter vendor name"
                                className="h-10 text-sm"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-medium">Email *</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="vendor@example.com"
                                className="h-10 text-sm"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="planType" className="text-sm font-medium">Plan Type *</Label>
                            <Select
                                value={formData.planType}
                                onValueChange={(value: 'basic' | 'premium') =>
                                    setFormData({ ...formData, planType: value })
                                }
                            >
                                <SelectTrigger className="h-10 text-sm">
                                    <SelectValue placeholder="Select a plan" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="basic" className="text-sm">Basic Plan</SelectItem>
                                    <SelectItem value="premium" className="text-sm">Premium Plan</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="startDate" className="text-sm font-medium">Start Date *</Label>
                            <Input
                                id="startDate"
                                type="date"
                                value={formData.startDate}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                className="h-10 text-sm"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="status" className="text-sm font-medium">Status *</Label>
                            <Select
                                value={formData.status}
                                onValueChange={(value: 'active' | 'inactive' | 'pending') =>
                                    setFormData({ ...formData, status: value })
                                }
                            >
                                <SelectTrigger className="h-10 text-sm">
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active" className="text-sm">Active</SelectItem>
                                    <SelectItem value="inactive" className="text-sm">Inactive</SelectItem>
                                    <SelectItem value="pending" className="text-sm">Pending</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {!selectedVendor && (
                            <div className="space-y-2">
                                <Label htmlFor="invoice" className="text-sm font-medium">Upload Invoice PDF *</Label>
                                <div className="space-y-2">
                                    <Input
                                        id="invoice"
                                        type="file"
                                        onChange={handleFileChange}
                                        accept=".pdf"
                                        className="hidden"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full h-10 text-sm"
                                        onClick={() => document.getElementById('invoice')?.click()}
                                    >
                                        <Upload className="h-4 w-4 mr-2" />
                                        {formData.invoiceFile ? formData.invoiceFile.name : 'Choose PDF File'}
                                    </Button>
                                    {formData.invoiceFile && (
                                        <p className="text-xs text-green-600">
                                            Selected: {formData.invoiceFile.name}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="gap-2 sm:gap-3 mt-6">
                        <Button
                            variant="outline"
                            onClick={() => setIsDialogOpen(false)}
                            className="flex-1 sm:flex-none h-10 text-sm"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            className="flex-1 sm:flex-none h-10 text-sm bg-[#00897B] hover:bg-[#00796B]"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Processing...' : (selectedVendor ? 'Update' : 'Add') + ' Vendor Plan'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* PDF Preview Dialog */}
            <Dialog open={isPdfDialogOpen} onOpenChange={setIsPdfDialogOpen}>
                <DialogContent className="max-w-4xl w-[95vw] h-[90vh] sm:h-[80vh] mx-auto p-0">
                    <DialogHeader className="p-4 sm:p-6 border-b">
                        <DialogTitle className="text-lg sm:text-xl">Invoice Preview</DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 p-2 sm:p-4">
                        {selectedInvoiceData ? (
                            <iframe
                                src={selectedInvoiceData}
                                className="w-full h-full min-h-[50vh] rounded-md border-0"
                                title="Invoice Preview"
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full min-h-[50vh]">
                                <p className="text-gray-500 text-sm sm:text-base">No invoice available</p>
                            </div>
                        )}
                    </div>
                    <DialogFooter className="p-4 border-t gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setIsPdfDialogOpen(false)}
                            className="flex-1 sm:flex-none h-10 text-sm"
                        >
                            Close
                        </Button>
                        <Button
                            onClick={() => {
                                if (selectedInvoiceData) {
                                    const link = document.createElement('a');
                                    link.href = selectedInvoiceData;
                                    link.download = 'invoice-preview.pdf';
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                }
                            }}
                            className="flex-1 sm:flex-none h-10 text-sm"
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default VendorsPlane;
