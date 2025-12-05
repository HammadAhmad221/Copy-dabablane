import { z } from "zod";

export type VendorStatus = "pending" | "active" | "inActive" | "suspended" | "waiting";

// Zod schemas for validation
export const VendorStatusSchema = z.enum(["pending", "active", "inActive", "suspended", "waiting"]);

export const VendorSchema = z.object({
  id: z.number(),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email format"),
  email_verified_at: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
  firebase_uid: z.string().nullable().optional(),
  phone: z.string().min(1, "Phone is required"),
  city: z.string().min(1, "City is required"),
  provider: z.string().nullable().optional(),
  accessToken: z.string().nullable().optional(),
  avatar: z.string().nullable().optional(),
  company_name: z.string().nullable().optional(),
  landline: z.string().nullable().optional(),
  businessCategory: z.string().nullable().optional(),
  subCategory: z.string().nullable().optional(),
  description: z.string().nullable().optional().transform(val => val || ""),
  address: z.string().nullable().optional().transform(val => val || ""),
  ice: z.string().nullable().optional(),
  rc: z.string().nullable().optional(),
  vat: z.string().nullable().optional(),
  logoUrl: z.string().nullable().optional(),
  coverPhotoUrl: z.string().nullable().optional(),
  rcCertificateUrl: z.string().nullable().optional(),
  blane_limit: z.number().nullable().optional(),
  status: VendorStatusSchema,
  cover_media: z.array(z.union([
    z.string(),
    z.object({ 
      id: z.number().optional(),
      user_id: z.number().optional(),
      media_url: z.string().optional(),
      media_type: z.string().optional(),
      created_at: z.string().optional(),
      updated_at: z.string().optional(),
      url: z.string().optional()
    }).nullable()
  ]).nullable()).optional(),
});

export const CreateVendorRequestSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email format"),
  phone: z.string().min(1, "Phone is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  status: VendorStatusSchema,
  description: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
});

export const UpdateVendorRequestSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  email: z.string().email("Invalid email format").optional(),
  phone: z.string().min(1, "Phone is required").optional(),
  address: z.string().min(1, "Address is required").optional(),
  city: z.string().min(1, "City is required").optional(),
  status: VendorStatusSchema.optional(),
  description: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
});

export const UpdateVendorStatusRequestSchema = z.object({
  status: VendorStatusSchema,
  comment: z.string().optional(),
});

export const VendorFiltersSchema = z.object({
  status: VendorStatusSchema.optional(),
  city: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const VendorListResponseSchema = z.object({
  data: z.array(VendorSchema),
  meta: z.object({
    total: z.number(),
    current_page: z.number(),
    last_page: z.number(),
    per_page: z.number(),
    from: z.number(),
    to: z.number(),
  }),
});

export interface Vendor {
  id: number;
  name: string;
  email: string;
  email_verified_at?: string | null;
  created_at: string;
  updated_at: string;
  firebase_uid?: string | null;
  phone: string;
  city: string;
  provider?: string | null;
  accessToken?: string | null;
  avatar?: string | null;
  company_name?: string | null;
  landline?: string | null;
  businessCategory?: string | null;
  subCategory?: string | null;
  description?: string;
  address?: string;
  ice?: string | null;
  rc?: string | null;
  vat?: string | null;
  logoUrl?: string | null;
  coverPhotoUrl?: string | null;
  rcCertificateUrl?: string | null;
  ribUrl?: string | null;
  district?: string | null;
  subdistrict?: string | null;
  facebook?: string | null;
  tiktok?: string | null;
  instagram?: string | null;
  blane_limit?: number | null;
  status: VendorStatus;
  cover_media?: (string | {
    id?: number;
    user_id?: number;
    media_url?: string;
    media_type?: string;
    created_at?: string;
    updated_at?: string;
    url?: string;
  } | null)[];
}

export interface CreateVendorRequest {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  status: VendorStatus;
  description?: string;
  website?: string;
}

export interface UpdateVendorRequest {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  status?: VendorStatus;
  description?: string;
  website?: string;
  landline?: string;
  businessCategory?: string;
  subCategory?: string;
  ice?: string;
  rc?: string;
  vat?: string;
  district?: string;
  subdistrict?: string;
  logoUrl?: string;
  facebook?: string;
  tiktok?: string;
  instagram?: string;
  blane_limit?: string | number;
  cover_media_urls?: string[];
  rcCertificateUrl?: string;
  ribUrl?: string;
}

export interface UpdateVendorStatusRequest {
  status: VendorStatus;
  comment?: string;
}

export interface VendorFilters {
  status?: VendorStatus;
  city?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface VendorListResponse {
  data: Vendor[];
  meta: {
    total: number;
    current_page: number;
    last_page: number;
    per_page: number;
    from: number;
    to: number;
  };
}


