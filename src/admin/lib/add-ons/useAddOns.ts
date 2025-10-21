import { useState, useCallback } from 'react';
import { addOnsApi } from './api';
import { AddOn } from './types';

export const useAddOns = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [addOns, setAddOns] = useState<AddOn[]>([]);

    const fetchAddOns = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await addOnsApi.getAllAddOns();
            console.log('API Response:', response); // Debug log
            // Check if response.data is an array
            let addOnsData: AddOn[] = [];
            
            if (Array.isArray(response.data)) {
                addOnsData = response.data;
            } else if (response.data && typeof response.data === 'object') {
                addOnsData = response.data.data || [];
            }

            // Ensure all numeric fields are properly converted
            const sanitizedAddOns = addOnsData.map(addOn => ({
                ...addOn,
                price_ht: typeof addOn.price_ht === 'string' ? parseFloat(addOn.price_ht) : Number(addOn.price_ht) || 0,
                max_quantity: typeof addOn.max_quantity === 'string' ? parseInt(addOn.max_quantity) : Number(addOn.max_quantity) || 0
            }));

            setAddOns(sanitizedAddOns);
        } catch (err) {
            console.error('Error fetching add-ons:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch add-ons');
            setAddOns([]); // Reset add-ons on error
        } finally {
            setIsLoading(false);
        }
    }, []);

    const createAddOn = useCallback(async (addOn: AddOn) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await addOnsApi.createAddOn(addOn);
            if (response.success) {
                fetchAddOns(); // Refresh the list
                return true;
            }
            return false;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create add-on');
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [fetchAddOns]);

    const updateAddOn = useCallback(async (id: number, addOn: AddOn) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await addOnsApi.updateAddOn(id, addOn);
            if (response.success) {
                fetchAddOns(); // Refresh the list
                return true;
            }
            return false;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update add-on');
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [fetchAddOns]);

    const deleteAddOn = useCallback(async (id: number) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await addOnsApi.deleteAddOn(id);
            if (response.success) {
                fetchAddOns(); // Refresh the list
                return true;
            }
            return false;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete add-on');
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [fetchAddOns]);

    return {
        addOns,
        isLoading,
        error,
        fetchAddOns,
        createAddOn,
        updateAddOn,
        deleteAddOn,
    };
};