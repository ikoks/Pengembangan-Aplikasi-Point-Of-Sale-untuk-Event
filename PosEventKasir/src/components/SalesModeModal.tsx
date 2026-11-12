import React from 'react';
import { StyleSheet, Text, View, Pressable, Modal, ScrollView } from 'react-native';
import { SalesModeOption } from '../types/pos';

interface SalesModeModalProps {
  visible: boolean;
  salesModeOptions: SalesModeOption[];
  currentSalesMode: string;
  activeCabang?: string;
  onSelectSalesMode: (modeLabel: string) => void;
  onClose: () => void;
}

const MODE_DESCRIPTIONS: Record<string, string> = {
  'Offline': 'Penjualan Booth / Stand Event (Harga Normal)',
  'GoFood': 'Order Online GoFood (+20% dari harga dasar)',
  'Tokopedia': 'Order Online Tokopedia (+5% dari harga dasar)',
};

export const SalesModeModal = ({
  visible,
  salesModeOptions,
  currentSalesMode,
  activeCabang = '',
  onSelectSalesMode,
  onClose,
}: SalesModeModalProps) => {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalShadow} />
        <View style={styles.modalCard}>
          <View style={[styles.modalHeader, { backgroundColor: '#000000' }]}>
            <Text style={[styles.modalHeaderText, { color: '#FFFFFF' }]}>
              🏷️ UBAH SALES MODE (DATABASE & ADMIN)
            </Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>
          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <Text style={styles.modalSectionLabel}>PILIH MODE PENJUALAN:</Text>
            <View style={styles.salesModeStack}>
              {salesModeOptions
                .filter((mode) => mode.status !== 'INACTIVE')
                .map((mode) => {
                  const isSelected = currentSalesMode.toLowerCase() === mode.id.toLowerCase();
                  const desc = MODE_DESCRIPTIONS[mode.id] || (mode.id.includes('Food') ? 'Online Delivery (+20%)' : 'Harga Standar');

                  return (
                    <Pressable
                      key={mode.id}
                      onPress={() => onSelectSalesMode(mode.id)}
                      style={[
                        styles.salesModeCard,
                        isSelected ? styles.salesModeCardSelected : styles.salesModeCardUnselected,
                      ]}
                    >
                      <Text style={styles.salesModeEmoji}>{mode.emoji}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.salesModeLabel, isSelected && { color: '#FFF' }]}>
                          {mode.label}
                        </Text>
                        <Text style={[styles.salesModeDesc, isSelected && { color: '#FFDD00' }]}>
                          {desc}
                        </Text>
                      </View>
                      {isSelected && <Text style={styles.salesModeCheck}>✓ AKTIF</Text>}
                    </Pressable>
                  );
                })}
            </View>
            <Pressable
              onPress={onClose}
              style={[styles.cancelBtnModal, { marginTop: 16, marginBottom: 16 }]}
            >
              <Text style={styles.cancelBtnModalText}>TUTUP</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalShadow: {
    position: 'absolute',
    width: '90%',
    maxWidth: 480,
    height: '82%',
    backgroundColor: '#000000',
    transform: [{ translateX: 8 }, { translateY: 8 }],
  },
  modalCard: {
    width: '90%',
    maxWidth: 480,
    backgroundColor: '#FFFFFF',
    borderWidth: 4,
    borderColor: '#000000',
    overflow: 'hidden',
    maxHeight: '85%',
  },
  modalHeader: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 4,
    borderBottomColor: '#000000',
  },
  modalHeaderText: { fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  closeBtn: {
    width: 32,
    height: 32,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  modalBody: { padding: 16 },
  modalSectionLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  salesModeStack: { gap: 10 },
  salesModeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderWidth: 3,
    borderColor: '#000000',
  },
  salesModeCardUnselected: {
    backgroundColor: '#FFFFFF',
  },
  salesModeCardSelected: {
    backgroundColor: '#1A3FBB',
  },
  salesModeEmoji: { fontSize: 20, marginRight: 12 },
  salesModeLabel: { fontSize: 13, fontWeight: '900', color: '#000000', letterSpacing: 0.5 },
  salesModeDesc: { fontSize: 10, fontWeight: '700', color: '#666666', marginTop: 2 },
  salesModeCheck: { fontSize: 11, fontWeight: '900', color: '#FFDD00' },
  cancelBtnModal: {
    height: 46,
    borderWidth: 3,
    borderColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  cancelBtnModalText: { fontSize: 12, fontWeight: '900', color: '#000000' },
});
