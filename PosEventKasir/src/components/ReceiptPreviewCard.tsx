import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, Borders } from '../theme/neoBrutalism';

interface ReceiptItem {
  name: string;
  quantity?: number;
  qty?: number;
  price: number;
  subtotal: number;
}

interface ReceiptPreviewCardProps {
  storeName?: string;
  branchName?: string;
  receiptNumber?: string;
  timestamp?: string;
  cashierName?: string;
  salesMode?: string;
  items?: ReceiptItem[];
  subtotalAmount?: number;
  taxAmount?: number;
  discountAmount?: number;
  totalAmount?: number;
  paidAmount?: number;
  changeAmount?: number;
  paymentMethod?: string;
  referenceNumber?: string;
  formatRp: (n: number) => string;
}

export const ReceiptPreviewCard = ({
  storeName,
  branchName,
  receiptNumber,
  timestamp,
  cashierName,
  salesMode,
  items = [],
  subtotalAmount = 0,
  taxAmount = 0,
  discountAmount = 0,
  totalAmount = 0,
  paidAmount = 0,
  changeAmount = 0,
  paymentMethod = 'CASH',
  referenceNumber,
  formatRp,
}: ReceiptPreviewCardProps) => (
  <View style={styles.receiptPaper}>
    <View style={styles.headerArea}>
      <Text style={styles.brandTitle}>{storeName || 'LET\'S GO GELATO'}</Text>
      <Text style={styles.branchTitle}>📍 {branchName || 'Bengawan (Bandung)'}</Text>
      <Text style={styles.dashedDivider}>- - - - - - - - - - - - - - - - - - - - - - - -</Text>
    </View>

    <View style={styles.metaSection}>
      <View style={styles.metaRow}>
        <Text style={styles.metaKey}>NO. STRUK :</Text>
        <Text style={styles.metaVal}>{receiptNumber || 'TRX-DEFAULT'}</Text>
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.metaKey}>WAKTU      :</Text>
        <Text style={styles.metaVal}>{timestamp || new Date().toLocaleString('id-ID')}</Text>
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.metaKey}>KASIR      :</Text>
        <Text style={styles.metaVal}>{cashierName || 'OPERATOR'}</Text>
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.metaKey}>SALES MODE :</Text>
        <Text style={styles.metaVal}>{salesMode || 'Dine In'}</Text>
      </View>
      <Text style={styles.dashedDivider}>- - - - - - - - - - - - - - - - - - - - - - - -</Text>
    </View>

    <View style={styles.itemsSection}>
      {items.map((item, idx) => {
        const itemQty = item.quantity ?? item.qty ?? 1;
        return (
          <View key={idx} style={styles.itemRow}>
            <Text style={styles.itemName}>{item.name}</Text>
            <View style={styles.itemCalcRow}>
              <Text style={styles.itemQtyPrice}>{itemQty} x {formatRp(item.price)}</Text>
              <Text style={styles.itemSubtotal}>{formatRp(item.subtotal)}</Text>
            </View>
          </View>
        );
      })}
      <Text style={styles.dashedDivider}>- - - - - - - - - - - - - - - - - - - - - - - -</Text>
    </View>

    <View style={styles.totalsSection}>
      <View style={styles.calcRow}>
        <Text style={styles.calcKey}>SUBTOTAL</Text>
        <Text style={styles.calcVal}>{formatRp(subtotalAmount)}</Text>
      </View>
      {discountAmount > 0 && (
        <View style={styles.calcRow}>
          <Text style={styles.calcKey}>DISKON PROMO</Text>
          <Text style={styles.calcVal}>-{formatRp(discountAmount)}</Text>
        </View>
      )}
      {taxAmount > 0 && (
        <View style={styles.calcRow}>
          <Text style={styles.calcKey}>PPN 10%</Text>
          <Text style={styles.calcVal}>{formatRp(taxAmount)}</Text>
        </View>
      )}
      <View style={styles.totalRow}>
        <Text style={styles.totalKey}>TOTAL</Text>
        <Text style={styles.totalVal}>{formatRp(totalAmount)}</Text>
      </View>
      <Text style={styles.dashedDivider}>- - - - - - - - - - - - - - - - - - - - - - - -</Text>
    </View>

    <View style={styles.paymentSection}>
      <View style={styles.calcRow}>
        <Text style={styles.calcKey}>METODE BAYAR</Text>
        <Text style={styles.calcVal}>{paymentMethod}</Text>
      </View>
      {referenceNumber ? (
        <View style={styles.calcRow}>
          <Text style={styles.calcKey}>NO. REF/TRACE</Text>
          <Text style={styles.calcVal}>{referenceNumber}</Text>
        </View>
      ) : null}
      <View style={styles.calcRow}>
        <Text style={styles.calcKey}>DIBAYAR</Text>
        <Text style={styles.calcVal}>{formatRp(paidAmount)}</Text>
      </View>
      <View style={styles.calcRow}>
        <Text style={styles.calcKey}>KEMBALIAN</Text>
        <Text style={styles.calcVal}>{formatRp(changeAmount)}</Text>
      </View>
    </View>

    <View style={styles.footerArea}>
      <Text style={styles.dashedDivider}>- - - - - - - - - - - - - - - - - - - - - - - -</Text>
      <Text style={styles.footerText}>TERIMA KASIH ATAS KUNJUNGAN ANDA!</Text>
      <Text style={styles.footerSub}>*** SIMPAN STRUK INI SEBAGAI BUKTI ***</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  receiptPaper: {
    backgroundColor: '#FFFBEA',
    borderWidth: Borders.thick,
    borderColor: Colors.black,
    padding: 16,
    marginVertical: 12,
  },
  headerArea: {
    alignItems: 'center',
    marginBottom: 8,
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.black,
    letterSpacing: 0.5,
  },
  branchTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.grayText,
    marginTop: 2,
  },
  dashedDivider: {
    color: Colors.black,
    fontSize: 10,
    fontWeight: '900',
    marginVertical: 6,
  },
  metaSection: {
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  metaKey: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.grayText,
  },
  metaVal: {
    fontSize: 10,
    fontWeight: '900',
    color: Colors.black,
  },
  itemsSection: {
    marginBottom: 6,
  },
  itemRow: {
    marginBottom: 6,
  },
  itemName: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.black,
  },
  itemCalcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  itemQtyPrice: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.grayText,
  },
  itemSubtotal: {
    fontSize: 10,
    fontWeight: '900',
    color: Colors.black,
  },
  totalsSection: {
    marginBottom: 6,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  calcKey: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.grayText,
  },
  calcVal: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.black,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 2,
  },
  totalKey: {
    fontSize: 13,
    fontWeight: '900',
    color: Colors.black,
  },
  totalVal: {
    fontSize: 13,
    fontWeight: '900',
    color: Colors.black,
  },
  paymentSection: {
    marginBottom: 6,
  },
  footerArea: {
    alignItems: 'center',
    marginTop: 4,
  },
  footerText: {
    fontSize: 10,
    fontWeight: '900',
    color: Colors.black,
    letterSpacing: 0.5,
  },
  footerSub: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.grayText,
    marginTop: 2,
  },
});
