

import React, { useState, useMemo, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  FlatList,
  Modal,
} from 'react-native';
import { KanbanOrder } from '../types/pos';
import { getTenantTheme } from '../constants/storeConfig';
import { getDBConnection } from '../database/sqlite';

export interface OrderKanbanScreenProps {
  activeCabang: string;
  activeUser: string;
  onBack: () => void;
}

export type StrictKanbanStatus = 'PENDING' | 'IN_PROGRESS' | 'READY';

const EXACT_3_COLUMNS: { status: StrictKanbanStatus; label: string; emoji: string; headerBg: string; badgeBg: string }[] = [
  { status: 'PENDING', label: 'ANTRE / BARU', emoji: '📜', headerBg: '#B45309', badgeBg: '#F59E0B' }, // Yellow/Orange
  { status: 'IN_PROGRESS', label: 'SEDANG DIBUAT', emoji: '🔥', headerBg: '#047857', badgeBg: '#10B981' }, // Green
  { status: 'READY', label: 'SIAP SAJI', emoji: '✅', headerBg: '#1D4ED8', badgeBg: '#3B82F6' }, // Blue
];

const MOCK_INITIAL_ORDERS: KanbanOrder[] = [
  {
    id: 'T-001',
    customerName: 'SITI R.',
    orderTime: '5 mnt yang lalu',
    storeBrand: 'TERVE CAFE',
    status: 'PENDING',
    notes: '',
    items: [
      { id: 'i1', category: 'Drink', name: 'Dark Choco 70% - 75% Kakao', qty: 1, price: 35000, emoji: '🍫' },
      { id: 'i2', category: 'Drink', name: 'Iced Choco', qty: 1, price: 30000, emoji: '🥤' },
    ],
  },
  {
    id: 'T-002',
    customerName: 'AHMAD F.',
    orderTime: '3 mnt yang lalu',
    storeBrand: 'TERVE CAFE',
    status: 'PENDING',
    notes: 'Less Sweet',
    items: [
      { id: 'i3', category: 'Drink', name: 'Hot Choco - Less Sweet', qty: 1, price: 35000, emoji: '☕' },
      { id: 'i4', category: 'Food', name: 'Artisan Brownie', qty: 1, price: 25000, emoji: '🍰' },
    ],
  },
  {
    id: 'T-003',
    customerName: '(Tanpa Nama)',
    orderTime: '1 mnt yang lalu',
    storeBrand: 'TERVE CAFE',
    status: 'PENDING',
    notes: '',
    items: [
      { id: 'i5', category: 'Dessert', name: 'Choco Float', qty: 1, price: 40000, emoji: '🍦' },
      { id: 'i6', category: 'Gift', name: 'Praline Box 9', qty: 1, price: 65000, emoji: '🎁' },
    ],
  },
  {
    id: 'T-004',
    customerName: 'BUDI S.',
    orderTime: '8 mnt yang lalu',
    storeBrand: 'TERVE CAFE',
    status: 'IN_PROGRESS',
    notes: '',
    items: [
      { id: 'i7', category: 'Drink', name: 'Mocca Blend - Regular', qty: 1, price: 38000, emoji: '☕' },
      { id: 'i8', category: 'Gift', name: 'Gift Set Regular', qty: 1, price: 85000, emoji: '🎁' },
    ],
  },
];

