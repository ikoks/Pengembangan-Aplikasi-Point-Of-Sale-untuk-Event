
import { MenuItem, ModifierGroup } from '../types/pos';

export const GELATO_FLAVOR_OPTIONS = [
  { id: 'flv_choco', name: 'Dark Belgian Chocolate', price: 0, isPopular: true, emoji: '🍫' },
  { id: 'flv_vanilla', name: 'Madagascar Vanilla', price: 0, isPopular: true, emoji: '🍦' },
  { id: 'flv_matcha', name: 'Uji Kyoto Matcha', price: 5000, isPopular: true, emoji: '🍵' },
  { id: 'flv_strawberry', name: 'Wild Strawberry Sorbet', price: 0, isPopular: true, emoji: '🍓' },
  { id: 'flv_pistachio', name: 'Bronte Pistachio', price: 5000, isPopular: true, emoji: '🥜' },
  { id: 'flv_mango', name: 'Alphonso Mango Sorbet', price: 0, isPopular: false, emoji: '🥭' },
  { id: 'flv_cookies', name: 'Cookies & Cream', price: 0, isPopular: false, emoji: '🍪' },
  { id: 'flv_salted_caramel', name: 'Salted Caramel Butter', price: 0, isPopular: false, emoji: '🍮' },
];

export const TERVE_SUGAR_LEVEL_GROUP = {
  id: 'grp_terve_sugar',
  name: 'LEVEL GULA (SUGAR LEVEL)',
  minSelect: 1,
  maxSelect: 1,
  options: [
    { id: 'sug_100', name: 'Normal Sugar (100%)', price: 0 },
    { id: 'sug_50', name: 'Less Sugar (50%)', price: 0 },
    { id: 'sug_25', name: 'Slight Sugar (25%)', price: 0 },
    { id: 'sug_0', name: 'No Sugar (0%)', price: 0 },
  ],
};

export const TERVE_ICE_LEVEL_GROUP = {
  id: 'grp_terve_ice',
  name: 'LEVEL ES (ICE LEVEL)',
  minSelect: 1,
  maxSelect: 1,
  options: [
    { id: 'ice_norm', name: 'Normal Ice', price: 0 },
    { id: 'ice_less', name: 'Less Ice', price: 0 },
    { id: 'ice_no', name: 'No Ice (Tanpa Es)', price: 0 },
    { id: 'ice_hot', name: 'Hot Drink (Panas)', price: 0 },
  ],
};

