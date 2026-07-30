

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  FlatList,
  Alert,
  TextInput,
  Modal,
  Animated,
} from 'react-native';
import PaymentCashScreen from './PaymentCashScreen';
import PaymentNonCashScreen from './PaymentNonCashScreen';
import OrderKanbanScreen from './OrderKanbanScreen';
import useAndroidBackIntercept from '../hooks/useAndroidBackIntercept';
import { validateCartBeforeCheckout } from '../utils/checkoutValidation';
import { processCheckout } from '../services/checkoutService';
import { syncManager, SyncWorkerState } from '../services/syncManager';
import {
  calculateCart,
  getBranchTaxRate,
  getBranchPromos,
} from '../services/cartService';
import {
  MenuItem,
  CartItem,
  StoreBrandOption,
  SelectedModifier,
  SelectedBundleItem,
  OrderMeta,
  HeldBill,
  PaymentMode,
  VoucherPresaleData,
} from '../types/pos';
import {
  STORE_BRANDS_OPTIONS,
  SALES_MODE_OPTIONS,
  getTenantTheme,
  parseCabang,
  getMenuData,
  formatRp,
} from '../constants/storeConfig';
import { HatchingPatternBackground } from '../components/HatchingBackground';
import { MenuCard } from '../components/MenuCard';
import { CartRow } from '../components/CartRow';
import { SyncBanner } from '../components/SyncBanner';
import { StoreBranchModal } from '../components/StoreBranchModal';
import { SalesModeModal } from '../components/SalesModeModal';
import { VoidModal } from '../components/VoidModal';
import { ModifierModal } from '../components/ModifierModal';
import { OrderMetaModal } from '../components/OrderMetaModal';
import { BundleSelectionModal } from '../components/BundleSelectionModal';
import { QRScannerModal } from '../components/QRScannerModal';

interface PosMainScreenProps {
  activeCabang: string;
  activeUser: string;
  salesMode: string;
  onEndShift?: () => void;
  onTakeBreak?: () => void;
  onOpenSetupTerminal?: () => void;
  onOpenPrinterModal?: () => void;
  onCabangChange?: (newCabang: string) => void;
  onSalesModeChange?: (newMode: string) => void;
}

