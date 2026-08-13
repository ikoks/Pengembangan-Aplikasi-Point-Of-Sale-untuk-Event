import { MenuItem, ModifierGroup } from '../types/pos';

export const GELATO_FLAVOR_OPTIONS: any[] = [];
export const TERVE_SUGAR_LEVEL_GROUP: ModifierGroup | null = null;
export const TERVE_ICE_LEVEL_GROUP: ModifierGroup | null = null;

export const MENU_GELATO: MenuItem[] = [];
export const MENU_CHOCOLATE: MenuItem[] = [];
export const MENU_BENGAWAN_ISOLATED: MenuItem[] = [];
export const MENU_BRAGA_ISOLATED: MenuItem[] = [];

export const getIsolatedMenuByCabang = (cabangName: string): MenuItem[] => {
  return [];
};
