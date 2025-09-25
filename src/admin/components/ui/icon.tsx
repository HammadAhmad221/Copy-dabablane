import React from 'react';
import { Icon as IconifyIcon } from '@iconify/react';
import { cn } from '@/lib/utils';

interface IconProps extends React.ComponentPropsWithoutRef<typeof IconifyIcon> {
  icon: string;
  className?: string;
}

export const Icon = React.forwardRef<SVGSVGElement, IconProps>(
  ({ className, icon, ...props }, ref) => {
    return (
      <IconifyIcon
        ref={ref}
        icon={icon}
        className={cn('h-4 w-4', className)}
        {...props}
      />
    );
  }
);

Icon.displayName = 'Icon';

export type { IconProps }; 
