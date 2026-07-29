import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { CartItemModel } from '../services/cartService';
import { TenantTheme } from '../types/pos';
import { formatRp } from '../constants/storeConfig';

interface CartRowProps {
  item: CartItemModel;
  theme: TenantTheme;
  onIncrease: (id: string) => void;
  onDecrease: (id: string) => void;
  onRemove: (id: string) => void;
}

export const CartRow = ({
  item,
  theme,
  onIncrease,
  onDecrease,
  onRemove,
}: CartRowProps) => (
  <View style={[styles.cartRow, item.isFreeBonus && styles.freeBonusRow]}>
    <View style={styles.cartRowInfo}>
      <Text style={styles.cartItemEmoji}>{item.emoji || '📦'}</Text>
      <View style={styles.cartItemDetail}>
        <Text style={styles.cartItemName} numberOfLines={1}>
          {item.name} {item.isFreeBonus ? '(BONUS)' : ''}
        </Text>
        <Text style={[styles.cartItemPrice, item.isFreeBonus && styles.freeBonusText]}>
          {item.isFreeBonus ? 'GRATIS Rp0' : formatRp(item.price)}
        </Text>
      </View>
    </View>
    {!item.isFreeBonus && (
      <View style={styles.cartRowControls}>
        <Pressable
          onPress={() => onDecrease(item.id)}
          style={({ pressed }) => [
            styles.qtyBtn,
            pressed ? styles.qtyBtnPressed : styles.qtyBtnUnpressed,
          ]}
        >
          <Text style={styles.qtyBtnText}>−</Text>
        </Pressable>
        <View style={[styles.qtyDisplay, { backgroundColor: theme.accent }]}>
          <Text style={[styles.qtyText, { color: theme.accentText }]}>{item.qty}</Text>
        </View>
        <Pressable
          onPress={() => onIncrease(item.id)}
          style={({ pressed }) => [
            styles.qtyBtn,
            { backgroundColor: theme.accent },
            pressed ? styles.qtyBtnPressed : styles.qtyBtnUnpressed,
          ]}
        >
          <Text style={[styles.qtyBtnText, { color: theme.accentText }]}>+</Text>
        </Pressable>
        <Pressable
          onPress={() => onRemove(item.id)}
          style={({ pressed }) => [
            styles.removeBtn,
            pressed ? styles.qtyBtnPressed : styles.qtyBtnUnpressed,
          ]}
        >
          <Text style={styles.removeBtnText}>✕</Text>
        </Pressable>
      </View>
    )}
  </View>
);

const styles = StyleSheet.create({
  cartRow: {
    borderBottomWidth: 2,
    borderBottomColor: '#000000',
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
  },
  cartRowInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  cartItemEmoji: { fontSize: 18, marginRight: 8 },
  cartItemDetail: { flex: 1 },
  cartItemName: { fontSize: 12, fontWeight: '800', color: '#000000' },
  cartItemPrice: { fontSize: 11, fontWeight: '700', color: '#555555', marginTop: 1 },
  cartRowControls: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  qtyBtn: {
    width: 28,
    height: 28,
    borderWidth: 2.5,
    borderColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  qtyBtnText: { fontSize: 15, fontWeight: '900', color: '#000000', lineHeight: 17 },
  qtyDisplay: {
    width: 32,
    height: 28,
    borderWidth: 2.5,
    borderColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyText: { fontSize: 13, fontWeight: '900' },
  removeBtn: {
    width: 28,
    height: 28,
    borderWidth: 2.5,
    borderColor: '#000000',
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  removeBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  qtyBtnUnpressed: {
    transform: [{ translateX: -1 }, { translateY: -1 }],
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  qtyBtnPressed: {
    transform: [{ translateX: 0 }, { translateY: 0 }],
    elevation: 0,
  },
  freeBonusRow: { backgroundColor: '#FFFDE0' },
  freeBonusText: { color: '#2E7D32', fontWeight: '900' },
});
