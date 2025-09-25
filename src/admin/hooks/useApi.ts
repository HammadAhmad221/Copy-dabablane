import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { categoryApi } from '../lib/api/services/categoryService';
import { subcategoryApi } from '../lib/api/services/subcategoryService';
import { blaneApi } from '../lib/api/services/blaneService';
import { userApi } from '../lib/api/services/userService';
import { cityApi } from '../lib/api/services/cityService';
import { ratingApi } from '../lib/api/services/ratingService';
import { contactApi } from '../lib/api/services/contact';
import { bannerApi } from '../lib/api/services/bannerService';
import { Category, CategoryResponse } from '../lib/api/types/category';
import { SubcategoryResponse } from '../lib/api/types/subcategory';
import { BlaneResponse } from '../lib/api/types/blane';
import { UserResponse, UserFilters } from '../lib/api/types/user';
import { CitiesResponse } from '../lib/api/types/cities';
import { toast } from 'react-hot-toast';

// Categories hooks
export const useCategories = (params = {}) => {
  return useQuery<CategoryResponse, Error>({
    queryKey: ['categories', params],
    queryFn: () => categoryApi.getCategories(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Subcategories hooks
export const useSubcategories = (params = {}) => {
  return useQuery<SubcategoryResponse, Error>({
    queryKey: ['subcategories', params],
    queryFn: () => subcategoryApi.getSubcategories(params),
    staleTime: 5 * 60 * 1000,
  });
};

// Blanes hooks
export const useBlanes = (params = {}) => {
  return useQuery<BlaneResponse, Error>({
    queryKey: ['blanes', params],
    queryFn: () => blaneApi.getBlanes(params),
    staleTime: 5 * 60 * 1000,
  });
};

// Users hooks
export const useUsers = (filters: UserFilters = {}) => {
  return useQuery<UserResponse, Error>({
    queryKey: ['users', filters],
    queryFn: () => userApi.getUsers(filters),
    staleTime: 5 * 60 * 1000,
  });
};

// Cities hooks
export const useCities = (params = {}) => {
  return useQuery<CitiesResponse, Error>({
    queryKey: ['cities', params],
    queryFn: () => cityApi.getCities(params),
    staleTime: 30 * 60 * 1000, // 30 minutes - cities don't change often
  });
};

// Ratings hooks
export const useRatings = () => {
  return useQuery({
    queryKey: ['ratings'],
    queryFn: ratingApi.getRatings,
    staleTime: 5 * 60 * 1000,
  });
};

// Contacts hooks
export const useContacts = (params = {}) => {
  return useQuery({
    queryKey: ['contacts', params],
    queryFn: () => contactApi.getContacts(params),
    staleTime: 5 * 60 * 1000,
  });
};

// Banner hooks
export const useBanners = () => {
  return useQuery({
    queryKey: ['banners'],
    queryFn: bannerApi.getBanners,
    staleTime: 30 * 60 * 1000,
  });
};

// Mutation hooks for data updates
export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: categoryApi.createCategory,
    onSuccess: () => {
      toast.success('Category created successfully');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (error) => {
      toast.error(`Failed to create category: ${error.message}`);
    }
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: categoryApi.updateCategory,
    onSuccess: () => {
      toast.success('Category updated successfully');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (error) => {
      toast.error(`Failed to update category: ${error.message}`);
    }
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: categoryApi.deleteCategory,
    onSuccess: () => {
      toast.success('Category deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (error) => {
      toast.error(`Failed to delete category: ${error.message}`);
    }
  });
}; 