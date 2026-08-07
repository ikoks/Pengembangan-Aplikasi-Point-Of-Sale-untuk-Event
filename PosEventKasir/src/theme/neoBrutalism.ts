import { ViewStyle, TextStyle, Dimensions } from 'react-native';

export const Colors = {
  black: '#000000',
  white: '#FFFFFF',
  yellow: '#FFDD00',
  yellowHover: '#FFC400',
  green: '#00E676',
  greenDark: '#00C853',
  greenSynced: '#1B5E20',
  cyan: '#00E5FF',
  red: '#FF3B30',
  redDark: '#D50000',
  orange: '#FF6D00',
  grayBg: '#FAFAFA',
  grayBorder: '#666666',
  grayText: '#555555',
  grayLocked: '#DCDCDC',
};

export const Borders = {
  thin: 2,
  medium: 3,
  thick: 4,
  borderColor: Colors.black,
};

export const Shadows = {
  cardUnpressed: {
    transform: [{ translateX: -3 }, { translateY: -3 }],
    shadowColor: Colors.black,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  } as ViewStyle,
  cardPressed: {
    transform: [{ translateX: 0 }, { translateY: 0 }],
    elevation: 0,
  } as ViewStyle,
  buttonUnpressed: {
    transform: [{ translateX: -4 }, { translateY: -4 }],
    shadowColor: Colors.black,
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
  } as ViewStyle,
};

export const LayoutTokens = {
  getIsTablet: () => Math.min(Dimensions.get('window').width, Dimensions.get('window').height) >= 600,
  getIsLandscape: () => Dimensions.get('window').width > Dimensions.get('window').height,
  headerHeight: 52,
  cartBottomSheetHeight: '85%' as const,
};
