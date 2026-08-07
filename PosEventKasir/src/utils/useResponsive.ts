import { useWindowDimensions, Platform, PixelRatio } from 'react-native';

export interface ResponsiveDeviceInfo {
  width: number;
  height: number;
  isLandscape: boolean;
  isTablet: boolean;
  isPhone: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  numColumns: number;
  scaleFont: (size: number) => number;
  scaleSize: (size: number) => number;
  catalogFlex: number;
  cartFlex: number;
}

/**
 * Custom Hook untuk deteksi perangkat & tata letak responsif dinamis (Android HP, Tablet, iPhone, iPad)
 */
export function useResponsive(): ResponsiveDeviceInfo {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const smallestDimension = Math.min(width, height);
  const isTablet = smallestDimension >= 600;
  const isPhone = !isTablet;
  const isIOS = Platform.OS === 'ios';
  const isAndroid = Platform.OS === 'android';

  const scale = width / 375;
  const scaleFont = (size: number) => {
    const newSize = size * (isTablet ? 1.15 : Math.min(scale, 1.25));
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  };

  const scaleSize = (size: number) => {
    const newSize = size * (isTablet ? 1.2 : Math.min(scale, 1.3));
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  };

  let numColumns = 2;
  if (isTablet) {
    numColumns = isLandscape ? 4 : 3;
  } else {
    numColumns = isLandscape ? 3 : 2;
  }

  const catalogFlex = isTablet || isLandscape ? 0.65 : 1;
  const cartFlex = isTablet || isLandscape ? 0.35 : 1;

  return {
    width,
    height,
    isLandscape,
    isTablet,
    isPhone,
    isIOS,
    isAndroid,
    numColumns,
    scaleFont,
    scaleSize,
    catalogFlex,
    cartFlex,
  };
}
