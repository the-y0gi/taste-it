'use client';

import React from 'react';
import {
  ChevronDown,
  MapPin,
  Clock,
  Building2,
  Edit2,
  Check,
  X,
  Compass,
  FileText,
  Sliders,
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

export default function MainSettingsTab({
  mainSettings,
  setMainSettings,
  branchCustomization,
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
              Store Operations & Legal Registration
            </h2>
            <p className="text-[12px] text-neutral-500 mt-0.5">
              Operating timezone, kitchen prep time, legal GSTIN registration, and store GPS coordinates.
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
              <Edit2 size={13} /> Edit Operations
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
        {/* ── Operations, Timing & Business Legal Registration ── */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-neutral-200 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 border-b border-neutral-100 pb-3.5">
            <div className="w-7 h-7 rounded-lg bg-orange-50 border border-orange-200/80 text-brand-primary flex items-center justify-center shrink-0">
              <Building2 size={15} />
            </div>
            <div>
              <h3 className="text-[13px] font-800 text-neutral-900 uppercase tracking-wider">
                Operations, Timing & Business Legal Registration
              </h3>
              <p className="text-[10.5px] text-neutral-400 font-medium">
                Mandatory operational parameters for billing receipts and map delivery boundaries.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Timezone */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-800 text-neutral-700 uppercase tracking-wider flex items-center gap-1.5">
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

            {/* Default Kitchen Prep Time */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-800 text-neutral-700 uppercase tracking-wider flex items-center gap-1.5">
                <Clock size={13} className="text-brand-primary" />
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

            {/* GSTIN / Tax ID Number */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-800 text-neutral-700 uppercase tracking-wider flex items-center gap-1.5">
                <FileText size={13} className="text-brand-primary" />
                <span>GSTIN / Tax ID Number</span>
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                disabled={!isEditing}
                placeholder="e.g. 07AAAAA0000A1Z5"
                value={mainSettings.gstNumber}
                onChange={(e) => setMainSettings({ ...mainSettings, gstNumber: e.target.value.toUpperCase() })}
                className={`w-full border rounded-xl px-4 py-2.5 text-[12.5px] font-bold font-mono uppercase transition-all ${
                  isEditing
                    ? 'bg-white border-brand-primary text-neutral-900 focus:outline-none ring-2 ring-brand-primary/10'
                    : 'bg-neutral-50/70 border-neutral-200 text-neutral-700 cursor-not-allowed'
                }`}
              />
            </div>

            {/* GPS Latitude */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-800 text-neutral-700 uppercase tracking-wider flex items-center justify-between">
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

            {/* GPS Longitude */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-800 text-neutral-700 uppercase tracking-wider flex items-center gap-1.5">
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
