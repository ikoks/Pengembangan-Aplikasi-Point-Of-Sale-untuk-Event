
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
      <View style={styles.rowTop}>
        <Text style={styles.itemName} numberOfLines={1}>
          {item.name.toUpperCase()} {item.isFreeBonus ? '(BONUS)' : ''}
        </Text>
        <Text style={styles.itemLineTotal}>
          {item.isFreeBonus ? 'Rp 0' : formatRp(lineTotal)}
        </Text>
      </View>

      <View style={styles.rowMiddle}>
        <Text style={styles.unitPriceText}>
          {formatRp(item.price)} / unit
        </Text>
        {!item.isFreeBonus && (
          <Pressable onPress={() => onRemove(item.id)} style={styles.trashBtn}>
            <Text style={styles.trashIcon}>🗑</Text>
          </Pressable>
        )}
      </View>

      {item.itemNotes ? (
        <Text style={styles.noteText}>📝 "{item.itemNotes}"</Text>
      ) : null}

      {!item.isFreeBonus && (
        <View style={styles.rowBottom}>
          <Pressable onPress={() => onDecrease(item.id)} style={styles.qtyControlBtn}>
            <Text style={styles.qtyControlText}>−</Text>
          </Pressable>
          <Text style={styles.qtyValueText}>{item.qty}</Text>
          <Pressable onPress={() => onIncrease(item.id)} style={styles.qtyControlBtn}>
            <Text style={styles.qtyControlText}>+</Text>
          </Pressable>
          {onUpdateNotes && (
            <Pressable
              onPress={() => {
                setNoteInput(item.itemNotes || '');
                setIsNoteModalVisible(true);
              }}
              style={styles.noteBtn}
            >
              <Text style={styles.noteBtnText}>📝</Text>
            </Pressable>
          )}
        </View>
      )}

      <View style={styles.dashedBorder} />

      <Modal visible={isNoteModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>📝 CATATAN UNTUK ITEM</Text>
            <Text style={styles.modalItemName}>{item.name}</Text>
            <TextInput
              style={styles.noteTextInput}
              placeholder="Contoh: Less sugar, extra hot..."
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
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: -0.2,
    flex: 1,
  },
  itemLineTotal: {
    fontSize: 13,
    fontWeight: '900',
    color: '#000000',
    fontFamily: 'monospace',
  },
  rowMiddle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  unitPriceText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#555555',
    fontFamily: 'monospace',
  },
  trashBtn: {
    padding: 2,
  },
  trashIcon: {
    fontSize: 16,
    color: '#000000',
  },
  rowBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 8,
  },
  qtyControlBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  qtyControlText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#000000',
  },
  qtyValueText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#000000',
    fontFamily: 'monospace',
  },
  noteBtn: {
    marginLeft: 'auto',
  },
  noteBtnText: {
    fontSize: 14,
  },
  noteText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 6,
  },
  dashedBorder: {
    height: 1,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderStyle: 'dashed',
    marginTop: 6,
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
