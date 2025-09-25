import { useState, useRef } from 'react';
import { ChevronDown, LineChart, Target, Trophy, ArrowRight } from "lucide-react"
import { contactService } from '../lib/api/services/contact';
import { ContactFormData } from '../lib/types/contact';

const BtoB: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [selectedObjective, setSelectedObjective] = useState<string>("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);
    setValidationErrors({});

    const formData = new FormData(e.currentTarget);
    const data: ContactFormData = {
      fullName: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      type: 'commercant',
      subject: selectedObjective,
      message: formData.get('message') as string,
      privacy: formData.get('acceptPolicy') === 'on'
    };

    try {
      const response = await contactService.create(data);
      if (response.success) {
        setSubmitStatus({
          type: 'success',
          message: 'Merci pour votre message. Nous vous contacterons bientôt.'
        });
        if (formRef.current) {
          formRef.current.reset();
          setSelectedObjective("");
        }
      } else {
        setSubmitStatus({
          type: 'error',
          message: response.message
        });
        if (response.errors) {
          setValidationErrors(response.errors);
        }
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue lors de l\'envoi du message. Veuillez réessayer.';
      setSubmitStatus({
        type: 'error',
        message: errorMessage
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFieldError = (fieldName: string): string | undefined => {
    return validationErrors[fieldName]?.[0];
  };

  return (
    <div className="min-h-screen font-sans">
      {/* Header */}
      <section className="text-gray-600 pt-12 pb-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <h1 className="text-3xl md:text-4xl text-[#197874] font-bold text-center mb-6">
          Spécial B2B <span className="text-[#E66C61]">DabaBlane</span>
          </h1>
          <div className="w-16 h-1 bg-[#E66C61] mx-auto mb-6"></div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-6xl mx-auto px-4 mb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="bg-[#E66C61] w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <LineChart className="text-white" size={24} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Visibilité Maximale</h3>
            <p className="text-gray-600 text-sm">
              Mettez en valeur vos produits et services auprès de milliers de clients potentiels.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="bg-[#E66C61] w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Target className="text-white" size={24} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Marketing Digital</h3>
            <p className="text-gray-600 text-sm">
              Bénéficiez de notre expertise en marketing digital pour développer votre présence en ligne.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="bg-[#197874] w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Trophy className="text-white" size={24} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Support Dédié</h3>
            <p className="text-gray-600 text-sm">Une équipe dédiée pour vous accompagner dans votre croissance.</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-6xl mx-auto px-4 mb-16">
        <div className="bg-gradient-to-r from-[#E66C61] via-[#E66C61] to-[#197874] rounded-lg p-8 md:p-12 text-center text-white">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">
            Développez votre activité en rejoignant
            <br className="hidden md:block" /> notre plateforme
          </h2>
        </div>
      </section>

      {/* Contact Form */}
      <section className="max-w-3xl mx-auto px-4 mb-16">
        <div className="border border-gray-200 rounded-lg p-6 md:p-8">
          {submitStatus && (
            <div className={`mb-6 p-4 rounded-md ${
              submitStatus.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {submitStatus.message}
            </div>
          )}
          <form ref={formRef} onSubmit={handleSubmit}>
            <div className="mb-6">
              <label htmlFor="objective" className="block text-[#197874] mb-2 text-sm">
                Quel est votre objectif principal ? <span className="text-[#E66C61]">*</span>
              </label>
              <div className="relative">
                <select
                  id="objective"
                  name="objective"
                  value={selectedObjective}
                  onChange={(e) => setSelectedObjective(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-md py-2 px-3 appearance-none focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="" disabled>
                    Sélectionnez votre objectif
                  </option>
                  <option value="promotion">Promouvoir mes bons plans</option>
                  <option value="content">Créer du contenu engageant et innovant</option>
                  <option value="visibility">Développer ma visibilité online (site, app, chatbot...)</option>
                  <option value="coaching">Coaching business</option>
                  <option value="externalization">Externaliser mon système de réservations</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              </div>
              {getFieldError('subject') && (
                <p className="mt-1 text-sm text-red-500">{getFieldError('subject')}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label htmlFor="name" className="block text-[#197874] mb-2 text-sm">
                  Prénom et nom <span className="text-[#E66C61]">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
                {getFieldError('fullName') && (
                  <p className="mt-1 text-sm text-red-500">{getFieldError('fullName')}</p>
                )}
              </div>
              <div>
                <label htmlFor="email" className="block text-[#197874] mb-2 text-sm">
                  Email <span className="text-[#E66C61]">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
                {getFieldError('email') && (
                  <p className="mt-1 text-sm text-red-500">{getFieldError('email')}</p>
                )}
              </div>
            </div>

            <div className="mb-6">
              <label htmlFor="phone" className="block text-[#197874] mb-2 text-sm">
                Téléphone <span className="text-[#E66C61]">*</span>
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                required
                className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
              {getFieldError('phone') && (
                <p className="mt-1 text-sm text-red-500">{getFieldError('phone')}</p>
              )}
            </div>

            <div className="mb-6">
              <label htmlFor="message" className="block text-[#197874] mb-2 text-sm">
                Message <span className="text-[#E66C61]">*</span>
              </label>
              <textarea
                id="message"
                name="message"
                required
                rows={5}
                className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              ></textarea>
              {getFieldError('message') && (
                <p className="mt-1 text-sm text-red-500">{getFieldError('message')}</p>
              )}
            </div>

            <div className="mb-6">
              <label className="flex items-start">
                <input
                  type="checkbox"
                  name="acceptPolicy"
                  required
                  className="mt-1 mr-2"
                />
                <span className="text-sm text-gray-600">
                  J&apos;accepte la{" "}
                  <a href="#" className="text-[#E66C61] hover:underline">
                    Politique de Confidentialité
                  </a>
                </span>
              </label>
              {getFieldError('privacy') && (
                <p className="mt-1 text-sm text-red-500">{getFieldError('privacy')}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-[#197874] via-[#197874] to-[#E66C61] text-white py-3 rounded-md font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
              {isSubmitting ? 'Envoi en cours...' : 'Envoyer le message'}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
};

export default BtoB;