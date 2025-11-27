import { Link } from 'react-router-dom';
import { Instagram, Mail, Phone, MapPin, MessageCircle } from 'lucide-react';
import logo from '@/assets/images/dabablane.png';
import CMI from '@/assets/images/logo_cmi.png';
import VISA from '@/assets/images/tn_verified_by_visa.png';
import MASTER from '@/assets/images/secure_code_logo.png';
import { useHome } from '@/user/lib/hooks/useHome';
import { MenuItem } from '@/user/lib/types/home';

// Static information links
const infos = [
  { to: '/contact', label: 'Contactez-nous' },
  { to: '/about', label: 'À propos' },
  { to: '/about#faq', label: 'FAQ' },
  { to: '/ecommerce-special', label: 'Spécial B2B' },
];

const contacts = [
  { icon: Mail, text: 'contact@dabablane.com' },
  { icon: MessageCircle, text: 'Whatsapp: +212615170064' },
  { icon: Phone, text: 'Téléphone: +212615170064' },
  { icon: MapPin, text: 'Casablanca, Maroc' },
];

const Footer = () => {
  const { data } = useHome();
  
  // Get menu items from home data, filter out 'about' and 'b2b' items, and sort by position
  const menuItems: MenuItem[] = data?.data?.menu_items || [];
  const filteredMenuItems = menuItems.filter(item => 
    !item.url.includes('/about') && !item.url.includes('/ecommerce-special')
  );
  const sortedMenuItems = [...filteredMenuItems].sort((a, b) => a.position - b.position);

  return (
    <footer className="w-full bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 pt-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div className="space-y-4">
            <img src={logo} alt="DabaBlane Logo" className="h-10 w-auto mb-4 object-contain" width="100" height="40" />
            <p className="text-sm text-gray-400 max-w-xs">
              DabaBlane est votre destination en ligne pour découvrir les meilleures offres et promotions au Maroc.
            </p>
            <div className="flex space-x-4 pt-4">
              <a
                href="https://www.facebook.com/profile.php?id=61575874707292"
                className="hover:text-[#E66C61] transition-colors"
                aria-label="Facebook"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 320 512">
                  <path d="M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z"/>
                </svg>
              </a>
              <a
                href="https://www.tiktok.com/@dabablane_?_t=ZM-8ufva4Pi4CF&_r=1"
                className="hover:text-[#E66C61] transition-colors"
                aria-label="TikTok"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 448 512">
                  <path d="M448 209.9a210.1 210.1 0 0 1 -122.8-39.3V349.4A162.6 162.6 0 1 1 185 188.3V278.2a74.6 74.6 0 1 0 52.2 71.2V0l88 0a121.2 121.2 0 0 0 1.9 22.2h0A122.2 122.2 0 0 0 381 102.4a121.4 121.4 0 0 0 67 20.1z" />
                </svg>
              </a>
              <a
                href="https://www.instagram.com/dabablane"
                className="hover:text-[#E66C61] transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Liens Rapides</h3>
            <ul className="space-y-3">
              {sortedMenuItems.map((item) => (
                <li key={item.id}>
                  <Link to={item.url} className="text-sm hover:text-[#E66C61] transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Informations</h3>
            <ul className="space-y-3">
              {infos.map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="text-sm hover:text-[#E66C61] transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Contact</h3>
            <ul className="space-y-3">
              {contacts.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center space-x-3">
                  <Icon className="h-5 w-5 text-[#E66C61]" />
                  <span className="text-sm">{text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-400">
              &copy; {new Date().getFullYear()} DabaBlane. Tous droits réservés.
            </p>
            <div className="flex gap-4">
              {[CMI, MASTER, VISA].map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt="Paiement"
                  className="w-8 h-5 object-contain"
                  width="32"
                  height="20"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
