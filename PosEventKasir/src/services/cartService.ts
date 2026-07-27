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

const DEFAULT_PROMOS: PromoRule[] = [
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
 * Cart Calculation Service (Hari 4 Requirement)
 * Menghitung Subtotal, Diskon Promo, Pajak PPN 11%, dan Total Akhir secara offline.
 */
export function calculateCart(
  items: CartItemModel[],
  taxRate: number = 0.11,
  activePromos: PromoRule[] = DEFAULT_PROMOS
): CartCalculationResult {
  // 1. Filter out old auto-generated free bonus items first to avoid duplicate stacking
  let currentCart = items.filter((item) => !item.isFreeBonus);

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
};
