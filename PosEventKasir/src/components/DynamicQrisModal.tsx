import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  generateDynamicQrisPayload,
  checkQrisPaymentStatus,
  QrisDataPayload,
} from '../services/qrisGeneratorService';
import { formatRp } from '../utils/formatters';
import { Colors, Borders, Shadows } from '../theme/neoBrutalism';

export interface DynamicQrisModalProps {
  visible: boolean;
  totalAmount: number;
  merchantName?: string;
  onClose: () => void;
  onSuccessPayment: (method: string, referenceNumber: string) => void;
}

export function DynamicQrisModal({
  visible,
  totalAmount,
  merchantName = "Let's Go Gelato - POS Event",
  onClose,
  onSuccessPayment,
}: DynamicQrisModalProps) {
  const [qrisData, setQrisData] = useState<QrisDataPayload | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(300);
  const [paymentStatus, setPaymentStatus] = useState<'PENDING' | 'PAID' | 'EXPIRED'>('PENDING');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  useEffect(() => {
    if (visible && totalAmount > 0) {
      const payload = generateDynamicQrisPayload(merchantName, totalAmount);
      setQrisData(payload);
      setSecondsRemaining(payload.expiresInSeconds);
      setPaymentStatus('PENDING');
      setIsVerifying(false);
    }
  }, [visible, totalAmount, merchantName]);

  useEffect(() => {
    let timer: any = null;
    if (visible && paymentStatus === 'PENDING' && secondsRemaining > 0) {
      timer = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            setPaymentStatus('EXPIRED');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [visible, paymentStatus, secondsRemaining]);

  useEffect(() => {
    let pollInterval: any = null;
    if (visible && qrisData && paymentStatus === 'PENDING') {
      pollInterval = setInterval(async () => {
        const res = await checkQrisPaymentStatus(qrisData.qrisRefId);
        if (res.status === 'PAID') {
          setPaymentStatus('PAID');
          if (pollInterval) clearInterval(pollInterval);
          onSuccessPayment('QRIS_DINAMIS', qrisData.qrisRefId);
        }
      }, 3000);
    }
    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [visible, qrisData, paymentStatus, onSuccessPayment]);

  const handleSimulateSuccess = () => {
    if (!qrisData) return;
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setPaymentStatus('PAID');
      onSuccessPayment('QRIS_DINAMIS', qrisData.qrisRefId);
    }, 600);
  };

  const formatTime = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!visible || !qrisData) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.shadowBackplate} />
        <View style={styles.modalCard}>
          <View style={styles.modalHeaderBar}>
            <Text style={styles.headerTitleText}>⚡ DYNAMIC QRIS GENERATOR</Text>
            <Pressable onPress={onClose} style={styles.closeHeaderBtn}>
              <Text style={styles.closeHeaderBtnText}>✕</Text>
            </Pressable>
          </View>

          <View style={styles.modalBody}>
            <View style={styles.qrisHeaderBadge}>
              <Text style={styles.qrisBrandText}>QRIS</Text>
              <Text style={styles.qrisSubBrand}>GPN NATIONAL QR CODE</Text>
            </View>

            <Text style={styles.merchantNameText}>{qrisData.merchantName.toUpperCase()}</Text>
            <Text style={styles.refIdText}>ID: {qrisData.qrisRefId}</Text>

            <View style={styles.qrMatrixContainer}>
              <View style={styles.qrCornerTopLeft} />
              <View style={styles.qrCornerTopRight} />
              <View style={styles.qrCornerBottomLeft} />

              <View style={styles.qrInnerPattern}>
                <View style={styles.qrGridRow}>
                  <View style={styles.qrBlockBlack} />
                  <View style={styles.qrBlockWhite} />
                  <View style={styles.qrBlockBlack} />
                  <View style={styles.qrBlockBlack} />
                  <View style={styles.qrBlockWhite} />
                </View>
                <View style={styles.qrGridRow}>
                  <View style={styles.qrBlockWhite} />
                  <View style={styles.qrBlockBlack} />
                  <View style={styles.qrBlockWhite} />
                  <View style={styles.qrBlockBlack} />
                  <View style={styles.qrBlockBlack} />
                </View>
                <View style={styles.qrGridRow}>
                  <View style={styles.qrBlockBlack} />
                  <View style={styles.qrBlockBlack} />
                  <View style={styles.qrBlockWhite} />
                  <View style={styles.qrBlockWhite} />
                  <View style={styles.qrBlockBlack} />
                </View>
              </View>
            </View>

            <View style={styles.amountDisplayCard}>
              <Text style={styles.amountLabelText}>TOTAL PEMBAYARAN:</Text>
              <Text style={styles.amountValueText}>{formatRp(totalAmount)}</Text>
            </View>

            <View style={styles.timerRow}>
              <Text style={styles.timerLabel}>BERLAKU DALAM:</Text>
              <Text style={[styles.timerValue, secondsRemaining < 60 && { color: Colors.red }]}>
                ⏳ {formatTime(secondsRemaining)}
              </Text>
            </View>

            {paymentStatus === 'PAID' ? (
              <View style={styles.statusSuccessCard}>
                <Text style={styles.statusSuccessText}>✅ PEMBAYARAN BERHASIL (PAID)</Text>
              </View>
            ) : paymentStatus === 'EXPIRED' ? (
              <View style={styles.statusExpiredCard}>
                <Text style={styles.statusExpiredText}>⏰ QRIS KADALUARSA (EXPIRED)</Text>
              </View>
            ) : (
              <Pressable
                disabled={isVerifying}
                onPress={handleSimulateSuccess}
                style={({ pressed }) => [
                  styles.simulateBtn,
                  pressed ? Shadows.cardPressed : Shadows.cardUnpressed,
                ]}
              >
                {isVerifying ? (
                  <ActivityIndicator color={Colors.black} />
                ) : (
                  <Text style={styles.simulateBtnText}>⚡ SIMULASI BAYAR SUKSES (TESTING) ➔</Text>
                )}
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  shadowBackplate: {
    position: 'absolute',
    width: '92%',
    maxWidth: 380,
    height: 520,
    backgroundColor: Colors.black,
    borderWidth: Borders.thick,
    borderColor: Colors.black,
    transform: [{ translateX: 8 }, { translateY: 8 }],
  },
  modalCard: {
    width: '92%',
    maxWidth: 380,
    backgroundColor: Colors.white,
    borderWidth: Borders.thick,
    borderColor: Colors.black,
    overflow: 'hidden',
  },
  modalHeaderBar: {
    height: 44,
    backgroundColor: Colors.black,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
  },
  headerTitleText: {
    color: Colors.yellow,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  closeHeaderBtn: {
    width: 28,
    height: 28,
    backgroundColor: Colors.red,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.white,
  },
  closeHeaderBtnText: {
    color: Colors.white,
    fontWeight: '900',
    fontSize: 12,
  },
  modalBody: {
    padding: 20,
    alignItems: 'center',
  },
  qrisHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.red,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: Borders.medium,
    borderColor: Colors.black,
    marginBottom: 8,
  },
  qrisBrandText: {
    color: Colors.white,
    fontWeight: '900',
    fontSize: 14,
    marginRight: 6,
  },
  qrisSubBrand: {
    color: Colors.white,
    fontWeight: '800',
    fontSize: 9,
  },
  merchantNameText: {
    fontSize: 13,
    fontWeight: '900',
    color: Colors.black,
    marginTop: 4,
  },
  refIdText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.grayText,
    marginBottom: 14,
  },
  qrMatrixContainer: {
    width: 170,
    height: 170,
    backgroundColor: Colors.white,
    borderWidth: Borders.thick,
    borderColor: Colors.black,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  qrCornerTopLeft: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 34,
    height: 34,
    backgroundColor: Colors.black,
    borderWidth: 4,
    borderColor: Colors.white,
  },
  qrCornerTopRight: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 34,
    height: 34,
    backgroundColor: Colors.black,
    borderWidth: 4,
    borderColor: Colors.white,
  },
  qrCornerBottomLeft: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    width: 34,
    height: 34,
    backgroundColor: Colors.black,
    borderWidth: 4,
    borderColor: Colors.white,
  },
  qrInnerPattern: {
    width: 70,
    height: 70,
    justifyContent: 'space-around',
  },
  qrGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  qrBlockBlack: {
    width: 12,
    height: 12,
    backgroundColor: Colors.black,
  },
  qrBlockWhite: {
    width: 12,
    height: 12,
    backgroundColor: Colors.white,
  },
  amountDisplayCard: {
    width: '100%',
    backgroundColor: Colors.grayBg,
    borderWidth: Borders.medium,
    borderColor: Colors.black,
    padding: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  amountLabelText: {
    fontSize: 9,
    fontWeight: '900',
    color: Colors.grayText,
  },
  amountValueText: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.black,
    marginTop: 2,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  timerLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: Colors.grayText,
    marginRight: 6,
  },
  timerValue: {
    fontSize: 12,
    fontWeight: '900',
    color: Colors.black,
  },
  simulateBtn: {
    width: '100%',
    height: 48,
    backgroundColor: Colors.yellow,
    borderWidth: Borders.thick,
    borderColor: Colors.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
  simulateBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: Colors.black,
    letterSpacing: 0.5,
  },
  statusSuccessCard: {
    width: '100%',
    height: 44,
    backgroundColor: Colors.green,
    borderWidth: Borders.thick,
    borderColor: Colors.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusSuccessText: {
    fontSize: 11,
    fontWeight: '900',
    color: Colors.white,
  },
  statusExpiredCard: {
    width: '100%',
    height: 44,
    backgroundColor: Colors.red,
    borderWidth: Borders.thick,
    borderColor: Colors.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusExpiredText: {
    fontSize: 11,
    fontWeight: '900',
    color: Colors.white,
  },
});
