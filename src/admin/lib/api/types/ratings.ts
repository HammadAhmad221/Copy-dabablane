export interface RatingType {
    id: number;
    user_id: number;
    blane_id: number;
    rating: number;
    comment: string;
    isFlagged: boolean;
    created_at: string;
    updated_at?: string;
  }
  
  export interface RatingsResponse {
    data: RatingType[];
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
  
  export interface RatingFormData {
    blane_id: number;
    user_id: number;
    rating: number;
    comment: string;
    isFlagged: boolean;
  }
  
  export interface RatingFilters {
    page?: number;
    paginationSize?: number;
    sortBy?: string | null;
    sortOrder?: string | null;
    search?: string | null;
  }