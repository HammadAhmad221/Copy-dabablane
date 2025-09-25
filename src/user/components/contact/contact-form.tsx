import { Button } from '@/user/components/ui/button';
import { Input } from '@/user/components/ui/input';
import { Textarea } from '@/user/components/ui/textarea';
import { useState } from 'react';
import { contactService } from '@/user/lib/api/services/contact';
import { ContactFormData, ContactType } from '@/user/lib/api/types/contact';
import { toast } from 'react-hot-toast';
import { contactFormSchema } from '@/user/lib/api/types/contact';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { CheckCircle2 } from "lucide-react";

interface ContactFormProps {
  initialType?: ContactType;
  onSuccess?: () => void;
}

export const ContactForm = ({ initialType = 'client', onSuccess }: ContactFormProps) => {
  const [formType, setFormType] = useState<ContactType>(initialType);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      subject: '',
      message: '',
      type: initialType,
      privacy: false
    }
  });

  const onSubmit = async (data: ContactFormData) => {
    try {
      const { privacy, ...submitData } = data;
      await contactService.create(submitData);
      
      toast.custom(
        (t) => (
          <div
            className={`${
              t.visible ? 'animate-enter' : 'animate-leave'
            } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 z-50`}
          >
            <div className="flex-1 w-0 p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 pt-0.5">
                  <CheckCircle2 className="h-10 w-10 text-[#19736A] animate-bounce" />
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    Formulaire envoyé avec succès!
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Nous vous répondrons dans les plus brefs délais.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex border-l border-gray-200">
              <button
                onClick={() => toast.dismiss(t.id)}
                className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-[#19736A] hover:text-[#19736A]/80 focus:outline-none"
              >
                Fermer
              </button>
            </div>
          </div>
        ),
        {
          duration: 5000,
          position: 'top-center',
        }
      );

      reset();
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error("Une erreur s'est produite lors de l'envoi du message.", {
        duration: 4000,
        position: 'top-center',
        style: {
          background: '#FEE2E2',
          border: '1px solid #F26666',
          padding: '16px',
          color: '#DC2626',
        },
      });
    }
  };

  // Update form type when type selection changes
  const handleTypeChange = (type: ContactType) => {
    setFormType(type);
    setValue('type', type);
  };

  return (
    <div className="space-y-6">
      {/* User Type Selection */}
      <div className="mb-8 text-center">
        <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-white shadow-sm">
          <label className={`px-4 py-2 rounded-md cursor-pointer transition-all duration-200 ${
            formType === 'client' ? 'bg-gradient-to-r from-[#F26666] to-[#19736A] text-white' : 'text-gray-600 hover:bg-gray-50'
          }`}>
            <input
              type="radio"
              name="userType"
              value="client"
              checked={formType === 'client'}
              onChange={() => handleTypeChange('client')}
              className="sr-only"
            />
            <span>Client</span>
          </label>
          <label className={`px-4 py-2 rounded-md cursor-pointer transition-all duration-200 ${
            formType === 'commercant' ? 'bg-gradient-to-r from-[#F26666] to-[#19736A] text-white' : 'text-gray-600 hover:bg-gray-50'
          }`}>
            <input
              type="radio"
              name="userType"
              value="commercant"
              checked={formType === 'commercant'}
              onChange={() => handleTypeChange('commercant')}
              className="sr-only"
            />
            <span>Commerçant</span>
          </label>
        </div>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label className="block text-[#19736A] font-medium mb-2">
            Prénom et nom <span className="text-red-500">*</span>
          </label>
          <Input 
            {...register('fullName')}
            type="text" 
            placeholder="Votre nom complet"
            className={cn(
              "h-12 border-2 border-gray-200 hover:border-[#19736A] input-transition focus-visible:ring-[#19736A]",
              errors.fullName && "border-red-500 hover:border-red-500"
            )}
          />
          {errors.fullName && (
            <p className="mt-1 text-sm text-red-500">
              {errors.fullName.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-[#19736A] font-medium mb-2">
            Adresse E-mail <span className="text-red-500">*</span>
          </label>
          <Input 
            {...register('email')}
            type="email" 
            placeholder="votre@email.com"
            className={cn(
              "h-12 border-2 border-gray-200 hover:border-[#19736A] input-transition focus-visible:ring-[#19736A]",
              errors.email && "border-red-500 hover:border-red-500"
            )}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-500">
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-[#19736A] font-medium mb-2">
            Téléphone <span className="text-red-500">*</span>
          </label>
          <Input 
            {...register('phone')}
            type="tel" 
            placeholder="+XXX XX XX XX XX"
            className={cn(
              "h-12 border-2 border-gray-200 hover:border-[#19736A] input-transition focus-visible:ring-[#19736A]",
              errors.phone && "border-red-500 hover:border-red-500"
            )}
          />
          {errors.phone && (
            <p className="mt-1 text-sm text-red-500">
              {errors.phone.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-[#19736A] font-medium mb-2">
            Objet <span className="text-red-500">*</span>
          </label>
          <Input 
            {...register('subject')}
            type="text" 
            placeholder="Sujet de votre message"
            className={cn(
              "h-12 border-2 border-gray-200 hover:border-[#19736A] input-transition focus-visible:ring-[#19736A]",
              errors.subject && "border-red-500 hover:border-red-500"
            )}
          />
          {errors.subject && (
            <p className="mt-1 text-sm text-red-500">
              {errors.subject.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-[#19736A] font-medium mb-2">
            Message <span className="text-red-500">*</span>
          </label>
          <Textarea 
            {...register('message')}
            placeholder="Votre message ici..."
            className={cn(
              "min-h-[120px] border-2 border-gray-200 hover:border-[#19736A] input-transition focus-visible:ring-[#19736A]",
              errors.message && "border-red-500 hover:border-red-500"
            )}
          />
          {errors.message && (
            <p className="mt-1 text-sm text-red-500">
              {errors.message.message}
            </p>
          )}
        </div>

        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              {...register('privacy')}
              id="privacy"
              type="checkbox"
              className="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-[#19736A]"
            />
          </div>
          <label htmlFor="privacy" className="ml-2 text-sm font-medium text-gray-600">
            J'accepte la politique de confidentialité <span className="text-red-500">*</span>
          </label>
        </div>
        {errors.privacy && (
          <p className="mt-1 text-sm text-red-500">
            {errors.privacy.message}
          </p>
        )}

        <div>
          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-[#F26666] to-[#19736A] hover:from-[#19736A] hover:to-[#F26666] text-white py-3 rounded-md shadow-md transition-all duration-300 flex items-center justify-center"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Envoi en cours...' : 'Envoyer'}
          </Button>
        </div>
      </form>
    </div>
  );
}; 