export const MENU_GELATO: MenuItem[] = [
  {
    id: 'GS1',
    name: 'Single Scoop (Cup/Cone)',
    price: 35000,
    branchPrices: { bengawan: 35000, braga: 38000, summarecon: 40000 },
    category: 'Gelato',
    emoji: '🍨',
    stockQuantity: 45,
    isAvailable: true,
    modifierGroups: [
      {
        id: 'grp_flavor_1',
        name: 'PILIH RASA GELATO (1 Rasa)',
        minSelect: 1,
        maxSelect: 1,
        options: GELATO_FLAVOR_OPTIONS,
      },
      {
        id: 'grp_container',
        name: 'WADAH GELATO',
        minSelect: 1,
        maxSelect: 1,
        options: [
          { id: 'cnt_cup', name: 'Paper Cup', price: 0 },
          { id: 'cnt_cone', name: 'Waffle Cone', price: 5000 },
        ],
      },
    ],
  },
  {
    id: 'GS2',
    name: 'Double Scoop (2 Rasa)',
    price: 55000,
    branchPrices: { bengawan: 55000, braga: 58000, summarecon: 60000 },
    category: 'Gelato',
    emoji: '🍨',
    stockQuantity: 30,
    isAvailable: true,
    modifierGroups: [
      {
        id: 'grp_flavor_2',
        name: 'PILIH 2 RASA GELATO',
        minSelect: 2,
        maxSelect: 2,
        options: GELATO_FLAVOR_OPTIONS,
      },
      {
        id: 'grp_container',
        name: 'WADAH GELATO',
        minSelect: 1,
        maxSelect: 1,
        options: [
          { id: 'cnt_cup', name: 'Paper Cup', price: 0 },
          { id: 'cnt_cone', name: 'Waffle Cone (+Rp 5.000)', price: 5000 },
        ],
      },
    ],
  },
  {
    id: 'GS3',
    name: 'Triple Scoop (3 Rasa)',
    price: 75000,
    category: 'Gelato',
    emoji: '🍨',
    stockQuantity: 20,
    isAvailable: true,
    modifierGroups: [
      {
        id: 'grp_flavor_3',
        name: 'PILIH 3 RASA GELATO',
        minSelect: 3,
        maxSelect: 3,
        options: GELATO_FLAVOR_OPTIONS,
      },
    ],
  },
  {
    id: 'GS4',
    name: 'Party Tub (4-6 Rasa)',
    price: 165000,
    category: 'Gelato',
    emoji: '🪣',
    stockQuantity: 10,
    isAvailable: true,
    modifierGroups: [
      {
        id: 'grp_flavor_6',
        name: 'PILIH RASA GELATO (Hingga 6 Rasa)',
        minSelect: 4,
        maxSelect: 6,
        options: GELATO_FLAVOR_OPTIONS,
      },
      {
        id: 'grp_extra_topping',
        name: 'EXTRA TOPPING & CONE',
        minSelect: 0,
        maxSelect: 3,
        options: [
          { id: 'ext_cone', name: 'Extra Waffle Cone', price: 5000 },
          { id: 'ext_chocochip', name: 'Choco Chips', price: 3000 },
          { id: 'ext_almond', name: 'Slivered Almonds', price: 7000 },
        ],
      },
    ],
  },
  {
    id: 'GW1',
    name: 'Waffle Cone Special (2 Rasa + Extra)',
    price: 50000,
    category: 'Waffle',
    emoji: '🧇',
    stockQuantity: 15,
    isAvailable: true,
    modifierGroups: [
      {
        id: 'grp_flavor_cone',
        name: 'PILIH 2 RASA',
        minSelect: 2,
        maxSelect: 2,
        options: GELATO_FLAVOR_OPTIONS,
      },
      {
        id: 'grp_cone_extra',
        name: 'EXTRA CONE & SAUCE',
        minSelect: 0,
        maxSelect: 2,
        options: [
          { id: 'ext_cone_add', name: 'Extra Cone Cadangan', price: 5000 },
          { id: 'ext_sauce_nutella', name: 'Drizzle Nutella', price: 8000 },
        ],
      },
    ],
  },
  {
    id: 'GD1',
    name: 'Gelato Shake Signature',
    price: 55000,
    category: 'Minuman',
    emoji: '🥤',
    stockQuantity: 25,
    isAvailable: true,
    modifierGroups: [
      {
        id: 'grp_shake_base',
        name: 'BASIS RASA GELATO',
        minSelect: 1,
        maxSelect: 1,
        options: GELATO_FLAVOR_OPTIONS,
      },
    ],
  },
  {
    id: 'GD2',
    name: 'Affogato Al Caffe',
    price: 60000,
    category: 'Minuman',
    emoji: '☕',
    stockQuantity: 0,
    isAvailable: false,
    modifierGroups: [],
  },
  {
    id: 'GP1',
    name: 'Paket Event Combo Gelato',
    price: 99000,
    category: 'Paket',
    emoji: '💑',
    stockQuantity: 12,
    isAvailable: true,
    modifierGroups: [
      {
        id: 'grp_combo_1',
        name: 'RASA GELATO 1',
        minSelect: 1,
        maxSelect: 1,
        options: GELATO_FLAVOR_OPTIONS,
      },
      {
        id: 'grp_combo_2',
        name: 'RASA GELATO 2',
        minSelect: 1,
        maxSelect: 1,
        options: GELATO_FLAVOR_OPTIONS,
      },
    ],
  },
];

