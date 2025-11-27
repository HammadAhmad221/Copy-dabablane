import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
import ScrollToTop from '../components/ScrollToTop';
import Logo from '@/assets/images/dabablane.png';

interface SimpleLayoutProps {
  children: React.ReactNode;
}

const SimpleLayout = ({ children }: SimpleLayoutProps) => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Simple header with logo only on the left */}
      <header className="w-full bg-white shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex items-center py-4">
            <Link 
              to="/" 
              className="inline-block transition-transform hover:scale-105"
            >
              <img 
                src={Logo} 
                alt="DabaBlane" 
                className="h-7 md:h-8 w-auto object-contain"
              />
            </Link>
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

