import { useEffect } from 'react';
import { BackHandler, Alert } from 'react-native';

export interface UseAndroidBackInterceptOptions {
  currentScreen: 'POS_MAIN' | 'PAYMENT_CASH' | 'PAYMENT_NON_CASH' | 'RECEIPT' | string;
  hasCartItems?: boolean;
  onClearCart?: () => void;
  onNavigateToPosMain?: () => void;
}

/**
 * Custom Hook React Native untuk menangani interupsi tombol 'Back' bawaan Android
 */
export function useAndroidBackIntercept({
  currentScreen,
  hasCartItems = false,
  onClearCart,
  onNavigateToPosMain,
}: UseAndroidBackInterceptOptions) {
  useEffect(() => {
    const handleBackPress = (): boolean => {
      // 1. Jika kasir berada di POS_MAIN dan terdapat item di keranjang belanja
      if (currentScreen === 'POS_MAIN' && hasCartItems) {
        Alert.alert(
          '⚠️ BATALKAN TRANSAKSI?',
          'Item di keranjang belanja akan dihapus. Lanjutkan?',
          [
            { text: 'BATAL', style: 'cancel', onPress: () => {} },
            {
              text: 'YA, HAPUS',
              style: 'destructive',
              onPress: () => {
                if (onClearCart) onClearCart();
              },
            },
          ]
        );
        // Mencegah aplikasi keluar paksa secara tidak sengaja
        return true;
      }

      // 2. Jika kasir berada di layar RECEIPT setelah sukses bayar
      if (currentScreen === 'RECEIPT') {
        if (onNavigateToPosMain) {
          onNavigateToPosMain();
        }
        // Mencegah tombol back mengembalikan kasir ke layar pembayaran yang sudah selesai
        return true;
      }

      return false;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      handleBackPress
    );

    return () => backHandler.remove();
  }, [currentScreen, hasCartItems, onClearCart, onNavigateToPosMain]);
}

export default useAndroidBackIntercept;
