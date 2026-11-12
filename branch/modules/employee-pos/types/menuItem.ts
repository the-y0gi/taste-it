import { ModifierGroup } from './modifier';

export type MenuItemType = 'simple' | 'combo' | 'modifier';

export interface ProductVariant {
  name?: string;
  sizeCode?: string;
  sizeName?: string;
  price: number;
  isDefault?: boolean;
  isEnabled?: boolean;
}

export interface MenuItemAddon {
  name: string;
  price: number;
  isEnabled?: boolean;
}

export interface MenuItem {
  productId?: any;
  _id?: string;
  id: string;
  categoryId: string;
  name: string;
  shortcode?: string;
  foodType?: 'veg' | 'non_veg' | 'egg';
  isJainAvailable?: boolean;
  pricingType?: 'single' | 'variant';
  description: string;
  image: string;
  price: number;
  badge?: 'Popular' | 'Best Seller' | 'New' | null;
  isPopular?: boolean;
  itemType: MenuItemType;
  hasVariants?: boolean;
  isHalfAndHalf?: boolean;
  variants?: ProductVariant[];
  addons?: MenuItemAddon[];
  includedToppings?: { groupId: string; optionId: string }[];
  modifierGroupIds?: string[];
  modifierGroups?: ModifierGroup[];
  kitchenLabel?: string;
  modifierKitchenLabels?: { groupId: string; kitchenLabel: string }[];
  modifierSizeCodes?: { groupId: string; sizeCode: string }[];
  displayOrder?: number;
  isOutOfStock?: boolean;
  branchId?: string | null;
}
