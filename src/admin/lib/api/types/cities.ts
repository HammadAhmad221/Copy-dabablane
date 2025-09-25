export interface CityType {
    id: number;
    name: string;
    is_active: boolean | number;
    created_at: string;
    updated_at: string;
  }
  export interface CitiesResponse {
    data: CityType[];
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
  export interface CitiesFormData {
    name: string;
    is_active?: boolean | number;
  }