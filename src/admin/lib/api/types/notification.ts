export interface BlaneExpirationData {
  blane_id: number;
  blane_name: string;
  expiration_date: string;
  message: string;
}

export interface Notification {
  id: string;
  type: "App\\Notifications\\BlaneExpirationNotification"; // Add other types if needed
  notifiable_type: "App\\Models\\User";
  notifiable_id: number;
  data: BlaneExpirationData;
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaginationLink {
  url: string | null;
  label: string;
  active: boolean;
}

export interface NotificationResponse {
  status: "success";
  data: {
    current_page: number;
    data: Notification[];
    first_page_url: string;
    from: number;
    last_page: number;
    last_page_url: string;
    links: PaginationLink[];
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number;
    total: number;
  };
}

export interface NotificationApiResponse {
  status: "success";
  message: string;
} 