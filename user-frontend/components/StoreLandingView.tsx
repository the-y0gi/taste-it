"use client";

import React, { useState, useMemo } from "react";
import {
  MapPin,
  Phone,
  Clock,
  Search,
  Building2,
  ArrowRight,
  Sparkles,
  Utensils,
} from "lucide-react";

import { isBranchCurrentlyOpen } from "../lib/storeTimingUtils";

export interface BranchStore {
  _id: string;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  email?: string;
  openingHours?: string;
  isActive: boolean;
  qrCodePayload?: string;
  settings?: any;
  logo?: string;
  themeColor?: string;
  restaurantType?: string;
}

interface StoreLandingViewProps {
  branches: BranchStore[];
  loading: boolean;
  onSelectStore: (store: BranchStore) => void;
}

const RESTAURANT_TYPE_LABELS: Record<string, string> = {
  cafe: "Cafe & Fast Bites ☕",
  fine_dine: "Family Restaurant 🍛",
  fast_food: "Fast Food & QSR 🍔",
  pizzeria: "Pizzeria 🍕",
  bar: "Restro-Bar & Lounge 🍸",
  bakery: "Bakery & Desserts 🍰",
  other: "Restaurant & Kitchen",
};

export default function StoreLandingView({
  branches,
  loading,
  onSelectStore,
}: StoreLandingViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "open">("all");

  const filteredBranches = useMemo(() => {
    let list = branches;
    if (filterMode === "open") {
      list = list.filter((b) => b.isActive);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          (b.address && b.address.toLowerCase().includes(q)) ||
          (b.code && b.code.toLowerCase().includes(q))
      );
    }
    return list;
  }, [branches, filterMode, searchQuery]);

  return (
    <div className="min-h-screen bg-brand-bg text-neutral-900 font-sans select-none flex flex-col">
      {/* ── HEADER NAVIGATION ── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-200/80 px-4 sm:px-6 py-3 flex items-center justify-between shadow-sm">
        {/* Brand Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-orange-500 text-white font-900 text-xl flex items-center justify-center shadow-sm">
            T
          </div>
          <div>
            <span className="text-base font-black tracking-tight text-neutral-900 block leading-tight">
              Taste-It
            </span>
            <span className="text-[10px] font-bold text-neutral-400 block tracking-wider uppercase">
              Restaurants & Cafes
            </span>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 bg-orange-50/70 border border-orange-200/60 px-3.5 py-1.5 rounded-xl text-xs text-neutral-700 font-semibold">
          <Sparkles size={14} className="text-brand-primary animate-pulse" />
          <span>Select your favorite restaurant to view menu & order</span>
        </div>
      </header>

      {/* ── HERO BANNER ── */}
      <section className="bg-white border-b border-neutral-200 px-4 sm:px-6 py-10 sm:py-14">
        <div className="max-w-4xl mx-auto text-center space-y-3.5">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-50 border border-orange-200/60 text-brand-primary text-xs font-bold uppercase tracking-wider">
            <Building2 size={13} />
            <span>Discover Top Local Spots</span>
          </span>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-neutral-900 leading-tight">
            Order Fresh Meals From <span className="text-brand-primary">Top Restaurants & Cafes</span>
          </h1>

          <p className="text-xs sm:text-sm text-neutral-500 max-w-xl mx-auto leading-relaxed">
            Choose a cafe or family restaurant below to explore authentic Indian dishes, columnar combos, and lightning-fast ordering.
          </p>

          {/* Search & Filter Bar */}
          <div className="max-w-xl mx-auto pt-3 flex flex-col sm:flex-row items-center gap-2.5">
            <div className="relative flex-1 w-full">
              <Search
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search restaurant name, cuisine, or address..."
                className="w-full bg-neutral-50 border border-neutral-200 focus:border-brand-primary focus:bg-white rounded-xl py-2.5 pl-10 pr-4 text-xs sm:text-sm text-neutral-800 placeholder-neutral-400 outline-none transition-all"
              />
            </div>

            <div className="flex items-center gap-1.5 bg-neutral-100 p-1 rounded-xl border border-neutral-200/60 shrink-0">
              <button
                type="button"
                onClick={() => setFilterMode("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filterMode === "all"
                    ? "bg-brand-primary text-white shadow-sm"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                All Outlets ({branches.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode("open")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filterMode === "open"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                Open Now
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── STORES GRID SECTION ── */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-200/80 mb-6">
          <div>
            <h2 className="text-sm sm:text-base font-black text-neutral-900 leading-snug">
              Available Restaurants & Outlets
            </h2>
            <p className="text-[11px] text-neutral-500 mt-0.5 font-medium">
              Showing {filteredBranches.length} outlets ready for delivery & dining
            </p>
          </div>
        </div>

        {loading ? (
          /* Loading Skeletons */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="bg-white border border-neutral-200/80 rounded-2xl p-4 sm:p-5 space-y-4 animate-pulse"
              >
                <div className="flex justify-between items-center pb-3 border-b border-neutral-100">
                  <div className="h-5 bg-neutral-100 w-20 rounded-full" />
                  <div className="h-5 bg-neutral-100 w-16 rounded-md" />
                </div>
                <div className="h-4 bg-neutral-100 w-3/4 rounded-md" />
                <div className="h-3 bg-neutral-100/70 w-full rounded-md" />
                <div className="h-3 bg-neutral-100/70 w-2/3 rounded-md" />
                <div className="h-10 bg-neutral-100 rounded-xl mt-2" />
              </div>
            ))}
          </div>
        ) : filteredBranches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredBranches.map((branch) => {
              const statusInfo = isBranchCurrentlyOpen(branch);
              const isEmergencyClosed = !!branch.settings?.mainSettings?.isEmergencyClosed;
              const isDisabled = isEmergencyClosed;
              const typeLabel = RESTAURANT_TYPE_LABELS[branch.restaurantType || "cafe"] || "Restaurant";
              const accentColor = branch.themeColor || "#F97316";

              return (
                <div
                  key={branch._id}
                  className="group bg-white border border-neutral-200/80 hover:border-neutral-300 rounded-2xl overflow-hidden shadow-xs hover:shadow-lg transition-all duration-200 flex flex-col justify-between p-4 sm:p-5"
                >
                  {/* Top Badges Header */}
                  <div className="flex items-center justify-between gap-2 pb-3.5 border-b border-neutral-100 mb-3.5">
                    {/* Status Badge */}
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                        statusInfo.isOpen
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-red-50 text-red-700 border-red-200"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          statusInfo.isOpen ? "bg-emerald-500 animate-pulse" : "bg-red-500"
                        }`}
                      />
                      {statusInfo.reason}
                    </span>

                    {/* Restaurant Type Badge */}
                    <span className="bg-orange-50 border border-orange-200/70 text-orange-800 text-[10px] font-bold px-2.5 py-1 rounded-lg">
                      {typeLabel}
                    </span>
                  </div>

                  {/* Body Info */}
                  <div className="flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center gap-2">
                        {branch.logo ? (
                          <img
                            src={branch.logo}
                            alt={branch.name}
                            className="w-8 h-8 rounded-lg object-contain bg-neutral-50 border border-neutral-200 shrink-0"
                          />
                        ) : (
                          <span
                            className="w-8 h-8 rounded-lg text-white font-900 text-xs flex items-center justify-center shrink-0"
                            style={{ backgroundColor: accentColor }}
                          >
                            {branch.name.charAt(0)}
                          </span>
                        )}
                        <h3 className="text-sm sm:text-base font-black text-neutral-800 group-hover:text-brand-primary transition-colors leading-snug">
                          {branch.name}
                        </h3>
                      </div>

                      <div className="mt-2.5 space-y-2 text-[11px] text-neutral-600 font-medium">
                        <p className="flex items-start gap-1.5 leading-relaxed">
                          <MapPin size={14} className="text-brand-primary shrink-0 mt-0.5" />
                          <span>{branch.address || "Main Market, Commercial Center"}</span>
                        </p>

                        {branch.phone && (
                          <p className="flex items-center gap-1.5">
                            <Phone size={13} className="text-neutral-400 shrink-0" />
                            <span>{branch.phone}</span>
                          </p>
                        )}

                        <p className="flex items-center gap-1.5 text-[10.5px] text-neutral-500 font-semibold">
                          <Clock size={13} className="text-brand-primary shrink-0" />
                          <span>Today: {statusInfo.scheduleText}</span>
                        </p>
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      type="button"
                      disabled={isDisabled}
                      onClick={() => !isDisabled && onSelectStore(branch)}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        isDisabled
                          ? "bg-neutral-100 border border-neutral-200 text-neutral-400 cursor-not-allowed shadow-none"
                          : "bg-brand-primary hover:bg-brand-primary-hover text-white shadow-md shadow-brand-primary/10 active:scale-[0.98] cursor-pointer"
                      }`}
                    >
                      <span>{isDisabled ? "Temporarily Closed" : "View Menu & Order"}</span>
                      {!isDisabled && <ArrowRight size={13} />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border border-dashed border-neutral-300 rounded-2xl p-12 text-center max-w-md mx-auto my-8 space-y-2">
            <span className="text-3xl block">🔍</span>
            <h3 className="text-sm font-bold text-neutral-800">No restaurants found</h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              We couldn&apos;t find any restaurant matching &ldquo;{searchQuery}&rdquo;. Try another name or clear your filters.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
