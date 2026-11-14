import React, { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import {
  FolderPlus,
  Layers,
  Check,
  Edit,
  Trash2,
  Image as ImageIcon,
  Loader2,
  Store,
  Search,
  X,
  Plus,
  Sparkles,
  Leaf,
  Drumstick,
  Tag,
  ChevronDown,
  Sandwich,
  ChefHat,
  Flame,
  UtensilsCrossed,
  CupSoda,
  Utensils,
  Pizza,
  CircleDot,
  Triangle,
  Folder,
} from "lucide-react";
import toast from "react-hot-toast";
import { Product, Category, ModifierGroup, ProductVariant } from "../types";
import { API_URL, compressImage, getAuthConfig } from "../utils";
import BranchVisibilityModal from "./BranchVisibilityModal";

interface ProductsTabProps {
  products: Product[];
  categories: Category[];
  modifiers: ModifierGroup[];
  fetchProducts: () => void;
  showToast: (text: string, type?: "success" | "error") => void;
}

// ── Kitchen Stations Configuration with Lucide Icons ──────────────────────────
export interface StationConfig {
  id: string;
  name: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  iconColor: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}

export const KITCHEN_STATIONS: StationConfig[] = [
  {
    id: "fast_food",
    name: "Fast Food",
    icon: Sandwich,
    iconColor: "text-amber-500",
    badgeBg: "bg-amber-50",
    badgeText: "text-amber-700",
    badgeBorder: "border-amber-200",
  },
  {
    id: "main_kitchen",
    name: "Main Kitchen",
    icon: ChefHat,
    iconColor: "text-orange-500",
    badgeBg: "bg-orange-50",
    badgeText: "text-orange-700",
    badgeBorder: "border-orange-200",
  },
  {
    id: "tandoor",
    name: "Tandoor",
    icon: Flame,
    iconColor: "text-red-500",
    badgeBg: "bg-red-50",
    badgeText: "text-red-700",
    badgeBorder: "border-red-200",
  },
  {
    id: "chinese",
    name: "Chinese / Wok",
    icon: UtensilsCrossed,
    iconColor: "text-rose-500",
    badgeBg: "bg-rose-50",
    badgeText: "text-rose-700",
    badgeBorder: "border-rose-200",
  },
  {
    id: "beverages",
    name: "Beverages",
    icon: CupSoda,
    iconColor: "text-sky-500",
    badgeBg: "bg-sky-50",
    badgeText: "text-sky-700",
    badgeBorder: "border-sky-200",
  },
  {
    id: "general",
    name: "General",
    icon: Utensils,
    iconColor: "text-purple-500",
    badgeBg: "bg-purple-50",
    badgeText: "text-purple-700",
    badgeBorder: "border-purple-200",
  },
];

// Quick Variant Presets with Lucide Icons
const VARIANT_PRESETS = {
  burger: {
    label: "Burger (Lite/Heavy)",
    icon: Sandwich,
    variants: [
      { name: "Lite (1 Tikki)", price: 90, isDefault: true, isEnabled: true },
      { name: "Heavy (2 Tikki)", price: 120, isDefault: false, isEnabled: true },
    ],
  },
  half_full: {
    label: "Main Course (Half/Full)",
    icon: ChefHat,
    variants: [
      { name: "Half", price: 135, isDefault: true, isEnabled: true },
      { name: "Full", price: 215, isDefault: false, isEnabled: true },
    ],
  },
  shake: {
    label: "Shake (Normal/Ice Cream/VIP)",
    icon: CupSoda,
    variants: [
      { name: "Normal", price: 60, isDefault: true, isEnabled: true },
      { name: "With Ice Cream", price: 80, isDefault: false, isEnabled: true },
      { name: "VIP Pure Ice Cream", price: 120, isDefault: false, isEnabled: true },
    ],
  },
  pizza: {
    label: "Pizza (Regular/Medium/Large)",
    icon: Pizza,
    variants: [
      { name: "Regular", price: 140, isDefault: true, isEnabled: true },
      { name: "Medium", price: 240, isDefault: false, isEnabled: true },
      { name: "Large", price: 360, isDefault: false, isEnabled: true },
    ],
  },
};

export default function ProductsTab({
  products,
  categories,
  modifiers,
  fetchProducts,
  showToast,
}: ProductsTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [foodTypeFilter, setFoodTypeFilter] = useState<"all" | "veg" | "non_veg" | "egg">("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [modGroupSearch, setModGroupSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editProd, setEditProd] = useState<Product | null>(null);

  // Custom Kitchen Station Dropdown State
  const [isStationDropdownOpen, setIsStationDropdownOpen] = useState(false);
  const stationDropdownRef = useRef<HTMLDivElement>(null);

  // Close station dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        stationDropdownRef.current &&
        !stationDropdownRef.current.contains(e.target as Node)
      ) {
        setIsStationDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Branch Visibility Modal State
  const [visibilityTarget, setVisibilityTarget] = useState<{
    id: string;
    name: string;
    disabledBranches: string[];
  } | null>(null);

  // Main Product Form State
  const [prodForm, setProdForm] = useState<{
    name: string;
    shortcode: string;
    foodType: "veg" | "non_veg" | "egg";
    isJainAvailable: boolean;
    pricingType: "single" | "variant";
    price: number;
    hasVariants: boolean;
    variants: ProductVariant[];
    categoryId: string;
    kitchenLabel: string;
    description: string;
    image: string;
    itemType: "simple" | "combo";
    modifierGroups: string[];
    includedToppings: { groupId: string; optionId: string }[];
    badge: "Popular" | "Best Seller" | "New" | null;
    isActive: boolean;
    displayOrder: number;
  }>({
    name: "",
    shortcode: "",
    foodType: "veg",
    isJainAvailable: false,
    pricingType: "single",
    price: 0,
    hasVariants: false,
    variants: [
      { name: "Lite (1 Tikki)", price: 90, isDefault: true, isEnabled: true },
      { name: "Heavy (2 Tikki)", price: 120, isDefault: false, isEnabled: true },
    ],
    categoryId: "",
    kitchenLabel: "fast_food",
    description: "",
    image: "",
    itemType: "simple",
    modifierGroups: [],
    includedToppings: [],
    badge: null,
    isActive: true,
    displayOrder: 0,
  });

  // Sync default category if available
  useEffect(() => {
    if (categories.length > 0 && !prodForm.categoryId && !editProd) {
      setProdForm((prev) => ({
        ...prev,
        categoryId: (categories[0].id || categories[0]._id) as string,
      }));
    }
  }, [categories, editProd, prodForm.categoryId]);

  // Group modifiers
  const sortedModifiers = useMemo(() => {
    const list = [...modifiers];
    const getBase = (n: string) =>
      n.replace(/\s*\([^)]*copy[^)]*\)/gi, "").trim().toLowerCase();

    const result: ModifierGroup[] = [];
    const addedIds = new Set<string>();

    list.forEach((group) => {
      const gId = (group.id || group._id) as string;
      if (addedIds.has(gId)) return;

      const isCopy = /\([^)]*copy[^)]*\)/i.test(group.name);
      if (!isCopy) {
        result.push(group);
        addedIds.add(gId);

        const base = getBase(group.name);
        list.forEach((other) => {
          const oId = (other.id || other._id) as string;
          if (
            !addedIds.has(oId) &&
            /\([^)]*copy[^)]*\)/i.test(other.name) &&
            getBase(other.name) === base
          ) {
            result.push(other);
            addedIds.add(oId);
          }
        });
      }
    });

    list.forEach((group) => {
      const gId = (group.id || group._id) as string;
      if (!addedIds.has(gId)) {
        result.push(group);
        addedIds.add(gId);
      }
    });

    return result;
  }, [modifiers]);

  // Filter products by search, foodType, category
  const filteredProducts = useMemo(() => {
    const list = products.filter((prod) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = prod.name.toLowerCase().includes(q);
        const matchesCode = prod.shortcode?.toLowerCase().includes(q);
        const matchesDesc = prod.description?.toLowerCase().includes(q);
        if (!matchesName && !matchesCode && !matchesDesc) return false;
      }

      // Food type filter
      if (foodTypeFilter !== "all") {
        if (prod.foodType !== foodTypeFilter) return false;
      }

      // Category filter
      if (categoryFilter !== "all") {
        const catId = typeof prod.categoryId === "object" ? prod.categoryId?.id || prod.categoryId?._id : prod.categoryId;
        if (catId !== categoryFilter) return false;
      }

      return true;
    });

    return [...list].sort((a, b) => {
      const orderA = a.displayOrder || 0;
      const orderB = b.displayOrder || 0;
      if (orderA > 0 && orderB > 0) return orderA - orderB;
      if (orderA > 0 && orderB === 0) return -1;
      if (orderA === 0 && orderB > 0) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [products, searchQuery, foodTypeFilter, categoryFilter]);

  // Cloudinary image upload with client compression
  const handleImageUpload = async (file: File | undefined) => {
    if (!file) return;
    const oldImage = prodForm.image;
    setUploading(true);

    try {
      const compressedFile = await compressImage(file, 800, 800, 0.85);

      if (compressedFile.size > 5 * 1024 * 1024) {
        showToast("File size too large. Max limit is 5MB.", "error");
        setUploading(false);
        return;
      }

      const formData = new FormData();
      formData.append("image", compressedFile);

      const res = await axios.post(`${API_URL}/upload`, formData, {
        ...getAuthConfig(),
        headers: {
          ...getAuthConfig().headers,
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.data.success) {
        setProdForm((prev) => ({ ...prev, image: res.data.url }));
        showToast("Product image uploaded to Cloudinary!");

        if (oldImage) {
          try {
            await axios.post(`${API_URL}/upload/delete`, { url: oldImage }, getAuthConfig());
          } catch (delErr) {
            console.error("Failed to delete old product image:", delErr);
          }
        }
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.message || "Image upload failed.", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveProductImage = async () => {
    const url = prodForm.image;
    if (!url) return;
    try {
      setProdForm((prev) => ({ ...prev, image: "" }));
      showToast("Product image removed.");
      await axios.post(`${API_URL}/upload/delete`, { url }, getAuthConfig());
    } catch (err) {
      console.error(err);
      showToast("Failed to delete product image.", "error");
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    const mainEl = document.querySelector("main");
    if (mainEl) {
      mainEl.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Start Editing Product
  const startEditProduct = (prod: Product) => {
    setEditProd(prod);
    const catId =
      typeof prod.categoryId === "object"
        ? prod.categoryId?.id || prod.categoryId?._id
        : prod.categoryId;

    const isVariant = Boolean(
      prod.pricingType === "variant" || (prod.variants && prod.variants.length > 0)
    );
    const existingVariants =
      prod.variants && prod.variants.length > 0
        ? prod.variants.map((v) => ({
            name: v.name || v.sizeName || "Regular",
            price: v.price || 0,
            isDefault: !!v.isDefault,
            isEnabled: v.isEnabled !== false,
          }))
        : [
            { name: "Lite", price: prod.price || 90, isDefault: true, isEnabled: true },
            { name: "Heavy", price: (prod.price || 90) + 30, isDefault: false, isEnabled: true },
          ];

    setProdForm({
      name: prod.name,
      shortcode: prod.shortcode || "",
      foodType: prod.foodType || "veg",
      isJainAvailable: !!prod.isJainAvailable,
      pricingType: isVariant ? "variant" : "single",
      price: prod.price || 0,
      hasVariants: isVariant,
      variants: existingVariants,
      categoryId: catId || (categories[0]?.id || categories[0]?._id || ""),
      kitchenLabel: prod.kitchenLabel || "fast_food",
      description: prod.description || "",
      image: prod.image || "",
      itemType: prod.itemType || "simple",
      modifierGroups: (prod.modifierGroups || []).map((g: any) =>
        typeof g === "object" ? g.id || g._id : g
      ),
      includedToppings: prod.includedToppings || [],
      badge: prod.badge || null,
      isActive: prod.isActive !== false,
      displayOrder: prod.displayOrder ?? 0,
    });
    scrollToTop();
  };

  // Cancel Editing
  const cancelEditProduct = () => {
    setEditProd(null);
    setProdForm({
      name: "",
      shortcode: "",
      foodType: "veg",
      isJainAvailable: false,
      pricingType: "single",
      price: 0,
      hasVariants: false,
      variants: [
        { name: "Lite (1 Tikki)", price: 90, isDefault: true, isEnabled: true },
        { name: "Heavy (2 Tikki)", price: 120, isDefault: false, isEnabled: true },
      ],
      categoryId: categories[0]?.id || categories[0]?._id || "",
      kitchenLabel: "fast_food",
      description: "",
      image: "",
      itemType: "simple",
      modifierGroups: [],
      includedToppings: [],
      badge: null,
      isActive: true,
      displayOrder: 0,
    });
  };

  // Apply Variant Preset
  const applyVariantPreset = (key: keyof typeof VARIANT_PRESETS) => {
    const preset = VARIANT_PRESETS[key];
    setProdForm((prev) => ({
      ...prev,
      pricingType: "variant",
      hasVariants: true,
      variants: [...preset.variants],
      price: preset.variants.find((v) => v.isDefault)?.price || preset.variants[0]?.price || 0,
    }));
  };

  // Add Custom Variant Row
  const handleAddVariantRow = () => {
    setProdForm((prev) => ({
      ...prev,
      variants: [
        ...prev.variants,
        { name: `Variant ${prev.variants.length + 1}`, price: 0, isDefault: false, isEnabled: true },
      ],
    }));
  };

  // Remove Variant Row
  const handleRemoveVariantRow = (index: number) => {
    if (prodForm.variants.length <= 1) {
      showToast("At least one variant is required", "error");
      return;
    }
    const updated = prodForm.variants.filter((_, i) => i !== index);
    if (!updated.some((v) => v.isDefault) && updated.length > 0) {
      updated[0].isDefault = true;
    }
    setProdForm((prev) => ({
      ...prev,
      variants: updated,
      price: updated.find((v) => v.isDefault)?.price || updated[0]?.price || 0,
    }));
  };

  // Modifier toggle
  const handleProductModifierToggle = (groupId: string) => {
    const cur = prodForm.modifierGroups;
    const has = cur.includes(groupId);
    const next = has
      ? cur.filter((id: string) => id !== groupId)
      : [...cur, groupId];
    setProdForm({ ...prodForm, modifierGroups: next });
  };

  // Save Product (Submit Form)
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodForm.name.trim() || !prodForm.categoryId) {
      showToast("Dish Name and Category are required", "error");
      return;
    }

    // Determine final base price
    let finalBasePrice = prodForm.price;
    if (prodForm.pricingType === "variant") {
      const def = prodForm.variants.find((v) => v.isDefault) || prodForm.variants[0];
      finalBasePrice = def ? def.price : 0;
    }

    const payload = {
      ...prodForm,
      shortcode: prodForm.shortcode.toUpperCase().trim(),
      price: finalBasePrice,
      hasVariants: prodForm.pricingType === "variant",
      variants: prodForm.pricingType === "variant" ? prodForm.variants : [],
      badge: prodForm.badge || null,
    };

    setLoading(true);
    try {
      if (editProd) {
        const id = editProd.id || editProd._id;
        const res = await axios.put(`${API_URL}/products/${id}`, payload, getAuthConfig());
        if (res.data.success) {
          showToast(`Dish "${prodForm.name}" updated successfully!`);
          cancelEditProduct();
          fetchProducts();
        }
      } else {
        const res = await axios.post(`${API_URL}/products`, payload, getAuthConfig());
        if (res.data.success) {
          showToast(`Dish "${prodForm.name}" added to menu!`);
          cancelEditProduct();
          fetchProducts();
        }
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || "Error saving dish", "error");
    } finally {
      setLoading(false);
    }
  };

  // Delete Product
  const executeDeleteProduct = async (id: string) => {
    const prodToDelete = products.find((p) => p.id === id || p._id === id);
    try {
      const res = await axios.delete(`${API_URL}/products/${id}`, getAuthConfig());
      if (res.data.success) {
        showToast("Dish deleted from menu!");
        if (editProd && (editProd.id === id || editProd._id === id)) {
          cancelEditProduct();
        }
        fetchProducts();

        if (prodToDelete?.image) {
          try {
            await axios.post(`${API_URL}/upload/delete`, { url: prodToDelete.image }, getAuthConfig());
          } catch (delErr) {
            console.error("Failed to delete product image", delErr);
          }
        }
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || "Error deleting dish", "error");
    }
  };

  const handleDeleteProduct = (id: string, name: string) => {
    toast(
      (t) => (
        <div className="flex flex-col gap-2 p-1 text-xs">
          <p className="font-700 text-neutral-900">
            Are you sure you want to delete dish <b>&quot;{name}&quot;</b>?
          </p>
          <div className="flex items-center justify-end gap-2 mt-1">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-2.5 py-1 font-600 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                executeDeleteProduct(id);
              }}
              className="px-2.5 py-1 font-700 bg-red-600 hover:bg-red-700 text-white rounded-lg cursor-pointer shadow-sm"
            >
              Delete Dish
            </button>
          </div>
        </div>
      ),
      { duration: 5000, position: "top-center" }
    );
  };

  const isProductButtonDisabled =
    loading ||
    uploading ||
    !prodForm.name.trim() ||
    !prodForm.categoryId;

  // Currently selected station object
  const currentStation =
    KITCHEN_STATIONS.find((s) => s.id === prodForm.kitchenLabel) || KITCHEN_STATIONS[0];
  const CurrentStationIcon = currentStation.icon;

  return (
    <>
      {/* ── LEFT COLUMN: ADD / EDIT PRODUCT FORM ── */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-xs space-y-4 h-fit">
        {/* Card Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-200 text-brand-primary flex items-center justify-center shrink-0">
              <FolderPlus size={16} />
            </div>
            <div>
              <h3 className="text-xs font-800 text-neutral-900 uppercase tracking-wider">
                {editProd ? `Edit Dish: ${editProd.name}` : "Add Menu Dish"}
              </h3>
              <p className="text-[10px] text-neutral-400 font-500">
                {editProd ? "Update pricing, station, and modifiers" : "Create new item for POS & digital menu"}
              </p>
            </div>
          </div>
          {editProd && (
            <button
              onClick={cancelEditProduct}
              className="text-[9.5px] font-700 text-neutral-500 hover:text-neutral-800 bg-neutral-100 hover:bg-neutral-200 px-2.5 py-1 rounded-lg uppercase tracking-wider cursor-pointer transition-colors"
            >
              Cancel Edit
            </button>
          )}
        </div>

        {categories.length === 0 ? (
          <div className="text-center py-8 text-neutral-400 italic text-xs">
            Create a Category first in the Categories tab before adding menu dishes.
          </div>
        ) : (
          <form onSubmit={handleProductSubmit} className="space-y-4">
            
            {/* ── 1. DIETARY CLASSIFICATION (Veg / Non-Veg / Egg) ── */}
            <div className="space-y-2">
              <label className="block text-[10px] font-800 text-neutral-500 uppercase tracking-wider">
                Dietary Classification *
              </label>

              {/* 3 Food Type Buttons */}
              <div className="grid grid-cols-3 gap-2">
                {/* Pure Veg */}
                <button
                  type="button"
                  onClick={() => setProdForm({ ...prodForm, foodType: "veg" })}
                  className={`py-2 px-2.5 rounded-xl border text-[10.5px] font-800 flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    prodForm.foodType === "veg"
                      ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-2xs"
                      : "bg-[#FAFAF9] border-neutral-200 text-neutral-600 hover:bg-neutral-100"
                  }`}
                >
                  <span className="w-3.5 h-3.5 rounded border border-emerald-600 flex items-center justify-center p-0.5 bg-white shrink-0">
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  </span>
                  <span>Pure Veg</span>
                </button>

                {/* Non-Veg */}
                <button
                  type="button"
                  onClick={() => setProdForm({ ...prodForm, foodType: "non_veg" })}
                  className={`py-2 px-2.5 rounded-xl border text-[10.5px] font-800 flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    prodForm.foodType === "non_veg"
                      ? "bg-red-50 border-red-500 text-red-700 shadow-2xs"
                      : "bg-[#FAFAF9] border-neutral-200 text-neutral-600 hover:bg-neutral-100"
                  }`}
                >
                  <span className="w-3.5 h-3.5 rounded border border-red-600 flex items-center justify-center p-0.5 bg-white shrink-0">
                    <span className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[5px] border-b-red-600" />
                  </span>
                  <span>Non-Veg</span>
                </button>

                {/* Eggitarian */}
                <button
                  type="button"
                  onClick={() => setProdForm({ ...prodForm, foodType: "egg" })}
                  className={`py-2 px-2.5 rounded-xl border text-[10.5px] font-800 flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    prodForm.foodType === "egg"
                      ? "bg-amber-50 border-amber-500 text-amber-700 shadow-2xs"
                      : "bg-[#FAFAF9] border-neutral-200 text-neutral-600 hover:bg-neutral-100"
                  }`}
                >
                  <span className="w-3.5 h-3.5 rounded border border-amber-600 flex items-center justify-center p-0.5 bg-white shrink-0">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                  </span>
                  <span>Eggitarian</span>
                </button>
              </div>

              {/* Jain Friendly Option Toggle Button (With Lucide Leaf Icon) */}
              <button
                type="button"
                onClick={() => setProdForm({ ...prodForm, isJainAvailable: !prodForm.isJainAvailable })}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border text-[10.5px] font-700 transition-all cursor-pointer ${
                  prodForm.isJainAvailable
                    ? "bg-emerald-50/80 border-emerald-300 text-emerald-800 shadow-2xs"
                    : "bg-[#FAFAF9] border-neutral-200 text-neutral-600 hover:bg-neutral-100"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-5 h-5 rounded-lg flex items-center justify-center ${
                      prodForm.isJainAvailable ? "bg-emerald-600 text-white" : "bg-neutral-200 text-neutral-500"
                    }`}
                  >
                    <Leaf size={11} strokeWidth={2.5} />
                  </div>
                  <span>Jain Friendly Option (No Onion / No Garlic)</span>
                </div>

                <span
                  className={`text-[9px] font-800 px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    prodForm.isJainAvailable
                      ? "bg-emerald-600 text-white"
                      : "bg-neutral-200 text-neutral-500"
                  }`}
                >
                  {prodForm.isJainAvailable ? "Available" : "No"}
                </span>
              </button>
            </div>

            {/* ── 2. DISH NAME & POS SHORTCODE ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1">
                <label className="block text-[10px] font-800 text-neutral-500 uppercase tracking-wider">
                  Dish Name *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Crispy Veg Burger"
                    value={prodForm.name}
                    onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
                    className="w-full h-10 bg-[#FAFAF9] border border-neutral-200 rounded-xl px-3 text-xs font-semibold text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-brand-primary focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-800 text-neutral-500 uppercase tracking-wider">
                  POS Code
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. CV01"
                    value={prodForm.shortcode}
                    onChange={(e) => setProdForm({ ...prodForm, shortcode: e.target.value.toUpperCase() })}
                    className="w-full h-10 bg-[#FAFAF9] border border-neutral-200 rounded-xl px-3 text-xs font-mono font-800 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-brand-primary focus:bg-white uppercase transition-all"
                  />
                </div>
              </div>
            </div>

            {/* ── 3. CATEGORY & KITCHEN STATION ROUTING (With Lucide Icons) ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Category Dropdown */}
              <div className="space-y-1">
                <label className="block text-[10px] font-800 text-neutral-500 uppercase tracking-wider">
                  Category *
                </label>
                <div className="relative">
                  <select
                    value={prodForm.categoryId}
                    onChange={(e) => setProdForm({ ...prodForm, categoryId: e.target.value })}
                    className="w-full h-10 appearance-none bg-[#FAFAF9] border border-neutral-200 rounded-xl pl-9 pr-8 text-xs font-bold text-neutral-800 focus:outline-none focus:border-brand-primary focus:bg-white transition-all cursor-pointer"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id || c._id} value={(c.id || c._id) as string}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <Folder size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                </div>
              </div>

              {/* Kitchen Station Dropdown (Custom with Lucide Icons - No OS Emojis!) */}
              <div className="space-y-1" ref={stationDropdownRef}>
                <label className="block text-[10px] font-800 text-neutral-500 uppercase tracking-wider">
                  Kitchen Station Routing *
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsStationDropdownOpen(!isStationDropdownOpen)}
                    className="w-full h-10 bg-[#FAFAF9] border border-neutral-200 hover:border-neutral-300 rounded-xl px-3 text-xs font-bold text-neutral-800 flex items-center justify-between cursor-pointer focus:outline-none focus:border-brand-primary transition-all"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center ${currentStation.badgeBg} border ${currentStation.badgeBorder}`}>
                        <CurrentStationIcon size={12} className={currentStation.iconColor} />
                      </div>
                      <span className="truncate">{currentStation.name}</span>
                    </div>
                    <ChevronDown size={14} className={`text-neutral-400 transition-transform ${isStationDropdownOpen ? "rotate-180" : ""}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {isStationDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-white border border-neutral-200 rounded-xl shadow-xl overflow-hidden animate-scale-up p-1">
                      {KITCHEN_STATIONS.map((station) => {
                        const IconComponent = station.icon;
                        const isSelected = prodForm.kitchenLabel === station.id;
                        return (
                          <button
                            key={station.id}
                            type="button"
                            onClick={() => {
                              setProdForm({ ...prodForm, kitchenLabel: station.id });
                              setIsStationDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              isSelected
                                ? "bg-orange-50 text-brand-primary"
                                : "text-neutral-700 hover:bg-neutral-50"
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div className={`w-6 h-6 rounded-md flex items-center justify-center ${station.badgeBg} border ${station.badgeBorder}`}>
                                <IconComponent size={13} className={station.iconColor} />
                              </div>
                              <span>{station.name}</span>
                            </div>
                            {isSelected && <Check size={14} className="text-brand-primary" strokeWidth={2.5} />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── 4. PRICING MODEL (Single Price vs Portion Variants) ── */}
            <div className="p-3.5 bg-[#FAFAF9] border border-neutral-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="block text-[10.5px] font-800 text-neutral-800 uppercase tracking-wider">
                    Pricing Model
                  </span>
                  <span className="block text-[8.5px] text-neutral-400 font-medium">
                    Single flat price or portion sizes (Half/Full, Lite/Heavy)
                  </span>
                </div>

                {/* Model Toggle Buttons */}
                <div className="flex items-center bg-neutral-200/80 p-0.5 rounded-lg shrink-0">
                  <button
                    type="button"
                    onClick={() => setProdForm({ ...prodForm, pricingType: "single", hasVariants: false })}
                    className={`px-3 py-1 rounded-md text-[10px] font-800 transition-all cursor-pointer ${
                      prodForm.pricingType === "single"
                        ? "bg-white text-neutral-900 shadow-2xs"
                        : "text-neutral-500 hover:text-neutral-800"
                    }`}
                  >
                    Single Price
                  </button>
                  <button
                    type="button"
                    onClick={() => setProdForm({ ...prodForm, pricingType: "variant", hasVariants: true })}
                    className={`px-3 py-1 rounded-md text-[10px] font-800 transition-all cursor-pointer ${
                      prodForm.pricingType === "variant"
                        ? "bg-white text-brand-primary shadow-2xs"
                        : "text-neutral-500 hover:text-neutral-800"
                    }`}
                  >
                    Portion Variants
                  </button>
                </div>
              </div>

              {/* Single Price Input */}
              {prodForm.pricingType === "single" ? (
                <div className="space-y-1">
                  <label className="block text-[9.5px] font-800 text-neutral-500 uppercase tracking-wider">
                    Price (₹) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-extrabold text-xs">
                      ₹
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      placeholder="120.00"
                      value={prodForm.price || ""}
                      onChange={(e) =>
                        setProdForm({
                          ...prodForm,
                          price: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full h-10 bg-white border border-neutral-200 rounded-xl pl-8 pr-3 text-xs font-bold text-neutral-900 focus:outline-none focus:border-brand-primary"
                    />
                  </div>
                </div>
              ) : (
                /* Portion Variants Section */
                <div className="space-y-2.5 pt-2 border-t border-neutral-200">
                  {/* Quick Preset Buttons (Using Lucide Icons) */}
                  <div>
                    <span className="block text-[9px] font-800 text-neutral-400 uppercase tracking-wider mb-1.5">
                      Quick Portion Presets:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {(Object.keys(VARIANT_PRESETS) as (keyof typeof VARIANT_PRESETS)[]).map((key) => {
                        const preset = VARIANT_PRESETS[key];
                        const PresetIcon = preset.icon;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => applyVariantPreset(key)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-neutral-100 border border-neutral-200 rounded-lg text-[9.5px] font-700 text-neutral-700 cursor-pointer shadow-2xs transition-all"
                          >
                            <PresetIcon size={12} className="text-brand-primary" />
                            <span>{preset.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Variants Row Editor */}
                  <div className="space-y-1.5">
                    {prodForm.variants.map((v, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 p-2 bg-white border border-neutral-200 rounded-xl"
                      >
                        <input
                          type="text"
                          value={v.name || v.sizeName || ""}
                          onChange={(e) => {
                            const newVariants = [...prodForm.variants];
                            newVariants[idx].name = e.target.value;
                            newVariants[idx].sizeName = e.target.value;
                            setProdForm({ ...prodForm, variants: newVariants });
                          }}
                          placeholder="e.g. Half"
                          className="flex-1 bg-[#FAFAF9] border border-neutral-200 rounded-lg px-2.5 py-1.5 text-xs font-bold focus:outline-none"
                        />

                        <div className="relative w-28">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 font-extrabold text-[11px]">
                            ₹
                          </span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={v.price || ""}
                            onChange={(e) => {
                              const newVariants = [...prodForm.variants];
                              newVariants[idx].price = parseFloat(e.target.value) || 0;
                              setProdForm({ ...prodForm, variants: newVariants });
                            }}
                            placeholder="0"
                            className="w-full bg-[#FAFAF9] border border-neutral-200 rounded-lg pl-6 pr-2 py-1.5 text-xs font-bold focus:outline-none"
                          />
                        </div>

                        <label className="flex items-center gap-1 text-[9.5px] font-700 text-neutral-600 cursor-pointer select-none">
                          <input
                            type="radio"
                            name="defaultVariant"
                            checked={!!v.isDefault}
                            onChange={() => {
                              const newVariants = prodForm.variants.map((item, i) => ({
                                ...item,
                                isDefault: i === idx,
                              }));
                              setProdForm({
                                ...prodForm,
                                variants: newVariants,
                                price: v.price,
                              });
                            }}
                            className="text-brand-primary focus:ring-brand-primary w-3.5 h-3.5 cursor-pointer"
                          />
                          <span>Default</span>
                        </label>

                        <button
                          type="button"
                          onClick={() => handleRemoveVariantRow(idx)}
                          className="text-neutral-400 hover:text-red-500 p-1 cursor-pointer transition-colors"
                          title="Remove variant"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={handleAddVariantRow}
                      className="w-full py-2 bg-white hover:bg-neutral-50 border border-dashed border-neutral-300 rounded-xl text-[10px] font-700 text-neutral-600 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Plus size={12} />
                      <span>Add Another Portion Variant</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ── 5. DESCRIPTION ── */}
            <div className="space-y-1">
              <label className="block text-[10px] font-800 text-neutral-500 uppercase tracking-wider">
                Description (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="Dish ingredients, flavor notes, or allergen information..."
                value={prodForm.description}
                onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })}
                className="w-full bg-[#FAFAF9] border border-neutral-200 rounded-xl p-3 text-xs text-neutral-800 placeholder-neutral-400 resize-none focus:outline-none focus:border-brand-primary focus:bg-white transition-all"
              />
            </div>

            {/* ── 6. DISH IMAGE (Cloudinary Upload) ── */}
            <div className="space-y-1">
              <label className="block text-[10px] font-800 text-neutral-500 uppercase tracking-wider">
                Dish Photo <span className="normal-case font-500 text-neutral-400">(Cloudinary Upload)</span>
              </label>
              <div className="flex items-center gap-3">
                {prodForm.image ? (
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-neutral-200 bg-neutral-50 shrink-0">
                    <img
                      src={prodForm.image}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveProductImage}
                      className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-[9px] font-700 hover:bg-black/70 transition-all cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <label className="w-16 h-16 rounded-xl border-2 border-dashed border-neutral-300 hover:border-brand-primary flex flex-col items-center justify-center text-neutral-400 hover:text-brand-primary bg-neutral-50 cursor-pointer transition-all shrink-0 select-none">
                    <ImageIcon size={18} />
                    <span className="text-[8px] font-700 uppercase mt-1">Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageUpload(e.target.files?.[0])}
                      disabled={uploading}
                    />
                  </label>
                )}

                <div className="flex-1">
                  {uploading ? (
                    <div className="text-[11px] font-700 text-brand-primary animate-pulse flex items-center gap-1.5">
                      <Loader2 size={13} className="animate-spin" />
                      <span>Uploading to Cloudinary CDN...</span>
                    </div>
                  ) : (
                    <div className="text-[10px] text-neutral-400 leading-normal flex items-start gap-1.5">
                      <Sparkles size={13} className="text-brand-primary shrink-0 mt-0.5" />
                      <span>Food photo is auto-compressed & hosted on Cloudinary CDN for instant loading.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── 7. DISPLAY ORDER & BADGE ── */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[10px] font-800 text-neutral-500 uppercase tracking-wider">
                  Display Order
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 1"
                  value={prodForm.displayOrder || 0}
                  onChange={(e) =>
                    setProdForm({
                      ...prodForm,
                      displayOrder: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full h-10 bg-[#FAFAF9] border border-neutral-200 rounded-xl px-3 text-xs font-semibold focus:outline-none focus:border-brand-primary focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-800 text-neutral-500 uppercase tracking-wider">
                  Badge (Optional)
                </label>
                <div className="relative">
                  <select
                    value={prodForm.badge || ""}
                    onChange={(e) =>
                      setProdForm({
                        ...prodForm,
                        badge: (e.target.value === "" ? null : e.target.value) as any,
                      })
                    }
                    className="w-full h-10 appearance-none bg-[#FAFAF9] border border-neutral-200 rounded-xl px-3 text-xs font-bold text-neutral-800 focus:outline-none focus:border-brand-primary focus:bg-white cursor-pointer"
                  >
                    <option value="">None</option>
                    <option value="Popular">Popular</option>
                    <option value="Best Seller">Best Seller</option>
                    <option value="New">New</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* ── 8. ACTIVE STATUS SWITCH ── */}
            <div className="flex items-center justify-between p-3 bg-[#FAFAF9] border border-neutral-200 rounded-xl">
              <div>
                <span className="block text-[10.5px] font-800 text-neutral-800 uppercase tracking-wider">
                  Menu Active Status
                </span>
                <span className="block text-[8.5px] text-neutral-400">
                  Toggle whether this item appears on the live POS terminal & customer menu.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setProdForm({ ...prodForm, isActive: prodForm.isActive !== false ? false : true })}
                className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  prodForm.isActive !== false ? "bg-emerald-600" : "bg-neutral-300"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    prodForm.isActive !== false ? "translate-x-[20px]" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* ── 9. LINK MODIFIER GROUPS (OPTIONAL) ── */}
            <div className="space-y-2 pt-2 border-t border-neutral-100">
              <div className="flex items-center justify-between">
                <label className="block text-[10px] font-800 text-neutral-500 uppercase tracking-wider">
                  Link Modifier / Addon Groups
                </label>
                {modifiers.length > 0 && (
                  <span className="text-[9px] font-800 text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded">
                    {prodForm.modifierGroups.length} Selected
                  </span>
                )}
              </div>

              {modifiers.length === 0 ? (
                <p className="text-[10px] text-neutral-400 italic">
                  No modifier groups created yet.
                </p>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      type="text"
                      value={modGroupSearch}
                      onChange={(e) => setModGroupSearch(e.target.value)}
                      placeholder="Search modifier groups..."
                      className="w-full bg-[#FAFAF9] border border-neutral-200 rounded-lg py-1.5 pl-7 pr-6 text-xs text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-brand-primary"
                    />
                    {modGroupSearch && (
                      <button
                        type="button"
                        onClick={() => setModGroupSearch("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                      >
                        <X size={11} />
                      </button>
                    )}
                  </div>

                  <div className="border border-neutral-200 rounded-xl bg-[#FAFAF9] overflow-hidden max-h-40 overflow-y-auto p-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {sortedModifiers
                        .filter((g) => {
                          if (!modGroupSearch.trim()) return true;
                          const q = modGroupSearch.toLowerCase().trim();
                          return (
                            g.name.toLowerCase().includes(q) ||
                            g.options.some((opt) => opt.name.toLowerCase().includes(q))
                          );
                        })
                        .map((g) => {
                          const gid = (g.id || g._id) as string;
                          const linked = prodForm.modifierGroups.includes(gid);
                          return (
                            <button
                              key={gid}
                              type="button"
                              onClick={() => handleProductModifierToggle(gid)}
                              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10.5px] font-600 transition-all text-left cursor-pointer ${
                                linked
                                  ? "bg-orange-50 border-brand-primary text-brand-primary font-bold"
                                  : "bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50 hover:text-neutral-800"
                              }`}
                            >
                              <div
                                className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-all ${
                                  linked
                                    ? "bg-brand-primary border-brand-primary text-white"
                                    : "border-neutral-300 bg-white"
                                }`}
                              >
                                {linked && <Check size={9} strokeWidth={3} />}
                              </div>
                              <span className="truncate flex-1 min-w-0">{g.name}</span>
                            </button>
                          );
                        })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── 10. SUBMIT BUTTONS ── */}
            <div className="flex gap-2 pt-2">
              {editProd && (
                <button
                  type="button"
                  onClick={cancelEditProduct}
                  className="flex-1 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl text-xs font-800 uppercase tracking-wider transition-all cursor-pointer text-center"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={isProductButtonDisabled}
                className="flex-2 py-3 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-xl text-xs font-800 uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-95 disabled:bg-neutral-300 disabled:text-neutral-400 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {loading || uploading ? (
                  <>
                    <Loader2 size={14} className="animate-spin text-neutral-400" strokeWidth={3} />
                    <span>{uploading ? "Uploading Image..." : "Saving Dish..."}</span>
                  </>
                ) : editProd ? (
                  "Save Changes"
                ) : (
                  "Add Dish to Menu"
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ── RIGHT COLUMN: PRODUCTS LIST ── */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-xs space-y-4">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-neutral-100 gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-200 text-brand-primary flex items-center justify-center shrink-0">
              <Layers size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-800 text-neutral-900 uppercase tracking-wider">
                  Dishes & Menu Items
                </h3>
                <span className="text-[9.5px] bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded-full font-bold">
                  {searchQuery || foodTypeFilter !== "all" || categoryFilter !== "all"
                    ? `${filteredProducts.length} / ${products.length}`
                    : `${products.length}`}
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 font-500">
                Live catalog across all stations & categories
              </p>
            </div>
          </div>

          {/* Search Input Bar */}
          <div className="relative w-full sm:w-64">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, shortcode..."
              className="w-full h-9 bg-[#FAFAF9] border border-neutral-200 rounded-xl pl-8 pr-8 text-xs text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-brand-primary focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 cursor-pointer"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* ── FILTER TABS: DIETARY (Veg / Non-Veg / Egg) & CATEGORY ── */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Dietary Filter Pills with Lucide Icons */}
          <div className="flex items-center gap-1 bg-[#FAFAF9] p-1 rounded-xl border border-neutral-200">
            {/* All */}
            <button
              onClick={() => setFoodTypeFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-[10.5px] font-800 uppercase transition-all cursor-pointer ${
                foodTypeFilter === "all"
                  ? "bg-white text-neutral-900 shadow-2xs border border-neutral-200/80"
                  : "text-neutral-500 hover:text-neutral-800"
              }`}
            >
              All Items
            </button>

            {/* Pure Veg */}
            <button
              onClick={() => setFoodTypeFilter("veg")}
              className={`px-3 py-1.5 rounded-lg text-[10.5px] font-800 uppercase flex items-center gap-1.5 transition-all cursor-pointer ${
                foodTypeFilter === "veg"
                  ? "bg-emerald-600 text-white shadow-2xs"
                  : "text-emerald-700 hover:bg-emerald-50"
              }`}
            >
              <CircleDot size={12} className={foodTypeFilter === "veg" ? "text-white" : "text-emerald-600"} />
              <span>Pure Veg</span>
            </button>

            {/* Non-Veg */}
            <button
              onClick={() => setFoodTypeFilter("non_veg")}
              className={`px-3 py-1.5 rounded-lg text-[10.5px] font-800 uppercase flex items-center gap-1.5 transition-all cursor-pointer ${
                foodTypeFilter === "non_veg"
                  ? "bg-red-600 text-white shadow-2xs"
                  : "text-red-700 hover:bg-red-50"
              }`}
            >
              <Triangle size={10} className={`${foodTypeFilter === "non_veg" ? "text-white fill-white" : "text-red-600 fill-red-600"}`} />
              <span>Non-Veg</span>
            </button>

            {/* Egg */}
            <button
              onClick={() => setFoodTypeFilter("egg")}
              className={`px-3 py-1.5 rounded-lg text-[10.5px] font-800 uppercase flex items-center gap-1.5 transition-all cursor-pointer ${
                foodTypeFilter === "egg"
                  ? "bg-amber-500 text-white shadow-2xs"
                  : "text-amber-700 hover:bg-amber-50"
              }`}
            >
              <CircleDot size={12} className={foodTypeFilter === "egg" ? "text-white" : "text-amber-500"} />
              <span>Egg</span>
            </button>
          </div>

          {/* Category Filter Dropdown */}
          <div className="relative">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="appearance-none bg-[#FAFAF9] border border-neutral-200 hover:border-neutral-300 rounded-xl pl-7 pr-8 py-1.5 text-xs font-bold text-neutral-700 focus:outline-none focus:border-brand-primary cursor-pointer transition-all"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id || c._id} value={(c.id || c._id) as string}>
                  {c.name}
                </option>
              ))}
            </select>
            <Folder size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
          </div>
        </div>

        {/* ── PRODUCTS CARDS GRID ── */}
        {products.length === 0 ? (
          <div className="text-center py-16 text-neutral-400 italic text-xs">
            No menu dishes added yet. Use the form on the left to add your first dish.
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16 text-neutral-400 italic text-xs">
            No dishes matching your search and filter criteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredProducts.map((prod) => {
              const stationObj =
                KITCHEN_STATIONS.find((s) => s.id === prod.kitchenLabel) || KITCHEN_STATIONS[5];
              const StationIconComponent = stationObj.icon;

              const hasVariants =
                prod.pricingType === "variant" || (prod.variants && prod.variants.length > 0);
              const minPrice =
                hasVariants && prod.variants && prod.variants.length > 0
                  ? Math.min(...prod.variants.map((v) => v.price))
                  : prod.price || 0;
              const maxPrice =
                hasVariants && prod.variants && prod.variants.length > 0
                  ? Math.max(...prod.variants.map((v) => v.price))
                  : prod.price || 0;

              return (
                <div
                  key={prod.id || prod._id}
                  className="p-3.5 border border-neutral-200 rounded-2xl bg-white flex gap-3 shadow-2xs hover:border-neutral-300 hover:shadow-xs transition-all"
                >
                  {/* Photo Thumbnail */}
                  <div className="w-18 h-18 rounded-xl overflow-hidden border border-neutral-200 bg-neutral-100 shrink-0">
                    {prod.image ? (
                      <img
                        src={prod.image}
                        alt={prod.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-400">
                        <ImageIcon size={20} />
                      </div>
                    )}
                  </div>

                  {/* Info Column */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      {/* Top Header: Dietary Badge, Name, Shortcode, Price */}
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          {/* FSSAI Official Style Dietary Icon */}
                          {prod.foodType === "veg" ? (
                            <span
                              className="w-4 h-4 rounded border border-emerald-600 flex items-center justify-center p-0.5 bg-emerald-50 shrink-0"
                              title="Pure Veg"
                            >
                              <span className="w-2 h-2 rounded-full bg-emerald-600" />
                            </span>
                          ) : prod.foodType === "non_veg" ? (
                            <span
                              className="w-4 h-4 rounded border border-red-600 flex items-center justify-center p-0.5 bg-red-50 shrink-0"
                              title="Non-Veg"
                            >
                              <span className="w-0 h-0 border-l-[3.5px] border-l-transparent border-r-[3.5px] border-r-transparent border-b-[6px] border-b-red-600" />
                            </span>
                          ) : (
                            <span
                              className="w-4 h-4 rounded border border-amber-600 flex items-center justify-center p-0.5 bg-amber-50 shrink-0"
                              title="Contains Egg"
                            >
                              <span className="w-2 h-2 rounded-full bg-amber-500" />
                            </span>
                          )}

                          {/* Full Dish Name (No aggressive truncation) */}
                          <h4
                            className="text-xs font-800 text-neutral-900 leading-tight truncate"
                            title={prod.name}
                          >
                            {prod.name}
                          </h4>

                          {/* Shortcode Pill */}
                          {prod.shortcode && (
                            <span className="text-[8.5px] font-mono font-800 bg-neutral-800 text-white px-1.5 py-0.5 rounded shrink-0">
                              {prod.shortcode}
                            </span>
                          )}
                        </div>

                        {/* Price formatted in INR */}
                        <span className="text-xs font-900 text-brand-primary shrink-0 pl-1">
                          {hasVariants && minPrice !== maxPrice
                            ? `₹${minPrice} - ₹${maxPrice}`
                            : `₹${(prod.price || 0).toFixed(2)}`}
                        </span>
                      </div>

                      {/* Badges Row (Categories, Lucide Station, Jain, Order, Status) */}
                      <div className="flex items-center gap-1.5 flex-wrap mt-2">
                        {/* Category */}
                        <span className="bg-neutral-100 text-neutral-700 text-[8.5px] font-700 px-1.5 py-0.5 rounded uppercase flex items-center gap-1 border border-neutral-200">
                          <Folder size={9} className="text-neutral-500" />
                          <span>{prod.categoryId?.name || "Uncategorized"}</span>
                        </span>

                        {/* Kitchen Station with Lucide Icon (No OS Emojis!) */}
                        <span
                          className={`text-[8.5px] font-800 px-1.5 py-0.5 rounded uppercase border flex items-center gap-1 ${stationObj.badgeBg} ${stationObj.badgeText} ${stationObj.badgeBorder}`}
                        >
                          <StationIconComponent size={10} className={stationObj.iconColor} />
                          <span>{stationObj.name}</span>
                        </span>

                        {/* Jain Badge */}
                        {prod.isJainAvailable && (
                          <span className="bg-emerald-50 text-emerald-800 text-[8.5px] font-800 px-1.5 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                            <Leaf size={9} className="text-emerald-600" />
                            <span>Jain</span>
                          </span>
                        )}

                        {/* Order */}
                        <span className="bg-neutral-100 text-neutral-600 text-[8.5px] font-700 px-1.5 py-0.5 rounded border border-neutral-200">
                          Ord: {prod.displayOrder ?? 0}
                        </span>

                        {/* Active / Inactive Badge */}
                        <span
                          className={`text-[8.5px] font-800 px-1.5 py-0.5 rounded uppercase border ${
                            prod.isActive !== false
                              ? "bg-green-50 text-green-700 border-green-200"
                              : "bg-red-50 text-red-600 border-red-200"
                          }`}
                        >
                          {prod.isActive !== false ? "Active" : "Inactive"}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-[10px] text-neutral-400 mt-2 line-clamp-2 leading-relaxed">
                        {prod.description || "No description provided."}
                      </p>

                      {/* Portion Variants Pill List */}
                      {hasVariants && prod.variants && prod.variants.length > 0 && (
                        <div className="mt-2 text-[8.5px] text-neutral-600 font-bold flex flex-wrap gap-1">
                          {prod.variants.map((v, i) => (
                            <span key={i} className="bg-neutral-50 border border-neutral-200/80 px-1.5 py-0.5 rounded">
                              {v.name || v.sizeName}: ₹{v.price}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Bottom Action Bar */}
                    <div className="flex items-center justify-end gap-1.5 mt-3 pt-2 border-t border-neutral-100">
                      {/* Branch Visibility Button */}
                      <button
                        type="button"
                        onClick={() =>
                          setVisibilityTarget({
                            id: (prod.id || prod._id) as string,
                            name: prod.name,
                            disabledBranches: prod.disabledBranches || [],
                          })
                        }
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-neutral-50 hover:bg-neutral-100 text-neutral-600 border border-neutral-200 transition-all cursor-pointer"
                        title="Configure Branch Visibility"
                      >
                        <Store size={12} />
                      </button>

                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => startEditProduct(prod)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-orange-50 hover:bg-orange-100 text-brand-primary border border-orange-200 transition-all cursor-pointer"
                        title="Edit Dish"
                      >
                        <Edit size={12} />
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => handleDeleteProduct((prod.id || prod._id) as string, prod.name)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition-all cursor-pointer"
                        title="Delete Dish"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── BRANCH VISIBILITY MODAL ── */}
      {visibilityTarget && (
        <BranchVisibilityModal
          isOpen={!!visibilityTarget}
          onClose={() => setVisibilityTarget(null)}
          targetType="product"
          targetId={visibilityTarget.id}
          targetName={visibilityTarget.name}
          disabledBranches={visibilityTarget.disabledBranches}
          onUpdated={fetchProducts}
        />
      )}
    </>
  );
}
