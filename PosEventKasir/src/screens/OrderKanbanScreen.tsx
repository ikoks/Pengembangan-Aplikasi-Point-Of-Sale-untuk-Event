

import React, { useState, useMemo, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  FlatList,
  Alert,
} from 'react-native';
import { KanbanOrder, KanbanOrderStatus } from '../types/pos';
import { formatRp, getTenantTheme } from '../constants/storeConfig';

export interface OrderKanbanScreenProps {
  activeCabang: string;
  activeUser: string;
  onBack: () => void;
}

const INITIAL_KANBAN_ORDERS: KanbanOrder[] = [
  {
    id: 'KDS-001',
    orderTime: '14:20',
    customerName: 'Siti Rahma',
    storeBrand: "Let's Go Gelato",
    status: 'IN_PROGRESS',
    notes: 'Gelato cup terpisah',
    items: [
      { id: 'g1', name: 'Double Scoop (Choco & Vanilla)', price: 55000, qty: 1, category: 'GELATO', emoji: '🍨' },
    ],
  },
  {
    id: 'KDS-002',
    orderTime: '14:28',
    customerName: 'Budi Santoso',
    storeBrand: 'Cafe Terve',
    status: 'PENDING',
    items: [
      { id: 't1', name: 'Espresso Double Shot', price: 28000, qty: 2, category: 'KOPI', emoji: '☕' },
      { id: 't2', name: 'Croissant Butter Original', price: 32000, qty: 1, category: 'PASTRY', emoji: '🥐' },
    ],
  },
  {
    id: 'KDS-003',
    orderTime: '14:05',
    customerName: 'Rian Permana',
    storeBrand: "Let's Go Gelato",
    status: 'READY',
    items: [
      { id: 'g1', name: 'Waffle Cone (2 Rasa)', price: 45000, qty: 2, category: 'GELATO', emoji: '🍦' },
    ],
  },
];

const COLUMNS: { status: KanbanOrderStatus; label: string; emoji: string; color: string }[] = [
  { status: 'PENDING', label: 'ANTRE / BARU', emoji: '📥', color: '#FFF9C4' },
  { status: 'IN_PROGRESS', label: 'SEDANG DIBUAT', emoji: '⏳', color: '#FFE0B2' },
  { status: 'EDITING', label: 'PROSES KHUSUS', emoji: '🎨', color: '#E1BEE7' },
  { status: 'READY', label: 'SIAP SAJI', emoji: '✅', color: '#C8E6C9' },
  { status: 'COMPLETED', label: 'DIAMBIL / SELESAI', emoji: '🎉', color: '#E0E0E0' },
];

