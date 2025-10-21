import { useState, useEffect } from 'react';
import { vendorPlanService, VendorPlan } from '@/admin/lib/api/vendor-plans';
import { toast } from 'react-hot-toast';
import { Card } from "@/admin/components/ui/card";
import { Button } from "@/admin/components/ui/button";
import { Input } from "@/admin/components/ui/input";
import { Label } from "@/admin/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/admin/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from "@/admin/components/ui/dialog";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Slider } from "@/admin/components/ui/slider";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/admin/components/ui/table";

interface FormData extends Omit<VendorPlan, 'id' | 'created_at' | 'updated_at'> {}

const VendorsPlane = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [vendors, setVendors] = useState<VendorPlan[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedVendor, setSelectedVendor] = useState<VendorPlan | null>(null);
    const [formData, setFormData] = useState<FormData>({
        title: '',
        slug: '',
        price_ht: 0,
        original_price_ht: 0,
        duration_days: 30,
        description: '',
        is_recommended: false,
        display_order: 1,
        is_active: true
    });

    useEffect(() => {
        void fetchVendorPlans();
    }, []);

    const fetchVendorPlans = async () => {
        try {
            setIsLoading(true);
            const response = await vendorPlanService.getAllPlans();
            setVendors(response.data);
        } catch (error) {
            console.error('Error fetching vendor plans:', error);
            toast.error('Failed to load vendor plans');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateOrUpdatePlan = async () => {
        try {
            setIsLoading(true);
            if (selectedVendor) {
                await vendorPlanService.updatePlan(selectedVendor.id, formData);
                toast.success('Plan updated successfully');
            } else {
                await vendorPlanService.createPlan(formData);
                toast.success('Plan created successfully');
            }
            void fetchVendorPlans();
            setIsDialogOpen(false);
        } catch (error) {
            console.error('Error saving vendor plan:', error);
            toast.error('Failed to save vendor plan');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeletePlan = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this plan?')) {
            return;
        }

        try {
            setIsLoading(true);
            await vendorPlanService.deletePlan(id);
            toast.success('Plan deleted successfully');
            void fetchVendorPlans();
        } catch (error) {
            console.error('Error deleting vendor plan:', error);
            toast.error('Failed to delete vendor plan');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenDialog = (vendor?: VendorPlan) => {
        if (vendor) {
            setSelectedVendor(vendor);
            setFormData(vendor);
        } else {
            setSelectedVendor(null);
            setFormData({
                title: '',
                slug: '',
                price_ht: 0,
                original_price_ht: 0,
                duration_days: 30,
                description: '',
                is_recommended: false,
                display_order: 1,
                is_active: true
            });
        }
        setIsDialogOpen(true);
    };

    const handleInputChange = (field: keyof FormData, value: string | number | boolean) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="space-y-4 sm:space-y-6 p-2 sm:p-4 lg:p-6">
            <Card className="overflow-hidden">
                {/* Header */}
                <div className="p-4 sm:p-6 lg:p-8 bg-gradient-to-r from-[#00897B] to-[#00796B]">
                    <div className="text-white">
                        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold">Vendor Plans</h2>
                        <p className="text-white/80 text-sm sm:text-base mt-1">
                            Manage subscription plans for vendors
                        </p>
                    </div>
                </div>
                
                <div className="p-4 sm:p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-semibold">Manage Plans</h3>
                        <Button 
                            onClick={() => handleOpenDialog()}
                            className="bg-[#00897B] hover:bg-[#00796B]"
                        >
                            <Plus className="mr-2 h-4 w-4" /> Create Plan
                        </Button>
                    </div>

                    {isLoading ? (
                        <div className="text-center py-4">Loading...</div>
                    ) : (
                        <>
                            {/* Desktop Table */}
                            <div className="hidden md:block rounded-md border overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Title</TableHead>
                                            <TableHead>Price</TableHead>
                                            <TableHead>Duration (days)</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {vendors.map((vendor) => (
                                            <TableRow key={vendor.id}>
                                                <TableCell>{vendor.title}</TableCell>
                                                <TableCell>${vendor.price_ht}</TableCell>
                                                <TableCell>{vendor.duration_days}</TableCell>
                                                <TableCell>
                                                    {vendor.is_active ? (
                                                        <span className="text-green-600 bg-green-50 px-2 py-1 rounded-full text-sm font-medium">
                                                            Active
                                                        </span>
                                                    ) : (
                                                        <span className="text-red-600 bg-red-50 px-2 py-1 rounded-full text-sm font-medium">
                                                            Inactive
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end space-x-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleOpenDialog(vendor)}
                                                            className="hover:text-[#00897B] hover:border-[#00897B]"
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="destructive"
                                                            size="sm"
                                                            onClick={() => handleDeletePlan(vendor.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Mobile Cards */}
                            <div className="md:hidden space-y-3">
                                {vendors.map((vendor) => (
                                    <Card key={vendor.id} className="p-4">
                                        <div className="space-y-3">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h4 className="font-medium">{vendor.title}</h4>
                                                    <p className="text-sm text-gray-500">
                                                        ${vendor.price_ht} / {vendor.duration_days} days
                                                    </p>
                                                </div>
                                                {vendor.is_active ? (
                                                    <span className="text-green-600 bg-green-50 px-2 py-1 rounded-full text-sm font-medium">
                                                        Active
                                                    </span>
                                                ) : (
                                                    <span className="text-red-600 bg-red-50 px-2 py-1 rounded-full text-sm font-medium">
                                                        Inactive
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex justify-end space-x-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleOpenDialog(vendor)}
                                                    className="hover:text-[#00897B] hover:border-[#00897B]"
                                                >
                                                    <Edit className="h-4 w-4 mr-1" />
                                                    Edit
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => handleDeletePlan(vendor.id)}
                                                >
                                                    <Trash2 className="h-4 w-4 mr-1" />
                                                    Delete
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-h-[90vh] p-0">
                    <DialogHeader className="bg-gradient-to-r from-[#00897B] to-[#00796B] p-6">
                        <DialogTitle className="text-white text-xl">
                            {selectedVendor ? 'Edit Vendor Plan' : 'Create New Vendor Plan'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="p-6">
                        <form className="space-y-4 overflow-y-auto max-h-[60vh] pr-2">
                        <div className="space-y-1">
                            <Label htmlFor="title">Title</Label>
                            <Input
                                id="title"
                                value={formData.title}
                                onChange={(e) => handleInputChange('title', e.target.value)}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="display_order">Display Order</Label>
                            <Input
                                id="display_order"
                                type="number"
                                min="1"
                                max="5"
                                value={formData.display_order}
                                onChange={(e) => handleInputChange('display_order', parseInt(e.target.value))}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="slug">Slug</Label>
                            <Input
                                id="slug"
                                value={formData.slug}
                                onChange={(e) => handleInputChange('slug', e.target.value)}
                            />
                        </div>
                        <div>
                            <Label htmlFor="price">Price (HT)</Label>
                            <Input
                                id="price"
                                type="number"
                                value={formData.price_ht}
                                onChange={(e) => handleInputChange('price_ht', parseFloat(e.target.value))}
                            />
                        </div>
                        <div>
                            <Label htmlFor="original_price">Original Price (HT)</Label>
                            <Input
                                id="original_price"
                                type="number"
                                value={formData.original_price_ht}
                                onChange={(e) => handleInputChange('original_price_ht', parseFloat(e.target.value))}
                            />
                        </div>
                        <div>
                            <Label htmlFor="duration">Duration (days)</Label>
                            <Input
                                id="duration"
                                type="number"
                                value={formData.duration_days}
                                onChange={(e) => handleInputChange('duration_days', parseInt(e.target.value))}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="description">Description</Label>
                            <Input
                                id="description"
                                value={formData.description}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="is_recommended">Recommended</Label>
                            <Select
                                value={formData.is_recommended ? "true" : "false"}
                                onValueChange={(value) => handleInputChange('is_recommended', value === "true")}
                            >
                                <SelectTrigger id="is_recommended">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="true">Yes</SelectItem>
                                    <SelectItem value="false">No</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="is_active">Status</Label>
                            <Select
                                value={formData.is_active ? "true" : "false"}
                                onValueChange={(value) => handleInputChange('is_active', value === "true")}
                            >
                                <SelectTrigger id="is_active">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="true">Active</SelectItem>
                                    <SelectItem value="false">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        </form>
                        <DialogFooter className="mt-6">
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleCreateOrUpdatePlan} disabled={isLoading}
                                className="bg-[#00897B] hover:bg-[#00796B]">
                                {selectedVendor ? 'Update' : 'Create'}
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default VendorsPlane;