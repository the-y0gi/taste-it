'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  Search,
  UtensilsCrossed,
  RefreshCw,
  ImageIcon,
  X,
  Plus,
  Edit2,
  Trash2,
  FolderPlus,
  Layers,
  Flame,
  CheckCircle2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Eye,
  EyeOff,
  UploadCloud,
  Loader2,
} from 'lucide-react';
import PosNavbar from '@/modules/employee-pos/components/PosNavbar';
import POSSidebarDrawer from '@/modules/employee-pos/components/POSSidebarDrawer';
import EmployeePermissionGuard from '@/modules/employee-pos/components/EmployeePermissionGuard';

// ── Types ──────────────────────────────────────────────────────────────────
export interface ProductVariant {
  name: string;
  price: number;
  sizeCode?: string;
  sizeName?: string;
  isDefault?: boolean;
}

export interface ProductAddon {
  name: string;
  price: number;
}

export interface Product {
  _id: string;
  id?: string;
  name: string;
  shortcode?: string;
  foodType?: 'veg' | 'non_veg' | 'egg';
  isJainAvailable?: boolean;
  pricingType?: 'single' | 'variant';
  price: number;
  variants?: ProductVariant[];
  addons?: ProductAddon[];
  description?: string;
  image?: string;
  itemType?: 'simple' | 'combo';
  categoryId?: any;
  kitchenLabel?: string;
  badge?: string | null;
  displayOrder?: number;
  productId?: string;
  isActive?: boolean;
  isOutOfStock?: boolean;
  branchId?: string;
}

export interface Category {
  _id: string;
  id?: string;
  name: string;
  slug: string;
  image?: string;
  description?: string;
  displayOrder?: number;
  isActive?: boolean;
  branchId?: string;
}

