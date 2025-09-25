import { type CarouselApi } from '@/user/components/ui/carousel';

export interface BlaneImage {
  image_link: string | { error: string };
}

export interface Blane {
  id: number;
  name: string;
  slug: string;
  description?: string;
  city?: string;
  start_date?: string;
  expiration_date?: string;
  price_current?: string | number;
  price_old?: string | number;
  advantages?: string;
  livraison_in_city?: number;
  type: 'ecommerce' | 'reservation';
  type_time?: 'time' | 'date';
  created_at: string;
  updated_at: string;
  images?: string[];
  featured_image?: string;
  available_time_slots?: string[];
  jours_creneaux?: string[];
  available_periods?: Period[];
  stock?: number;
  tva?: number;
  is_digital?: boolean;
  partiel?: boolean;
  partiel_field?: number;
  visibility?: 'private' | 'public' | 'link';
  share_token?: string;
  // Add other properties as needed
}

export interface Period {
  start: string;
  end: string;
  period_name: string;
  available: boolean;
  currentReservations: number;
  maxReservations: number;
  remainingCapacity: number;
  percentageFull: number;
  daysCount: number;
  isWeekend: boolean;
}

export interface FeaturedBlaneProps {
  blane: Blane;
}

export interface BlaneCardProps {
  blane: Blane;
}

export interface BlanesSectionProps {
  title: string;
  blanes: Blane[];
  linkUrl: string;
  className?: string;
}

export interface IndicatorButtonProps {
  active: boolean;
  onClick: () => void;
  index: number;
}

export interface Banner {
  image_link: string;
  title: string;
  description: string;
  link: string;
  btname1: string;
}

export interface CarouselState {
  api: CarouselApi | null;
  current: number;
}

export interface BlaneCardUtils {
  displayImages: string[];
  remainingDays: number;
  formattedStartDate: string;
  formattedExpirationDate: string;
  isExpired: boolean;
  discountPercentage: number;
} 