export default function OrderKanbanScreen({
  activeCabang,
  activeUser,
  onBack,
}: OrderKanbanScreenProps) {
  const [orders, setOrders] = useState<KanbanOrder[]>(MOCK_INITIAL_ORDERS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [liveClockStr, setLiveClockStr] = useState<string>('');
  const [broadcastBannerText, setBroadcastBannerText] = useState<string>(
    '📢 PROMO SPECIAL BOOTH EVENT: BELI 2 Dapatkan FREE 1 TOPPING WAFFLE! 🍦✨'
  );

  const theme = getTenantTheme(activeCabang);

  // Live Clock (Real-time)
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

  // Real-time Polling Engine & Draft Auto-Clean (>45 min expiration)
  useEffect(() => {
    const pollDatabase = async () => {
      try {
        const db = await getDBConnection();
        const [results] = await db.executeSql(
          `SELECT * FROM transaksi_draft WHERE status != 'VOIDED' ORDER BY created_at DESC LIMIT 50;`
        );
        if (results && results.rows && results.rows.length > 0) {
          const dbOrders: KanbanOrder[] = [];
          const nowMs = Date.now();

          for (let i = 0; i < results.rows.length; i++) {
            const row = results.rows.item(i);
            const createdMs = new Date(row.created_at || Date.now()).getTime();

            // Draft Auto-Clean: Skip expired drafts (>45 min old)
            if (nowMs - createdMs > 45 * 60 * 1000 && row.status === 'UNPAID') {
              continue; // Auto-clean expired draft
            }

            let parsedItems: any[] = [];
            try {
              parsedItems = JSON.parse(row.items_json || '[]');
            } catch (_) {}

            let mappedStatus: StrictKanbanStatus = 'PENDING';
            if (row.status === 'PAID') mappedStatus = 'READY';
            else if (row.status === 'IN_PROGRESS') mappedStatus = 'IN_PROGRESS';

            dbOrders.push({
              id: row.id || `T-${String(i + 1).padStart(3, '0')}`,
              customerName: row.customer_name || 'PEMBELI',
              orderTime: row.created_at ? row.created_at.slice(11, 16) : 'Baru',
              storeBrand: row.nama_cabang || activeCabang,
              status: mappedStatus as any,
              notes: row.notes || '',
              items: parsedItems.map((it: any, idx: number) => ({
                id: it.id || `it_${idx}`,
                category: it.category || 'General',
                name: it.name || it.product_name || 'Item',
                qty: it.qty || it.quantity || 1,
                price: it.price || 0,
                emoji: '📦',
              })),
            });
          }

          if (dbOrders.length > 0) {
            setOrders((prev) => {
              // Merge dbOrders with existing state preserving user moves
              const mergedMap = new Map<string, KanbanOrder>();
              prev.forEach((o) => mergedMap.set(o.id, o));
              dbOrders.forEach((dbo) => {
                if (!mergedMap.has(dbo.id)) {
                  mergedMap.set(dbo.id, dbo);
                }
              });
              return Array.from(mergedMap.values());
            });
          }
        }
      } catch (err) {
        // Silently handle fallback
      }
    };

    pollDatabase();
    const pollInterval = setInterval(pollDatabase, 1500); // 1.5s high-speed polling
    return () => clearInterval(pollInterval);
  }, [activeCabang]);

  // Trigger Auto-Dismiss Toast Notification (disappears in 1.5s)
  const showAutoDismissToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 1500);
  };

  // Card Tap Handler: ANTRE -> SEDANG DIBUAT -> SIAP SAJI -> REMOVED FROM DISPLAY
  const handleTapOrderCard = (order: KanbanOrder) => {
    const queueNo = order.id;
    const name = order.customerName ? ` (${order.customerName})` : '';

    if (order.status === 'PENDING') {
      // Move from ANTRE / BARU to SEDANG DIBUAT
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status: 'IN_PROGRESS' as any } : o))
      );
      showAutoDismissToast(`🔥 PESANAN ${queueNo}${name} SEDANG DIBUAT!`);
    } else if (order.status === 'IN_PROGRESS') {
      // Move from SEDANG DIBUAT to SIAP SAJI
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status: 'READY' as any } : o))
      );
      showAutoDismissToast(`🔔 PESANAN ${queueNo}${name} SIAP DISAJIKAN!`);
    } else if (order.status === 'READY') {
      // Tap on SIAP SAJI -> Toast popup + IMMEDIATELY REMOVED FROM DISPLAY
      setOrders((prev) => prev.filter((o) => o.id !== order.id));
      showAutoDismissToast(`✅ PESANAN ${queueNo}${name} SELESAI & DISERAHKAN!`);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Header Bar */}
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← KEMBALI</Text>
        </Pressable>
        <Text style={styles.headerTitle}>🖥️ DISPLAY ANTREAN PESANAN</Text>
        <Text style={styles.clockText}>{liveClockStr}</Text>
      </View>

      {/* Broadcast Announcement Ticker Banner (Nomor 23) */}
      <View style={styles.broadcastBanner}>
        <Text style={styles.broadcastBannerText}>{broadcastBannerText}</Text>
      </View>

      {/* Kanban Board Container (Exact 3 Columns) */}
      <View style={styles.boardContainer}>
        {EXACT_3_COLUMNS.map((col) => {
          const colOrders = orders.filter((o) => o.status === col.status);

          return (
            <View key={col.status} style={styles.kanbanColumn}>
              {/* Column Header */}
              <View style={[styles.columnHeader, { backgroundColor: col.headerBg }]}>
                <Text style={styles.columnHeaderTitle}>
                  {col.emoji} {col.label}
                </Text>
                <View style={[styles.columnBadge, { backgroundColor: col.badgeBg }]}>
                  <Text style={styles.columnBadgeText}>{colOrders.length}</Text>
                </View>
              </View>

              {/* Column Cards Scroll */}
              <ScrollView style={styles.columnBody} showsVerticalScrollIndicator={false}>
                {colOrders.length === 0 ? (
                  <View style={styles.emptyColumnBox}>
                    <Text style={styles.emptyColumnText}>Tidak ada antrean</Text>
                  </View>
                ) : (
                  colOrders.map((order) => (
                    <Pressable
                      key={order.id}
                      onPress={() => handleTapOrderCard(order)}
                      style={[
                        styles.orderCard,
                        col.status === 'IN_PROGRESS' && styles.orderCardInProgress,
                        col.status === 'READY' && styles.orderCardReady,
                      ]}
                    >
                      {/* Top Row: Big Queue Number & Customer Name */}
                      <View style={styles.cardHeaderRow}>
                        <Text style={styles.orderIdText}>{order.id}</Text>
                        <Text style={styles.customerText}>👤 {order.customerName}</Text>
                      </View>

                      {/* Items Summary Lines */}
                      <View style={styles.itemsBox}>
                        {order.items.map((it, idx) => (
                          <Text key={idx} style={styles.itemLine}>
                            • {it.qty}x {it.name}
                          </Text>
                        ))}
                      </View>

                      {/* Notes if available */}
                      {order.notes ? (
                        <Text style={styles.notesText}>📝 Note: "{order.notes}"</Text>
                      ) : null}

                      {/* Card Footer: Timestamp & Action Hint */}
                      <View style={styles.cardFooterRow}>
                        <Text style={styles.timeText}>⏱️ {order.orderTime}</Text>
                        <Text style={styles.tapHintText}>Tap untuk pindah status ➔</Text>
                      </View>
                    </Pressable>
                  ))
                )}
              </ScrollView>
            </View>
          );
        })}
      </View>

      {/* Auto-Dismiss Toast Popup Modal (Disappears in 1.5s) */}
      {toastMessage && (
        <View style={styles.toastOverlay} pointerEvents="none">
          <View style={styles.toastCard}>
            <Text style={styles.toastText}>{toastMessage}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#121212',
    borderBottomWidth: 2,
    borderColor: '#222222',
  },
  backBtn: {
    backgroundColor: '#000000',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  backBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  headerTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  clockText: { color: '#00D084', fontSize: 13, fontWeight: '900' },
  broadcastBanner: {
    backgroundColor: '#FFDD00',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderColor: '#000000',
    alignItems: 'center',
  },
  broadcastBannerText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  boardContainer: {
    flex: 1,
    flexDirection: 'row',
    padding: 12,
    gap: 12,
  },
  kanbanColumn: {
    flex: 1,
    backgroundColor: '#141414',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#2A2A2A',
    overflow: 'hidden',
  },
  columnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderColor: '#000000',
  },
  columnHeaderTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  columnBadge: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#000000',
  },
  columnBadgeText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#000000',
  },
  columnBody: {
    flex: 1,
    padding: 10,
  },
  emptyColumnBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyColumnText: {
    color: '#555555',
    fontSize: 12,
    fontWeight: '700',
  },
  orderCard: {
    backgroundColor: '#1E1E1E',
    borderWidth: 2,
    borderColor: '#333333',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  orderCardInProgress: {
    backgroundColor: '#064E3B',
    borderColor: '#10B981',
  },
  orderCardReady: {
    backgroundColor: '#1E3A8A',
    borderColor: '#3B82F6',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderIdText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFDD00',
    letterSpacing: 1,
  },
  customerText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  itemsBox: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 6,
    marginVertical: 6,
    gap: 3,
  },
  itemLine: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DDDDDD',
  },
  notesText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FF9800',
    marginBottom: 6,
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  timeText: {
    fontSize: 9,
    color: '#AAAAAA',
    fontWeight: '600',
  },
  tapHintText: {
    fontSize: 9,
    color: '#888888',
    fontStyle: 'italic',
  },
  toastOverlay: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  toastCard: {
    backgroundColor: '#FFDD00',
    borderWidth: 3,
    borderColor: '#000000',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
  },
  toastText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
});
