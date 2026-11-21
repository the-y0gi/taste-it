'use client';

import React from 'react';
import {
  ChevronDown,
  MapPin,
  Palette,
  Utensils,
  CheckSquare,
  Square,
  Image as ImageIcon,
  Sliders,
  Clock,
  Building2,
  Edit2,
  Check,
  X,
  Compass,
} from 'lucide-react';
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

const FEATURE_LIST: {
  key: keyof NonNullable<BranchCustomization['featureToggles']>;
  label: string;
  desc: string;
}[] = [
  { key: 'pos', label: 'POS Terminal (Billing)', desc: '1-step rapid order taking, variants & cash counter' },
  { key: 'kds', label: 'Kitchen Display System (KDS)', desc: 'Live ticket routing to Tandoor, Chinese, Main Kitchen' },
  { key: 'reception', label: 'Reception Display View', desc: 'Live order status screen for customers and front desk' },
  { key: 'delivery', label: 'Delivery Fleet Management', desc: 'Driver dispatching, address tracking & drops' },
  { key: 'tableManagement', label: 'Table Management (Dine-In)', desc: 'Table status, seat layout, and floor mapping' },
  { key: 'accountClosing', label: 'Account Closing & Shifts', desc: 'Shift cash out, day-end balancing & reports' },
  { key: 'reports', label: 'Sales Reports & Analytics', desc: 'Daily, item-wise, and hourly performance stats' },
  { key: 'onlineOrders', label: 'Online / QR Menu Orders', desc: 'Accept customer orders from Web & Table QR' },
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
    <div className="w-full space-y-6 font-sans">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-neutral-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-primary text-white flex items-center justify-center font-bold shadow-xs flex-shrink-0">
            <Sliders size={20} />
          </div>
          <div>
            <h2 className="text-[17px] font-900 text-neutral-900 tracking-tight flex items-center gap-2">
              Main Store Profile & System Settings
            </h2>
            <p className="text-[12px] text-neutral-500 mt-0.5">
              Outlet branding, active modules, timezones, GPS positioning, and GST identification.
            </p>
          </div>
        </div>

        {/* Top Header Action Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          {!isEditing ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-[11px] font-800 uppercase tracking-wide transition-all cursor-pointer shadow-xs flex items-center gap-1.5 active:scale-95"
            >
              <Edit2 size={13} /> Edit Profile
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                disabled={saving}
                className="px-3.5 py-2 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 text-[11px] font-700 uppercase tracking-wide transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
              >
                <X size={13} /> Cancel
              </button>
              <button
                type="button"
                onClick={handleFormSubmit}
                disabled={saving}
                className="px-5 py-2 rounded-xl bg-brand-primary hover:bg-orange-600 text-white text-[11px] font-900 uppercase tracking-wide transition-all cursor-pointer shadow-xs flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check size={14} /> Save Changes
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-6">
        {/* ── SECTION 1: Brand Identity & Appearance ── */}
        <div className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
            <Palette className="text-brand-primary" size={17} />
            <h3 className="text-[13px] font-800 text-neutral-900 uppercase tracking-wide">
              Brand Identity, Appearance & Theme
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Restaurant Type */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11.5px] font-800 text-neutral-700 uppercase tracking-wider flex items-center gap-1.5">
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
                  className={`w-full border rounded-xl px-4 py-2.5 text-[12.5px] font-bold transition-all appearance-none ${
                    isEditing
                      ? 'bg-white border-brand-primary text-neutral-900 focus:outline-none ring-2 ring-brand-primary/10'
                      : 'bg-neutral-50/70 border-neutral-200 text-neutral-700 cursor-not-allowed'
                  }`}
                >
                  <option value="cafe">Cafe & Fast Bites ☕ (RFC Cafe style)</option>
                  <option value="fine_dine">Family Restaurant & Dine-In 🍛 (Jainson&apos;s style)</option>
                  <option value="fast_food">Fast Food & QSR 🍔</option>
                  <option value="pizzeria">Pizzeria & Italian 🍕</option>
                  <option value="bar">Restro-Bar & Lounge 🍸</option>
                  <option value="bakery">Bakery & Desserts 🍰</option>
                  <option value="other">Cloud Kitchen / Other</option>
                </select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
              </div>
            </div>

            {/* Logo URL with Live Preview Thumbnail */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11.5px] font-800 text-neutral-700 uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <ImageIcon size={13} className="text-brand-primary" />
                  <span>Brand Logo URL</span>
                </span>
                {branchCustomization.logo && (
                  <span className="text-[10px] text-emerald-600 font-bold">Logo Connected</span>
                )}
              </label>
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl border border-neutral-200 bg-neutral-50 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-2xs">
                  {branchCustomization.logo ? (
                    <img
                      src={branchCustomization.logo}
                      alt="Brand Logo"
                      className="w-full h-full object-contain p-0.5"
                    />
                  ) : (
                    <ImageIcon size={16} className="text-neutral-400" />
                  )}
                </div>
                <input
                  type="text"
                  disabled={!isEditing}
                  placeholder="https://... / logo.png"
                  value={branchCustomization.logo || ''}
                  onChange={(e) =>
                    setBranchCustomization &&
                    setBranchCustomization((prev) => ({ ...prev, logo: e.target.value }))
                  }
                  className={`flex-1 border rounded-xl px-4 py-2.5 text-[12.5px] font-medium transition-all ${
                    isEditing
                      ? 'bg-white border-brand-primary text-neutral-900 focus:outline-none ring-2 ring-brand-primary/10'
                      : 'bg-neutral-50/70 border-neutral-200 text-neutral-700 cursor-not-allowed'
                  }`}
                />
              </div>
            </div>

            {/* Theme Color Presets */}
            <div className="md:col-span-2 flex flex-col gap-2 pt-1 border-t border-neutral-100">
              <label className="text-[11px] font-800 text-neutral-700 uppercase tracking-wider">
                Accent Theme Color (Applied across POS, KDS & Customer Web)
              </label>
              <div className="flex flex-wrap items-center gap-2.5">
                {COLOR_PRESETS.map((preset) => {
                  const isSelected =
                    (branchCustomization.themeColor || '#F97316').toLowerCase() === preset.hex.toLowerCase();
                  return (
                    <button
                      key={preset.hex}
                      type="button"
                      disabled={!isEditing}
                      onClick={() =>
                        setBranchCustomization &&
                        setBranchCustomization((prev) => ({ ...prev, themeColor: preset.hex }))
                      }
                      className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-[11.5px] font-bold transition-all ${
                        isEditing ? 'cursor-pointer active:scale-95' : 'cursor-not-allowed opacity-80'
                      } ${
                        isSelected
                          ? 'border-neutral-900 bg-neutral-900 text-white shadow-xs'
                          : 'border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700'
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/10 flex-shrink-0"
                        style={{ backgroundColor: preset.hex }}
                      />
                      <span>{preset.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── SECTION 2: Modular Feature Toggles ── */}
        <div className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <div className="flex items-center gap-2">
              <CheckSquare className="text-brand-primary" size={17} />
              <div>
                <h3 className="text-[13px] font-800 text-neutral-900 uppercase tracking-wide">
                  Modular System Feature Toggles
                </h3>
              </div>
            </div>
            <span className="text-[10px] text-neutral-400 font-medium">Click card to toggle</span>
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
                  className={`p-3.5 rounded-xl border transition-all select-none flex flex-col justify-between ${
                    isEditing ? 'cursor-pointer active:scale-[0.98]' : 'cursor-default'
                  } ${
                    isEnabled
                      ? 'border-brand-primary/50 bg-orange-50/40 shadow-2xs'
                      : 'border-neutral-200 bg-neutral-50/50 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-[12px] font-800 text-neutral-800 leading-tight">
                      {label}
                    </h4>
                    {isEnabled ? (
                      <CheckSquare size={16} className="text-brand-primary flex-shrink-0" />
                    ) : (
                      <Square size={16} className="text-neutral-400 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-[10px] text-neutral-500 font-medium mt-1 leading-snug">
                    {desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── SECTION 3: Operations & Regional Parameters ── */}
        <div className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
            <Building2 className="text-brand-primary" size={17} />
            <h3 className="text-[13px] font-800 text-neutral-900 uppercase tracking-wide">
              Operations, Timing & Business Legal Registration
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Timezone */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11.5px] font-800 text-neutral-700 uppercase tracking-wider flex items-center gap-1.5">
                <Clock size={13} className="text-brand-primary" />
                <span>Timezone</span>
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  disabled={!isEditing}
                  value={mainSettings.timezone}
                  onChange={(e) => setMainSettings({ ...mainSettings, timezone: e.target.value })}
                  className={`w-full border rounded-xl px-4 py-2.5 text-[12px] font-bold transition-all appearance-none ${
                    isEditing
                      ? 'bg-white border-brand-primary text-neutral-900 focus:outline-none ring-2 ring-brand-primary/10'
                      : 'bg-neutral-50/70 border-neutral-200 text-neutral-700 cursor-not-allowed'
                  }`}
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
              <label className="text-[11.5px] font-800 text-neutral-700 uppercase tracking-wider flex items-center gap-1.5">
                <span>Default Kitchen Prep Time</span>
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="120"
                  disabled={!isEditing}
                  value={mainSettings.defaultTimeMinutes || '15'}
                  onChange={(e) => setMainSettings({ ...mainSettings, defaultTimeMinutes: e.target.value })}
                  className={`w-full border rounded-xl pl-4 pr-14 py-2.5 text-[12.5px] font-bold font-mono transition-all ${
                    isEditing
                      ? 'bg-white border-brand-primary text-neutral-900 focus:outline-none ring-2 ring-brand-primary/10'
                      : 'bg-neutral-50/70 border-neutral-200 text-neutral-700 cursor-not-allowed'
                  }`}
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-neutral-400">
                  mins
                </span>
              </div>
            </div>

            {/* GST Number */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11.5px] font-800 text-neutral-700 uppercase tracking-wider flex items-center gap-1.5">
                <span>GSTIN / Tax ID Number</span>
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                disabled={!isEditing}
                placeholder="e.g. 07AAAAA0000A1Z5"
                value={mainSettings.gstNumber}
                onChange={(e) => setMainSettings({ ...mainSettings, gstNumber: e.target.value })}
                className={`w-full border rounded-xl px-4 py-2.5 text-[12.5px] font-bold font-mono transition-all ${
                  isEditing
                    ? 'bg-white border-brand-primary text-neutral-900 focus:outline-none ring-2 ring-brand-primary/10'
                    : 'bg-neutral-50/70 border-neutral-200 text-neutral-700 cursor-not-allowed'
                }`}
              />
            </div>

            {/* Latitude */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11.5px] font-800 text-neutral-700 uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Compass size={13} className="text-brand-primary" />
                  <span>GPS Latitude</span>
                  <span className="text-red-500">*</span>
                </span>
                {isEditing && (
                  <button
                    type="button"
                    onClick={handleFetchGPS}
                    className="text-[10px] text-brand-primary hover:underline font-bold cursor-pointer"
                  >
                    Auto-Detect GPS
                  </button>
                )}
              </label>
              <div className="relative">
                <input
                  type="text"
                  disabled={!isEditing}
                  value={mainSettings.latitude}
                  onChange={(e) => setMainSettings({ ...mainSettings, latitude: e.target.value })}
                  className={`w-full border rounded-xl pl-4 pr-10 py-2.5 text-[12.5px] font-bold font-mono transition-all ${
                    isEditing
                      ? 'bg-white border-brand-primary text-neutral-900 focus:outline-none ring-2 ring-brand-primary/10'
                      : 'bg-neutral-50/70 border-neutral-200 text-neutral-700 cursor-not-allowed'
                  }`}
                />
                <MapPin size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              </div>
            </div>

            {/* Longitude */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11.5px] font-800 text-neutral-700 uppercase tracking-wider flex items-center gap-1.5">
                <Compass size={13} className="text-brand-primary" />
                <span>GPS Longitude</span>
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  disabled={!isEditing}
                  value={mainSettings.longitude}
                  onChange={(e) => setMainSettings({ ...mainSettings, longitude: e.target.value })}
                  className={`w-full border rounded-xl pl-4 pr-10 py-2.5 text-[12.5px] font-bold font-mono transition-all ${
                    isEditing
                      ? 'bg-white border-brand-primary text-neutral-900 focus:outline-none ring-2 ring-brand-primary/10'
                      : 'bg-neutral-50/70 border-neutral-200 text-neutral-700 cursor-not-allowed'
                  }`}
                />
                <MapPin size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
