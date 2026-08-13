import { MenuItem, StoreBrandOption, SalesModeOption, TenantTheme } from '../types/pos';

export interface CashierAccount {
  name: string;
  pin: string;
  assignedBranch?: string;
}

/**
 * Cache akun kasir (kosong secara bawaan — diisi dari API login backend).
 */
export const REGISTERED_CASHIERS: Record<string, CashierAccount> = {};

/**
 * Brand Toko (diisi secara dinamis dari API Backend /api/v1/cabang).
 */
export const STORE_BRANDS_OPTIONS: StoreBrandOption[] = [];

/**
 * Sales mode yang tersedia dalam sistem POS Event.
 */
export const SALES_MODE_OPTIONS: SalesModeOption[] = [
  { id: 'Dine In', label: 'DINE IN', emoji: '🍽️', status: 'ACTIVE' },
  { id: 'Takeaway', label: 'TAKEAWAY', emoji: '🛍️', status: 'ACTIVE' },
  { id: 'Online Shop', label: 'ONLINE SHOP', emoji: '🛵', status: 'ACTIVE' },
  { id: 'Event', label: 'EVENT', emoji: '🎪', status: 'ACTIVE' },
];

export const MENU_GELATO: MenuItem[] = [];
export const MENU_CHOCOLATE: MenuItem[] = [];
export const DEFAULT_CATALOG_DATA: any[] = [];

export const getTenantTheme = (cabang: string): TenantTheme => {
  const lower = (cabang || '').toLowerCase();
  if (lower.includes("gelato")) {
    return {
      accent: '#FFDD00',
      accentText: '#000000',
      secondary: '#1A3FBB',
      secondaryText: '#FFFFFF',
      bgPage: '#FFFBEA',
      brandLabel: "LET'S GO GELATO",
    };
  }
  if (lower.includes('terve') || lower.includes('chocolate')) {
    return {
      accent: '#5C3317',
      accentText: '#FFFFFF',
      secondary: '#3B1F0A',
      secondaryText: '#F5E6D3',
      bgPage: '#FAF3EC',
      brandLabel: 'TERVE CHOCOLATE',
    };
  }
  return {
    accent: '#000000',
    accentText: '#FFFFFF',
    secondary: '#222222',
    secondaryText: '#FFFFFF',
    bgPage: '#FFFFFF',
    brandLabel: (cabang || 'POS EVENT').toUpperCase(),
  };
};

export const parseCabang = (cabang: string): { brand: string; branch: string } => {
  if (!cabang) return { brand: 'POS EVENT', branch: '' };
  const separatorIdx = cabang.indexOf(' - ');
  if (separatorIdx === -1) {
    return { brand: cabang.toUpperCase(), branch: '' };
  }
  return {
    brand: cabang.slice(0, separatorIdx).toUpperCase(),
    branch: cabang.slice(separatorIdx + 3),
  };
};

export const getMenuData = (cabang: string): MenuItem[] => {
  // Produk dinamis ditarik dari SQLite menu_replica / API Backend
  return [];
};

export const formatRp = (n: number): string =>
  'Rp ' + (n || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
