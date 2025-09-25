import { Category, City, MenuItem } from './home';

export interface HeaderProps {
  isMenuOpen: boolean;
  onToggleMenu: () => void;
  categories: Category[];
  cities: City[];
  menuItems: MenuItem[];
}

export interface SearchBarProps {
  categories: Category[];
  cities: City[];
  className?: string;
}

export interface MainNavProps {
  menuItems: MenuItem[];
  className?: string;
}

export interface NavbarProps {
  categories: Category[];
  cities: City[];
  menuItems: MenuItem[];
  className?: string;
} 