export interface CartItemModel {
  id: string;
  name: string;
  price: number;
  qty: number;
  category?: string;
  emoji?: string;
  isPromo?: boolean;
  discountAmount?: number;
  isFreeBonus?: boolean;
}

export interface PromoRule {
  id: string;
  name: string;
  type: 'DISCOUNT_PERCENT' | 'DISCOUNT_NOMINAL' | 'FREE_ITEM';
  value: number; // e.g. 10 for 10%, 10000 for Rp10.000
  minSpend?: number;
  bonusItem?: {
    id: string;
    name: string;
    emoji: string;
  };
}

export interface CartCalculationResult {
  subtotal: number;
  discountTotal: number;
  taxAmount: number;
  taxRate: number; // e.g. 0.11 for 11%
  total: number;
  totalQty: number;
  processedItems: CartItemModel[];
  appliedPromos: string[];
}

export const DEFAULT_PROMOS: PromoRule[] = [
  {
    id: 'PROMO_FAMILY',
    name: 'Diskon Paket Hemat 10%',
    type: 'DISCOUNT_PERCENT',
    value: 10,
    minSpend: 150000,
  },
  {
    id: 'PROMO_FREE_STICKER',
    name: 'Hadiah Gratis Merchandise',
    type: 'FREE_ITEM',
    value: 0,
    minSpend: 100000,
    bonusItem: {
      id: 'BONUS_STICKER',
      name: 'Sticker POS Event (Bonus Rp0)',
      emoji: '🎁',
    },
  },
];

/**
 * Mengambil persentase pajak PPN spesifik per cabang/toko (Default: 11% / 0.11)
 */
export function getBranchTaxRate(cabang?: string): number {
  if (!cabang) return 0.11;
  // BISA DISESUAIKAN BERDASARKAN CABANG / TENANT JIKA DIPERLUKAN
  return 0.11;
}

/**
 * Mengambil aturan promo yang berlaku untuk toko/cabang tertentu
 */
export function getBranchPromos(cabang?: string): PromoRule[] {
  if (!cabang) return DEFAULT_PROMOS;
  const lower = cabang.toLowerCase();

  if (lower.includes('terve') || lower.includes('chocolate')) {
    return [
      {
        id: 'PROMO_CHOCO_10',
        name: 'Promo Choco Lover 10%',
        type: 'DISCOUNT_PERCENT',
        value: 10,
        minSpend: 120000,
      },
      {
        id: 'PROMO_FREE_STICKER',
        name: 'Hadiah Merchandise Terve',
        type: 'FREE_ITEM',
        value: 0,
        minSpend: 100000,
        bonusItem: {
          id: 'BONUS_CHOCO_PIN',
          name: 'Pin Terve Chocolate (Bonus Rp0)',
          emoji: '🍫',
        },
      },
    ];
  }

  if (lower.includes('papyrus') || lower.includes('photo')) {
    return [
      {
        id: 'PROMO_PAPYRUS_15',
        name: 'Diskon Cetak Frame 15%',
        type: 'DISCOUNT_PERCENT',
        value: 15,
        minSpend: 150000,
      },
    ];
  }

  return DEFAULT_PROMOS;
}

/**
 * Cart Calculation Service
 * Menghitung Subtotal, Diskon Promo, Pajak PPN (% cabang), dan Total Akhir secara reaktif.
 */
export function calculateCart(
  items: CartItemModel[],
  taxRate: number = 0.11,
  activePromos: PromoRule[] = DEFAULT_PROMOS
): CartCalculationResult {
  // 1. Filter out old auto-generated free bonus items first to avoid duplicate stacking
  let currentCart = items.map(item => ({ ...item })).filter((item) => !item.isFreeBonus);

  // 2. Hitung subtotal awal
  let rawSubtotal = currentCart.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );

  let discountTotal = 0;
  const appliedPromos: string[] = [];

  // 3. Perhitungan Diskon & Promo
  activePromos.forEach((promo) => {
    if (!promo.minSpend || rawSubtotal >= promo.minSpend) {
      if (promo.type === 'DISCOUNT_PERCENT') {
        const disc = Math.round(rawSubtotal * (promo.value / 100));
        discountTotal += disc;
        appliedPromos.push(`${promo.name} (-${promo.value}%)`);
      } else if (promo.type === 'DISCOUNT_NOMINAL') {
        discountTotal += promo.value;
        appliedPromos.push(`${promo.name} (-Rp ${promo.value})`);
      } else if (promo.type === 'FREE_ITEM' && promo.bonusItem) {
        // Support "Free Item / Hadiah Gratis": Otomatis memasukkan produk bonus ke keranjang dengan harga Rp0
        const hasBonus = currentCart.some((i) => i.id === promo.bonusItem?.id);
        if (!hasBonus) {
          currentCart.push({
            id: promo.bonusItem.id,
            name: promo.bonusItem.name,
            price: 0,
            qty: 1,
            category: 'Bonus',
            emoji: promo.bonusItem.emoji,
            isFreeBonus: true,
          });
          appliedPromos.push(`${promo.name} (Gratis Rp0)`);
        }
      }
    }
  });

  const netSubtotal = Math.max(0, rawSubtotal - discountTotal);

  // 4. Perhitungan Pajak Cabang (misal PPN 11%)
  const taxAmount = Math.round(netSubtotal * taxRate);

  // 5. Total Clean Calculation = (Subtotal - Diskon) + Pajak
  const total = netSubtotal + taxAmount;

  const totalQty = currentCart.reduce((sum, item) => sum + item.qty, 0);

  return {
    subtotal: rawSubtotal,
    discountTotal,
    taxAmount,
    taxRate,
    total,
    totalQty,
    processedItems: currentCart,
    appliedPromos,
  };
}

export default {
  calculateCart,
  getBranchTaxRate,
  getBranchPromos,
};

