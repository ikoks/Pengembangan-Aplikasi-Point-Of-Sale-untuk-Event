

import React, { useState, useEffect } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  Alert,
} from 'react-native';
import { MenuItem, SelectedBundleItem, TenantTheme } from '../types/pos';
import { formatRp } from '../constants/storeConfig';

interface BundleSelectionModalProps {
  visible: boolean;
  item: MenuItem | null;
  theme: TenantTheme;
  onClose: () => void;
  onConfirm: (item: MenuItem, selectedSubItems: SelectedBundleItem[]) => void;
}

export const BundleSelectionModal = ({
  visible,
  item,
  theme,
  onClose,
  onConfirm,
}: BundleSelectionModalProps) => {
  const [selections, setSelections] = useState<Record<string, SelectedBundleItem[]>>({});

  useEffect(() => {
    if (visible && item) {
      const initial: Record<string, SelectedBundleItem[]> = {};
      if (item.bundleGroups) {
        item.bundleGroups.forEach((group) => {
          if (group.options && group.options.length > 0) {
            const first = group.options[0];
            initial[group.id] = [
              {
                groupId: group.id,
                groupName: group.name,
                optionId: first.id,
                optionName: first.name,
                extraPrice: first.extraPrice || 0,
                stockDeductItemId: first.stockDeductItemId,
              },
            ];
          }
        });
      }
      setSelections(initial);
    }
  }, [visible, item]);

  if (!visible || !item || !item.bundleGroups) return null;

  const handleSelectOption = (
    groupId: string,
    groupName: string,
    optionId: string,
    optionName: string,
    extraPrice?: number,
    stockDeductItemId?: string
  ) => {
    setSelections((prev) => ({
      ...prev,
      [groupId]: [
        {
          groupId,
          groupName,
          optionId,
          optionName,
          extraPrice: extraPrice || 0,
          stockDeductItemId,
        },
      ],
    }));
  };

  const handleConfirm = () => {
    for (const group of item.bundleGroups!) {
      const groupSelections = selections[group.id] || [];
      const minSelect = group.minSelect ?? 1;
      if (groupSelections.length < minSelect) {
        Alert.alert(
          '⚠️ PILIHAN BELUM LENGKAP',
          `Mohon pilih item untuk ${group.name.toUpperCase()}.`
        );
        return;
      }
    }

    const flatSelections = Object.values(selections).flat();
    onConfirm(item, flatSelections);
    onClose();
  };

  const extraTotal = Object.values(selections)
    .flat()
    .reduce((acc, curr) => acc + (curr.extraPrice || 0), 0);
  const calculatedTotal = item.price + extraTotal;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalBox}>

          <View style={[styles.header, { backgroundColor: theme.accent }]}>
            <Text style={[styles.headerTitle, { color: theme.accentText }]}>
              🎁 PILIH ISI PAKET BUNDLING: {item.name.toUpperCase()}
            </Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.bodyScroll}>
            {item.bundleGroups.map((group) => {
              const currentGroupSelections = selections[group.id] || [];

              return (
                <View key={group.id} style={styles.groupContainer}>
                  <View style={styles.groupHeader}>
                    <Text style={styles.groupTitle}>📌 {group.name.toUpperCase()}</Text>
                    <Text style={styles.groupSubtitle}>PILIH 1 ITEM</Text>
                  </View>

                  <View style={styles.optionsGrid}>
                    {group.options.map((opt) => {
                      const isSelected = currentGroupSelections.some(
                        (s) => s.optionId === opt.id
                      );

                      return (
                        <Pressable
                          key={opt.id}
                          onPress={() =>
                            handleSelectOption(
                              group.id,
                              group.name,
                              opt.id,
                              opt.name,
                              opt.extraPrice,
                              opt.stockDeductItemId
                            )
                          }
                          style={[
                            styles.optionCard,
                            isSelected && [
                              styles.optionCardSelected,
                              { backgroundColor: theme.accent },
                            ],
                          ]}
                        >
                          <Text
                            style={[
                              styles.optionName,
                              isSelected && { color: theme.accentText, fontWeight: '900' },
                            ]}
                          >
                            {opt.name}
                          </Text>
                          {opt.extraPrice && opt.extraPrice > 0 ? (
                            <Text
                              style={[
                                styles.extraPriceText,
                                isSelected && { color: theme.accentText },
                              ]}
                            >
                              +{formatRp(opt.extraPrice)}
                            </Text>
                          ) : (
                            <Text
                              style={[
                                styles.freeExtraText,
                                isSelected && { color: theme.accentText },
                              ]}
                            >
                              (TERMASUK BUNDLE)
                            </Text>
                          )}
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              );
            })}
          </ScrollView>

          <View style={styles.footer}>
            <View style={styles.footerPriceRow}>
              <Text style={styles.footerPriceLabel}>TOTAL HARGA BUNDLE:</Text>
              <Text style={styles.footerPriceValue}>{formatRp(calculatedTotal)}</Text>
            </View>

            <Pressable
              onPress={handleConfirm}
              style={({ pressed }) => [
                styles.confirmBtn,
                { backgroundColor: theme.accent },
                pressed ? styles.btnPressed : styles.btnUnpressed,
              ]}
            >
              <Text style={[styles.confirmBtnText, { color: theme.accentText }]}>
                TAMBAHKAN PAKET BUNDLE ➔
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    padding: 16,
  },
  modalBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 4,
    borderColor: '#000000',
    borderRadius: 12,
    overflow: 'hidden',
    maxHeight: '85%',
    shadowColor: '#000000',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 3,
    borderColor: '#000000',
  },
  headerTitle: { fontSize: 13, fontWeight: '900', flex: 1, marginRight: 8 },
  closeBtn: {
    width: 28,
    height: 28,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: { color: '#FFFFFF', fontWeight: '900', fontSize: 14 },
  bodyScroll: { padding: 16 },
  groupContainer: {
    marginBottom: 16,
    borderWidth: 2.5,
    borderColor: '#000000',
    backgroundColor: '#FAF3EC',
    padding: 12,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  groupTitle: { fontSize: 12, fontWeight: '900', color: '#000000' },
  groupSubtitle: { fontSize: 9, fontWeight: '800', color: '#666666' },
  optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionCard: {
    borderWidth: 2,
    borderColor: '#000000',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 8,
    minWidth: '47%',
    flex: 1,
  },
  optionCardSelected: { borderColor: '#000000' },
  optionName: { fontSize: 11, fontWeight: '800', color: '#000000' },
  extraPriceText: { fontSize: 10, fontWeight: '900', color: '#1A3FBB', marginTop: 2 },
  freeExtraText: { fontSize: 9, fontWeight: '700', color: '#2E7D32', marginTop: 2 },
  footer: {
    padding: 14,
    borderTopWidth: 3,
    borderColor: '#000000',
    backgroundColor: '#FFFFFF',
  },
  footerPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  footerPriceLabel: { fontSize: 11, fontWeight: '900', color: '#000000' },
  footerPriceValue: { fontSize: 16, fontWeight: '900', color: '#000000' },
  confirmBtn: {
    borderWidth: 3,
    borderColor: '#000000',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnUnpressed: {
    shadowColor: '#000000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  btnPressed: {
    transform: [{ translateX: 2 }, { translateY: 2 }],
    elevation: 0,
  },
  confirmBtnText: { fontSize: 12, fontWeight: '900' },
});