export default function OrderKanbanScreen({
  activeCabang,
  activeUser,
  onBack,
}: OrderKanbanScreenProps) {
  const [orders, setOrders] = useState<KanbanOrder[]>(INITIAL_KANBAN_ORDERS);
  const [activeBrandFilter, setActiveBrandFilter] = useState<string>("LET'S GO GELATO");
  const theme = getTenantTheme(activeCabang);

  const moveStatus = (orderId: string, nextStatus: KanbanOrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o))
    );
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const b = (o.storeBrand || '').toLowerCase();
      if (activeBrandFilter === 'TERVE CAFE') return b.includes('terve') || b.includes('chocolate');
      return b.includes('gelato');
    });
  }, [orders, activeBrandFilter]);

  const [liveClockStr, setLiveClockStr] = useState<string>('');
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');
      setLiveClockStr(`${h}.${m}.${s} WIB`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.bgPage }]}>

      <View style={[styles.header, { backgroundColor: theme.secondary }]}>
        <Pressable onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Kembali</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.secondaryText }]}>
          🖥️ KITCHEN DISPLAY SYSTEM (KDS)
        </Text>
        <View style={styles.userBadge}>
          <Text style={styles.userBadgeText}>👤 {activeUser} | {liveClockStr}</Text>
        </View>
      </View>

      <View style={styles.brandFilterBar}>
        {["LET'S GO GELATO", 'TERVE CAFE'].map((brand) => {
          const isActive = activeBrandFilter === brand;
          return (
            <Pressable
              key={brand}
              onPress={() => setActiveBrandFilter(brand)}
              style={[
                styles.brandFilterPill,
                isActive ? styles.brandFilterPillActive : styles.brandFilterPillInactive,
              ]}
            >
              <Text
                style={[
                  styles.brandFilterText,
                  isActive && styles.brandFilterTextActive,
                ]}
              >
                {brand === 'TERVE CAFE' ? '☕ TERVE CAFE' : "🍨 LET'S GO GELATO"}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.boardScroll}>
        {COLUMNS.map((col) => {
          const colOrders = filteredOrders.filter((o) => o.status === col.status);

          return (
            <View key={col.status} style={styles.kanbanColumn}>
              <View style={[styles.columnHeader, { backgroundColor: col.color }]}>
                <Text style={styles.columnHeaderTitle}>
                  {col.emoji} {col.label} ({colOrders.length})
                </Text>
              </View>

              <ScrollView style={styles.columnBody}>
                {colOrders.map((order) => (
                  <View key={order.id} style={styles.orderCard}>
                    <View style={styles.cardTopRow}>
                      <Text style={styles.orderIdText}>#{order.id}</Text>
                      <Text style={styles.timeText}>🕒 {order.orderTime}</Text>
                    </View>

                    <Text style={styles.customerText}>
                      👤 {order.customerName}
                    </Text>

                    {order.notes ? (
                      <Text style={styles.notesText}>📝 Note: "{order.notes}"</Text>
                    ) : null}

                    <View style={styles.itemsBox}>
                      {order.items.map((it, idx) => (
                        <Text key={idx} style={styles.itemLine}>
                          {it.emoji || '📦'} {it.qty}x {it.name}
                        </Text>
                      ))}
                    </View>

                    <View style={styles.actionRow}>
                      {col.status === 'PENDING' && (
                        <Pressable
                          onPress={() => moveStatus(order.id, 'IN_PROGRESS')}
                          style={styles.nextBtn}
                        >
                          <Text style={styles.nextBtnText}>PROSES ➔</Text>
                        </Pressable>
                      )}

                      {col.status === 'IN_PROGRESS' && (
                        <>
                          <Pressable
                            onPress={() => moveStatus(order.id, 'EDITING')}
                            style={styles.editBtn}
                          >
                            <Text style={styles.nextBtnText}>EDITING ➔</Text>
                          </Pressable>
                          <Pressable
                            onPress={() => moveStatus(order.id, 'READY')}
                            style={styles.nextBtn}
                          >
                            <Text style={styles.nextBtnText}>SIAP ➔</Text>
                          </Pressable>
                        </>
                      )}

                      {col.status === 'EDITING' && (
                        <Pressable
                          onPress={() => moveStatus(order.id, 'READY')}
                          style={styles.nextBtn}
                        >
                          <Text style={styles.nextBtnText}>SIAP CETAK ➔</Text>
                        </Pressable>
                      )}

                      {col.status === 'READY' && (
                        <Pressable
                          onPress={() => moveStatus(order.id, 'COMPLETED')}
                          style={[styles.nextBtn, { backgroundColor: '#4CAF50' }]}
                        >
                          <Text style={[styles.nextBtnText, { color: '#FFFFFF' }]}>SELESAI ✔</Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    borderBottomWidth: 3,
    borderColor: '#000000',
  },
  backBtn: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: '#000000',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  backBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  headerTitle: { fontSize: 13, fontWeight: '900' },
  userBadge: {
    borderWidth: 2,
    borderColor: '#000000',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  userBadgeText: { fontSize: 10, fontWeight: '800', color: '#000000' },
  boardScroll: { flex: 1, padding: 12 },
  kanbanColumn: {
    width: 280,
    marginRight: 12,
    borderWidth: 3,
    borderColor: '#000000',
    backgroundColor: '#FFFFFF',
    maxHeight: '98%',
  },
  columnHeader: {
    padding: 10,
    borderBottomWidth: 2.5,
    borderColor: '#000000',
  },
  columnHeaderTitle: { fontSize: 11, fontWeight: '900', color: '#000000' },
  columnBody: { padding: 10 },
  orderCard: {
    borderWidth: 2.5,
    borderColor: '#000000',
    backgroundColor: '#FAF3EC',
    padding: 10,
    marginBottom: 10,
  },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  orderIdText: { fontSize: 12, fontWeight: '900', color: '#000000' },
  timeText: { fontSize: 10, fontWeight: '700', color: '#666666' },
  customerText: { fontSize: 11, fontWeight: '800', color: '#000000', marginBottom: 2 },
  notesText: { fontSize: 10, fontWeight: '700', color: '#D84315', marginBottom: 6 },
  itemsBox: { borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#DDD', paddingVertical: 4, marginBottom: 8 },
  itemLine: { fontSize: 10, fontWeight: '700', color: '#333333', marginBottom: 1 },
  actionRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 6 },
  nextBtn: { borderWidth: 2, borderColor: '#000000', backgroundColor: '#FFDD00', paddingHorizontal: 10, paddingVertical: 5 },
  editBtn: { borderWidth: 2, borderColor: '#000000', backgroundColor: '#E1BEE7', paddingHorizontal: 8, paddingVertical: 5 },
  nextBtnText: { fontSize: 10, fontWeight: '900', color: '#000000' },
  brandFilterBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderColor: '#000000',
    gap: 8,
  },
  brandFilterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 16,
  },
  brandFilterPillActive: {
    backgroundColor: '#000000',
  },
  brandFilterPillInactive: {
    backgroundColor: '#F5F5F5',
  },
  brandFilterText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#000000',
  },
  brandFilterTextActive: {
    color: '#FFFFFF',
  },
});
