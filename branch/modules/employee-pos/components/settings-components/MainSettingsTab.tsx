'use client';

import React from 'react';
import { ChevronDown, MapPin, Palette, Utensils, CheckSquare, Square, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';

export interface BranchCustomization {
  logo?: string;
  themeColor?: string;
  restaurantType?: string;
  featureToggles?: {
    pos: boolean;
    kds: boolean;
    reception: boolean;
    delivery: boolean;
    tableManagement: boolean;
    accountClosing: boolean;
    reports: boolean;
    onlineOrders: boolean;
  };
}

interface MainSettings {
  timezone: string;
  defaultTimeMinutes: string;
  reportingStartTime: string;
  reportingEndTime: string;
  latitude: string;
  longitude: string;
  commission: string;
  gstNumber: string;
  showMenuImage: boolean;
  showCategoryImage: boolean;
  backgroundColor: string;
}

interface MainSettingsTabProps {
  mainSettings: MainSettings;
  setMainSettings: React.Dispatch<React.SetStateAction<MainSettings>>;
  branchCustomization?: BranchCustomization;
  setBranchCustomization?: React.Dispatch<React.SetStateAction<BranchCustomization>>;
  onSubmit: (e: React.FormEvent) => void;
  saving?: boolean;
}

const COLOR_PRESETS = [
  { name: 'Warm Orange (Default)', hex: '#F97316' },
  { name: 'Crimson Red', hex: '#DC2626' },
  { name: 'Pure Veg Emerald', hex: '#10B981' },
  { name: 'Royal Indigo', hex: '#6366F1' },
];

const FEATURE_LIST: { key: keyof NonNullable<BranchCustomization['featureToggles']>; label: string; desc: string }[] = [
  { key: 'pos', label: 'POS Terminal (Billing)', desc: '1-step rapid order taking, variants & cash counter' },
  { key: 'kds', label: 'Kitchen Display System (KDS / KOT)', desc: 'Live ticket routing to Tandoor, Chinese, Main Kitchen' },
  { key: 'reception', label: 'Reception View', desc: 'Live order status screen for customers and front desk' },
  { key: 'delivery', label: 'Delivery Fleet Management', desc: 'Driver dispatching, address tracking & drops' },
  { key: 'tableManagement', label: 'Table Management (Dine-In)', desc: 'Table status, seat layout, and floor mapping' },
  { key: 'accountClosing', label: 'Account Closing (Till Reconciliation)', desc: 'Shift cash out, day-end balancing & reports' },
  { key: 'reports', label: 'Sales Reports & Analytics', desc: 'Daily, item-wise, and hourly performance stats' },
  { key: 'onlineOrders', label: 'Online / QR Orders', desc: 'Accept customer orders from User Web & QR Menu' },
];

export default function MainSettingsTab({
  mainSettings,
  setMainSettings,
  branchCustomization = {
    logo: '',
    themeColor: '#F97316',
    restaurantType: 'cafe',
    featureToggles: {
      pos: true,
      kds: true,
      reception: true,
      delivery: true,
      tableManagement: true,
      accountClosing: true,
      reports: true,
      onlineOrders: true,
    },
  },
  setBranchCustomization,
  onSubmit,
  saving = false,
}: MainSettingsTabProps) {
  const [isEditing, setIsEditing] = React.useState(false);

  // Helper to fetch coordinates via Geolocation API
  const handleFetchGPS = () => {
    if (!isEditing) return;
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    const toastId = toast.loading('Fetching current GPS coordinates...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setMainSettings((prev) => ({
          ...prev,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
        }));
        toast.success('GPS coordinates fetched successfully!', { id: toastId });
      },
      (error) => {
        console.error('GPS error:', error);
        toast.error(`Failed to fetch location: ${error.message}`, { id: toastId });
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(e);
    setIsEditing(false);
  };

  const toggleFeature = (featureKey: keyof NonNullable<BranchCustomization['featureToggles']>) => {
    if (!isEditing || !setBranchCustomization) return;
    setBranchCustomization((prev) => {
      const currentToggles = prev.featureToggles || {
        pos: true,
        kds: true,
        reception: true,
        delivery: true,
        tableManagement: true,
        accountClosing: true,
        reports: true,
        onlineOrders: true,
      };
      return {
        ...prev,
        featureToggles: {
          ...currentToggles,
          [featureKey]: !currentToggles[featureKey],
        },
      };
    });
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6">
      {/* ── 1. BRAND THEME & RESTAURANT TYPE ── */}
      <div className="bg-white rounded-2xl p-5 border border-neutral-200/90 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
          <Palette className="text-brand-primary" size={18} />
          <h3 className="text-xs font-900 text-neutral-800 uppercase tracking-wider">
            Brand Identity, Color Theme & Restaurant Type
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Restaurant Type */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-800 text-neutral-600 uppercase tracking-wider flex items-center gap-1.5">
              <Utensils size={13} className="text-brand-primary" />
              <span>Restaurant Type</span>
            </label>
            <div className="relative">
              <select
                disabled={!isEditing}
                value={branchCustomization.restaurantType || 'cafe'}
                onChange={(e) =>
                  setBranchCustomization &&
                  setBranchCustomization((prev) => ({ ...prev, restaurantType: e.target.value }))
                }
                className={`w-full border rounded-xl px-4 py-2.5 text-xs font-700 transition-all ${
                  isEditing
                    ? 'bg-white border-brand-primary/40 text-neutral-900 focus:outline-none focus:border-brand-primary'
                    : 'bg-neutral-100/70 border-neutral-200 text-neutral-600 cursor-not-allowed'
                } appearance-none`}
              >
                <option value="cafe">Cafe & Fast Bites ☕ (RFC Cafe style)</option>
                <option value="fine_dine">Family Restaurant & Dine-In 🍛 (Jainson's style)</option>
                <option value="fast_food">Fast Food & QSR 🍔</option>
                <option value="pizzeria">Pizzeria & Italian 🍕</option>
                <option value="bar">Restro-Bar & Lounge 🍸</option>
                <option value="bakery">Bakery & Desserts 🍰</option>
                <option value="other">Cloud Kitchen / Other</option>
              </select>
              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
            </div>
          </div>

          {/* Logo URL */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-800 text-neutral-600 uppercase tracking-wider flex items-center gap-1.5">
              <ImageIcon size={13} className="text-brand-primary" />
              <span>Branch Logo URL</span>
            </label>
            <input
              type="text"
              disabled={!isEditing}
              placeholder="https://... / logo.png"
              value={branchCustomization.logo || ''}
              onChange={(e) =>
                setBranchCustomization &&
                setBranchCustomization((prev) => ({ ...prev, logo: e.target.value }))
              }
              className={`w-full border rounded-xl px-4 py-2.5 text-xs font-700 transition-all ${
                isEditing
                  ? 'bg-white border-brand-primary/40 text-neutral-900 focus:outline-none focus:border-brand-primary'
                  : 'bg-neutral-100/70 border-neutral-200 text-neutral-600 cursor-not-allowed'
              }`}
            />
          </div>

          {/* Theme Color Presets */}
          <div className="md:col-span-2 flex flex-col gap-2">
            <label className="text-[11px] font-800 text-neutral-600 uppercase tracking-wider">
              Brand Theme Color (Applied across POS, KDS & Customer Web)
            </label>
            <div className="flex flex-wrap items-center gap-2.5">
              {COLOR_PRESETS.map((preset) => {
                const isSelected = (branchCustomization.themeColor || '#F97316').toLowerCase() === preset.hex.toLowerCase();
                return (
                  <button
                    key={preset.hex}
                    type="button"
                    disabled={!isEditing}
                    onClick={() =>
                      setBranchCustomization &&
                      setBranchCustomization((prev) => ({ ...prev, themeColor: preset.hex }))
                    }
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-800 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-neutral-900 bg-neutral-900 text-white shadow-sm'
                        : 'border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100'
                    }`}
                  >
                    <span className="w-3.5 h-3.5 rounded-full border border-black/10" style={{ backgroundColor: preset.hex }} />
                    <span>{preset.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. MODULAR FEATURE TOGGLES (CHECKBOXES) ── */}
      <div className="bg-white rounded-2xl p-5 border border-neutral-200/90 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
          <CheckSquare className="text-brand-primary" size={18} />
          <div>
            <h3 className="text-xs font-900 text-neutral-800 uppercase tracking-wider">
              Modular Feature Toggles (Checkboxes)
            </h3>
            <p className="text-[10.5px] text-neutral-500 font-500">
              Enable only the modules your restaurant needs. Unchecked features are cleanly hidden from navigation.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {FEATURE_LIST.map(({ key, label, desc }) => {
            const isEnabled = branchCustomization.featureToggles
              ? branchCustomization.featureToggles[key] !== false
              : true;
            return (
              <div
                key={key}
                onClick={() => toggleFeature(key)}
                className={`p-3 rounded-xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
                  isEnabled
                    ? 'border-brand-primary/50 bg-orange-50/40 shadow-xs'
                    : 'border-neutral-200 bg-neutral-50/50 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-[11px] font-800 text-neutral-800 leading-tight">
                    {label}
                  </h4>
                  {isEnabled ? (
                    <CheckSquare size={16} className="text-brand-primary flex-shrink-0" />
                  ) : (
                    <Square size={16} className="text-neutral-400 flex-shrink-0" />
                  )}
                </div>
                <p className="text-[9.5px] text-neutral-500 font-500 mt-1 leading-snug">
                  {desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 3. STORE GENERAL SETTINGS (Timezone, GST, Coordinates) ── */}
      <div className="bg-white rounded-2xl p-5 border border-neutral-200/90 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* Timezone */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-800 text-neutral-600 uppercase tracking-wider">
              Timezone <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                disabled={!isEditing}
                value={mainSettings.timezone}
                onChange={(e) => setMainSettings({ ...mainSettings, timezone: e.target.value })}
                className={`w-full border rounded-xl px-4 py-2.5 text-xs font-700 transition-all ${
                  isEditing
                    ? 'bg-white border-brand-primary/40 text-neutral-900 focus:outline-none focus:border-brand-primary'
                    : 'bg-neutral-100/70 border-neutral-200 text-neutral-600 cursor-not-allowed'
                } appearance-none`}
              >
                <option value="Indian Standard Time (IST) - Asia/Kolkata">
                  Indian Standard Time (IST) - Asia/Kolkata
                </option>
                <option value="Mountain Standard Time (MST) - America/Edmonton">
                  Mountain Standard Time (MST) - America/Edmonton
                </option>
                <option value="Eastern Standard Time (EST) - America/New_York">
                  Eastern Standard Time (EST) - America/New_York
                </option>
                <option value="Pacific Standard Time (PST) - America/Los_Angeles">
                  Pacific Standard Time (PST) - America/Los_Angeles
                </option>
              </select>
              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
            </div>
          </div>

          {/* Default Prep Time */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-800 text-neutral-600 uppercase tracking-wider">
              Default Prep Time (Minutes) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              disabled={!isEditing}
              value={mainSettings.defaultTimeMinutes || '15'}
              onChange={(e) => setMainSettings({ ...mainSettings, defaultTimeMinutes: e.target.value })}
              className={`w-full border rounded-xl px-4 py-2.5 text-xs font-700 transition-all ${
                isEditing
                  ? 'bg-white border-brand-primary/40 text-neutral-900 focus:outline-none focus:border-brand-primary'
                  : 'bg-neutral-100/70 border-neutral-200 text-neutral-600 cursor-not-allowed'
              }`}
            />
          </div>

          {/* Latitude */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-800 text-neutral-600 uppercase tracking-wider">
              Latitude <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                disabled={!isEditing}
                value={mainSettings.latitude}
                onChange={(e) => setMainSettings({ ...mainSettings, latitude: e.target.value })}
                className={`w-full border rounded-xl pl-4 pr-10 py-2.5 text-xs font-700 transition-all ${
                  isEditing
                    ? 'bg-white border-brand-primary/40 text-neutral-900 focus:outline-none focus:border-brand-primary'
                    : 'bg-neutral-100/70 border-neutral-200 text-neutral-600 cursor-not-allowed'
                }`}
              />
              {isEditing && (
                <button
                  type="button"
                  onClick={handleFetchGPS}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-brand-primary hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
                  title="Fetch Current Location"
                >
                  <MapPin size={15} />
                </button>
              )}
            </div>
          </div>

          {/* Longitude */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-800 text-neutral-600 uppercase tracking-wider">
              Longitude <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              disabled={!isEditing}
              value={mainSettings.longitude}
              onChange={(e) => setMainSettings({ ...mainSettings, longitude: e.target.value })}
              className={`w-full border rounded-xl px-4 py-2.5 text-xs font-700 transition-all ${
                isEditing
                  ? 'bg-white border-brand-primary/40 text-neutral-900 focus:outline-none focus:border-brand-primary'
                  : 'bg-neutral-100/70 border-neutral-200 text-neutral-600 cursor-not-allowed'
              }`}
            />
          </div>

          {/* GST Number */}
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label className="text-[11px] font-800 text-neutral-600 uppercase tracking-wider">
              GSTIN / Tax Identification Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              disabled={!isEditing}
              placeholder="e.g. 07AAAAA0000A1Z5"
              value={mainSettings.gstNumber}
              onChange={(e) => setMainSettings({ ...mainSettings, gstNumber: e.target.value })}
              className={`w-full border rounded-xl px-4 py-2.5 text-xs font-700 transition-all ${
                isEditing
                  ? 'bg-white border-brand-primary/40 text-neutral-900 focus:outline-none focus:border-brand-primary'
                  : 'bg-neutral-100/70 border-neutral-200 text-neutral-600 cursor-not-allowed'
              }`}
            />
          </div>
        </div>
      </div>

      {/* ── Edit & Submit Actions Bar ── */}
      <div className="flex justify-end items-center gap-3 pt-4 border-t border-neutral-200">
        {!isEditing ? (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="px-8 py-2.5 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white text-[12px] font-800 transition-all cursor-pointer shadow-sm active:scale-98"
          >
            Edit Settings
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              disabled={saving}
              className="px-6 py-2.5 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-[12px] font-700 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-2.5 rounded-full bg-brand-primary hover:bg-brand-primary-hover text-white text-[12px] font-800 transition-all cursor-pointer shadow-sm active:scale-98 disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </>
        )}
      </div>
    </form>
  );
}
