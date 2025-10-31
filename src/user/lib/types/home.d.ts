import { Blane } from './blane';
import { Category } from './category';
import { Banner } from './blane';

export interface City {
  id: number;
  name: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string | null;
  image_link: string;
}

export interface BlaneImage {
  blane_id: number;
  image_url: string;
  image_link: {
    error?: string;
  };
}

export interface Blane {
  id: number;
  name: string;
  description: string;
  price_current: string;
  price_old: string;
  city: string;
  slug: string;
  start_date: string;
  expiration_date: string;
  livraison_in_city: number;
  advantages: string | null;
  views: number;
  created_at: string;
  type: string;
  rating: string;
  blane_images: BlaneImage[];
}

export interface Banner {
  id: number;
  title: string;
  description: string;
  image_link: string;
  link: string;
  btname1: string;
  title2: string;
  description2: string;
  image_link2: string;
  btname2: string;
  link2: string;
  is_video1?: boolean;
  is_video2?: boolean;
  created_at: string;
  updated_at: string;
}

export interface MenuItem {
  id: number;
  label: string;
  url: string;
  position: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}


export interface HomeData {
  cities: City[];
  categories: Category[];
  new_blanes: Blane[];
  popular_blanes: Blane[];
  banner: Banner;
  menu_items: MenuItem[];
  featured_blane:Blane;
}

export interface HomeResponse {
  success: boolean;
  data: HomeData;
} 