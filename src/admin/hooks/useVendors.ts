import { useState, useCallback } from 'react';
import { vendorApi } from '@/admin/lib/api/services/vendorService';
import { Vendor, VendorStatus, VendorFilters } from '@/admin/lib/api/types/vendor';
import { toast } from 'react-hot-toast';

interface UseVendorsState {
  vendors: Vendor[];
  loading: boolean;
  error: string | null;
  pagination: {
    currentPage: number;
    lastPage: number;
    perPage: number;
    total: number;
  };
  actionLoading: Set<number>;
}

interface UseVendorsActions {
  fetchVendors: (filters?: VendorFilters, page?: number, limit?: number) => Promise<void>;
  updateVendorStatus: (vendor: Vendor, status: VendorStatus, comment?: string) => Promise<void>;
  updateVendor: (vendorData: any) => Promise<void>;
  deleteVendor: (vendor: Vendor) => Promise<void>;
  setPagination: (pagination: Partial<UseVendorsState['pagination']>) => void;
  setError: (error: string | null) => void;
}

export const useVendors = (): UseVendorsState & UseVendorsActions => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPaginationState] = useState({
    currentPage: 1,
    lastPage: 1,
    perPage: 10,
    total: 0
  });
  const [actionLoading, setActionLoading] = useState<Set<number>>(new Set());

  const fetchVendors = useCallback(async (filters?: VendorFilters, page?: number, limit?: number) => {
    try {
      setLoading(true);
      setError(null);

      // Use provided values or defaults, don't depend on current state
      const currentPage = page || 1;
      const currentLimit = limit || 10;

      const response = await vendorApi.getVendors(filters, currentLimit, currentPage);

      // Ensure we have valid data
      const vendorsData = Array.isArray(response.data) ? response.data : [];
      setVendors(vendorsData);

      // Update pagination state using meta object
      setPaginationState({
        currentPage: response.meta.current_page,
        perPage: response.meta.per_page,
        total: response.meta.total,
        lastPage: response.meta.last_page
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Erreur lors du chargement des vendeurs';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []); // Remove dependencies to prevent circular updates

  const updateVendorStatus = useCallback(async (vendor: Vendor, newStatus: VendorStatus, comment?: string) => {
    const originalStatus = vendor.status;

    setActionLoading(prev => new Set(prev).add(vendor.id));

    try {
      // Optimistic update
      setVendors(prev => prev.map(v =>
        v.id === vendor.id ? { ...v, status: newStatus } : v
      ));

      const requestData: any = { status: newStatus };
      if (comment) {
        requestData.comment = comment;
      }

      await vendorApi.updateVendorStatus(String(vendor.id), requestData);

      toast.success(`Statut mis à jour vers ${newStatus}`);
    } catch (error: any) {
      // Revert on failure
      setVendors(prev => prev.map(v =>
        v.id === vendor.id ? { ...v, status: originalStatus } : v
      ));

      const errorMessage = error.response?.data?.message || error.message || 'Échec de la mise à jour du statut';
      toast.error(errorMessage);
    } finally {
      setActionLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(vendor.id);
        return newSet;
      });
    }
  }, []);

  const updateVendor = useCallback(async (vendorData: any): Promise<void> => {
    try {
      const updatedVendor = await vendorApi.updateVendorInfo(vendorData);
      setVendors(prev => prev.map(v => 
        v.id === updatedVendor.id ? updatedVendor : v
      ));
      toast.success('Vendeur mis à jour avec succès');
    } catch (error: any) {
      // Don't show toast for validation errors - they will be displayed inline in the form
      const hasValidationErrors = error.response?.data?.errors && Object.keys(error.response.data.errors).length > 0;
      if (!hasValidationErrors) {
        const errorMessage = error.response?.data?.message || error.message || 'Erreur lors de la mise à jour du vendeur';
        toast.error(errorMessage);
      }
      throw error;
    }
  }, []);

  const deleteVendor = useCallback(async (vendor: Vendor) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le vendeur "${vendor.name}" ?`)) {
      setActionLoading(prev => new Set(prev).add(vendor.id));

      try {
        await vendorApi.deleteVendor(String(vendor.id));
        setVendors(prev => prev.filter(v => v.id !== vendor.id));
        toast.success('Vendeur supprimé avec succès');
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message || 'Erreur lors de la suppression du vendeur';
        toast.error(errorMessage);
      } finally {
        setActionLoading(prev => {
          const newSet = new Set(prev);
          newSet.delete(vendor.id);
          return newSet;
        });
      }
    }
  }, []);

  const setPagination = useCallback((newPagination: Partial<UseVendorsState['pagination']>) => {
    setPaginationState(prev => ({ ...prev, ...newPagination }));
  }, []);

  return {
    vendors,
    loading,
    error,
    pagination,
    actionLoading,
    fetchVendors,
    updateVendorStatus,
    updateVendor,
    deleteVendor,
    setPagination,
    setError
  };
};

