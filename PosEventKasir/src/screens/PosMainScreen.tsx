import React, { useState, useMemo, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    Pressable,
    ScrollView,
    FlatList,
    Alert,
    Modal,
    TextInput,
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
    CartItemModel,
} from '../services/cartService';
interface MenuItem {
    id: string;
    name: string;
    price: number;
    category: string;
    emoji: string;
}
interface CartItem extends MenuItem {
    qty: number;
}
interface TenantTheme {
    accent: string;
    accentText: string;
    secondary: string;
    secondaryText: string;
    bgPage: string;
    brandLabel: string;
}
interface PosMainScreenProps {
    activeCabang: string;
    activeUser: string;
    salesMode: string;
    onEndShift?: () => void;
    onCabangChange?: (newCabang: string) => void;
    onSalesModeChange?: (newMode: string) => void;
}
export interface StoreBrandOption {
    id: 'gelato' | 'chocolate' | 'papyrus';
    name: string;
    tagline: string;
    emoji: string;
    branches: string[];
}
const STORE_BRANDS_OPTIONS: StoreBrandOption[] = [
    {
        id: 'gelato',
        name: "Let's Go Gelato",
        tagline: 'Premium Italian Gelato',
        emoji: '🍨',
        branches: [
            'Bengawan (Bandung)',
            'Braga (Bandung)',
            'Summarecon Bekasi',
            'Cibinong City Mall (Bogor)',
            'TSM Cibubur (Jakarta)',
        ],
    },
    {
        id: 'chocolate',
        name: 'Terve Chocolate',
        tagline: 'Artisan Bean-to-Bar',
        emoji: '🍫',
        branches: [
            'Bengawan (Bandung)',
            'Braga (Bandung)',
            'KBP (Padalarang)',
        ],
    },
    {
        id: 'papyrus',
        name: 'Papyrus Photo',
        tagline: 'Print & Frame Studio',
        emoji: '📸',
        branches: [
            'Bengawan (Bandung)',
            'Margo City (Depok)',
            'Summarecon Mall Bekasi',
            'Ring Road Utara (Yogyakarta)',
            'Surabaya',
        ],
    },
];
const SALES_MODE_OPTIONS = [
    { id: 'Dine In', label: 'DINE IN', emoji: '🍽️' },
    { id: 'Takeaway', label: 'TAKEAWAY', emoji: '🛍️' },
    { id: 'Event Field Sales', label: 'EVENT FIELD SALES', emoji: '🎪' },
];
const getTenantTheme = (cabang: string): TenantTheme => {
    const lower = cabang.toLowerCase();
    if (lower.includes("let's go gelato") || lower.includes("lets go gelato") || lower.includes('gelato')) {
        return {
            accent: '#FFDD00',
            accentText: '#000000',
            secondary: '#1A3FBB',
            secondaryText: '#FFFFFF',
            bgPage: '#FFFBEA',
            brandLabel: "LET'S GO GELATO",
        };
    }
    if (lower.includes('terve') || lower.includes('chocolate')) {
        return {
            accent: '#5C3317',
            accentText: '#FFFFFF',
            secondary: '#3B1F0A',
            secondaryText: '#F5E6D3',
            bgPage: '#FAF3EC',
            brandLabel: 'TERVE CHOCOLATE',
        };
    }
    if (lower.includes('papyrus') || lower.includes('photo')) {
        return {
            accent: '#000000',
            accentText: '#FFFFFF',
            secondary: '#333333',
            secondaryText: '#FFFFFF',
            bgPage: '#F5F5F5',
            brandLabel: 'PAPYRUS PHOTO',
        };
    }
    return {
        accent: '#000000',
        accentText: '#FFFFFF',
        secondary: '#222222',
        secondaryText: '#FFFFFF',
        bgPage: '#FFFFFF',
        brandLabel: cabang.toUpperCase(),
    };
};
const parseCabang = (cabang: string): { brand: string; branch: string } => {
    const separatorIdx = cabang.indexOf(' - ');
    if (separatorIdx === -1) {
        return { brand: cabang.toUpperCase(), branch: '' };
    }
    return {
        brand: cabang.slice(0, separatorIdx).toUpperCase(),
        branch: cabang.slice(separatorIdx + 3),
    };
};
const MENU_GELATO: MenuItem[] = [
    { id: 'GS1', name: 'Single Scoop', price: 35000, category: 'Gelato', emoji: '🍨' },
    { id: 'GS2', name: 'Double Scoop', price: 55000, category: 'Gelato', emoji: '🍨' },
    { id: 'GS3', name: 'Triple Scoop', price: 75000, category: 'Gelato', emoji: '🍨' },
    { id: 'GS4', name: 'Gelato Cup S', price: 30000, category: 'Gelato', emoji: '🥄' },
    { id: 'GS5', name: 'Gelato Cup M', price: 45000, category: 'Gelato', emoji: '🥄' },
    { id: 'GW1', name: 'Waffle Cone', price: 50000, category: 'Waffle', emoji: '🧇' },
    { id: 'GW2', name: 'Waffle Stick 2 pcs', price: 40000, category: 'Waffle', emoji: '🧇' },
    { id: 'GW3', name: 'Waffle Stick 4 pcs', price: 70000, category: 'Waffle', emoji: '🧇' },
    { id: 'GD1', name: 'Gelato Shake', price: 55000, category: 'Minuman', emoji: '🥤' },
    { id: 'GD2', name: 'Affogato', price: 60000, category: 'Minuman', emoji: '☕' },
    { id: 'GD3', name: 'Soda Italiano', price: 35000, category: 'Minuman', emoji: '🍹' },
    { id: 'GP1', name: 'Paket Couple', price: 99000, category: 'Paket', emoji: '💑' },
    { id: 'GP2', name: 'Paket Family', price: 175000, category: 'Paket', emoji: '👨‍👩‍👧‍👦' },
];
const MENU_CHOCOLATE: MenuItem[] = [
    { id: 'CB1', name: 'Dark Choco 70%', price: 55000, category: 'Batang', emoji: '🍫' },
    { id: 'CB2', name: 'Milk Choco', price: 45000, category: 'Batang', emoji: '🍫' },
    { id: 'CB3', name: 'White Choco', price: 45000, category: 'Batang', emoji: '🍫' },
    { id: 'CB4', name: 'Ruby Choco', price: 65000, category: 'Batang', emoji: '🍫' },
    { id: 'CD1', name: 'Hot Choco', price: 40000, category: 'Minuman', emoji: '☕' },
    { id: 'CD2', name: 'Iced Choco', price: 42000, category: 'Minuman', emoji: '🥤' },
    { id: 'CD3', name: 'Choco Float', price: 50000, category: 'Minuman', emoji: '🍹' },
    { id: 'CD4', name: 'Mocca Blend', price: 48000, category: 'Minuman', emoji: '☕' },
    { id: 'CP1', name: 'Praline Box 9', price: 85000, category: 'Praline', emoji: '🎁' },
    { id: 'CP2', name: 'Praline Box 16', price: 145000, category: 'Praline', emoji: '🎁' },
    { id: 'CP3', name: 'Truffle Assorted', price: 110000, category: 'Praline', emoji: '🍬' },
    { id: 'CGP1', name: 'Gift Set Regular', price: 175000, category: 'Paket', emoji: '📦' },
    { id: 'CGP2', name: 'Gift Set Premium', price: 320000, category: 'Paket', emoji: '📦' },
];
const MENU_PAPYRUS: MenuItem[] = [
    { id: 'PP1', name: 'Print 4R', price: 10000, category: 'Cetak', emoji: '🖨️' },
    { id: 'PP2', name: 'Print 5R', price: 15000, category: 'Cetak', emoji: '🖨️' },
    { id: 'PP3', name: 'Print A4', price: 25000, category: 'Cetak', emoji: '🖨️' },
    { id: 'PP4', name: 'Print Canvas 20x30', price: 120000, category: 'Cetak', emoji: '🖼️' },
    { id: 'PF1', name: 'Frame Kayu 4R', price: 45000, category: 'Frame', emoji: '🖼️' },
    { id: 'PF2', name: 'Frame Akrilik 5R', price: 65000, category: 'Frame', emoji: '🖼️' },
    { id: 'PF3', name: 'Frame Premium A4', price: 95000, category: 'Frame', emoji: '🖼️' },
    { id: 'PB1', name: 'Booth Strip 2 pcs', price: 50000, category: 'Booth', emoji: '📸' },
    { id: 'PB2', name: 'Booth Strip 4 pcs', price: 90000, category: 'Booth', emoji: '📸' },
    { id: 'PB3', name: 'Booth Polaroid', price: 35000, category: 'Booth', emoji: '📸' },
    { id: 'PA1', name: 'Album Foto S', price: 85000, category: 'Aksesori', emoji: '📒' },
    { id: 'PA2', name: 'Gantungan Kunci Foto', price: 30000, category: 'Aksesori', emoji: '🔑' },
    { id: 'PA3', name: 'Mug Foto', price: 75000, category: 'Aksesori', emoji: '☕' },
];
const getMenuData = (cabang: string): MenuItem[] => {
    const lower = cabang.toLowerCase();
    if (lower.includes("let's go gelato") || lower.includes('lets go gelato') || lower.includes('gelato')) return MENU_GELATO;
    if (lower.includes('terve') || lower.includes('chocolate')) return MENU_CHOCOLATE;
    if (lower.includes('papyrus') || lower.includes('photo')) return MENU_PAPYRUS;
    return MENU_GELATO;
};
const formatRp = (n: number): string =>
    'Rp ' + n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const HatchedDisabledOverlay = ({ label }: { label?: string }) => (
    <View style={styles.hatchedOverlay} pointerEvents="none">
        <Text style={styles.hatchedPatternText}>
            \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
        </Text>
        <View style={styles.lockedBadge}>
            <Text style={styles.lockedBadgeText}>🔒 {label || 'DIKUNCI'}</Text>
        </View>
    </View>
);
const MenuCard = ({
    item,
    theme,
    cartQty,
    onPress,
}: {
    item: MenuItem;
    theme: TenantTheme;
    cartQty?: number;
    onPress: (item: MenuItem) => void;
}) => (
    <Pressable
        onPress={() => onPress(item)}
        style={({ pressed }) => [
            styles.menuCard,
            pressed ? styles.menuCardPressed : styles.menuCardUnpressed,
        ]}
    >
        {cartQty && cartQty > 0 ? (
            <View style={[styles.itemQtyBadge, { backgroundColor: theme.accent }]}>
                <Text style={[styles.itemQtyBadgeText, { color: theme.accentText }]}>
                    {cartQty}
                </Text>
            </View>
        ) : null}
        <Text style={styles.menuEmoji}>{item.emoji}</Text>
        <Text style={styles.menuName} numberOfLines={2}>{item.name}</Text>
        <View style={[styles.menuPriceBadge, { backgroundColor: theme.accent }]}>
            <Text style={[styles.menuPriceText, { color: theme.accentText }]}>
                {formatRp(item.price)}
            </Text>
        </View>
    </Pressable>
);
const CartRow = ({
    item,
    theme,
    onIncrease,
    onDecrease,
    onRemove,
}: {
    item: CartItemModel;
    theme: TenantTheme;
    onIncrease: (id: string) => void;
    onDecrease: (id: string) => void;
    onRemove: (id: string) => void;
}) => (
    <View style={[styles.cartRow, item.isFreeBonus && styles.freeBonusRow]}>
        <View style={styles.cartRowInfo}>
            <Text style={styles.cartItemEmoji}>{item.emoji || '📦'}</Text>
            <View style={styles.cartItemDetail}>
                <Text style={styles.cartItemName} numberOfLines={1}>
                    {item.name} {item.isFreeBonus ? '(BONUS)' : ''}
                </Text>
                <Text style={[styles.cartItemPrice, item.isFreeBonus && styles.freeBonusText]}>
                    {item.isFreeBonus ? 'GRATIS Rp0' : formatRp(item.price)}
                </Text>
            </View>
        </View>
        {!item.isFreeBonus && (
            <View style={styles.cartRowControls}>
                {}
                <Pressable
                    onPress={() => onDecrease(item.id)}
                    style={({ pressed }) => [
                        styles.qtyBtn,
                        pressed ? styles.qtyBtnPressed : styles.qtyBtnUnpressed,
                    ]}
                >
                    <Text style={styles.qtyBtnText}>−</Text>
                </Pressable>
                <View style={[styles.qtyDisplay, { backgroundColor: theme.accent }]}>
                    <Text style={[styles.qtyText, { color: theme.accentText }]}>{item.qty}</Text>
                </View>
                {}
                <Pressable
                    onPress={() => onIncrease(item.id)}
                    style={({ pressed }) => [
                        styles.qtyBtn,
                        { backgroundColor: theme.accent },
                        pressed ? styles.qtyBtnPressed : styles.qtyBtnUnpressed,
                    ]}
                >
                    <Text style={[styles.qtyBtnText, { color: theme.accentText }]}>+</Text>
                </Pressable>
                {}
                <Pressable
                    onPress={() => onRemove(item.id)}
                    style={({ pressed }) => [
                        styles.removeBtn,
                        pressed ? styles.qtyBtnPressed : styles.qtyBtnUnpressed,
                    ]}
                >
                    <Text style={styles.removeBtnText}>✕</Text>
                </Pressable>
            </View>
        )}
    </View>
);
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
            'Apakah Anda yakin ingin menghapus seluruh item dari draf keranjang ini? Aksi ini akan mengosongkan draf dan membuka kembali selector Toko/Cabang.',
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
    return (
        <View style={[styles.root, { backgroundColor: theme.bgPage }]}>
            {}
            {}
            {}
            <View style={[styles.headerBar, { backgroundColor: theme.secondary }]}>
                {}
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
                {}
                <View style={styles.headerRight}>
                    <Pressable
                        onPress={() => {
                            if (syncState.isOnline) {
                                syncManager.triggerManualSync();
                            } else {
                                Alert.alert('⚡ OFFLINE', 'Perangkat tidak terhubung ke internet. Draf transaksi akan otomatis di-sync saat online.');
                            }
                        }}
                        style={[
                            styles.syncBadge,
                            syncState.status === 'SYNCING'
                                ? styles.syncBadgeSyncing
                                : !syncState.isOnline
                                ? styles.syncBadgeOffline
                                : syncState.pendingCount > 0
                                ? styles.syncBadgePending
                                : styles.syncBadgeOnline,
                        ]}
                    >
                        <Text style={styles.syncBadgeText}>
                            {syncState.status === 'SYNCING'
                                ? '🔄 SYNCING...'
                                : !syncState.isOnline
                                ? '⚡ OFFLINE'
                                : syncState.pendingCount > 0
                                ? `🔄 ${syncState.pendingCount} PENDING`
                                : '🌐 ONLINE'}
                        </Text>
                    </Pressable>
                    <View style={styles.headerBadge}>
                        <Text style={styles.headerBadgeText}>👤 {activeUser.toUpperCase()}</Text>
                    </View>
                    {}
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
                    {}
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
            {}
            {isLocked && (
                <View style={styles.lockBannerStrip}>
                    <Text style={styles.lockBannerText}>
                        🔒 POS-B-04: SELECTOR TOKO, CABANG & SALES MODE DIKUNCI SELAMA KERANJANG TERISI ({cart.length} ITEM)
                    </Text>
                </View>
            )}
            {}
            {}
            {}
            <View style={styles.mainContent}>
                {}
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
                {}
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
                        {}
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
            {}
            {}
            {}
            <Modal
                transparent
                visible={isStoreBranchModalOpen}
                animationType="fade"
                onRequestClose={() => setIsStoreBranchModalOpen(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalShadow} />
                    <View style={styles.modalCard}>
                        {}
                        <View style={[styles.modalHeader, { backgroundColor: '#000000' }]}>
                            <Text style={[styles.modalHeaderText, { color: '#FFFFFF' }]}>
                                🏢 UBAH TOKO & CABANG
                            </Text>
                            <Pressable
                                onPress={() => setIsStoreBranchModalOpen(false)}
                                style={styles.closeBtn}
                            >
                                <Text style={styles.closeBtnText}>✕</Text>
                            </Pressable>
                        </View>
                        <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                            {}
                            <Text style={styles.modalSectionLabel}>1. PILIH BRAND TOKO</Text>
                            <View style={styles.storePickerStack}>
                                {STORE_BRANDS_OPTIONS.map((store) => {
                                    const isSelected = modalSelectedStore.id === store.id;
                                    return (
                                        <Pressable
                                            key={store.id}
                                            onPress={() => {
                                                setModalSelectedStore(store);
                                                setModalSelectedBranch(store.branches[0]);
                                            }}
                                            style={[
                                                styles.storeOptionCard,
                                                isSelected ? styles.storeOptionSelected : styles.storeOptionUnselected,
                                            ]}
                                        >
                                            <Text style={styles.storeOptionEmoji}>{store.emoji}</Text>
                                            <View style={styles.storeOptionInfo}>
                                                <Text style={styles.storeOptionName}>{store.name.toUpperCase()}</Text>
                                                <Text style={styles.storeOptionTagline}>{store.tagline}</Text>
                                            </View>
                                            {isSelected && <Text style={styles.storeOptionCheck}>✓</Text>}
                                        </Pressable>
                                    );
                                })}
                            </View>
                            {}
                            <Text style={[styles.modalSectionLabel, { marginTop: 16 }]}>2. PILIH CABANG</Text>
                            <View style={styles.branchPickerGrid}>
                                {modalSelectedStore.branches.map((branch) => {
                                    const isSelected = modalSelectedBranch === branch;
                                    return (
                                        <Pressable
                                            key={branch}
                                            onPress={() => setModalSelectedBranch(branch)}
                                            style={[
                                                styles.branchPickerPill,
                                                isSelected ? styles.branchPickerPillSelected : styles.branchPickerPillUnselected,
                                            ]}
                                        >
                                            <Text style={[styles.branchPickerPillText, isSelected && { color: '#FFF' }]}>
                                                {branch} {isSelected ? '✓' : ''}
                                            </Text>
                                        </Pressable>
                                    );
                                })}
                            </View>
                            {}
                            <View style={styles.storeBranchPreviewBox}>
                                <Text style={styles.previewLabel}>KONFIRMASI LOKASI TERPILIH:</Text>
                                <Text style={styles.previewValue}>
                                    {modalSelectedStore.name} — {modalSelectedBranch}
                                </Text>
                            </View>
                            {}
                            <View style={styles.modalActionsRow}>
                                <Pressable
                                    onPress={() => setIsStoreBranchModalOpen(false)}
                                    style={styles.cancelBtnModal}
                                >
                                    <Text style={styles.cancelBtnModalText}>BATAL</Text>
                                </Pressable>
                                <Pressable
                                    onPress={handleConfirmStoreBranchChange}
                                    style={styles.confirmBtnModal}
                                >
                                    <Text style={styles.confirmBtnModalText}>TERAPKAN CABANG ➔</Text>
                                </Pressable>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
            {}
            {}
            {}
            <Modal
                transparent
                visible={isSalesModeModalOpen}
                animationType="fade"
                onRequestClose={() => setIsSalesModeModalOpen(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalShadow} />
                    <View style={styles.modalCard}>
                        <View style={[styles.modalHeader, { backgroundColor: '#000000' }]}>
                            <Text style={[styles.modalHeaderText, { color: '#FFFFFF' }]}>
                                🏷️ UBAH SALES MODE
                            </Text>
                            <Pressable
                                onPress={() => setIsSalesModeModalOpen(false)}
                                style={styles.closeBtn}
                            >
                                <Text style={styles.closeBtnText}>✕</Text>
                            </Pressable>
                        </View>
                        <View style={styles.modalBody}>
                            <Text style={styles.modalSectionLabel}>PILIH MODE PENJUALAN:</Text>
                            <View style={styles.salesModeStack}>
                                {SALES_MODE_OPTIONS.map((mode) => {
                                    const isSelected = currentSalesMode.toLowerCase() === mode.id.toLowerCase();
                                    return (
                                        <Pressable
                                            key={mode.id}
                                            onPress={() => handleSelectSalesMode(mode.id)}
                                            style={[
                                                styles.salesModeCard,
                                                isSelected ? styles.salesModeCardSelected : styles.salesModeCardUnselected,
                                            ]}
                                        >
                                            <Text style={styles.salesModeEmoji}>{mode.emoji}</Text>
                                            <Text style={[styles.salesModeLabel, isSelected && { color: '#FFF' }]}>
                                                {mode.label}
                                            </Text>
                                            {isSelected && <Text style={styles.salesModeCheck}>✓ AKTIF</Text>}
                                        </Pressable>
                                    );
                                })}
                            </View>
                            <Pressable
                                onPress={() => setIsSalesModeModalOpen(false)}
                                style={[styles.cancelBtnModal, { marginTop: 16 }]}
                            >
                                <Text style={styles.cancelBtnModalText}>TUTUP</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>
            {}
            {}
            {}
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
                    setCart([]);
                    Alert.alert(
                        res.mode === 'OFFLINE' ? '⚡ TRANSAKSI DISIMPAN OFFLINE (SQLITE DRAFT)' : '✅ TRANSAKSI SERTIFIKASI BERHASIL',
                        `Mode: ${res.mode}\nTotal: ${formatRp(total)}\nTunai: ${formatRp(paidAmount)}\nKembalian: ${formatRp(changeAmount)}`,
                        [{ text: 'STRUK BARU', onPress: () => setCart([]) }],
                    );
                }}
            />
            {}
            {}
            {}
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
const HatchingPatternBackground = () => (
    <View style={styles.hatchedBgWrapper} pointerEvents="none">
        <Text style={styles.hatchedBgText}>
            \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
        </Text>
    </View>
);
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
    hatchedBgWrapper: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(220, 220, 220, 0.65)',
        zIndex: 1,
    },
    hatchedBgText: {
        color: 'rgba(0, 0, 0, 0.15)',
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 2,
        transform: [{ rotate: '-12deg' }, { scale: 1.5 }],
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
    menuCard: {
        flex: 1,
        borderWidth: 3,
        borderColor: '#000000',
        backgroundColor: '#FFFFFF',
        padding: 10,
        alignItems: 'center',
        minHeight: 110,
        justifyContent: 'space-between',
        margin: 0,
    },
    menuCardUnpressed: {
        transform: [{ translateX: -3 }, { translateY: -3 }],
        shadowColor: '#000000',
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 0,
        elevation: 5,
    },
    menuCardPressed: { transform: [{ translateX: 0 }, { translateY: 0 }], elevation: 0 },
    menuEmoji: { fontSize: 26, marginBottom: 4 },
    menuName: {
        fontSize: 11,
        fontWeight: '800',
        color: '#000000',
        textAlign: 'center',
        lineHeight: 14,
    },
    menuPriceBadge: {
        marginTop: 6,
        borderWidth: 2,
        borderColor: '#000000',
        paddingHorizontal: 6,
        paddingVertical: 2,
        alignSelf: 'stretch',
        alignItems: 'center',
    },
    menuPriceText: { fontSize: 10, fontWeight: '900' },
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
    cartList: { flex: 1 },
    cartRow: {
        borderBottomWidth: 2,
        borderBottomColor: '#000000',
        paddingHorizontal: 10,
        paddingVertical: 8,
        backgroundColor: '#FFFFFF',
    },
    cartRowInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    cartItemEmoji: { fontSize: 18, marginRight: 8 },
    cartItemDetail: { flex: 1 },
    cartItemName: { fontSize: 12, fontWeight: '800', color: '#000000' },
    cartItemPrice: { fontSize: 11, fontWeight: '700', color: '#555555', marginTop: 1 },
    cartRowControls: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    qtyBtn: {
        width: 28,
        height: 28,
        borderWidth: 2.5,
        borderColor: '#000000',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    qtyBtnText: { fontSize: 15, fontWeight: '900', color: '#000000', lineHeight: 17 },
    qtyDisplay: {
        width: 32,
        height: 28,
        borderWidth: 2.5,
        borderColor: '#000000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    qtyText: { fontSize: 13, fontWeight: '900' },
    removeBtn: {
        width: 28,
        height: 28,
        borderWidth: 2.5,
        borderColor: '#000000',
        backgroundColor: '#FF3B30',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 4,
    },
    removeBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
    cartTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    cartHeaderBadge: {
        borderWidth: 2,
        borderColor: '#000000',
        paddingHorizontal: 6,
        paddingVertical: 1,
    },
    cartHeaderBadgeText: { fontSize: 10, fontWeight: '900' },
    itemQtyBadge: {
        position: 'absolute',
        top: -6,
        right: -6,
        borderWidth: 2.5,
        borderColor: '#000000',
        paddingHorizontal: 7,
        paddingVertical: 2,
        zIndex: 10,
        elevation: 6,
        shadowColor: '#000000',
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 0,
    },
    itemQtyBadgeText: { fontSize: 11, fontWeight: '900' },
    qtyBtnUnpressed: {
        transform: [{ translateX: -1 }, { translateY: -1 }],
        shadowColor: '#000000',
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 0,
        elevation: 3,
    },
    qtyBtnPressed: {
        transform: [{ translateX: 0 }, { translateY: 0 }],
        elevation: 0,
    },
    freeBonusRow: { backgroundColor: '#FFFDE0' },
    freeBonusText: { color: '#2E7D32', fontWeight: '900' },
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
    storePickerStack: { gap: 10 },
    storeOptionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderWidth: 3,
        borderColor: '#000000',
    },
    storeOptionUnselected: {
        backgroundColor: '#FFFFFF',
    },
    storeOptionSelected: {
        backgroundColor: '#FFDD00',
        transform: [{ translateX: -2 }, { translateY: -2 }],
        shadowColor: '#000000',
        shadowOffset: { width: 3, height: 3 },
        shadowOpacity: 1,
        shadowRadius: 0,
        elevation: 4,
    },
    storeOptionEmoji: { fontSize: 24, marginRight: 12 },
    storeOptionInfo: { flex: 1 },
    storeOptionName: { fontSize: 13, fontWeight: '900', color: '#000000' },
    storeOptionTagline: { fontSize: 10, fontWeight: '700', color: '#555555' },
    storeOptionCheck: { fontSize: 18, fontWeight: '900', color: '#000000' },
    branchPickerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    branchPickerPill: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderWidth: 2.5,
        borderColor: '#000000',
    },
    branchPickerPillUnselected: {
        backgroundColor: '#FFFFFF',
    },
    branchPickerPillSelected: {
        backgroundColor: '#000000',
    },
    branchPickerPillText: { fontSize: 11, fontWeight: '800', color: '#000000' },
    storeBranchPreviewBox: {
        marginTop: 16,
        padding: 12,
        borderWidth: 3,
        borderColor: '#000000',
        backgroundColor: '#FFFBEA',
    },
    previewLabel: { fontSize: 9, fontWeight: '900', color: '#666666', letterSpacing: 0.5 },
    previewValue: { fontSize: 13, fontWeight: '900', color: '#000000', marginTop: 2 },
    modalActionsRow: { flexDirection: 'row', gap: 10, marginTop: 18 },
    cancelBtnModal: {
        flex: 1,
        height: 46,
        borderWidth: 3,
        borderColor: '#000000',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    cancelBtnModalText: { fontSize: 12, fontWeight: '900', color: '#000000' },
    confirmBtnModal: {
        flex: 2,
        height: 46,
        borderWidth: 3,
        borderColor: '#000000',
        backgroundColor: '#FFDD00',
        justifyContent: 'center',
        alignItems: 'center',
    },
    confirmBtnModalText: { fontSize: 12, fontWeight: '900', color: '#000000', letterSpacing: 0.5 },
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
    salesModeLabel: { flex: 1, fontSize: 13, fontWeight: '900', color: '#000000', letterSpacing: 0.5 },
    salesModeCheck: { fontSize: 11, fontWeight: '900', color: '#FFDD00' },
    hatchedOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(215, 215, 215, 0.75)',
        zIndex: 10,
    },
    hatchedPatternText: {
        color: 'rgba(0, 0, 0, 0.12)',
        fontSize: 18,
        fontWeight: '900',
        letterSpacing: 3,
        transform: [{ rotate: '-15deg' }, { scale: 1.8 }],
    },
    lockedBadge: {
        backgroundColor: '#000000',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderWidth: 1.5,
        borderColor: '#FF3B30',
    },
    lockedBadgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    syncBadge: {
        paddingHorizontal: 8,
        paddingVertical: 5,
        borderWidth: 2.5,
        borderColor: '#000000',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 6,
    },
    syncBadgeOnline: {
        backgroundColor: '#00E676',
    },
    syncBadgeOffline: {
        backgroundColor: '#FF9500',
    },
    syncBadgeSyncing: {
        backgroundColor: '#00E5FF',
    },
    syncBadgePending: {
        backgroundColor: '#FFDD00',
    },
    syncBadgeText: {
        fontSize: 9,
        fontWeight: '900',
        color: '#000000',
        letterSpacing: 0.5,
    },
});