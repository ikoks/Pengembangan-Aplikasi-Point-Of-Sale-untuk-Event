import { MenuItem, StoreBrandOption, SalesModeOption, TenantTheme } from '../types/pos';

export interface CashierAccount {
  name: string;
  pin: string;
  assignedBranch?: string;
}

/**
 * Cache akun kasir (diselaraskan dengan seed data Backend Laravel: UserSeeder.php).
 */
export const REGISTERED_CASHIERS: Record<string, CashierAccount> = {
  'kasir.satu': { name: 'Kasir Satu – JCC', pin: '123456', assignedBranch: '*' },
  'kasir.dua': { name: 'Kasir Dua – JCC', pin: '123456', assignedBranch: '*' },
};

/**
 * Brand Toko (diisi secara dinamis dari API Backend /api/v1/cabang).
 */
export const STORE_BRANDS_OPTIONS: StoreBrandOption[] = [];

/**
 * Sales mode yang tersedia dalam sistem POS Event (sesuai SalesModeSeeder.php backend).
 */
export const SALES_MODE_OPTIONS: SalesModeOption[] = [
  { id: 'Offline', label: 'OFFLINE', emoji: '🎪', status: 'ACTIVE' },
  { id: 'GoFood', label: 'GOFOOD', emoji: '🛵', status: 'ACTIVE' },
  { id: 'Tokopedia', label: 'TOKOPEDIA', emoji: '🛍️', status: 'ACTIVE' },
  { id: 'Dine In', label: 'DINE IN', emoji: '🍽️', status: 'ACTIVE' },
  { id: 'Takeaway', label: 'TAKEAWAY', emoji: '🛍️', status: 'ACTIVE' },
];

export const MENU_GELATO: MenuItem[] = [];
export const MENU_CHOCOLATE: MenuItem[] = [];

/**
 * Katalog Produk Bawaan (Diselaraskan 100% dengan KatalogSeeder.php Backend Laravel).
 */
export const DEFAULT_CATALOG_DATA: MenuItem[] = [
  { id: 'a1b2c3d4-0001-0001-0001-000000000001', name: 'Nasi Goreng', price: 35000, category: 'Makanan Berat', emoji: '🍛', stockQuantity: 99, isAvailable: true },
  { id: 'a1b2c3d4-0001-0001-0001-000000000002', name: 'Mie Goreng', price: 38000, category: 'Makanan Berat', emoji: '🍜', stockQuantity: 99, isAvailable: true },
  { id: 'a1b2c3d4-0001-0001-0001-000000000005', name: 'Ayam Bakar Madu', price: 45000, category: 'Makanan Berat', emoji: '🍗', stockQuantity: 99, isAvailable: true },
  { id: 'a1b2c3d4-0001-0001-0001-000000000006', name: 'Sate Ayam Taichan', price: 30000, category: 'Makanan Berat', emoji: '🍢', stockQuantity: 99, isAvailable: true },
  { id: 'a1b2c3d4-0001-0001-0001-000000000003', name: 'Kentang Goreng', price: 20000, category: 'Snack', emoji: '🍟', stockQuantity: 99, isAvailable: true },
  { id: 'a1b2c3d4-0001-0001-0001-000000000007', name: 'Tahu Crispy Pedas', price: 15000, category: 'Snack', emoji: '🧆', stockQuantity: 99, isAvailable: true },
  { id: 'a1b2c3d4-0001-0001-0001-000000000008', name: 'Pisang Goreng Keju', price: 18000, category: 'Snack', emoji: '🍌', stockQuantity: 99, isAvailable: true },
  { id: 'a1b2c3d4-0001-0001-0001-000000000004', name: 'Es Kopi Susu Gula Aren', price: 25000, category: 'Kopi', emoji: '🧋', stockQuantity: 99, isAvailable: true },
  { id: 'a1b2c3d4-0001-0001-0001-000000000009', name: 'Americano', price: 22000, category: 'Kopi', emoji: '☕', stockQuantity: 99, isAvailable: true },
  { id: 'a1b2c3d4-0001-0001-0001-000000000010', name: 'Cappuccino', price: 28000, category: 'Kopi', emoji: '☕', stockQuantity: 99, isAvailable: true },
];

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
  return DEFAULT_CATALOG_DATA;
};

export const formatRp = (n: number): string =>
  'Rp ' + (n || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
