export interface Blane {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price_current: number;
  price_old?: number;
  type: 'reservation' | 'order';
  stock?: number;
  expiration_date: string;
  livraison_in_city?: number;
  images?: BlaneImage[];
  tva?: number;
  partiel_field?: string;
  is_digital?: boolean;
}

export interface BlaneImage {
  id: string;
  blane_id: string;
  url: string;
  alt?: string;
  is_main: boolean;
} 