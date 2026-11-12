export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  operatingHours?: string;
}

export type MenuItemType = 'simple' | 'combo' | 'modifier';

export interface ProductVariant {
  name: string;
  price: number;
  isDefault?: boolean;
  sizeCode?: string;
  sizeName?: string;
  isEnabled?: boolean;
}

export interface ProductAddon {
  name: string;
  price: number;
}

export interface MenuItem {
  productId?: any;
  id: string;
  categoryId: string;
  name: string;
  description: string;
  image: string;
  price: number;
  badge?: 'Popular' | 'Best Seller' | 'New' | null;
  isPopular?: boolean;
  itemType: MenuItemType;
  foodType?: 'veg' | 'non_veg' | 'egg';
  shortcode?: string;
  pricingType?: 'single' | 'variant';
  variants?: ProductVariant[];
  addons?: ProductAddon[];
  isJainAvailable?: boolean;
  modifierGroupIds?: string[];
  modifierGroups?: ModifierGroup[];
  includedToppings?: { groupId: string; optionId: string }[];
  kitchenLabel?: string;
  modifierKitchenLabels?: { groupId: string; kitchenLabel: string }[];
  isOutOfStock?: boolean;
}

export interface ModifierOption {
  id: string;
  name: string;
  image?: string;
  price: number;
  isDefault?: boolean;
  pricesPerSize?: { sizeCode: string; price: number }[];
  availableForSizes?: string[];
  modifierGroups?: ModifierGroup[];
  productId?: string;
  includedToppings?: { groupId: string; optionId: string }[];
}

export interface ModifierGroup {
  id: string;
  name: string;
  required: boolean;
  minSelection: number;
  maxSelection: number;
  freeSelectionLimit?: number;
  displayType: 'radio' | 'checkbox' | 'card';
  options: ModifierOption[];
}

export interface SelectedModifier {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  price: number;
  isRoot?: boolean;
  kitchenLabel?: string;
}

export interface CartItem {
  id: string; // unique composite key (menuItemId + selected option IDs / variant)
  menuItemId: string;
  categoryId?: string;
  categoryName?: string;
  name: string;
  image?: string;
  basePrice: number;
  foodType?: 'veg' | 'non_veg' | 'egg';
  shortcode?: string;
  selectedVariant?: {
    name: string;
    price: number;
  };
  selectedAddons?: {
    name: string;
    price: number;
  }[];
  selectedModifiers: SelectedModifier[];
  quantity: number;
  totalPrice: number; // (basePrice + sum(selectedModifiers.price)) * quantity
  note?: string;
  kitchenLabel?: string;
}
