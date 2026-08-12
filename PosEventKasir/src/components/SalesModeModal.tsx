import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable, Modal, Alert, ScrollView } from 'react-native';
import { SalesModeOption } from '../types/pos';

interface SalesModeModalProps {
  visible: boolean;
  salesModeOptions: SalesModeOption[];
  currentSalesMode: string;
  activeCabang?: string;
  onSelectSalesMode: (modeLabel: string) => void;
  onClose: () => void;
}

const ONLINE_PLATFORMS = [
  { id: 'GoFood', label: '🛵 GOJEK / GOFOOD', emoji: '🟢' },
  { id: 'GrabFood', label: '🛵 GRAB / GRABFOOD', emoji: '🟢' },
  { id: 'ShopeeFood', label: '🛵 SHOPEE / SHOPEEFOOD', emoji: '🟠' },
  { id: 'Tokopedia', label: '🛍️ TOKOPEDIA', emoji: '🟢' },
  { id: 'TikTok', label: '📱 TIKTOK SHOP', emoji: '🔵' },
  { id: 'Maxim', label: '📦 MAXIM / COURIER LAINNYA', emoji: '🟡' },
];

export const SalesModeModal = ({
  visible,
  salesModeOptions,
  currentSalesMode,
  activeCabang = '',
  onSelectSalesMode,
  onClose,
}: SalesModeModalProps) => {
  const [showPlatformDropdown, setShowPlatformDropdown] = useState(true);

  const handleSelectModeCard = (modeId: string) => {
    if (modeId === 'Online Shop' || modeId.toLowerCase().includes('online')) {
      setShowPlatformDropdown(true);
    } else {
      setShowPlatformDropdown(false);
      onSelectSalesMode(modeId);
    }
  };

  const handleSelectPlatform = (platformLabel: string) => {
    setShowPlatformDropdown(true);
    onSelectSalesMode(`Online Shop (${platformLabel})`);
  };

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
              🏷️ UBAH SALES MODE
            </Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>
          <ScrollView style={styles.modalBody}>
            <Text style={styles.modalSectionLabel}>PILIH MODE PENJUALAN:</Text>
            <View style={styles.salesModeStack}>
              {salesModeOptions
                .filter((mode) => mode.status !== 'INACTIVE')
                .map((mode) => {
                  const isOnlineShop = mode.id === 'Online Shop';
                  const isSelected =
                    currentSalesMode.toLowerCase() === mode.id.toLowerCase() ||
                    (isOnlineShop && currentSalesMode.toLowerCase().startsWith('online shop'));

                  return (
                    <View key={mode.id}>
                      <Pressable
                        onPress={() => handleSelectModeCard(mode.id)}
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
                          {isOnlineShop && (
                            <Text style={{ fontSize: 10, color: isSelected ? '#FFDD00' : '#666', fontWeight: '700' }}>
                              (Gojek, Grab, Shopee, Tokopedia, TikTok Shop)
                            </Text>
                          )}
                        </View>
                        {isSelected && <Text style={styles.salesModeCheck}>✓ AKTIF</Text>}
                        {isOnlineShop && (
                          <Text style={{ fontSize: 12, color: isSelected ? '#FFF' : '#000', fontWeight: '900', marginLeft: 6 }}>
                            {showPlatformDropdown ? '▲' : '▼'}
                          </Text>
                        )}
                      </Pressable>

                      {/* Dropdown Platform Online Shop */}
                      {isOnlineShop && (showPlatformDropdown || isSelected) && (
                        <View style={styles.dropdownContainer}>
                          <Text style={styles.dropdownTitle}>PILIH PLATFORM E-COMMERCE / OJEK ONLINE:</Text>
                          {ONLINE_PLATFORMS.map((plat) => {
                            const isPlatSelected = currentSalesMode.includes(plat.id);
                            return (
                              <Pressable
                                key={plat.id}
                                onPress={() => handleSelectPlatform(plat.id)}
                                style={[
                                  styles.dropdownItem,
                                  isPlatSelected && styles.dropdownItemSelected,
                                ]}
                              >
                                <Text style={styles.dropdownEmoji}>{plat.emoji}</Text>
                                <Text
                                  style={[
                                    styles.dropdownItemText,
                                    isPlatSelected && styles.dropdownItemTextSelected,
                                  ]}
                                >
                                  {plat.label}
                                </Text>
                                {isPlatSelected && (
                                  <Text style={styles.dropdownCheck}>✓ TERPILIH</Text>
                                )}
                              </Pressable>
                            );
                          })}
                        </View>
                      )}
                    </View>
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
  salesModeCheck: { fontSize: 11, fontWeight: '900', color: '#FFDD00' },
  dropdownContainer: {
    backgroundColor: '#FAF3EC',
    borderWidth: 2.5,
    borderColor: '#000000',
    marginTop: 6,
    marginBottom: 8,
    padding: 10,
    gap: 6,
  },
  dropdownTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: '#000000',
    marginBottom: 4,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#000000',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  dropdownItemSelected: {
    backgroundColor: '#FFDD00',
  },
  dropdownEmoji: {
    fontSize: 14,
    marginRight: 8,
  },
  dropdownItemText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '900',
    color: '#000000',
  },
  dropdownItemTextSelected: {
    color: '#000000',
  },
  dropdownCheck: {
    fontSize: 10,
    fontWeight: '900',
    color: '#000000',
  },
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
