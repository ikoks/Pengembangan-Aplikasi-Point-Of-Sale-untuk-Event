import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  FlatList,
  Alert,
  TextInput,
  Animated,
} from 'react-native';
import PaymentCashScreen from './PaymentCashScreen';
import PaymentNonCashScreen from './PaymentNonCashScreen';
import useAndroidBackIntercept from '../hooks/useAndroidBackIntercept';
import { validateCartBeforeCheckout } from '../utils/checkoutValidation';
import { processCheckout } from '../services/checkoutService';
import { syncManager, SyncWorkerState } from '../services/syncManager';
import {
  calculateCart,
  getBranchTaxRate,
  getBranchPromos,
} from '../services/cartService';
import { MenuItem, CartItem, StoreBrandOption } from '../types/pos';
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

interface PosMainScreenProps {
  activeCabang: string;
  activeUser: string;
  salesMode: string;
  onEndShift?: () => void;
  onCabangChange?: (newCabang: string) => void;
  onSalesModeChange?: (newMode: string) => void;
}

export default function PosMainScreen({
  activeCabang,
  activeUser,
  salesMode,
  onEndShift,
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

  const cartQtyMap = useMemo(() => {
    const map: Record<string, number> = {};
    cart.forEach(item => {
      map[item.id] = item.qty;
    });
    return map;
  }, [cart]);

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id);
      if (existing) {
        return prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      }
      return [...prev, { ...item, qty: 1 }];
    });
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
      'Apakah Anda yakin ingin menghapus seluruh item dari draf keranjang ini? Pembatalan draf sebelum bayar (POS-B-05) TIDAK memerlukan OTP Admin.',
      [
        { text: 'BATAL', style: 'cancel' },
        {
          text: 'KOSONGKAN (TANPA OTP)',
          style: 'destructive',
          onPress: () => {
            setCart([]);
          },
        },
      ],
    );
  };

  const handleOpenVoidModal = () => {
    if (!lastPaidTransaction) {
      Alert.alert(
        'ℹ️ TIDAK ADA TRANSAKSI TERBAYAR',
        'Belum ada transaksi berstatus Success/Terbayar pada sesi ini untuk dibatalkan. Pembatalan Draf sebelum bayar dapat langsung menekan tombol KOSONGKAN DRAF.'
      );
      return;
    }
    setIsVoidModalOpen(true);
  };

  const handleConfirmVoidTransaction = (otp: string, reason: string) => {
    if (!lastPaidTransaction) return;

    const voidedTrxId = lastPaidTransaction.id;
    const voidedTotal = lastPaidTransaction.total;

    setIsVoidModalOpen(false);
    setLastPaidTransaction(null);

    Alert.alert(
      '✅ VOID TRANSAKSI TERBAYAR BERHASIL',
      `Transaksi Success (${voidedTrxId}) senilai ${formatRp(voidedTotal)} telah DIBATALKAN.\n\nOtorisasi Admin: ${otp}\nAlasan Pembatalan: "${reason}"`,
      [{ text: 'OK' }]
    );
  };

  const handleOpenStoreBranchSelector = () => {
    if (isLocked) {
      Alert.alert(
        '🔒 PENGUNCIAN POS-B-04 AKTIF',
        'Opsi Toko & Cabang dikunci karena terdapat item di keranjang belanja. Kosongkan draf keranjang terlebih dahulu untuk mengubah Toko & Cabang.',
        [{ text: 'MENGERTI', style: 'default' }]
      );
      return;
    }
    const currentLower = currentCabang.toLowerCase();
    let matchedStore = STORE_BRANDS_OPTIONS[0];
    if (currentLower.includes('terve') || currentLower.includes('chocolate')) {
      matchedStore = STORE_BRANDS_OPTIONS[1];
    } else if (currentLower.includes('papyrus') || currentLower.includes('photo')) {
      matchedStore = STORE_BRANDS_OPTIONS[2];
    }
    setModalSelectedStore(matchedStore);
    setModalSelectedBranch(cabangBranch || matchedStore.branches[0]);
    setIsStoreBranchModalOpen(true);
  };

  const handleConfirmStoreBranchChange = () => {
    const newFullCabang = `${modalSelectedStore.name} - ${modalSelectedBranch}`;
    setCurrentCabang(newFullCabang);
    if (onCabangChange) {
      onCabangChange(newFullCabang);
    }
    setIsStoreBranchModalOpen(false);
  };

  const handleOpenSalesModeSelector = () => {
    if (isLocked) {
      Alert.alert(
        '🔒 PENGUNCIAN POS-B-04 AKTIF',
        'Opsi Sales Mode dikunci karena terdapat item di keranjang belanja. Kosongkan draf keranjang terlebih dahulu untuk mengubah Sales Mode.',
        [{ text: 'MENGERTI', style: 'default' }]
      );
      return;
    }
    setIsSalesModeModalOpen(true);
  };

  const handleSelectSalesMode = (modeLabel: string) => {
    if (isLocked) {
      Alert.alert(
        '🔒 PENGUNCIAN POS-B-04 AKTIF',
        'Opsi Sales Mode dikunci selama keranjang belanja terisi.',
        [{ text: 'OK' }]
      );
      return;
    }
    setCurrentSalesMode(modeLabel);
    if (onSalesModeChange) {
      onSalesModeChange(modeLabel);
    }
    setIsSalesModeModalOpen(false);
  };

  const handleCashPayPress = () => {
    const validation = validateCartBeforeCheckout(cart);
    if (!validation.isValid) {
      Alert.alert('💥 KERANJANG INVALID', validation.errorMessage || 'Keranjang belanja tidak valid.');
      return;
    }
    setIsCashModalOpen(true);
  };

  const handleNonCashPayPress = () => {
    const validation = validateCartBeforeCheckout(cart);
    if (!validation.isValid) {
      Alert.alert('💥 KERANJANG INVALID', validation.errorMessage || 'Keranjang belanja tidak valid.');
      return;
    }
    setIsNonCashModalOpen(true);
  };

  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    let loop: Animated.CompositeAnimation | null = null;
    if (syncState.status === 'SYNCING' || syncState.pendingCount > 0 || syncState.status === 'ERROR') {
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.4, duration: 650, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 650, useNativeDriver: true }),
        ])
      );
      loop.start();
    } else {
      pulseAnim.setValue(1);
    }
    return () => { if (loop) loop.stop(); };
  }, [syncState.status, syncState.pendingCount, pulseAnim]);

  const getSyncDotColor = () => {
    if (syncState.status === 'SYNCING') return '#00B0FF';
    if (!syncState.isOnline) return '#FF6D00';
    if (syncState.status === 'ERROR') return '#D50000';
    if (syncState.pendingCount > 0) return '#F9A825';
    return '#1B5E20';
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.bgPage }]}>
      <View style={[styles.headerBar, { backgroundColor: theme.secondary }]}>
        <Pressable
          disabled={isLocked}
          onPress={handleOpenStoreBranchSelector}
          style={({ pressed }) => [
            styles.headerSelectorBtn,
            isLocked ? styles.selectorLocked : (pressed ? styles.selectorPressed : styles.selectorUnlocked),
          ]}
        >
          {isLocked && <HatchingPatternBackground />}
          <View style={styles.headerLeftInfo}>
            <View style={styles.headerBrandRow}>
              <Text style={[styles.headerBrand, { color: isLocked ? '#555555' : theme.secondaryText }]}>
                {cabangBrand || theme.brandLabel}
              </Text>
              <Text style={[styles.selectorIcon, isLocked && styles.selectorIconLocked]}>
                {isLocked ? '🔒' : ' ▾'}
              </Text>
            </View>
            {cabangBranch !== '' && (
              <Text style={[styles.headerSub, { color: isLocked ? '#777777' : theme.secondaryText }]}>
                📍 {cabangBranch}
              </Text>
            )}
          </View>
          {isLocked && (
            <View style={styles.lockBadgeHeader}>
              <Text style={styles.lockBadgeHeaderText}>TERKUNCI</Text>
            </View>
          )}
        </Pressable>

        <View style={styles.headerRight}>
          <View style={[
            styles.syncDotWrapper,
            { backgroundColor: getSyncDotColor() },
          ]}>
            <Animated.View style={[styles.syncDot, { opacity: (syncState.status === 'SYNCING' || syncState.pendingCount > 0 || syncState.status === 'ERROR') ? pulseAnim : 1 }]} />
          </View>

          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>👤 {activeUser.toUpperCase()}</Text>
          </View>

          <Pressable
            disabled={isLocked}
            onPress={handleOpenSalesModeSelector}
            style={({ pressed }) => [
              styles.salesModeSelectorBadge,
              { backgroundColor: isLocked ? '#DCDCDC' : theme.accent },
              isLocked ? styles.selectorLocked : (pressed ? styles.selectorPressed : styles.selectorUnlocked),
            ]}
          >
            {isLocked && <HatchingPatternBackground />}
            <Text style={[
              styles.headerBadgeText,
              { color: isLocked ? '#555555' : theme.accentText },
            ]}>
              {isLocked ? `🔒 ${currentSalesMode.toUpperCase()}` : `🏷️ ${currentSalesMode.toUpperCase()} ▾`}
            </Text>
          </Pressable>

          {lastPaidTransaction && (
            <Pressable
              onPress={handleOpenVoidModal}
              style={styles.voidHeaderBtn}
            >
              <Text style={styles.voidHeaderBtnText}>⚠️ VOID SUCCESS</Text>
            </Pressable>
          )}

          {onEndShift && (
            <Pressable
              onPress={() =>
                Alert.alert('TUTUP SHIFT?', 'Yakin ingin mengakhiri shift?', [
                  { text: 'BATAL', style: 'cancel' },
                  { text: 'TUTUP', style: 'destructive', onPress: onEndShift },
                ])
              }
              style={styles.endShiftBtn}
            >
              <Text style={styles.endShiftText}>⏏ SHIFT</Text>
            </Pressable>
          )}
        </View>
      </View>

      <SyncBanner syncState={syncState} />

      {isLocked && (
        <View style={styles.lockBannerStrip}>
          <Text style={styles.lockBannerText}>
            🔒 POS-B-04: SELECTOR TOKO, CABANG & SALES MODE DIKUNCI SELAMA KERANJANG TERISI ({cart.length} ITEM)
          </Text>
        </View>
      )}

      <View style={styles.mainContent}>
        <View style={styles.leftPanel}>
          <View style={[styles.searchContainer, { backgroundColor: theme.bgPage }]}>
            <TextInput
              style={styles.searchInput}
              placeholder="Cari menu..."
              placeholderTextColor="#888"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryScroll}
            contentContainerStyle={styles.categoryScrollContent}
          >
            {categories.map(cat => {
              const isActive = activeCategory === cat;
              return (
                <Pressable
                  key={cat}
                  onPress={() => setActiveCategory(cat)}
                  style={[
                    styles.categoryTab,
                    isActive
                      ? [styles.categoryTabActive, { backgroundColor: theme.accent }]
                      : styles.categoryTabInactive,
                  ]}
                >
                  <Text style={[styles.categoryTabText, isActive && { color: theme.accentText }]}>
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
                  onPress={addToCart}
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
              {totalQty > 0 && (
                <View style={[styles.cartHeaderBadge, { backgroundColor: theme.accent }]}>
                  <Text style={[styles.cartHeaderBadgeText, { color: theme.accentText }]}>
                    {totalQty}
                  </Text>
                </View>
              )}
            </View>
            {cart.length > 0 && (
              <Pressable onPress={clearCart} style={styles.clearBtn}>
                <Text style={styles.clearBtnText}>🗑️ KOSONGKAN DRAF</Text>
              </Pressable>
            )}
          </View>
          {processedItems.length === 0 ? (
            <View style={styles.emptyCart}>
              <Text style={styles.emptyCartIcon}>🛒</Text>
              <Text style={styles.emptyCartText}>Draf keranjang masih kosong.</Text>
              <Text style={styles.emptyCartSub}>Pilih menu di sebelah kiri untuk membuat draf pesanan.</Text>
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
                />
              ))}
            </ScrollView>
          )}
          <View style={styles.checkoutPanel}>
            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>SUBTOTAL</Text>
              <Text style={styles.calcValue}>{formatRp(subtotal)}</Text>
            </View>
            {discountTotal > 0 && (
              <View style={styles.calcRow}>
                <Text style={[styles.calcLabel, { color: '#D32F2F', fontWeight: '900' }]}>
                  DISKON PROMO
                </Text>
                <Text style={[styles.calcValue, { color: '#D32F2F', fontWeight: '900' }]}>
                  -{formatRp(discountTotal)}
                </Text>
              </View>
            )}
            {appliedPromos.length > 0 && (
              <View style={styles.promoListBadgeContainer}>
                {appliedPromos.map((promoText, idx) => (
                  <View key={idx} style={[styles.promoBadge, { backgroundColor: theme.accent }]}>
                    <Text style={[styles.promoBadgeText, { color: theme.accentText }]}>
                      🎉 {promoText}
                    </Text>
                  </View>
                ))}
              </View>
            )}
            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>PAJAK PPN ({Math.round(taxRate * 100)}%)</Text>
              <Text style={styles.calcValue}>{formatRp(taxAmount)}</Text>
            </View>
            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>QTY ITEM</Text>
              <Text style={styles.calcValue}>{totalQty} pcs</Text>
            </View>
            <View style={[styles.totalBox, { backgroundColor: theme.accent }]}>
              <Text style={[styles.totalLabel, { color: theme.accentText }]}>TOTAL DRAF</Text>
              <Text style={[styles.totalValue, { color: theme.accentText }]}>{formatRp(total)}</Text>
            </View>
            <View style={styles.payBtnRow}>
              <Pressable
                onPress={handleCashPayPress}
                style={({ pressed }) => [
                  styles.payBtnBase,
                  styles.payBtnHalf,
                  pressed ? styles.payBtnPressed : [styles.payBtnUnpressed, { backgroundColor: '#FFDD00' }],
                ]}
              >
                <Text style={[styles.payBtnText, { color: '#000' }]}>
                  💵 TUNAI ➔
                </Text>
              </Pressable>
              <Pressable
                onPress={handleNonCashPayPress}
                style={({ pressed }) => [
                  styles.payBtnBase,
                  styles.payBtnHalf,
                  pressed ? styles.payBtnPressed : [styles.payBtnUnpressed, { backgroundColor: '#00E5FF' }],
                ]}
              >
                <Text style={[styles.payBtnText, { color: '#000' }]}>
                  💳 NON-TUNAI ➔
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
        onConfirm={handleConfirmStoreBranchChange}
        onClose={() => setIsStoreBranchModalOpen(false)}
      />

      <SalesModeModal
        visible={isSalesModeModalOpen}
        salesModeOptions={SALES_MODE_OPTIONS}
        currentSalesMode={currentSalesMode}
        onSelectSalesMode={handleSelectSalesMode}
        onClose={() => setIsSalesModeModalOpen(false)}
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

      <PaymentCashScreen
        isVisible={isCashModalOpen}
        totalAmount={total}
        activeCabang={currentCabang}
        onClose={() => setIsCashModalOpen(false)}
        onSuccessPayment={async (paidAmount, changeAmount) => {
          setIsCashModalOpen(false);
          const res = await processCheckout({
            items: processedItems.map(i => ({ productId: i.id, name: i.name, quantity: i.qty, price: i.price, subtotal: i.price * i.qty })),
            totalAmount: total,
            paymentType: 'CASH',
            paymentMethod: 'CASH',
            paidAmount,
            changeAmount,
          });

          const createdTrxId = res.transactionData?.transactionId || res.offlineRecord?.id || `TRX-${Date.now().toString().slice(-6)}`;
          setLastPaidTransaction({
            id: createdTrxId,
            total,
            paymentMethod: 'TUNAI (CASH)',
            itemsCount: processedItems.length,
          });

          setCart([]);
          Alert.alert(
            res.mode === 'OFFLINE' ? '⚡ TRANSAKSI DISIMPAN OFFLINE (SQLITE DRAFT)' : '✅ TRANSAKSI SERTIFIKASI BERHASIL',
            `Mode: ${res.mode}\nTotal: ${formatRp(total)}\nTunai: ${formatRp(paidAmount)}\nKembalian: ${formatRp(changeAmount)}`,
            [{ text: 'STRUK BARU', onPress: () => setCart([]) }],
          );
        }}
      />

      <PaymentNonCashScreen
        isVisible={isNonCashModalOpen}
        totalAmount={total}
        activeCabang={currentCabang}
        onClose={() => setIsNonCashModalOpen(false)}
        onSuccessPayment={async (method, refNum) => {
          setIsNonCashModalOpen(false);
          const res = await processCheckout({
            items: processedItems.map(i => ({ productId: i.id, name: i.name, quantity: i.qty, price: i.price, subtotal: i.price * i.qty })),
            totalAmount: total,
            paymentType: 'NON_CASH',
            paymentMethod: method,
            paidAmount: total,
            changeAmount: 0,
            referenceNumber: refNum,
          });

          const createdTrxId = res.transactionData?.transactionId || res.offlineRecord?.id || `TRX-${Date.now().toString().slice(-6)}`;
          setLastPaidTransaction({
            id: createdTrxId,
            total,
            paymentMethod: `NON-TUNAI (${method})`,
            itemsCount: processedItems.length,
          });

          setCart([]);
          Alert.alert(
            res.mode === 'OFFLINE' ? '⚡ TRANSAKSI NON-TUNAI DISIMPAN OFFLINE' : '✅ TRANSAKSI NON-TUNAI BERHASIL',
            `Mode: ${res.mode}\nTotal: ${formatRp(total)}\nMetode: ${method}\nNo. Ref: ${refNum}`,
            [{ text: 'STRUK BARU', onPress: () => setCart([]) }],
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerBar: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderBottomWidth: 4,
    borderBottomColor: '#000000',
  },
  headerSelectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 0,
    overflow: 'hidden',
    position: 'relative',
    minWidth: 180,
  },
  headerLeftInfo: { flexDirection: 'column' },
  headerBrandRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  headerBrand: { fontSize: 13, fontWeight: '900', letterSpacing: 0.8 },
  headerSub: { fontSize: 10, fontWeight: '700', marginTop: 1 },
  selectorIcon: { fontSize: 11, fontWeight: '900', color: '#FFF' },
  selectorIconLocked: { color: '#666666' },
  selectorUnlocked: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 2,
    borderColor: '#000000',
  },
  selectorPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    transform: [{ scale: 0.98 }],
  },
  selectorLocked: {
    backgroundColor: '#DCDCDC',
    borderWidth: 2.5,
    borderColor: '#666666',
    borderStyle: 'dashed',
    opacity: 0.88,
  },
  lockBadgeHeader: {
    marginLeft: 8,
    backgroundColor: '#000000',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#FFDD00',
    zIndex: 2,
  },
  lockBadgeHeaderText: {
    color: '#FFDD00',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  lockBannerStrip: {
    backgroundColor: '#FF3B30',
    borderBottomWidth: 3,
    borderBottomColor: '#000000',
    paddingVertical: 4,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockBannerText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerBadge: {
    borderWidth: 2,
    borderColor: '#000000',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  salesModeSelectorBadge: {
    borderWidth: 2,
    borderColor: '#000000',
    paddingHorizontal: 10,
    paddingVertical: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  headerBadgeText: { fontSize: 10, fontWeight: '900', color: '#000000', letterSpacing: 0.5, zIndex: 2 },
  voidHeaderBtn: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: '#FF3B30',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  voidHeaderBtnText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  endShiftBtn: { borderWidth: 2, borderColor: '#FFFFFF', paddingHorizontal: 8, paddingVertical: 4 },
  endShiftText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900' },
  mainContent: { flex: 1, flexDirection: 'row' },
  leftPanel: { flex: 3, borderRightWidth: 4, borderRightColor: '#000000' },
  categoryScroll: {
    borderBottomWidth: 3,
    borderBottomColor: '#000000',
    maxHeight: 52,
    backgroundColor: '#FFFFFF',
  },
  categoryScrollContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    alignItems: 'center',
  },
  categoryTab: { paddingHorizontal: 14, paddingVertical: 6, borderWidth: 2.5, borderColor: '#000000' },
  categoryTabActive: {
    transform: [{ translateX: -2 }, { translateY: -2 }],
    shadowColor: '#000000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  categoryTabInactive: { backgroundColor: '#FFFFFF' },
  categoryTabText: { fontSize: 11, fontWeight: '900', color: '#000000', letterSpacing: 0.5 },
  menuGrid: { padding: 12 },
  menuGridRow: { gap: 10, marginBottom: 10 },
  searchContainer: {
    padding: 12,
    borderBottomWidth: 4,
    borderBottomColor: '#000000',
  },
  searchInput: {
    height: 48,
    borderWidth: 4,
    borderColor: '#000000',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    fontSize: 14,
    fontWeight: '800',
    color: '#000000',
    transform: [{ translateX: -4 }, { translateY: -4 }],
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyStateBox: {
    borderWidth: 4,
    borderColor: '#000000',
    borderStyle: 'dashed',
    backgroundColor: '#FFFFFF',
    padding: 24,
    alignItems: 'center',
    transform: [{ translateX: -4 }, { translateY: -4 }],
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#000000',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSub: {
    fontSize: 12,
    fontWeight: '700',
    color: '#555555',
    textAlign: 'center',
  },
  rightPanel: { flex: 2, flexDirection: 'column', borderLeftWidth: 0 },
  cartHeader: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderBottomWidth: 3,
    borderBottomColor: '#000000',
  },
  cartTitle: { fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  draftStatusBadge: {
    backgroundColor: '#FFDD00',
    borderWidth: 2,
    borderColor: '#000000',
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  draftStatusBadgeText: { color: '#000000', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  clearBtn: { borderWidth: 2, borderColor: '#FFFFFF', backgroundColor: '#FF3B30', paddingHorizontal: 8, paddingVertical: 3 },
  clearBtnText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900' },
  emptyCart: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyCartIcon: { fontSize: 40, marginBottom: 12, opacity: 0.25 },
  emptyCartText: { fontSize: 13, fontWeight: '800', color: '#999999', textAlign: 'center' },
  emptyCartSub: { fontSize: 11, fontWeight: '600', color: '#BBBBBB', marginTop: 4, textAlign: 'center' },
  voidRecentCartBtn: {
    marginTop: 14,
    borderWidth: 3,
    borderColor: '#000000',
    backgroundColor: '#FF3B30',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  voidRecentCartBtnText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  cartList: { flex: 1 },
  cartTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cartHeaderBadge: {
    borderWidth: 2,
    borderColor: '#000000',
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  cartHeaderBadgeText: { fontSize: 10, fontWeight: '900' },
  promoListBadgeContainer: { marginVertical: 4, gap: 4 },
  promoBadge: {
    borderWidth: 2,
    borderColor: '#000000',
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  promoBadgeText: { fontSize: 10, fontWeight: '900' },
  checkoutPanel: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 10,
    borderTopWidth: 4,
    borderTopColor: '#000000',
    backgroundColor: '#FFFFFF',
  },
  calcRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  calcLabel: { fontSize: 11, fontWeight: '700', color: '#555555', letterSpacing: 0.5 },
  calcValue: { fontSize: 11, fontWeight: '800', color: '#000000' },
  totalBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#000000',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 8,
    marginBottom: 10,
  },
  totalLabel: { fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  totalValue: { fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
  payBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  payBtnHalf: {
    flex: 1,
  },
  payBtnBase: {
    height: 52,
    borderWidth: 4,
    borderColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  payBtnUnpressed: {
    transform: [{ translateX: -4 }, { translateY: -4 }],
    shadowColor: '#000000',
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
  },
  payBtnPressed: {
    backgroundColor: '#222222',
    transform: [{ translateX: 0 }, { translateY: 0 }],
    elevation: 0,
  },
  payBtnText: { fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },
  syncDotWrapper: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  syncDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#FFFFFF',
  },
});