export default function PosMainScreen({
  activeCabang,
  activeUser,
  salesMode,
  onEndShift,
  onTakeBreak,
  onOpenSetupTerminal,
  onOpenPrinterModal,
  onCabangChange,
  onSalesModeChange,
}: PosMainScreenProps) {
  const [currentCabang, setCurrentCabang] = useState<string>(activeCabang || "Let's Go Gelato - Bengawan (Bandung)");
  const [currentSalesMode, setCurrentSalesMode] = useState<string>(salesMode || 'Dine In');

  useEffect(() => {
    if (activeCabang) {
      setCurrentCabang(activeCabang);
    }
  }, [activeCabang]);

  useEffect(() => {
    if (salesMode) {
      setCurrentSalesMode(salesMode);
    }
  }, [salesMode]);

  const [syncState, setSyncState] = useState<SyncWorkerState>(syncManager.getState());
  useEffect(() => {
    const unsubscribe = syncManager.subscribe((state) => {
      setSyncState(state);
    });
    return () => unsubscribe();
  }, []);

  const [cart, setCart] = useState<CartItem[]>([]);
  const isLocked = cart.length > 0;
  const [activeCategory, setActiveCategory] = useState<string>('SEMUA');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isCashModalOpen, setIsCashModalOpen] = useState<boolean>(false);
  const [isNonCashModalOpen, setIsNonCashModalOpen] = useState<boolean>(false);
  const [isStoreBranchModalOpen, setIsStoreBranchModalOpen] = useState<boolean>(false);
  const [isSalesModeModalOpen, setIsSalesModeModalOpen] = useState<boolean>(false);

  const [isVoidModalOpen, setIsVoidModalOpen] = useState<boolean>(false);
  const menuFlatListRef = useRef<FlatList>(null);

  const handleSelectCategory = (cat: string) => {
    setActiveCategory(cat);
    menuFlatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };
  const [lastPaidTransaction, setLastPaidTransaction] = useState<{
    id: string;
    total: number;
    paymentMethod: string;
    itemsCount: number;
  } | null>(null);

  const [modalSelectedStore, setModalSelectedStore] = useState<StoreBrandOption>(STORE_BRANDS_OPTIONS[0]);
  const [modalSelectedBranch, setModalSelectedBranch] = useState<string>(STORE_BRANDS_OPTIONS[0].branches[0]);

  const theme = useMemo(() => getTenantTheme(currentCabang), [currentCabang]);
  const allMenuItems = useMemo(() => getMenuData(currentCabang), [currentCabang]);
  const { brand: cabangBrand, branch: cabangBranch } = useMemo(
    () => parseCabang(currentCabang),
    [currentCabang],
  );

  const categories = useMemo(() => {
    const cats = Array.from(new Set(allMenuItems.map(m => m.category)));
    return ['SEMUA', ...cats];
  }, [allMenuItems]);

  useAndroidBackIntercept({
    currentScreen: 'POS_MAIN',
    hasCartItems: cart.length > 0,
    onClearCart: () => setCart([]),
  });

  const filteredMenu = useMemo(() => {
    let result = allMenuItems;
    if (activeCategory !== 'SEMUA') {
      result = result.filter(m => m.category === activeCategory);
    }
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      result = result.filter(m => m.name.toLowerCase().includes(query));
    }
    return result;
  }, [allMenuItems, activeCategory, searchQuery]);

  const taxRate = useMemo(() => getBranchTaxRate(currentCabang), [currentCabang]);
  const activePromos = useMemo(() => getBranchPromos(currentCabang), [currentCabang]);
  const cartCalculation = useMemo(
    () => calculateCart(cart, taxRate, activePromos),
    [cart, taxRate, activePromos],
  );

  const {
    subtotal,
    discountTotal,
    taxAmount,
    total,
    totalQty,
    processedItems,
    appliedPromos,
  } = cartCalculation;

  const [modifierModalVisible, setModifierModalVisible] = useState<boolean>(false);
  const [selectedModifierItem, setSelectedModifierItem] = useState<MenuItem | null>(null);

  const [bundleModalVisible, setBundleModalVisible] = useState<boolean>(false);
  const [selectedBundleItem, setSelectedBundleItem] = useState<MenuItem | null>(null);

  const [isKanbanOpen, setIsKanbanOpen] = useState<boolean>(false);
  const [isQrScannerOpen, setIsQrScannerOpen] = useState<boolean>(false);

  const [orderMeta, setOrderMeta] = useState<OrderMeta>({ customerName: '', tableNo: '', notes: '' });
  const [isOrderMetaModalOpen, setIsOrderMetaModalOpen] = useState<boolean>(false);
  const [heldBills, setHeldBills] = useState<HeldBill[]>([]);
  const [isResumeModalOpen, setIsResumeModalOpen] = useState<boolean>(false);

  const handleUpdateItemNotes = (itemId: string, notes: string) => {
    setCart((prev) =>
      prev.map((c) => (c.id === itemId ? { ...c, itemNotes: notes } : c))
    );
  };

  const handleHoldBill = () => {
    if (cart.length === 0) {
      Alert.alert('⚠️ KERANJANG KOSONG', 'Tidak ada pesanan di keranjang untuk disimpan.');
      return;
    }

    const holdId = `HELD-${Date.now().toString().slice(-6)}`;
    const nowStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    const newHeld: HeldBill = {
      id: holdId,
      holdTime: nowStr,
      cart: [...cart],
      customerName: orderMeta.customerName,
      tableNo: orderMeta.tableNo,
      notes: orderMeta.notes,
      totalAmount: total,
    };

    setHeldBills((prev) => [newHeld, ...prev]);
    setCart([]);
    setOrderMeta({ customerName: '', tableNo: '', notes: '' });

    Alert.alert(
      '✅ PESANAN DISIMPAN (HELD)',
      `Draf transaksi #${holdId} disimpan sementara. Kasir dapat memanggilnya kembali dari daftar tertunda.`,
    );
  };

  const handleResumeBill = (bill: HeldBill) => {
    if (cart.length > 0) {
      Alert.alert(
        '⚠️ KERANJANG BERISI ITEM',
        'Kosongkan atau simpan keranjang aktif saat ini sebelum memanggil draf tertunda.',
      );
      return;
    }

    setCart(bill.cart);
    setOrderMeta({
      customerName: bill.customerName || '',
      tableNo: bill.tableNo || '',
      notes: bill.notes || '',
    });

    setHeldBills((prev) => prev.filter((b) => b.id !== bill.id));
    setIsResumeModalOpen(false);

    Alert.alert(
      '✅ DRAF DIPANGGIL (RESUMED)',
      `Transaksi #${bill.id} (${bill.customerName || 'Tanpa Nama'}) berhasil dipulihkan ke keranjang.`,
    );
  };

  const cartQtyMap = useMemo(() => {
    const map: Record<string, number> = {};
    cart.forEach(item => {
      const baseId = item.id.split('_')[0];
      map[baseId] = (map[baseId] || 0) + item.qty;
    });
    return map;
  }, [cart]);

  const handlePressMenuItem = (item: MenuItem) => {
    if (item.isAvailable === false || (item.stockQuantity !== undefined && item.stockQuantity <= 0)) {
      Alert.alert('🚫 STOK HABIS', `Maaf, stok item ${item.name} sedang kosong.`);
      return;
    }

    if (item.isBundle || (item.bundleGroups && item.bundleGroups.length > 0)) {
      setSelectedBundleItem(item);
      setBundleModalVisible(true);
    } else if (item.modifierGroups && item.modifierGroups.length > 0) {
      setSelectedModifierItem(item);
      setModifierModalVisible(true);
    } else {
      addToCartWithModifiers(item, []);
    }
  };

  const addToCartWithBundle = (item: MenuItem, selectedSubItems: SelectedBundleItem[]) => {
    const extraTotal = selectedSubItems.reduce((acc, curr) => acc + (curr.extraPrice || 0), 0);
    const unitPrice = item.price + extraTotal;
    const bundleKey = selectedSubItems.map((s) => s.optionId).sort().join('_');
    const uniqueId = bundleKey ? `${item.id}_${bundleKey}` : item.id;

    setCart((prev) => {
      const existingIndex = prev.findIndex((c) => (c.uniqueCartId || c.id) === uniqueId);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          qty: updated[existingIndex].qty + 1,
        };
        return updated;
      }
      return [
        ...prev,
        {
          ...item,
          id: uniqueId,
          price: unitPrice,
          qty: 1,
          selectedBundleItems: selectedSubItems,
          uniqueCartId: uniqueId,
        },
      ];
    });
  };

  const addToCartWithModifiers = (item: MenuItem, selectedModifiers: SelectedModifier[]) => {
    const modPrice = selectedModifiers.reduce((acc, curr) => acc + curr.price, 0);
    const unitPrice = item.price + modPrice;
    const modKey = selectedModifiers.map((m) => m.optionId).sort().join('_');
    const uniqueId = modKey ? `${item.id}_${modKey}` : item.id;

    setCart((prev) => {
      const existingIndex = prev.findIndex((c) => (c.uniqueCartId || c.id) === uniqueId);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          qty: updated[existingIndex].qty + 1,
        };
        return updated;
      }
      return [
        ...prev,
        {
          ...item,
          id: uniqueId,
          price: unitPrice,
          qty: 1,
          selectedModifiers,
          uniqueCartId: uniqueId,
        },
      ];
    });
  };

  const handleScanVoucherSuccess = (voucherData: VoucherPresaleData) => {
    setOrderMeta({
      customerName: voucherData.customerName,
      notes: `Voucher: ${voucherData.voucherCode}`,
    });
    setCart(voucherData.items);
  };

  const increaseQty = (id: string) => {
    setCart(prev => prev.map(c => c.id === id ? { ...c, qty: c.qty + 1 } : c));
  };

  const decreaseQty = (id: string) => {
    setCart(prev => {
      const item = prev.find(c => c.id === id);
      if (!item) return prev;
      if (item.qty <= 1) {
        return prev.filter(c => c.id !== id);
      }
      return prev.map(c => c.id === id ? { ...c, qty: c.qty - 1 } : c);
    });
  };

  const removeItem = (id: string) => {
    setCart(prev => prev.filter(c => c.id !== id));
  };

  const clearCart = () => {
    Alert.alert(
      '⚠️ KOSONGKAN DRAF KERANJANG',
      'Apakah Anda yakin ingin menghapus seluruh item dari draf keranjang ini?',
      [
        { text: 'BATAL', style: 'cancel' },
        {
          text: 'KOSONGKAN',
          style: 'destructive',
          onPress: () => {
            setCart([]);
            setOrderMeta({ customerName: '', tableNo: '', notes: '' });
          },
        },
      ],
    );
  };

  const handleCheckoutCash = () => {
    const val = validateCartBeforeCheckout(cart);
    if (!val.isValid) {
      Alert.alert('⚠️ PEMBAYARAN DITOLAK', val.errorMessage || 'Keranjang tidak valid.');
      return;
    }
    setIsCashModalOpen(true);
  };

  const handleCheckoutNonCash = () => {
    const val = validateCartBeforeCheckout(cart);
    if (!val.isValid) {
      Alert.alert('⚠️ PEMBAYARAN DITOLAK', val.errorMessage || 'Keranjang tidak valid.');
      return;
    }
    setIsNonCashModalOpen(true);
  };

  const handleOpenStoreModal = () => {
    if (isLocked) {
      Alert.alert('⚠️ GANTI CABANG DITOLAK', 'Kosongkan draf keranjang terlebih dahulu.');
      return;
    }
    const storeObj = STORE_BRANDS_OPTIONS.find(s => s.name.toUpperCase() === cabangBrand) || STORE_BRANDS_OPTIONS[0];
    setModalSelectedStore(storeObj);
    setModalSelectedBranch(cabangBranch || storeObj.branches[0]);
    setIsStoreBranchModalOpen(true);
  };

  const handleConfirmStoreBranchChange = (newStoreName: string, newBranch: string) => {
    const newCombined = `${newStoreName} - ${newBranch}`;
    setCurrentCabang(newCombined);
    if (onCabangChange) onCabangChange(newCombined);
    setIsStoreBranchModalOpen(false);
  };

  const handleOpenSalesModeModal = () => {
    if (isLocked) {
      Alert.alert('⚠️ GANTI MODE DITOLAK', 'Kosongkan draf keranjang terlebih dahulu.');
      return;
    }
    setIsSalesModeModalOpen(true);
  };

  const handleSelectSalesMode = (mode: string) => {
    setCurrentSalesMode(mode);
    if (onSalesModeChange) onSalesModeChange(mode);
    setIsSalesModeModalOpen(false);
  };

  const handleOpenVoidModal = () => {
    if (!lastPaidTransaction) {
      Alert.alert('ℹ️ TIDAK ADA TRANSAKSI', 'Belum ada transaksi sukses yang dapat di-void.');
      return;
    }
    setIsVoidModalOpen(true);
  };

  const handleConfirmVoidTransaction = (reason: string) => {
    setIsVoidModalOpen(false);
    if (lastPaidTransaction) {
      Alert.alert('✅ VOID BERHASIL', `Transaksi ${lastPaidTransaction.id} berhasil dibatalkan.\nAlasan: ${reason}`);
      setLastPaidTransaction(null);
    }
  };

  if (isKanbanOpen) {
    return (
      <OrderKanbanScreen
        activeCabang={currentCabang}
        activeUser={activeUser}
        onBack={() => setIsKanbanOpen(false)}
      />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bgPage }]}>
      <HatchingPatternBackground />

      <SyncBanner syncState={syncState} />

      <View style={[styles.header, { backgroundColor: theme.secondary }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.brandTitle, { color: theme.secondaryText }]}>
            {theme.brandLabel}
          </Text>
          <Pressable
            disabled={isLocked}
            onPress={handleOpenStoreModal}
            style={[
              styles.branchPill,
              { backgroundColor: theme.accent },
              isLocked && styles.pillDisabled,
            ]}
          >
            <Text style={[styles.branchPillText, { color: theme.accentText }]}>
              📍 {cabangBranch || 'PILIH CABANG'} {isLocked ? '🔒' : '▼'}
            </Text>
          </Pressable>
          <Pressable
            disabled={isLocked}
            onPress={handleOpenSalesModeModal}
            style={[styles.modePill, isLocked && styles.pillDisabled]}
          >
            <Text style={styles.modePillText}>
              🍽️ {currentSalesMode.toUpperCase()} {isLocked ? '🔒' : '▼'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.headerRight}>
          <Pressable onPress={() => setIsQrScannerOpen(true)} style={styles.headerActionBtn}>
            <Text style={styles.headerActionBtnText}>🎫 VOUCHER</Text>
          </Pressable>

          <Pressable onPress={() => setIsKanbanOpen(true)} style={styles.headerActionBtn}>
            <Text style={styles.headerActionBtnText}>🖥️ KDS</Text>
          </Pressable>

          <View style={styles.cashierBadge}>
            <Text style={styles.cashierText}>👤 {activeUser}</Text>
          </View>

          {onOpenPrinterModal && (
            <Pressable onPress={onOpenPrinterModal} style={styles.headerIconBtn}>
              <Text style={styles.headerIconBtnText}>🖨️</Text>
            </Pressable>
          )}

          {onOpenSetupTerminal && (
            <Pressable onPress={onOpenSetupTerminal} style={styles.headerIconBtn}>
              <Text style={styles.headerIconBtnText}>⚙️</Text>
            </Pressable>
          )}

          {onTakeBreak && (
            <Pressable onPress={onTakeBreak} style={styles.headerActionBtn}>
              <Text style={styles.headerActionBtnText}>☕ ISTIRAHAT</Text>
            </Pressable>
          )}

          {onEndShift && (
            <Pressable onPress={onEndShift} style={styles.headerDangerBtn}>
              <Text style={styles.headerDangerBtnText}>🔴 TUTUP SHIFT</Text>
            </Pressable>
          )}
        </View>
      </View>

      <View style={styles.mainContent}>
        <View style={styles.leftPanel}>
          <View style={styles.searchBarContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="🔍 Cari menu..."
              placeholderTextColor="#888888"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')} style={styles.searchClearBtn}>
                <Text style={styles.searchClearBtnText}>✕</Text>
              </Pressable>
            )}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryBar}>
            {categories.map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <Pressable
                  key={cat}
                  onPress={() => handleSelectCategory(cat)}
                  style={[
                    styles.categoryPill,
                    isActive
                      ? [styles.categoryPillActive, { backgroundColor: theme.accent }]
                      : styles.categoryPillInactive,
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryPillText,
                      isActive && { color: theme.accentText, fontWeight: '900' },
                    ]}
                  >
                    {cat}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {filteredMenu.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <View style={styles.emptyStateBox}>
                <Text style={styles.emptyStateTitle}>PRODUK TIDAK DITEMUKAN</Text>
                <Text style={styles.emptyStateSub}>Coba kata kunci lain</Text>
              </View>
            </View>
          ) : (
            <FlatList
              ref={menuFlatListRef}
              key={activeCategory}
              data={filteredMenu}
              keyExtractor={item => item.id}
              numColumns={3}
              contentContainerStyle={styles.menuGrid}
              columnWrapperStyle={styles.menuGridRow}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <MenuCard
                  item={item}
                  theme={theme}
                  cartQty={cartQtyMap[item.id] || 0}
                  onPress={handlePressMenuItem}
                />
              )}
            />
          )}
        </View>

        <View style={styles.rightPanel}>
          <View style={[styles.cartHeader, { backgroundColor: theme.secondary }]}>
            <View style={styles.cartTitleRow}>
              <Text style={[styles.cartTitle, { color: theme.secondaryText }]}>🛒 KERANJANG</Text>
              {totalQty > 0 && (
                <View style={styles.draftStatusBadge}>
                  <Text style={styles.draftStatusBadgeText}>DRAF UNPAID</Text>
                </View>
              )}
            </View>

            <View style={styles.cartHeaderActionRow}>
              <Pressable onPress={() => setIsOrderMetaModalOpen(true)} style={styles.metaBtn}>
                <Text style={styles.metaBtnText}>👤 PEMESAN</Text>
              </Pressable>

              {cart.length > 0 && (
                <Pressable onPress={handleHoldBill} style={styles.holdBtn}>
                  <Text style={styles.holdBtnText}>⏸️ SIMPAN</Text>
                </Pressable>
              )}

              {heldBills.length > 0 && (
                <Pressable onPress={() => setIsResumeModalOpen(true)} style={styles.resumeBtn}>
                  <Text style={styles.resumeBtnText}>▶️ TERTUNDA ({heldBills.length})</Text>
                </Pressable>
              )}

              {cart.length > 0 && (
                <Pressable onPress={clearCart} style={styles.clearBtn}>
                  <Text style={styles.clearBtnText}>🗑️ KOSONGKAN</Text>
                </Pressable>
              )}
            </View>
          </View>

          {(orderMeta.customerName || orderMeta.tableNo || orderMeta.notes) ? (
            <View style={styles.orderMetaBanner}>
              <Text style={styles.orderMetaBannerText}>
                👤 {orderMeta.customerName || 'Tanpa Nama'} {orderMeta.tableNo ? `| 📍 ${orderMeta.tableNo}` : ''}
              </Text>
              {orderMeta.notes ? (
                <Text style={styles.orderMetaBannerNotes}>
                  📝 "{orderMeta.notes}"
                </Text>
              ) : null}
            </View>
          ) : null}

          {processedItems.length === 0 ? (
            <View style={styles.emptyCart}>
              <Text style={styles.emptyCartIcon}>🛒</Text>
              <Text style={styles.emptyCartText}>Draf keranjang masih kosong.</Text>
              <Text style={styles.emptyCartSub}>Pilih menu di sebelah kiri untuk membuat draf pesanan.</Text>
              {heldBills.length > 0 && (
                <Pressable onPress={() => setIsResumeModalOpen(true)} style={styles.resumeHeldBtn}>
                  <Text style={styles.resumeHeldBtnText}>
                    ▶️ PANGGIL DRAF TERTUNDA ({heldBills.length} PESANAN)
                  </Text>
                </Pressable>
              )}
              {lastPaidTransaction && (
                <Pressable onPress={handleOpenVoidModal} style={styles.voidRecentCartBtn}>
                  <Text style={styles.voidRecentCartBtnText}>
                    ⚠️ VOID TRANSAKSI SUCCESS SBLMNYA ({lastPaidTransaction.id})
                  </Text>
                </Pressable>
              )}
            </View>
          ) : (
            <ScrollView style={styles.cartList} showsVerticalScrollIndicator={false}>
              {processedItems.map(item => (
                <CartRow
                  key={item.id}
                  item={item}
                  theme={theme}
                  onIncrease={increaseQty}
                  onDecrease={decreaseQty}
                  onRemove={removeItem}
                  onUpdateNotes={handleUpdateItemNotes}
                />
              ))}
            </ScrollView>
          )}

          <View style={styles.cartFooter}>
            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>SUBTOTAL</Text>
              <Text style={styles.calcVal}>{formatRp(subtotal)}</Text>
            </View>

            {discountTotal > 0 && (
              <View style={styles.calcRow}>
                <Text style={styles.discountLabel}>PROMO & DISKON</Text>
                <Text style={styles.discountVal}>-{formatRp(discountTotal)}</Text>
              </View>
            )}

            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>PAJAK (PB1 11%)</Text>
              <Text style={styles.calcVal}>{formatRp(taxAmount)}</Text>
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>TOTAL BAYAR</Text>
              <Text style={styles.totalVal}>{formatRp(total)}</Text>
            </View>

            <View style={styles.payBtnRow}>
              <Pressable
                disabled={totalQty === 0}
                onPress={handleCheckoutCash}
                style={({ pressed }) => [
                  styles.payBtn,
                  styles.payBtnCash,
                  totalQty === 0 && styles.payBtnDisabled,
                  pressed && totalQty > 0 ? styles.payBtnPressed : styles.payBtnUnpressed,
                ]}
              >
                <Text style={styles.payBtnCashText}>💵 TUNAI</Text>
              </Pressable>

              <Pressable
                disabled={totalQty === 0}
                onPress={handleCheckoutNonCash}
                style={({ pressed }) => [
                  styles.payBtn,
                  styles.payBtnNonCash,
                  { backgroundColor: theme.accent },
                  totalQty === 0 && styles.payBtnDisabled,
                  pressed && totalQty > 0 ? styles.payBtnPressed : styles.payBtnUnpressed,
                ]}
              >
                <Text style={[styles.payBtnNonCashText, { color: theme.accentText }]}>
                  💳 NON-TUNAI / QRIS
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>

      <StoreBranchModal
        visible={isStoreBranchModalOpen}
        storeOptions={STORE_BRANDS_OPTIONS}
        selectedStore={modalSelectedStore}
        selectedBranch={modalSelectedBranch}
        onSelectStore={(store) => {
          setModalSelectedStore(store);
          setModalSelectedBranch(store.branches[0]);
        }}
        onSelectBranch={(branch) => setModalSelectedBranch(branch)}
        onConfirm={() => handleConfirmStoreBranchChange(modalSelectedStore.name, modalSelectedBranch)}
        onClose={() => setIsStoreBranchModalOpen(false)}
      />

      <SalesModeModal
        visible={isSalesModeModalOpen}
        salesModeOptions={SALES_MODE_OPTIONS}
        currentSalesMode={currentSalesMode}
        onSelectSalesMode={handleSelectSalesMode}
        onClose={() => setIsSalesModeModalOpen(false)}
      />

      <ModifierModal
        visible={modifierModalVisible}
        item={selectedModifierItem}
        theme={theme}
        onClose={() => setModifierModalVisible(false)}
        onConfirm={(item, selectedModifiers) => {
          addToCartWithModifiers(item, selectedModifiers);
        }}
      />

      <BundleSelectionModal
        visible={bundleModalVisible}
        item={selectedBundleItem}
        theme={theme}
        onClose={() => setBundleModalVisible(false)}
        onConfirm={(item, selectedSubItems) => {
          addToCartWithBundle(item, selectedSubItems);
        }}
      />

      <QRScannerModal
        visible={isQrScannerOpen}
        onClose={() => setIsQrScannerOpen(false)}
        onScanSuccess={handleScanVoucherSuccess}
      />

      <VoidModal
        visible={isVoidModalOpen}
        targetTransactionInfo={
          lastPaidTransaction
            ? `${lastPaidTransaction.id} (${formatRp(lastPaidTransaction.total)} - ${lastPaidTransaction.paymentMethod})`
            : undefined
        }
        onClose={() => setIsVoidModalOpen(false)}
        onConfirmVoid={handleConfirmVoidTransaction}
      />

      <OrderMetaModal
        visible={isOrderMetaModalOpen}
        storeBrand={cabangBrand}
        salesMode={currentSalesMode}
        initialCustomerName={orderMeta.customerName}
        initialTableNo={orderMeta.tableNo}
        initialNotes={orderMeta.notes}
        theme={theme}
        onClose={() => setIsOrderMetaModalOpen(false)}
        onSave={(meta) => setOrderMeta(meta)}
      />

      <Modal visible={isResumeModalOpen} animationType="slide" transparent>
        <View style={styles.resumeModalOverlay}>
          <View style={styles.resumeModalCard}>
            <View style={[styles.resumeModalHeader, { backgroundColor: theme.accent }]}>
              <Text style={[styles.resumeModalTitle, { color: theme.accentText }]}>
                ▶️ DAFTAR DRAF PESANAN TERTUNDA (HELD)
              </Text>
              <Pressable onPress={() => setIsResumeModalOpen(false)} style={styles.resumeCloseBtn}>
                <Text style={styles.resumeCloseText}>✕</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.resumeScroll}>
              {heldBills.length === 0 ? (
                <Text style={styles.emptyResumeText}>
                  TIDAK ADA DRAF TERTUNDA.
                </Text>
              ) : (
                heldBills.map((bill) => (
                  <View key={bill.id} style={styles.heldBillCard}>
                    <View style={styles.heldBillTopRow}>
                      <Text style={styles.heldBillTitle}>
                        #{bill.id} — 🕒 {bill.holdTime}
                      </Text>
                      <Text style={styles.heldBillTotal}>
                        {formatRp(bill.totalAmount)}
                      </Text>
                    </View>
                    <Text style={styles.heldBillCustomer}>
                      👤 Pemesan: {bill.customerName || 'Tanpa Nama'} {bill.tableNo ? `| 📍 Meja ${bill.tableNo}` : ''}
                    </Text>
                    <Text style={styles.heldBillItemCount}>
                      📦 {bill.cart.length} Jenis Item ({bill.cart.reduce((a, b) => a + b.qty, 0)} pcs)
                    </Text>

                    <View style={styles.heldBillActions}>
                      <Pressable
                        onPress={() => setHeldBills((prev) => prev.filter((b) => b.id !== bill.id))}
                        style={styles.deleteHeldBtn}
                      >
                        <Text style={styles.deleteHeldText}>HAPUS ✕</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => handleResumeBill(bill)}
                        style={[styles.restoreHeldBtn, { backgroundColor: theme.accent }]}
                      >
                        <Text style={[styles.restoreHeldText, { color: theme.accentText }]}>PANGGIL DRAF ➔</Text>
                      </Pressable>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <PaymentCashScreen
        isVisible={isCashModalOpen}
        totalAmount={total}
        activeCabang={currentCabang}
        onClose={() => setIsCashModalOpen(false)}
        onSuccessPayment={async (paidAmount, changeAmount, paymentMode, remainingBalance) => {
          setIsCashModalOpen(false);
          const isDp = paymentMode === 'DP_50';
          const targetPay = isDp ? Math.ceil(total * 0.5) : total;

          const res = await processCheckout({
            items: processedItems.map(i => ({ productId: i.id, name: i.name, quantity: i.qty, price: i.price, subtotal: i.price * i.qty })),
            totalAmount: targetPay,
            paymentType: 'CASH',
            paymentMethod: 'CASH',
            paidAmount,
            changeAmount,
          });

          const createdTrxId = res.transactionData?.transactionId || res.offlineRecord?.id || `TRX-${Date.now().toString().slice(-6)}`;
          setLastPaidTransaction({
            id: createdTrxId,
            total: targetPay,
            paymentMethod: isDp ? 'DP 50% TUNAI' : 'TUNAI (CASH)',
            itemsCount: processedItems.length,
          });

          setCart([]);
          setOrderMeta({ customerName: '', tableNo: '', notes: '' });

          Alert.alert(
            isDp ? '📑 PEMBAYARAN DP 50% TUNAI SUCCESS' : '✅ TRANSAKSI TUNAI SUCCESS',
            `Status: ${isDp ? 'HALF_PAID (DP 50%)' : 'PAID (LUNAS)'}\nID: ${createdTrxId}\nDibayar: ${formatRp(paidAmount)}\nKembalian: ${formatRp(changeAmount)}${isDp ? `\n\n⚠️ Sisa Tagihan: ${formatRp(remainingBalance || 0)}` : ''}`,
            [{ text: 'OK / STRUK BARU' }],
          );
        }}
      />

      <PaymentNonCashScreen
        isVisible={isNonCashModalOpen}
        totalAmount={total}
        activeCabang={currentCabang}
        onClose={() => setIsNonCashModalOpen(false)}
        onSuccessPayment={async (method, refNum, paymentMode, remainingBalance) => {
          setIsNonCashModalOpen(false);
          const isDp = paymentMode === 'DP_50';
          const targetPay = isDp ? Math.ceil(total * 0.5) : total;

          const res = await processCheckout({
            items: processedItems.map(i => ({ productId: i.id, name: i.name, quantity: i.qty, price: i.price, subtotal: i.price * i.qty })),
            totalAmount: targetPay,
            paymentType: 'NON_CASH',
            paymentMethod: method,
            paidAmount: targetPay,
            changeAmount: 0,
            referenceNumber: refNum,
          });

          const createdTrxId = res.transactionData?.transactionId || res.offlineRecord?.id || `TRX-${Date.now().toString().slice(-6)}`;
          setLastPaidTransaction({
            id: createdTrxId,
            total: targetPay,
            paymentMethod: isDp ? `DP 50% (${method})` : `NON-TUNAI (${method})`,
            itemsCount: processedItems.length,
          });

          setCart([]);
          setOrderMeta({ customerName: '', tableNo: '', notes: '' });

          Alert.alert(
            isDp ? '📑 PEMBAYARAN DP 50% NON-TUNAI SUCCESS' : '✅ TRANSAKSI NON-TUNAI SUCCESS',
            `Status: ${isDp ? 'HALF_PAID (DP 50%)' : 'PAID (LUNAS)'}\nID: ${createdTrxId}\nMetode: ${method}\nNo. Ref: ${refNum}${isDp ? `\n\n⚠️ Sisa Tagihan: ${formatRp(remainingBalance || 0)}` : ''}`,
            [{ text: 'OK / STRUK BARU' }],
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    borderBottomWidth: 3,
    borderColor: '#000000',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandTitle: { fontSize: 15, fontWeight: '900', letterSpacing: 0.5, marginRight: 4 },
  branchPill: {
    borderWidth: 2,
    borderColor: '#000000',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  branchPillText: { fontSize: 11, fontWeight: '900' },
  modePill: {
    borderWidth: 2,
    borderColor: '#000000',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  modePillText: { fontSize: 11, fontWeight: '900', color: '#000000' },
  pillDisabled: { opacity: 0.5 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cashierBadge: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#000000',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  cashierText: { fontSize: 11, fontWeight: '800', color: '#000000' },
  headerIconBtn: {
    width: 32,
    height: 32,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconBtnText: { fontSize: 14 },
  headerActionBtn: {
    backgroundColor: '#FFDD00',
    borderWidth: 2,
    borderColor: '#000000',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  headerActionBtnText: { fontSize: 10, fontWeight: '900', color: '#000000' },
  headerDangerBtn: {
    backgroundColor: '#FF3B30',
    borderWidth: 2,
    borderColor: '#000000',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  headerDangerBtnText: { fontSize: 10, fontWeight: '900', color: '#FFFFFF' },

  mainContent: { flex: 1, flexDirection: 'row' },
  leftPanel: { flex: 0.62, borderRightWidth: 3, borderColor: '#000000', padding: 10 },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  searchInput: {
    flex: 1,
    height: 38,
    borderWidth: 2.5,
    borderColor: '#000000',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
  },
  searchClearBtn: {
    position: 'absolute',
    right: 8,
    width: 24,
    height: 24,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchClearBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },

  categoryBar: { maxHeight: 36, marginBottom: 8 },
  categoryPill: {
    borderWidth: 2,
    borderColor: '#000000',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 6,
    justifyContent: 'center',
  },
  categoryPillActive: { elevation: 2 },
  categoryPillInactive: { backgroundColor: '#FFFFFF' },
  categoryPillText: { fontSize: 11, fontWeight: '800', color: '#000000' },

  menuGrid: { paddingBottom: 20 },
  menuGridRow: { justifyContent: 'flex-start', gap: 8, marginBottom: 8 },

  emptyStateContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyStateBox: {
    borderWidth: 3,
    borderColor: '#000000',
    backgroundColor: '#FFFFFF',
    padding: 20,
    alignItems: 'center',
  },
  emptyStateTitle: { fontSize: 14, fontWeight: '900', color: '#000000' },
  emptyStateSub: { fontSize: 11, fontWeight: '700', color: '#666666', marginTop: 4 },

  rightPanel: { flex: 0.38, backgroundColor: '#FFFFFF', justifyContent: 'space-between' },
  cartHeader: {
    height: 44,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 3,
    borderColor: '#000000',
  },
  cartTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cartTitle: { fontSize: 13, fontWeight: '900' },
  draftStatusBadge: {
    backgroundColor: '#FF5722',
    borderWidth: 1.5,
    borderColor: '#000000',
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  draftStatusBadgeText: { fontSize: 8, fontWeight: '900', color: '#FFFFFF' },
  cartHeaderActionRow: { flexDirection: 'row', gap: 4 },
  metaBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#000000',
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  metaBtnText: { fontSize: 9, fontWeight: '900', color: '#000000' },
  holdBtn: {
    backgroundColor: '#FF9800',
    borderWidth: 1.5,
    borderColor: '#000000',
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  holdBtnText: { fontSize: 9, fontWeight: '900', color: '#FFFFFF' },
  resumeBtn: {
    backgroundColor: '#2196F3',
    borderWidth: 1.5,
    borderColor: '#000000',
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  resumeBtnText: { fontSize: 9, fontWeight: '900', color: '#FFFFFF' },
  clearBtn: {
    backgroundColor: '#FF3B30',
    borderWidth: 1.5,
    borderColor: '#000000',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  clearBtnText: { color: '#FFFFFF', fontSize: 9, fontWeight: '900' },

  orderMetaBanner: { backgroundColor: '#E0F7FA', borderWidth: 2, borderColor: '#000000', padding: 6, margin: 6 },
  orderMetaBannerText: { fontSize: 10, fontWeight: '900', color: '#006064' },
  orderMetaBannerNotes: { fontSize: 9, fontWeight: '700', color: '#004D40', marginTop: 2 },

  emptyCart: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyCartIcon: { fontSize: 40, marginBottom: 8 },
  emptyCartText: { fontSize: 13, fontWeight: '900', color: '#000000' },
  emptyCartSub: { fontSize: 11, fontWeight: '700', color: '#666666', textAlign: 'center', marginTop: 4 },
  resumeHeldBtn: {
    marginTop: 12,
    borderWidth: 2,
    borderColor: '#000000',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  resumeHeldBtnText: { fontSize: 10, fontWeight: '900', color: '#1565C0' },
  voidRecentCartBtn: {
    marginTop: 16,
    borderWidth: 2,
    borderColor: '#000000',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  voidRecentCartBtnText: { fontSize: 9, fontWeight: '900', color: '#D84315' },

  cartList: { flex: 1 },

  cartFooter: {
    borderTopWidth: 3,
    borderColor: '#000000',
    backgroundColor: '#FAF3EC',
    padding: 10,
  },
  calcRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  calcLabel: { fontSize: 10, fontWeight: '800', color: '#444444' },
  calcVal: { fontSize: 11, fontWeight: '800', color: '#000000' },
  discountLabel: { fontSize: 10, fontWeight: '900', color: '#2E7D32' },
  discountVal: { fontSize: 11, fontWeight: '900', color: '#2E7D32' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 2,
    borderColor: '#000000',
    paddingTop: 6,
    marginTop: 4,
    marginBottom: 8,
  },
  totalLabel: { fontSize: 12, fontWeight: '900', color: '#000000' },
  totalVal: { fontSize: 16, fontWeight: '900', color: '#000000' },

  payBtnRow: { flexDirection: 'row', gap: 6 },
  payBtn: {
    flex: 1,
    height: 44,
    borderWidth: 3,
    borderColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  payBtnCash: { backgroundColor: '#4CAF50' },
  payBtnCashText: { fontSize: 12, fontWeight: '900', color: '#FFFFFF' },
  payBtnNonCash: {},
  payBtnNonCashText: { fontSize: 11, fontWeight: '900' },
  payBtnDisabled: { backgroundColor: '#CCCCCC', opacity: 0.6 },
  payBtnUnpressed: {
    shadowColor: '#000000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  payBtnPressed: {
    transform: [{ translateX: 2 }, { translateY: 2 }],
    elevation: 0,
  },

  resumeModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 16 },
  resumeModalCard: { backgroundColor: '#FFFFFF', borderWidth: 4, borderColor: '#000000', borderRadius: 12, overflow: 'hidden', maxHeight: '80%' },
  resumeModalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderBottomWidth: 3, borderColor: '#000000' },
  resumeModalTitle: { fontSize: 14, fontWeight: '900' },
  resumeCloseBtn: { width: 28, height: 28, backgroundColor: '#000000', justifyContent: 'center', alignItems: 'center' },
  resumeCloseText: { color: '#FFFFFF', fontWeight: '900' },
  resumeScroll: { padding: 14 },
  emptyResumeText: { textAlign: 'center', fontSize: 12, fontWeight: '700', color: '#666666', marginVertical: 20 },
  heldBillCard: { borderWidth: 2.5, borderColor: '#000000', backgroundColor: '#FAF3EC', padding: 12, marginBottom: 10 },
  heldBillTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  heldBillTitle: { fontSize: 13, fontWeight: '900', color: '#000000' },
  heldBillTotal: { fontSize: 13, fontWeight: '900', color: '#1A3FBB' },
  heldBillCustomer: { fontSize: 11, fontWeight: '800', color: '#333333' },
  heldBillItemCount: { fontSize: 10, fontWeight: '700', color: '#666666', marginTop: 2 },
  heldBillActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 10 },
  deleteHeldBtn: { borderWidth: 2, borderColor: '#000000', backgroundColor: '#FFD1D1', paddingHorizontal: 10, paddingVertical: 6 },
  deleteHeldText: { fontSize: 10, fontWeight: '900', color: '#C62828' },
  restoreHeldBtn: { borderWidth: 2, borderColor: '#000000', paddingHorizontal: 12, paddingVertical: 6 },
  restoreHeldText: { fontSize: 10, fontWeight: '900' },
});