import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Colors, Borders, Shadows } from '../theme/neoBrutalism';

interface PaymentMethodCardProps {
  id: string;
  name: string;
  category: string;
  emoji: string;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export const PaymentMethodCard = ({
  id,
  name,
  category,
  emoji,
  isSelected,
  onSelect,
}: PaymentMethodCardProps) => (
  <Pressable
    onPress={() => onSelect(id)}
    style={({ pressed }) => [
      styles.cardBase,
      isSelected ? styles.cardSelected : styles.cardUnselected,
      pressed ? Shadows.cardPressed : Shadows.cardUnpressed,
    ]}
  >
    <Text style={styles.cardEmoji}>{emoji}</Text>
    <View style={styles.cardInfo}>
      <Text style={styles.cardName}>{name}</Text>
      <Text style={styles.cardCategory}>{category}</Text>
    </View>
    {isSelected && <Text style={styles.cardCheck}>✓</Text>}
  </Pressable>
);

const styles = StyleSheet.create({
  cardBase: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: Borders.medium,
    borderColor: Borders.borderColor,
    marginBottom: 8,
  },
  cardUnselected: {
    backgroundColor: Colors.white,
  },
  cardSelected: {
    backgroundColor: Colors.cyan,
  },
  cardEmoji: {
    fontSize: 22,
    marginRight: 10,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 12,
    fontWeight: '900',
    color: Colors.black,
  },
  cardCategory: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.grayText,
    marginTop: 1,
  },
  cardCheck: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.black,
  },
});
