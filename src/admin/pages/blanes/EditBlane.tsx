import * as React from "react";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";
import { blaneApi } from "@/admin/lib/api/services/blaneService";
import { categoryApi } from "@/admin/lib/api/services/categoryService";
import { subcategoryApi } from "@/admin/lib/api/services/subcategoryService";
import { cityApi } from "@/admin/lib/api/services/cityService";
import { BlaneFormData, BlaneType } from "@/admin/lib/api/types/blane";
import { Category } from "@/admin/lib/api/types/category";
import { Subcategory } from "@/admin/lib/api/types/subcategory";
import { City } from "@/admin/lib/api/types/city";
import BlaneForm from "./BlaneForm";
import Loader from "@/admin/components/ui/Loader";
import { BlaneImage } from "@/admin/lib/api/types/blaneImg";

const EditBlane: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [initialData, setInitialData] = useState<BlaneFormData | null>(null);
  const [allSubcategories, setAllSubcategories] = useState<Subcategory[]>([]);
  const [filteredSubcategories, setFilteredSubcategories] = useState<Subcategory[]>([]);
  const [blaneImages, setBlaneImages] = useState<BlaneImage[]>([]);
  const [deleteImages, setDeleteImages] = useState<number[]>([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        if (!id) return;

        // Fetch all required data in parallel
        const [blaneData, categoriesData, subcategoriesData, citiesData] = await Promise.all([
          blaneApi.getBlane(id),
          categoryApi.getCategories(),
          subcategoryApi.getSubcategories({ page: 1, paginationSize: 100 }),
          cityApi.getCities(),
        ]);

        // Debug: Log the actual API response to see what fields are returned
        console.log('🔍 DEBUG: Raw blaneData from API:', blaneData);
        console.log('🔍 DEBUG: All blaneData keys:', Object.keys(blaneData));
        console.log('🔍 DEBUG: reservation_per_day value:', blaneData.reservation_per_day);
        console.log('🔍 DEBUG: order_per_day value:', blaneData.order_per_day);
        
        // Check for alternative field names
        console.log('🔍 DEBUG: reservationPerDay value:', (blaneData as any).reservationPerDay);
        console.log('🔍 DEBUG: orderPerDay value:', (blaneData as any).orderPerDay);
        console.log('🔍 DEBUG: max_reservation_per_day value:', (blaneData as any).max_reservation_per_day);
        console.log('🔍 DEBUG: max_order_per_day value:', (blaneData as any).max_order_per_day);

        // Add "Select Category" option
        const categoriesWithDefault = [
          //{ id: 0, name: 'Select Category' },
          ...categoriesData.data
        ];
        
        setCategories(categoriesWithDefault);
        setAllSubcategories(subcategoriesData.data);

        // Initialize filteredSubcategories only if there's a valid category
        if (blaneData.categories_id && blaneData.categories_id > 0) {
          const filtered = subcategoriesData.data?.filter(
            sub => String(sub.category_id) === String(blaneData.categories_id)
          ) || [];
          setFilteredSubcategories(filtered);
        } else {
          // Start with empty subcategories if no valid category
          setFilteredSubcategories([]);
        }

        // Format the fetched blane data into BlaneFormData
        const formattedData: BlaneFormData = {
          id: blaneData.id, // Add this line to include the ID
          name: blaneData.name || '',
          description: blaneData.description || '',
          categories_id: blaneData.categories_id || 0,
          subcategories_id: blaneData.subcategories_id || null,
          price_current: blaneData.price_current || 0,
          price_old: blaneData.price_old || 0,
          advantages: blaneData.advantages || '',
          conditions: blaneData.conditions || '',
          commerce_name: blaneData.commerce_name || '',
          commerce_phone: blaneData.commerce_phone || '',
          city: blaneData.city || '',
          type: blaneData.type as BlaneType,
          status: blaneData.status,
          online: blaneData.online,
          partiel: blaneData.partiel,
          cash: blaneData.cash,
          on_top: blaneData.on_top || false,
          stock: blaneData.stock || 0,
          max_orders: blaneData.max_orders || 0,
          livraison_in_city: blaneData.livraison_in_city || 0,
          livraison_out_city: blaneData.livraison_out_city || 0,
          start_date: blaneData.start_date ? formatDateForInput(blaneData.start_date) : '',
          expiration_date: blaneData.expiration_date ? formatDateForInput(blaneData.expiration_date) : null,
          jours_creneaux: blaneData.jours_creneaux || [],
          dates: [],
          dateRanges: [],
          reservation_type: blaneData.reservation_type || 'instante',
          heure_debut: blaneData.heure_debut ? formatTimeForInput(blaneData.heure_debut) : null,
          heure_fin: blaneData.heure_fin ? formatTimeForInput(blaneData.heure_fin) : null,
          intervale_reservation: blaneData.intervale_reservation || 0,
          personnes_prestation: blaneData.personnes_prestation || 0,
          nombre_max_reservation: blaneData.nombre_max_reservation || 0,
          max_reservation_par_creneau: blaneData.max_reservation_par_creneau || 0,
          reservation_per_day: blaneData.reservation_per_day || (blaneData as any).reservationPerDay || (blaneData as any).max_reservation_per_day || 0,
          order_per_day: blaneData.order_per_day || (blaneData as any).orderPerDay || (blaneData as any).max_order_per_day || 0,
          partiel_field: blaneData.partiel_field || 0,
          tva: typeof blaneData.tva === 'number' ? blaneData.tva : 0,
          type_time: blaneData.type_time || 'time',
          is_digital: blaneData.is_digital || false,
          visibility: blaneData.visibility || 'private',
          share_token: blaneData.share_token || undefined,
          share_url: blaneData.share_url || undefined,
          // Don't set images here as they're handled separately
        };

        // Debug: Log the formatted data to see what's being passed to the form
        console.log('🔍 DEBUG: Formatted data for form:', formattedData);
        console.log('🔍 DEBUG: Formatted reservation_per_day:', formattedData.reservation_per_day);
        console.log('🔍 DEBUG: Formatted order_per_day:', formattedData.order_per_day);

        // Try to parse date ranges from dates if it's a JSON string
        if (blaneData.dates) {
          try {
            // Check if dates might be a JSON string (both array of strings or array of objects)
            if (typeof blaneData.dates === 'string' && 
                (blaneData.dates.startsWith('[{') || blaneData.dates.startsWith('["'))) {
              // This looks like a JSON array
              const parsedData = JSON.parse(blaneData.dates);              
              if (Array.isArray(parsedData)) {
                if (parsedData.length > 0) {
                  // Check if we have date range objects with start and end
                  if (typeof parsedData[0] === 'object' && parsedData[0].start && parsedData[0].end) {
                    // These are date ranges
                    formattedData.dateRanges = parsedData;
                    formattedData.type_time = 'date'; // Auto select date mode
                    
                    // Also generate individual dates for backwards compatibility
                    const allDates: string[] = [];
                    parsedData.forEach(range => {
                      const start = new Date(range.start);
                      const end = new Date(range.end);
                      const currentDate = new Date(start);
                      
                      while (currentDate <= end) {
                        allDates.push(currentDate.toISOString().split('T')[0]);
                        currentDate.setDate(currentDate.getDate() + 1);
                      }
                    });
                    
                    formattedData.dates = allDates;
                  } else {
                    // These are individual date strings
                    formattedData.dates = parsedData;
                    
                    // Try to group consecutive dates into ranges
                    if (blaneData.type_time === 'date') {
                      const dateRanges = [];
                      let rangeStart = null;
                      let rangeEnd = null;
                      
                      // Sort dates first
                      const sortedDates = [...parsedData].sort();
                      
                      for (let i = 0; i < sortedDates.length; i++) {
                        const currentDate = new Date(sortedDates[i]);
                        
                        if (rangeStart === null) {
                          // Start a new range
                          rangeStart = sortedDates[i];
                          rangeEnd = sortedDates[i];
                        } else {
                          // Check if the current date is consecutive
                          const prevDate = new Date(rangeEnd);
                          prevDate.setDate(prevDate.getDate() + 1);
                          
                          if (currentDate.getTime() === prevDate.getTime()) {
                            // Extend current range
                            rangeEnd = sortedDates[i];
                          } else {
                            // End the current range and start a new one
                            dateRanges.push({ start: rangeStart, end: rangeEnd });
                            rangeStart = sortedDates[i];
                            rangeEnd = sortedDates[i];
                          }
                        }
                      }
                      
                      // Add the last range
                      if (rangeStart !== null) {
                        dateRanges.push({ start: rangeStart, end: rangeEnd });
                      }
                      
                      if (dateRanges.length > 0) {
                        formattedData.dateRanges = dateRanges;
                      }
                    }
                  }
                } else {
                  // Empty array
                  formattedData.dates = [];
                }
              } else {
                formattedData.dates = [];
              }
            } else if (Array.isArray(blaneData.dates)) {
              // Already an array, use as is
              formattedData.dates = blaneData.dates;
              
              // If type_time is 'date', try to construct date ranges
              if (blaneData.type_time === 'date') {
                const dateRanges = [];
                let rangeStart = null;
                let rangeEnd = null;
                
                // Sort dates first
                const sortedDates = [...blaneData.dates].sort();
                
                for (let i = 0; i < sortedDates.length; i++) {
                  const currentDate = new Date(sortedDates[i]);
                  
                  if (rangeStart === null) {
                    // Start a new range
                    rangeStart = sortedDates[i];
                    rangeEnd = sortedDates[i];
                  } else {
                    // Check if the current date is consecutive
                    const prevDate = new Date(rangeEnd);
                    prevDate.setDate(prevDate.getDate() + 1);
                    
                    if (currentDate.getTime() === prevDate.getTime()) {
                      // Extend current range
                      rangeEnd = sortedDates[i];
                    } else {
                      // End the current range and start a new one
                      dateRanges.push({ start: rangeStart, end: rangeEnd });
                      rangeStart = sortedDates[i];
                      rangeEnd = sortedDates[i];
                    }
                  }
                }
                
                // Add the last range
                if (rangeStart !== null) {
                  dateRanges.push({ start: rangeStart, end: rangeEnd });
                }
                
                if (dateRanges.length > 0) {
                  formattedData.dateRanges = dateRanges;
                }
              }
            } else {
              // Not a recognized format
              formattedData.dates = [];
            }
          } catch (err) {
            // If JSON parsing fails, just use as is
            console.error('Error processing dates:', err);
            if (Array.isArray(blaneData.dates)) {
              formattedData.dates = blaneData.dates;
            } else {
              formattedData.dates = [];
            }
          }
        }

        setInitialData(formattedData);
        setCities(citiesData.data || []);
        
        // Convert backend BlaneImage to our local interface
        // Check both 'blaneImages' and 'blane_images' fields to handle different API responses
        const images = blaneData.blaneImages || (blaneData as any).blane_images || [];
        if (images.length > 0) {
          setBlaneImages(images.map((img: {
            id: number, 
            blane_id: number, 
            image_url: string, 
            is_primary?: boolean,
            position?: number,
            created_at?: string,
            updated_at?: string,
            image_link: string
          }) => ({
            id: img.id,
            blaneId: img.blane_id,
            imageUrl: img.image_url,
            isPrimary: Boolean(img.is_primary),
            position: Number(img.position || 0),
            createdAt: String(img.created_at || ''),
            updatedAt: String(img.updated_at || ''),
            imageLink: img.image_link
          })));
        }

      } catch (error) {
        console.error('Error loading blane data:', error);
        toast.error('Failed to load blane data');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [id]);

  const formatDateForInput = (dateString: string) => {
    return dateString.split(' ')[0];
  };

  const formatTimeForInput = (timeString: string | null | undefined) => {
    if (!timeString) return null;
    
    // Remove any trailing 'Z' or timezone information
    timeString = timeString.replace(/ZDH/, '');
    
    // Handle cases where time might be in different formats
    try {
        // If time is already in HH:MM format
        if (/^\d{2}:\d{2}DH/.test(timeString)) {
            return timeString;
        }
        
        // If time is in HH:MM:SS format
        if (/^\d{2}:\d{2}:\d{2}DH/.test(timeString)) {
            return timeString.slice(0, 5);
        }
        
        // If time is in ISO format (e.g., "15:30:00.000Z")
        if (/^\d{2}:\d{2}:\d{2}\.\d{3}Z?DH/.test(timeString)) {
            return timeString.slice(0, 5);
        }
        
        // Try parsing as a full date-time string
        const date = new Date(timeString);
        if (!isNaN(date.getTime())) {
            return date.toTimeString().slice(0, 5);
        }
        
        // If all else fails, try to extract HH:MM from the string
        const timeMatch = timeString.match(/(\d{2}:\d{2})/);
        if (timeMatch && timeMatch[1]) {
            return timeMatch[1];
        }
        
        throw new Error(`Unrecognized time format: ${timeString}`);
    } catch (error) {
        console.error('Error formatting time:', error);
        return null;
    }
  };

  const handleSubmit = async (formData: FormData) => {
    if (!id) return;

    try {
      // Add delete_images to FormData
      deleteImages.forEach(id => {
        formData.append('delete_images[]', id.toString());
      });

      // Fix image array format for Laravel
      const imageFiles = formData.getAll('images');
      formData.delete('images'); // Remove existing images entries
      
      // Append images with correct array format
      imageFiles.forEach(file => {
        if (file instanceof File) {
          formData.append('images[]', file);
        }
      });
      
      // Check if we have a JSON string for dates (date ranges)
      const dateValue = formData.get('dates');
      if (dateValue && typeof dateValue === 'string' && !dateValue.startsWith('[{')) {
        // If it's not already a JSON string, check if we should convert it
        const typeTime = formData.get('type_time');
        if (typeTime === 'date') {
          // Get the dateRanges value and use it for dates
          const dateRangesJson = formData.get('dateRanges');
          if (dateRangesJson) {
            formData.set('dates', dateRangesJson.toString());
          }
        }
      }

      // Fix validation errors from backend
      if (!formData.get('personnes_prestation') || Number(formData.get('personnes_prestation')) < 1) {
        formData.set('personnes_prestation', '1');
      }
      if (!formData.get('nombre_max_reservation') || Number(formData.get('nombre_max_reservation')) < 1) {
        formData.set('nombre_max_reservation', '1');
      }
      if (!formData.get('max_reservation_par_creneau') || Number(formData.get('max_reservation_par_creneau')) < 1) {
        formData.set('max_reservation_par_creneau', '1');
      }

      await blaneApi.updateBlaneFormData(id, formData);
      toast.success('Blane updated successfully!');
      navigate('/admin/blanes');
    } catch (error) {
      console.error('Error updating blane:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to update blane';
      toast.error(errorMessage);
    }
  };

  const handleImageDelete = async (imageId: number) => {
    setDeleteImages(prev => [...prev, imageId]);
    setBlaneImages(prev => prev.filter(img => img.id !== imageId));
    toast.success('Image marked for deletion');
  };

  const handleCancel = () => {
    navigate('/admin/blanes');
  };

  const handleCategoryChange = (categoryId: number) => {
    // Simple direct filter of subcategories - same as CreateBlane
    const filtered = allSubcategories.filter(sub => 
      String(sub.category_id) === String(categoryId)
    );
    setFilteredSubcategories(filtered);
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className=""
    >
      {initialData && (
        <BlaneForm 
          categories={categories}
          subcategories={filteredSubcategories}
          citiesList={cities}
          onSubmit={handleSubmit}
          initialData={initialData}
          existingImages={blaneImages}
          onImageDelete={handleImageDelete}
          onCancel={handleCancel}
          isEditing={true}
          onCategoryChange={handleCategoryChange}
        />
      )}
    </motion.div>
  );
};

export default EditBlane;
