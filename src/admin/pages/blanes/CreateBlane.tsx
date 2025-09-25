import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { blaneApi } from '@/admin/lib/api/services/blaneService'
import { categoryApi } from '@/admin/lib/api/services/categoryService'
import { subcategoryApi } from '@/admin/lib/api/services/subcategoryService'
import { cityApi } from '@/admin/lib/api/services/cityService'
import { City } from '@/admin/lib/api/types/city'
import { toast } from 'react-hot-toast'
import { Category } from '@/admin/lib/api/types/category'
import { Subcategory } from '@/admin/lib/api/types/subcategory'
import BlaneForm from './BlaneForm'
import Loader from '@/admin/components/ui/Loader'
import { motion } from 'framer-motion'
import { BlaneFormData } from '@/admin/lib/api/types/blane'

const CreateBlane = () => {
  const navigate = useNavigate()
  const [categories, setCategories] = useState<Category[]>([])
  const [allSubcategories, setAllSubcategories] = useState<Subcategory[]>([])
  const [filteredSubcategories, setFilteredSubcategories] = useState<Subcategory[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [loading, setLoading] = useState(true)

  // Create initial data with default visibility set to private
  const initialData: Partial<BlaneFormData> = {
    visibility: 'private'
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesRes, subcategoriesRes, citiesRes] = await Promise.all([
          categoryApi.getCategories(),
          subcategoryApi.getSubcategories({ page: 1, paginationSize: 100 }),
          cityApi.getCities()
        ])
        setCategories([{ id: 0, name: 'Select Category' }, ...categoriesRes.data])
        setAllSubcategories(subcategoriesRes.data)
        setCities(citiesRes.data)
      } catch (error) {
        toast.error('Erreur lors du chargement des données')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleCategoryChange = (categoryId: number) => {
    const filtered = allSubcategories.filter(sub => 
      String(sub.category_id) === String(categoryId)
    );
    setFilteredSubcategories(filtered);
  }

  const handleSubmit = async (formData: FormData) => {
    try {
      // Don't cast FormData to BlaneFormData - the API expects FormData
      const response = await blaneApi.createBlane(formData);
      toast.success('Blane created successfully!')
      navigate('/admin/blanes')
      return null
    } catch (error: any) {
      console.error("CreateBlane - Error details:", error.response?.data);
      if (error.response?.data?.errors) {
        toast.error('Validation failed')
        return error.response.data.errors
      }
      toast.error('Failed to create blane')
      return null
    }
  }

  if (loading) {
    return <Loader />
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className=""
    >
      <BlaneForm 
        categories={categories}
        subcategories={filteredSubcategories}
        citiesList={cities}
        onSubmit={handleSubmit}
        initialData={initialData as BlaneFormData}
        onCategoryChange={handleCategoryChange}
      />
    </motion.div>
  )
}

export default CreateBlane