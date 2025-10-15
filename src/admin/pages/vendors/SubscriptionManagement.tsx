import { useState } from 'react';
import { Card } from "@/admin/components/ui/card";
import { Button } from "@/admin/components/ui/button";
import { Input } from "@/admin/components/ui/input";
import { Textarea } from "@/admin/components/ui/textarea";
import { Label } from "@/admin/components/ui/label";
import { Switch } from "@/admin/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/admin/components/ui/select";
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
import { Plus, Edit, Trash2, Star, Eye, EyeOff, DollarSign, Calendar, Package, Phone, Mail } from "lucide-react";
import toast from 'react-hot-toast';

interface OfferPlan {
  id: string;
  name: string;
  price: number;
  duration: string;
  durationValue: number;
  durationType: 'month' | 'year';
  description: string;
  promoCode?: string;
  isRecommended: boolean;
  displayOrder: number;
  isActive: boolean;
}

interface AddOn {
  id: string;
  name: string;
  price: number;
  description: string;
  maxQuantity: number;
  isVisible: boolean;
}

interface ContactInfo {
  facturationEmail: string;
  contactEmail: string;
  phoneNumber: string;
}

const SubscriptionManagement = () => {
  const [activeTab, setActiveTab] = useState('plans');
  
  // Offer Plans State
  const [plans, setPlans] = useState<OfferPlan[]>([
    {
      id: '1',
      name: 'Basic Plan',
      price: 29.99,
      duration: '1 month',
      durationValue: 1,
      durationType: 'month',
      description: 'Perfect for small businesses',
      isRecommended: false,
      displayOrder: 2,
      isActive: true
    },
    {
      id: '2',
      name: 'Premium Plan',
      price: 49.99,
      duration: '1 month',
      durationValue: 1,
      durationType: 'month',
      description: 'Best for growing businesses',
      promoCode: 'PREMIUM10',
      isRecommended: true,
      displayOrder: 1,
      isActive: true
    }
  ]);

  // Add-ons State
  const [addOns, setAddOns] = useState<AddOn[]>([
    {
      id: '1',
      name: 'Extra Storage',
      price: 5.00,
      description: 'Additional 10GB storage',
      maxQuantity: 5,
      isVisible: true
    }
  ]);

  // Contact Info State
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    facturationEmail: 'facturation@company.com',
    contactEmail: 'contact@company.com',
    phoneNumber: '+1 234 567 890'
  });

  // Dialog States
  const [planDialog, setPlanDialog] = useState(false);
  const [addOnDialog, setAddOnDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState<OfferPlan | null>(null);
  const [editingAddOn, setEditingAddOn] = useState<AddOn | null>(null);

  // Form States
  const [planForm, setPlanForm] = useState<Partial<OfferPlan>>({
    name: '',
    price: 0,
    durationValue: 1,
    durationType: 'month',
    description: '',
    promoCode: '',
    isRecommended: false,
    displayOrder: 1,
    isActive: true
  });

  const [addOnForm, setAddOnForm] = useState<Partial<AddOn>>({
    name: '',
    price: 0,
    description: '',
    maxQuantity: 1,
    isVisible: true
  });

  // Plan Handlers
  const handleOpenPlanDialog = (plan?: OfferPlan) => {
    if (plan) {
      setEditingPlan(plan);
      setPlanForm(plan);
    } else {
      setEditingPlan(null);
      setPlanForm({
        name: '',
        price: 0,
        durationValue: 1,
        durationType: 'month',
        description: '',
        promoCode: '',
        isRecommended: false,
        displayOrder: plans.length + 1,
        isActive: true
      });
    }
    setPlanDialog(true);
  };

  const handleSavePlan = () => {
    if (!planForm.name || !planForm.price) {
      toast.error('Please fill all required fields');
      return;
    }

    const duration = `${planForm.durationValue} ${planForm.durationType}${planForm.durationValue! > 1 ? 's' : ''}`;
    
    if (editingPlan) {
      setPlans(plans.map(p => p.id === editingPlan.id ? {
        ...planForm,
        id: editingPlan.id,
        duration
      } as OfferPlan : p));
      toast.success('Plan updated successfully');
    } else {
      const newPlan: OfferPlan = {
        ...planForm,
        id: Date.now().toString(),
        duration
      } as OfferPlan;
      setPlans([...plans, newPlan]);
      toast.success('Plan created successfully');
    }
    setPlanDialog(false);
  };

  const handleDeletePlan = (id: string) => {
    setPlans(plans.filter(p => p.id !== id));
    toast.success('Plan deleted successfully');
  };

  // Add-on Handlers
  const handleOpenAddOnDialog = (addOn?: AddOn) => {
    if (addOn) {
      setEditingAddOn(addOn);
      setAddOnForm(addOn);
    } else {
      setEditingAddOn(null);
      setAddOnForm({
        name: '',
        price: 0,
        description: '',
        maxQuantity: 1,
        isVisible: true
      });
    }
    setAddOnDialog(true);
  };

  const handleSaveAddOn = () => {
    if (!addOnForm.name || !addOnForm.price) {
      toast.error('Please fill all required fields');
      return;
    }

    if (editingAddOn) {
      setAddOns(addOns.map(a => a.id === editingAddOn.id ? {
        ...addOnForm,
        id: editingAddOn.id
      } as AddOn : a));
      toast.success('Add-on updated successfully');
    } else {
      const newAddOn: AddOn = {
        ...addOnForm,
        id: Date.now().toString()
      } as AddOn;
      setAddOns([...addOns, newAddOn]);
      toast.success('Add-on created successfully');
    }
    setAddOnDialog(false);
  };

  const handleDeleteAddOn = (id: string) => {
    setAddOns(addOns.filter(a => a.id !== id));
    toast.success('Add-on deleted successfully');
  };

  // Contact Info Handlers
  const handleSaveContactInfo = () => {
    toast.success('Contact information updated successfully');
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-4 lg:p-6">
      <Card className="overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-6 lg:p-8 bg-gradient-to-r from-[#00897B] to-[#00796B]">
          <div className="text-white">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold">Subscription Management</h2>
            <p className="text-white/80 text-sm sm:text-base mt-1">
              Manage offer plans, add-ons, and contact information
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="p-4 sm:p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="plans">Offer Plans</TabsTrigger>
              <TabsTrigger value="addons">Add-ons</TabsTrigger>
              <TabsTrigger value="contacts">Contacts</TabsTrigger>
            </TabsList>

            {/* Offer Plans Tab */}
            <TabsContent value="plans" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Manage Offer Plans</h3>
                <Button onClick={() => handleOpenPlanDialog()} className="bg-[#00897B] hover:bg-[#00796B]">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Plan
                </Button>
              </div>

              {/* Desktop Table */}
              <div className="hidden md:block rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order</TableHead>
                      <TableHead>Plan Name</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Promo Code</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {plans.sort((a, b) => a.displayOrder - b.displayOrder).map((plan) => (
                      <TableRow key={plan.id}>
                        <TableCell className="font-medium">#{plan.displayOrder}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {plan.name}
                            {plan.isRecommended && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
                          </div>
                        </TableCell>
                        <TableCell>${plan.price.toFixed(2)}</TableCell>
                        <TableCell>{plan.duration}</TableCell>
                        <TableCell>{plan.promoCode || '-'}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${plan.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {plan.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2 justify-end">
                            <Button variant="outline" size="sm" onClick={() => handleOpenPlanDialog(plan)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => handleDeletePlan(plan.id)}>
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
                {plans.sort((a, b) => a.displayOrder - b.displayOrder).map((plan) => (
                  <Card key={plan.id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{plan.name}</span>
                            {plan.isRecommended && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
                          </div>
                          <p className="text-sm text-gray-500">Order #{plan.displayOrder}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs ${plan.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {plan.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="text-sm space-y-1">
                        <p><span className="font-medium">Price:</span> ${plan.price.toFixed(2)}</p>
                        <p><span className="font-medium">Duration:</span> {plan.duration}</p>
                        <p><span className="font-medium">Promo:</span> {plan.promoCode || '-'}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => handleOpenPlanDialog(plan)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button variant="destructive" size="sm" className="flex-1" onClick={() => handleDeletePlan(plan.id)}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
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

              {/* Desktop Table */}
              <div className="hidden md:block rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Add-on Name</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Max Quantity</TableHead>
                      <TableHead>Visibility</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {addOns.map((addOn) => (
                      <TableRow key={addOn.id}>
                        <TableCell className="font-medium">{addOn.name}</TableCell>
                        <TableCell>${addOn.price.toFixed(2)}</TableCell>
                        <TableCell>{addOn.maxQuantity}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {addOn.isVisible ? (
                              <><Eye className="h-4 w-4 text-green-600" /> Visible</>
                            ) : (
                              <><EyeOff className="h-4 w-4 text-gray-400" /> Hidden</>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2 justify-end">
                            <Button variant="outline" size="sm" onClick={() => handleOpenAddOnDialog(addOn)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => handleDeleteAddOn(addOn.id)}>
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
                        <h4 className="font-semibold">{addOn.name}</h4>
                        <div className="flex items-center gap-2 text-sm">
                          {addOn.isVisible ? (
                            <><Eye className="h-4 w-4 text-green-600" /> Visible</>
                          ) : (
                            <><EyeOff className="h-4 w-4 text-gray-400" /> Hidden</>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">{addOn.description}</p>
                      <div className="text-sm space-y-1">
                        <p><span className="font-medium">Price:</span> ${addOn.price.toFixed(2)}</p>
                        <p><span className="font-medium">Max Quantity:</span> {addOn.maxQuantity}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => handleOpenAddOnDialog(addOn)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button variant="destructive" size="sm" className="flex-1" onClick={() => handleDeleteAddOn(addOn.id)}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Contacts Tab */}
            <TabsContent value="contacts" className="space-y-4">
              <h3 className="text-lg font-semibold">Contact Information</h3>
              <Card className="p-6">
                <div className="space-y-4">
                  <div>
                    <Label className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Facturation Email
                    </Label>
                    <Input
                      type="email"
                      value={contactInfo.facturationEmail}
                      onChange={(e) => setContactInfo({...contactInfo, facturationEmail: e.target.value})}
                      className="mt-2"
                      placeholder="facturation@company.com"
                    />
                  </div>
                  <div>
                    <Label className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Contact Email
                    </Label>
                    <Input
                      type="email"
                      value={contactInfo.contactEmail}
                      onChange={(e) => setContactInfo({...contactInfo, contactEmail: e.target.value})}
                      className="mt-2"
                      placeholder="contact@company.com"
                    />
                  </div>
                  <div>
                    <Label className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Phone Number
                    </Label>
                    <Input
                      type="tel"
                      value={contactInfo.phoneNumber}
                      onChange={(e) => setContactInfo({...contactInfo, phoneNumber: e.target.value})}
                      className="mt-2"
                      placeholder="+1 234 567 890"
                    />
                  </div>
                  <Button onClick={handleSaveContactInfo} className="bg-[#00897B] hover:bg-[#00796B]">
                    Save Contact Information
                  </Button>
                </div>
              </Card>
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
              <Label>Plan Name *</Label>
              <Input
                value={planForm.name}
                onChange={(e) => setPlanForm({...planForm, name: e.target.value})}
                placeholder="e.g., Premium Plan"
                className="mt-2"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Price ($) *</Label>
                <Input
                  type="number"
                  value={planForm.price}
                  onChange={(e) => setPlanForm({...planForm, price: parseFloat(e.target.value)})}
                  placeholder="49.99"
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Display Order</Label>
                <Input
                  type="number"
                  value={planForm.displayOrder}
                  onChange={(e) => setPlanForm({...planForm, displayOrder: parseInt(e.target.value)})}
                  className="mt-2"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Duration Value</Label>
                <Input
                  type="number"
                  value={planForm.durationValue}
                  onChange={(e) => setPlanForm({...planForm, durationValue: parseInt(e.target.value)})}
                  placeholder="1"
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Duration Type</Label>
                <Select
                  value={planForm.durationType}
                  onValueChange={(value: 'month' | 'year') => setPlanForm({...planForm, durationType: value})}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="month">Month(s)</SelectItem>
                    <SelectItem value="year">Year(s)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={planForm.description}
                onChange={(e) => setPlanForm({...planForm, description: e.target.value})}
                placeholder="Describe what's included in this plan"
                rows={3}
                className="mt-2"
              />
            </div>
            <div>
              <Label>Promo Code (Optional)</Label>
              <Input
                value={planForm.promoCode}
                onChange={(e) => setPlanForm({...planForm, promoCode: e.target.value})}
                placeholder="PROMO10"
                className="mt-2"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={planForm.isRecommended}
                onCheckedChange={(checked) => setPlanForm({...planForm, isRecommended: checked})}
              />
              <Label>Mark as Recommended</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={planForm.isActive}
                onCheckedChange={(checked) => setPlanForm({...planForm, isActive: checked})}
              />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPlanDialog(false)}>Cancel</Button>
            <Button onClick={handleSavePlan} className="bg-[#00897B] hover:bg-[#00796B]">
              {editingPlan ? 'Update' : 'Create'} Plan
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
              <Label>Add-on Name *</Label>
              <Input
                value={addOnForm.name}
                onChange={(e) => setAddOnForm({...addOnForm, name: e.target.value})}
                placeholder="e.g., Extra Storage"
                className="mt-2"
              />
            </div>
            <div>
              <Label>Price ($) *</Label>
              <Input
                type="number"
                value={addOnForm.price}
                onChange={(e) => setAddOnForm({...addOnForm, price: parseFloat(e.target.value)})}
                placeholder="5.00"
                className="mt-2"
              />
            </div>
            <div>
              <Label>Short Description</Label>
              <Textarea
                value={addOnForm.description}
                onChange={(e) => setAddOnForm({...addOnForm, description: e.target.value})}
                placeholder="Brief description of this add-on"
                rows={2}
                className="mt-2"
              />
            </div>
            <div>
              <Label>Max Quantity</Label>
              <Input
                type="number"
                value={addOnForm.maxQuantity}
                onChange={(e) => setAddOnForm({...addOnForm, maxQuantity: parseInt(e.target.value)})}
                placeholder="5"
                className="mt-2"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={addOnForm.isVisible}
                onCheckedChange={(checked) => setAddOnForm({...addOnForm, isVisible: checked})}
              />
              <Label>Visible to Users</Label>
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