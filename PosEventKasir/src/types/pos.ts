

export interface ModifierOption {
  id: string;
  name: string;
  price: number;
}

export interface ModifierGroup {
  id: string;
  name: string;
  minSelect?: number;
  maxSelect?: number;
  options: ModifierOption[];
}

export interface SelectedModifier {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  price: number;
}

export interface BundleOption {
  id: string;
  name: string;
  extraPrice?: number;
  stockDeductItemId?: string;
}

export interface BundleGroup {
  id: string;
  name: string;
  minSelect?: number;
  maxSelect?: number;
  options: BundleOption[];
}

export interface SelectedBundleItem {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  extraPrice?: number;
  stockDeductItemId?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  branchPrices?: Record<string, number>;
  category: string;
  emoji: string;
  stockQuantity?: number;
  isAvailable?: boolean;
  modifierGroups?: ModifierGroup[];
  bundleGroups?: BundleGroup[];
  isBundle?: boolean;
  itemNotes?: string;
}

export interface CartItem extends MenuItem {
  qty: number;
  isFreeBonus?: boolean;
  selectedModifiers?: SelectedModifier[];
  selectedBundleItems?: SelectedBundleItem[];
  uniqueCartId?: string;
  itemNotes?: string;
}

export interface OrderMeta {
  customerName?: string;
  queueNumber?: string;
  notes?: string;
}

export interface HeldBill {
  id: string;
  holdTime: string;
  cart: CartItem[];
  customerName?: string;
  notes?: string;
  totalAmount: number;
}

export type PaymentMode = 'FULL' | 'DP_50';
export type PaymentStatus = 'PAID' | 'HALF_PAID' | 'HELD' | 'VOIDED' | 'UNPAID';

export type KanbanOrderStatus = 'PENDING' | 'IN_PROGRESS' | 'EDITING' | 'READY' | 'COMPLETED';

export interface KanbanOrder {
  id: string;
  orderTime: string;
  customerName: string;
  items: CartItem[];
  status: KanbanOrderStatus;
  storeBrand: string;
  notes?: string;
}

export interface VoucherPresaleData {
  voucherCode: string;
  customerName: string;
  items: CartItem[];
  isPrepaid: boolean;
  dpAmount?: number;
  remainingBalance?: number;
  storeBrand: string;
}

export interface TenantTheme {
  accent: string;
  accentText: string;
  secondary: string;
  secondaryText: string;
  bgPage: string;
  brandLabel: string;
}

export interface StoreBrandOption {
  id: 'gelato' | 'chocolate';
  name: string;
  tagline: string;
  emoji: string;
  branches: string[];
}

export interface SalesModeOption {
  id: string;
  label: string;
  emoji: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface PromoRule {
  id: string;
  name: string;
  type: 'DISCOUNT_PERCENT' | 'DISCOUNT_NOMINAL' | 'FREE_ITEM';
  value: number;
  scope: 'TOTAL_SPEND' | 'SPECIFIC_ITEM';
  minSpend?: number;
  targetItemId?: string;
  freeItemId?: string;
  freeItemName?: string;
  freeItemEmoji?: string;
  startTime?: string;
  endTime?: string;
  branchIds: string[];
  salesModes: string[];
}

export type CurrencyCode = 'IDR' | 'USD' | 'SGD';

export interface ExchangeRate {
  code: CurrencyCode;
  symbol: string;
  rateToIDR: number;
}

export interface WasteLogItem {
  id: string;
  idCabang: string;
  namaMenu: string;
  qty: number;
  alasan: string;
  operator: string;
  createdAt: string;
}

export interface BookingAppointment {
  id: string;
  idCabang: string;
  customerName: string;
  phone: string;
  bookingDate: string;
  timeSlot: string;
  dpAmount: number;
  status: 'CONFIRMED' | 'PENDING' | 'CANCELLED' | 'COMPLETED';
  createdAt: string;
}

export interface AuditLogItem {
  id: string;
  actionType: 'VOID_ORDER' | 'MANUAL_DISCOUNT' | 'PRICE_OVERRIDE' | 'SHIFT_OPEN' | 'SHIFT_CLOSE' | 'WASTE_ENTRY';
  description: string;
  operator: string;
  createdAt: string;
}
