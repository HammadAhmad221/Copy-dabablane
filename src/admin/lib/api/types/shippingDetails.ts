export interface ShippingDetail {
    id: string;
    order_id: string;
    address_id: string;
    shipping_fee: number;
    created_at: string | null;
    updated_at: string | null;
  }
  export interface ShippingDetailFormData {
    order_id: string;
    address_id: string;
    shipping_fee: number;
    updated_at: string | null;
  }