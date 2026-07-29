import React from 'react';
import { StyleSheet, Text, View, Pressable, Modal, ScrollView } from 'react-native';
import { StoreBrandOption } from '../types/pos';

interface StoreBranchModalProps {
  visible: boolean;
  storeOptions: StoreBrandOption[];
  selectedStore: StoreBrandOption;
  selectedBranch: string;
  onSelectStore: (store: StoreBrandOption) => void;
  onSelectBranch: (branch: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}

export const StoreBranchModal = ({
  visible,
  storeOptions,
  selectedStore,
  selectedBranch,
  onSelectStore,
  onSelectBranch,
  onConfirm,
  onClose,
}: StoreBranchModalProps) => (
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
            🏢 UBAH TOKO & CABANG
          </Text>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </Pressable>
        </View>
        <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
          <Text style={styles.modalSectionLabel}>1. PILIH BRAND TOKO</Text>
          <View style={styles.storePickerStack}>
            {storeOptions.map((store) => {
              const isSelected = selectedStore.id === store.id;
              return (
                <Pressable
                  key={store.id}
                  onPress={() => onSelectStore(store)}
                  style={[
                    styles.storeOptionCard,
                    isSelected ? styles.storeOptionSelected : styles.storeOptionUnselected,
                  ]}
                >
                  <Text style={styles.storeOptionEmoji}>{store.emoji}</Text>
                  <View style={styles.storeOptionInfo}>
                    <Text style={styles.storeOptionName}>{store.name.toUpperCase()}</Text>
                    <Text style={styles.storeOptionTagline}>{store.tagline}</Text>
                  </View>
                  {isSelected && <Text style={styles.storeOptionCheck}>✓</Text>}
                </Pressable>
              );
            })}
          </View>

          <Text style={[styles.modalSectionLabel, { marginTop: 16 }]}>2. PILIH CABANG</Text>
          <View style={styles.branchPickerGrid}>
            {selectedStore.branches.map((branch) => {
              const isSelected = selectedBranch === branch;
              return (
                <Pressable
                  key={branch}
                  onPress={() => onSelectBranch(branch)}
                  style={[
                    styles.branchPickerPill,
                    isSelected ? styles.branchPickerPillSelected : styles.branchPickerPillUnselected,
                  ]}
                >
                  <Text style={[styles.branchPickerPillText, isSelected && { color: '#FFF' }]}>
                    {branch} {isSelected ? '✓' : ''}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.storeBranchPreviewBox}>
            <Text style={styles.previewLabel}>KONFIRMASI LOKASI TERPILIH:</Text>
            <Text style={styles.previewValue}>
              {selectedStore.name} — {selectedBranch}
            </Text>
          </View>

          <View style={styles.modalActionsRow}>
            <Pressable onPress={onClose} style={styles.cancelBtnModal}>
              <Text style={styles.cancelBtnModalText}>BATAL</Text>
            </Pressable>
            <Pressable onPress={onConfirm} style={styles.confirmBtnModal}>
              <Text style={styles.confirmBtnModalText}>TERAPKAN CABANG ➔</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </View>
  </Modal>
);

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
  storePickerStack: { gap: 10 },
  storeOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 3,
    borderColor: '#000000',
  },
  storeOptionUnselected: {
    backgroundColor: '#FFFFFF',
  },
  storeOptionSelected: {
    backgroundColor: '#FFDD00',
    transform: [{ translateX: -2 }, { translateY: -2 }],
    shadowColor: '#000000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  storeOptionEmoji: { fontSize: 24, marginRight: 12 },
  storeOptionInfo: { flex: 1 },
  storeOptionName: { fontSize: 13, fontWeight: '900', color: '#000000' },
  storeOptionTagline: { fontSize: 10, fontWeight: '700', color: '#555555' },
  storeOptionCheck: { fontSize: 18, fontWeight: '900', color: '#000000' },
  branchPickerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  branchPickerPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 2.5,
    borderColor: '#000000',
  },
  branchPickerPillUnselected: {
    backgroundColor: '#FFFFFF',
  },
  branchPickerPillSelected: {
    backgroundColor: '#000000',
  },
  branchPickerPillText: { fontSize: 11, fontWeight: '800', color: '#000000' },
  storeBranchPreviewBox: {
    marginTop: 16,
    padding: 12,
    borderWidth: 3,
    borderColor: '#000000',
    backgroundColor: '#FFFBEA',
  },
  previewLabel: { fontSize: 9, fontWeight: '900', color: '#666666', letterSpacing: 0.5 },
  previewValue: { fontSize: 13, fontWeight: '900', color: '#000000', marginTop: 2 },
  modalActionsRow: { flexDirection: 'row', gap: 10, marginTop: 18 },
  cancelBtnModal: {
    flex: 1,
    height: 46,
    borderWidth: 3,
    borderColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  cancelBtnModalText: { fontSize: 12, fontWeight: '900', color: '#000000' },
  confirmBtnModal: {
    flex: 2,
    height: 46,
    borderWidth: 3,
    borderColor: '#000000',
    backgroundColor: '#FFDD00',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBtnModalText: { fontSize: 12, fontWeight: '900', color: '#000000', letterSpacing: 0.5 },
});
