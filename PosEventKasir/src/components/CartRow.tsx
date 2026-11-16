
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  TextInput,
  Modal,
} from 'react-native';
import { CartItemModel } from '../services/cartService';
import { TenantTheme } from '../types/pos';
import { formatRp } from '../constants/storeConfig';

interface CartRowProps {
  key?: string | number;
  item: CartItemModel & {
    selectedModifiers?: Array<{ optionName: string; price: number }>;
    itemNotes?: string;
  };
  theme: TenantTheme;
  onIncrease: (id: string) => void;
  onDecrease: (id: string) => void;
  onRemove: (id: string) => void;
  onUpdateNotes?: (id: string, notes: string) => void;
}

export const CartRow = ({
  item,
  theme,
  onIncrease,
  onDecrease,
  onRemove,
  onUpdateNotes,
}: CartRowProps) => {
  const [isNoteModalVisible, setIsNoteModalVisible] = useState(false);
  const [noteInput, setNoteInput] = useState(item.itemNotes || '');

  const handleSaveNote = () => {
    if (onUpdateNotes) {
      onUpdateNotes(item.id, noteInput.trim());
    }
    setIsNoteModalVisible(false);
  };

  const lineTotal = item.price * item.qty;

  return (
    <View style={styles.container}>
      {/* Baris Atas: Nama Produk & Total Baris */}
      <View style={styles.rowTop}>
        <View style={styles.itemTitleContainer}>
          <Text style={styles.itemName} numberOfLines={2}>
            {item.name.toUpperCase()} {item.isFreeBonus ? '(BONUS)' : ''}
          </Text>
          <Text style={styles.unitPriceText}>
            @ {formatRp(item.price)}
          </Text>
        </View>
        <Text style={styles.itemLineTotal}>
          {item.isFreeBonus ? 'Rp 0' : formatRp(lineTotal)}
        </Text>
      </View>

      {/* Catatan Item jika ada */}
      {item.itemNotes ? (
        <View style={styles.noteBadgeContainer}>
          <Text style={styles.noteText}>📝 "{item.itemNotes}"</Text>
        </View>
      ) : null}

      {/* Baris Kontrol: Pengatur Qty (+/-) & Tombol Hapus per Item */}
      {!item.isFreeBonus && (
        <View style={styles.rowControls}>
          <View style={styles.qtyControlGroup}>
            <Pressable
              onPress={() => onDecrease(item.id)}
              style={({ pressed }) => [styles.qtyControlBtn, pressed && styles.qtyControlBtnPressed]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.qtyControlText}>−</Text>
            </Pressable>

            <View style={styles.qtyValueWrapper}>
              <Text style={styles.qtyValueText}>{item.qty}</Text>
            </View>

            <Pressable
              onPress={() => onIncrease(item.id)}
              style={({ pressed }) => [styles.qtyControlBtn, pressed && styles.qtyControlBtnPressed]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.qtyControlText}>+</Text>
            </Pressable>
          </View>

          <View style={styles.actionButtonsRight}>
            {onUpdateNotes && (
              <Pressable
                onPress={() => {
                  setNoteInput(item.itemNotes || '');
                  setIsNoteModalVisible(true);
                }}
                style={styles.noteActionBtn}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Text style={styles.noteActionText}>📝 Note</Text>
              </Pressable>
            )}

            <Pressable
              onPress={() => onRemove(item.id)}
              style={({ pressed }) => [styles.deleteItemBtn, pressed && styles.deleteItemBtnPressed]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.deleteItemIcon}>🗑️</Text>
              <Text style={styles.deleteItemText}>HAPUS</Text>
            </Pressable>
          </View>
        </View>
      )}

      <View style={styles.divider} />

      {/* Modal Tambah / Edit Catatan Item */}
      <Modal visible={isNoteModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>📝 CATATAN UNTUK ITEM</Text>
            <Text style={styles.modalItemName}>{item.name}</Text>
            <TextInput
              style={styles.noteTextInput}
              placeholder="Contoh: Kurang manis, tanpa es, ekstra pedas..."
              placeholderTextColor="#888888"
              value={noteInput}
              onChangeText={setNoteInput}
              autoFocus
            />
            <View style={styles.modalBtnRow}>
              <Pressable
                onPress={() => setIsNoteModalVisible(false)}
                style={styles.modalCancelBtn}
              >
                <Text style={styles.modalCancelText}>BATAL</Text>
              </Pressable>
              <Pressable
                onPress={handleSaveNote}
                style={[styles.modalSaveBtn, { backgroundColor: '#000000' }]}
              >
                <Text style={styles.modalSaveText}>SIMPAN CATATAN</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  itemTitleContainer: {
    flex: 1,
    paddingRight: 10,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '900',
    color: '#000000',
    lineHeight: 18,
  },
  unitPriceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
    marginTop: 2,
    fontFamily: 'monospace',
  },
  itemLineTotal: {
    fontSize: 14,
    fontWeight: '900',
    color: '#000000',
    fontFamily: 'monospace',
    textAlign: 'right',
  },
  noteBadgeContainer: {
    backgroundColor: '#FFFBEA',
    borderWidth: 1,
    borderColor: '#E6D7A8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  noteText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#5D4037',
  },
  rowControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 4,
  },
  qtyControlGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#000000',
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  qtyControlBtn: {
    width: 34,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  qtyControlBtnPressed: {
    backgroundColor: '#DDDDDD',
  },
  qtyControlText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#000000',
    lineHeight: 20,
  },
  qtyValueWrapper: {
    minWidth: 36,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#000000',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 4,
  },
  qtyValueText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#000000',
    fontFamily: 'monospace',
  },
  actionButtonsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  noteActionBtn: {
    borderWidth: 1,
    borderColor: '#888888',
    backgroundColor: '#F9F9F9',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
  },
  noteActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#333333',
  },
  deleteItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#D32F2F',
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  deleteItemBtnPressed: {
    backgroundColor: '#FFCDD2',
  },
  deleteItemIcon: {
    fontSize: 12,
  },
  deleteItemText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#D32F2F',
    letterSpacing: 0.3,
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginTop: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 2.5,
    borderColor: '#000000',
    padding: 16,
    borderRadius: 10,
  },
  modalTitle: { fontSize: 13, fontWeight: '900', color: '#000000' },
  modalItemName: { fontSize: 11, fontWeight: '700', color: '#666666', marginBottom: 10 },
  noteTextInput: {
    borderWidth: 1.5,
    borderColor: '#000000',
    backgroundColor: '#FAF3EC',
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 12,
  },
  modalBtnRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  modalCancelBtn: {
    borderWidth: 1.5,
    borderColor: '#000000',
    backgroundColor: '#EEEEEE',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  modalCancelText: { fontSize: 11, fontWeight: '900', color: '#000000' },
  modalSaveBtn: {
    borderWidth: 1.5,
    borderColor: '#000000',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  modalSaveText: { fontSize: 11, fontWeight: '900', color: '#FFFFFF' },
});
