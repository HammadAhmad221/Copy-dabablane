import { z } from 'zod';

export interface Category {
  id: string;
  name: string;
  icon_url: string;
  image_url: string;
  description: string;
  status: boolean;
  created_at: string;
  updated_at: string;
  subcategories: Subcategory[];
  slug: string;
  image_link: string;
}

export interface CategoryResponse {
  data: Category[];
  links: Links;
  meta: Meta;
}

export interface Links {
  first: string;
  last: string;
  prev: string | null;
  next: string | null;
}

export interface Meta {
  current_page: number;
  from: number;
  last_page: number;
  links: MetaLink[];
  path: string;
  per_page: number;
  to: number;
  total: number;
}

export interface MetaLink {
  url: string | null;
  label: string;
  active: boolean;
}

export interface CategoryFormData {
  name: string;
  description: string | null;
  image_file: File | null;
  slug?: string;
  subcategories?: {
    id?: string;
    name: string;
    description?: string | null;
  }[];
}

// Update validation schema to allow 5MB images
export const categoryValidationSchema = z.object({
  name: z.string()
    .min(1, 'The name field is required.')
    .max(255, 'The name must not be greater than 255 characters.')
    .transform(val => val.trim())
    .refine((val) => val.length > 0, {
      message: 'The name field is required.'
    }),
  description: z.string()
    .min(1, 'The description field is required.')
    .max(500, 'The description must not be greater than 500 characters.')
    .transform(val => val.trim()),
  image_file: z.any()
    .nullable()  // Allow null for editing
    .optional()  // Make it optional
    .refine((file) => {
      if (!file) return true; // Skip validation if no file
      return file instanceof File;
    }, "The image must be a file.")
    .refine((file) => {
      if (!file) return true; // Skip validation if no file
      return ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'].includes(file.type);
    }, 'The image must be a file of type: jpeg, png, jpg, gif.'),
  subcategories: z.array(z.object({
    id: z.string().optional(),
    name: z.string()
      .min(1, 'The subcategory name field is required.')
      .max(255, 'The subcategory name must not be greater than 255 characters.'),
    description: z.string()
      .min(1, 'The subcategory description field is required.')
      .max(500, 'The subcategory description must not be greater than 500 characters.'),
  })).optional(),
});

export interface Subcategory {
  id: string;
  category_id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface SubcategoryFormData {
  name: string;
  description: string;
  category_id: string;
}

// Add new validation schema for subcategories
export const subcategoryValidationSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(50, 'Name must be less than 50 characters'),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  category_id: z.string()
    .min(1, 'Category is required'),
});

export interface CatalogueBlane {
  id: number;
  name: string;
  description: string;
  price_current: string;
  price_old: string;
  advantages: string;
  conditions: string;
  city: string;
  status: string;
}
