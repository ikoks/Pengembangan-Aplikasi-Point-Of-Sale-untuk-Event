
import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  Alert,
} from 'react-native';
import { MenuItem, ModifierGroup, ModifierOption, SelectedModifier, TenantTheme } from '../types/pos';
import { formatRp } from '../constants/storeConfig';

interface ModifierModalProps {
  visible: boolean;
  item: MenuItem | null;
  theme: TenantTheme;
  onClose: () => void;
  onConfirm: (item: MenuItem, selectedModifiers: SelectedModifier[]) => void;
}

export const ModifierModal = ({
  visible,
  item,
  theme,
  onClose,
  onConfirm,
}: ModifierModalProps) => {
  const [selections, setSelections] = useState<Record<string, ModifierOption[]>>({});
  const [outOfStockIds, setOutOfStockIds] = useState<Set<string>>(new Set());
  const [popularOptionIds, setPopularOptionIds] = useState<Set<string>>(
    new Set(['flv_choco', 'flv_vanilla', 'flv_matcha', 'flv_strawberry', 'flv_pistachio'])
  );
  const [isStockManageModalOpen, setIsStockManageModalOpen] = useState(false);

  useEffect(() => {
    if (item && item.modifierGroups) {
      const initial: Record<string, ModifierOption[]> = {};
      item.modifierGroups.forEach((group) => {
        initial[group.id] = [];
      });
      setSelections(initial);
    } else {
      setSelections({});
    }
  }, [item]);

  const selectedModifiersList = useMemo<SelectedModifier[]>(() => {
    if (!item || !item.modifierGroups) return [];
    const list: SelectedModifier[] = [];
    item.modifierGroups.forEach((group) => {
      const opts = selections[group.id] || [];
      opts.forEach((opt) => {
        list.push({
          groupId: group.id,
          groupName: group.name,
          optionId: opt.id,
          optionName: opt.name,
          price: opt.price,
        });
      });
    });
    return list;
  }, [item, selections]);

  const additionalPrice = useMemo(() => {
    return selectedModifiersList.reduce((acc, curr) => acc + curr.price, 0);
  }, [selectedModifiersList]);

  const isValid = useMemo(() => {
    if (!item || !item.modifierGroups) return true;
    for (const group of item.modifierGroups) {
      const min = group.minSelect ?? 0;
      const count = (selections[group.id] || []).length;
      if (count < min) return false;
    }
    return true;
  }, [item, selections]);

  const toggleOutOfStock = (optionId: string) => {
    setOutOfStockIds((prev) => {
      const next = new Set(prev);
      if (next.has(optionId)) {
        next.delete(optionId);
      } else {
        next.add(optionId);
      }
      return next;
    });
  };

  const togglePopularOption = (optionId: string) => {
    setPopularOptionIds((prev) => {
      const next = new Set(prev);
      if (next.has(optionId)) {
        next.delete(optionId);
      } else {
        next.add(optionId);
      }
      return next;
    });
  };

  const toggleOption = (group: ModifierGroup, option: ModifierOption) => {
    if (outOfStockIds.has(option.id)) {
      Alert.alert(
        '🚫 RASA HABIS / SOLD OUT',
        `Maaf, varian "${option.name}" sedang KOSONG di booth.`
      );
      return;
    }

    setSelections((prev) => {
      const currentList = prev[group.id] || [];
      const exists = currentList.some((opt) => opt.id === option.id);
      const max = group.maxSelect ?? 1;

      if (exists) {
        return {
          ...prev,
          [group.id]: currentList.filter((opt) => opt.id !== option.id),
        };
      } else {
        if (max === 1) {
          return {
            ...prev,
            [group.id]: [option],
          };
        } else {
          if (currentList.length >= max) {
            Alert.alert(
              '⚠️ BATAS MAKSIMUM',
              `Anda hanya dapat memilih maksimal ${max} opsi untuk ${group.name}.`
            );
            return prev;
          }
          return {
            ...prev,
            [group.id]: [...currentList, option],
          };
        }
      }
    });
  };

  if (!item || !visible) return null;

  const totalPrice = item.price + additionalPrice;

  const handleConfirm = () => {
    if (!isValid) {
      Alert.alert('⚠️ OPSI BELUM LENGKAP', 'Mohon lengkapi opsi varian yang wajib dipilih.');
      return;
    }
    onConfirm(item, selectedModifiersList);
    onClose();
  };

  const isGelatoItem = item.category?.toLowerCase().includes('gelato') || item.name?.toLowerCase().includes('scoop');

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalBox}>
          <View style={[styles.header, { backgroundColor: theme.accent }]}>
            <Pressable onPress={onClose} style={styles.backBtnHeader}>
              <Text style={styles.backBtnHeaderText}>← KEMBALI</Text>
            </Pressable>
            <Text style={styles.headerEmoji}>{item.emoji}</Text>
            <View style={styles.headerTitleCol}>
              <Text style={[styles.headerTitle, { color: theme.accentText }]}>
                {item.name.toUpperCase()}
              </Text>
              <Text style={[styles.headerPrice, { color: theme.accentText }]}>
                Harga Dasar: {formatRp(item.price)}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              {isGelatoItem && (
                <Pressable
                  onPress={() => setIsStockManageModalOpen(true)}
                  style={styles.manageFavHeaderBtn}
                >
                  <Text style={styles.manageFavHeaderBtnText}>⭐ ATUR FAVORIT</Text>
                </Pressable>
              )}
              <Pressable onPress={onClose} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕ TUTUP</Text>
              </Pressable>
            </View>
          </View>

          <ScrollView style={styles.bodyScroll} contentContainerStyle={{ paddingBottom: 20 }}>
            {(item.modifierGroups || []).map((group) => {
              const currentSelected = selections[group.id] || [];
              const min = group.minSelect ?? 0;
              const max = group.maxSelect ?? 1;

              const popularOptions = group.options.filter(
                (opt) => popularOptionIds.has(opt.id)
              );
              const isFlavorGroup = group.name.toUpperCase().includes('RASA') || group.name.toUpperCase().includes('GELATO');

              return (
                <View key={group.id} style={styles.groupCard}>
                  <View style={styles.groupHeaderRow}>
                    <Text style={styles.groupTitle}>{group.name}</Text>
                    <View style={[styles.badge, min > 0 ? styles.badgeRequired : styles.badgeOptional]}>
                      <Text style={styles.badgeText}>
                        {min > 0 ? `WAJIB (${min})` : `OPSIONAL (Maks ${max})`}
                      </Text>
                    </View>
                  </View>

                  {isFlavorGroup && popularOptions.length > 0 && (
                    <View style={styles.popularContainer}>
                      <Text style={styles.popularTitle}>⭐ RASA TERPOPULER (FAVORIT EVENT):</Text>
                      <View style={styles.popularRow}>
                        {popularOptions.map((opt) => {
                          const isSelected = currentSelected.some((o) => o.id === opt.id);
                          const isSoldOut = outOfStockIds.has(opt.id);
                          return (
                            <Pressable
                              key={`pop_${opt.id}`}
                              onPress={() => toggleOption(group, opt)}
                              style={[
                                styles.popularChip,
                                isSelected && { backgroundColor: theme.accent, borderColor: '#000000' },
                                isSoldOut && styles.optionDisabled,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.popularChipText,
                                  isSelected && { color: theme.accentText, fontWeight: '900' },
                                  isSoldOut && { color: '#888888', textDecorationLine: 'line-through' },
                                ]}
                              >
                                {(opt as any).emoji || '⭐'} {opt.name} {isSoldOut ? '(HABIS)' : ''}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                  )}

                  <View style={styles.optionsList}>
                    {group.options.map((option) => {
                      const isSelected = currentSelected.some((o) => o.id === option.id);
                      const isSoldOut = outOfStockIds.has(option.id);

                      return (
                        <Pressable
                          key={option.id}
                          onPress={() => toggleOption(group, option)}
                          style={[
                            styles.optionPill,
                            isSelected && [styles.optionPillActive, { backgroundColor: theme.accent }],
                            isSoldOut && styles.optionDisabled,
                          ]}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 4 }}>
                            <Text
                              style={[
                                styles.optionText,
                                isSelected && { color: theme.accentText, fontWeight: '900' },
                                isSoldOut && { color: '#888888', textDecorationLine: 'line-through' },
                              ]}
                            >
                              {isSelected ? '✓ ' : '+ '}
                              {(option as any).emoji ? `${(option as any).emoji} ` : ''}
                              {option.name}
                            </Text>
                            {isSoldOut && (
                              <View style={styles.soldOutBadge}>
                                <Text style={styles.soldOutText}>🚫 HABIS</Text>
                              </View>
                            )}
                          </View>

                          {option.price > 0 ? (
                            <Text
                              style={[
                                styles.optionPrice,
                                isSelected && { color: theme.accentText, fontWeight: '900' },
                                isSoldOut && { color: '#888888' },
                              ]}
                            >
                              +{formatRp(option.price)}
                            </Text>
                          ) : null}
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              );
            })}
          </ScrollView>

          <View style={styles.footer}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>TOTAL ITEM:</Text>
              <Text style={styles.totalPriceText}>{formatRp(totalPrice)}</Text>
            </View>

            <Pressable
              disabled={!isValid}
              onPress={handleConfirm}
              style={({ pressed }) => [
                styles.confirmBtn,
                { backgroundColor: isValid ? theme.accent : '#CCCCCC' },
                pressed && isValid ? styles.btnPressed : styles.btnUnpressed,
              ]}
            >
              <Text style={[styles.confirmBtnText, { color: isValid ? theme.accentText : '#888888' }]}>
                {isValid ? 'TAMBAH KE KERANJANG ➔' : 'LENGKAPI RASA/VARIAN'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>

      <Modal visible={isStockManageModalOpen} animationType="fade" transparent>
        <View style={styles.stockManageOverlay}>
          <View style={styles.stockManageBox}>
            <View style={styles.stockManageHeader}>
              <Text style={styles.stockManageTitle}>⭐ ATUR RASA FAVORIT / TERPOPULER</Text>
              <Pressable
                onPress={() => setIsStockManageModalOpen(false)}
                style={styles.stockManageCloseBtn}
              >
                <Text style={styles.stockManageCloseText}>✕ SELESAI</Text>
              </Pressable>
            </View>
            <Text style={styles.stockManageSub}>
              Klik varian rasa di bawah ini untuk memasukkan / mengeluarkan dari baris Rasa Terpopuler:
            </Text>
            <ScrollView style={{ maxHeight: 340 }}>
              {(item.modifierGroups || []).map((grp) => (
                <View key={`mng_${grp.id}`} style={{ marginBottom: 14 }}>
                  <Text style={styles.manageGroupTitle}>{grp.name}</Text>
                  {grp.options.map((opt) => {
                    const isPop = popularOptionIds.has(opt.id);
                    return (
                      <Pressable
                        key={`mng_opt_${opt.id}`}
                        onPress={() => togglePopularOption(opt.id)}
                        style={[
                          styles.manageOptionRow,
                          isPop ? { backgroundColor: '#FFFBEA', borderColor: '#000000' } : { backgroundColor: '#FFFFFF' },
                        ]}
                      >
                        <Text style={[styles.manageOptionName, { flex: 1 }]}>
                          {(opt as any).emoji || '🍨'} {opt.name}
                        </Text>
                        <View style={[
                          styles.manageStatusBadge,
                          isPop ? { backgroundColor: '#FFDD00' } : { backgroundColor: '#EEEEEE' },
                        ]}>
                          <Text style={[styles.manageStatusText, { color: '#000000', fontWeight: '900' }]}>
                            {isPop ? '⭐ FAVORIT TERPOPULER' : '⚪ BIASA'}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderColor: '#000000',
    maxHeight: '85%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 3,
    borderColor: '#000000',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  backBtnHeader: {
    backgroundColor: '#000000',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
  },
  backBtnHeaderText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  headerEmoji: { fontSize: 32, marginRight: 10 },
  headerTitleCol: { flex: 1 },
  headerTitle: { fontSize: 16, fontWeight: '900' },
  headerPrice: { fontSize: 12, fontWeight: '700', marginTop: 2 },
  closeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
  },
  closeBtnText: { color: '#FFFFFF', fontWeight: '900', fontSize: 12 },
  bodyScroll: { padding: 14 },
  groupCard: {
    borderWidth: 2.5,
    borderColor: '#000000',
    backgroundColor: '#FAF3EC',
    padding: 12,
    marginBottom: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  groupHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  groupTitle: { fontSize: 13, fontWeight: '900', color: '#000000', flex: 1 },
  badge: {
    borderWidth: 1.5,
    borderColor: '#000000',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeRequired: { backgroundColor: '#FFD1D1' },
  badgeOptional: { backgroundColor: '#E2F0D9' },
  badgeText: { fontSize: 9, fontWeight: '900', color: '#000000' },
  optionsList: { gap: 8 },
  optionPill: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000000',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  optionPillActive: {
    borderColor: '#000000',
  },
  optionText: { fontSize: 12, fontWeight: '700', color: '#000000', flex: 1 },
  optionPrice: { fontSize: 11, fontWeight: '800', color: '#000000' },
  footer: {
    padding: 14,
    borderTopWidth: 3,
    borderColor: '#000000',
    backgroundColor: '#FFFFFF',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  totalLabel: { fontSize: 12, fontWeight: '900', color: '#000000' },
  totalPriceText: { fontSize: 18, fontWeight: '900', color: '#000000' },
  confirmBtn: {
    borderWidth: 3,
    borderColor: '#000000',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnUnpressed: {
    shadowColor: '#000000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  btnPressed: {
    transform: [{ translateX: 2 }, { translateY: 2 }],
    elevation: 0,
  },
  confirmBtnText: { fontSize: 14, fontWeight: '900' },
  manageFavHeaderBtn: {
    backgroundColor: '#FFDD00',
    borderWidth: 1.5,
    borderColor: '#000000',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  manageFavHeaderBtnText: {
    color: '#000000',
    fontSize: 10,
    fontWeight: '900',
  },
  popularContainer: {
    backgroundColor: '#FFFBEA',
    borderWidth: 1.5,
    borderColor: '#000000',
    padding: 8,
    marginBottom: 12,
  },
  popularTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#000000',
    marginBottom: 6,
  },
  popularRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  popularChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#000000',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  popularChipText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#000000',
  },
  optionDisabled: {
    opacity: 0.45,
    backgroundColor: '#EEEEEE',
  },
  soldOutBadge: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    marginLeft: 6,
  },
  soldOutText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  stockManageOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  stockManageBox: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: '#000000',
    padding: 16,
  },
  stockManageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    borderBottomWidth: 2,
    borderColor: '#000000',
    paddingBottom: 8,
  },
  stockManageTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#000000',
  },
  stockManageCloseBtn: {
    backgroundColor: '#000000',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  stockManageCloseText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  stockManageSub: {
    fontSize: 11,
    fontWeight: '700',
    color: '#555555',
    marginBottom: 12,
  },
  manageGroupTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#000000',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  manageOptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
    borderWidth: 1.5,
    borderColor: '#000000',
    marginBottom: 6,
  },
  manageOptionName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#000000',
  },
  manageStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#000000',
  },
  manageStatusText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
});
