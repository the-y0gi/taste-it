import { SelectedModifier } from './modifier';

export interface CartItem {
  id: string; // unique composite key (menuItemId + optionIds joined)
  menuItemId: string;
  categoryId?: string;
  categoryName?: string;
  name: string;
  shortcode?: string;
  foodType?: 'veg' | 'non_veg' | 'egg';
  image?: string;
  basePrice: number;
  selectedVariant?: {
    name: string;
    price: number;
  };
  selectedSize?: {
    sizeCode: string;
    sizeName: string;
    price: number;
  };
  selectedAddons?: {
    name: string;
    price: number;
  }[];
  selectedModifiers: SelectedModifier[];
  quantity: number;
  totalPrice: number; // (basePrice + sum of modifier prices) * quantity
  note?: string;
  kitchenLabel?: string;
}
