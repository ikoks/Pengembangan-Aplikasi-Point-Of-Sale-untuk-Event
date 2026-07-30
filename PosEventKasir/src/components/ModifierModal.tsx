
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

  if (!item || !visible) return null;

  const toggleOption = (group: ModifierGroup, option: ModifierOption) => {
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

  const selectedModifiersList = useMemo<SelectedModifier[]>(() => {
    if (!item.modifierGroups) return [];
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

  const totalPrice = item.price + additionalPrice;

  
  const isValid = useMemo(() => {
    if (!item.modifierGroups) return true;
    for (const group of item.modifierGroups) {
      const min = group.minSelect ?? 0;
      const count = (selections[group.id] || []).length;
      if (count < min) return false;
    }
    return true;
  }, [item, selections]);

  const handleConfirm = () => {
    if (!isValid) {
      Alert.alert('⚠️ OPSI BELUM LENGKAP', 'Mohon lengkapi opsi varian yang wajib dipilih.');
      return;
    }
    onConfirm(item, selectedModifiersList);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalBox}>

          <View style={[styles.header, { backgroundColor: theme.accent }]}>
            <Text style={styles.headerEmoji}>{item.emoji}</Text>
            <View style={styles.headerTitleCol}>
              <Text style={[styles.headerTitle, { color: theme.accentText }]}>
                {item.name.toUpperCase()}
              </Text>
              <Text style={[styles.headerPrice, { color: theme.accentText }]}>
                Harga Dasar: {formatRp(item.price)}
              </Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.bodyScroll} contentContainerStyle={{ paddingBottom: 20 }}>
            {(item.modifierGroups || []).map((group) => {
              const currentSelected = selections[group.id] || [];
              const min = group.minSelect ?? 0;
              const max = group.maxSelect ?? 1;

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

                  <View style={styles.optionsList}>
                    {group.options.map((option) => {
                      const isSelected = currentSelected.some((o) => o.id === option.id);
                      return (
                        <Pressable
                          key={option.id}
                          onPress={() => toggleOption(group, option)}
                          style={[
                            styles.optionPill,
                            isSelected && [styles.optionPillActive, { backgroundColor: theme.accent }],
                          ]}
                        >
                          <Text
                            style={[
                              styles.optionText,
                              isSelected && { color: theme.accentText, fontWeight: '900' },
                            ]}
                          >
                            {isSelected ? '✓ ' : '+ '}
                            {option.name}
                          </Text>
                          {option.price > 0 ? (
                            <Text
                              style={[
                                styles.optionPrice,
                                isSelected && { color: theme.accentText, fontWeight: '900' },
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
  headerEmoji: { fontSize: 32, marginRight: 10 },
  headerTitleCol: { flex: 1 },
  headerTitle: { fontSize: 16, fontWeight: '900' },
  headerPrice: { fontSize: 12, fontWeight: '700', marginTop: 2 },
  closeBtn: {
    width: 32,
    height: 32,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  closeBtnText: { color: '#FFFFFF', fontWeight: '900', fontSize: 16 },
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
});
