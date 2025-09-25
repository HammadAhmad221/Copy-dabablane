// In your types/menuItem.ts file

export interface MenuItem {
  id: string;
  label: string;
  url: string;
  position: number;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface MenuItemResponse {
  data: MenuItem[];
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

export interface MenuItemFormData {
  label: string;
  url: string;
  position: number;
  is_active: boolean;
  updated_at: string | null;
}