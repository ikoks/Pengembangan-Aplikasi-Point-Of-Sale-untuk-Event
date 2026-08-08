

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
import SalesHistoryScreen, { CompletedTransactionRecord } from './SalesHistoryScreen';
import useAndroidBackIntercept from '../hooks/useAndroidBackIntercept';
import { useResponsive } from '../utils/useResponsive';
import { validateCartBeforeCheckout } from '../utils/checkoutValidation';
import { processCheckout } from '../services/checkoutService';
import { syncManager, SyncWorkerState } from '../services/syncManager';
import {
  calculateCart,
  getBranchTaxRate,
  getBranchPromos,
  convertCurrency,
  ForeignCurrency,
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
  const [currentCabang, setCurrentCabang] = useState<string>(activeCabang || '');
  const [currentSalesMode, setCurrentSalesMode] = useState<string>(salesMode || '');

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

  const isSelectionComplete = Boolean(currentCabang && currentSalesMode);

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

  const {
    isTablet,
    isLandscape,
    isPhone,
    numColumns,
    scaleFont,
    catalogFlex,
    cartFlex,
  } = useResponsive();

  const [todaySalesHistory, setTodaySalesHistory] = useState<CompletedTransactionRecord[]>([]);
  const [isSalesHistoryOpen, setIsSalesHistoryOpen] = useState<boolean>(false);
  const [dailyQueueCounter, setDailyQueueCounter] = useState<number>(1);

  const [manualDiscountInput, setManualDiscountInput] = useState<number>(0);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState<boolean>(false);
  const [discountInputValue, setDiscountInputValue] = useState<string>('');

  const [isMobileCartOpen, setIsMobileCartOpen] = useState<boolean>(false);
  const [isVoidModalOpen, setIsVoidModalOpen] = useState<boolean>(false);
  const [isScanBarcodeModalOpen, setIsScanBarcodeModalOpen] = useState<boolean>(false);
  const [isCustomerQrModalOpen, setIsCustomerQrModalOpen] = useState<boolean>(false);
  const [isCustomerQrVisible, setIsCustomerQrVisible] = useState<boolean>(false);
  const [manualBarcodeInput, setManualBarcodeInput] = useState<string>('');
  const [scannedOrdersList, setScannedOrdersList] = useState<any[]>([]);

  const handleScanCustomerOrder = (code?: string) => {
    setIsCustomerQrModalOpen(false);
    setIsScanBarcodeModalOpen(false);

    if (!currentSalesMode) setCurrentSalesMode('Event');
    if (!currentCabang) setCurrentCabang(STORE_BRANDS_OPTIONS[0].branches[0]);

    const orderObj = {
      code: code || 'ORD-883921',
      customerName: 'SITI RAHMA',
      queueNumber: 'A-025',
      notes: 'Kurangi es, cup terpisah',
      items: [
        { ...allMenuItems[0], qty: 1, id: `${allMenuItems[0].id}_scan1` },
        { ...allMenuItems[4] || allMenuItems[1], qty: 1, id: `scan_2` },
        { ...allMenuItems[6] || allMenuItems[2], qty: 1, id: `scan_3` },
      ],
    };

    setScannedOrdersList((prev) => {
      if (prev.some((o) => o.code === orderObj.code)) return prev;
      return [...prev, orderObj];
    });

    setOrderMeta({ customerName: orderObj.customerName, queueNumber: orderObj.queueNumber, notes: orderObj.notes });
    setCart(orderObj.items);

    Alert.alert(
      '✅ BARCODE TERPINDAI!',
      `📋 Kode Barcode: ${orderObj.code}\n👤 Pemesan: ${orderObj.customerName}\n🎫 No. Antrean: ${orderObj.queueNumber}\n🛒 ${orderObj.items.length} item otomatis terisi ke keranjang kasir!`,
    );
  };

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

  const theme = useMemo(() => getTenantTheme(currentCabang || "Let's Go Gelato - Bengawan"), [currentCabang]);
  const allMenuItems = useMemo(() => getMenuData(currentCabang || "Let's Go Gelato - Bengawan"), [currentCabang]);
  const { brand: cabangBrand, branch: cabangBranch } = useMemo(
    () => parseCabang(currentCabang),
    [currentCabang],
  );

  const isTerveBrand = useMemo(() => {
    const c = (currentCabang || '').toLowerCase();
    return c.includes('terve') || c.includes('chocolate') || c.includes('cafe');
  }, [currentCabang]);

  const [isMenuDropdownOpen, setIsMenuDropdownOpen] = useState<boolean>(false);

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
  const cartCalculation = useMemo(
    () => calculateCart(cart, manualDiscountInput, currentCabang, currentSalesMode),
    [cart, currentCabang, currentSalesMode, manualDiscountInput],
  );

  const {
    subtotal,
    promoTotal,
    voucherTotal,
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

  const [orderMeta, setOrderMeta] = useState<OrderMeta>({ customerName: '', notes: '' });
  const [isOrderMetaModalOpen, setIsOrderMetaModalOpen] = useState<boolean>(false);
  const [heldBills, setHeldBills] = useState<HeldBill[]>([]);
  const [isResumeModalOpen, setIsResumeModalOpen] = useState<boolean>(false);
  const [isCdsModalOpen, setIsCdsModalOpen] = useState<boolean>(false);
  const [isSelfOrderQrOpen, setIsSelfOrderQrOpen] = useState<boolean>(false);
  const [selectedCurrency, setSelectedCurrency] = useState<ForeignCurrency>('IDR');

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
      notes: orderMeta.notes,
      totalAmount: total,
    };

    setHeldBills((prev) => [newHeld, ...prev]);
    setCart([]);
    setOrderMeta({ customerName: '', notes: '' });

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
            setOrderMeta({ customerName: '', notes: '' });
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

  const renderCartPanel = () => (
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
          <Pressable onPress={() => setIsScanBarcodeModalOpen(true)} style={[styles.metaBtn, { borderColor: '#FFC300' }]}>
            <Text style={[styles.metaBtnText, { color: '#FFC300' }]}>📷 SCAN BARCODE</Text>
          </Pressable>

          <Pressable onPress={() => setIsOrderMetaModalOpen(true)} style={styles.metaBtn}>
            <Text style={styles.metaBtnText}>👤 PEMESAN</Text>
          </Pressable>

          <Pressable onPress={() => setIsDiscountModalOpen(true)} style={styles.metaBtn}>
            <Text style={styles.metaBtnText}>🏷️ DISKON</Text>
          </Pressable>

          <Pressable onPress={() => setIsCdsModalOpen(true)} style={styles.metaBtn}>
            <Text style={styles.metaBtnText}>🖥️ CDS</Text>
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

      {(orderMeta.customerName || orderMeta.notes) ? (
        <View style={styles.orderMetaBanner}>
          <Text style={styles.orderMetaBannerText}>
            👤 {orderMeta.customerName || 'Tanpa Nama'}
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

        {promoTotal > 0 && (
          <View style={styles.calcRow}>
            <Text style={styles.discountLabel}>PROMO</Text>
            <Text style={styles.discountVal}>-{formatRp(promoTotal)}</Text>
          </View>
        )}

        {discountTotal > 0 && (
          <View style={styles.calcRow}>
            <Text style={styles.discountLabel}>DISKON</Text>
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

        <Pressable
          disabled={totalQty === 0}
          onPress={() => {
            if (isPhone && !isLandscape) {
              setIsMobileCartOpen(false);
            }
            handleCheckoutCash();
          }}
          style={({ pressed }) => [
            styles.payBtnFull,
            totalQty === 0 && styles.payBtnDisabled,
            pressed && totalQty > 0 ? styles.payBtnPressed : styles.payBtnUnpressed,
          ]}
        >
          <Text style={styles.payBtnFullText}>LANJUTKAN PEMBAYARAN</Text>
        </Pressable>
      </View>
    </View>
  );

  if (isSalesHistoryOpen) {
    return (
      <SalesHistoryScreen
        activeCabang={currentCabang}
        activeUser={activeUser}
        historyRecords={todaySalesHistory}
        onBackToPos={() => setIsSalesHistoryOpen(false)}
        onTakeBreak={onTakeBreak}
        onEndShift={() => {
          setTodaySalesHistory([]);
          setDailyQueueCounter(1);
          if (onEndShift) onEndShift();
        }}
        onOpenSettings={() => {
          setIsSalesHistoryOpen(false);
          if (onOpenSetupTerminal) onOpenSetupTerminal();
        }}
      />
    );
  }

  if (isKanbanOpen) {
    return (
      <OrderKanbanScreen
        activeCabang={currentCabang || "Bengawan (Bandung)"}
        activeUser={activeUser}
        onBack={() => setIsKanbanOpen(false)}
      />
    );
  }

  return (
    <View style={styles.container}>
      <SyncBanner syncState={syncState} />

      {/* Top Header Bar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable onPress={() => setIsMenuDropdownOpen((prev) => !prev)} style={styles.hamburgerBtn}>
            <Text style={styles.hamburgerIcon}>☰</Text>
          </Pressable>
          <Text style={styles.brandTitle}>MENU</Text>
        </View>

        <View style={styles.headerRight}>
          <Pressable
            onPress={() => {
              if (syncState.isOnline) {
                syncManager.triggerManualSync();
                Alert.alert('🔄 SINKRONISASI', 'Menyinkronkan transaksi ke server backend...');
              } else {
                Alert.alert('🔴 MODE OFFLINE', `Koneksi internet terputus. ${syncState.pendingCount} transaksi aman tersimpan di database lokal HP.`);
              }
            }}
            style={[
              styles.syncBadge,
              syncState.isOnline
                ? (syncState.pendingCount > 0 ? styles.syncBadgePending : styles.syncBadgeOnline)
                : styles.syncBadgeOffline,
            ]}
          >
            <Text style={styles.syncBadgeText}>
              {syncState.status === 'SYNCING'
                ? `🟡 SYNC...`
                : syncState.isOnline
                ? (syncState.pendingCount > 0 ? `🟡 SYNC (${syncState.pendingCount})` : `🟢 ONLINE`)
                : `🔴 OFFLINE (${syncState.pendingCount})`}
            </Text>
          </Pressable>

          <View style={styles.clockBadge}>
            <Text style={styles.clockBadgeText}>{liveClockStr}</Text>
          </View>
        </View>
      </View>

      <View style={styles.mainContent}>
        <View style={styles.leftPanel}>
          {/* Mode Sale and Cabang Pills Row */}
          <View style={styles.pillRow}>
            <Pressable
              disabled={isLocked}
              onPress={handleOpenSalesModeModal}
              style={styles.pillBtn}
            >
              <Text style={styles.pillBtnText}>
                {currentSalesMode ? currentSalesMode : 'Mode Sale'}
              </Text>
            </Pressable>

            <Pressable
              disabled={isLocked}
              onPress={handleOpenStoreModal}
              style={styles.pillBtn}
            >
              <Text style={styles.pillBtnText}>
                {cabangBranch || (currentCabang ? parseCabang(currentCabang).branch || currentCabang : 'Cabang')}
              </Text>
            </Pressable>
          </View>

          {/* Search Bar */}
          <View style={styles.searchBarContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Cari menu atau kode..."
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

          {/* Category Bar - Only visible after POS & Cabang selection */}
          {isSelectionComplete && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryBar}>
              {categories.map((cat) => {
                const isActive = activeCategory === cat;
                return (
                  <Pressable
                    key={cat}
                    onPress={() => handleSelectCategory(cat)}
                    style={[
                      styles.categoryPill,
                      isActive ? styles.categoryPillActive : styles.categoryPillInactive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryPillText,
                        isActive && styles.categoryPillTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}

          {/* Conditional Menu Display based on selection */}
          {!isSelectionComplete ? (
            <ScrollView style={{ flex: 1, width: '100%' }} contentContainerStyle={styles.promptBoxContainer}>
              <View style={styles.promptBox}>
                <Text style={styles.promptTitle}>SILAKAN PILIH POS & CABANG</Text>
                <Text style={styles.promptSub}>
                  Pilih Mode Sale dan Cabang terlebih dahulu pada tombol di atas untuk menampilkan daftar menu.
                </Text>
                <View style={styles.promptBtnStack}>
                  <Pressable onPress={handleOpenSalesModeModal} style={styles.promptCtaBtn}>
                    <Text style={styles.promptCtaText}>🍽️ PILIH MODE SALE</Text>
                  </Pressable>
                  <Pressable onPress={handleOpenStoreModal} style={styles.promptCtaBtn}>
                    <Text style={styles.promptCtaText}>📍 PILIH CABANG</Text>
                  </Pressable>
                </View>
              </View>
            </ScrollView>
          ) : filteredMenu.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <View style={styles.emptyStateBox}>
                <Text style={styles.emptyStateTitle}>PRODUK TIDAK DITEMUKAN</Text>
                <Text style={styles.emptyStateSub}>Coba kata kunci lain</Text>
              </View>
            </View>
          ) : (
            <FlatList
              ref={menuFlatListRef}
              key={`${activeCategory}-${numColumns}`}
              data={filteredMenu}
              keyExtractor={item => item.id}
              numColumns={numColumns}
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

        {/* === [NEW/UPDATE RESPONSIVE-ADAPTIVE] === Layar Tablet/Landscape: Split Screen 2/3 & 1/3 Side-by-side */}
        {(isTablet || isLandscape) && (
          <View style={{ flex: cartFlex }}>
            {renderCartPanel()}
          </View>
        )}
      </View>

      {/* === [NEW/UPDATE RESPONSIVE-ADAPTIVE] === Layar HP/iPhone Portrait: Bar Keranjang Melayang di Bawah */}
      {isPhone && !isLandscape && (
        <Pressable
          onPress={() => setIsMobileCartOpen(true)}
          style={styles.mobileFloatingCartBar}
        >
          <View style={styles.mobileFloatingCartLeft}>
            <Text style={styles.mobileFloatingCartIcon}>🛒</Text>
            <Text style={styles.mobileFloatingCartQty}>
              {totalQty} Item
            </Text>
          </View>
          <View style={styles.mobileFloatingCartRight}>
            <Text style={styles.mobileFloatingCartTotal}>
              {formatRp(total)}
            </Text>
            <Text style={styles.mobileFloatingCartCta}>LIHAT KERANJANG ❯</Text>
          </View>
        </Pressable>
      )}

      {/* === [NEW/UPDATE RESPONSIVE-ADAPTIVE] === Bottom Sheet Modal Keranjang untuk Layar HP Portrait */}
      {isPhone && !isLandscape && (
        <Modal
          visible={isMobileCartOpen}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsMobileCartOpen(false)}
        >
          <View style={styles.mobileCartOverlay}>
            <View style={styles.mobileCartContainer}>
              <Pressable
                onPress={() => setIsMobileCartOpen(false)}
                style={styles.mobileCartCloseBar}
              >
                <Text style={styles.mobileCartCloseText}>✕ TUTUP KERANJANG</Text>
              </Pressable>
              {renderCartPanel()}
            </View>
          </View>
        </Modal>
      )}

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
        activeCabang={currentCabang}
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
        initialQueueNumber={orderMeta.queueNumber}
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
                      👤 Pemesan: {bill.customerName || 'Tanpa Nama'}
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

      {/* Modal Diskon Kasir (Label: DISKON) */}
      <Modal visible={isDiscountModalOpen} animationType="fade" transparent onRequestClose={() => setIsDiscountModalOpen(false)}>
        <View style={styles.discModalOverlay}>
          <View style={styles.discModalCard}>
            <View style={[styles.discModalHeader, { backgroundColor: '#000000' }]}>
              <Text style={[styles.discModalTitle, { color: '#FFFFFF' }]}>🏷️ DISKON KASIR</Text>
              <Pressable onPress={() => setIsDiscountModalOpen(false)} style={styles.discCloseBtn}>
                <Text style={styles.discCloseText}>✕</Text>
              </Pressable>
            </View>

            <View style={styles.discModalBody}>
              <Text style={styles.discModalLabel}>MASUKKAN NOMINAL DISKON (RP):</Text>
              <TextInput
                style={styles.discountInputStyle}
                keyboardType="numeric"
                placeholder="Contoh: 10000 (Isi 0 atau kosong jika tidak ada)"
                placeholderTextColor="#999"
                value={discountInputValue}
                onChangeText={setDiscountInputValue}
              />
              <Text style={{ fontSize: 10, color: '#666', marginTop: 4, fontWeight: '700' }}>
                *Diskon ini akan dipisahkan dari Promo Cabang & Voucher Presale.
              </Text>

              <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
                <Pressable
                  onPress={() => {
                    setManualDiscountInput(0);
                    setDiscountInputValue('');
                    setIsDiscountModalOpen(false);
                  }}
                  style={styles.discountResetBtn}
                >
                  <Text style={styles.discountResetBtnText}>KOSONGKAN (RP 0)</Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    const parsed = parseInt(discountInputValue.replace(/[^0-9]/g, ''), 10) || 0;
                    setManualDiscountInput(parsed);
                    setIsDiscountModalOpen(false);
                  }}
                  style={styles.discountConfirmBtn}
                >
                  <Text style={styles.discountConfirmBtnText}>SIMPAN DISKON</Text>
                </Pressable>
              </View>
            </View>
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

          const prefix = 'A';
          const queueNum = `${prefix}-${String(dailyQueueCounter).padStart(3, '0')}`;

          const res = await processCheckout({
            idCabang: currentCabang,
            namaCabang: cabangBrand,
            customerName: orderMeta.customerName,
            queueNumber: orderMeta.queueNumber || queueNum,
            salesMode: currentSalesMode,
            operator: activeUser,
            notes: orderMeta.notes,
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

          const newRecord: CompletedTransactionRecord = {
            id: createdTrxId,
            timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
            queueNumber: queueNum,
            totalAmount: targetPay,
            paymentMethod: isDp ? 'DP 50% TUNAI' : 'TUNAI (CASH)',
            salesMode: currentSalesMode,
            activeUser,
            itemsCount: processedItems.length,
            itemsSummary: processedItems.map(i => `${i.qty}x ${i.name}`).join(', '),
            subtotal,
            promoTotal,
            voucherTotal,
            discountTotal,
            taxAmount,
          };
          setTodaySalesHistory(prev => [newRecord, ...prev]);
          setDailyQueueCounter(prev => prev + 1);
          setManualDiscountInput(0);
          setDiscountInputValue('');

          setCart([]);
          setOrderMeta({ customerName: '', notes: '' });

          Alert.alert(
            isDp ? '📑 PEMBAYARAN DP 50% TUNAI SUCCESS' : '✅ TRANSAKSI TUNAI SUCCESS',
            `ANTREAN: #${queueNum}\nStatus: ${isDp ? 'HALF_PAID (DP 50%)' : 'PAID (LUNAS)'}\nID: ${createdTrxId}\nDibayar: ${formatRp(paidAmount)}\nKembalian: ${formatRp(changeAmount)}${isDp ? `\n\n⚠️ Sisa Tagihan: ${formatRp(remainingBalance || 0)}` : ''}`,
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

          const prefix = 'A';
          const queueNum = `${prefix}-${String(dailyQueueCounter).padStart(3, '0')}`;

          const res = await processCheckout({
            idCabang: currentCabang,
            namaCabang: cabangBrand,
            customerName: orderMeta.customerName,
            queueNumber: orderMeta.queueNumber || queueNum,
            salesMode: currentSalesMode,
            operator: activeUser,
            notes: orderMeta.notes,
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

          const newRecord: CompletedTransactionRecord = {
            id: createdTrxId,
            timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
            queueNumber: queueNum,
            totalAmount: targetPay,
            paymentMethod: isDp ? `DP 50% (${method})` : `NON-TUNAI (${method})`,
            salesMode: currentSalesMode,
            activeUser,
            itemsCount: processedItems.length,
            itemsSummary: processedItems.map(i => `${i.qty}x ${i.name}`).join(', '),
            subtotal,
            promoTotal,
            voucherTotal,
            discountTotal,
            taxAmount,
          };
          setTodaySalesHistory(prev => [newRecord, ...prev]);
          setDailyQueueCounter(prev => prev + 1);
          setManualDiscountInput(0);
          setDiscountInputValue('');

          setCart([]);
          setOrderMeta({ customerName: '', notes: '' });

          Alert.alert(
            isDp ? '📑 PEMBAYARAN DP 50% NON-TUNAI SUCCESS' : '✅ TRANSAKSI NON-TUNAI SUCCESS',
            `ANTREAN: #${queueNum}\nStatus: ${isDp ? 'HALF_PAID (DP 50%)' : 'PAID (LUNAS)'}\nID: ${createdTrxId}\nMetode: ${method}\nNo. Ref: ${refNum}${isDp ? `\n\n⚠️ Sisa Tagihan: ${formatRp(remainingBalance || 0)}` : ''}`,
            [{ text: 'OK / STRUK BARU' }],
          );
        }}
      />

      {/* Customer Display System (CDS) Modal */}
      <Modal visible={isCdsModalOpen} animationType="slide" transparent={false}>
        <View style={{ flex: 1, backgroundColor: '#000000', padding: 24, justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Pressable onPress={() => setIsCdsModalOpen(false)} style={{ backgroundColor: '#FFDD00', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 }}>
              <Text style={{ fontWeight: '900', color: '#000000' }}>← Kembali</Text>
            </Pressable>
            <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: '900' }}>🖥️ CUSTOMER DISPLAY SYSTEM</Text>
            <Text style={{ color: '#FFDD00', fontSize: 14, fontWeight: '900' }}>{cabangBrand.toUpperCase()}</Text>
          </View>

          <View style={{ flexDirection: 'row', flex: 1, gap: 20, marginVertical: 20 }}>
            <View style={{ flex: 1, backgroundColor: '#1A1A1A', borderRadius: 12, padding: 16, borderWidth: 2, borderColor: '#333' }}>
              <Text style={{ color: '#FFDD00', fontWeight: '900', fontSize: 16, marginBottom: 12 }}>🛒 DAFTAR BELANJAAN ANDA</Text>
              <ScrollView>
                {cart.length === 0 ? (
                  <Text style={{ color: '#888', textAlign: 'center', marginTop: 40 }}>Belum ada item pesanan.</Text>
                ) : (
                  cart.map((item, idx) => (
                    <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderColor: '#333' }}>
                      <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 15 }}>{item.qty}x {item.name}</Text>
                      <Text style={{ color: '#FFDD00', fontWeight: '900', fontSize: 15 }}>{formatRp(item.price * item.qty)}</Text>
                    </View>
                  ))
                )}
              </ScrollView>
            </View>

            <View style={{ width: 320, backgroundColor: '#1A1A1A', borderRadius: 12, padding: 20, borderWidth: 2, borderColor: '#FFDD00', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#888', fontSize: 12, fontWeight: '900' }}>TOTAL BAYAR</Text>
              <Text style={{ color: '#FFDD00', fontSize: 32, fontWeight: '900', marginVertical: 10 }}>{formatRp(total)}</Text>
              <Text style={{ color: '#FFF', fontSize: 14, fontWeight: '700' }}>{convertCurrency(total, selectedCurrency).formattedAmount}</Text>
              <View style={{ backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginTop: 20, alignItems: 'center' }}>
                <Text style={{ fontWeight: '900', fontSize: 18, color: '#000' }}>[ SCAN QRIS UNTUK BAYAR ]</Text>
                <Text style={{ fontSize: 11, color: '#666', marginTop: 4 }}>Mendukung GoPay, OVO, ShopeePay, BCA, Mandiri</Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Self-Ordering QR Standee Modal */}
      <Modal visible={isSelfOrderQrOpen} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ width: '100%', maxWidth: 450, backgroundColor: '#FFF', borderRadius: 16, padding: 24, alignItems: 'center', borderWidth: 3, borderColor: '#000' }}>
            <Text style={{ fontSize: 20, fontWeight: '900', marginBottom: 8, color: '#000' }}>📱 SELF-ORDERING QR STANDEE</Text>
            <Text style={{ fontSize: 12, color: '#666', textAlign: 'center', marginBottom: 20 }}>Tampilkan atau cetak QR Standee ini di booth event agar pengunjung dapat men-scan & pesan sendiri dari HP.</Text>

            <View style={{ backgroundColor: '#FFDD00', padding: 20, borderRadius: 16, borderWidth: 3, borderColor: '#000', alignItems: 'center', width: '100%' }}>
              <Text style={{ fontSize: 18, fontWeight: '900', color: '#000' }}>🍨 {cabangBrand.toUpperCase()}</Text>
              <View style={{ backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginVertical: 16, borderWidth: 2, borderColor: '#000' }}>
                <Text style={{ fontSize: 24, fontWeight: '900', color: '#000', letterSpacing: 2 }}>[ QR MENU STANDEE ]</Text>
                <Text style={{ fontSize: 10, color: '#444', textAlign: 'center', marginTop: 4 }}>SCAN UNTUK PESAN TANPA ANTRE</Text>
              </View>
              <Text style={{ fontSize: 12, fontWeight: '900', color: '#000' }}>STAN BOOTH: {currentCabang.toUpperCase()}</Text>
            </View>

            <Pressable onPress={() => setIsSelfOrderQrOpen(false)} style={{ backgroundColor: '#000', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8, marginTop: 20 }}>
              <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 14 }}>← TUTUP STANDEE</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Hamburger Dropdown Menu Modal */}
      <Modal
        transparent
        visible={isMenuDropdownOpen}
        animationType="fade"
        onRequestClose={() => setIsMenuDropdownOpen(false)}
      >
        <Pressable style={styles.menuDropdownOverlay} onPress={() => setIsMenuDropdownOpen(false)}>
          <View style={styles.menuDropdownCard}>
            {isTerveBrand && (
              <Pressable
                style={styles.menuDropdownItem}
                onPress={() => {
                  setIsMenuDropdownOpen(false);
                  setIsKanbanOpen(true);
                }}
              >
                <Text style={styles.menuDropdownItemText}>🖥️ Display Antrean Pesanan</Text>
              </Pressable>
            )}
            <Pressable
              style={styles.menuDropdownItem}
              onPress={() => {
                setIsMenuDropdownOpen(false);
                setIsScanBarcodeModalOpen(true);
              }}
            >
              <Text style={styles.menuDropdownItemText}>📷 Scan Barcode Pembeli</Text>
            </Pressable>
            <Pressable
              style={styles.menuDropdownItem}
              onPress={() => {
                setIsMenuDropdownOpen(false);
                setIsCustomerQrVisible(false);
                setIsCustomerQrModalOpen(true);
              }}
            >
              <Text style={styles.menuDropdownItemText}>📱 HP Pelanggan (Simulasi)</Text>
            </Pressable>
            <Pressable
              style={styles.menuDropdownItem}
              onPress={() => {
                setIsMenuDropdownOpen(false);
                setIsSalesHistoryOpen(true);
              }}
            >
              <Text style={styles.menuDropdownItemText}>📊 Riwayat Transaksi</Text>
            </Pressable>
            <Pressable
              style={styles.menuDropdownItem}
              onPress={() => {
                setIsMenuDropdownOpen(false);
                if (onOpenSetupTerminal) onOpenSetupTerminal();
              }}
            >
              <Text style={styles.menuDropdownItemText}>⚙️ Pengaturan Terminal</Text>
            </Pressable>
            <Pressable
              style={styles.menuDropdownItem}
              onPress={() => {
                setIsMenuDropdownOpen(false);
                if (onTakeBreak) onTakeBreak();
              }}
            >
              <Text style={styles.menuDropdownItemText}>☕ Istirahat / Break</Text>
            </Pressable>
            <Pressable
              style={styles.menuDropdownItemLast}
              onPress={() => {
                setIsMenuDropdownOpen(false);
                if (onEndShift) onEndShift();
              }}
            >
              <Text style={[styles.menuDropdownItemText, { color: '#FF5252' }]}>🔒 Tutup Shift</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* Modal Scanner Barcode Kasir */}
      <Modal visible={isScanBarcodeModalOpen} animationType="fade" transparent onRequestClose={() => setIsScanBarcodeModalOpen(false)}>
        <View style={styles.discModalOverlay}>
          <View style={[styles.discModalCard, { maxWidth: 500 }]}>
            <View style={[styles.discModalHeader, { backgroundColor: '#000000' }]}>
              <Text style={[styles.discModalTitle, { color: '#FFFFFF' }]}>📷 SCAN BARCODE PEMBELI</Text>
              <Pressable onPress={() => setIsScanBarcodeModalOpen(false)} style={styles.discCloseBtn}>
                <Text style={styles.discCloseText}>✕</Text>
              </Pressable>
            </View>

            <View style={{ padding: 20, alignItems: 'center' }}>
              <View style={{ backgroundColor: '#000', padding: 16, borderRadius: 8, width: '100%', alignItems: 'center', marginBottom: 16, borderWidth: 2, borderColor: '#00d084' }}>
                <Text style={{ fontSize: 32, marginBottom: 8 }}>🔍</Text>
                <Text style={{ color: '#00d084', fontWeight: '900', fontSize: 12, letterSpacing: 1 }}>MEMINDAI BARCODE HP PEMBELI...</Text>
                <Text style={{ color: '#aaa', fontSize: 9, marginTop: 4 }}>Arahkan barcode / QR Code dari HP pembeli ke kamera scanner POS</Text>
              </View>

              {scannedOrdersList.length === 0 ? (
                <View style={{ padding: 16, backgroundColor: '#f5f5f5', borderWidth: 2, borderColor: '#999', borderStyle: 'dashed', borderRadius: 8, width: '100%', marginBottom: 16 }}>
                  <Text style={{ fontSize: 11, fontWeight: '900', color: '#666', textAlign: 'center' }}>⚠️ BELUM ADA BARCODE PEMBELI YANG DI-SCAN</Text>
                  <Text style={{ fontSize: 10, color: '#888', textAlign: 'center', marginTop: 4 }}>Gunakan HP Pelanggan untuk memicu scan barcode ke scanner kasir.</Text>
                </View>
              ) : (
                <View style={{ width: '100%', marginBottom: 16 }}>
                  <Text style={{ fontSize: 11, fontWeight: '900', color: '#000', marginBottom: 8 }}>DRAF PESANAN TERPINDAI DARI HP PEMBELI:</Text>
                  {scannedOrdersList.map((o) => (
                    <Pressable
                      key={o.code}
                      onPress={() => {
                        setIsScanBarcodeModalOpen(false);
                        setOrderMeta({ customerName: o.customerName, queueNumber: o.queueNumber, notes: o.notes });
                        setCart(o.items);
                      }}
                      style={{ backgroundColor: '#fff', borderWidth: 2, borderColor: '#000', padding: 12, borderRadius: 8, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 12 }}
                    >
                      <Text style={{ fontSize: 24 }}>📱</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 12, fontWeight: '900', color: '#000' }}>{o.code} ({o.customerName} — {o.queueNumber})</Text>
                        <Text style={{ fontSize: 10, color: '#666' }}>{o.items.map((i: any) => `${i.qty}x ${i.name}`).join(' + ')}</Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              )}

              <View style={{ flexDirection: 'row', gap: 8, width: '100%' }}>
                <TextInput
                  style={{ flex: 1, borderWidth: 2, borderColor: '#000', paddingHorizontal: 12, paddingVertical: 8, fontSize: 12, fontWeight: '700', backgroundColor: '#FFF' }}
                  placeholder="Kode barcode (e.g. ORD-883921)..."
                  placeholderTextColor="#888"
                  value={manualBarcodeInput}
                  onChangeText={setManualBarcodeInput}
                />
                <Pressable
                  onPress={() => {
                    if (!manualBarcodeInput) {
                      Alert.alert('⚠️ Code Kosong', 'Masukkan kode barcode terlebih dahulu!');
                      return;
                    }
                    handleScanCustomerOrder(manualBarcodeInput);
                    setManualBarcodeInput('');
                  }}
                  style={{ backgroundColor: '#000', paddingHorizontal: 16, justifyContent: 'center', borderRadius: 4 }}
                >
                  <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 12 }}>SCAN ➔</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Simulator HP Pelanggan */}
      <Modal visible={isCustomerQrModalOpen} animationType="slide" transparent onRequestClose={() => setIsCustomerQrModalOpen(false)}>
        <View style={styles.discModalOverlay}>
          <View style={[styles.discModalCard, { maxWidth: 420, borderRadius: 16 }]}>
            <View style={[styles.discModalHeader, { backgroundColor: '#000000' }]}>
              <Text style={[styles.discModalTitle, { color: '#FFFFFF' }]}>📱 HP PELANGGAN (SELF-ORDER)</Text>
              <Pressable onPress={() => setIsCustomerQrModalOpen(false)} style={styles.discCloseBtn}>
                <Text style={styles.discCloseText}>✕</Text>
              </Pressable>
            </View>

            <View style={{ padding: 16, alignItems: 'center' }}>
              <Text style={{ fontSize: 13, fontWeight: '900', color: '#000' }}>RINGKASAN PESANAN ANDA</Text>
              <Text style={{ fontSize: 10, color: '#666', marginBottom: 12 }}>Pesanan siap dibayar di kasir</Text>

              {/* 1 Data Dummy Contoh */}
              <View style={{ backgroundColor: '#FFF', borderWidth: 2, borderColor: '#000', padding: 12, borderRadius: 8, width: '100%', marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#ccc', paddingBottom: 6, marginBottom: 6 }}>
                  <Text style={{ fontSize: 11, fontWeight: '900', color: '#000' }}>👤 PEMESAN: SITI RAHMA</Text>
                  <Text style={{ fontSize: 11, fontWeight: '900', color: '#1A3FBB' }}>A-025</Text>
                </View>
                <View style={{ gap: 4 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 10, color: '#000' }}>1x Single Scoop (Cup)</Text>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: '#000' }}>Rp 35.000</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 10, color: '#000' }}>1x Hot Choco</Text>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: '#000' }}>Rp 40.000</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 10, color: '#000' }}>1x Waffle Stick 2 pcs</Text>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: '#000' }}>Rp 40.000</Text>
                  </View>
                  <View style={{ borderTopWidth: 1.5, borderTopColor: '#000', marginTop: 6, paddingTop: 6, flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 11, fontWeight: '900', color: '#000' }}>TOTAL TAGIHAN:</Text>
                    <Text style={{ fontSize: 11, fontWeight: '900', color: '#000' }}>Rp 127.650</Text>
                  </View>
                </View>
              </View>

              {/* Kontainer Barcode/QR (Muncul jika isCustomerQrVisible true) */}
              {isCustomerQrVisible && (
                <View style={{ backgroundColor: '#FFFBEA', borderWidth: 2, borderColor: '#000', padding: 14, borderRadius: 8, width: '100%', alignItems: 'center', marginBottom: 12 }}>
                  <Text style={{ fontSize: 9, fontWeight: '900', color: '#888' }}>BARCODE DRAF PESANAN UNTUK KASIR</Text>
                  <Text style={{ fontSize: 24, fontWeight: '900', color: '#000' }}>A-025</Text>
                  <View style={{ backgroundColor: '#FFF', borderWidth: 2, borderColor: '#000', padding: 8, marginVertical: 8, width: '100%', alignItems: 'center' }}>
                    <Text style={{ fontSize: 28, fontWeight: '900', letterSpacing: 4 }}>║▌║█║▌│║▌║▌█</Text>
                    <Text style={{ fontSize: 11, fontWeight: '900', marginTop: 4 }}>ORD-883921</Text>
                  </View>
                  <Text style={{ fontSize: 9, color: '#555' }}>Tunjukkan barcode ini ke kasir untuk di-scan saat membayar</Text>
                </View>
              )}

              {!isCustomerQrVisible ? (
                <Pressable
                  onPress={() => setIsCustomerQrVisible(true)}
                  style={{ backgroundColor: '#000', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, width: '100%', alignItems: 'center' }}
                >
                  <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 13 }}>📱 TAMPILKAN QR ➔</Text>
                </Pressable>
              ) : (
                <Pressable
                  onPress={() => handleScanCustomerOrder('ORD-883921')}
                  style={{ backgroundColor: '#00d084', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, width: '100%', alignItems: 'center' }}
                >
                  <Text style={{ color: '#000', fontWeight: '900', fontSize: 13 }}>📷 SCAN BARCODE INI KE KASIR ➔</Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9F9' },
  menuDropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    paddingTop: 56,
    paddingLeft: 12,
  },
  menuDropdownCard: {
    backgroundColor: '#000000',
    borderWidth: 2,
    borderColor: '#333333',
    minWidth: 230,
    elevation: 10,
  },
  menuDropdownItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222222',
  },
  menuDropdownItemLast: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuDropdownItemText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  header: {
    height: 52,
    backgroundColor: '#000000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderColor: '#000000',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  hamburgerBtn: { padding: 4 },
  hamburgerIcon: { fontSize: 20, color: '#FFFFFF', fontWeight: '900', marginRight: 4 },
  brandTitle: { fontSize: 16, fontWeight: '900', color: '#FFFFFF', letterSpacing: 1 },
  clockBadge: {
    backgroundColor: '#FFDD00',
    borderWidth: 2,
    borderColor: '#000000',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  clockBadgeText: { fontSize: 11, fontWeight: '900', color: '#000000', fontFamily: 'monospace' },
  syncBadge: {
    borderWidth: 2,
    borderColor: '#000000',
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginRight: 8,
  },
  syncBadgeOnline: { backgroundColor: '#1B5E20' },
  syncBadgePending: { backgroundColor: '#E65100' },
  syncBadgeOffline: { backgroundColor: '#B71C1C' },
  syncBadgeText: { fontSize: 10, fontWeight: '900', color: '#FFFFFF', letterSpacing: 0.5 },
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
  leftPanel: { flex: 0.62, borderRightWidth: 2, borderColor: '#000000', padding: 16, backgroundColor: '#F9F9F9' },
  pillRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  pillBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#000000',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    elevation: 1,
  },
  pillBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000000',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#000000',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
    color: '#333333',
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 13,
    fontWeight: '500',
    color: '#000000',
  },
  searchClearBtn: {
    width: 24,
    height: 24,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchClearBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },

  categoryBar: { maxHeight: 38, marginBottom: 12 },
  categoryPill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#000000',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginRight: 8,
    justifyContent: 'center',
  },
  categoryPillActive: { backgroundColor: '#000000' },
  categoryPillInactive: { backgroundColor: '#FFFFFF' },
  categoryPillText: { fontSize: 12, fontWeight: '700', color: '#000000' },
  categoryPillTextActive: { color: '#FFFFFF', fontWeight: '900' },

  promptBoxContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  promptBox: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#000000',
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  promptTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#000000',
    marginBottom: 8,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  promptSub: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  promptBtnStack: {
    width: '100%',
    gap: 10,
  },
  promptCtaBtn: {
    height: 48,
    backgroundColor: '#000000',
    borderWidth: 2,
    borderColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  promptCtaText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

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
    height: 48,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 2,
    borderColor: '#000000',
    backgroundColor: '#F5F5F5',
  },
  cartTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cartTitle: { fontSize: 14, fontWeight: '900', color: '#000000' },
  draftStatusBadge: {
    backgroundColor: '#FF5722',
    borderWidth: 1.5,
    borderColor: '#000000',
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  draftStatusBadgeText: { fontSize: 8, fontWeight: '900', color: '#FFFFFF' },
  cartHeaderActionRow: { flexDirection: 'row', gap: 6 },
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
    backgroundColor: 'transparent',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  clearBtnText: { color: '#D32F2F', fontSize: 12, fontWeight: '900' },

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

  cartList: { flex: 1, paddingHorizontal: 12 },

  cartFooter: {
    borderTopWidth: 2,
    borderColor: '#000000',
    backgroundColor: '#FFFFFF',
    padding: 14,
  },
  calcRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  calcLabel: { fontSize: 11, fontWeight: '700', color: '#555555' },
  calcVal: { fontSize: 11, fontWeight: '700', color: '#000000', fontFamily: 'monospace' },
  discountLabel: { fontSize: 11, fontWeight: '900', color: '#2E7D32' },
  discountVal: { fontSize: 11, fontWeight: '900', color: '#2E7D32', fontFamily: 'monospace' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1.5,
    borderColor: '#000000',
    paddingTop: 8,
    marginTop: 6,
    marginBottom: 12,
  },
  totalLabel: { fontSize: 13, fontWeight: '900', color: '#000000' },
  totalVal: { fontSize: 17, fontWeight: '900', color: '#000000', fontFamily: 'monospace' },

  payBtnFull: {
    width: '100%',
    height: 52,
    backgroundColor: '#000000',
    borderWidth: 2,
    borderColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  payBtnFullText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  payBtnRow: { flexDirection: 'row', gap: 8 },
  payBtn: {
    flex: 1,
    height: 48,
    borderWidth: 2,
    borderColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  payBtnCash: { backgroundColor: '#000000' },
  payBtnCashText: { fontSize: 13, fontWeight: '900', color: '#FFFFFF' },
  payBtnNonCash: { backgroundColor: '#000000' },
  payBtnNonCashText: { fontSize: 13, fontWeight: '900', color: '#FFFFFF' },
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
  discModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  discModalCard: { width: '90%', maxWidth: 440, backgroundColor: '#FFFFFF', borderWidth: 4, borderColor: '#000000', overflow: 'hidden' },
  discModalHeader: { height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, borderBottomWidth: 3, borderColor: '#000000' },
  discModalTitle: { fontSize: 13, fontWeight: '900', color: '#FFFFFF', letterSpacing: 0.5 },
  discCloseBtn: { width: 28, height: 28, borderWidth: 2, borderColor: '#FFFFFF', backgroundColor: '#FF3B30', justifyContent: 'center', alignItems: 'center' },
  discCloseText: { fontSize: 13, fontWeight: '900', color: '#FFFFFF' },
  discModalBody: { padding: 16 },
  discModalLabel: { fontSize: 11, fontWeight: '900', color: '#000000', letterSpacing: 0.5 },
  discountInputStyle: {
    height: 46,
    borderWidth: 2.5,
    borderColor: '#000000',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: '900',
    fontFamily: 'monospace',
    color: '#000000',
    marginTop: 8,
  },
  discountResetBtn: {
    flex: 1,
    height: 44,
    borderWidth: 2.5,
    borderColor: '#000000',
    backgroundColor: '#EEEEEE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  discountResetBtnText: { fontSize: 11, fontWeight: '900', color: '#000000' },
  discountConfirmBtn: {
    flex: 1,
    height: 44,
    borderWidth: 2.5,
    borderColor: '#000000',
    backgroundColor: '#FFDD00',
    justifyContent: 'center',
    alignItems: 'center',
  },
  discountConfirmBtnText: { fontSize: 11, fontWeight: '900', color: '#000000' },
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

  mobileFloatingCartBar: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    height: 54,
    backgroundColor: '#000000',
    borderWidth: 2.5,
    borderColor: '#000000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    elevation: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  mobileFloatingCartLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mobileFloatingCartIcon: {
    fontSize: 18,
    color: '#FFFFFF',
  },
  mobileFloatingCartQty: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  mobileFloatingCartRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mobileFloatingCartTotal: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFDD00',
    fontFamily: 'monospace',
  },
  mobileFloatingCartCta: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  mobileCartOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  mobileCartContainer: {
    height: '85%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 3,
    borderColor: '#000000',
    overflow: 'hidden',
  },
  mobileCartCloseBar: {
    height: 44,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mobileCartCloseText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});