import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  Alert,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { getDBConnection, saveBookingAppointment } from '../database/sqlite';
import { formatRp } from '../utils/formatters';

export interface BookingCalendarScreenProps {
  activeCabang?: string;
  activeUser?: string;
  onClose?: () => void;
}

const TIME_SLOTS = [
  '10:00 - 11:00',
  '11:00 - 12:00',
  '13:00 - 14:00',
  '14:00 - 15:00',
  '15:00 - 16:00',
  '16:00 - 17:00',
  '18:00 - 19:00',
  '19:00 - 20:00',
];

export default function BookingCalendarScreen({
  activeCabang = 'Papyrus Photo - Bengawan',
  onClose,
}: BookingCalendarScreenProps) {
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [bookingDate, setBookingDate] = useState('2026-08-02');
  const [selectedSlot, setSelectedSlot] = useState(TIME_SLOTS[0]);
  const [dpAmount, setDpAmount] = useState('50000');
  const [isLoading, setIsLoading] = useState(false);

  const handleSaveBooking = async () => {
    if (!customerName.trim() || !phone.trim()) {
      Alert.alert('💥 DATA TIDAK LENGKAP', 'Nama pelanggan dan nomor telepon wajib diisi!');
      return;
    }

    setIsLoading(true);

    try {
      const db = await getDBConnection();
      await saveBookingAppointment(db, {
        idCabang: activeCabang,
        customerName: customerName.trim(),
        phone: phone.trim(),
        bookingDate,
        timeSlot: selectedSlot,
        dpAmount: parseFloat(dpAmount || '0'),
        status: 'CONFIRMED',
      });

      setIsLoading(false);
      Alert.alert('✅ RESERVASI TERSIMPAN', `Booking studio/meja atas nama ${customerName} berhasil dicatat!`);
      setCustomerName('');
      setPhone('');
      if (onClose) onClose();
    } catch (err) {
      setIsLoading(false);
      Alert.alert('❌ GAGAL SIMPAN', 'Gagal menyimpan reservasi ke SQLite database.');
    }
  };

  return (
    <SafeAreaView style={s.root}>
      <View style={s.header}>
        <Text style={s.headerTitle}>📅 RESERVASI & BOOKING CALENDAR</Text>
        {onClose && (
          <Pressable onPress={onClose} style={s.closeBtn}>
            <Text style={s.closeBtnText}>✕</Text>
          </Pressable>
        )}
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.cardWrapper}>
          <View style={s.cardShadow} />
          <View style={s.cardBody}>
            <Text style={s.cardTitle}>FORM RESERVASI JADWAL / STUDIO PHOTO</Text>

            {/* Nama Pelanggan */}
            <Text style={s.label}>1. NAMA PELANGGAN</Text>
            <TextInput
              style={s.input}
              placeholder="Contoh: Budi Santoso"
              placeholderTextColor="#888"
              value={customerName}
              onChangeText={setCustomerName}
            />

            {/* Phone */}
            <Text style={s.label}>2. NO. WHATSAPP / TELEPON</Text>
            <TextInput
              style={s.input}
              placeholder="081234567890"
              placeholderTextColor="#888"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />

            {/* Tanggal Booking */}
            <Text style={s.label}>3. TANGGAL RESERVASI (YYYY-MM-DD)</Text>
            <TextInput
              style={s.input}
              placeholder="2026-08-02"
              placeholderTextColor="#888"
              value={bookingDate}
              onChangeText={setBookingDate}
            />

            {/* Slot Waktu */}
            <Text style={s.label}>4. PILIH SLOT JAM</Text>
            <View style={s.slotGrid}>
              {TIME_SLOTS.map((slot) => {
                const isSelected = selectedSlot === slot;
                return (
                  <Pressable
                    key={slot}
                    onPress={() => setSelectedSlot(slot)}
                    style={[
                      s.slotPill,
                      isSelected ? s.slotPillActive : s.slotPillInactive,
                    ]}
                  >
                    <Text style={[s.slotText, isSelected && s.slotTextActive]}>
                      {slot}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Nominal DP */}
            <Text style={s.label}>5. UANG MUKA / DOWN PAYMENT (DP)</Text>
            <View style={s.dpRow}>
              <Text style={s.rpPrefix}>Rp</Text>
              <TextInput
                style={s.dpInput}
                value={dpAmount}
                onChangeText={(t) => setDpAmount(t.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
              />
            </View>
            <Text style={s.dpHint}>Total Terbaca: {formatRp(parseFloat(dpAmount || '0'))}</Text>

            {/* Submit Button */}
            <Pressable
              disabled={isLoading}
              onPress={handleSaveBooking}
              style={({ pressed }) => [
                s.submitBtn,
                pressed && { opacity: 0.85 },
                isLoading && { opacity: 0.7 },
              ]}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={s.submitBtnText}>📅 CONFIRM & SIMPAN BOOKING ➔</Text>
              )}
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    height: 54,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 2,
    borderColor: '#000000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.5,
  },
  closeBtn: {
    padding: 4,
  },
  closeBtnText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#000000',
  },
  content: {
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardWrapper: {
    width: '100%',
    maxWidth: 580,
    position: 'relative',
  },
  cardShadow: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: -8,
    bottom: -8,
    backgroundColor: '#000000',
    zIndex: -1,
  },
  cardBody: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#000000',
    padding: 24,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.5,
    marginBottom: 20,
  },
  label: {
    fontSize: 11,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.5,
    marginBottom: 8,
    fontFamily: 'monospace',
  },
  input: {
    width: '100%',
    height: 48,
    borderWidth: 1.5,
    borderColor: '#000000',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    fontSize: 13,
    fontWeight: '700',
    color: '#000000',
    fontFamily: 'monospace',
    marginBottom: 18,
  },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
  },
  slotPill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: '#000000',
  },
  slotPillInactive: {
    backgroundColor: '#FFFFFF',
  },
  slotPillActive: {
    backgroundColor: '#000000',
  },
  slotText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#000000',
    fontFamily: 'monospace',
  },
  slotTextActive: {
    color: '#FFFFFF',
  },
  dpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#000000',
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 4,
  },
  rpPrefix: {
    fontSize: 16,
    fontWeight: '900',
    color: '#000000',
    marginRight: 8,
    fontFamily: 'monospace',
  },
  dpInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '900',
    color: '#000000',
    fontFamily: 'monospace',
  },
  dpHint: {
    fontSize: 10,
    fontWeight: '700',
    color: '#666666',
    marginBottom: 24,
    fontFamily: 'monospace',
  },
  submitBtn: {
    width: '100%',
    height: 52,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
    fontFamily: 'monospace',
  },
});
