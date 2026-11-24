import { create } from "zustand";
import toast from "react-hot-toast";
import axios from "axios";
import {
  MenuItem,
  SelectedModifier,
  CartItem,
  CustomerInfo,
  VehicleInfo,
  TableInfo,
  Order,
  Category,
  SplitPayment,
  PromoApplied,
} from "../types";

interface PosState {
  // ── Menu / Category ─────────────────────────────────────────
  selectedCategory: string;
  foodTypeFilter: "all" | "veg" | "non_veg" | "egg";
  search: string;
  sortBy: string;
  categories: Category[];
  menuItems: MenuItem[];
  loadingMenu: boolean;

  // ── Order Type & Context ─────────────────────────────────────
  orderType: "takeout" | "delivery" | "drive-through" | "dine-in";
  selectedTable: TableInfo | null;
  selectedCustomer: CustomerInfo | null;
  selectedVehicle: VehicleInfo | null;

  // ── Cart ─────────────────────────────────────────────────────
  cartItems: CartItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  currentOrderSeq: number;
  branchTaxFees: {
    deliveryFee: number;
    gstTaxRate: number;
    pstTaxRate: number;
    hstTaxRate: number;
  };

  // ── Checkout Modal ───────────────────────────────────────────
  checkoutOpen: boolean;

  // ── Payment ──────────────────────────────────────────────────
  paymentTiming: "pay-now" | "pay-later";
  paymentType: "one-time" | "split";
  paymentMethod: "cash" | "card" | "credit" | "debit" | "upi";
  splitPayments: SplitPayment[];
  cashDenominations: Record<number, number>;
  cashGiven: number;
  changeAmount: number;

  // ── Order Details ────────────────────────────────────────────
  orderSource: "pos" | "online" | "doordash" | "skip" | "ubereats" | "zomato" | "swiggy";
  aggregatorOrderId: string;
  upiProvider: string;
  upiRefNumber: string;
  whatsappReceipt: boolean;
  orderTiming: "now" | "later";
  scheduledAt: string | null;
  orderNotes: string;
  skipLastDigits: string;

  // ── Promo / Discount ─────────────────────────────────────────
  appliedPromo: PromoApplied | null;
  manualDiscountType: "percentage" | "flat" | null;
  manualDiscountValue: number;

  // ── Orders ───────────────────────────────────────────────────
  currentOrder: Order | null;
  orders: Order[];
  placingOrder: boolean;
  nextOrderNumber: string;

  // ── Editing Existing Order ──────────────────────────────────
  editingOrderId: string | null;
  editingOrderNumber: string | null;
  updatingOrder: boolean;

  // ── Actions ──────────────────────────────────────────────────
  setCategory: (category: string) => void;
  setFoodTypeFilter: (filter: "all" | "veg" | "non_veg" | "egg") => void;
  setSearch: (query: string) => void;
  setSort: (sort: string) => void;
  setOrderType: (
    type: "takeout" | "delivery" | "drive-through" | "dine-in",
  ) => void;
  setCustomer: (customer: CustomerInfo | null) => void;
  setTable: (table: TableInfo | null) => void;
  setVehicle: (vehicle: VehicleInfo | null) => void;
  addToCart: (
    menuItem: MenuItem,
    selectedModifiers: SelectedModifier[],
    quantity?: number,
    note?: string,
    variant?: { name: string; price: number },
    addons?: { name: string; price: number }[],
  ) => void;
  addVariantToCart: (
    menuItem: MenuItem,
    variant: { name: string; price: number },
  ) => void;
  removeFromCart: (cartItemId: string) => void;
  increaseQuantity: (cartItemId: string) => void;
  decreaseQuantity: (cartItemId: string) => void;
  updateCartItem: (
    originalCartItemId: string,
    menuItem: MenuItem,
    selectedModifiers: SelectedModifier[],
    quantity: number,
    note: string,
  ) => void;
  clearCart: () => void;
  calculateTotals: () => void;
  openCheckout: () => void;
  closeCheckout: () => void;
  resetCheckoutState: () => void;
  setPaymentTiming: (timing: "pay-now" | "pay-later") => void;
  setPaymentType: (type: "one-time" | "split") => void;
  setPaymentMethod: (method: "cash" | "card" | "credit" | "debit" | "upi") => void;
  setCashDenomination: (denom: number, qty: number) => void;
  setCashGiven: (amount: number) => void;
  addSplitPayment: (payment: SplitPayment) => void;
  updateSplitPayment: (index: number, payment: SplitPayment) => void;
  removeSplitPayment: (index: number) => void;
  setOrderSource: (
    source: "pos" | "online" | "doordash" | "skip" | "ubereats" | "zomato" | "swiggy",
  ) => void;
  setAggregatorOrderId: (id: string) => void;
  setUpiProvider: (provider: string) => void;
  setUpiRefNumber: (ref: string) => void;
  setWhatsappReceipt: (send: boolean) => void;
  setOrderTiming: (timing: "now" | "later") => void;
  setScheduledAt: (date: string | null) => void;
  setOrderNotes: (notes: string) => void;
  setSkipLastDigits: (digits: string) => void;
  applyPromo: (promo: PromoApplied) => void;
  applyManualDiscount: (type: "percentage" | "flat", value: number) => void;
  removeDiscount: () => void;
  placeOrder: () => Promise<Order | null>;
  loadOrderForEditing: (order: Order) => void;
  cancelEditingOrder: () => void;
  updateOrder: () => Promise<Order | null>;
  fetchMenu: () => Promise<void>;
  fetchNextOrderNumber: () => Promise<void>;
}

const TAX_RATE = 0.05; // 5% GST — admin configurable later

const roundToTwo = (num: number): number =>
  Math.round((num + Number.EPSILON) * 100) / 100;

