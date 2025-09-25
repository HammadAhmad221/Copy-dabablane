export interface City {
  id: number;
  name: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string | null;
  image_link: string;
  subcategories?: Subcategory[];
}

export interface Subcategory {
  id: number;
  category_id: number;
  name: string;
  slug?: string;
}

export interface Blane {
  id: number;
  name: string;
  description: string;
  images: string[];
  slug: string;
  price_current: number;
  price_old: number;
  rating: string;
  city: string;
  start_date: string;
  expiration_date: string;
  livraison_in_city: number;
  advantages: string;
  type: string;
  blane_images: { image_link: string }[];
  subcategories_id?: number;
  subcategory?: Subcategory;
}

export interface Banner {
  image_link: string;
  title: string;
  description: string;
  link: string;
  btname1: string;
  image_link2: string;
  title2: string;
  description2: string;
  link2: string;
  btname2: string;
}

export interface MenuItem {
  id: number;
  label: string;
  url: string;
  position: number;
}

export interface HomeData {
  categories: Category[];
  cities: City[];
  menu_items: MenuItem[];
  banner: Banner;
  new_blanes: Blane[];
  popular_blanes: Blane[];
  featured_blane:Blane[];
}

export interface HomeResponse {
  success: boolean;
  data: HomeData;
  message?: string;
}

export interface BlaneComponent {
  id: string;
  name: string;
  description: string;
  images: string[];
  slug: string;
  price_current: number;
  price_old: number;
  rating: string;
  city: string;
  start_date: string;
  expiration_date: string;
  livraison_in_city: number;
  advantages: string;
  type: string;
  blane_images: BlaneImage[];
  subcategories_id?: number;
  subcategory?: {
    id: number;
    category_id: number;
    name: string;
    slug?: string;
  };
}

export interface BlaneImage {
  image_link: string | { error: string };
} 