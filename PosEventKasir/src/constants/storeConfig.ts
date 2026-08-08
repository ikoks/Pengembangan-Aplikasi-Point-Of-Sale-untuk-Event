import { MenuItem, StoreBrandOption, SalesModeOption, TenantTheme } from '../types/pos';

export const STORE_BRANDS_OPTIONS: StoreBrandOption[] = [
  {
    id: 'gelato',
    name: "Let's Go Gelato",
    tagline: 'Premium Italian Gelato',
    emoji: '🍨',
    branches: [
      'Bengawan (Bandung)',
      'Braga (Bandung)',
      'Summarecon Bekasi',
      'Cibinong City Mall (Bogor)',
      'TSM Cibubur (Jakarta)',
    ],
  },
  {
    id: 'chocolate',
    name: 'Terve Chocolate',
    tagline: 'Artisan Bean-to-Bar',
    emoji: '🍫',
    branches: [
      'Bengawan (Bandung)',
      'Braga (Bandung)',
      'KBP (Padalarang)',
    ],
  },
];

export const SALES_MODE_OPTIONS: SalesModeOption[] = [
  { id: 'Dine In', label: 'DINE IN', emoji: '🍽️', status: 'ACTIVE' },
  { id: 'Takeaway', label: 'TAKEAWAY', emoji: '🛍️', status: 'ACTIVE' },
  { id: 'Online Shop', label: 'ONLINE SHOP / E-COMMERCE', emoji: '🛵', status: 'ACTIVE' },
  { id: 'Event', label: 'EVENT', emoji: '🎪', status: 'ACTIVE' },
];

export const MENU_GELATO: MenuItem[] = [
  {
    id: 'GS1',
    name: 'Single Scoop',
    price: 35000,
    branchPrices: { 'bengawan': 35000, 'braga': 38000, 'summarecon': 40000 },
    category: 'Gelato',
    emoji: '🍨',
  },
  {
    id: 'GS2',
    name: 'Double Scoop',
    price: 55000,
    branchPrices: { 'bengawan': 55000, 'braga': 58000, 'summarecon': 60000 },
    category: 'Gelato',
    emoji: '🍨',
  },
  { id: 'GS3', name: 'Triple Scoop', price: 75000, category: 'Gelato', emoji: '🍨' },
  { id: 'GS4', name: 'Gelato Cup S', price: 30000, category: 'Gelato', emoji: '🥄' },
  { id: 'GS5', name: 'Gelato Cup M', price: 45000, category: 'Gelato', emoji: '🥄' },
  { id: 'GW1', name: 'Waffle Cone', price: 50000, category: 'Waffle', emoji: '🧇' },
  { id: 'GW2', name: 'Waffle Stick 2 pcs', price: 40000, category: 'Waffle', emoji: '🧇' },
  { id: 'GW3', name: 'Waffle Stick 4 pcs', price: 70000, category: 'Waffle', emoji: '🧇' },
  { id: 'GD1', name: 'Gelato Shake', price: 55000, category: 'Minuman', emoji: '🥤' },
  { id: 'GD2', name: 'Affogato', price: 60000, category: 'Minuman', emoji: '☕' },
  { id: 'GD3', name: 'Soda Italiano', price: 35000, category: 'Minuman', emoji: '🍹' },
  { id: 'GP1', name: 'Paket Couple', price: 99000, category: 'Paket', emoji: '💑' },
  { id: 'GP2', name: 'Paket Family', price: 175000, category: 'Paket', emoji: '👨‍👩‍👧‍👦' },
];

