export interface BlaneImage {
  id: number;
  blane_id: number;
  image_path: string;
  image_url: string;
}

export interface InsertBlaneImage {
  image_url: File;
  blane_id: number;
}

export type BlaneStatus = "active" | "inactive" | "expired" | "waiting";
export type BlaneType = "reservation" | "order";
export type ReservationType = "pre-reservation" | "reservation";

export interface Blane {
  id: number;
  name: string;
  description: string;
  price_current: number;
  stock?: number;
  type: "reservation" | "order" | "other";
  categories_id: number;
  subcategories_id: number;
  category?: {
    id: number;
    name: string;
  };
  subcategory?: {
    id: number;
    name: string;
  };
  slug:string;
  commerce_name?: string;
  commerce_phone?: string;
  livraison_in_city: number;
  livraison_out_city: number;
  price_old: number | null;
  advantages: string;
  conditions: string;
  city: string;
  status: BlaneStatus;
  start_date: string;
  expiration_date: string | null;
  online: boolean;
  partiel: boolean;
  cash: boolean;
  is_digital?: boolean;
  allow_out_of_city_delivery?: boolean;
  max_orders: number;
  reservation_type?: ReservationType;
  intervale_reservation: number;
  personnes_prestation: number;
  max_reservation_par_creneau?: number;
  blaneImages?: BlaneImage[];
  rating: number;
  images: string[];
  on_top?: boolean;
  heure_debut: string | null;
  heure_fin: string | null;
  on_home?: boolean;
  nombre_max_reservation: number;
  created_at?: string;
  updated_at?: string;
  jours_creneaux?: string[];
  dates?: string[];
  dateRanges?: Array<{ start: string; end: string }>;
  partiel_field?: number;
  tva: number;
  type_time?: "date" | "time";
  visibility?: 'private' | 'public' | 'link';
  share_token?: string;
  share_url?: string;
  share_link?: string;
}

export interface BlaneResponse {
  data: Blane[];
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

export interface BlaneFormData {
  id?: number;
  name: string;
  description: string;
  categories_id: number;
  subcategories_id: number | null;
  price_current: number;
  price_old: number;
  advantages: string;
  conditions: string;
  commerce_name?: string;
  commerce_phone?: string;
  city: string;
  type: BlaneType;
  status: BlaneStatus;
  online: boolean;
  partiel: boolean;
  cash: boolean;
  on_top: boolean;
  is_digital?: boolean;
  allow_out_of_city_delivery?: boolean;
  stock: number;
  max_orders: number;
  livraison_in_city: number;
  livraison_out_city: number;
  start_date: string;
  expiration_date: string | null;
  jours_creneaux: string[];
  dates: string[];
  dateRanges?: Array<{ start: string; end: string }>;
  reservation_type: ReservationType;
  heure_debut: string | null;
  heure_fin: string | null;
  intervale_reservation: number;
  personnes_prestation: number;
  nombre_max_reservation: number;
  max_reservation_par_creneau: number;
  partiel_field: number;
  tva: number;
  type_time?: "date" | "time";
  images?: File[];
  visibility?: 'private' | 'public' | 'link';
  share_token?: string;
  share_url?: string;
}

export interface BlaneImageUpload {
  file: File;
  type: 'jpeg' | 'png' | 'jpg' | 'gif';
  size: number;
}

// Form validation errors interface
export interface BlaneFormErrors {
  name?: string[];
  description?: string[];
  categories_id?: string[];
  subcategories_id?: string[];
  price_current?: string[];
  price_old?: string[];
  advantages?: string[];
  conditions?: string[];
  commerce_name?: string[];
  city?: string[];
  type?: string[];
  status?: string[];
  online?: string[];
  partiel?: string[];
  cash?: string[];
  on_top?: string[];
  is_digital?: string[];
  stock?: string[];
  start_date?: string[];
  expiration_date?: string[];
  images?: string[];
  [key: string]: string[] | undefined;
}

// API request interfaces
export interface BlaneCreateRequest {
  formData: FormData;
}

export interface BlaneUpdateRequest {
  id: string | number;
  formData: FormData;
}

export interface BlaneStatusUpdateRequest {
  id: string | number;
  status: BlaneStatus;
}
