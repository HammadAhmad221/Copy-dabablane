import * as React from "react";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";
import { blaneApi } from "@/admin/lib/api/services/blaneService";
import { categoryApi } from "@/admin/lib/api/services/categoryService";
import { subcategoryApi } from "@/admin/lib/api/services/subcategoryService";
import { cityApi } from "@/admin/lib/api/services/cityService";
import { BlaneFormData, BlaneType, Blane, BlaneImage as BlaneImageType } from "@/admin/lib/api/types/blane";
import { Category } from "@/admin/lib/api/types/category";
import { Subcategory } from "@/admin/lib/api/types/subcategory";
import { City } from "@/admin/lib/api/types/city";
import BlaneForm from "./BlaneForm";
import Loader from "@/admin/components/ui/Loader";
import { BlanImgService } from "@/admin/lib/api/services/blanimgs";
import { BlaneImage } from "@/admin/lib/api/types/blaneImg";

interface BlaneImageWithFile extends BlaneImageType {
  file?: File;
}

const DuplicateBlane: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [initialData, setInitialData] = useState<BlaneFormData | null>(null);
  const [filteredSubcategories, setFilteredSubcategories] = useState<Subcategory[]>([]);
  const [blaneImages, setBlaneImages] = useState<BlaneImageWithFile[]>([]);
  const [allSubcategories, setAllSubcategories] = useState<Subcategory[]>([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        if (!id) return;
  
        const [blaneData, categoriesData, subcategoriesData, citiesData] = await Promise.all([
          blaneApi.getBlane(id) as Promise<Blane>,
          categoryApi.getCategories(),
          subcategoryApi.getSubcategories({ page: 1, paginationSize: 100 }),
          cityApi.getCities(),
        ]);
  
        const filtered = subcategoriesData.data?.filter(
          sub => String(sub.category_id) === String(blaneData.categories_id)
        ) || [];
        setFilteredSubcategories(filtered);

        const formatTimeForInput = (timeString: string) => {
          const time = new Date(`1970-01-01T${timeString}`);
          return time.toTimeString().slice(0, 5);
        };

        const formatDateForInput = (dateString: string) => {
          return dateString.split(' ')[0];
        };
  
        // Format the fetched blane data into BlaneFormData for duplication
        const formattedData: BlaneFormData = {
          name: blaneData.name || '',
          description: blaneData.description || '',
          categories_id: blaneData.categories_id || 0,
          subcategories_id: blaneData.subcategories_id || null,
          price_current: blaneData.price_current || 0,
          price_old: blaneData.price_old || 0,
          advantages: blaneData.advantages || '',
          conditions: blaneData.conditions || '',
          commerce_name: blaneData.commerce_name || '',
          city: blaneData.city?.toString() || '',
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
          dates: blaneData.dates || [],
          dateRanges: blaneData.dateRanges || [],
          reservation_type: blaneData.reservation_type || 'instante',
          heure_debut: blaneData.heure_debut ? formatTimeForInput(blaneData.heure_debut) : null,
          heure_fin: blaneData.heure_fin ? formatTimeForInput(blaneData.heure_fin) : null,
          intervale_reservation: blaneData.intervale_reservation || 0,
          personnes_prestation: blaneData.personnes_prestation || 0,
          nombre_max_reservation: blaneData.nombre_max_reservation || 0,
          max_reservation_par_creneau: blaneData.max_reservation_par_creneau || 0,
          partiel_field: blaneData.partiel_field || 0,
          tva: blaneData.tva || 0,
          type_time: blaneData.type_time || 'time',
          is_digital: blaneData.is_digital || false,
          images: [],
          // Set visibility to private by default when duplicating
          visibility: 'private',
          // Clear any share token as it should be generated anew if needed
          share_token: undefined,
        };
  
        setInitialData(formattedData);
        setCategories(categoriesData.data || []);
        setCities(citiesData.data || []);
        
        // Convert blaneImages to the format expected by BlaneImageWithFile
        const images = (blaneData.blaneImages || []).map(img => ({
          ...img,
          file: undefined
        }));
        setBlaneImages(images);
  
        setAllSubcategories(subcategoriesData.data || []);
  
      } catch (error: unknown) {
        console.error('Failed to load blane data:', error);
        toast.error('Failed to load blane data');
      } finally {
        setLoading(false);
      }
    };
  
    fetchInitialData();
  }, [id]);

  const handleSubmit = async (formData: FormData) => {
    try {
      // Ensure the name has (Copy) suffix
      const name = formData.get('name') as string;
      if (!name?.endsWith('(Copy)')) {
        formData.set('name', `${name} (Copy)`);
      }

      // Add image files to formData
      blaneImages.forEach((image, index) => {
        if (image.file) {
          formData.append(`images[${index}]`, image.file);
        }
      });

      await blaneApi.createBlane(formData);
      toast.success('Blane duplicated successfully!');
      navigate('/admin/blanes');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 
                          typeof error === 'object' && error !== null && 'response' in error && 
                          typeof error.response === 'object' && error.response !== null && 
                          'data' in error.response && typeof error.response.data === 'object' && 
                          error.response.data !== null && 'message' in error.response.data ? 
                          String(error.response.data.message) : 'Failed to duplicate blane';
      toast.error(errorMessage);
    }
  };

  const handleImageDelete = async (imageId: number) => {
    try {
      await BlanImgService.delete(imageId);
      setBlaneImages(prev => prev.filter(img => img.id !== imageId));
      toast.success('Image deleted successfully!');
    } catch (error: unknown) {
      console.error('Failed to delete image:', error);
      toast.error('Failed to delete image');
    }
  };

  const handleCancel = () => {
    navigate('/admin/blanes');
  };

  const handleCategoryChange = (categoryId: number) => {
    // Filter subcategories based on selected category
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
          existingImages={blaneImages as unknown as BlaneImage[]}
          onImageDelete={handleImageDelete}
          isDuplicating={true}
          onCancel={handleCancel}
          onCategoryChange={handleCategoryChange}
        />
      )}
    </motion.div>
  );
};

export default DuplicateBlane; 