const generateCartItemId = (
  menuItemId: string,
  modifiers: SelectedModifier[],
  name?: string,
  variantName?: string,
): string => {
  const sortedOptionIds = modifiers
    .map((m) => `${m.optionId}_${m.price}`)
    .sort()
    .join("-");
  const nameSlug = name ? name.toLowerCase().replace(/[^a-z0-9]/g, "") : "";
  const varSlug = variantName ? `_v_${variantName.toLowerCase().replace(/[^a-z0-9]/g, "")}` : "";
  const baseKey = nameSlug ? `${menuItemId}_${nameSlug}${varSlug}` : `${menuItemId}${varSlug}`;
  return sortedOptionIds ? `${baseKey}-${sortedOptionIds}` : baseKey;
};

const DENOMINATIONS = [5, 10, 20, 50, 100];
const defaultDenominations = () =>
  Object.fromEntries(DENOMINATIONS.map((d) => [d, 0]));

const syncDraftCart = (
  cartItems: CartItem[],
  orderType: string,
  customer: CustomerInfo | null,
  totals: { subtotal: number; tax: number; discount: number; total: number },
  skipDeleteIfEmpty = false,
) => {
  if (typeof window === "undefined") return;
  if (cartItems.length === 0) {
    if (!skipDeleteIfEmpty) {
      window.localStorage.removeItem("rms_draft_cart");
      window.dispatchEvent(new Event("storage"));
    }
    return;
  }
  const draft = {
    orderNumber: "#DRAFT",
    orderType,
    customer,
    items: cartItems,
    subtotal: totals.subtotal,
    tax: totals.tax,
    discount: totals.discount,
    total: totals.total,
    status: "pending",
    createdAt: new Date().toISOString(),
    paymentTiming: "pay-now",
    paymentStatus: "unpaid",
    payments: [],
  };
  window.localStorage.setItem("rms_draft_cart", JSON.stringify(draft));
  window.dispatchEvent(new Event("storage"));
};

// ── Read draft cart from localStorage at store creation time ──────────────
// This runs BEFORE any component can call setOrderType/setCustomer (which
// would wipe localStorage with an empty cart). Doing it here ensures the
// cart is already populated when those actions fire.
const getInitialCartState = (): Partial<PosState> => {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem("rms_draft_cart");
    if (!raw) return {};
    const draft = JSON.parse(raw);
    if (
      !draft ||
      draft.status !== "pending" ||
      !Array.isArray(draft.items) ||
      draft.items.length === 0
    ) return {};

    const restoredItems: CartItem[] = draft.items.map((item: CartItem) => ({
      ...item,
      id: item.id || item.menuItemId,
      selectedModifiers: item.selectedModifiers || [],
      quantity: item.quantity || 1,
      totalPrice: item.totalPrice || item.basePrice || 0,
    }));

    return {
      cartItems: restoredItems,
      orderType: (draft.orderType as PosState["orderType"]) || "takeout",
      selectedCustomer:
        draft.customer?.name && draft.customer.name !== "No Name"
          ? draft.customer
          : null,
      subtotal: draft.subtotal || 0,
      tax: draft.tax || 0,
      discount: draft.discount || 0,
      total: draft.total || 0,
    };
  } catch {
    return {};
  }
};

const getInitialCategoryState = (): string => {
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem("rms_selected_category");
      if (saved) return saved;
    } catch (e) {}
  }
  return "all";
};

const getInitialWhatsAppAutoDispatch = (): boolean => {
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("rms_whatsapp_preferences");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed.autoDispatch === "boolean") return parsed.autoDispatch;
      }
    } catch (e) {}
  }
  return true;
};

