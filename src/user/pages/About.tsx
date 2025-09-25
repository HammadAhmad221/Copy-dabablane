import React, { useState } from 'react';
import { ChevronDown, TwitterIcon as TikTok, Instagram, HandHeart, Lightbulb, Users } from "lucide-react";
import dabalabsImage from "@/assets/images/dabalabs.jpg";
import hamza from "@/assets/images/hamza.jpg";

const faqItems = [
  {
    question: "Comment fonctionne DabaBane ?",
    answer:
      "DabaBlane connecte les commerçants locaux à leurs clients à travers une plateforme simple, pratique et 100 % marocaine. Vous présentez vos offres, les utilisateurs réservent ou découvrent vos services en quelques clics.",
  },
  {
    question: "Comment devenir vendeur sur la DabaBane ?",
    answer:
      "Contactez-nous directement via Instagram, WhatsApp, téléphone ou e-mail, ou remplissez le formulaire juste au-dessus. Notre équipe paramétre votre offre selon vos enjeux et nous la publions en moins d'une heure.",
  },
  {
    question: "Comment sont gérés les paiements ?",
    answer:
      "Nous mettons en place des solutions de paiement sécurisées et fiables, pensées pour rassurer à la fois les commerçants et les clients.",
  },
]

const About: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen font-sans">
      {/* Header Section */}
      <section className="text-gray-600 pt-12 pb-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <h1 className="text-3xl md:text-4xl text-[#197874] font-bold text-center mb-6">
            À propos de <span className="text-[#E66C61]">DabaBlane</span>
          </h1>
          <div className="w-16 h-1 bg-[#E66C61] mx-auto mb-6"></div>
          <p className="text-lg text-center max-w-3xl mx-auto">
            Vivre le meilleur, simplement. Une plateforme moderne et engagée pour découvrir et réserver des expériences uniques.
          </p>
        </div>
      </section>
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="relative h-[300px] md:h-[400px] rounded-lg overflow-hidden">
            <img src="https://images.unsplash.com/photo-1556761175-b413da4baf72" alt="DabaBane workspace" className="object-cover" />
          </div>
          <div>

            <div className="space-y-4 text-gray-600">
              <p className="flex gap-2">
                <span>
                  <strong className='text-[#197874] text-xl'>DabaBane</strong> c'est une plateforme moderne et engagée, conçue pour vous aider à découvrir et réserver
                  facilement des expériences dans les domaines du bien-être, loisirs, lifestyle... Notre ambition :
                  digitaliser le commerce de proximité au Maroc, tout en remettant le point de vente et l'expérience
                  client au centre de la relation.
                </span>
              </p>

              <p className="flex gap-2">
                <span>
                  <strong className='text-[#E66C61] text-xl'>Notre mission</strong> côté utilisateurs : vous faire gagner du temps, vous inspirer, vous
                  donner accès aux meilleurs plans en un clic. Côté commerçants : simplifier votre quotidien digital,
                  booster votre visibilité et vous donner des outils concrets pour gérer vos réservations, votre image
                  et votre croissance.
                </span>
              </p>

              <p className="flex gap-2">
                <span>
                  <strong className='text-[#197874] text-xl'>Une vision hybride et engagée</strong> chez DabaBane, nous croyons à une tech simple, utile et
                  humaine. Nous ne remplaçons pas l'expérience terrain : nous l'amplifions. Notre approche est locale,
                  ancrée dans le réel, pensée pour le Maroc d'aujourd'hui et de demain.
                </span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-center text-[#197874] mb-2">Nos valeurs</h2>
        <div className="w-16 h-1 bg-[#E66C61] mx-auto mb-12"></div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Value 1 */}
          <div className="shadow-md border p-6 rounded-lg text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <HandHeart className="text-[#E66C61]" size={32} />
            </div>
            <h3 className="text-xl font-semibold text-[#E66C61] mb-3">Confiance</h3>
            <p className="text-gray-600 text-sm">
              La transparence et l'honnêteté sont au cœur de toutes nos interactions.
            </p>
          </div>

          {/* Value 2 */}
          <div className="shadow-md border p-6 rounded-lg text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lightbulb className="text-[#E66C61]" size={32} />
            </div>
            <h3 className="text-xl font-semibold text-[#E66C61] mb-3">Innovation</h3>
            <p className="text-gray-600 text-sm">
              Nous innovons constamment pour améliorer l'expérience de nos utilisateurs.
            </p>
          </div>

          {/* Value 3 */}
          <div className="shadow-md border p-6 rounded-lg text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="text-[#E66C61]" size={32} />
            </div>
            <h3 className="text-xl font-semibold text-[#E66C61] mb-3">Communauté</h3>
            <p className="text-gray-600 text-sm">Nous construisons des liens durables entre commerçants et clients.</p>
          </div>
        </div>
      </section>

      {/* DabaLabs Section */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-center text-[#197874] mb-2">DabaLabs</h2>
        <div className="w-16 h-1 bg-[#E66C61] mx-auto mb-6"></div>
        <p className="text-center text-lg text-gray-600 mb-12">Notre expertise B2B au service des pros</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="relative h-[350px] rounded-lg overflow-hidden">
            <img src={dabalabsImage} alt="DabaLabs team" className="object-cover" />
          </div>

          <div className="space-y-4">
            <p className="text-gray-600">
              En parallèle de notre plateforme, nous avons lancé DabaLabs, un studio agile et innovant qui accompagne
              les commerçants, PME et marques avec des services B2B à forte valeur ajoutée :
            </p>

            <ul className="space-y-2 text-gray-600">
              <li>
                <strong>Marketing & communication</strong> : visuel, vidéos, campagnes 360°...
              </li>
              <li>
                <strong>Digital & IA</strong> : site web, chatbot, applications, formation IA...
              </li>
              <li>
                <strong>Business & stratégie</strong> : audit, conseil, prise de parole, accompagnement sur mesure
              </li>
            </ul>

            <div className="bg-yellow-50 border-l-4 rounded-lg border-yellow-400 p-4 mt-4">
              <p className="text-gray-700">
                <span className="text-yellow-600"></span> Vous avez un commerce ? Une marque ? Un projet ? On a
                plusieurs outils pour vous accompagner efficacement!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Founder Section */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-center text-[#197874] mb-2">Le Fondateur</h2>
        <div className="w-16 h-1 bg-[#E66C61] mx-auto mb-12"></div>

        <div className="max-w-3xl mx-auto text-center">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg mx-auto mb-6">
            <img src={hamza} alt="Hamza El Garti" width={128} height={128} className="object-cover"/>
          </div>

          <h3 className="text-xl font-bold text-[#197874] mb-6">Je m'appelle Hamza El Garti</h3>

          <div className="space-y-4 text-gray-600">
            <p>
              Après plus de 15 ans dans des fonctions de direction en marketing, vente et management (Maroc, France,
              Afrique de l'Ouest), j'ai décidé de créer DabaBane pour réconcilier la proximité du commerce local avec
              l'efficacité du digital.
            </p>

            <p>
              Entrepreneur, passionné de technologie et du monde des affaires, j'ai une conviction simple : Ce qui fait
              la différence, ce n'est pas la taille d'un business. C'est l'expérience qu'on propose.
            </p>

            <p>
              Avec DabaBane & DabaLabs, j'ai voulu créer un outil utile, une marque crédible et un état d'esprit
              exigeant, au service de ceux qui font bouger nos villes au quotidien.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="max-w-3xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-center text-[#197874] mb-2">Questions Fréquentes</h2>
        <div className="w-16 h-1 bg-[#E66C61] mx-auto mb-12"></div>

        <div className="space-y-4">
          {faqItems.map((item, index) => (
            <div key={index} className="border border-gray-200 rounded-md overflow-hidden">
              <button
                className="flex justify-between items-center w-full p-4 text-left"
                onClick={() => toggleFaq(index)}
              >
                <span className="font-medium text-gray-700">{item.question}</span>
                <ChevronDown
                  className={`text-gray-400 transition-transform duration-300 ${openFaq === index ? "rotate-180" : ""}`}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openFaq === index ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <div className="p-4 bg-gray-50 text-gray-600">{item.answer}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Follow Us Section */}
      <section className="max-w-3xl mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold text-center text-[#197874] mb-2">Suivez-nous</h2>
        <div className="w-16 h-1 bg-[#E66C61] mx-auto mb-6"></div>

        <p className="text-gray-600 text-lg mb-8">Restez connecté avec nous pour les dernières actualités et offres</p>

        <div className="flex justify-center space-x-6">
          <a href="https://www.facebook.com/profile.php?id=61575874707292" className="text-gray-500 hover:text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="currentColor" viewBox="0 0 320 512">
              <path d="M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z"/>
            </svg>
          </a>
          <a href="https://www.tiktok.com/@dabablane_" className="text-gray-500 hover:text-gray-700">
          <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 448 512" className="w-6 h-6" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.31V278.2a74.62,74.62,0,1,0,52.23,71.18V0l88,0a121.18,121.18,0,0,0,1.86,22.17h0A122.18,122.18,0,0,0,381,102.39a121.43,121.43,0,0,0,67,20.14Z"></path></svg>
          </a>
          <a href="https://www.instagram.com/dabablane" className="text-gray-500 hover:text-gray-700">
            <Instagram size={24} />
          </a>
        </div>
      </section>
    </div>
  );
};

export default About; 