export default function BranchMenuPage() {
  const [activeTab, setActiveTab] = useState<'products' | 'categories'>('products');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [foodTypeFilter, setFoodTypeFilter] = useState<'all' | 'veg' | 'non_veg' | 'egg'>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'out_of_stock'>('all');

  // Modals
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Product Form State
  const [prodForm, setProdForm] = useState<{
    name: string;
    shortcode: string;
    categoryId: string;
    foodType: 'veg' | 'non_veg' | 'egg';
    isJainAvailable: boolean;
    pricingType: 'single' | 'variant';
    price: number;
    variants: ProductVariant[];
    addons: ProductAddon[];
    kitchenLabel: string;
    description: string;
    image: string;
    badge: string;
    displayOrder: number;
  }>({
    name: '',
    shortcode: '',
    categoryId: '',
    foodType: 'veg',
    isJainAvailable: false,
    pricingType: 'single',
    price: 0,
    variants: [
      { name: 'Lite (1 Tikki)', price: 90, isDefault: true },
      { name: 'Heavy (2 Tikki)', price: 120, isDefault: false },
    ],
    addons: [],
    kitchenLabel: 'fast_food',
    description: '',
    image: '',
    badge: '',
    displayOrder: 0,
  });

  // Category Form State
  const [catForm, setCatForm] = useState<{
    name: string;
    slug: string;
    description: string;
    image: string;
    displayOrder: number;
    isActive: boolean;
  }>({
    name: '',
    slug: '',
    description: '',
    image: '',
    displayOrder: 0,
    isActive: true,
  });

  // Cloudinary Upload States
  const [uploadingCatImg, setUploadingCatImg] = useState(false);
  const [uploadingProdImg, setUploadingProdImg] = useState(false);

  // Client-side image compression for ultra-fast Cloudinary uploads
  const compressImage = (
    file: File,
    maxWidth = 800,
    maxHeight = 800,
    quality = 0.85
  ): Promise<File> => {
    return new Promise((resolve) => {
      if (!file.type.startsWith('image/')) {
        return resolve(file);
      }
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(file);
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (!blob) return resolve(file);
              const compressed = new File([blob], file.name, {
                type: file.type || 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressed);
            },
            file.type || 'image/jpeg',
            quality
          );
        };
        img.onerror = () => resolve(file);
      };
      reader.onerror = () => resolve(file);
    });
  };

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  // ── Helper to retrieve current branch data ────────────────────────────────
  const getBranchInfo = () => {
    if (typeof window !== 'undefined') {
      const rawBranch = localStorage.getItem('rms_branch');
      if (rawBranch) {
        try {
          const b = JSON.parse(rawBranch);
          return {
            branchId: b._id || b.id,
            branchName: b.name || 'My Branch',
            token: b.token || '',
          };
        } catch (e) {}
      }
    }
    return { branchId: '', branchName: 'My Branch', token: '' };
  };

  const getAuthHeaders = () => {
    const { branchId, token } = getBranchInfo();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (branchId) headers['x-branch-id'] = branchId;
    return headers;
  };

  // ── Cloudinary Upload Handlers ───────────────────────────────────────────
  const handleUploadCategoryImg = async (file?: File) => {
    if (!file) return;
    setUploadingCatImg(true);
    const toastId = toast.loading('Uploading category image to Cloudinary...');
    try {
      const compressed = await compressImage(file, 800, 800, 0.85);
      const formData = new FormData();
      formData.append('image', compressed);

      const headers = getAuthHeaders();
      const res = await axios.post(`${apiUrl}/menu/upload`, formData, {
        headers: {
          ...headers,
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data?.success && res.data?.url) {
        setCatForm((prev) => ({ ...prev, image: res.data.url }));
        toast.success('Category image uploaded to Cloudinary! ☁️', { id: toastId });
      } else {
        throw new Error(res.data?.message || 'Upload failed');
      }
    } catch (err: any) {
      console.error('Cloudinary category upload error:', err);
      toast.error(err.response?.data?.message || err.message || 'Image upload failed', { id: toastId });
    } finally {
      setUploadingCatImg(false);
    }
  };

  const handleUploadProductImg = async (file?: File) => {
    if (!file) return;
    setUploadingProdImg(true);
    const toastId = toast.loading('Uploading dish image to Cloudinary...');
    try {
      const compressed = await compressImage(file, 800, 800, 0.85);
      const formData = new FormData();
      formData.append('image', compressed);

      const headers = getAuthHeaders();
      const res = await axios.post(`${apiUrl}/menu/upload`, formData, {
        headers: {
          ...headers,
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data?.success && res.data?.url) {
        setProdForm((prev) => ({ ...prev, image: res.data.url }));
        toast.success('Dish image uploaded to Cloudinary! ☁️', { id: toastId });
      } else {
        throw new Error(res.data?.message || 'Upload failed');
      }
    } catch (err: any) {
      console.error('Cloudinary dish upload error:', err);
      toast.error(err.response?.data?.message || err.message || 'Image upload failed', { id: toastId });
    } finally {
      setUploadingProdImg(false);
    }
  };

  // ── Fetch Menu Data ───────────────────────────────────────────────────────
  const fetchMenuData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { branchId } = getBranchInfo();
      const headers = getAuthHeaders();

      // Fetch Categories
      const catRes = await axios.get(`${apiUrl}/menu/categories`, {
        params: branchId ? { branchId } : {},
        headers,
      });
      if (catRes.data?.success) {
        setCategories(catRes.data.data || []);
      }

      // Fetch Products
      const prodRes = await axios.get(`${apiUrl}/menu/products`, {
        params: branchId ? { branchId } : {},
        headers,
      });
      if (prodRes.data?.success) {
        setProducts(prodRes.data.data || []);
      }
    } catch (err: any) {
      console.error('Error fetching branch menu:', err);
      setError(err.response?.data?.message || 'Failed to load menu data');
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    fetchMenuData();
  }, [fetchMenuData]);

  // ── Category Handlers ────────────────────────────────────────────────────
  const handleOpenCategoryModal = (cat?: Category) => {
    if (cat) {
      setEditingCategory(cat);
      setCatForm({
        name: cat.name,
        slug: cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-'),
        description: cat.description || '',
        image: cat.image || '',
        displayOrder: cat.displayOrder || 0,
        isActive: cat.isActive !== false,
      });
    } else {
      setEditingCategory(null);
      setCatForm({
        name: '',
        slug: '',
        description: '',
        image: '',
        displayOrder: categories.length + 1,
        isActive: true,
      });
    }
    setShowCategoryModal(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catForm.name.trim()) return toast.error('Category name is required');
    const { branchId } = getBranchInfo();
    const headers = getAuthHeaders();

    setIsSubmitting(true);
    const slug = catForm.slug.trim() || catForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    try {
      if (editingCategory) {
        const id = editingCategory._id || editingCategory.id;
        await axios.put(
          `${apiUrl}/menu/categories/${id}`,
          { ...catForm, slug, branchId },
          { headers }
        );
        toast.success(`Category "${catForm.name}" updated!`);
      } else {
        await axios.post(
          `${apiUrl}/menu/categories`,
          { ...catForm, slug, branchId },
          { headers }
        );
        toast.success(`Category "${catForm.name}" created!`);
      }
      setShowCategoryModal(false);
      fetchMenuData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save category');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async (cat: Category) => {
    if (!confirm(`Are you sure you want to delete category "${cat.name}"?`)) return;
    try {
      const headers = getAuthHeaders();
      const id = cat._id || cat.id;
      await axios.delete(`${apiUrl}/menu/categories/${id}`, { headers });
      toast.success('Category deleted successfully');
      fetchMenuData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete category');
    }
  };

  // ── Product Handlers ─────────────────────────────────────────────────────
  const handleOpenProductModal = (prod?: Product) => {
    if (prod) {
      setEditingProduct(prod);
      const catId = typeof prod.categoryId === 'object' ? prod.categoryId?._id : prod.categoryId;
      setProdForm({
        name: prod.name,
        shortcode: prod.shortcode || '',
        categoryId: catId || (categories[0]?._id || ''),
        foodType: prod.foodType || 'veg',
        isJainAvailable: !!prod.isJainAvailable,
        pricingType: prod.pricingType || (prod.variants && prod.variants.length > 0 ? 'variant' : 'single'),
        price: prod.price || 0,
        variants: prod.variants && prod.variants.length > 0 ? prod.variants : [
          { name: 'Lite', price: prod.price || 90, isDefault: true },
          { name: 'Heavy', price: (prod.price || 90) + 30, isDefault: false },
        ],
        addons: prod.addons || [],
        kitchenLabel: prod.kitchenLabel || 'fast_food',
        description: prod.description || '',
        image: prod.image || '',
        badge: prod.badge || '',
        displayOrder: prod.displayOrder || 0,
      });
    } else {
      setEditingProduct(null);
      setProdForm({
        name: '',
        shortcode: '',
        categoryId: categories[0]?._id || '',
        foodType: 'veg',
        isJainAvailable: false,
        pricingType: 'single',
        price: 0,
        variants: [
          { name: 'Lite (1 Tikki)', price: 90, isDefault: true },
          { name: 'Heavy (2 Tikki)', price: 120, isDefault: false },
        ],
        addons: [],
        kitchenLabel: 'fast_food',
        description: '',
        image: '',
        badge: '',
        displayOrder: products.length + 1,
      });
    }
    setShowProductModal(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodForm.name.trim()) return toast.error('Dish name is required');
    if (!prodForm.categoryId) return toast.error('Please select a category');

    const { branchId } = getBranchInfo();
    const headers = getAuthHeaders();

    // Compute base price
    let finalBasePrice = prodForm.price;
    if (prodForm.pricingType === 'variant') {
      const def = prodForm.variants.find((v) => v.isDefault) || prodForm.variants[0];
      finalBasePrice = def ? def.price : 0;
    }

    const payload = {
      ...prodForm,
      price: finalBasePrice,
      hasVariants: prodForm.pricingType === 'variant',
      branchId,
      badge: prodForm.badge || null,
    };

    setIsSubmitting(true);
    try {
      if (editingProduct) {
        const id = editingProduct._id || editingProduct.id;
        await axios.put(`${apiUrl}/menu/products/${id}`, payload, { headers });
        toast.success(`Dish "${prodForm.name}" updated!`);
      } else {
        await axios.post(`${apiUrl}/menu/products`, payload, { headers });
        toast.success(`Dish "${prodForm.name}" added to menu!`);
      }
      setShowProductModal(false);
      fetchMenuData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (prod: Product) => {
    if (!confirm(`Are you sure you want to delete dish "${prod.name}"?`)) return;
    try {
      const headers = getAuthHeaders();
      const id = prod._id || prod.id;
      await axios.delete(`${apiUrl}/menu/products/${id}`, { headers });
      toast.success('Dish deleted from menu');
      fetchMenuData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete dish');
    }
  };

  const handleToggleStock = async (prod: Product) => {
    try {
      const { branchId } = getBranchInfo();
      const headers = getAuthHeaders();
      const id = prod._id || prod.id;
      const nextStock = !prod.isOutOfStock;

      await axios.patch(
        `${apiUrl}/menu/products/${id}/toggle-stock`,
        { isOutOfStock: nextStock, branchId },
        { headers }
      );
      setProducts((prev) =>
        prev.map((p) => (p._id === id ? { ...p, isOutOfStock: nextStock } : p))
      );
      toast.success(`${prod.name} is now ${nextStock ? 'Out of Stock' : 'In Stock'}`);
    } catch (err: any) {
      toast.error('Failed to update stock status');
    }
  };

  // ── Variant Preset Loaders ───────────────────────────────────────────────
  const applyVariantPreset = (type: 'burger' | 'half_full' | 'pizza' | 'shake') => {
    if (type === 'burger') {
      setProdForm((prev) => ({
        ...prev,
        pricingType: 'variant',
        variants: [
          { name: 'Lite (1 Tikki)', price: 90, isDefault: true },
          { name: 'Heavy (2 Tikki)', price: 120, isDefault: false },
        ],
      }));
    } else if (type === 'half_full') {
      setProdForm((prev) => ({
        ...prev,
        pricingType: 'variant',
        variants: [
          { name: 'Half', price: 135, isDefault: true },
          { name: 'Full', price: 215, isDefault: false },
        ],
      }));
    } else if (type === 'pizza') {
      setProdForm((prev) => ({
        ...prev,
        pricingType: 'variant',
        variants: [
          { name: 'Normal', price: 140, isDefault: true },
          { name: 'Extra Cheese', price: 160, isDefault: false },
        ],
      }));
    } else if (type === 'shake') {
      setProdForm((prev) => ({
        ...prev,
        pricingType: 'variant',
        variants: [
          { name: 'Normal', price: 60, isDefault: true },
          { name: 'With Ice Cream', price: 80, isDefault: false },
          { name: 'VIP Pure Ice Cream', price: 120, isDefault: false },
        ],
      }));
    }
  };

  // ── Filtered Products ────────────────────────────────────────────────────
  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = prod.name.toLowerCase().includes(q);
        const matchesCode = prod.shortcode?.toLowerCase().includes(q);
        if (!matchesName && !matchesCode) return false;
      }
      // Category
      if (selectedCategoryFilter !== 'all') {
        const catId = typeof prod.categoryId === 'object' ? prod.categoryId?._id : prod.categoryId;
        if (catId !== selectedCategoryFilter) return false;
      }
      // Food Type
      if (foodTypeFilter !== 'all') {
        if (prod.foodType !== foodTypeFilter) return false;
      }
      // Stock Status
      if (stockFilter === 'in_stock' && prod.isOutOfStock) return false;
      if (stockFilter === 'out_of_stock' && !prod.isOutOfStock) return false;

      return true;
    });
  }, [products, searchQuery, selectedCategoryFilter, foodTypeFilter, stockFilter]);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <EmployeePermissionGuard permissionKey="menus">
      <div className="flex flex-col h-screen w-full bg-[#F7F7F7] overflow-hidden select-none font-sans">
        {/* Top Navbar */}
        <PosNavbar onToggleSidebar={() => setIsSidebarOpen(true)} />

        {/* Sidebar Drawer */}
        <POSSidebarDrawer
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          activeTab="menus"
          onSelectTab={() => {}}
        />

        {/* Main Header / Navigation Bar */}
        <div className="bg-white border-b border-neutral-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 shadow-xs">
              <UtensilsCrossed size={20} />
            </div>
            <div>
              <h1 className="text-lg font-900 text-neutral-900 tracking-tight flex items-center gap-2">
                <span>Branch Menu &amp; Catalog</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                  {getBranchInfo().branchName}
                </span>
              </h1>
              <p className="text-[11px] font-medium text-neutral-400">
                Manage your branch categories, Indian food items, pricing variants &amp; daily stock status
              </p>
            </div>
          </div>

          {/* Action Tabs & Buttons */}
          <div className="flex items-center gap-2.5">
            <div className="flex bg-neutral-100 p-1 rounded-xl border border-neutral-200">
              <button
                type="button"
                onClick={() => setActiveTab('products')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'products'
                    ? 'bg-white text-orange-600 shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                Dishes ({products.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('categories')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'categories'
                    ? 'bg-white text-orange-600 shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                Categories ({categories.length})
              </button>
            </div>

            <button
              type="button"
              onClick={fetchMenuData}
              title="Refresh"
              className="p-2 bg-white border border-neutral-200 text-neutral-600 hover:text-neutral-900 rounded-xl hover:bg-neutral-50 transition-all cursor-pointer shadow-xs"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>

            {activeTab === 'products' ? (
              <button
                type="button"
                onClick={() => handleOpenProductModal()}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-md shadow-orange-500/20 active:scale-95 cursor-pointer"
              >
                <Plus size={15} strokeWidth={3} />
                <span>Add Dish</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleOpenCategoryModal()}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-md shadow-orange-500/20 active:scale-95 cursor-pointer"
              >
                <FolderPlus size={15} strokeWidth={2.5} />
                <span>Add Category</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab 1: Products / Dishes View */}
        {activeTab === 'products' && (
          <div className="flex-1 flex flex-col min-h-0 p-6 overflow-hidden">
            {/* Filter Bar */}
            <div className="bg-white border border-neutral-200 rounded-2xl p-3.5 mb-4 shadow-xs flex flex-wrap items-center justify-between gap-3 shrink-0">
              {/* Search */}
              <div className="relative flex-1 min-w-[220px] max-w-md">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search dish name or cashier shortcode (e.g. COB)..."
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Filters Group */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Category Dropdown */}
                <select
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                  className="bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-bold text-neutral-700 focus:outline-none focus:border-orange-500 cursor-pointer"
                >
                  <option value="all">All Categories</option>
                  {categories.map((c) => (
                    <option key={c._id || c.id} value={c._id || c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>

                {/* Food Type Pill Buttons */}
                <div className="flex bg-neutral-100 p-0.5 rounded-xl border border-neutral-200">
                  <button
                    onClick={() => setFoodTypeFilter('all')}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer ${
                      foodTypeFilter === 'all' ? 'bg-white text-neutral-800 shadow-xs' : 'text-neutral-500'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFoodTypeFilter('veg')}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
                      foodTypeFilter === 'veg' ? 'bg-emerald-50 text-emerald-700 shadow-xs' : 'text-neutral-500'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                    <span>Veg</span>
                  </button>
                  <button
                    onClick={() => setFoodTypeFilter('non_veg')}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
                      foodTypeFilter === 'non_veg' ? 'bg-red-50 text-red-700 shadow-xs' : 'text-neutral-500'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-red-600"></span>
                    <span>Non-Veg</span>
                  </button>
                </div>

                {/* Stock Status Filter */}
                <select
                  value={stockFilter}
                  onChange={(e) => setStockFilter(e.target.value as any)}
                  className="bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-bold text-neutral-700 focus:outline-none focus:border-orange-500 cursor-pointer"
                >
                  <option value="all">All Stock Status</option>
                  <option value="in_stock">✅ In Stock</option>
                  <option value="out_of_stock">❌ Out of Stock</option>
                </select>
              </div>
            </div>

            {/* Products Table */}
            <div className="bg-white border border-neutral-200 rounded-2xl shadow-xs overflow-hidden flex-1 flex flex-col min-h-0">
              {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center text-neutral-400 gap-2">
                  <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs font-bold">Loading branch menu dishes...</span>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                  <span className="text-4xl mb-2">🍽️</span>
                  <p className="text-sm font-black text-neutral-800">No dishes match your filter</p>
                  <p className="text-xs text-neutral-400 mt-1">Try resetting search or click &quot;Add Dish&quot; above.</p>
                </div>
              ) : (
                <div className="overflow-x-auto overflow-y-auto flex-1">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-neutral-50/80 border-b border-neutral-200 text-neutral-500 text-[10px] font-black uppercase tracking-wider sticky top-0 z-10 backdrop-blur-xs">
                      <tr>
                        <th className="px-5 py-3 w-16 text-center">Image</th>
                        <th className="px-5 py-3">Dish / Item Name</th>
                        <th className="px-5 py-3 text-center w-24">Shortcode</th>
                        <th className="px-5 py-3">Category</th>
                        <th className="px-5 py-3">Pricing &amp; Variants</th>
                        <th className="px-5 py-3 text-center w-28">Kitchen</th>
                        <th className="px-5 py-3 text-center w-32">Daily Stock</th>
                        <th className="px-5 py-3 text-right w-28">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {filteredProducts.map((prod) => {
                        const catName =
                          typeof prod.categoryId === 'object' ? prod.categoryId?.name : 'Uncategorized';
                        return (
                          <tr
                            key={prod._id}
                            className={`hover:bg-orange-50/20 transition-colors ${
                              prod.isOutOfStock ? 'bg-neutral-50/60 opacity-70' : ''
                            }`}
                          >
                            {/* Image */}
                            <td className="px-5 py-3 text-center">
                              <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200 mx-auto">
                                {prod.image ? (
                                  <img src={prod.image} alt={prod.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-neutral-300">
                                    <ImageIcon size={16} />
                                  </div>
                                )}
                                {/* Food Type Dot */}
                                <span
                                  className={`absolute top-1 left-1 w-2 h-2 rounded-full ring-1 ring-white ${
                                    prod.foodType === 'non_veg'
                                      ? 'bg-red-600'
                                      : prod.foodType === 'egg'
                                      ? 'bg-amber-500'
                                      : 'bg-emerald-600'
                                  }`}
                                />
                              </div>
                            </td>

                            {/* Name & Details */}
                            <td className="px-5 py-3">
                              <div className="flex flex-col">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-black text-neutral-900 text-xs sm:text-[13px]">
                                    {prod.name}
                                  </span>
                                  {prod.isJainAvailable && (
                                    <span className="text-[9px] font-extrabold text-amber-700 bg-amber-50 border border-amber-200 px-1 rounded">
                                      Jain
                                    </span>
                                  )}
                                  {prod.badge && (
                                    <span className="text-[9px] font-black text-orange-600 bg-orange-50 border border-orange-200 px-1 rounded flex items-center gap-0.5">
                                      <Flame size={10} />
                                      {prod.badge}
                                    </span>
                                  )}
                                </div>
                                {prod.description && (
                                  <p className="text-[10px] text-neutral-400 mt-0.5 truncate max-w-xs">
                                    {prod.description}
                                  </p>
                                )}
                              </div>
                            </td>

                            {/* Shortcode */}
                            <td className="px-5 py-3 text-center">
                              {prod.shortcode ? (
                                <span className="font-mono text-[10px] font-black bg-neutral-100 border border-neutral-200 px-2 py-0.5 rounded text-neutral-700">
                                  {prod.shortcode}
                                </span>
                              ) : (
                                <span className="text-neutral-300 text-[10px]">-</span>
                              )}
                            </td>

                            {/* Category */}
                            <td className="px-5 py-3">
                              <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-orange-50 border border-orange-200 text-orange-700">
                                {catName}
                              </span>
                            </td>

                            {/* Pricing / Variants */}
                            <td className="px-5 py-3">
                              {prod.pricingType === 'variant' && prod.variants && prod.variants.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {prod.variants.map((v, vIdx) => (
                                    <span
                                      key={vIdx}
                                      className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-neutral-100 border border-neutral-200 text-neutral-800"
                                    >
                                      {v.name}: <strong className="text-orange-600">₹{v.price}</strong>
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="font-black text-neutral-900 text-xs">
                                  ₹{prod.price.toFixed(2)}
                                </span>
                              )}
                            </td>

                            {/* Kitchen Station */}
                            <td className="px-5 py-3 text-center">
                              <span className="text-[9.5px] font-extrabold uppercase px-2 py-0.5 rounded bg-neutral-100 text-neutral-600 border border-neutral-200">
                                {prod.kitchenLabel?.replace('_', ' ') || 'fast food'}
                              </span>
                            </td>

                            {/* Daily Stock Toggle */}
                            <td className="px-5 py-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleToggleStock(prod)}
                                className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold transition-all cursor-pointer border ${
                                  prod.isOutOfStock
                                    ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                }`}
                              >
                                {prod.isOutOfStock ? '❌ Out of Stock' : '✅ In Stock'}
                              </button>
                            </td>

                            {/* Actions */}
                            <td className="px-5 py-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleOpenProductModal(prod)}
                                  className="p-1.5 rounded-lg text-neutral-500 hover:text-orange-600 hover:bg-orange-50 transition-all cursor-pointer"
                                  title="Edit Dish"
                                >
                                  <Edit2 size={13} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteProduct(prod)}
                                  className="p-1.5 rounded-lg text-neutral-500 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                                  title="Delete Dish"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Categories View */}
        {activeTab === 'categories' && (
          <div className="flex-1 flex flex-col min-h-0 p-6 overflow-hidden">
            <div className="bg-white border border-neutral-200 rounded-2xl shadow-xs overflow-hidden flex-1 flex flex-col min-h-0">
              {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center text-neutral-400 gap-2">
                  <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs font-bold">Loading branch categories...</span>
                </div>
              ) : categories.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                  <span className="text-4xl mb-2">📁</span>
                  <p className="text-sm font-black text-neutral-800">No categories created yet</p>
                  <p className="text-xs text-neutral-400 mt-1">Create your first category (e.g. Burger, Shakes, Dal Ka Kamaal)</p>
                  <button
                    onClick={() => handleOpenCategoryModal()}
                    className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
                  >
                    + Add First Category
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto overflow-y-auto flex-1 p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {categories.map((cat) => {
                    const dishCount = products.filter((p) => {
                      const cId = typeof p.categoryId === 'object' ? p.categoryId?._id : p.categoryId;
                      return cId === cat._id;
                    }).length;
                    return (
                      <div
                        key={cat._id}
                        className="bg-neutral-50/70 border border-neutral-200 rounded-2xl p-4 flex flex-col justify-between hover:shadow-md transition-all group"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <div className="w-12 h-12 rounded-xl overflow-hidden bg-white border border-neutral-200 flex items-center justify-center">
                              {cat.image ? (
                                <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-2xl">📁</span>
                              )}
                            </div>
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                              {dishCount} Dishes
                            </span>
                          </div>
                          <h3 className="font-black text-neutral-900 text-sm">{cat.name}</h3>
                          <p className="text-[10px] text-neutral-400 font-mono mt-0.5">/{cat.slug}</p>
                          {cat.description && (
                            <p className="text-[11px] text-neutral-500 mt-2 line-clamp-2 leading-relaxed">
                              {cat.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between border-t border-neutral-200/60 pt-3 mt-4">
                          <span className="text-[10px] font-bold text-neutral-400">
                            Order: #{cat.displayOrder || 0}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenCategoryModal(cat)}
                              className="p-1.5 rounded-lg text-neutral-500 hover:text-orange-600 hover:bg-white transition-all cursor-pointer"
                              title="Edit Category"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCategory(cat)}
                              className="p-1.5 rounded-lg text-neutral-500 hover:text-red-600 hover:bg-white transition-all cursor-pointer"
                              title="Delete Category"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── PRODUCT MODAL (ADD / EDIT) ─────────────────────────────────── */}
        {showProductModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl border border-neutral-200 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-scale-up">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
                <div>
                  <h2 className="text-base font-black text-neutral-900">
                    {editingProduct ? 'Edit Dish' : 'Add New Indian Dish'}
                  </h2>
                  <p className="text-[11px] text-neutral-400 font-medium">
                    Configure pricing, columnar variants (Lite/Heavy), shortcodes, and food type
                  </p>
                </div>
                <button
                  onClick={() => setShowProductModal(false)}
                  className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-500 flex items-center justify-center transition-all cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSaveProduct} className="p-6 overflow-y-auto space-y-4 flex-1">
                {/* Name & Shortcode */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[10px] font-black text-neutral-500 uppercase tracking-wider">
                      Dish Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Cheese Overloaded Burger"
                      value={prodForm.name}
                      onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-bold text-neutral-800 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-neutral-500 uppercase tracking-wider">
                      Cashier Code
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. COB"
                      value={prodForm.shortcode}
                      onChange={(e) => setProdForm({ ...prodForm, shortcode: e.target.value.toUpperCase() })}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-neutral-800 uppercase focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                {/* Category & Kitchen Station */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-neutral-500 uppercase tracking-wider">
                      Category *
                    </label>
                    <select
                      required
                      value={prodForm.categoryId}
                      onChange={(e) => setProdForm({ ...prodForm, categoryId: e.target.value })}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-bold text-neutral-800 focus:outline-none focus:border-orange-500 cursor-pointer"
                    >
                      <option value="" disabled>Select category</option>
                      {categories.map((c) => (
                        <option key={c._id || c.id} value={c._id || c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-neutral-500 uppercase tracking-wider">
                      Kitchen Station
                    </label>
                    <select
                      value={prodForm.kitchenLabel}
                      onChange={(e) => setProdForm({ ...prodForm, kitchenLabel: e.target.value })}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-bold text-neutral-800 focus:outline-none focus:border-orange-500 cursor-pointer"
                    >
                      <option value="fast_food">🍔 Fast Food Station</option>
                      <option value="tandoor">🔥 Tandoor Station</option>
                      <option value="chinese">🥡 Chinese Station</option>
                      <option value="main_kitchen">🍛 Main Kitchen / Curries</option>
                      <option value="beverages">🥤 Beverages / Shakes</option>
                      <option value="general">🍽️ General Kitchen</option>
                    </select>
                  </div>
                </div>

                {/* Food Type Badges & Jain Friendly Toggle */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-neutral-50 rounded-2xl border border-neutral-200">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-neutral-500 uppercase tracking-wider block">
                      Indian Food Badge
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setProdForm({ ...prodForm, foodType: 'veg' })}
                        className={`flex-1 py-1.5 rounded-xl border text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          prodForm.foodType === 'veg'
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs'
                            : 'bg-white border-neutral-200 text-neutral-600'
                        }`}
                      >
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                        <span>Veg</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setProdForm({ ...prodForm, foodType: 'non_veg' })}
                        className={`flex-1 py-1.5 rounded-xl border text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          prodForm.foodType === 'non_veg'
                            ? 'bg-red-50 border-red-500 text-red-800 shadow-xs'
                            : 'bg-white border-neutral-200 text-neutral-600'
                        }`}
                      >
                        <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
                        <span>Non-Veg</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-4 sm:pt-0">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={prodForm.isJainAvailable}
                        onChange={(e) => setProdForm({ ...prodForm, isJainAvailable: e.target.checked })}
                        className="w-4 h-4 rounded text-orange-500 border-neutral-300 focus:ring-orange-400 cursor-pointer"
                      />
                      <span className="text-xs font-extrabold text-neutral-800">
                        Jain Friendly (No Onion/Garlic)
                      </span>
                    </label>
                  </div>
                </div>

                {/* Pricing Type & Columnar Variants */}
                <div className="space-y-3 p-4 bg-orange-50/50 rounded-2xl border border-orange-200">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-orange-950 uppercase tracking-wider">
                      Pricing Structure
                    </label>
                    <div className="flex gap-1 bg-white p-0.5 rounded-xl border border-orange-200">
                      <button
                        type="button"
                        onClick={() => setProdForm({ ...prodForm, pricingType: 'single' })}
                        className={`px-3 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                          prodForm.pricingType === 'single'
                            ? 'bg-orange-500 text-white shadow-xs'
                            : 'text-neutral-500'
                        }`}
                      >
                        Single Price
                      </button>
                      <button
                        type="button"
                        onClick={() => setProdForm({ ...prodForm, pricingType: 'variant' })}
                        className={`px-3 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                          prodForm.pricingType === 'variant'
                            ? 'bg-orange-500 text-white shadow-xs'
                            : 'text-neutral-500'
                        }`}
                      >
                        Columnar Variants (Lite/Heavy)
                      </button>
                    </div>
                  </div>

                  {prodForm.pricingType === 'single' ? (
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-neutral-500 uppercase tracking-wider">
                        Price (₹ INR) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        required
                        value={prodForm.price || ''}
                        onChange={(e) => setProdForm({ ...prodForm, price: parseFloat(e.target.value) || 0 })}
                        placeholder="e.g. 90"
                        className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs font-black text-neutral-800 focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Presets */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[9px] font-bold text-neutral-400 uppercase">Presets:</span>
                        <button
                          type="button"
                          onClick={() => applyVariantPreset('burger')}
                          className="px-2 py-0.5 rounded-md bg-white border border-neutral-200 hover:border-orange-500 text-[10px] font-bold text-neutral-700 cursor-pointer shadow-3xs"
                        >
                          🍔 Burger (Lite / Heavy)
                        </button>
                        <button
                          type="button"
                          onClick={() => applyVariantPreset('half_full')}
                          className="px-2 py-0.5 rounded-md bg-white border border-neutral-200 hover:border-orange-500 text-[10px] font-bold text-neutral-700 cursor-pointer shadow-3xs"
                        >
                          🍛 Main Course (Half / Full)
                        </button>
                        <button
                          type="button"
                          onClick={() => applyVariantPreset('pizza')}
                          className="px-2 py-0.5 rounded-md bg-white border border-neutral-200 hover:border-orange-500 text-[10px] font-bold text-neutral-700 cursor-pointer shadow-3xs"
                        >
                          🍕 Pizza (Normal / Extra Cheese)
                        </button>
                        <button
                          type="button"
                          onClick={() => applyVariantPreset('shake')}
                          className="px-2 py-0.5 rounded-md bg-white border border-neutral-200 hover:border-orange-500 text-[10px] font-bold text-neutral-700 cursor-pointer shadow-3xs"
                        >
                          🥤 Shake (Normal / Ice Cream / VIP)
                        </button>
                      </div>

                      {/* Variant Rows */}
                      <div className="space-y-2">
                        {prodForm.variants.map((v, vIdx) => (
                          <div key={vIdx} className="flex items-center gap-2 bg-white p-2 rounded-xl border border-neutral-200">
                            <input
                              type="text"
                              value={v.name}
                              onChange={(e) => {
                                const updated = [...prodForm.variants];
                                updated[vIdx].name = e.target.value;
                                setProdForm({ ...prodForm, variants: updated });
                              }}
                              placeholder="Variant Name (e.g. Lite)"
                              className="flex-1 bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-neutral-800"
                            />
                            <div className="relative w-28">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400">₹</span>
                              <input
                                type="number"
                                min="0"
                                value={v.price}
                                onChange={(e) => {
                                  const updated = [...prodForm.variants];
                                  updated[vIdx].price = parseFloat(e.target.value) || 0;
                                  setProdForm({ ...prodForm, variants: updated });
                                }}
                                placeholder="Price"
                                className="w-full bg-neutral-50 border border-neutral-200 rounded-lg pl-6 pr-2 py-1.5 text-xs font-black text-neutral-800"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                if (prodForm.variants.length <= 1) return toast.error('At least 1 variant is required');
                                const updated = prodForm.variants.filter((_, i) => i !== vIdx);
                                setProdForm({ ...prodForm, variants: updated });
                              }}
                              className="p-1 text-neutral-400 hover:text-red-500 cursor-pointer"
                              title="Remove variant"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setProdForm({
                            ...prodForm,
                            variants: [...prodForm.variants, { name: '', price: 0, isDefault: false }],
                          });
                        }}
                        className="text-xs font-black text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
                      >
                        <Plus size={13} strokeWidth={3} />
                        <span>Add Another Variant</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Image URL & Description */}
                <div className="space-y-3">
                {/* Cloudinary Dish Image Uploader */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-neutral-500 uppercase tracking-wider flex items-center justify-between">
                    <span>Dish Photo</span>
                  </label>

                  {prodForm.image ? (
                    <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-2xl border border-neutral-200">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-white border border-neutral-200 shrink-0">
                        <img src={prodForm.image} alt="Dish" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10.5px] font-bold text-neutral-800 truncate">
                          {prodForm.image.split('/').pop()}
                        </p>
                        <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded mt-1">
                          Uploaded
                        </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="px-2.5 py-1 bg-white hover:bg-neutral-100 border border-neutral-200 text-neutral-700 rounded-lg text-[10px] font-bold cursor-pointer text-center">
                          Change
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={uploadingProdImg}
                            onChange={(e) => handleUploadProductImg(e.target.files?.[0])}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => setProdForm({ ...prodForm, image: '' })}
                          className="px-2.5 py-1 text-red-600 hover:bg-red-50 rounded-lg text-[10px] font-bold cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-neutral-200 hover:border-orange-500 bg-neutral-50/70 hover:bg-orange-50/20 rounded-2xl p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all group">
                      {uploadingProdImg ? (
                        <div className="flex flex-col items-center gap-2 py-2 text-orange-600">
                          <Loader2 size={24} className="animate-spin" />
                          <span className="text-[11px] font-bold">Uploading...</span>
                        </div>
                      ) : (
                        <>
                          <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                            <UploadCloud size={20} />
                          </div>
                          <p className="text-xs font-black text-neutral-800">
                            Click to upload dish photo
                          </p>
                          <p className="text-[9.5px] text-neutral-400 font-medium">
                            PNG, JPG, WEBP up to 5MB (Auto-compressed to 800x800)
                          </p>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploadingProdImg}
                        onChange={(e) => handleUploadProductImg(e.target.files?.[0])}
                      />
                    </label>
                  )}
                </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-neutral-500 uppercase tracking-wider">
                      Description (Optional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Short mouth-watering description..."
                      value={prodForm.description}
                      onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-xs font-medium text-neutral-800 focus:outline-none focus:border-orange-500 resize-none"
                    />
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="border-t border-neutral-100 pt-4 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowProductModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-600 hover:bg-neutral-100 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-xl text-xs font-black shadow-md shadow-orange-500/20 transition-all cursor-pointer"
                  >
                    {isSubmitting ? 'Saving...' : editingProduct ? 'Update Dish' : 'Add to Menu'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── CATEGORY MODAL (ADD / EDIT) ────────────────────────────────── */}
        {showCategoryModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl border border-neutral-200 shadow-2xl w-full max-w-md flex flex-col overflow-hidden animate-scale-up">
              <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
                <h2 className="text-base font-black text-neutral-900">
                  {editingCategory ? 'Edit Category' : 'Create Category'}
                </h2>
                <button
                  onClick={() => setShowCategoryModal(false)}
                  className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-500 flex items-center justify-center transition-all cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              <form onSubmit={handleSaveCategory} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-neutral-500 uppercase tracking-wider">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Burgers &amp; Bites"
                    value={catForm.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                      setCatForm({ ...catForm, name, slug: editingCategory ? catForm.slug : slug });
                    }}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-bold text-neutral-800 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-neutral-500 uppercase tracking-wider">
                    Slug / URL Path
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. burgers-bites"
                    value={catForm.slug}
                    onChange={(e) => setCatForm({ ...catForm, slug: e.target.value })}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-neutral-800 focus:outline-none focus:border-orange-500"
                  />
                </div>

                {/* Cloudinary Category Image Uploader */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-neutral-500 uppercase tracking-wider flex items-center justify-between">
                    <span>Category Banner</span>
                  </label>

                  {catForm.image ? (
                    <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-2xl border border-neutral-200">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-white border border-neutral-200 shrink-0">
                        <img src={catForm.image} alt="Category" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10.5px] font-bold text-neutral-800 truncate">
                          {catForm.image.split('/').pop()}
                        </p>
                        <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded mt-1">
                          Uploaded
                        </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="px-2.5 py-1 bg-white hover:bg-neutral-100 border border-neutral-200 text-neutral-700 rounded-lg text-[10px] font-bold cursor-pointer text-center">
                          Change
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={uploadingCatImg}
                            onChange={(e) => handleUploadCategoryImg(e.target.files?.[0])}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => setCatForm({ ...catForm, image: '' })}
                          className="px-2.5 py-1 text-red-600 hover:bg-red-50 rounded-lg text-[10px] font-bold cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-neutral-200 hover:border-orange-500 bg-neutral-50/70 hover:bg-orange-50/20 rounded-2xl p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all group">
                      {uploadingCatImg ? (
                        <div className="flex flex-col items-center gap-2 py-2 text-orange-600">
                          <Loader2 size={24} className="animate-spin" />
                          <span className="text-[11px] font-bold">Uploading...</span>
                        </div>
                      ) : (
                        <>
                          <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                            <UploadCloud size={20} />
                          </div>
                          <p className="text-xs font-black text-neutral-800">
                            Click to upload category banner
                          </p>
                          <p className="text-[9.5px] text-neutral-400 font-medium">
                            PNG, JPG, WEBP up to 5MB (Auto-compressed to 800x800)
                          </p>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploadingCatImg}
                        onChange={(e) => handleUploadCategoryImg(e.target.files?.[0])}
                      />
                    </label>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-neutral-500 uppercase tracking-wider">
                    Description (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Brief description of this section..."
                    value={catForm.description}
                    onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-xs font-medium text-neutral-800 focus:outline-none focus:border-orange-500 resize-none"
                  />
                </div>

                <div className="border-t border-neutral-100 pt-4 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCategoryModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-600 hover:bg-neutral-100 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-xl text-xs font-black shadow-md shadow-orange-500/20 transition-all cursor-pointer"
                  >
                    {isSubmitting ? 'Saving...' : editingCategory ? 'Update Category' : 'Create Category'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </EmployeePermissionGuard>
  );
}