export const MENU_CHOCOLATE: MenuItem[] = [
  {
    id: 'CB1',
    name: 'Dark Choco 70% Single Origin',
    price: 55000,
    branchPrices: { bengawan: 55000, braga: 58000 },
    category: 'Minuman',
    emoji: '🍫',
    stockQuantity: 35,
    isAvailable: true,
    modifierGroups: [
      {
        id: 'grp_sugar',
        name: 'LEVEL MANIS (SUGAR)',
        minSelect: 1,
        maxSelect: 1,
        options: [
          { id: 'sug_100', name: 'Normal Sugar (100%)', price: 0 },
          { id: 'sug_50', name: 'Less Sugar (50%)', price: 0 },
          { id: 'sug_0', name: 'No Sugar (0%)', price: 0 },
        ],
      },
      {
        id: 'grp_ice',
        name: 'LEVEL ES (ICE)',
        minSelect: 1,
        maxSelect: 1,
        options: [
          { id: 'ice_norm', name: 'Normal Ice', price: 0 },
          { id: 'ice_less', name: 'Less Ice', price: 0 },
          { id: 'ice_no', name: 'Hot Drink (Panas)', price: 0 },
        ],
      },
      {
        id: 'grp_addons',
        name: 'ADD-ONS & LEVELING',
        minSelect: 0,
        maxSelect: 3,
        options: [
          { id: 'add_espresso', name: 'Extra Espresso Shot', price: 10000 },
          { id: 'add_oat', name: 'Sub Oat Milk (Dairy Free)', price: 12000 },
          { id: 'add_whip', name: 'Whipped Cream + Choco Drizzle', price: 8000 },
        ],
      },
    ],
  },
  {
    id: 'CD2',
    name: 'Artisan Iced Chocolate',
    price: 42000,
    category: 'Minuman',
    emoji: '🥤',
    stockQuantity: 50,
    isAvailable: true,
    modifierGroups: [
      {
        id: 'grp_sugar',
        name: 'LEVEL MANIS',
        minSelect: 1,
        maxSelect: 1,
        options: [
          { id: 'sug_100', name: 'Normal Sugar', price: 0 },
          { id: 'sug_50', name: 'Less Sugar', price: 0 },
        ],
      },
      {
        id: 'grp_addons',
        name: 'ADD-ONS',
        minSelect: 0,
        maxSelect: 2,
        options: [
          { id: 'add_oat', name: 'Sub Oat Milk', price: 12000 },
          { id: 'add_marshmallow', name: 'Topping Toasted Marshmallow', price: 7000 },
        ],
      },
    ],
  },
  {
    id: 'CD4',
    name: 'Mocca Blend Special',
    price: 48000,
    category: 'Minuman',
    emoji: '☕',
    stockQuantity: 0,
    isAvailable: false,
    modifierGroups: [],
  },
  {
    id: 'CP1',
    name: 'Praline Box 9 Assorted',
    price: 85000,
    category: 'Praline',
    emoji: '🎁',
    stockQuantity: 8,
    isAvailable: true,
    modifierGroups: [],
  },
];

export const getIsolatedMenuByCabang = (cabang: string): MenuItem[] => {
  const lower = cabang.toLowerCase();
  let selectedCatalog: MenuItem[] = MENU_GELATO;

  if (lower.includes('terve') || lower.includes('chocolate')) {
    selectedCatalog = MENU_CHOCOLATE;
  } else {
    selectedCatalog = MENU_GELATO;
  }

  return selectedCatalog.map((item) => {
    if (item.branchPrices) {
      const matchedKey = Object.keys(item.branchPrices).find((k) => lower.includes(k.toLowerCase()));
      if (matchedKey) {
        return {
          ...item,
          price: item.branchPrices[matchedKey],
        };
      }
    }
    return item;
  });
};
