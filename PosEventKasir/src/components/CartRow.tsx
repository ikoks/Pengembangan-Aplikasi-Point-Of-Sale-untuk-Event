
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

  return (
    <View style={[styles.cartRow, item.isFreeBonus && styles.freeBonusRow]}>
      <View style={styles.cartRowInfo}>
        <Text style={styles.cartItemEmoji}>{item.emoji || '📦'}</Text>
        <View style={styles.cartItemDetail}>
          <Text style={styles.cartItemName} numberOfLines={1}>
            {item.name} {item.isFreeBonus ? '(BONUS)' : ''}
          </Text>

          {item.selectedModifiers && item.selectedModifiers.length > 0 ? (
            <Text style={styles.modifierSubtext} numberOfLines={2}>
              🔹 {item.selectedModifiers.map((m) => m.optionName).join(', ')}
            </Text>
          ) : null}

          {item.itemNotes ? (
            <Text style={styles.noteSubtext} numberOfLines={2}>
              📝 Catatan: "{item.itemNotes}"
            </Text>
          ) : null}

          <Text style={[styles.cartItemPrice, item.isFreeBonus && styles.freeBonusText]}>
            {item.isFreeBonus ? 'GRATIS Rp0' : formatRp(item.price)}
          </Text>
        </View>
      </View>

      {!item.isFreeBonus && (
        <View style={styles.cartRowControls}>

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

      <Modal visible={isNoteModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>📝 CATATAN UNTUK ITEM</Text>
            <Text style={styles.modalItemName}>{item.name}</Text>
            <TextInput
              style={styles.noteTextInput}
              placeholder="Contoh: Less sugar, extra hot, softcopy via email..."
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
                style={[styles.modalSaveBtn, { backgroundColor: theme.accent }]}
              >
                <Text style={[styles.modalSaveText, { color: theme.accentText }]}>
                  SIMPAN CATATAN
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

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
  modifierSubtext: { fontSize: 10, fontWeight: '700', color: '#1A3FBB', marginTop: 1 },
  noteSubtext: { fontSize: 10, fontWeight: '700', color: '#D84315', marginTop: 1 },
  cartItemPrice: { fontSize: 11, fontWeight: '700', color: '#555555', marginTop: 1 },
  cartRowControls: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  noteBtn: {
    width: 28,
    height: 28,
    borderWidth: 2,
    borderColor: '#000000',
    backgroundColor: '#FFF9C4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 2,
  },
  noteBtnText: { fontSize: 12 },
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
    borderWidth: 3.5,
    borderColor: '#000000',
    padding: 16,
    borderRadius: 8,
  },
  modalTitle: { fontSize: 13, fontWeight: '900', color: '#000000' },
  modalItemName: { fontSize: 11, fontWeight: '700', color: '#666666', marginBottom: 10 },
  noteTextInput: {
    borderWidth: 2,
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
    borderWidth: 2,
    borderColor: '#000000',
    backgroundColor: '#EEEEEE',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  modalCancelText: { fontSize: 11, fontWeight: '900', color: '#000000' },
  modalSaveBtn: {
    borderWidth: 2,
    borderColor: '#000000',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  modalSaveText: { fontSize: 11, fontWeight: '900' },
});
