export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  emoji: string;
}

export interface CartItem extends MenuItem {
  qty: number;
}

export interface TenantTheme {
  accent: string;
  accentText: string;
  secondary: string;
  secondaryText: string;
  bgPage: string;
  brandLabel: string;
}

export interface StoreBrandOption {
  id: 'gelato' | 'chocolate' | 'papyrus';
  name: string;
  tagline: string;
  emoji: string;
  branches: string[];
}

export interface SalesModeOption {
  id: string;
  label: string;
  emoji: string;
}
