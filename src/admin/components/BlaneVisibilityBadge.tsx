import React from 'react';
import { EyeOffIcon, GlobeIcon, LinkIcon } from 'lucide-react';
import { Badge } from '@/admin/components/ui/badge';

type VisibilityType = 'private' | 'public' | 'link';

interface BlaneVisibilityBadgeProps {
  visibility: VisibilityType;
  className?: string;
}

const BlaneVisibilityBadge: React.FC<BlaneVisibilityBadgeProps> = ({ 
  visibility, 
  className = ''
}) => {
  // Define variant styles based on visibility
  const getVariant = () => {
    switch (visibility) {
      case 'private': 
        return 'secondary'; // Grey for private
      case 'public':
        return 'destructive'; // Red for public (potentially sensitive)
      case 'link':
        return 'default'; // Blue for link sharing
      default:
        return 'outline';
    }
  };

  // Define icon based on visibility
  const getIcon = () => {
    switch (visibility) {
      case 'private':
        return <EyeOffIcon className="h-3 w-3 mr-1" />;
      case 'public':
        return <GlobeIcon className="h-3 w-3 mr-1" />;
      case 'link':
        return <LinkIcon className="h-3 w-3 mr-1" />;
      default:
        return null;
    }
  };

  // Define label text
  const getLabel = () => {
    switch (visibility) {
      case 'private':
        return 'Private';
      case 'public':
        return 'Public';
      case 'link':
        return 'Link-shared';
      default:
        return 'Unknown';
    }
  };

  return (
    <Badge 
      variant={getVariant()} 
      className={`flex items-center ${className}`}
    >
      {getIcon()}
      {getLabel()}
    </Badge>
  );
};

export default BlaneVisibilityBadge; 