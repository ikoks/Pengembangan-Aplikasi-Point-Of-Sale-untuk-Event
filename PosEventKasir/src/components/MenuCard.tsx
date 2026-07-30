
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

export const MenuCard = ({ item, theme, cartQty, onPress }: MenuCardProps) => {
  const isOutOfStock = item.isAvailable === false || (item.stockQuantity !== undefined && item.stockQuantity <= 0);
  const hasModifiers = item.modifierGroups && item.modifierGroups.length > 0;

  return (
    <Pressable
      disabled={isOutOfStock}
      onPress={() => onPress(item)}
      style={({ pressed }) => [
        styles.menuCard,
        isOutOfStock && styles.menuCardDisabled,
        pressed && !isOutOfStock ? styles.menuCardPressed : styles.menuCardUnpressed,
      ]}
    >

      {cartQty && cartQty > 0 ? (
        <View style={[styles.itemQtyBadge, { backgroundColor: theme.accent }]}>
          <Text style={[styles.itemQtyBadgeText, { color: theme.accentText }]}>
            {cartQty}
          </Text>
        </View>
      ) : null}

      <View
        style={[
          styles.stockBadge,
          isOutOfStock ? styles.stockBadgeOut : styles.stockBadgeAvailable,
        ]}
      >
        <Text style={styles.stockBadgeText}>
          {isOutOfStock ? '🚫 HABIS' : `STOK: ${item.stockQuantity ?? '∞'}`}
        </Text>
      </View>

      <Text style={[styles.menuEmoji, isOutOfStock && styles.emojiDisabled]}>{item.emoji}</Text>
      <Text style={[styles.menuName, isOutOfStock && styles.textDisabled]} numberOfLines={2}>
        {item.name}
      </Text>

      {hasModifiers && !isOutOfStock ? (
        <View style={styles.modifierTag}>
          <Text style={styles.modifierTagText}>✨ OPSI VARIAN</Text>
        </View>
      ) : null}

      <View style={[styles.menuPriceBadge, { backgroundColor: isOutOfStock ? '#CCCCCC' : theme.accent }]}>
        <Text style={[styles.menuPriceText, { color: isOutOfStock ? '#666666' : theme.accentText }]}>
          {isOutOfStock ? 'STOK KOSONG' : formatRp(item.price)}
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  menuCard: {
    flex: 1,
    borderWidth: 3,
    borderColor: '#000000',
    backgroundColor: '#FFFFFF',
    padding: 10,
    alignItems: 'center',
    minHeight: 125,
    justifyContent: 'space-between',
    margin: 0,
    position: 'relative',
  },
  menuCardDisabled: {
    backgroundColor: '#EBEBEB',
    borderColor: '#888888',
    opacity: 0.75,
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
  emojiDisabled: { opacity: 0.4 },
  menuName: {
    fontSize: 11,
    fontWeight: '800',
    color: '#000000',
    textAlign: 'center',
    lineHeight: 14,
  },
  textDisabled: { color: '#777777', textDecorationLine: 'line-through' },
  stockBadge: {
    borderWidth: 1.5,
    borderColor: '#000000',
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginBottom: 4,
  },
  stockBadgeAvailable: { backgroundColor: '#E0F7FA' },
  stockBadgeOut: { backgroundColor: '#FFCDD2' },
  stockBadgeText: { fontSize: 8, fontWeight: '900', color: '#000000' },
  modifierTag: {
    backgroundColor: '#FFF9C4',
    borderWidth: 1,
    borderColor: '#000000',
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginTop: 2,
  },
  modifierTagText: { fontSize: 8, fontWeight: '900', color: '#000000' },
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
