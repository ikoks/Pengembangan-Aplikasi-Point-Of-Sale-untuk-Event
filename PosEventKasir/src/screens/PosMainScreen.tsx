import React, { useState, useMemo } from 'react';
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
}


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

const MenuCard = ({
    item,
    theme,
    onPress,
}: {
    item: MenuItem;
    theme: TenantTheme;
    onPress: (item: MenuItem) => void;
}) => (
    <Pressable
        onPress={() => onPress(item)}
        style={({ pressed }) => [
            styles.menuCard,
            pressed ? styles.menuCardPressed : styles.menuCardUnpressed,
        ]}
    >
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
    item: CartItem;
    theme: TenantTheme;
    onIncrease: (id: string) => void;
    onDecrease: (id: string) => void;
    onRemove: (id: string) => void;
}) => (
    <View style={styles.cartRow}>
        <View style={styles.cartRowInfo}>
            <Text style={styles.cartItemEmoji}>{item.emoji}</Text>
            <View style={styles.cartItemDetail}>
                <Text style={styles.cartItemName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.cartItemPrice}>{formatRp(item.price)}</Text>
            </View>
        </View>
        <View style={styles.cartRowControls}>
            <Pressable onPress={() => onDecrease(item.id)} style={styles.qtyBtn}>
                <Text style={styles.qtyBtnText}>−</Text>
            </Pressable>
            <View style={[styles.qtyDisplay, { backgroundColor: theme.accent }]}>
                <Text style={[styles.qtyText, { color: theme.accentText }]}>{item.qty}</Text>
            </View>
            <Pressable onPress={() => onIncrease(item.id)} style={[styles.qtyBtn, { backgroundColor: theme.accent }]}>
                <Text style={[styles.qtyBtnText, { color: theme.accentText }]}>+</Text>
            </Pressable>
            <Pressable onPress={() => onRemove(item.id)} style={styles.removeBtn}>
                <Text style={styles.removeBtnText}>✕</Text>
            </Pressable>
        </View>
    </View>
);

