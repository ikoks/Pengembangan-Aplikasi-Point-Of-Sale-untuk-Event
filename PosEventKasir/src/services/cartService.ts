import { PromoRule, SelectedModifier } from '../types/pos';

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
  selectedModifiers?: SelectedModifier[];
}

export interface CartCalculationResult {
  subtotal: number;
  discountTotal: number;
  taxAmount: number;
  taxRate: number;
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
    scope: 'TOTAL_SPEND',
    minSpend: 150000,
    branchIds: ['*'],
    salesModes: ['*'],
  },
  {
    id: 'PROMO_FREE_STICKER',
    name: 'Hadiah Gratis Merchandise',
    type: 'FREE_ITEM',
    value: 0,
    scope: 'TOTAL_SPEND',
    minSpend: 100000,
    freeItemId: 'BONUS_STICKER',
    freeItemName: 'Sticker POS Event (Bonus Rp0)',
    freeItemEmoji: '🎁',
    branchIds: ['*'],
    salesModes: ['*'],
  },
];

export function getBranchTaxRate(cabang?: string): number {
  if (!cabang) return 0.11;
  return 0.11;
}

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
        scope: 'TOTAL_SPEND',
        minSpend: 120000,
        startTime: '10:00',
        endTime: '22:00',
        branchIds: ['*'],
        salesModes: ['*'],
      },
      {
        id: 'PROMO_FREE_STICKER',
        name: 'Hadiah Merchandise Terve',
        type: 'FREE_ITEM',
        value: 0,
        scope: 'TOTAL_SPEND',
        minSpend: 100000,
        freeItemId: 'BONUS_CHOCO_PIN',
        freeItemName: 'Pin Terve Chocolate (Bonus Rp0)',
        freeItemEmoji: '🍫',
        branchIds: ['*'],
        salesModes: ['*'],
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
        scope: 'TOTAL_SPEND',
        minSpend: 150000,
        branchIds: ['*'],
        salesModes: ['*'],
      },
    ];
  }
  return DEFAULT_PROMOS;
}

function isPromoTimeValid(startTime?: string, endTime?: string): boolean {
  if (!startTime || !endTime) return true;
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [sHours, sMins] = startTime.split(':').map(Number);
  const [eHours, eMins] = endTime.split(':').map(Number);

  const startMinutes = (sHours || 0) * 60 + (sMins || 0);
  const endMinutes = (eHours || 0) * 60 + (eMins || 0);

  return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
}

function isPromoBranchValid(promoBranches: string[], currentCabang?: string): boolean {
  if (!currentCabang || promoBranches.includes('*')) return true;
  const lowerCabang = currentCabang.toLowerCase();
  return promoBranches.some((b) => lowerCabang.includes(b.toLowerCase()));
}

function isPromoSalesModeValid(promoModes: string[], currentSalesMode?: string): boolean {
  if (!currentSalesMode || promoModes.includes('*')) return true;
  return promoModes.some((m) => m.toLowerCase() === currentSalesMode.toLowerCase());
}

export function calculateCart(
  items: CartItemModel[],
  taxRate: number = 0.11,
  activePromos: PromoRule[] = DEFAULT_PROMOS,
  currentCabang?: string,
  currentSalesMode?: string
): CartCalculationResult {
  let currentCart = items.map((item) => ({ ...item })).filter((item) => !item.isFreeBonus);

  let rawSubtotal = currentCart.reduce((sum, item) => sum + item.price * item.qty, 0);

  let discountTotal = 0;
  const appliedPromos: string[] = [];

  activePromos.forEach((promo) => {
    if (!isPromoTimeValid(promo.startTime, promo.endTime)) return;
    if (!isPromoBranchValid(promo.branchIds, currentCabang)) return;
    if (!isPromoSalesModeValid(promo.salesModes, currentSalesMode)) return;

    let isEligible = false;
    if (promo.scope === 'TOTAL_SPEND') {
      isEligible = !promo.minSpend || rawSubtotal >= promo.minSpend;
    } else if (promo.scope === 'SPECIFIC_ITEM') {
      isEligible = currentCart.some((i) => i.id === promo.targetItemId);
    }

    if (isEligible) {
      if (promo.type === 'DISCOUNT_PERCENT') {
        const disc = Math.round(rawSubtotal * (promo.value / 100));
        discountTotal += disc;
        appliedPromos.push(`${promo.name} (-${promo.value}%)`);
      } else if (promo.type === 'DISCOUNT_NOMINAL') {
        discountTotal += promo.value;
        appliedPromos.push(`${promo.name} (-Rp ${promo.value})`);
      } else if (promo.type === 'FREE_ITEM' && promo.freeItemId) {
        const hasBonus = currentCart.some((i) => i.id === promo.freeItemId);
        if (!hasBonus) {
          currentCart.push({
            id: promo.freeItemId,
            name: promo.freeItemName || 'Bonus Free Item',
            price: 0,
            qty: 1,
            category: 'Bonus',
            emoji: promo.freeItemEmoji || '🎁',
            isFreeBonus: true,
          });
          appliedPromos.push(`${promo.name} (Free Item Rp0)`);
        }
      }
    }
  });

  const netSubtotal = Math.max(0, rawSubtotal - discountTotal);
  const taxAmount = Math.round(netSubtotal * taxRate);
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
