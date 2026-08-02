
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

  return (
    <Pressable
      disabled={isOutOfStock}
      onPress={() => onPress(item)}
      style={({ pressed }) => [
        styles.card,
        isOutOfStock && styles.cardDisabled,
        pressed && !isOutOfStock ? styles.cardPressed : styles.cardUnpressed,
      ]}
    >
      <View style={styles.cardHeader}>
        <Text style={[styles.title, isOutOfStock && styles.textDisabled]} numberOfLines={2}>
          {item.name.toUpperCase()}
        </Text>
        <Text style={[styles.price, isOutOfStock && styles.textDisabled]}>
          {isOutOfStock ? 'STOK KOSONG' : formatRp(item.price)}
        </Text>
      </View>

      {cartQty && cartQty > 0 ? (
        <View style={styles.qtyBadge}>
          <Text style={styles.qtyBadgeText}>{cartQty}</Text>
        </View>
      ) : null}

      <View style={styles.addBtnBox}>
        <Text style={styles.addBtnText}>+</Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    height: 110,
    backgroundColor: '#FFFFFF',
    borderWidth: 2.5,
    borderColor: '#000000',
    padding: 12,
    justifyContent: 'space-between',
    position: 'relative',
    margin: 4,
  },
  cardDisabled: {
    backgroundColor: '#F0F0F0',
    opacity: 0.6,
  },
  cardUnpressed: {
    shadowColor: '#000000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  cardPressed: {
    transform: [{ translateX: 2 }, { translateY: 2 }],
    elevation: 0,
  },
  cardHeader: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: -0.2,
    lineHeight: 18,
    marginBottom: 4,
  },
  price: {
    fontSize: 13,
    fontWeight: '700',
    color: '#333333',
  },
  textDisabled: {
    color: '#888888',
  },
  addBtnBox: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 22,
  },
  qtyBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFDD00',
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  qtyBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#000000',
  },
});
