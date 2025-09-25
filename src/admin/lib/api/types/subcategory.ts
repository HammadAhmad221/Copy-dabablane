// In your types/subcategory.ts file

export interface Subcategory {
  id: string;
  category_id: string;
  name: string;
  description: string;
  status: boolean | 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface SubcategoryResponse {
  data: Subcategory[];
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

export interface SubcategoryFormData {
  name: string;
  category_id: string;
  description?: string | null;
}


export interface Category {
  id: string;
  name: string;
  description: string;
  icon_url: string;
  status: boolean;
  created_at: string;
  updated_at: string;
  subcategories: Subcategory[];
}