export default function PosMainScreen({
    activeCabang,
    activeUser,
    salesMode,
    onEndShift,
}: PosMainScreenProps) {
    const theme = useMemo(() => getTenantTheme(activeCabang), [activeCabang]);
    const allMenuItems = useMemo(() => getMenuData(activeCabang), [activeCabang]);

    const categories = useMemo(() => {
        const cats = Array.from(new Set(allMenuItems.map(m => m.category)));
        return ['SEMUA', ...cats];
    }, [allMenuItems]);

    const [activeCategory, setActiveCategory] = useState<string>('SEMUA');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isCashModalOpen, setIsCashModalOpen] = useState<boolean>(false);
    const [isNonCashModalOpen, setIsNonCashModalOpen] = useState<boolean>(false);

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

    const subtotal = useMemo(() => cart.reduce((sum, i) => sum + i.price * i.qty, 0), [cart]);
    const tax = Math.round(subtotal * 0.11);
    const total = subtotal + tax;
    const totalQty = useMemo(() => cart.reduce((sum, i) => sum + i.qty, 0), [cart]);

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
            if (item.qty <= 1) return prev.filter(c => c.id !== id);
            return prev.map(c => c.id === id ? { ...c, qty: c.qty - 1 } : c);
        });
    };

    const removeItem = (id: string) => {
        setCart(prev => prev.filter(c => c.id !== id));
    };

    const clearCart = () => {
        Alert.alert(
            '⚠️ HAPUS KERANJANG',
            'Semua item akan dihapus. Lanjutkan?',
            [
                { text: 'BATAL', style: 'cancel' },
                { text: 'HAPUS SEMUA', style: 'destructive', onPress: () => setCart([]) },
            ],
        );
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

            {/* TOP HEADER BAR */}
            <View style={[styles.headerBar, { backgroundColor: theme.secondary }]}>
                <View style={styles.headerLeft}>
                    <Text style={[styles.headerBrand, { color: theme.secondaryText }]}>{theme.brandLabel}</Text>
                    <Text style={[styles.headerSub, { color: theme.secondaryText }]}>
                        {activeCabang.split(' - ')[1] || activeCabang}
                    </Text>
                </View>
                <View style={styles.headerRight}>
                    <View style={styles.headerBadge}>
                        <Text style={styles.headerBadgeText}>👤 {activeUser.toUpperCase()}</Text>
                    </View>
                    <View style={[styles.headerBadge, { backgroundColor: theme.accent }]}>
                        <Text style={[styles.headerBadgeText, { color: theme.accentText }]}>
                            {salesMode.toUpperCase()}
                        </Text>
                    </View>
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

            {/* MAIN CONTENT: SPLIT LAYOUT */}
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
                                <MenuCard item={item} theme={theme} onPress={addToCart} />
                            )}
                        />
                    )}
                </View>

                {/* KOLOM KANAN: Keranjang + Checkout */}
                <View style={styles.rightPanel}>
                    <View style={[styles.cartHeader, { backgroundColor: theme.secondary }]}>
                        <Text style={[styles.cartTitle, { color: theme.secondaryText }]}>🛒 KERANJANG</Text>
                        {cart.length > 0 && (
                            <Pressable onPress={clearCart} style={styles.clearBtn}>
                                <Text style={styles.clearBtnText}>HAPUS SEMUA</Text>
                            </Pressable>
                        )}
                    </View>

                    {cart.length === 0 ? (
                        <View style={styles.emptyCart}>
                            <Text style={styles.emptyCartIcon}>🛒</Text>
                            <Text style={styles.emptyCartText}>Keranjang masih kosong.</Text>
                            <Text style={styles.emptyCartSub}>Pilih menu di sebelah kiri.</Text>
                        </View>
                    ) : (
                        <ScrollView style={styles.cartList} showsVerticalScrollIndicator={false}>
                            {cart.map(item => (
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
                        <View style={styles.calcRow}>
                            <Text style={styles.calcLabel}>PPN 11%</Text>
                            <Text style={styles.calcValue}>{formatRp(tax)}</Text>
                        </View>
                        <View style={styles.calcRow}>
                            <Text style={styles.calcLabel}>QTY ITEM</Text>
                            <Text style={styles.calcValue}>{totalQty} pcs</Text>
                        </View>
                        <View style={[styles.totalBox, { backgroundColor: theme.accent }]}>
                            <Text style={[styles.totalLabel, { color: theme.accentText }]}>TOTAL</Text>
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

            {/* MODAL PEMBAYARAN TUNAI */}
            <PaymentCashScreen
                isVisible={isCashModalOpen}
                totalAmount={total}
                onClose={() => setIsCashModalOpen(false)}
                onSuccessPayment={async (paidAmount, changeAmount) => {
                    setIsCashModalOpen(false);
                    const res = await processCheckout({
                        items: cart.map(i => ({ productId: i.id, name: i.name, quantity: i.qty, price: i.price, subtotal: i.price * i.qty })),
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

            {/* MODAL PEMBAYARAN NON-TUNAI */}
            <PaymentNonCashScreen
                isVisible={isNonCashModalOpen}
                totalAmount={total}
                onClose={() => setIsNonCashModalOpen(false)}
                onSuccessPayment={async (method, refNum) => {
                    setIsNonCashModalOpen(false);
                    const res = await processCheckout({
                        items: cart.map(i => ({ productId: i.id, name: i.name, quantity: i.qty, price: i.price, subtotal: i.price * i.qty })),
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

// ─────────────────────────────────────────────
//  STYLES (Neo-Brutalist)
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
    root: { flex: 1 },

    btnUnpressed: {
        transform: [{ translateX: -4 }, { translateY: -4 }],
        shadowColor: '#000',
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 0,
        elevation: 5,
    },
    btnPressed: {
        transform: [{ translateX: 0 }, { translateY: 0 }],
        elevation: 0,
    },

    // Header
    headerBar: {
        height: 52,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        borderBottomWidth: 4,
        borderBottomColor: '#000',
    },
    headerLeft: { flexDirection: 'column' },
    headerBrand: { fontSize: 14, fontWeight: '900', letterSpacing: 1 },
    headerSub: { fontSize: 10, fontWeight: '700', opacity: 0.75 },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    headerBadge: {
        borderWidth: 2,
        borderColor: '#000',
        backgroundColor: '#FFF',
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    headerBadgeText: { fontSize: 10, fontWeight: '900', color: '#000', letterSpacing: 0.5 },
    endShiftBtn: { borderWidth: 2, borderColor: '#FFF', paddingHorizontal: 10, paddingVertical: 4 },
    endShiftText: { color: '#FFF', fontSize: 10, fontWeight: '900' },

    // Layout
    mainContent: { flex: 1, flexDirection: 'row' },
    leftPanel: { flex: 3, borderRightWidth: 4, borderRightColor: '#000' },

    // Kategori
    categoryScroll: {
        borderBottomWidth: 3,
        borderBottomColor: '#000',
        maxHeight: 52,
        backgroundColor: '#FFF',
    },
    categoryScrollContent: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        gap: 8,
        alignItems: 'center',
    },
    categoryTab: { paddingHorizontal: 14, paddingVertical: 6, borderWidth: 2.5, borderColor: '#000' },
    categoryTabActive: {
        transform: [{ translateX: -2 }, { translateY: -2 }],
        shadowColor: '#000',
        shadowOffset: { width: 3, height: 3 },
        shadowOpacity: 1,
        shadowRadius: 0,
        elevation: 4,
    },
    categoryTabInactive: { backgroundColor: '#FFF' },
    categoryTabText: { fontSize: 11, fontWeight: '900', color: '#000', letterSpacing: 0.5 },

    // Grid Menu
    menuGrid: { padding: 12 },
    menuGridRow: { gap: 10, marginBottom: 10 },
    menuCard: {
        flex: 1,
        borderWidth: 3,
        borderColor: '#000',
        backgroundColor: '#FFF',
        padding: 10,
        alignItems: 'center',
        minHeight: 110,
        justifyContent: 'space-between',
        margin: 0,
    },
    menuCardUnpressed: {
        transform: [{ translateX: -3 }, { translateY: -3 }],
        shadowColor: '#000',
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
        color: '#000',
        textAlign: 'center',
        lineHeight: 14,
    },
    menuPriceBadge: {
        marginTop: 6,
        borderWidth: 2,
        borderColor: '#000',
        paddingHorizontal: 6,
        paddingVertical: 2,
        alignSelf: 'stretch',
        alignItems: 'center',
    },
    menuPriceText: { fontSize: 10, fontWeight: '900' },
    emptyMenu: { flex: 1, alignItems: 'center', padding: 40 },
    emptyMenuText: {
        fontSize: 14,
        fontWeight: '900',
        color: '#999',
        borderWidth: 2,
        borderColor: '#CCC',
        paddingHorizontal: 16,
        paddingVertical: 8,
    },

    // Search
    searchContainer: {
        padding: 12,
        borderBottomWidth: 4,
        borderBottomColor: '#000',
    },
    searchInput: {
        height: 48,
        borderWidth: 4,
        borderColor: '#000',
        backgroundColor: '#FFF',
        paddingHorizontal: 16,
        fontSize: 14,
        fontWeight: '800',
        color: '#000',
        transform: [{ translateX: -4 }, { translateY: -4 }],
        shadowColor: '#000',
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 0,
        elevation: 5,
    },

    // Empty State
    emptyStateContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    emptyStateBox: {
        borderWidth: 4,
        borderColor: '#000',
        borderStyle: 'dashed',
        backgroundColor: '#FFF',
        padding: 24,
        alignItems: 'center',
        transform: [{ translateX: -4 }, { translateY: -4 }],
        shadowColor: '#000',
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 0,
        elevation: 5,
    },
    emptyStateTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#000',
        marginBottom: 8,
        textAlign: 'center',
    },
    emptyStateSub: {
        fontSize: 12,
        fontWeight: '700',
        color: '#555',
        textAlign: 'center',
    },

    // Keranjang
    rightPanel: { flex: 2, flexDirection: 'column', borderLeftWidth: 0 },
    cartHeader: {
        height: 48,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        borderBottomWidth: 3,
        borderBottomColor: '#000',
    },
    cartTitle: { fontSize: 14, fontWeight: '900', letterSpacing: 1 },
    clearBtn: { borderWidth: 2, borderColor: '#FFF', paddingHorizontal: 8, paddingVertical: 3 },
    clearBtnText: { color: '#FFF', fontSize: 10, fontWeight: '900' },
    emptyCart: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
    emptyCartIcon: { fontSize: 40, marginBottom: 12, opacity: 0.25 },
    emptyCartText: { fontSize: 13, fontWeight: '800', color: '#999', textAlign: 'center' },
    emptyCartSub: { fontSize: 11, fontWeight: '600', color: '#BBB', marginTop: 4, textAlign: 'center' },
    cartList: { flex: 1 },

    // Cart Row
    cartRow: {
        borderBottomWidth: 2,
        borderBottomColor: '#000',
        paddingHorizontal: 10,
        paddingVertical: 8,
        backgroundColor: '#FFF',
    },
    cartRowInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    cartItemEmoji: { fontSize: 18, marginRight: 8 },
    cartItemDetail: { flex: 1 },
    cartItemName: { fontSize: 12, fontWeight: '800', color: '#000' },
    cartItemPrice: { fontSize: 11, fontWeight: '700', color: '#555', marginTop: 1 },
    cartRowControls: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    qtyBtn: {
        width: 28,
        height: 28,
        borderWidth: 2.5,
        borderColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFF',
    },
    qtyBtnText: { fontSize: 15, fontWeight: '900', color: '#000', lineHeight: 17 },
    qtyDisplay: {
        width: 32,
        height: 28,
        borderWidth: 2.5,
        borderColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    qtyText: { fontSize: 13, fontWeight: '900' },
    removeBtn: {
        width: 28,
        height: 28,
        borderWidth: 2.5,
        borderColor: '#000',
        backgroundColor: '#FF3B30',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 4,
    },
    removeBtnText: { color: '#FFF', fontSize: 11, fontWeight: '900' },

    // Checkout
    checkoutPanel: {
        paddingHorizontal: 12,
        paddingBottom: 12,
        paddingTop: 10,
        borderTopWidth: 4,
        borderTopColor: '#000',
        backgroundColor: '#FFF',
    },
    calcRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    calcLabel: { fontSize: 11, fontWeight: '700', color: '#555', letterSpacing: 0.5 },
    calcValue: { fontSize: 11, fontWeight: '800', color: '#000' },
    totalBox: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#000',
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
        borderColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    payBtnUnpressed: {
        transform: [{ translateX: -4 }, { translateY: -4 }],
        shadowColor: '#000',
        shadowOffset: { width: 5, height: 5 },
        shadowOpacity: 1,
        shadowRadius: 0,
        elevation: 6,
    },
    payBtnPressed: {
        backgroundColor: '#222',
        transform: [{ translateX: 0 }, { translateY: 0 }],
        elevation: 0,
    },
    payBtnText: { fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },

    // Modal
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
        maxWidth: 460,
        height: '85%',
        backgroundColor: '#000',
        transform: [{ translateX: 8 }, { translateY: 8 }],
    },
    modalCard: {
        width: '90%',
        maxWidth: 460,
        backgroundColor: '#FFF',
        borderWidth: 4,
        borderColor: '#000',
        overflow: 'hidden',
    },
    modalHeader: {
        height: 48,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        borderBottomWidth: 4,
        borderBottomColor: '#000',
    },
    modalHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    closeBtn: {
        width: 32,
        height: 32,
        borderWidth: 3,
        borderColor: '#000',
        backgroundColor: '#FF3B30',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeBtnText: {
        fontSize: 14,
        fontWeight: '900',
        color: '#FFF',
    },
    windowDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)',
    },
    modalHeaderText: { fontSize: 11, fontWeight: '900', letterSpacing: 1, marginLeft: 4 },
    modalBody: { padding: 16 },
    modalSummaryBox: {
        borderWidth: 3,
        borderColor: '#000',
        padding: 12,
        marginBottom: 14,
        backgroundColor: '#F5F5F5',
    },
    modalSummaryLabel: { fontSize: 10, fontWeight: '900', color: '#555', letterSpacing: 1, marginBottom: 4 },
    modalSummaryTotal: { fontSize: 28, fontWeight: '900', color: '#000', letterSpacing: -1 },
    modalLabel: { fontSize: 10, fontWeight: '900', color: '#000', letterSpacing: 1, marginBottom: 8 },
    quickCashRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    quickCashBtn: {
        borderWidth: 2.5,
        borderColor: '#000',
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#FFF',
        marginBottom: 4,
    },
    quickCashText: { fontSize: 12, fontWeight: '800', color: '#000' },
    cashDisplayBox: {
        height: 52,
        borderWidth: 3,
        borderColor: '#000',
        justifyContent: 'center',
        paddingHorizontal: 14,
        backgroundColor: '#FFFDE0',
        marginBottom: 12,
    },
    cashDisplayText: { fontSize: 22, fontWeight: '900', color: '#000' },
    numpad: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
    numpadKey: {
        width: '30%',
        flexGrow: 1,
        height: 48,
        borderWidth: 3,
        borderColor: '#000',
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    numpadKeyText: { fontSize: 17, fontWeight: '900', color: '#000' },
    kembalianBox: {
        borderWidth: 3,
        borderColor: '#000',
        padding: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    kembalianLabel: { fontSize: 12, fontWeight: '900', color: '#000' },
    kembalianValue: { fontSize: 16, fontWeight: '900', color: '#000' },
    modalActions: { flexDirection: 'row', gap: 10 },
    cancelBtn: {
        height: 50,
        borderWidth: 3.5,
        borderColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        backgroundColor: '#FFF',
    },
    cancelBtnText: { fontSize: 13, fontWeight: '900', color: '#000' },
    confirmBtnBase: {
        height: 50,
        borderWidth: 3.5,
        borderColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    confirmBtnText: { fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
});
