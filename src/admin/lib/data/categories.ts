import { Category } from '../types/category';
import { getCategories, defaultParams } from '../services/front/categoryService';

export let categories: Category[] = [];

// Function to initialize the data
const defaultParams = {
  include: 'subcategories',
  limit: 1000,
  sort: 'name',
  order: 'asc'
}
export const initializeCategories = async () => {
  try {
    const fetchedCategorie = await getCategories(defaultParams);
    categories = [
    ]
    // Add fetched data to newBlanes
    categories = [...fetchedCategorie];    
  } catch (error) {
  }
};
initializeCategories();