import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export const HatchingPatternBackground = () => (
  <View style={styles.hatchedBgWrapper} pointerEvents="none">
    <Text style={styles.hatchedBgText}>
      \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
    </Text>
  </View>
);

export const HatchedDisabledOverlay = ({ label }: { label?: string }) => (
  <View style={styles.hatchedOverlay} pointerEvents="none">
    <Text style={styles.hatchedPatternText}>
      \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
    </Text>
    <View style={styles.lockedBadge}>
      <Text style={styles.lockedBadgeText}>🔒 {label || 'DIKUNCI'}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  hatchedBgWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(220, 220, 220, 0.65)',
    zIndex: 1,
  },
  hatchedBgText: {
    color: 'rgba(0, 0, 0, 0.15)',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2,
    transform: [{ rotate: '-12deg' }, { scale: 1.5 }],
  },
  hatchedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(215, 215, 215, 0.75)',
    zIndex: 10,
  },
  hatchedPatternText: {
    color: 'rgba(0, 0, 0, 0.12)',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 3,
    transform: [{ rotate: '-15deg' }, { scale: 1.8 }],
  },
  lockedBadge: {
    backgroundColor: '#000000',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1.5,
    borderColor: '#FF3B30',
  },
  lockedBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
