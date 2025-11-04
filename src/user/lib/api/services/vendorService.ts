import axios from 'axios';

const API_BASE_URL = 'https://dev.dabablane.com/api';
const VENDOR_LIST_TOKEN = '384|26kqcKM1TeyeUPJIyojhfyn0s1ayh1VXxCd5CN1pef80916f';
const VENDOR_DETAIL_TOKEN = '340|HTMaR8zkc0hc6sSVEFlVOm3A9lbDCNVEotPfhnog7afacb10';

export interface VendorCoverMediaItem {
  id?: number;
  media_type?: string;
  media_url?: string | null;
  url?: string | null;
}

export interface VendorListItem {
  id: number;
  name?: string | null;
  company_name: string;
  city?: string | null;
  description?: string | null;
  logoUrl?: string | null;
  cover_media?: (VendorCoverMediaItem | string)[];
  businessCategory?: string | null;
  subCategory?: string | null;
}

export interface VendorListResponse {
  data: VendorListItem[];
  meta?: {
    current_page?: number;
    last_page?: number;
    total?: number;
    [key: string]: unknown;
  };
}

export interface VendorDetailData {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
  firebase_uid: string | null;
  phone: string | null;
  city: string | null;
  provider: string | null;
  accessToken: string | null;
  avatar: string | null;
  company_name: string;
  landline: string | null;
  businessCategory: string | null;
  subCategory: string | null;
  description: string | null;
  address: string | null;
  ice: string | null;
  rc: string | null;
  vat: string | null;
  logoUrl: string | null;
  coverPhotoUrl: string | null;
  rcCertificateUrl: string | null;
  ribUrl: string | null;
  rib_account: string | null;
  facebook: string | null;
  tiktok: string | null;
  instagram: string | null;
  district: string | null;
  subdistrict: string | null;
  status: string | null;
  custom_commission_rate: number | null;
}

export interface VendorDetailResponse {
  status: boolean;
  code: number;
  message: string;
  data: VendorDetailData;
}

export class VendorService {
  static async getAllVendors({
    page = 1,
    paginationSize = 20,
  }: {
    page?: number;
    paginationSize?: number;
  } = {}): Promise<VendorListResponse> {
    const response = await axios.get(`${API_BASE_URL}/getAllVendors`, {
      params: {
        status: 'active',
        include: 'coverMedia',
        paginationSize,
        page,
      },
      headers: {
        Authorization: `Bearer ${VENDOR_LIST_TOKEN}`,
        Accept: 'application/json',
      },
    });

    const payload = response.data ?? {};
    const vendorsRaw = payload?.data?.data ?? payload?.data ?? payload ?? [];
    const vendors: VendorListItem[] = Array.isArray(vendorsRaw) ? vendorsRaw : [];
    const meta = payload?.data?.meta ?? payload?.meta;

    return { data: vendors, meta };
  }

  static async getVendorByIdOrCompanyName(
    idOrName: string | number,
  ): Promise<VendorDetailResponse> {
    const isNumeric = typeof idOrName === 'number' || /^\d+$/.test(String(idOrName));
    const params = isNumeric
      ? { id: Number(idOrName) }
      : { company_name: idOrName };

    const response = await axios.get(`${API_BASE_URL}/getVendorByIdOrCompanyName`, {
      params,
      headers: {
        Authorization: `Bearer ${VENDOR_DETAIL_TOKEN}`,
        Accept: 'application/json',
      },
    });

    return response.data as VendorDetailResponse;
  }
}
