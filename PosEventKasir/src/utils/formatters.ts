import { formatRp as formatRpConfig } from '../constants/storeConfig';
import { CurrencyCode, ExchangeRate } from '../types/pos';

export const DEFAULT_EXCHANGE_RATES: Record<CurrencyCode, ExchangeRate> = {
  IDR: { code: 'IDR', symbol: 'Rp', rateToIDR: 1 },
  USD: { code: 'USD', symbol: '$', rateToIDR: 16000 },
  SGD: { code: 'SGD', symbol: 'S$', rateToIDR: 12000 },
};

export const formatRp = (num: number): string => {
  return formatRpConfig(num);
};

export const convertCurrency = (
  amountInIdr: number,
  targetCurrency: CurrencyCode,
  rates: Record<CurrencyCode, ExchangeRate> = DEFAULT_EXCHANGE_RATES,
): number => {
  const rateInfo = rates[targetCurrency] || DEFAULT_EXCHANGE_RATES.IDR;
  if (rateInfo.rateToIDR <= 0) return amountInIdr;
  return amountInIdr / rateInfo.rateToIDR;
};

export const formatCurrency = (
  amount: number,
  currency: CurrencyCode = 'IDR',
  rates: Record<CurrencyCode, ExchangeRate> = DEFAULT_EXCHANGE_RATES,
): string => {
  const rateInfo = rates[currency] || DEFAULT_EXCHANGE_RATES.IDR;
  if (currency === 'IDR') {
    return formatRp(amount);
  }
  const converted = convertCurrency(amount, currency, rates);
  return `${rateInfo.symbol} ${converted.toFixed(2)}`;
};
