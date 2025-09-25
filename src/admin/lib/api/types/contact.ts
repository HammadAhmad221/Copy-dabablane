import { z } from "zod";

export const contactFormSchema = z.object({
  fullName: z.string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(50, "Le nom ne peut pas dépasser 50 caractères"),
  email: z.string()
    .email("Veuillez entrer une adresse email valide"),
  subject: z.string()
    .min(3, "L'objet doit contenir au moins 3 caractères")
    .max(100, "L'objet ne peut pas dépasser 100 caractères"),
  message: z.string()
    .min(10, "Le message doit contenir au moins 10 caractères")
    .max(1000, "Le message ne peut pas dépasser 1000 caractères"),
  type: z.enum(['client', 'commercant']),
  phone: z.string().optional(),
  privacy: z.boolean()
    .refine((val) => val === true, {
      message: "Vous devez accepter la politique de confidentialité"
    })
});

export type ContactFormData = z.infer<typeof contactFormSchema>;

export type ContactStatus = 'pending' | 'read' ;
export type ContactType = 'commercant' | 'client';

export interface Contact extends ContactFormData {
    id: string;
    created_at: string;
}

export interface ContactResponse {
    data: Contact[];
    meta: {
        current_page: number;
        from: number | null;
        last_page: number;
        per_page: number;
        total: number;
    };
}