export const usePosStore = create<PosState>((set, get) => ({
  // ── Initial State ────────────────────────────────────────────
  selectedCategory: getInitialCategoryState(),
  foodTypeFilter: "all",
  search: "",
  sortBy: "default",
  orderType: "takeout",
  selectedTable: null,
  selectedCustomer: null,
  selectedVehicle: null,
  cartItems: [],
  subtotal: 0,
  tax: 0,
  discount: 0,
  total: 0,
  currentOrderSeq: 124,
  branchTaxFees: {
    deliveryFee: 4.99,
    gstTaxRate: 5,
    pstTaxRate: 0,
    hstTaxRate: 0,
  },
  categories: [],
  menuItems: [],
  loadingMenu: true,
  checkoutOpen: false,
  paymentTiming: "pay-now",
  paymentType: "one-time",
  paymentMethod: "cash",
  splitPayments: [],
  cashDenominations: defaultDenominations(),
  cashGiven: 0,
  changeAmount: 0,
  orderSource: "pos",
  aggregatorOrderId: "",
  upiProvider: "gpay",
  upiRefNumber: "",
  whatsappReceipt: getInitialWhatsAppAutoDispatch(),
  orderTiming: "now",
  scheduledAt: null,
  orderNotes: "",
  skipLastDigits: "",
  appliedPromo: null,
  manualDiscountType: null,
  manualDiscountValue: 0,
  currentOrder: null,
  orders: [],
  placingOrder: false,
  nextOrderNumber: "",
  editingOrderId: null,
  editingOrderNumber: null,
  updatingOrder: false,

  // ── Restore cart from localStorage (runs before any component action) ──
  ...getInitialCartState(),

  // ── Menu ────────────────────────────────────────────────────
  setCategory: (category) => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("rms_selected_category", category);
      } catch (e) {}
    }
    set({ selectedCategory: category });
  },
  setSearch: (query) => set({ search: query }),
  setSort: (sort) => set({ sortBy: sort }),

  setOrderType: (type) => {
    set({ orderType: type });
    get().calculateTotals();
    get().fetchNextOrderNumber();
    const {
      cartItems,
      orderType,
      selectedCustomer,
      subtotal,
      tax,
      discount,
      total,
    } = get();
    syncDraftCart(cartItems, orderType, selectedCustomer, {
      subtotal,
      tax,
      discount,
      total,
    });
  },

  setCustomer: (customer) => {
    set({ selectedCustomer: customer });
    const {
      cartItems,
      orderType,
      selectedCustomer: curCust,
      subtotal,
      tax,
      discount,
      total,
    } = get();
    syncDraftCart(cartItems, orderType, curCust, {
      subtotal,
      tax,
      discount,
      total,
    });
  },
  setTable: (table) => set({ selectedTable: table }),
  setVehicle: (vehicle) => set({ selectedVehicle: vehicle }),
  setFoodTypeFilter: (filter) => set({ foodTypeFilter: filter }),

  // ── Cart ─────────────────────────────────────────────────────
  addVariantToCart: (menuItem, variant) => {
    get().addToCart(menuItem, [], 1, "", variant);
  },
  addToCart: (menuItem, selectedModifiers, quantity = 1, note = "", variant, addons) => {
    const { cartItems } = get();
    const effectiveBasePrice = variant ? variant.price : menuItem.price;
    const cartItemId = generateCartItemId(
      menuItem.id,
      selectedModifiers,
      menuItem.name,
      variant?.name,
    );
    const modifierSum = selectedModifiers.reduce(
      (sum, mod) => sum + mod.price,
      0,
    );
    const addonsSum = (addons || []).reduce(
      (sum, a) => sum + a.price,
      0,
    );
    const itemUnitCost = effectiveBasePrice + modifierSum + addonsSum;
    const existingIndex = cartItems.findIndex((item) => item.id === cartItemId);
    let updatedCartItems = [...cartItems];

    if (existingIndex > -1) {
      const item = updatedCartItems[existingIndex];
      const newQty = item.quantity + quantity;
      updatedCartItems[existingIndex] = {
        ...item,
        quantity: newQty,
        totalPrice: roundToTwo(itemUnitCost * newQty),
        note: note || item.note,
      };
    } else {
      const catObj = get().categories.find(
        (c) => c.id === menuItem.categoryId || c.name === menuItem.categoryId,
      );
      const categoryName =
        catObj?.name ||
        (menuItem as any).categoryName ||
        (menuItem as any).category ||
        "";

      let currentRootStation: any = menuItem.kitchenLabel || "general";
      const stampedModifiers = selectedModifiers.map((mod) => {
        const modLabelMapping = (menuItem.modifierKitchenLabels || []).find((m) => m.groupId === mod.groupId);
        const mappedLabel = modLabelMapping?.kitchenLabel || mod.kitchenLabel;
        const isRootVal = mod.isRoot !== undefined ? mod.isRoot : true;
        
        if (isRootVal) {
          if (mappedLabel) currentRootStation = mappedLabel;
        }

        const finalLabel = mappedLabel || currentRootStation || undefined;
        return {
          ...mod,
          kitchenLabel: finalLabel,
        };
      });

      const displayName = variant?.name
        ? `${menuItem.name} (${variant.name})`
        : menuItem.name;

      const newItem: CartItem = {
        id: cartItemId,
        menuItemId: menuItem.id,
        categoryId: menuItem.categoryId,
        categoryName: categoryName,
        name: displayName,
        foodType: menuItem.foodType || "veg",
        shortcode: menuItem.shortcode || "",
        image: menuItem.image,
        basePrice: effectiveBasePrice,
        selectedVariant: variant,
        selectedAddons: addons || [],
        selectedModifiers: stampedModifiers,
        quantity,
        totalPrice: roundToTwo(itemUnitCost * quantity),
        note,
        kitchenLabel: menuItem.kitchenLabel || "general",
      };
      updatedCartItems.push(newItem);
    }

    set({ cartItems: updatedCartItems });
    get().calculateTotals();
    const {
      cartItems: curItems,
      orderType: curType,
      selectedCustomer: curCust,
      subtotal,
      tax,
      discount,
      total,
    } = get();
    syncDraftCart(curItems, curType, curCust, {
      subtotal,
      tax,
      discount,
      total,
    });
    toast.success(`${menuItem.name} added to cart`);
  },

  removeFromCart: (cartItemId) => {
    const item = get().cartItems.find((i) => i.id === cartItemId);
    set({ cartItems: get().cartItems.filter((i) => i.id !== cartItemId) });
    get().calculateTotals();
    const {
      cartItems: curItems,
      orderType: curType,
      selectedCustomer: curCust,
      subtotal,
      tax,
      discount,
      total,
    } = get();
    syncDraftCart(curItems, curType, curCust, {
      subtotal,
      tax,
      discount,
      total,
    });
    if (item) toast.success(`${item.name} removed from cart`);
  },

  increaseQuantity: (cartItemId) => {
    const updated = get().cartItems.map((item) => {
      if (item.id === cartItemId) {
        const newQty = item.quantity + 1;
        const modSum = item.selectedModifiers.reduce((s, m) => s + m.price, 0);
        return {
          ...item,
          quantity: newQty,
          totalPrice: roundToTwo((item.basePrice + modSum) * newQty),
        };
      }
      return item;
    });
    set({ cartItems: updated });
    get().calculateTotals();
    const {
      cartItems: curItems,
      orderType: curType,
      selectedCustomer: curCust,
      subtotal,
      tax,
      discount,
      total,
    } = get();
    syncDraftCart(curItems, curType, curCust, {
      subtotal,
      tax,
      discount,
      total,
    });
  },

  decreaseQuantity: (cartItemId) => {
    const { cartItems } = get();
    const existing = cartItems.find((item) => item.id === cartItemId);
    if (!existing) return;
    let updated: CartItem[];
    if (existing.quantity <= 1) {
      updated = cartItems.filter((item) => item.id !== cartItemId);
    } else {
      updated = cartItems.map((item) => {
        if (item.id === cartItemId) {
          const newQty = item.quantity - 1;
          const modSum = item.selectedModifiers.reduce(
            (s, m) => s + m.price,
            0,
          );
          return {
            ...item,
            quantity: newQty,
            totalPrice: roundToTwo((item.basePrice + modSum) * newQty),
          };
        }
        return item;
      });
    }
    set({ cartItems: updated });
    get().calculateTotals();
    const {
      cartItems: curItems,
      orderType: curType,
      selectedCustomer: curCust,
      subtotal,
      tax,
      discount,
      total,
    } = get();
    syncDraftCart(curItems, curType, curCust, {
      subtotal,
      tax,
      discount,
      total,
    });
  },
  updateCartItem: (originalCartItemId, menuItem, selectedModifiers, quantity, note) => {
    const { cartItems } = get();
    const originalIndex = cartItems.findIndex((i) => i.id === originalCartItemId);
    if (originalIndex === -1) return;

    const modifierSum = selectedModifiers.reduce((sum, mod) => sum + mod.price, 0);
    const itemUnitCost = menuItem.price + modifierSum;
    const newCartItemId = generateCartItemId(menuItem.id, selectedModifiers, menuItem.name);

    const catObj = get().categories.find(
      (c) => c.id === menuItem.categoryId || c.name === menuItem.categoryId,
    );
    const categoryName =
      catObj?.name ||
      (menuItem as any).categoryName ||
      (menuItem as any).category ||
      cartItems[originalIndex].categoryName ||
      "";

    let currentRootStation: any = menuItem.kitchenLabel || "make_table";
    const stampedModifiers = selectedModifiers.map((mod) => {
      const modLabelMapping = (menuItem.modifierKitchenLabels || []).find((m) => m.groupId === mod.groupId);
      const mappedLabel = modLabelMapping?.kitchenLabel || mod.kitchenLabel;
      const isRootVal = mod.isRoot !== undefined ? mod.isRoot : true;
      
      if (isRootVal) {
        if (mappedLabel) currentRootStation = mappedLabel;
      }

      const finalLabel = mappedLabel || currentRootStation || undefined;
      return {
        ...mod,
        kitchenLabel: finalLabel,
      };
    });

    const updatedItem: CartItem = {
      id: newCartItemId,
      menuItemId: menuItem.id,
      categoryId: menuItem.categoryId,
      categoryName,
      name: menuItem.name,
      image: menuItem.image,
      basePrice: menuItem.price,
      selectedModifiers: stampedModifiers,
      quantity,
      totalPrice: roundToTwo(itemUnitCost * quantity),
      note,
      kitchenLabel: menuItem.kitchenLabel || cartItems[originalIndex].kitchenLabel || "make_table",
    };

    // Replace at same position
    const updatedCartItems = [...cartItems];
    updatedCartItems.splice(originalIndex, 1, updatedItem);

    // If new id conflicts with another item (different position), merge quantities
    const conflictIndex = updatedCartItems.findIndex(
      (i, idx) => i.id === newCartItemId && idx !== originalIndex
    );
    let finalCartItems = updatedCartItems;
    if (conflictIndex > -1) {
      const merged = {
        ...updatedCartItems[conflictIndex],
        quantity: updatedCartItems[conflictIndex].quantity + quantity,
        totalPrice: roundToTwo(itemUnitCost * (updatedCartItems[conflictIndex].quantity + quantity)),
      };
      finalCartItems = updatedCartItems.filter((_, idx) => idx !== originalIndex);
      finalCartItems[conflictIndex > originalIndex ? conflictIndex - 1 : conflictIndex] = merged;
    }

    set({ cartItems: finalCartItems });
    get().calculateTotals();
    const {
      cartItems: curItems,
      orderType: curType,
      selectedCustomer: curCust,
      subtotal,
      tax,
      discount,
      total,
    } = get();
    syncDraftCart(curItems, curType, curCust, { subtotal, tax, discount, total });
    toast.success(`${menuItem.name} updated!`);
  },

  clearCart: () => {
    set({
      editingOrderId: null,
      editingOrderNumber: null,
      cartItems: [],
      selectedCustomer: null,
      selectedTable: null,
      selectedVehicle: null,
      subtotal: 0,
      tax: 0,
      discount: 0,
      total: 0,
      appliedPromo: null,
      manualDiscountType: null,
      manualDiscountValue: 0,
    });
    syncDraftCart([], "takeout", null, {
      subtotal: 0,
      tax: 0,
      discount: 0,
      total: 0,
    });
  },

  calculateTotals: () => {
    const {
      cartItems,
      appliedPromo,
      manualDiscountType,
      manualDiscountValue,
      orderType,
      branchTaxFees,
    } = get();
    const subtotal = roundToTwo(
      cartItems.reduce((sum, item) => sum + item.totalPrice, 0),
    );

    let discount = 0;
    if (appliedPromo) {
      discount = appliedPromo.discountAmount;
    } else if (manualDiscountType === "percentage") {
      discount = roundToTwo((subtotal * manualDiscountValue) / 100);
    } else if (manualDiscountType === "flat") {
      discount = Math.min(manualDiscountValue, subtotal);
    }
    discount = roundToTwo(discount);

    const gst = Number(branchTaxFees?.gstTaxRate ?? 5);
    const pst = Number(branchTaxFees?.pstTaxRate ?? 0);
    const hst = Number(branchTaxFees?.hstTaxRate ?? 0);
    const totalTaxRatePercent =
      (isNaN(gst) ? 5 : gst) + (isNaN(pst) ? 0 : pst) + (isNaN(hst) ? 0 : hst);
    const effectiveTaxRate = totalTaxRatePercent / 100;

    const rawDeliveryFee = Number(branchTaxFees?.deliveryFee ?? 4.99);
    const deliveryFee =
      orderType === "delivery"
        ? isNaN(rawDeliveryFee)
          ? 4.99
          : rawDeliveryFee
        : 0;

    const taxableAmount = Math.max(0, subtotal - discount) + deliveryFee;
    const tax = roundToTwo(taxableAmount * effectiveTaxRate);
    const total = roundToTwo(taxableAmount + tax);

    set({ subtotal, tax, discount, total });
  },

  // ── Checkout ─────────────────────────────────────────────────
  openCheckout: () => set({ checkoutOpen: true }),
  closeCheckout: () => set({ checkoutOpen: false }),

  resetCheckoutState: () =>
    set({
      checkoutOpen: false,
      paymentTiming: "pay-now",
      paymentType: "one-time",
      paymentMethod: "cash",
      splitPayments: [],
      cashDenominations: defaultDenominations(),
      cashGiven: 0,
      changeAmount: 0,
      orderSource: "pos",
      aggregatorOrderId: "",
      upiProvider: "gpay",
      upiRefNumber: "",
      whatsappReceipt: getInitialWhatsAppAutoDispatch(),
      orderTiming: "now",
      scheduledAt: null,
      orderNotes: "",
      skipLastDigits: "",
      appliedPromo: null,
      manualDiscountType: null,
      manualDiscountValue: 0,
    }),

  // ── Payment ──────────────────────────────────────────────────
  setPaymentTiming: (timing) => set({ paymentTiming: timing }),
  setPaymentType: (type) =>
    set({
      paymentType: type,
      splitPayments: [],
      cashDenominations: defaultDenominations(),
      cashGiven: 0,
      changeAmount: 0,
    }),
  setPaymentMethod: (method) => set({ paymentMethod: method }),

  setCashDenomination: (denom, qty) => {
    const { cashDenominations, total } = get();
    const updated = { ...cashDenominations, [denom]: Math.max(0, qty) };
    const cashGiven = Object.entries(updated).reduce(
      (sum, [d, q]) => sum + Number(d) * q,
      0,
    );
    const changeAmount = roundToTwo(Math.max(0, cashGiven - total));
    set({
      cashDenominations: updated,
      cashGiven: roundToTwo(cashGiven),
      changeAmount,
    });
  },

  setCashGiven: (amount) => {
    const { total } = get();
    set({
      cashGiven: amount,
      cashDenominations: defaultDenominations(),
      changeAmount: roundToTwo(Math.max(0, amount - total)),
    });
  },

  addSplitPayment: (payment) =>
    set({ splitPayments: [...get().splitPayments, payment] }),
  updateSplitPayment: (index, payment) => {
    const updated = [...get().splitPayments];
    updated[index] = payment;
    set({ splitPayments: updated });
  },
  removeSplitPayment: (index) =>
    set({ splitPayments: get().splitPayments.filter((_, i) => i !== index) }),

  // ── Order Details ────────────────────────────────────────────
  setOrderSource: (source) => {
    set({ orderSource: source });
    // For 3rd party platforms, auto-set payment to pay-now one-time (Account Pay)
    if (["doordash", "skip", "ubereats", "zomato", "swiggy"].includes(source)) {
      set({
        paymentTiming: "pay-now",
        paymentType: "one-time",
        paymentMethod: "cash",
      });
    }
  },
  setAggregatorOrderId: (id) => set({ aggregatorOrderId: id }),
  setUpiProvider: (provider) => set({ upiProvider: provider }),
  setUpiRefNumber: (ref) => set({ upiRefNumber: ref }),
  setWhatsappReceipt: (send) => set({ whatsappReceipt: send }),
  setOrderTiming: (timing) => set({ orderTiming: timing }),
  setScheduledAt: (date) => set({ scheduledAt: date }),
  setOrderNotes: (notes) => set({ orderNotes: notes }),
  setSkipLastDigits: (digits) => set({ skipLastDigits: digits }),

  // ── Promo / Discount ─────────────────────────────────────────
  applyPromo: (promo) => {
    set({
      appliedPromo: promo,
      manualDiscountType: null,
      manualDiscountValue: 0,
    });
    get().calculateTotals();
    toast.success(
      `Promo "${promo.code}" applied! -$${promo.discountAmount.toFixed(2)}`,
    );
  },

  applyManualDiscount: (type, value) => {
    set({
      manualDiscountType: type,
      manualDiscountValue: value,
      appliedPromo: null,
    });
    get().calculateTotals();
    toast.success("Discount applied!");
  },

  removeDiscount: () => {
    set({
      appliedPromo: null,
      manualDiscountType: null,
      manualDiscountValue: 0,
    });
    get().calculateTotals();
    toast.success("Discount removed.");
  },

  // ── Place Order (API) ─────────────────────────────────────────
  placeOrder: async () => {
    const {
      cartItems,
      orderType,
      orderSource,
      aggregatorOrderId,
      upiProvider,
      upiRefNumber,
      whatsappReceipt,
      selectedCustomer,
      selectedTable,
      subtotal,
      tax,
      discount,
      total,
      appliedPromo,
      manualDiscountType,
      paymentTiming,
      paymentType,
      paymentMethod,
      splitPayments,
      cashGiven,
      changeAmount,
      orderTiming,
      scheduledAt,
      orderNotes,
      skipLastDigits,
      orders,
      currentOrderSeq,
    } = get();

    if (cartItems.length === 0) {
      toast.error("Cart is empty.");
      return null;
    }

    set({ placingOrder: true });

    let payments: SplitPayment[] = [];
    if (paymentTiming === "pay-now") {
      if (paymentType === "split") {
        payments = splitPayments;
      } else if (["doordash", "skip", "ubereats", "zomato", "swiggy"].includes(orderSource)) {
        // 3rd party orders: payment goes to Account Pay
        // Send as cash method - backend routes to accountPay based on orderSource
        payments = [
          {
            method: "cash",
            amount: total,
            cashGiven: 0,
            changeGiven: 0,
          },
        ];
      } else if (paymentMethod === "upi") {
        payments = [
          {
            method: "upi",
            amount: total,
            transactionId: upiRefNumber,
            upiProvider,
            cashGiven: 0,
            changeGiven: 0,
          },
        ];
      } else {
        payments = [
          {
            method: paymentMethod,
            amount: total,
            cashGiven: paymentMethod === "cash" ? cashGiven : 0,
            changeGiven: paymentMethod === "cash" ? changeAmount : 0,
          },
        ];
      }
    }

    const discountType = appliedPromo
      ? "promo"
      : (manualDiscountType ?? "none");
    const promoCode = appliedPromo ? appliedPromo.code : "";

    let branchId: string | undefined = undefined;
    let branchName: string | undefined = undefined;
    let branchCode: string | undefined = undefined;
    let placedBy: string = "Manager";
    if (typeof window !== "undefined") {
      const rawBranch = localStorage.getItem("rms_branch");
      if (rawBranch) {
        try {
          const b = JSON.parse(rawBranch);
          branchId = b._id || b.id || b.branchId;
          branchName = b.name;
          branchCode = b.code;
        } catch (e) {}
      }
      const rawEmp = localStorage.getItem("rms_active_employee");
      if (rawEmp) {
        try {
          const emp = JSON.parse(rawEmp);
          if (emp && emp.name) placedBy = emp.name;
        } catch (e) {}
      }
    }

    const rawDeliveryFee = Number(get().branchTaxFees?.deliveryFee ?? 4.99);
    const deliveryFee =
      orderType === "delivery"
        ? isNaN(rawDeliveryFee)
          ? 4.99
          : rawDeliveryFee
        : 0;

    const payload = {
      orderType,
      orderSource,
      placedBy,
      branchId: branchId || undefined,
      branchName: branchName || undefined,
      branchCode: branchCode || undefined,
      table: selectedTable
        ? { id: selectedTable.id, name: selectedTable.name, status: selectedTable.status }
        : null,
      aggregatorOrderId: ["doordash", "skip", "ubereats", "zomato", "swiggy"].includes(orderSource)
        ? (aggregatorOrderId || skipLastDigits)
        : "",
      upiProvider: paymentMethod === "upi" ? upiProvider : "",
      upiRefNumber: paymentMethod === "upi" ? upiRefNumber : "",
      whatsappReceipt,
      whatsappPreferences: (() => {
        if (typeof window === "undefined") return { includeGstSplit: true, includeGreeting: true };
        try {
          const raw = localStorage.getItem("rms_whatsapp_preferences");
          if (raw) {
            const p = JSON.parse(raw);
            return {
              includeGstSplit: p.includeGstSplit !== false,
              includeGreeting: p.includeGreeting !== false,
            };
          }
        } catch {}
        return { includeGstSplit: true, includeGreeting: true };
      })(),
      items: cartItems.map((item) => ({
        menuItemId: item.menuItemId,
        name: item.name,
        image: item.image || "",
        basePrice: item.basePrice,
        selectedSize: item.selectedSize || undefined,
        selectedModifiers: item.selectedModifiers,
        quantity: item.quantity,
        totalPrice: item.totalPrice,
        note: item.note || "",
        kitchenLabel: item.kitchenLabel || "chicken",
      })),
      subtotal,
      taxRate: TAX_RATE,
      tax,
      deliveryFee,
      discount,
      discountType,
      promoCode,
      promoApplyCount: appliedPromo?.applyCount || 1,
      total,
      paymentTiming,
      paymentType,
      payments,
      orderTiming,
      scheduledAt: orderTiming === "later" ? scheduledAt : null,
      customer:
        orderSource === "skip"
          ? { name: skipLastDigits, phone: "", email: "" }
          : selectedCustomer &&
              selectedCustomer.name &&
              selectedCustomer.name.trim()
            ? selectedCustomer
            : { name: "No Name", phone: "", email: "" },
      notes: orderNotes,
      driverNotes: selectedCustomer?.driverNotes || "",
    };

    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const res = await axios.post(`${apiUrl}/orders`, payload);

      if (res.data.success) {
        const newOrder = res.data.data as Order;
        set({
          orders: [...orders, newOrder],
          currentOrder: newOrder,
          currentOrderSeq: currentOrderSeq + 1,
          cartItems: [],
          selectedCustomer: null,
          selectedTable: null,
          selectedVehicle: null,
          subtotal: 0,
          tax: 0,
          discount: 0,
          total: 0,
          placingOrder: false,
        });
        syncDraftCart([], "takeout", null, {
          subtotal: 0,
          tax: 0,
          discount: 0,
          total: 0,
        });
        get().resetCheckoutState();
        get().fetchNextOrderNumber();
        return newOrder;
      }
      throw new Error(res.data.message || "Failed to place order.");
    } catch (error: unknown) {
      set({ placingOrder: false });
      const message =
        error instanceof Error
          ? error.message
          : "Network error. Please try again.";
      toast.error(message);
      return null;
    }
  },

  // ── Load Order For Editing ───────────────────────────────────
  loadOrderForEditing: (order) => {
    const restoredItems: CartItem[] = (order.items || []).map((item: any) => {
      const modifierSum = (item.selectedModifiers || []).reduce(
        (sum: number, mod: any) => sum + (Number(mod.price) || 0),
        0,
      );
      const qty = Math.max(1, Number(item.quantity) || 1);
      const unitPrice =
        item.basePrice !== undefined && !isNaN(Number(item.basePrice))
          ? Number(item.basePrice)
          : roundToTwo((Number(item.totalPrice) || 0) / qty - modifierSum);
      const computedTotal =
        item.totalPrice !== undefined && !isNaN(Number(item.totalPrice))
          ? Number(item.totalPrice)
          : roundToTwo((unitPrice + modifierSum) * qty);

      return {
        id: generateCartItemId(
          String(item.menuItemId || item._id || Math.random()),
          item.selectedModifiers || [],
          item.name
        ),
        menuItemId: String(item.menuItemId || item._id || ""),
        categoryId: item.categoryId || "",
        categoryName: item.categoryName || "",
        name: item.name || "Menu Item",
        image: item.image || "",
        basePrice: unitPrice,
        selectedModifiers: item.selectedModifiers || [],
        quantity: qty,
        totalPrice: computedTotal,
        note: item.note || "",
        kitchenLabel: item.kitchenLabel || "make_table",
      };
    });

    const orderTable = order.table && order.table.name ? {
      id: order.table.id || (order.table as any)._id,
      name: order.table.name,
      status: (order.table.status as any) || "occupied",
    } : null;

    set({
      editingOrderId: order._id,
      editingOrderNumber: order.orderNumber,
      cartItems: restoredItems,
      orderType: (order.orderType as PosState["orderType"]) || "dine-in",
      selectedTable: orderTable,
      orderSource: (order.orderSource as PosState["orderSource"]) || "pos",
      selectedCustomer:
        order.customer &&
        order.customer.name &&
        order.customer.name !== "No Name"
          ? order.customer
          : null,
      orderNotes: order.notes || "",
      appliedPromo: order.promoCode ? {
        code: order.promoCode,
        description: `Promo: ${order.promoCode}`,
        discountType: "flat",
        discountValue: order.discount || 0,
        discountAmount: order.discount || 0,
        applyCount: order.promoApplyCount || 1,
      } : null,
      manualDiscountType: order.discountType === "percentage" || order.discountType === "flat" ? order.discountType : null,
      manualDiscountValue: order.discount || 0,
      paymentTiming: (order.paymentTiming as any) || (order.paymentStatus === "paid" ? "pay-now" : "pay-later"),
      cashGiven: Number(order.total) || 0,
      changeAmount: 0,
      splitPayments: [],
      subtotal: Number(order.subtotal) || 0,
      tax: Number(order.tax) || 0,
      discount: Number(order.discount) || 0,
      total: Number(order.total) || 0,
    });

    if (restoredItems.length > 0) {
      get().calculateTotals();
    }
    toast.success(`Order ${order.orderNumber} loaded`);
  },

  // ── Cancel Editing Mode ───────────────────────────────────────
  cancelEditingOrder: () => {
    set({
      editingOrderId: null,
      editingOrderNumber: null,
      cartItems: [],
      selectedCustomer: null,
      selectedTable: null,
      selectedVehicle: null,
      subtotal: 0,
      tax: 0,
      discount: 0,
      total: 0,
      orderNotes: "",
    });
    get().calculateTotals();
    toast("Order editing cancelled");
  },

  // ── Update Order (API) ────────────────────────────────────────
  updateOrder: async () => {
    const {
      editingOrderId,
      editingOrderNumber,
      cartItems,
      orderType,
      selectedCustomer,
      selectedTable,
      subtotal,
      tax,
      discount,
      total,
      orderNotes,
      orders,
      paymentTiming,
      paymentType,
      paymentMethod,
      splitPayments,
      cashGiven,
      changeAmount,
      upiProvider,
      upiRefNumber,
      orderSource,
    } = get();

    if (!editingOrderId) {
      toast.error("No active order being edited.");
      return null;
    }

    if (cartItems.length === 0) {
      toast.error("Cart cannot be empty for an existing order.");
      return null;
    }

    set({ updatingOrder: true });

    const rawDeliveryFee = Number(get().branchTaxFees?.deliveryFee ?? 4.99);
    const deliveryFee =
      orderType === "delivery"
        ? isNaN(rawDeliveryFee)
          ? 4.99
          : rawDeliveryFee
        : 0;

    const payload = {
      orderType,
      items: cartItems.map((item) => ({
        menuItemId: item.menuItemId,
        name: item.name,
        image: item.image || "",
        basePrice: item.basePrice,
        selectedSize: item.selectedSize || undefined,
        selectedModifiers: item.selectedModifiers,
        quantity: item.quantity,
        totalPrice: item.totalPrice,
        note: item.note || "",
        kitchenLabel: item.kitchenLabel || "chicken",
      })),
      subtotal,
      tax,
      deliveryFee,
      discount,
      total,
      notes: orderNotes,
      customer:
        selectedCustomer &&
        selectedCustomer.name &&
        selectedCustomer.name.trim()
          ? selectedCustomer
          : { name: "No Name", phone: "", email: "" },
      table: selectedTable
        ? { id: selectedTable.id, name: selectedTable.name, status: selectedTable.status }
        : undefined,
    };

    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const res = await axios.patch(
        `${apiUrl}/orders/${editingOrderId}`,
        payload,
        { withCredentials: true }
      );

      if (res.data.success) {
        let updatedOrder = res.data.data as Order;

        // If paying now (settlement), send payments to markOrderPaid
        if (paymentTiming === "pay-now") {
          let payments: SplitPayment[] = [];
          if (paymentType === "split") {
            payments = splitPayments;
          } else if (["doordash", "skip", "ubereats", "zomato", "swiggy"].includes(orderSource)) {
            payments = [
              {
                method: "cash",
                amount: total,
                cashGiven: 0,
                changeGiven: 0,
              },
            ];
          } else if (paymentMethod === "upi") {
            payments = [
              {
                method: "upi",
                amount: total,
                transactionId: upiRefNumber,
                upiProvider,
                cashGiven: 0,
                changeGiven: 0,
              },
            ];
          } else {
            payments = [
              {
                method: paymentMethod,
                amount: total,
                cashGiven: paymentMethod === "cash" ? cashGiven : 0,
                changeGiven: paymentMethod === "cash" ? changeAmount : 0,
              },
            ];
          }

          if (payments.length > 0) {
            try {
              const payRes = await axios.patch(
                `${apiUrl}/orders/${editingOrderId}/payment`,
                { payments },
                { withCredentials: true }
              );
              if (payRes.data?.success && payRes.data?.data) {
                updatedOrder = payRes.data.data as Order;
              }
            } catch (payErr: any) {
              console.error("Payment recording error:", payErr);
            }
          }
        }

        const updatedOrdersList = orders.map((o) =>
          o._id === editingOrderId ? updatedOrder : o,
        );

        set({
          orders: updatedOrdersList,
          currentOrder: updatedOrder,
          editingOrderId: null,
          editingOrderNumber: null,
          cartItems: [],
          selectedCustomer: null,
          selectedTable: null,
          selectedVehicle: null,
          subtotal: 0,
          tax: 0,
          discount: 0,
          total: 0,
          orderNotes: "",
          updatingOrder: false,
          checkoutOpen: false,
        });

        syncDraftCart([], "takeout", null, {
          subtotal: 0,
          tax: 0,
          discount: 0,
          total: 0,
        });
        toast.success(
          `Order ${editingOrderNumber || ""} ${paymentTiming === "pay-now" ? "settled & paid" : "updated"} successfully!`,
        );
        return updatedOrder;
      }
      throw new Error(res.data.message || "Failed to update order.");
    } catch (error: unknown) {
      set({ updatingOrder: false });
      const message =
        error instanceof Error
          ? error.message
          : "Network error while updating order.";
      toast.error(message);
      return null;
    }
  },

  // ── Fetch Menu ───────────────────────────────────────────────
  fetchMenu: async () => {
    set({ loadingMenu: true });
    get().fetchNextOrderNumber(); // Load next order number on startup
    try {
      let branchId: string | undefined = undefined;
      if (typeof window !== "undefined") {
        const rawBranch = localStorage.getItem("rms_branch");
        if (rawBranch) {
          try {
            const b = JSON.parse(rawBranch);
            branchId = b._id;
          } catch (e) {}
        }
      }

      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

      // Also load branch settings for tax and delivery fee calculation
      if (branchId) {
        axios
          .get(`${apiUrl}/branches/settings`, { params: { branchId } })
          .then((settingsRes) => {
            if (
              settingsRes.data?.success &&
              settingsRes.data?.data?.taxFeesSettings
            ) {
              const tf = settingsRes.data.data.taxFeesSettings;
              set({
                branchTaxFees: {
                  deliveryFee: Number(tf.deliveryFee ?? 4.99),
                  gstTaxRate: Number(tf.gstTaxRate ?? 5),
                  pstTaxRate: Number(tf.pstTaxRate ?? 0),
                  hstTaxRate: Number(tf.hstTaxRate ?? 0),
                },
              });
              get().calculateTotals();
            }
          })
          .catch(() => {});
      }

      const res = await axios.get(`${apiUrl}/menu/pos-feed`, {
        params: branchId ? { branchId } : {},
      });
      if (res.data.success) {
        const fetchedCategories: Category[] = res.data.data.categories || [];
        let savedCat = get().selectedCategory;
        if (typeof window !== "undefined") {
          try {
            const localCat = localStorage.getItem("rms_selected_category");
            if (localCat) savedCat = localCat;
          } catch (e) {}
        }

        const exists = fetchedCategories.some(
          (c) => c.id === savedCat || (c as any)._id === savedCat
        );
        const defaultCatId = exists
          ? savedCat
          : fetchedCategories.length > 0
          ? (fetchedCategories[0].id || (fetchedCategories[0] as any)._id)
          : "";

        const dealsOfTheDay = res.data.data.dealsOfTheDay || [];
        const menuItems = (res.data.data.menuItems || []).map((item: any) => ({
          ...item,
          dealsOfTheDay,
        }));

        set({
          categories: fetchedCategories,
          menuItems,
          selectedCategory: defaultCatId,
        });
      }
    } catch {
      //dummy data when backend data is unavailable
      // const { categories: staticCats } = require("../data/categories");
      // const { menuItems: staticItems } = require("../data/menuItems");
      // set({ categories: staticCats, menuItems: staticItems });
    } finally {
      set({ loadingMenu: false });
    }
  },

  // ── Fetch Next Order Number ──────────────────────────────────
  fetchNextOrderNumber: async () => {
    try {
      let branchId: string | undefined = undefined;
      if (typeof window !== "undefined") {
        const rawBranch = localStorage.getItem("rms_branch");
        if (rawBranch) {
          try {
            const b = JSON.parse(rawBranch);
            branchId = b._id;
          } catch (e) {}
        }
      }

      const { orderType } = get();
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const res = await axios.get(`${apiUrl}/orders/next-number`, {
        params: {
          type: orderType,
          ...(branchId ? { branchId } : {}),
        },
      });
      if (res.data.success) {
        set({ nextOrderNumber: res.data.data });
      }
    } catch {
      set({ nextOrderNumber: "101" });
    }
  },
}));
