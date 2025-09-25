export interface Merchant {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    created_at: string | null;
    updated_at: string | null;
  }
  export interface MerchantFormData {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    updated_at: string | null;
  }