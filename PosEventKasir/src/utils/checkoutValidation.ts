export interface CartItemValidationInput {
  id?: string;
  name?: string;
  qty?: number;
  quantity?: number;
  price?: number;
}

export interface ValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

export interface CashValidationResult extends ValidationResult {
  change: number;
}

/**
 * 1. Validasi Keranjang Belanja sebelum checkout
 * Cegah checkout jika keranjang kosong atau item quantity <= 0.
 */
export function validateCartBeforeCheckout(
  cartItems: CartItemValidationInput[]
): ValidationResult {
  if (!cartItems || cartItems.length === 0) {
    return {
      isValid: false,
      errorMessage: 'Keranjang belanja masih kosong. Silakan pilih menu terlebih dahulu.',
    };
  }

  const invalidItem = cartItems.find(
    (item) => (item.quantity ?? item.qty ?? 0) <= 0
  );

  if (invalidItem) {
    return {
      isValid: false,
      errorMessage: `Item "${invalidItem.name || 'Produk'}" memiliki kuantitas tidak valid (<= 0).`,
    };
  }

  return { isValid: true };
}

/**
 * 2. Validasi Pembayaran Tunai
 * Cegah kembalian minus (cashReceived < totalAmount).
 */
export function validateCashPayment(
  totalAmount: number,
  cashReceived: number
): CashValidationResult {
  const change = cashReceived - totalAmount;

  if (isNaN(cashReceived) || cashReceived <= 0) {
    return {
      isValid: false,
      change: 0,
      errorMessage: 'Nominal uang pembeli tidak valid.',
    };
  }

  if (cashReceived < totalAmount) {
    const formattedDiff = Math.abs(change).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return {
      isValid: false,
      change,
      errorMessage: `Uang pembayaran kurang! (Kekurangan: Rp ${formattedDiff})`,
    };
  }

  return {
    isValid: true,
    change,
  };
}

/**
 * 3. Validasi Pembayaran Non-Tunai
 * Cegah jika metode belum dipilih atau refNumber kosong / kurang dari 4 karakter.
 */
export function validateNonCashPayment(
  method: string,
  refNumber: string
): ValidationResult {
  if (!method || method.trim() === '') {
    return {
      isValid: false,
      errorMessage: 'Silakan pilih metode pembayaran non-tunai terlebih dahulu.',
    };
  }

  const trimmedRef = (refNumber || '').trim();
  if (!trimmedRef || trimmedRef.length < 4) {
    return {
      isValid: false,
      errorMessage:
        'Nomor referensi / approval code wajib diisi (minimal 4 karakter).',
    };
  }

  return { isValid: true };
}