export const MENU_CHOCOLATE: MenuItem[] = [
  {
    id: 'CB1',
    name: 'Dark Choco 70%',
    price: 55000,
    branchPrices: { 'bengawan': 55000, 'braga': 58000 },
    category: 'Batang',
    emoji: '🍫',
  },
  { id: 'CB2', name: 'Milk Choco', price: 45000, category: 'Batang', emoji: '🍫' },
  { id: 'CB3', name: 'White Choco', price: 45000, category: 'Batang', emoji: '🍫' },
  { id: 'CB4', name: 'Ruby Choco', price: 65000, category: 'Batang', emoji: '🍫' },
  { id: 'CD1', name: 'Hot Choco', price: 40000, category: 'Minuman', emoji: '☕' },
  { id: 'CD2', name: 'Iced Choco', price: 42000, category: 'Minuman', emoji: '🥤' },
  { id: 'CD3', name: 'Choco Float', price: 50000, category: 'Minuman', emoji: '🍹' },
  { id: 'CD4', name: 'Mocca Blend', price: 48000, category: 'Minuman', emoji: '☕' },
  { id: 'CP1', name: 'Praline Box 9', price: 85000, category: 'Praline', emoji: '🎁' },
  { id: 'CP2', name: 'Praline Box 16', price: 145000, category: 'Praline', emoji: '🎁' },
  { id: 'CP3', name: 'Truffle Assorted', price: 110000, category: 'Praline', emoji: '🍬' },
  { id: 'CGP1', name: 'Gift Set Regular', price: 175000, category: 'Paket', emoji: '📦' },
  { id: 'CGP2', name: 'Gift Set Premium', price: 320000, category: 'Paket', emoji: '📦' },
];

export const DEFAULT_CATALOG_DATA = [
  { id: 'GS1', category_id: 'Gelato', category: 'Gelato', name: 'Single Scoop', price: 35000, stock: 100, is_promo: 0, emoji: '🍨' },
  { id: 'GS2', category_id: 'Gelato', category: 'Gelato', name: 'Double Scoop', price: 55000, stock: 100, is_promo: 1, emoji: '🍨' },
  { id: 'GS3', category_id: 'Gelato', category: 'Gelato', name: 'Triple Scoop', price: 75000, stock: 100, is_promo: 0, emoji: '🍨' },
  { id: 'GS4', category_id: 'Gelato', category: 'Gelato', name: 'Gelato Cup S', price: 30000, stock: 100, is_promo: 0, emoji: '🥄' },
  { id: 'GS5', category_id: 'Gelato', category: 'Gelato', name: 'Gelato Cup M', price: 45000, stock: 100, is_promo: 0, emoji: '🥄' },
  { id: 'GW1', category_id: 'Waffle', category: 'Waffle', name: 'Waffle Cone', price: 50000, stock: 100, is_promo: 0, emoji: '🧇' },
  { id: 'GW2', category_id: 'Waffle', category: 'Waffle', name: 'Waffle Stick 2 pcs', price: 40000, stock: 100, is_promo: 0, emoji: '🧇' },
  { id: 'GD1', category_id: 'Minuman', category: 'Minuman', name: 'Gelato Shake', price: 55000, stock: 100, is_promo: 0, emoji: '🥤' },
  { id: 'GD2', category_id: 'Minuman', category: 'Minuman', name: 'Affogato', price: 60000, stock: 100, is_promo: 1, emoji: '☕' },
  { id: 'GD3', category_id: 'Minuman', category: 'Minuman', name: 'Soda Italiano', price: 35000, stock: 100, is_promo: 0, emoji: '🍹' },
  { id: 'GP1', category_id: 'Paket', category: 'Paket', name: 'Paket Couple', price: 99000, stock: 50, is_promo: 1, emoji: '💑' },
  { id: 'GP2', category_id: 'Paket', category: 'Paket', name: 'Paket Family', price: 175000, stock: 50, is_promo: 1, emoji: '👨‍👩‍👧‍👦' },
];

export const getTenantTheme = (cabang: string): TenantTheme => {
  const lower = cabang.toLowerCase();
  if (lower.includes("let's go gelato") || lower.includes('lets go gelato') || lower.includes('gelato')) {
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
    brandLabel: cabang.toUpperCase(),
  };
};

export const parseCabang = (cabang: string): { brand: string; branch: string } => {
  const separatorIdx = cabang.indexOf(' - ');
  if (separatorIdx === -1) {
    return { brand: cabang.toUpperCase(), branch: '' };
  }
  return {
    brand: cabang.slice(0, separatorIdx).toUpperCase(),
    branch: cabang.slice(separatorIdx + 3),
  };
};

import { getIsolatedMenuByCabang } from './posData';

export const getMenuData = (cabang: string): MenuItem[] => {
  return getIsolatedMenuByCabang(cabang);
};

export const formatRp = (n: number): string =>
  'Rp ' + n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
