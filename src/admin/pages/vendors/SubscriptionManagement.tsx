import { useState, useEffect } from 'react';
import { Card } from "@/admin/components/ui/card";
import { Button } from "@/admin/components/ui/button";
import { Input } from "@/admin/components/ui/input";
import { Textarea } from "@/admin/components/ui/textarea";
import { Label } from "@/admin/components/ui/label";
import { Switch } from "@/admin/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/admin/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/admin/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/admin/components/ui/table";
import { Plus, Edit, Trash2, Star, Eye, EyeOff } from "lucide-react";
import toast from 'react-hot-toast';
import { vendorPlanService, VendorPlan } from '@/admin/lib/api/offer-plans';
import { useAddOns } from '@/admin/lib/add-ons/useAddOns';
import { AddOn } from '@/admin/lib/add-ons/types';

interface PlanFormData {
  title: string;
  slug: string;
  price_ht: number;
  original_price_ht: number;
  duration_days: number;
  description: string;
  is_recommended: boolean;
  display_order: number;
  is_active: boolean;
}

const SubscriptionManagement = () => {
  const [activeTab, setActiveTab] = useState('plans');
  const [isLoading, setIsLoading] = useState(false);
  
  // Offer Plans State (using API data)
  const [plans, setPlans] = useState<VendorPlan[]>([]);

  // Add-ons State using the hook
  const {
    addOns,
    isLoading: addOnsLoading,
    error: addOnsError,
    fetchAddOns,
    createAddOn,
    updateAddOn,
    deleteAddOn
  } = useAddOns();

  // Dialog States
  const [planDialog, setPlanDialog] = useState(false);
  const [addOnDialog, setAddOnDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState<VendorPlan | null>(null);
  const [editingAddOn, setEditingAddOn] = useState<AddOn | null>(null);

  // Form States
  const [planForm, setPlanForm] = useState<PlanFormData>({
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

  const [addOnForm, setAddOnForm] = useState<Partial<AddOn>>({
    title: '',
    price_ht: 0,
    tooltip: '',
    max_quantity: 1,
    is_active: true
  });

  // Fetch plans and add-ons on mount
  useEffect(() => {
    void fetchVendorPlans();
    void fetchAddOns();
  }, []);

  // Fetch all vendor plans from API
  const fetchVendorPlans = async () => {
    try {
      setIsLoading(true);
      const response = await vendorPlanService.getAllPlans();
      // Convert string prices to numbers for consistent handling
      const normalizedPlans = response.data.map(plan => ({
        ...plan,
        price_ht: typeof plan.price_ht === 'string' ? parseFloat(plan.price_ht) : plan.price_ht,
        original_price_ht: typeof plan.original_price_ht === 'string' ? parseFloat(plan.original_price_ht) : plan.original_price_ht,
      }));
      setPlans(normalizedPlans);
    } catch (error) {
      console.error('Error fetching vendor plans:', error);
      toast.error('Failed to load vendor plans');
    } finally {
      setIsLoading(false);
    }
  };

  // Plan Handlers
  const handleOpenPlanDialog = (plan?: VendorPlan) => {
    if (plan) {
      setEditingPlan(plan);
      setPlanForm({
        title: plan.title,
        slug: plan.slug,
        price_ht: Number(plan.price_ht),
        original_price_ht: Number(plan.original_price_ht),
        duration_days: plan.duration_days,
        description: plan.description,
        is_recommended: plan.is_recommended,
        display_order: plan.display_order,
        is_active: plan.is_active
      });
    } else {
      setEditingPlan(null);
      setPlanForm({
        title: '',
        slug: '',
        price_ht: 0,
        original_price_ht: 0,
        duration_days: 30,
        description: '',
        is_recommended: false,
        display_order: plans.length + 1,
        is_active: true
      });
    }
    setPlanDialog(true);
  };

  const handleSavePlan = async () => {
    if (!planForm.title || !planForm.price_ht) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      setIsLoading(true);
      if (editingPlan) {
        await vendorPlanService.updatePlan(editingPlan.id, planForm);
        toast.success('Plan updated successfully');
      } else {
        await vendorPlanService.createPlan(planForm);
        toast.success('Plan created successfully');
      }
      await fetchVendorPlans();
      setPlanDialog(false);
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
      await fetchVendorPlans();
    } catch (error) {
      console.error('Error deleting vendor plan:', error);
      toast.error('Failed to delete vendor plan');
    } finally {
      setIsLoading(false);
    }
  };

  // Add-on Handlers
  const handleOpenAddOnDialog = (addOn?: AddOn) => {
    if (addOn) {
      setEditingAddOn(addOn);
      setAddOnForm({
        title: addOn.title,
        price_ht: addOn.price_ht,
        tooltip: addOn.tooltip,
        max_quantity: addOn.max_quantity,
        is_active: addOn.is_active
      });
    } else {
      setEditingAddOn(null);
      setAddOnForm({
        title: '',
        price_ht: 0,
        tooltip: '',
        max_quantity: 1,
        is_active: true
      });
    }
    setAddOnDialog(true);
  };

  const handleSaveAddOn = async () => {
    // Validation
    if (!addOnForm.title || addOnForm.title.trim() === '') {
      toast.error('Please enter a title');
      return;
    }
    
    if (!addOnForm.price_ht || addOnForm.price_ht <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    try {
      if (editingAddOn) {
        const success = await updateAddOn(editingAddOn.id!, addOnForm as AddOn);
        if (success) {
          toast.success('Add-on updated successfully');
          setAddOnDialog(false);
        } else {
          toast.error(addOnsError || 'Failed to update add-on');
        }
      } else {
        const success = await createAddOn(addOnForm as AddOn);
        if (success) {
          toast.success('Add-on created successfully');
          setAddOnDialog(false);
          // Reset form
          setAddOnForm({
            title: '',
            price_ht: 0,
            tooltip: '',
            max_quantity: 1,
            is_active: true
          });
        } else {
          toast.error(addOnsError || 'Failed to create add-on');
        }
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    }
  };

  const handleDeleteAddOn = async (id: number) => {
    const success = await deleteAddOn(id);
    if (success) {
      toast.success('Add-on deleted successfully');
    } else {
      toast.error('Failed to delete add-on');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-4 lg:p-6">
      <Card className="overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-6 lg:p-8 bg-gradient-to-r from-[#00897B] to-[#00796B]">
          <div className="text-white">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold">Subscription Management</h2>
            <p className="text-white/80 text-sm sm:text-base mt-1">
              Manage subscription plans and add-ons for vendors
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="p-4 sm:p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="plans">Offer Plans</TabsTrigger>
              <TabsTrigger value="addons">Add-ons</TabsTrigger>
            </TabsList>

            {/* Offer Plans Tab */}
            <TabsContent value="plans" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Manage Offer Plans</h3>
                <Button onClick={() => handleOpenPlanDialog()} className="bg-[#00897B] hover:bg-[#00796B]" disabled={isLoading}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Plan
                </Button>
              </div>

              {isLoading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#00897B]"></div>
                  <p className="mt-2 text-gray-500">Loading plans...</p>
                </div>
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="hidden md:block rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order</TableHead>
                          <TableHead>Plan Name</TableHead>
                          <TableHead>Price (HT)</TableHead>
                          <TableHead>Original Price</TableHead>
                          <TableHead>Duration (Days)</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {plans.sort((a, b) => a.display_order - b.display_order).map((plan) => (
                          <TableRow key={plan.id}>
                            <TableCell className="font-medium">#{plan.display_order}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {plan.title}
                                {plan.is_recommended && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
                              </div>
                            </TableCell>
                            <TableCell>${Number(plan.price_ht).toFixed(2)}</TableCell>
                            <TableCell>${Number(plan.original_price_ht).toFixed(2)}</TableCell>
                            <TableCell>{plan.duration_days} days</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs ${plan.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {plan.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2 justify-end">
                                <Button variant="outline" size="sm" onClick={() => handleOpenPlanDialog(plan)} disabled={isLoading}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="destructive" size="sm" onClick={() => handleDeletePlan(plan.id)} disabled={isLoading}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}

              {!isLoading && (
                <div className="md:hidden space-y-3">
                  {plans.sort((a, b) => a.display_order - b.display_order).map((plan) => (
                    <Card key={plan.id} className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{plan.title}</span>
                              {plan.is_recommended && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
                            </div>
                            <p className="text-sm text-gray-500">Order #{plan.display_order}</p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs ${plan.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {plan.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className="text-sm space-y-1">
                          <p><span className="font-medium">Price:</span> ${Number(plan.price_ht).toFixed(2)}</p>
                          <p><span className="font-medium">Original:</span> ${Number(plan.original_price_ht).toFixed(2)}</p>
                          <p><span className="font-medium">Duration:</span> {plan.duration_days} days</p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1" onClick={() => handleOpenPlanDialog(plan)} disabled={isLoading}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          <Button variant="destructive" size="sm" className="flex-1" onClick={() => handleDeletePlan(plan.id)} disabled={isLoading}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Add-ons Tab */}
            <TabsContent value="addons" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Manage Add-ons</h3>
                <Button onClick={() => handleOpenAddOnDialog()} className="bg-[#00897B] hover:bg-[#00796B]">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Add-on
                </Button>
              </div>

              {/* Error State */}
              {addOnsError && (
                <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
                  {addOnsError}
                </div>
              )}

              {/* Loading State */}
              {addOnsLoading && (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00897B]"></div>
                </div>
              )}

              {/* Desktop Table */}
              <div className="hidden md:block rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Max Quantity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {addOns.map((addOn) => (
                      <TableRow key={addOn.id}>
                        <TableCell className="font-medium">{addOn.title}</TableCell>
                        <TableCell>${(Number(addOn.price_ht) || 0).toFixed(2)}</TableCell>
                        <TableCell>{Number(addOn.max_quantity) || 0}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {addOn.is_active ? (
                              <><Eye className="h-4 w-4 text-green-600" /> Active</>
                            ) : (
                              <><EyeOff className="h-4 w-4 text-gray-400" /> Inactive</>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{addOn.tooltip}</TableCell>
                        <TableCell>
                          <div className="flex gap-2 justify-end">
                            <Button variant="outline" size="sm" onClick={() => handleOpenAddOnDialog(addOn)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => handleDeleteAddOn(addOn.id!)}>
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
                {addOns.map((addOn) => (
                  <Card key={addOn.id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <h4 className="font-semibold">{addOn.title}</h4>
                        <div className="flex items-center gap-2 text-sm">
                          {addOn.is_active ? (
                            <><Eye className="h-4 w-4 text-green-600" /> Active</>
                          ) : (
                            <><EyeOff className="h-4 w-4 text-gray-400" /> Inactive</>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">{addOn.tooltip}</p>
                      <div className="text-sm space-y-1">
                        <p><span className="font-medium">Price:</span> ${(Number(addOn.price_ht) || 0).toFixed(2)}</p>
                        <p><span className="font-medium">Max Quantity:</span> {Number(addOn.max_quantity) || 0}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => handleOpenAddOnDialog(addOn)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button variant="destructive" size="sm" className="flex-1" onClick={() => handleDeleteAddOn(addOn.id!)}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

          </Tabs>
        </div>
      </Card>

      {/* Plan Dialog */}
      <Dialog open={planDialog} onOpenChange={setPlanDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPlan ? 'Edit Offer Plan' : 'Create Offer Plan'}</DialogTitle>
            <DialogDescription>
              {editingPlan ? 'Update the details of this offer plan' : 'Create a new subscription plan for vendors'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Plan Title *</Label>
              <Input
                value={planForm.title}
                onChange={(e) => setPlanForm({...planForm, title: e.target.value})}
                placeholder="e.g., Premium Plan"
                className="mt-2"
                disabled={isLoading}
              />
            </div>
            <div>
              <Label>Slug *</Label>
              <Input
                value={planForm.slug}
                onChange={(e) => setPlanForm({...planForm, slug: e.target.value})}
                placeholder="e.g., premium-plan"
                className="mt-2"
                disabled={isLoading}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Price (HT) *</Label>
                <Input
                  type="number"
                  value={planForm.price_ht}
                  onChange={(e) => setPlanForm({...planForm, price_ht: parseFloat(e.target.value)})}
                  placeholder="49.99"
                  className="mt-2"
                  disabled={isLoading}
                />
              </div>
              <div>
                <Label>Original Price (HT)</Label>
                <Input
                  type="number"
                  value={planForm.original_price_ht}
                  onChange={(e) => setPlanForm({...planForm, original_price_ht: parseFloat(e.target.value)})}
                  placeholder="59.99"
                  className="mt-2"
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Duration (Days) *</Label>
                <Input
                  type="number"
                  value={planForm.duration_days}
                  onChange={(e) => setPlanForm({...planForm, duration_days: parseInt(e.target.value)})}
                  placeholder="30"
                  className="mt-2"
                  disabled={isLoading}
                />
              </div>
              <div>
                <Label>Display Order</Label>
                <Input
                  type="number"
                  value={planForm.display_order}
                  onChange={(e) => setPlanForm({...planForm, display_order: parseInt(e.target.value)})}
                  className="mt-2"
                  disabled={isLoading}
                />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={planForm.description}
                onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                placeholder="Describe what's included in this plan"
                rows={3}
                className="mt-2"
                disabled={isLoading}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={planForm.is_recommended}
                onCheckedChange={(checked) => setPlanForm({...planForm, is_recommended: checked})}
                disabled={isLoading}
              />
              <Label>Mark as Recommended</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={planForm.is_active}
                onCheckedChange={(checked) => setPlanForm({...planForm, is_active: checked})}
                disabled={isLoading}
              />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPlanDialog(false)} disabled={isLoading}>Cancel</Button>
            <Button onClick={handleSavePlan} className="bg-[#00897B] hover:bg-[#00796B]" disabled={isLoading}>
              {isLoading ? 'Saving...' : editingPlan ? 'Update' : 'Create'} Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add-on Dialog */}
      <Dialog open={addOnDialog} onOpenChange={setAddOnDialog}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingAddOn ? 'Edit Add-on' : 'Create Add-on'}</DialogTitle>
            <DialogDescription>
              {editingAddOn ? 'Update the details of this add-on' : 'Create a new add-on feature for vendors'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input
                value={addOnForm.title}
                onChange={(e) => setAddOnForm({ ...addOnForm, title: e.target.value })}
                placeholder="e.g., Gold Support"
                className="mt-2"
              />
            </div>
            <div>
              <Label>Price (HT) *</Label>
              <Input
                type="number"
                value={addOnForm.price_ht}
                onChange={(e) => setAddOnForm({ ...addOnForm, price_ht: parseFloat(e.target.value) })}
                placeholder="100.00"
                className="mt-2"
              />
            </div>
            <div>
              <Label>Tooltip</Label>
              <Textarea
                value={addOnForm.tooltip}
                onChange={(e) => setAddOnForm({ ...addOnForm, tooltip: e.target.value })}
                placeholder="Brief description or tooltip for this add-on"
                rows={2}
                className="mt-2"
              />
            </div>
            <div>
              <Label>Max Quantity</Label>
              <Input
                type="number"
                value={addOnForm.max_quantity}
                onChange={(e) => setAddOnForm({ ...addOnForm, max_quantity: parseInt(e.target.value) })}
                placeholder="2"
                className="mt-2"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={addOnForm.is_active}
                onCheckedChange={(checked) => setAddOnForm({ ...addOnForm, is_active: checked })}
              />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOnDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveAddOn} className="bg-[#00897B] hover:bg-[#00796B]">
              {editingAddOn ? 'Update' : 'Create'} Add-on
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubscriptionManagement;