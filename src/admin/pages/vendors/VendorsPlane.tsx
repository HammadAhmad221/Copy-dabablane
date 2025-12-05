import { useState, useEffect } from 'react';
import { VendorPlan, vendorPlanService } from '@/admin/lib/api/offer-plans';
import { toast } from 'react-hot-toast';
import { Card } from "@/admin/components/ui/card";
import { Button } from "@/admin/components/ui/button";
import { Input } from "@/admin/components/ui/input";
import { Label } from "@/admin/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/admin/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from "@/admin/components/ui/dialog";
import { Plus, Trash2, Eye, X } from "lucide-react";
import { useAddOns } from '@/admin/lib/add-ons/useAddOns';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/admin/components/ui/table";
import { vendorPlanActivationService } from '@/admin/lib/api/vendor-plan-activation';
import type { VendorListItem, VendorSubscriptionItem } from '@/admin/lib/api/vendor-plan-activation';

interface FormData extends Omit<VendorPlan, 'id' | 'created_at' | 'updated_at'> {}

const VendorsPlane = () => {
    const initialVendors: VendorPlan[] = [];

    // Initialize add-ons hook
    const {
        addOns,
        fetchAddOns,
    } = useAddOns();

    const [vendors, setVendors] = useState<VendorPlan[]>(initialVendors);
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

    const [vendorList, setVendorList] = useState<VendorListItem[]>([]);
    const [vendorSubscriptions, setVendorSubscriptions] = useState<VendorSubscriptionItem[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [isManualDialogOpen, setIsManualDialogOpen] = useState(false);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
    const [selectedSubscription, setSelectedSubscription] = useState<VendorSubscriptionItem | null>(null);
    const [selectedAddOns, setSelectedAddOns] = useState<{ addOnId: number; quantity: number }[]>([]);
    const [manualForm, setManualForm] = useState<{ user_id: number | '';
        plan_id: number | '';
        add_ons: { id: number; quantity: number }[];
        promo_code: string | null;
        payment_method: 'online' | 'cash' | 'card' | string; }>(
        { user_id: '', plan_id: '', add_ons: [], promo_code: null, payment_method: 'cash' }
    );

    // Pending optimistic subscriptions persisted across refresh
    const PENDING_KEY = 'pending_vendor_subscriptions';
    const readPendingSubs = (): VendorSubscriptionItem[] => {
        try {
            const raw = localStorage.getItem(PENDING_KEY);
            if (!raw) return [] as any;
            const arr = JSON.parse(raw);
            return Array.isArray(arr) ? arr : [];
        } catch {
            return [] as any;
        }
    };
    const writePendingSubs = (items: VendorSubscriptionItem[]) => {
        try { localStorage.setItem(PENDING_KEY, JSON.stringify(items || [])); } catch {}
    };

    useEffect(() => {
        const loadVendorsData = async () => {
            try {
                setLoading(true);
                const [vendorsRes, subsRes, plansRes] = await Promise.all([
                    vendorPlanActivationService.getAllVendors(),
                    vendorPlanActivationService.getAllVendorsSubscription(),
                    vendorPlanService.getAllPlans(),
                    fetchAddOns(),
                ]);
                const vendorsArr = Array.isArray(vendorsRes?.data)
                    ? vendorsRes.data
                    : (Array.isArray((vendorsRes as any)?.data?.data) ? (vendorsRes as any).data.data : []);
                const subsArrRaw = Array.isArray(subsRes?.data)
                    ? subsRes.data
                    : (Array.isArray((subsRes as any)?.data?.data) ? (subsRes as any).data.data : []);
                const normalizeSub = (it: any) => ({
                    id: it?.id ?? it?.subscription_id ?? it?.subscriptionId ?? it?.subscription?.id ?? Date.now(),
                    user_id: it?.user_id ?? it?.userId ?? it?.user?.id ?? it?.vendor_id ?? it?.vendorId ?? 0,
                    plan_id: it?.plan_id ?? it?.planId ?? it?.plan?.id ?? 0,
                    status: it?.status ?? it?.state ?? it?.subscription?.status ?? '-',
                    created_at: it?.created_at ?? it?.createdAt ?? undefined,
                    updated_at: it?.updated_at ?? it?.updatedAt ?? undefined,
                    raw: {
                        ...it,
                        add_ons: it?.add_ons ?? it?.addOns ?? it?.subscription?.add_ons ?? it?.subscription?.addOns ?? [],
                    }
                }) as unknown as VendorSubscriptionItem;
                const subsArr = Array.isArray(subsArrRaw) ? subsArrRaw.map(normalizeSub) : [];
                const uniqByKey = (arr: any[]) => {
                    const seen = new Set<string>();
                    const out: any[] = [];
                    for (const it of arr) {
                        const r: any = (it as any).raw || {};
                        const idKey = (it as any).id
                            ?? r.subscription?.id
                            ?? r.id
                            ?? r.subscription_id;
                        const pairKey = (it as any).user_id && (it as any).plan_id
                            ? `u${(it as any).user_id}-p${(it as any).plan_id}`
                            : '';
                        const key = String(idKey || pairKey || `${(it as any).user_id}-${(it as any).plan_id}`);
                        if (!seen.has(key)) {
                            seen.add(key);
                            out.push(it);
                        }
                    }
                    return out;
                };
                const subsArrDedup = uniqByKey(subsArr);
                // Merge with locally pending optimistic items that server does not yet include
                const pending = readPendingSubs();
                let merged = uniqByKey([...(Array.isArray(pending) ? pending : []), ...subsArrDedup]);
                // Apply stable status fallback from plan.is_active only when status is empty (use freshly fetched vendorsArr)
                merged = (merged as any[]).map((it: any) => {
                    const hasStatus = it && it.status && String(it.status).trim() !== '' && String(it.status) !== '-';
                    if (hasStatus) return it;
                    const planObj = Array.isArray(vendorsArr) ? vendorsArr.find((p: any) => Number(p.id) === Number(it.plan_id)) : undefined;
                    const planActive = planObj ? normalizeBool((planObj as any).is_active) : undefined;
                    if (planActive !== undefined) {
                        return { ...it, status: planActive ? 'active' : 'inactive' };
                    }
                    return it;
                });
                setVendorList(vendorsArr);
                setVendorSubscriptions(merged as any);
                const normalize = (p: any): VendorPlan => ({
                    ...p,
                    price_ht: typeof p.price_ht === 'string' ? Number(p.price_ht) : p.price_ht,
                    original_price_ht: typeof p.original_price_ht === 'string' ? Number(p.original_price_ht) : p.original_price_ht,
                });
                setVendors(Array.isArray(plansRes?.data) ? plansRes.data.map(normalize) : []);
            } catch (error: any) {
                toast.error('Failed to load vendors data');
                console.error('Failed to load vendors data', error);
            } finally {
                setLoading(false);
            }
        };
        loadVendorsData();
    }, []);

    // Helper function to generate next ID
    const getNextId = (items: VendorPlan[]) => {
        return Math.max(...items.map(item => item.id), 0) + 1;
    };

    const handleCreateOrUpdatePlan = () => {
        if (selectedVendor) {
            // Update existing plan
            setVendors(prevVendors => 
                prevVendors.map(vendor => 
                    vendor.id === selectedVendor.id 
                        ? { ...vendor, ...formData, updated_at: new Date().toISOString() }
                        : vendor
                )
            );
            toast.success('Plan updated successfully');
        } else {
            // Create new plan
            const newVendor: VendorPlan = {
                id: getNextId(vendors),
                ...formData,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            setVendors(prevVendors => [...prevVendors, newVendor]);
            toast.success('Plan created successfully');
        }
        setIsDialogOpen(false);
    };

    const handleDeletePlan = (id: number) => {
        if (!window.confirm('Are you sure you want to delete this plan?')) {
            return;
        }

        setVendors(prevVendors => prevVendors.filter(vendor => vendor.id !== id));
        toast.success('Plan deleted successfully');
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

    const openManualActivation = (planId?: number) => {
        setManualForm({
            user_id: '',
            plan_id: typeof planId === 'number' ? planId : (selectedVendor ? selectedVendor.id : ''),
            add_ons: [],
            promo_code: null,
            payment_method: 'cash',
        });
        setSelectedAddOns([]);
        setIsManualDialogOpen(true);
    };

    const handleManualFormChange = (field: 'user_id' | 'plan_id' | 'promo_code' | 'payment_method', value: any) => {
        setManualForm(prev => ({ ...prev, [field]: value }));
    };

    const submitManualActivation = async () => {
        if (!manualForm.user_id || !manualForm.plan_id) {
            toast.error('Please select vendor and plan');
            return;
        }
        try {
            setLoading(true);
            const manualRes = await vendorPlanActivationService.manualPurchase({
                user_id: Number(manualForm.user_id),
                plan_id: Number(manualForm.plan_id),
                add_ons: selectedAddOns.map(item => ({
                    id: item.addOnId,
                    quantity: item.quantity
                })),
                promo_code: manualForm.promo_code,
                payment_method: manualForm.payment_method,
            } as any);
            console.log('Manual purchase response:', manualRes);
            const purchaseId = (manualRes as any)?.data?.id
                || (manualRes as any)?.data?.purchase_id
                || (manualRes as any)?.data?.purchase?.id
                || (manualRes as any)?.data?.data?.id
                || (manualRes as any)?.data?.data?.purchase_id
                || (manualRes as any)?.data?.data?.purchase?.id
                || (manualRes as any)?.id;

            if (purchaseId) {
                try {
                    let activationRes = await vendorPlanActivationService.activatePurchase(Number(purchaseId), {
                        payment_method: manualForm.payment_method,
                        promo_code: manualForm.promo_code ?? null,
                    } as any);
                    // If server returns shape not expected or validation fails, retry with empty payload
                    if (!(activationRes as any)?.data && (activationRes as any)?.status === false) {
                        activationRes = await vendorPlanActivationService.activatePurchase(Number(purchaseId), {} as any);
                    }
                    console.log('Activation response:', activationRes);
                    toast.success('Purchase activated');
                    const subId = (activationRes as any)?.data?.subscription?.id
                        || (activationRes as any)?.data?.id
                        || (manualRes as any)?.data?.subscription?.id;
                    const newSub = {
                        id: Number(subId) || Number(`${Date.now()}${Math.floor(Math.random()*1000)}`),
                        user_id: Number(manualForm.user_id),
                        plan_id: Number(manualForm.plan_id),
                        status: (activationRes as any)?.data?.subscription?.status || 'active',
                        raw: {
                            add_ons: selectedAddOns.map(item => ({
                                id: item.addOnId,
                                quantity: item.quantity
                            }))
                        }
                    } as any as VendorSubscriptionItem;
                    setVendorSubscriptions(prev => {
                        const base = Array.isArray(prev) ? prev : [];
                        return [newSub, ...base];
                    });
                    // Remove from pending (if it exists) since activation succeeded
                    const pendingAfter = readPendingSubs().filter((p: any) => `${p.user_id}-${p.plan_id}` !== `${newSub.user_id}-${newSub.plan_id}`);
                    writePendingSubs(pendingAfter);
                } catch (e: any) {
                    const msg = e?.response?.data?.message || e?.message || 'Unknown error';
                    toast.success('Manual purchase created; activation will complete shortly');
                    console.warn('Activation attempt failed, proceeding optimistically. Details:', msg);
                    // Ensure the optimistic subscription is persisted locally so it survives refresh
                    try {
                        const planObj = Array.isArray(vendors) ? vendors.find(p => Number(p.id) === Number(manualForm.plan_id)) : undefined;
                        const planActive = planObj ? normalizeBool((planObj as any).is_active) : undefined;
                        const optimistic: VendorSubscriptionItem = {
                            id: Number(`${Date.now()}${Math.floor(Math.random()*1000)}`),
                            user_id: Number(manualForm.user_id),
                            plan_id: Number(manualForm.plan_id),
                            status: planActive !== undefined ? (planActive ? 'active' : 'inactive') : 'pending',
                            raw: {
                                add_ons: selectedAddOns.map(item => ({
                                    id: item.addOnId,
                                    quantity: item.quantity
                                }))
                            }
                        } as any as VendorSubscriptionItem;
                        // Show it immediately in the main list
                        setVendorSubscriptions(prev => {
                            const base = Array.isArray(prev) ? prev : [];
                            return [optimistic, ...base];
                        });
                        const existing = readPendingSubs();
                        const updated = [optimistic, ...(Array.isArray(existing) ? existing : [])];
                        writePendingSubs(updated);
                    } catch {}
                }
            } else {
                toast.success('Manual purchase created');
                const planObj = Array.isArray(vendors) ? vendors.find(p => Number(p.id) === Number(manualForm.plan_id)) : undefined;
                const planActive = planObj ? normalizeBool((planObj as any).is_active) : undefined;
                const newSub = {
                    id: Number(`${Date.now()}${Math.floor(Math.random()*1000)}`),
                    user_id: Number(manualForm.user_id),
                    plan_id: Number(manualForm.plan_id),
                    status: planActive !== undefined ? (planActive ? 'active' : 'inactive') : 'pending',
                    raw: {
                        add_ons: selectedAddOns.map(item => ({
                            id: item.addOnId,
                            quantity: item.quantity
                        }))
                    }
                } as any as VendorSubscriptionItem;
                setVendorSubscriptions(prev => {
                    const base = Array.isArray(prev) ? prev : [];
                    return [newSub, ...base];
                });
                // Persist optimistic item so it stays after refresh until server returns it
                const existing = readPendingSubs();
                const updated = [newSub, ...(Array.isArray(existing) ? existing : [])];
                writePendingSubs(updated);
            }
            setIsManualDialogOpen(false);
            await new Promise((r) => setTimeout(r, 600));
            await refreshVendorSubscriptions();
        } catch (e) {
            toast.error('Failed to create manual activation');
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const refreshVendorSubscriptions = async () => {
        try {
            const subsRes = await vendorPlanActivationService.getAllVendorsSubscription();
            const pickArray = (val: any): any[] => {
                const direct = (x: any): any[] => {
                    if (Array.isArray(x)) return x;
                    if (!x || typeof x !== 'object') return [];
                    const candidates = ['data','items','subscriptions','records','result','payload'];
                    for (const key of candidates) {
                        const maybe = (x as any)[key];
                        if (Array.isArray(maybe)) return maybe;
                    }
                    // nested case
                    for (const v of Object.values(x)) {
                        const inner = direct(v);
                        if (inner.length) return inner;
                    }
                    return [];
                };
                return direct(val);
            };
            const normalizeSub = (it: any) => ({
                id: it?.id ?? it?.subscription_id ?? it?.subscriptionId ?? it?.subscription?.id ?? Date.now(),
                user_id: it?.user_id ?? it?.userId ?? it?.user?.id ?? it?.vendor_id ?? it?.vendorId ?? 0,
                plan_id: it?.plan_id ?? it?.planId ?? it?.plan?.id ?? 0,
                status: it?.status ?? it?.state ?? it?.subscription?.status ?? '-',
                created_at: it?.created_at ?? it?.createdAt ?? undefined,
                updated_at: it?.updated_at ?? it?.updatedAt ?? undefined,
                raw: {
                    ...it,
                    add_ons: it?.add_ons ?? it?.addOns ?? it?.subscription?.add_ons ?? it?.subscription?.addOns ?? [],
                }
            }) as unknown as VendorSubscriptionItem;
            const subsArr = pickArray(subsRes as any).map(normalizeSub);
            const uniqByKey = (arr: any[]) => {
                const seen = new Set<string>();
                const out: any[] = [];
                for (const it of arr) {
                    const r: any = (it as any).raw || {};
                    const idKey = (it as any).id
                        ?? r.subscription?.id
                        ?? r.id
                        ?? r.subscription_id;
                    const pairKey = (it as any).user_id && (it as any).plan_id
                        ? `u${(it as any).user_id}-p${(it as any).plan_id}`
                        : '';
                    const key = String(idKey || pairKey || `${(it as any).user_id}-${(it as any).plan_id}`);
                    if (!seen.has(key)) {
                        seen.add(key);
                        out.push(it);
                    }
                }
                return out;
            };
            const subsArrDedup = uniqByKey(subsArr);
            // Merge with locally pending optimistic items that server does not yet include
            const pending = readPendingSubs();
            let merged = uniqByKey([...(Array.isArray(pending) ? pending : []), ...subsArrDedup]);
            // Apply stable status fallback from plan.is_active only when status is empty
            merged = (merged as any[]).map((it: any) => {
                const hasStatus = it && it.status && String(it.status).trim() !== '' && String(it.status) !== '-';
                if (hasStatus) return it;
                const planObj = Array.isArray(vendors) ? vendors.find(p => Number(p.id) === Number(it.plan_id)) : undefined;
                const planActive = planObj ? normalizeBool((planObj as any).is_active) : undefined;
                if (planActive !== undefined) {
                    return { ...it, status: planActive ? 'active' : 'inactive' };
                }
                return it;
            });
            console.log('Refresh subscriptions raw:', subsRes);
            console.log('Refresh subscriptions normalized length:', merged.length);
            if (merged[0]) console.log('First normalized subscription:', merged[0]);
            setVendorSubscriptions(merged as any);
        } catch (err) {
            console.error('Failed to refresh vendor subscriptions', err);
        }
    };

    const safeVendorList: VendorListItem[] = Array.isArray(vendorList)
        ? vendorList
        : (Array.isArray((vendorList as any)?.data) ? (vendorList as any).data : []);
    const safeVendorSubscriptions: VendorSubscriptionItem[] = Array.isArray(vendorSubscriptions)
        ? vendorSubscriptions
        : (Array.isArray((vendorSubscriptions as any)?.data) ? (vendorSubscriptions as any).data : []);

    const normalizeBool = (val: any): boolean | undefined => {
        if (typeof val === 'boolean') return val;
        if (typeof val === 'number') return val === 1;
        if (typeof val === 'string') {
            const v = val.trim().toLowerCase();
            if (v === '1' || v === 'true' || v === 'yes' || v === 'active') return true;
            if (v === '0' || v === 'false' || v === 'no' || v === 'inactive') return false;
        }
        return undefined;
    };

    const addAddOn = (addOnId: number) => {
        if (!selectedAddOns.find(item => item.addOnId === addOnId)) {
            setSelectedAddOns([...selectedAddOns, { addOnId, quantity: 1 }]);
        }
    };

    const removeAddOn = (addOnId: number) => {
        setSelectedAddOns(selectedAddOns.filter(item => item.addOnId !== addOnId));
    };

    const updateAddOnQuantity = (addOnId: number, quantity: number) => {
        setSelectedAddOns(selectedAddOns.map(item =>
            item.addOnId === addOnId ? { ...item, quantity: Math.max(1, quantity) } : item
        ));
    };

    const renderStatusBadge = (rawVal: any) => {
        const v = String(rawVal ?? '').toLowerCase();
        const truthy = ['1','true','active','activated','success','ok'];
        const falsy = ['0','false','inactive','deactive','deactivated','disabled','cancelled','canceled'];
        const pending = ['pending','processing','awaiting','queued'];
        let label = '-';
        let cls = 'text-gray-600 bg-gray-100';
        if (pending.includes(v)) { label = 'Pending'; cls = 'text-amber-700 bg-amber-100'; }
        else if (truthy.includes(v)) { label = 'Active'; cls = 'text-green-700 bg-green-100'; }
        else if (falsy.includes(v)) { label = 'Inactive'; cls = 'text-red-700 bg-red-100'; }
        else if (!v && v !== '0') { label = '-'; cls = 'text-gray-600 bg-gray-100'; }
        else { label = rawVal; }
        return <span className={`px-2 py-1 rounded-full text-xs font-medium ${cls}`}>{String(label)}</span>;
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
                            onClick={() => openManualActivation()}
                            className="bg-[#00897B] hover:bg-[#00796B]"
                        >
                            <Plus className="mr-2 h-4 w-4" /> Manual Activation
                        </Button>
                    </div>

                    {loading && (
                        <div className="mb-4 text-sm text-gray-600">Loading data...</div>
                    )}

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
                                        {(Array.isArray(vendors) ? vendors : []).map((vendor) => (
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

                            <div className="mt-6 sm:mt-8 grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                                <Card className="p-3 sm:p-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 mb-3 sm:mb-4">
                                        <h4 className="font-semibold text-sm sm:text-base">Vendors</h4>
                                        <span className="text-xs text-gray-500">Total: {safeVendorList.length}</span>
                                    </div>
                                    <div className="rounded-md border overflow-x-auto">
                                        <Table className="text-xs sm:text-sm">
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="min-w-[150px] sm:min-w-auto">Name</TableHead>
                                                    <TableHead className="min-w-[200px] sm:min-w-auto">Email</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {(safeVendorList).map((v) => (
                                                    <TableRow key={v.id}>
                                                        <TableCell className="whitespace-nowrap sm:whitespace-normal">{(v as any).name ?? '-'}</TableCell>
                                                        <TableCell className="whitespace-nowrap sm:whitespace-normal">{(v as any).email ?? '-'}</TableCell>
                                                    </TableRow>
                                                ))}
                                                {safeVendorList.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell colSpan={2} className="text-center text-xs sm:text-sm text-gray-500 py-3 sm:py-4">No vendors found</TableCell>
                                                    </TableRow>
                                                ) : null}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </Card>

                                <Card className="p-3 sm:p-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 mb-3 sm:mb-4">
                                        <h4 className="font-semibold text-sm sm:text-base">Vendor Subscriptions</h4>
                                        <span className="text-xs text-gray-500">Total: {safeVendorSubscriptions.length}</span>
                                    </div>
                                    <div className="rounded-md border overflow-x-auto">
                                        <Table className="text-xs sm:text-sm">
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="min-w-[120px] sm:min-w-auto">Subscription ID</TableHead>
                                                    <TableHead className="min-w-[80px] sm:min-w-auto">User ID</TableHead>
                                                    <TableHead className="min-w-[70px] sm:min-w-auto">Plan ID</TableHead>
                                                    <TableHead className="min-w-[80px] sm:min-w-auto">Status</TableHead>
                                                    <TableHead className="min-w-[50px] text-right">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {safeVendorSubscriptions.map((s) => {
                                                    const sr = s as any;
                                                    const subId = sr.id ?? sr.raw?.subscription?.id ?? sr.raw?.id ?? sr.raw?.subscription_id;
                                                    const userId = sr.user_id ?? sr.raw?.user_id ?? sr.raw?.user?.id ?? sr.raw?.vendor_id ?? sr.raw?.vendorId;
                                                    const planId = sr.plan_id ?? sr.raw?.plan_id ?? sr.raw?.plan?.id;
                                                    let status = sr.status ?? sr.raw?.status ?? sr.raw?.subscription?.status;
                                                    if (!status || status === '-' || status === '0' || status === 0) {
                                                        const planObj = Array.isArray(vendors) ? vendors.find(p => Number(p.id) === Number(planId)) : undefined;
                                                        const planActive = planObj ? normalizeBool((planObj as any).is_active) : undefined;
                                                        if (planActive !== undefined) {
                                                            status = planActive ? 'active' : 'inactive';
                                                        }
                                                    }
                                                    return (
                                                        <TableRow key={String(subId)}>
                                                            <TableCell className="whitespace-nowrap sm:whitespace-normal">{String(subId ?? '')}</TableCell>
                                                            <TableCell className="whitespace-nowrap sm:whitespace-normal">{String(userId ?? '')}</TableCell>
                                                            <TableCell className="whitespace-nowrap sm:whitespace-normal">{String(planId ?? '')}</TableCell>
                                                            <TableCell className="whitespace-nowrap sm:whitespace-normal">{renderStatusBadge(status)}</TableCell>
                                                            <TableCell className="text-right">
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        setSelectedSubscription(s);
                                                                        setIsViewDialogOpen(true);
                                                                    }}
                                                                    className="h-7 sm:h-8 w-7 sm:w-8 p-0 flex-shrink-0"
                                                                    title="View details"
                                                                >
                                                                    <Eye className="h-3 sm:h-4 w-3 sm:w-4" />
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                                {safeVendorSubscriptions.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell colSpan={5} className="text-center text-xs sm:text-sm text-gray-500 py-3 sm:py-4">No subscriptions found</TableCell>
                                                    </TableRow>
                                                ) : null}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </Card>
                            </div>

                            
                    </>
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
                            <Button variant="secondary" onClick={() => openManualActivation()}>
                                Manual Activation
                            </Button>
                            <Button onClick={handleCreateOrUpdatePlan}
                                className="bg-[#00897B] hover:bg-[#00796B]">
                                {selectedVendor ? 'Update' : 'Create'}
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isManualDialogOpen} onOpenChange={setIsManualDialogOpen}>
                <DialogContent className="w-[95vw] max-w-[95vw] sm:w-full sm:max-w-2xl md:max-w-3xl max-h-[95vh] sm:max-h-[90vh] p-0 flex flex-col gap-0 rounded-lg overflow-hidden">
                    <DialogHeader className="p-4 sm:p-6 bg-gradient-to-r from-[#00897B] to-[#00796B] flex-shrink-0 border-0 m-0">
                        <DialogTitle className="text-white text-lg sm:text-xl m-0 p-0">
                            Manual Activation
                        </DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-6">
                        <form className="space-y-4 sm:space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="manual_vendor" className="text-sm sm:text-base">Vendor</Label>
                                <Select
                                    value={manualForm.user_id === '' ? '' : String(manualForm.user_id)}
                                    onValueChange={(val) => handleManualFormChange('user_id', Number(val))}
                                >
                                    <SelectTrigger
                                        id="manual_vendor"
                                        className="w-full focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none ring-0 outline-none ring-offset-0 focus:ring-offset-0 focus-visible:ring-offset-0 focus:border-transparent focus-visible:border-transparent data-[state=open]:ring-0 text-sm sm:text-base"
                                    >
                                        <SelectValue placeholder="Select vendor" />
                                    </SelectTrigger>
                                    <SelectContent className="w-[90vw] sm:w-auto">
                                        {safeVendorList.map(v => (
                                            <SelectItem key={v.id} value={String(v.id)} className="text-sm sm:text-base">
                                                {('name' in (v as any) ? (v as any).name : `Vendor ${v.id}`)} {('email' in (v as any) && (v as any).email) ? `- ${(v as any).email}` : ''}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="manual_plan" className="text-sm sm:text-base">Plan</Label>
                                <Select
                                    value={manualForm.plan_id === '' ? '' : String(manualForm.plan_id)}
                                    onValueChange={(val) => handleManualFormChange('plan_id', Number(val))}
                                >
                                    <SelectTrigger
                                        id="manual_plan"
                                        className="w-full focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none ring-0 outline-none ring-offset-0 focus:ring-offset-0 focus-visible:ring-offset-0 focus:border-transparent focus-visible:border-transparent data-[state=open]:ring-0 text-sm sm:text-base"
                                    >
                                        <SelectValue placeholder="Select plan" />
                                    </SelectTrigger>
                                    <SelectContent className="w-[90vw] sm:w-auto">
                                        {vendors.map(p => (
                                            <SelectItem key={p.id} value={String(p.id)} className="text-sm sm:text-base">
                                                {p.title} — ${p.price_ht}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Plan Details Summary */}
                            {manualForm.plan_id && vendors.find(v => v.id === Number(manualForm.plan_id)) && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 space-y-2 sm:space-y-3">
                                    <h4 className="font-semibold text-blue-900 text-sm sm:text-base">Selected Plan Details</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                                        <div>
                                            <p className="text-blue-600 font-medium">Title</p>
                                            <p className="text-gray-900 break-words">{vendors.find(v => v.id === Number(manualForm.plan_id))?.title}</p>
                                        </div>
                                        <div>
                                            <p className="text-blue-600 font-medium">Price</p>
                                            <p className="text-gray-900">${vendors.find(v => v.id === Number(manualForm.plan_id))?.price_ht}</p>
                                        </div>
                                        <div>
                                            <p className="text-blue-600 font-medium">Duration</p>
                                            <p className="text-gray-900">{vendors.find(v => v.id === Number(manualForm.plan_id))?.duration_days} days</p>
                                        </div>
                                        <div>
                                            <p className="text-blue-600 font-medium">Status</p>
                                            <p className="text-gray-900">{vendors.find(v => v.id === Number(manualForm.plan_id))?.is_active ? 'Active' : 'Inactive'}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            {/* Add-ons Section */}
                            <div className="space-y-2 sm:space-y-3 border-t pt-4 sm:pt-5">
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                    <Label htmlFor="manual_addons" className="text-sm sm:text-base">Add-ons</Label>
                                    <span className="text-xs sm:text-sm text-gray-500">{selectedAddOns.length} selected</span>
                                </div>
                                <Select
                                    value=""
                                    onValueChange={(val) => {
                                        addAddOn(Number(val));
                                    }}
                                >
                                    <SelectTrigger
                                        id="manual_addons"
                                        className="w-full focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none ring-0 outline-none ring-offset-0 focus:ring-offset-0 focus-visible:ring-offset-0 focus:border-transparent focus-visible:border-transparent data-[state=open]:ring-0 text-sm sm:text-base"
                                    >
                                        <SelectValue placeholder="Select add-on to add" />
                                    </SelectTrigger>
                                    <SelectContent className="w-[90vw] sm:w-auto">
                                        {addOns
                                            .filter(addOn => addOn.is_active && !selectedAddOns.find(item => item.addOnId === addOn.id))
                                            .map(addOn => (
                                                <SelectItem key={addOn.id} value={String(addOn.id)} className="text-sm sm:text-base">
                                                    {addOn.title} — ${Number(addOn.price_ht).toFixed(2)}
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>

                                {/* Selected Add-ons Display */}
                                {selectedAddOns.length > 0 && (
                                    <div className="space-y-2 max-h-[200px] sm:max-h-[250px] overflow-y-auto">
                                        {selectedAddOns.map(item => {
                                            const addOnData = addOns.find(ao => ao.id === item.addOnId);
                                            return (
                                                <div key={item.addOnId} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 bg-gray-50 p-2 sm:p-3 rounded-lg">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-900 break-words">
                                                            {addOnData?.title}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            ${Number(addOnData?.price_ht || 0).toFixed(2)} each
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-1 flex-shrink-0">
                                                        <Input
                                                            type="number"
                                                            min="1"
                                                            max={addOnData?.max_quantity}
                                                            value={item.quantity}
                                                            onChange={(e) => updateAddOnQuantity(item.addOnId, parseInt(e.target.value))}
                                                            className="w-14 sm:w-16 h-8 text-xs text-center"
                                                        />
                                                        <Button
                                                            variant="destructive"
                                                            size="sm"
                                                            onClick={() => removeAddOn(item.addOnId)}
                                                            className="h-8 w-8 p-0 flex-shrink-0"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="manual_payment" className="text-sm sm:text-base">Payment Method</Label>
                                <Input
                                    id="manual_payment"
                                    value={manualForm.payment_method}
                                    onChange={(e) => handleManualFormChange('payment_method', e.target.value)}
                                    placeholder="Manual payment"
                                    className="focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none ring-0 outline-none ring-offset-0 focus:ring-offset-0 focus-visible:ring-offset-0 focus:border-transparent focus-visible:border-transparent text-sm sm:text-base"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="manual_promo" className="text-sm sm:text-base">Promo Code</Label>
                                <Input
                                    id="manual_promo"
                                    value={manualForm.promo_code ?? ''}
                                    onChange={(e) => handleManualFormChange('promo_code', e.target.value || null)}
                                    className="focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none ring-0 outline-none ring-offset-0 focus:ring-offset-0 focus-visible:ring-offset-0 focus:border-transparent focus-visible:border-transparent text-sm sm:text-base"
                                />
                            </div>
                        </form>
                    </div>
                    <DialogFooter className="p-4 sm:p-6 border-t bg-gray-50 flex-shrink-0 gap-2 sm:gap-3 flex-col-reverse sm:flex-row">
                        <Button variant="outline" onClick={() => setIsManualDialogOpen(false)} className="w-full sm:w-auto text-sm sm:text-base">
                            Cancel
                        </Button>
                        <Button onClick={submitManualActivation} className="w-full sm:w-auto bg-[#00897B] hover:bg-[#00796B] text-sm sm:text-base">
                            Create Manual Activation
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                <DialogContent className="w-[95vw] max-w-[95vw] sm:w-full sm:max-w-2xl md:max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto p-0 flex flex-col gap-0 rounded-lg overflow-hidden">
                    <DialogHeader className="bg-gradient-to-r from-[#00897B] to-[#00796B] p-4 sm:p-6 sticky top-0 z-10 border-0 m-0">
                        <DialogTitle className="text-white text-lg sm:text-xl m-0 p-0">
                            Subscription Details
                        </DialogTitle>
                    </DialogHeader>
                    {selectedSubscription && (
                        <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
                            {/* Subscription Information */}
                            <div className="space-y-3 sm:space-y-4">
                                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Subscription Information</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                    <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                                        <p className="text-xs sm:text-sm text-gray-600">Subscription ID</p>
                                        <p className="text-sm sm:text-lg font-semibold text-gray-900 mt-1 break-all">
                                            {(selectedSubscription as any).id ?? (selectedSubscription as any).raw?.subscription?.id ?? 'N/A'}
                                        </p>
                                    </div>
                                    <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                                        <p className="text-xs sm:text-sm text-gray-600">User ID</p>
                                        <p className="text-sm sm:text-lg font-semibold text-gray-900 mt-1">
                                            {(selectedSubscription as any).user_id ?? (selectedSubscription as any).raw?.user_id ?? 'N/A'}
                                        </p>
                                    </div>
                                    <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                                        <p className="text-xs sm:text-sm text-gray-600">Plan ID</p>
                                        <p className="text-sm sm:text-lg font-semibold text-gray-900 mt-1">
                                            {(selectedSubscription as any).plan_id ?? (selectedSubscription as any).raw?.plan_id ?? 'N/A'}
                                        </p>
                                    </div>
                                    <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                                        <p className="text-xs sm:text-sm text-gray-600">Status</p>
                                        <div className="mt-1">
                                            {renderStatusBadge((selectedSubscription as any).status ?? (selectedSubscription as any).raw?.status)}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Vendor Information */}
                            <div className="space-y-3 sm:space-y-4">
                                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Vendor Information</h3>
                                {safeVendorList.find(v => v.id === (selectedSubscription as any).user_id) ? (
                                    <div className="bg-gray-50 p-3 sm:p-4 rounded-lg space-y-3">
                                        <div>
                                            <p className="text-xs sm:text-sm text-gray-600">Name</p>
                                            <p className="text-sm sm:text-base font-semibold text-gray-900 mt-1 break-words">
                                                {(safeVendorList.find(v => v.id === (selectedSubscription as any).user_id) as any)?.name ?? 'N/A'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs sm:text-sm text-gray-600">Email</p>
                                            <p className="text-sm sm:text-base font-semibold text-gray-900 mt-1 break-all">
                                                {(safeVendorList.find(v => v.id === (selectedSubscription as any).user_id) as any)?.email ?? 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                                        <p className="text-xs sm:text-sm text-gray-500">Vendor information not available</p>
                                    </div>
                                )}
                            </div>

                            {/* Plan Information */}
                            <div className="space-y-3 sm:space-y-4">
                                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Plan Information</h3>
                                {vendors.find(v => v.id === (selectedSubscription as any).plan_id) ? (
                                    <div className="bg-gray-50 p-3 sm:p-4 rounded-lg space-y-3">
                                        <div>
                                            <p className="text-xs sm:text-sm text-gray-600">Title</p>
                                            <p className="text-sm sm:text-base font-semibold text-gray-900 mt-1 break-words">
                                                {vendors.find(v => v.id === (selectedSubscription as any).plan_id)?.title ?? 'N/A'}
                                            </p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                            <div>
                                                <p className="text-xs sm:text-sm text-gray-600">Price</p>
                                                <p className="text-sm sm:text-base font-semibold text-gray-900 mt-1">
                                                    ${vendors.find(v => v.id === (selectedSubscription as any).plan_id)?.price_ht ?? 'N/A'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs sm:text-sm text-gray-600">Duration</p>
                                                <p className="text-sm sm:text-base font-semibold text-gray-900 mt-1">
                                                    {vendors.find(v => v.id === (selectedSubscription as any).plan_id)?.duration_days ?? 'N/A'} days
                                                </p>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs sm:text-sm text-gray-600">Description</p>
                                            <p className="text-sm sm:text-base text-gray-900 mt-1 break-words">
                                                {vendors.find(v => v.id === (selectedSubscription as any).plan_id)?.description ?? 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                                        <p className="text-xs sm:text-sm text-gray-500">Plan information not available</p>
                                    </div>
                                )}
                            </div>

                            {/* Add-ons Information */}
                            {(() => {
                                const addOnsToDisplay = (selectedSubscription as any).raw?.add_ons || 
                                                       (selectedSubscription as any).raw?.subscription?.add_ons ||
                                                       (selectedSubscription as any).raw?.addons ||
                                                       [];
                                const hasAddOns = Array.isArray(addOnsToDisplay) && addOnsToDisplay.length > 0;
                                
                                return hasAddOns ? (
                                    <div className="space-y-3 sm:space-y-4 border-t pt-4 sm:pt-5">
                                        <div className="flex items-center justify-between flex-wrap gap-2">
                                            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Add-ons</h3>
                                            <span className="text-xs sm:text-sm font-medium text-teal-600 bg-teal-50 px-3 py-1 rounded-full">
                                                {addOnsToDisplay.length} item{addOnsToDisplay.length !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                        <div className="space-y-2 sm:space-y-3">
                                            {addOnsToDisplay.map((addOn: any, index: number) => {
                                                const addOnData = addOns.find(ao => ao.id === (addOn.id || addOn.addOnId));
                                                const itemTotal = Number(addOnData?.price_ht || 0) * (addOn.quantity || 1);
                                                return (
                                                    <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                                                        <div className="bg-gradient-to-r from-teal-50 to-transparent p-3 sm:p-4">
                                                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-3 mb-2 sm:mb-3">
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-xs uppercase tracking-wide text-teal-600 font-semibold">Add-on</p>
                                                                    <p className="text-sm sm:text-base font-bold text-gray-900 mt-1 break-words">
                                                                        {addOnData?.title || 'Unknown'}
                                                                    </p>
                                                                </div>
                                                                <div className="text-right sm:flex-shrink-0">
                                                                    <p className="text-xs uppercase tracking-wide text-teal-600 font-semibold">Subtotal</p>
                                                                    <p className="text-base sm:text-lg font-bold text-teal-600 mt-1">
                                                                        ${itemTotal.toFixed(2)}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="p-3 sm:p-4 bg-gray-50">
                                                            <div className="grid grid-cols-3 gap-2 sm:gap-4">
                                                                <div>
                                                                    <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Quantity</p>
                                                                    <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-1 sm:mt-2">{addOn.quantity || 1}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Unit Price</p>
                                                                    <p className="text-sm sm:text-lg font-semibold text-gray-900 mt-1 sm:mt-2">
                                                                        ${Number(addOnData?.price_ht || 0).toFixed(2)}
                                                                    </p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Total</p>
                                                                    <p className="text-sm sm:text-lg font-semibold text-teal-600 mt-1 sm:mt-2">
                                                                        ${itemTotal.toFixed(2)}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            {addOnData?.tooltip && (
                                                                <div className="mt-2 sm:mt-3 p-2 bg-white rounded border border-gray-200">
                                                                    <p className="text-xs text-gray-600">{addOnData.tooltip}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        {/* Add-ons Summary */}
                                        <div className="bg-teal-50 border-2 border-teal-200 rounded-lg p-3 sm:p-4 mt-3 sm:mt-4">
                                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                                                <p className="text-xs sm:text-sm font-semibold text-teal-900">Total Add-ons Cost:</p>
                                                <p className="text-lg sm:text-2xl font-bold text-teal-600">
                                                    ${addOnsToDisplay.reduce((sum: number, addOn: any) => {
                                                        const addOnData = addOns.find(ao => ao.id === (addOn.id || addOn.addOnId));
                                                        return sum + (Number(addOnData?.price_ht || 0) * (addOn.quantity || 1));
                                                    }, 0).toFixed(2)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="border-t pt-4 sm:pt-5">
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                                            <p className="text-xs sm:text-sm text-blue-700">
                                                <span className="font-semibold">No Add-ons:</span> This subscription does not include any additional add-ons.
                                            </p>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Timestamps */}
                            <div className="space-y-3 sm:space-y-4">
                                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Additional Information</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                    {(selectedSubscription as any).created_at && (
                                        <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                                            <p className="text-xs sm:text-sm text-gray-600">Created</p>
                                            <p className="text-xs sm:text-sm font-semibold text-gray-900 mt-1 break-all">
                                                {new Date((selectedSubscription as any).created_at).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </p>
                                        </div>
                                    )}
                                    {(selectedSubscription as any).updated_at && (
                                        <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                                            <p className="text-xs sm:text-sm text-gray-600">Updated</p>
                                            <p className="text-xs sm:text-sm font-semibold text-gray-900 mt-1 break-all">
                                                {new Date((selectedSubscription as any).updated_at).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="p-4 sm:p-6 border-t bg-gray-50 flex-shrink-0">
                        <Button variant="outline" onClick={() => setIsViewDialogOpen(false)} className="w-full sm:w-auto text-sm sm:text-base">
                            Close
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default VendorsPlane;