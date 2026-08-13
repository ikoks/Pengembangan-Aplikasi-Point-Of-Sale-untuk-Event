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
  promoTotal: number;
  voucherTotal: number;
  discountTotal: number;
  serviceFeeAmount: number;
  serviceFeeRate: number;
  taxAmount: number;
  taxRate: number;
  total: number;
  totalQty: number;
  processedItems: CartItemModel[];
  appliedPromos: string[];
}

export type ForeignCurrency = 'IDR' | 'USD' | 'SGD' | 'MYR';

export interface CurrencyConversionInfo {
  code: ForeignCurrency;
  symbol: string;
  rateToIdr: number;
  formattedAmount: string;
}

export function convertCurrency(amountRp: number, targetCurrency: ForeignCurrency = 'IDR'): CurrencyConversionInfo {
  switch (targetCurrency) {
    case 'USD': {
      const val = amountRp / 15800;
      return { code: 'USD', symbol: '$', rateToIdr: 15800, formattedAmount: `$${val.toFixed(2)} USD` };
    }
    case 'SGD': {
      const val = amountRp / 11800;
      return { code: 'SGD', symbol: 'S$', rateToIdr: 11800, formattedAmount: `S$${val.toFixed(2)} SGD` };
    }
    case 'MYR': {
      const val = amountRp / 3500;
      return { code: 'MYR', symbol: 'RM', rateToIdr: 3500, formattedAmount: `RM ${val.toFixed(2)} MYR` };
    }
    case 'IDR':
    default:
      return { code: 'IDR', symbol: 'Rp', rateToIdr: 1, formattedAmount: `Rp ${amountRp.toLocaleString('id-ID')}` };
  }
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
    freeItemName: 'Sticker Spesial Event',
    freeItemEmoji: '🎁',
    branchIds: ['*'],
    salesModes: ['*'],
  },
];

export function getBranchTaxRate(cabang?: string, customRateFromConfig?: number): number {
  if (typeof customRateFromConfig === 'number' && !isNaN(customRateFromConfig)) {
    return customRateFromConfig;
  }
  if (!cabang) return 0.10;
  const lower = cabang.toLowerCase();
  if (lower.includes('tax0') || lower.includes('bebas-pajak')) return 0;
  if (lower.includes('pb1-10') || lower.includes('pajak-10')) return 0.10;
  if (lower.includes('ppn-11') || lower.includes('pajak-11')) return 0.11;
  return 0.10;
}

export function getBranchPromos(cabang?: string): PromoRule[] {
  return DEFAULT_PROMOS;
}

function isPromoTimeValid(startTime?: string, endTime?: string): boolean {
  if (!startTime || !endTime) return true;
  const now = new Date();
  const current = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  return current >= startTime && current <= endTime;
}

function isPromoBranchValid(branchIds?: string[], currentCabang?: string): boolean {
  if (!branchIds || branchIds.includes('*')) return true;
  if (!currentCabang) return false;
  return branchIds.some((b) => currentCabang.toLowerCase().includes(b.toLowerCase()));
}

function isPromoSalesModeValid(salesModes?: string[], currentSalesMode?: string): boolean {
  if (!salesModes || salesModes.includes('*')) return true;
  if (!currentSalesMode) return false;
  return salesModes.some((m) => currentSalesMode.toLowerCase().includes(m.toLowerCase()));
}

export function calculateCart(
  cart: CartItemModel[],
  manualDiscountInput: number = 0,
  currentCabang?: string,
  currentSalesMode?: string,
  taxRateInput?: number,
  serviceFeeRateInput?: number
): CartCalculationResult {
  const activePromos = getBranchPromos(currentCabang);
  const taxRate = typeof taxRateInput === 'number' ? taxRateInput : getBranchTaxRate(currentCabang);
  const serviceFeeRate = typeof serviceFeeRateInput === 'number' ? serviceFeeRateInput : 0;
  let currentCart = cart.map(i => ({ ...i })).filter((item) => !item.isFreeBonus);

  let regularItems = currentCart;
  let rawSubtotal = regularItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  let voucherTotal = 0;

  let promoTotal = 0;
  const appliedPromos: string[] = [];

  activePromos.forEach((promo) => {
    if (!isPromoTimeValid(promo.startTime, promo.endTime)) return;
    if (!isPromoBranchValid(promo.branchIds, currentCabang)) return;
    if (!isPromoSalesModeValid(promo.salesModes, currentSalesMode)) return;

    let isEligible = false;
    if (promo.scope === 'TOTAL_SPEND') {
      isEligible = !promo.minSpend || rawSubtotal >= promo.minSpend;
    } else if (promo.scope === 'SPECIFIC_ITEM') {
      isEligible = regularItems.some((i) => i.id === promo.targetItemId);
    }

    if (isEligible) {
      if (promo.type === 'DISCOUNT_PERCENT') {
        const disc = Math.round(rawSubtotal * (promo.value / 100));
        promoTotal += disc;
        appliedPromos.push(`${promo.name} (-${promo.value}%)`);
      } else if (promo.type === 'DISCOUNT_NOMINAL') {
        promoTotal += promo.value;
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
          appliedPromos.push(`${promo.name} (Gratis)`);
        }
      }
    }
  });

  const discountTotal = Math.max(0, manualDiscountInput);
  const netSubtotal = Math.max(0, rawSubtotal - promoTotal - discountTotal);
  const serviceFeeAmount = Math.round(netSubtotal * serviceFeeRate);
  const taxAmount = Math.round(netSubtotal * taxRate);
  const total = netSubtotal + serviceFeeAmount + taxAmount;
  const totalQty = regularItems.reduce((sum, item) => sum + item.qty, 0);

  return {
    subtotal: rawSubtotal,
    promoTotal,
    voucherTotal: 0,
    discountTotal,
    serviceFeeAmount,
    serviceFeeRate,
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
  convertCurrency,
};
