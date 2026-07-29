import React from 'react';
import { StyleSheet, Text, View, Pressable, Modal, ScrollView, ActivityIndicator } from 'react-native';
import { BluetoothDevice } from '../services/bluetoothService';
import { Colors, Borders, Shadows } from '../theme/neoBrutalism';

interface BluetoothPrinterModalProps {
  visible: boolean;
  devices: BluetoothDevice[];
  isScanning: boolean;
  connectedDevice: BluetoothDevice | null;
  onScan: () => void;
  onConnect: (device: BluetoothDevice) => void;
  onDisconnect: () => void;
  onClose: () => void;
}

export const BluetoothPrinterModal = ({
  visible,
  devices,
  isScanning,
  connectedDevice,
  onScan,
  onConnect,
  onDisconnect,
  onClose,
}: BluetoothPrinterModalProps) => (
  <Modal
    transparent
    visible={visible}
    animationType="fade"
    onRequestClose={onClose}
  >
    <View style={styles.modalOverlay}>
      <View style={styles.modalShadow} />
      <View style={styles.modalCard}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalHeaderText}>🖨️ KONEKSI PRINTER BLUETOOTH</Text>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </Pressable>
        </View>

        <View style={styles.modalBody}>
          {connectedDevice ? (
            <View style={styles.connectedCard}>
              <Text style={styles.connectedTitle}>PRINTER TERHUBUNG:</Text>
              <Text style={styles.connectedName}>{connectedDevice.name}</Text>
              <Text style={styles.connectedAddress}>{connectedDevice.id}</Text>

              <Pressable
                onPress={onDisconnect}
                style={({ pressed }) => [
                  styles.disconnectBtn,
                  pressed ? Shadows.cardPressed : Shadows.cardUnpressed,
                ]}
              >
                <Text style={styles.disconnectBtnText}>⚡ PUTUSKAN PRINTER</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.scanHeaderRow}>
              <Text style={styles.sectionLabel}>PERANGKAT BLUETOOTH DITEMUKAN:</Text>
              <Pressable
                disabled={isScanning}
                onPress={onScan}
                style={({ pressed }) => [
                  styles.scanBtn,
                  isScanning ? styles.scanBtnDisabled : (pressed ? Shadows.cardPressed : Shadows.cardUnpressed),
                ]}
              >
                {isScanning ? (
                  <ActivityIndicator color={Colors.black} size="small" />
                ) : (
                  <Text style={styles.scanBtnText}>🔄 CARI PRINTER</Text>
                )}
              </Pressable>
            </View>
          )}

          <ScrollView style={styles.deviceList} showsVerticalScrollIndicator={false}>
            {devices.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>Tidak ada printer ditemukan.</Text>
                <Text style={styles.emptySub}>Tekan tombol CARI PRINTER di atas untuk memindai.</Text>
              </View>
            ) : (
              devices.map((device) => {
                const isConnected = connectedDevice?.id === device.id;
                return (
                  <Pressable
                    key={device.id}
                    onPress={() => onConnect(device)}
                    style={({ pressed }) => [
                      styles.deviceCard,
                      isConnected ? styles.deviceCardConnected : styles.deviceCardNormal,
                      pressed ? Shadows.cardPressed : Shadows.cardUnpressed,
                    ]}
                  >
                    <Text style={styles.deviceIcon}>🖨️</Text>
                    <View style={styles.deviceInfo}>
                      <Text style={styles.deviceName}>{device.name || 'Printer Bluetooth'}</Text>
                      <Text style={styles.deviceAddress}>{device.id}</Text>
                    </View>
                    {isConnected ? (
                      <Text style={styles.connectedBadgeText}>✅ AKTIF</Text>
                    ) : (
                      <Text style={styles.connectActionText}>HUBUNGKAN ➔</Text>
                    )}
                  </Pressable>
                );
              })
            )}
          </ScrollView>

          <Pressable onPress={onClose} style={styles.modalCloseFooterBtn}>
            <Text style={styles.modalCloseFooterBtnText}>TUTUP</Text>
          </Pressable>
        </View>
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalShadow: {
    position: 'absolute',
    width: '90%',
    maxWidth: 480,
    height: '80%',
    backgroundColor: Colors.black,
    transform: [{ translateX: 8 }, { translateY: 8 }],
  },
  modalCard: {
    width: '90%',
    maxWidth: 480,
    backgroundColor: Colors.white,
    borderWidth: Borders.thick,
    borderColor: Borders.borderColor,
    overflow: 'hidden',
    maxHeight: '82%',
  },
  modalHeader: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: Borders.thick,
    borderBottomColor: Borders.borderColor,
    backgroundColor: Colors.black,
  },
  modalHeaderText: {
    fontSize: 12,
    fontWeight: '900',
    color: Colors.white,
    letterSpacing: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderWidth: Borders.thin,
    borderColor: Colors.white,
    backgroundColor: Colors.red,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: Colors.white,
  },
  modalBody: {
    padding: 16,
    flex: 1,
  },
  connectedCard: {
    backgroundColor: Colors.cyan,
    borderWidth: Borders.medium,
    borderColor: Colors.black,
    padding: 12,
    marginBottom: 16,
  },
  connectedTitle: {
    fontSize: 9,
    fontWeight: '900',
    color: Colors.black,
    letterSpacing: 0.5,
  },
  connectedName: {
    fontSize: 14,
    fontWeight: '900',
    color: Colors.black,
    marginTop: 2,
  },
  connectedAddress: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.grayText,
    marginTop: 1,
  },
  disconnectBtn: {
    marginTop: 10,
    borderWidth: Borders.medium,
    borderColor: Colors.black,
    backgroundColor: Colors.red,
    paddingVertical: 8,
    alignItems: 'center',
  },
  disconnectBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: Colors.white,
  },
  scanHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: Colors.black,
    letterSpacing: 0.5,
  },
  scanBtn: {
    borderWidth: Borders.medium,
    borderColor: Colors.black,
    backgroundColor: Colors.yellow,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  scanBtnDisabled: {
    backgroundColor: Colors.grayLocked,
  },
  scanBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: Colors.black,
  },
  deviceList: {
    flex: 1,
    marginBottom: 12,
  },
  emptyBox: {
    borderWidth: Borders.medium,
    borderColor: Colors.black,
    borderStyle: 'dashed',
    padding: 16,
    alignItems: 'center',
    backgroundColor: Colors.grayBg,
  },
  emptyText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.grayText,
  },
  emptySub: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.grayText,
    marginTop: 2,
  },
  deviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: Borders.medium,
    borderColor: Colors.black,
    marginBottom: 8,
  },
  deviceCardNormal: {
    backgroundColor: Colors.white,
  },
  deviceCardConnected: {
    backgroundColor: Colors.green,
  },
  deviceIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 12,
    fontWeight: '900',
    color: Colors.black,
  },
  deviceAddress: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.grayText,
  },
  connectedBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: Colors.black,
  },
  connectActionText: {
    fontSize: 10,
    fontWeight: '900',
    color: Colors.black,
  },
  modalCloseFooterBtn: {
    height: 44,
    borderWidth: Borders.medium,
    borderColor: Colors.black,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseFooterBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: Colors.black,
  },
});
