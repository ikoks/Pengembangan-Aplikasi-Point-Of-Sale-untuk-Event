import { useEffect } from 'react';
import { BackHandler, Alert } from 'react-native';
export interface UseAndroidBackInterceptOptions {
  currentScreen: 'POS_MAIN' | 'PAYMENT_CASH' | 'PAYMENT_NON_CASH' | 'RECEIPT' | string;
  hasCartItems?: boolean;
  onClearCart?: () => void;
  onNavigateToPosMain?: () => void;
}
export function useAndroidBackIntercept({
  currentScreen,
  hasCartItems = false,
  onClearCart,
  onNavigateToPosMain,
}: UseAndroidBackInterceptOptions) {
  useEffect(() => {
    const handleBackPress = (): boolean => {
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
        return true;
      }
      if (currentScreen === 'RECEIPT') {
        if (onNavigateToPosMain) {
          onNavigateToPosMain();
        }
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
