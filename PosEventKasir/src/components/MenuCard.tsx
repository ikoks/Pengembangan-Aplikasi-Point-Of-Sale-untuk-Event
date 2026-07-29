import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { MenuItem, TenantTheme } from '../types/pos';
import { formatRp } from '../constants/storeConfig';

interface MenuCardProps {
  item: MenuItem;
  theme: TenantTheme;
  cartQty?: number;
  onPress: (item: MenuItem) => void;
}

export const MenuCard = ({ item, theme, cartQty, onPress }: MenuCardProps) => (
  <Pressable
    onPress={() => onPress(item)}
    style={({ pressed }) => [
      styles.menuCard,
      pressed ? styles.menuCardPressed : styles.menuCardUnpressed,
    ]}
  >
    {cartQty && cartQty > 0 ? (
      <View style={[styles.itemQtyBadge, { backgroundColor: theme.accent }]}>
        <Text style={[styles.itemQtyBadgeText, { color: theme.accentText }]}>
          {cartQty}
        </Text>
      </View>
    ) : null}
    <Text style={styles.menuEmoji}>{item.emoji}</Text>
    <Text style={styles.menuName} numberOfLines={2}>{item.name}</Text>
    <View style={[styles.menuPriceBadge, { backgroundColor: theme.accent }]}>
      <Text style={[styles.menuPriceText, { color: theme.accentText }]}>
        {formatRp(item.price)}
      </Text>
    </View>
  </Pressable>
);

const styles = StyleSheet.create({
  menuCard: {
    flex: 1,
    borderWidth: 3,
    borderColor: '#000000',
    backgroundColor: '#FFFFFF',
    padding: 10,
    alignItems: 'center',
    minHeight: 110,
    justifyContent: 'space-between',
    margin: 0,
  },
  menuCardUnpressed: {
    transform: [{ translateX: -3 }, { translateY: -3 }],
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },
  menuCardPressed: { transform: [{ translateX: 0 }, { translateY: 0 }], elevation: 0 },
  menuEmoji: { fontSize: 26, marginBottom: 4 },
  menuName: {
    fontSize: 11,
    fontWeight: '800',
    color: '#000000',
    textAlign: 'center',
    lineHeight: 14,
  },
  menuPriceBadge: {
    marginTop: 6,
    borderWidth: 2,
    borderColor: '#000000',
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  menuPriceText: { fontSize: 10, fontWeight: '900' },
  itemQtyBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    borderWidth: 2.5,
    borderColor: '#000000',
    paddingHorizontal: 7,
    paddingVertical: 2,
    zIndex: 10,
    elevation: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  itemQtyBadgeText: { fontSize: 11, fontWeight: '900' },
});
