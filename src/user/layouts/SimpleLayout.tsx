import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import Footer from '../components/Footer';
import ScrollToTop from '../components/ScrollToTop';
import Logo from '@/assets/images/dabablane.png';
import { VendorService } from '@/user/lib/api/services/vendorService';

const API_ORIGIN = 'https://dev.dabablane.com';

const buildVendorAssetUrl = (path?: string | null): string => {
  if (!path) return '';

  const trimmed = path.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  if (trimmed.startsWith('/')) return `${API_ORIGIN}${trimmed}`;
  if (trimmed.startsWith('storage/')) return `${API_ORIGIN}/${trimmed}`;
  if (trimmed.startsWith('uploads/')) return `${API_ORIGIN}/storage/${trimmed}`;
  return `${API_ORIGIN}/storage/uploads/vendor_images/${trimmed}`;
};

interface SimpleLayoutProps {
  children: React.ReactNode;
}

const SimpleLayout = ({ children }: SimpleLayoutProps) => {
  const location = useLocation();
  const { name } = useParams<{ name?: string }>();
  const [vendorLogoUrl, setVendorLogoUrl] = useState<string>('');
  const [vendorLogoAlt, setVendorLogoAlt] = useState<string>('DabaBlane');
  const [vendorLogoFailed, setVendorLogoFailed] = useState<boolean>(false);

  const isVendorDetailRoute = Boolean(name) && location.pathname !== '/vendors';

  useEffect(() => {
    let isActive = true;
    const fetchVendorLogo = async () => {
      if (!isVendorDetailRoute || !name) {
        setVendorLogoUrl('');
        setVendorLogoAlt('DabaBlane');
        setVendorLogoFailed(false);
        return;
      }

      try {
        const decodedName = name.replace(/-/g, ' ');

        const response = await VendorService.getVendorByIdOrCompanyName(decodedName);
        const vendor = response?.status ? response.data : null;
        const logo = buildVendorAssetUrl(vendor?.logoUrl || '');

        if (!logo) {
          const fallbackResponse = await VendorService.getVendorByIdOrCompanyName(name);
          const fallbackVendor = fallbackResponse?.status ? fallbackResponse.data : null;
          const fallbackLogo = buildVendorAssetUrl(fallbackVendor?.logoUrl || '');
          if (!isActive) return;
          setVendorLogoUrl(fallbackLogo);
          setVendorLogoAlt(fallbackVendor?.company_name || fallbackVendor?.name || 'Vendor');
          setVendorLogoFailed(false);
          return;
        }
        if (!isActive) return;
        setVendorLogoUrl(logo);
        setVendorLogoAlt(vendor?.company_name || vendor?.name || 'Vendor');
        setVendorLogoFailed(false);
      } catch {
        if (!isActive) return;
        setVendorLogoUrl('');
        setVendorLogoAlt('DabaBlane');
        setVendorLogoFailed(false);
      }
    };

    fetchVendorLogo();
    return () => {
      isActive = false;
    };
  }, [isVendorDetailRoute, name]);

  useEffect(() => {
    setVendorLogoFailed(false);
  }, [vendorLogoUrl]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Simple header with logo only on the left */}
      <header className="w-full bg-white shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex items-center py-4">
            {isVendorDetailRoute ? (
              <span className="inline-block">
                {vendorLogoUrl && !vendorLogoFailed ? (
                  <img 
                    src={vendorLogoUrl} 
                    alt={vendorLogoAlt} 
                    className="h-9 w-9 md:h-10 md:w-10 rounded-full object-cover"
                    onError={() => {
                      setVendorLogoFailed(true);
                    }}
                  />
                ) : (
                  <div className="h-9 w-9 md:h-10 md:w-10 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-xs md:text-sm font-semibold select-none">
                    {(vendorLogoAlt || 'V').trim().charAt(0).toUpperCase()}
                  </div>
                )}
              </span>
            ) : (
              <Link 
                to="/" 
                className="inline-block transition-transform hover:scale-105"
              >
                <img 
                  src={vendorLogoUrl || Logo} 
                  alt={vendorLogoAlt} 
                  className={
                    vendorLogoUrl
                      ? 'h-9 w-9 md:h-10 md:w-10 rounded-full object-cover'
                      : 'h-7 md:h-8 w-auto object-contain'
                  }
                  onError={(e) => {
                    e.currentTarget.src = Logo;
                  }}
                />
              </Link>
            )}
          </div>
        </div>
      </header>
      
      <main className="flex-grow">
        {children}
      </main>
      
      <Footer />
      <ScrollToTop />
    </div>
  );
};

export default SimpleLayout;

