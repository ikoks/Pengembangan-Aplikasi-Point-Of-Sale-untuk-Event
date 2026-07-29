import React from 'react';
import { StyleSheet, Text, Pressable } from 'react-native';
import { Colors, Borders, Shadows } from '../theme/neoBrutalism';

interface CashDenominationPillProps {
  label: string;
  onPress: () => void;
  isExactPay?: boolean;
}

export const CashDenominationPill = ({
  label,
  onPress,
  isExactPay = false,
}: CashDenominationPillProps) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      styles.pillBase,
      isExactPay ? styles.pillExact : styles.pillNormal,
      pressed ? Shadows.cardPressed : Shadows.cardUnpressed,
    ]}
  >
    <Text style={[styles.pillText, isExactPay && styles.pillTextExact]}>
      {label}
    </Text>
  </Pressable>
);

const styles = StyleSheet.create({
  pillBase: {
    borderWidth: Borders.medium,
    borderColor: Borders.borderColor,
    paddingVertical: 10,
    paddingHorizontal: 14,
    minWidth: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillNormal: {
    backgroundColor: Colors.white,
  },
  pillExact: {
    backgroundColor: Colors.yellow,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '900',
    color: Colors.black,
  },
  pillTextExact: {
    color: Colors.black,
  },
});
