import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  url?: string;
}

interface BreadcrumbNavigationProps {
  items: BreadcrumbItem[];
  showBackButton?: boolean;
}

export const BreadcrumbNavigation = ({ 
  items, 
  showBackButton = true 
}: BreadcrumbNavigationProps) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center text-sm text-gray-500">
        {items.map((item, index) => (
          <div key={index} className="flex items-center">
            {index > 0 && <span className="mx-2">/</span>}
            {item.url ? (
              <Link to={item.url} className="hover:text-[#E66C61]">
                {item.label}
              </Link>
            ) : (
              <span className="text-gray-700">{item.label}</span>
            )}
          </div>
        ))}
      </div>

      {/* Back button */}
      {showBackButton && (
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center text-gray-600 hover:text-[#E66C61]"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </button>
      )}
    </div>
  );
}; 