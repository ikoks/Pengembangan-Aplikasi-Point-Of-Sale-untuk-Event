
import React, { useState, useEffect } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  ScrollView,
} from 'react-native';
import { TenantTheme } from '../types/pos';

interface OrderMetaModalProps {
  visible: boolean;
  storeBrand: string;
  salesMode: string;
  initialCustomerName?: string;
  initialCustomerEmail?: string;
  initialQueueNumber?: string;
  initialNotes?: string;
  onClose: () => void;
  onSave: (meta: { customerName: string; customerEmail: string; queueNumber: string; notes: string }) => void;
  theme: TenantTheme;
}

export const OrderMetaModal = ({
  visible,
  storeBrand,
  salesMode,
  initialCustomerName = '',
  initialCustomerEmail = '',
  initialQueueNumber = '',
  initialNotes = '',
  onClose,
  onSave,
  theme,
}: OrderMetaModalProps) => {
  const [customerName, setCustomerName] = useState(initialCustomerName);
  const [customerEmail, setCustomerEmail] = useState(initialCustomerEmail);
  const [queueNumber, setQueueNumber] = useState(initialQueueNumber);
  const [notes, setNotes] = useState(initialNotes);

  useEffect(() => {
    if (visible) {
      setCustomerName(initialCustomerName);
      setCustomerEmail(initialCustomerEmail);
      setQueueNumber(initialQueueNumber || `A-${Math.floor(Math.random() * 900 + 100)}`);
      setNotes(initialNotes);
    }
  }, [visible, initialCustomerName, initialCustomerEmail, initialQueueNumber, initialNotes]);

  if (!visible) return null;

  const isTerve = storeBrand.toLowerCase().includes('terve') || storeBrand.toLowerCase().includes('chocolate');

  const handleSave = () => {
    onSave({
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim(),
      queueNumber: queueNumber.trim(),
      notes: notes.trim(),
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalBox}>

          <View style={[styles.header, { backgroundColor: theme.accent }]}>
            <Pressable onPress={onClose} style={styles.backBtnHeader}>
              <Text style={styles.backBtnHeaderText}>← Kembali</Text>
            </Pressable>
            <Text style={[styles.headerTitle, { color: theme.accentText }]}>
              IDENTITAS PEMESAN
            </Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕ TUTUP</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.bodyScroll}>
            <Text style={styles.fieldLabel}>NOMOR ANTREAN (QUEUE NO)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Contoh: A-012"
              placeholderTextColor="#888888"
              value={queueNumber}
              onChangeText={setQueueNumber}
            />

            <Text style={styles.fieldLabel}>
              NAMA PELANGGAN / PEMESAN {isTerve ? '(DISARANKAN)' : ''}
            </Text>
            <TextInput
              style={styles.textInput}
              placeholder="Contoh: Budi Santoso"
              placeholderTextColor="#888888"
              value={customerName}
              onChangeText={setCustomerName}
            />

            <Text style={styles.fieldLabel}>
              EMAIL PELANGGAN (UNTUK STRUK DIGITAL)
            </Text>
            <TextInput
              style={styles.textInput}
              placeholder="Contoh: pelanggan@email.com"
              placeholderTextColor="#888888"
              value={customerEmail}
              onChangeText={setCustomerEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.fieldLabel}>CATATAN PESANAN DARI PELANGGAN (NOTES)</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Contoh: Tanpa sedotan / bungkus terpisah / minta es sedikit"
              placeholderTextColor="#888888"
              multiline
              numberOfLines={3}
              value={notes}
              onChangeText={setNotes}
            />
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              onPress={handleSave}
              style={({ pressed }) => [
                styles.saveBtn,
                { backgroundColor: theme.accent },
                pressed ? styles.btnPressed : styles.btnUnpressed,
              ]}
            >
              <Text style={[styles.saveBtnText, { color: theme.accentText }]}>
                SIMPAN IDENTITAS ➔
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
    justifyContent: 'center',
    padding: 16,
  },
  modalBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 4,
    borderColor: '#000000',
    borderRadius: 12,
    overflow: 'hidden',
    maxHeight: '80%',
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
  backBtnHeader: {
    backgroundColor: '#000000',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  backBtnHeaderText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  headerTitle: { fontSize: 14, fontWeight: '900' },
  closeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
  },
  closeBtnText: { color: '#FFFFFF', fontWeight: '900', fontSize: 12 },
  bodyScroll: { padding: 16 },
  fieldLabel: { fontSize: 11, fontWeight: '900', color: '#000000', marginBottom: 6 },
  textInput: {
    borderWidth: 2.5,
    borderColor: '#000000',
    backgroundColor: '#FAF3EC',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 14,
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
  },
  footer: {
    padding: 14,
    borderTopWidth: 3,
    borderColor: '#000000',
    backgroundColor: '#FFFFFF',
  },
  saveBtn: {
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
  saveBtnText: { fontSize: 13, fontWeight: '900' },
});
