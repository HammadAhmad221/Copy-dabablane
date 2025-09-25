export interface Category {
  id: string;
  name: string;
  slug: string ;
  image_link: string;
  description?: string;
  subcategories?: Subcategory[];
}

export interface Subcategory {
  id: number;
  category_id: number;
  name: string;
  slug?: string;
}

export interface CategoriesSectionProps {
  categories: Category[];
}

export interface CategoryCardProps {
  category: Category;
} 