export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  city?: string;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
  roles: string[];
}

export interface UserFormData {
  name: string;
  email: string;
  phone?: string;
  city?: string;
  password: string;
  password_confirmation?: string;
  roles: string[];
}

export interface UserFilters {
  page?: number;
  paginationSize?: number;
  sortBy?: string | undefined;
  sortOrder?: 'asc' | 'desc' | undefined;
  search?: string | undefined;
  filters?: Record<string, any>;
}

// Pagination-related interfaces
export interface Links {
  first: string;
  last: string;
  prev: string | null;
  next: string | null;
}

export interface MetaLink {
  url: string | null;
  label: string;
  active: boolean;
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

// Response-related interfaces
export interface UserResponse {
  data: User[];
  links: Links;
  meta: Meta;
}

export interface PaginationState {
  currentPage: number;
  lastPage: number;
  total: number;
  paginationSize: number;
}

export interface ChangePasswordData {
  current_password: string;
  new_password: string;
  confirm_password: string;
}