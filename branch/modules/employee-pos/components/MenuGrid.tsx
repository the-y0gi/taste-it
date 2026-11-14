"use client";

import React, { useEffect, useMemo, useState } from "react";
import { UserPlus } from "lucide-react";
import { MenuItem } from "../types";
import { usePosStore } from "../store/pos.store";
import MenuCard from "./MenuCard";
import SearchBar from "./SearchBar";
import SortDropdown from "./SortDropdown";
import CustomerModal from "./CustomerModal";

interface MenuGridProps {
  onOpenModifiers: (item: MenuItem) => void;
}

const ORDER_TYPES = [
  { id: "takeout", label: "Takeout" },
  { id: "delivery", label: "Delivery" },
  { id: "dine-in", label: "Dine In" },
] as const;

export default function MenuGrid({ onOpenModifiers }: MenuGridProps) {
  const {
    search,
    selectedCategory,
    foodTypeFilter,
    setFoodTypeFilter,
    sortBy,
    menuItems,
    categories,
    loadingMenu,
    orderType,
    setOrderType,
    selectedCustomer,
  } = usePosStore();

  const [showCustomer, setShowCustomer] = useState(false);
  const [branchToggles, setBranchToggles] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const readToggles = () => {
      try {
        const raw = localStorage.getItem("rms_branch");
        if (raw) {
          const b = JSON.parse(raw);
          setBranchToggles(b.featureToggles || {});
        }
      } catch {}
    };
    readToggles();
    window.addEventListener("rms_branch_updated", readToggles);
    window.addEventListener("storage", readToggles);
    return () => {
      window.removeEventListener("rms_branch_updated", readToggles);
      window.removeEventListener("storage", readToggles);
    };
  }, []);

  const availableOrderTypes = useMemo(() => {
    const isDelivery = branchToggles.delivery ?? branchToggles.deliveryFleet ?? false;
    const isDineIn = branchToggles.tableManagement ?? false;
    return ORDER_TYPES.filter((t) => {
      if (t.id === "delivery" && !isDelivery) return false;
      if (t.id === "dine-in" && !isDineIn) return false;
      return true;
    });
  }, [branchToggles]);

  useEffect(() => {
    if (availableOrderTypes.length > 0 && !availableOrderTypes.some((t) => t.id === orderType)) {
      setOrderType(availableOrderTypes[0].id as any);
    }
  }, [availableOrderTypes, orderType, setOrderType]);

  const catName = useMemo(() => {
    return (
      categories.find((c) => c.id === selectedCategory)?.name ??
      (categories[0]?.name || "Menu")
    );
  }, [selectedCategory, categories]);

  const items = useMemo(() => {
    let list =
      !selectedCategory || selectedCategory === "all"
        ? menuItems
        : menuItems.filter((i) => i.categoryId === selectedCategory);

    // Food Type Filter (Veg / Non-Veg / Egg)
    if (foodTypeFilter && foodTypeFilter !== "all") {
      list = list.filter((i) => (i.foodType || "veg") === foodTypeFilter);
    }

    // Search Filter (by Name or Shortcode)
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (i) =>
          i.shortcode?.toLowerCase() === q ||
          i.name.toLowerCase().includes(q) ||
          i.description?.toLowerCase().includes(q),
      );
    }

    return [...list].sort((a, b) => {
      if (sortBy === "popular") {
        const pDiff = (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0);
        if (pDiff !== 0) return pDiff;
      } else if (sortBy === "newest") {
        const bDiff = (b.badge === "New" ? 1 : 0) - (a.badge === "New" ? 1 : 0);
        if (bDiff !== 0) return bDiff;
      } else if (sortBy === "price-low") {
        const prDiff = a.price - b.price;
        if (prDiff !== 0) return prDiff;
      } else if (sortBy === "price-high") {
        const prDiff = b.price - a.price;
        if (prDiff !== 0) return prDiff;
      }

      const orderA = a.displayOrder || 0;
      const orderB = b.displayOrder || 0;
      if (orderA > 0 && orderB > 0) return orderA - orderB;
      if (orderA > 0 && orderB === 0) return -1;
      if (orderA === 0 && orderB > 0) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [selectedCategory, foodTypeFilter, search, sortBy, menuItems]);

  return (
    <div className="flex flex-col h-full">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between pb-2 border-b border-neutral-200 flex-shrink-0 gap-2">
        {/* Left: Category Title & Count */}
        <div className="flex-shrink-0">
          <h2 className="text-[13px] md:text-[14px] lg:text-[15.5px] font-extrabold text-neutral-900">
            {catName}
          </h2>
          <p className="text-[10px] md:text-[11px] text-neutral-500 font-semibold mt-0.5">
            {items.length} item{items.length !== 1 ? "s" : ""} available
          </p>
        </div>

        {/* Center: Order Type Tabs & Food Type Filter */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Order Types */}
          <div className="flex items-center gap-0.5 bg-neutral-100 p-0.5 rounded-xl border border-neutral-200 flex-shrink-0">
            {availableOrderTypes.map(({ id, label }) => {
              const active = orderType === id;
              return (
                <button
                  key={id}
                  onClick={() => {
                    setOrderType(id as any);
                    if (id === "delivery") setShowCustomer(true);
                  }}
                  className={`px-2 md:px-3 py-1 rounded-lg text-[10.5px] md:text-[11.5px] font-bold transition-all cursor-pointer ${
                    active
                      ? "bg-neutral-900 text-white shadow-xs"
                      : "text-neutral-700 hover:bg-neutral-200/60"
                  }`}
                >
                  {label}
                </button>
              );
            })}

            {branchToggles.customers !== false && (
              <button
                onClick={() => setShowCustomer(true)}
                className={`ml-0.5 px-2 py-1 rounded-lg border text-[10px] md:text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  selectedCustomer
                    ? "bg-orange-50 border-orange-500 text-orange-600"
                    : "bg-white border-neutral-200 text-neutral-800 hover:bg-neutral-50"
                }`}
              >
                <UserPlus size={11} />
                <span className="truncate max-w-[80px]">
                  {selectedCustomer ? selectedCustomer.name : "+ Customer"}
                </span>
              </button>
            )}
          </div>

          {/* Indian Food Type Toggle (Veg / Non-Veg / Egg / All) */}
          <div className="flex items-center gap-0.5 bg-neutral-100 p-0.5 rounded-xl border border-neutral-200 flex-shrink-0">
            <button
              onClick={() => setFoodTypeFilter("all")}
              className={`px-2 py-1 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer ${
                foodTypeFilter === "all"
                  ? "bg-white text-neutral-900 shadow-xs border border-neutral-200"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFoodTypeFilter("veg")}
              className={`px-2 py-1 rounded-lg text-[10.5px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                foodTypeFilter === "veg"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-emerald-700 hover:bg-emerald-50"
              }`}
              title="Show Pure Veg only"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              <span>Veg</span>
            </button>
            <button
              onClick={() => setFoodTypeFilter("non_veg")}
              className={`px-2 py-1 rounded-lg text-[10.5px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                foodTypeFilter === "non_veg"
                  ? "bg-red-600 text-white shadow-xs"
                  : "text-red-700 hover:bg-red-50"
              }`}
              title="Show Non-Veg only"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              <span>Non-Veg</span>
            </button>
          </div>
        </div>

        {/* Right: Search & Sort */}
        <div className="flex items-center gap-1 md:gap-1.5 flex-shrink-0">
          <div className="w-[110px] md:w-[140px] lg:w-[170px]">
            <SearchBar />
          </div>
          <SortDropdown />
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto pt-3 min-h-0 pr-0.5">
        {loadingMenu ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-2.5">
            {Array.from({ length: 12 }).map((_, idx) => (
              <div
                key={`menu-skeleton-${idx}`}
                className="flex flex-col bg-white rounded-xl border border-neutral-200 overflow-hidden p-2.5 gap-2.5 animate-pulse"
              >
                <div className="h-[90px] w-full bg-neutral-100 rounded-lg flex-shrink-0" />
                <div className="flex-1 flex flex-col justify-between gap-2.5">
                  <div className="space-y-2">
                    <div className="h-3 w-3/4 bg-neutral-100 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : items.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-2.5">
            {items.map((item) => (
              <MenuCard
                key={item.id}
                item={item}
                onOpenModifiers={onOpenModifiers}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-40 border border-dashed border-neutral-200 rounded-xl p-6 text-center bg-neutral-50">
            <span className="text-2xl mb-2">🍽️</span>
            <h4 className="text-[12px] font-bold text-neutral-700">
              No items found
            </h4>
            <p className="text-[10px] text-neutral-400 mt-1 leading-normal">
              {search.trim()
                ? `No results for "${search}"`
                : `No items available in ${catName}`}
            </p>
          </div>
        )}
      </div>

      <CustomerModal
        isOpen={showCustomer}
        onClose={() => setShowCustomer(false)}
      />
    </div>
  );
}
