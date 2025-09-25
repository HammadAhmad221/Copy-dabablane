export interface BannerType {
  id: number;
  title: string | null;
  description: string | null;
  image_url: string | null;
  link: string | null;
  btname1: string | null;
  title2: string | null;
  description2: string | null;
  image_url2: string | null;
  btname2: string | null;
  link2: string | null;
  created_at: string;
  updated_at: string;
  image_link?: string | { error: string };
  image_link2?: string | { error: string };
}
export interface BannerResponse {
  data: BannerType[];
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
export interface BannerFormData {
  title: string;
  description: string;
  image1: File | string | null;
  image2: File | string | null;
  btname1: string;
  link: string;
  title2: string;
  description2: string;
  btname2: string;
  link2: string;
}
