import React, { useState, useRef } from 'react';
import { ChevronDown } from "lucide-react"
import { contactService } from '../lib/api/services/contact';
import { ContactFormData } from '../lib/api/types/contact';

const Contact: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"client" | "merchant">("client")
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
  const [selectedObjective, setSelectedObjective] = useState<string>("");
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
      type: activeTab === 'merchant' ? 'commercant' : 'client',
      subject: activeTab === 'merchant' ? selectedObjective : (formData.get('subject') as string),
      message: formData.get('message') as string,
    };

    try {
      const response = await contactService.create(data);
      if (response.success) {
        setSubmitStatus({ type: 'success', message: 'Merci pour votre message. Nous vous contacterons bientôt.' });
        if (formRef.current) {
          formRef.current.reset();
          setSelectedObjective("");
        }
      } else {
        setSubmitStatus({ type: 'error', message: response.message });
        if (response.errors) {
          setValidationErrors(response.errors);
        }
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue. Veuillez réessayer.';
      setSubmitStatus({ type: 'error', message: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFieldError = (fieldName: string): string | undefined => {
    return validationErrors[fieldName]?.[0];
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Contactez-nous</h1>
          <p className="text-gray-600">Nous sommes là pour vous aider et répondre à toutes vos questions</p>
        </div>

        {/* Tab Selection */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-md overflow-hidden border border-gray-200">
            <button
              className={`px-6 py-2 text-sm font-medium ${
                activeTab === "client"
                  ? "bg-gradient-to-r from-[#E66C61] to-[#197874] text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
              onClick={() => setActiveTab("client")}
            >
              Client
            </button>
            <button
              className={`px-6 py-2 text-sm font-medium ${
                activeTab === "merchant"
                  ? "bg-gradient-to-r from-[#E66C61] to-[#197874] text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
              onClick={() => setActiveTab("merchant")}
            >
              Commerçant
            </button>
          </div>
        </div>

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
              {activeTab === "merchant" && (
                <div className="mb-6">
                  <label htmlFor="objective" className="block text-[#197874] mb-2 text-sm">
                    Quel est votre objectif principal ? <span className="text-[#E66C61]">*</span>
                  </label>
                  <div className="relative">
                    <select
                      id="objective"
                      name="objective"
                      required
                      value={selectedObjective}
                      onChange={(e) => {
                        const selectedOption = e.target.options[e.target.selectedIndex];
                        setSelectedObjective(selectedOption.text);
                      }}
                      className={`w-full border ${getFieldError('subject') ? 'border-red-500' : 'border-gray-300'} rounded-md py-2 px-3 appearance-none focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent`}
                    >
                      <option value="">Sélectionnez votre objectif</option>
                      <option value="Promouvoir mes bons plans">Promouvoir mes bons plans</option>
                      <option value="Créer du contenu engageant et innovant">Créer du contenu engageant et innovant</option>
                      <option value="Développer ma visibilité online (site, app, chatbot...)">Développer ma visibilité online (site, app, chatbot...)</option>
                      <option value="Coaching business">Coaching business</option>
                      <option value="Externaliser mon système de réservations">Externaliser mon système de réservations</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  </div>
                  {getFieldError('subject') && (
                    <p className="mt-1 text-sm text-red-500">{getFieldError('subject')}</p>
                  )}
                </div>
              )}

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
                    className={`w-full border ${getFieldError('fullName') ? 'border-red-500' : 'border-gray-300'} rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent`}
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
                    className={`w-full border ${getFieldError('email') ? 'border-red-500' : 'border-gray-300'} rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent`}
                  />
                  {getFieldError('email') && (
                    <p className="mt-1 text-sm text-red-500">{getFieldError('email')}</p>
                  )}
                </div>
              </div>

              <div className="mb-6">
                <label htmlFor="phone" className="block text-[#197874] mb-2 text-sm">
                  Téléphone
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  className={`w-full border ${getFieldError('phone') ? 'border-red-500' : 'border-gray-300'} rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent`}
                />
                {getFieldError('phone') && (
                  <p className="mt-1 text-sm text-red-500">{getFieldError('phone')}</p>
                )}
              </div>

              {activeTab === "client" && (
                <div className="mb-6">
                  <label htmlFor="subject" className="block text-[#197874] mb-2 text-sm">
                    Objet <span className="text-[#E66C61]">*</span>
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    required
                    className={`w-full border ${getFieldError('subject') ? 'border-red-500' : 'border-gray-300'} rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent`}
                  />
                  {getFieldError('subject') && (
                    <p className="mt-1 text-sm text-red-500">{getFieldError('subject')}</p>
                  )}
                </div>
              )}

              <div className="mb-6">
                <label htmlFor="message" className="block text-[#197874] mb-2 text-sm">
                  Message <span className="text-[#E66C61]">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={5}
                  className={`w-full border ${getFieldError('message') ? 'border-red-500' : 'border-gray-300'} rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent`}
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
    </div>
  );
};

export default Contact; 