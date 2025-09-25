export interface MerchantOffer {
    id: string;
    merchant_id: string;
    offer_details: string;
    validity: string;
    created_at: string | null;
    updated_at: string | null;
  }
  export interface MerchantOfferFormData {
    merchant_id: string;
    offer_details: string;
    validity: string; // Date in string format (e.g., "2023-12-31")
    updated_at: string | null;
  }