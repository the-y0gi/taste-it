"use client";

import React from "react";
import { ShoppingCart, Plus, SlidersHorizontal } from "lucide-react";
import { MenuItem } from "../types";
import { usePosStore } from "../store/pos.store";

interface MenuCardProps {
  item: MenuItem;
  onOpenModifiers: (item: MenuItem) => void;
}

const BADGE_STYLES: Record<string, string> = {
  popular: "bg-orange-500 text-white",
  "best seller": "bg-amber-500 text-white",
  new: "bg-emerald-500 text-white",
};

export default function MenuCard({ item, onOpenModifiers }: MenuCardProps) {
  const { addToCart, addVariantToCart } = usePosStore();
  const hasVariants = !!(item.variants && item.variants.length > 0);
  const hasModifiers = !!(item.modifierGroups && item.modifierGroups.length > 0);
  const isOutOfStock = !!item.isOutOfStock;

  const handleCardClick = () => {
    if (isOutOfStock) return;
    if (hasVariants) {
      // If it has variants, auto-add default variant or first variant
      const defaultVar =
        item.variants?.find((v) => v.isDefault) || item.variants?.[0];
      if (defaultVar) {
        addVariantToCart(item, {
          name: defaultVar.name || defaultVar.sizeName || defaultVar.sizeCode || "",
          price: defaultVar.price,
        });
      }
    } else if (hasModifiers) {
      onOpenModifiers(item);
    } else {
      addToCart(item, []);
    }
  };

  const foodType = item.foodType || "veg";

  return (
    <div
      onClick={handleCardClick}
      className={`group relative flex flex-col bg-white rounded-xl border overflow-hidden transition-all duration-200 ${
        isOutOfStock
          ? "border-neutral-200 bg-neutral-50/70 opacity-60 cursor-not-allowed select-none"
          : "border-neutral-200 hover:border-orange-500/50 hover:shadow-md hover:shadow-orange-500/10 cursor-pointer active:scale-[0.99]"
      }`}
    >
      {/* Badges Bar (Food Type, Badge, Shortcode) */}
      <div className="absolute top-2 left-2 right-2 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-1.5">
          {/* Indian Veg / Non-Veg / Egg Symbol */}
          <div
            className={`w-4 h-4 rounded-sm border flex items-center justify-center bg-white/95 shadow-xs ${
              foodType === "veg"
                ? "border-emerald-600"
                : foodType === "non_veg"
                ? "border-red-600"
                : "border-amber-600"
            }`}
            title={
              foodType === "veg"
                ? "Pure Veg"
                : foodType === "non_veg"
                ? "Non-Veg"
                : "Contains Egg"
            }
          >
            <div
              className={`w-2 h-2 rounded-full ${
                foodType === "veg"
                  ? "bg-emerald-600"
                  : foodType === "non_veg"
                  ? "bg-red-600"
                  : "bg-amber-600"
              }`}
            />
          </div>

          {/* Promotional Badge */}
          {item.badge && !isOutOfStock && (
            <span
              className={`text-[8.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shadow-xs ${
                BADGE_STYLES[item.badge.toLowerCase()] ?? "bg-neutral-600 text-white"
              }`}
            >
              {item.badge}
            </span>
          )}
        </div>

        {/* Cashier Shortcode */}
        {item.shortcode && (
          <span className="text-[9.5px] font-mono font-black text-neutral-700 bg-white/95 px-1.5 py-0.5 rounded border border-neutral-200 shadow-xs uppercase">
            {item.shortcode}
          </span>
        )}
      </div>

      {/* Image Thumbnail */}
      <div className="h-[95px] lg:h-[110px] w-full overflow-hidden bg-neutral-100 relative flex-shrink-0">
        <img
          src={
            item.image ||
            "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=200&auto=format&fit=crop&q=60"
          }
          alt={item.name}
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=200&auto=format&fit=crop&q=60";
          }}
          className={`w-full h-full object-cover transition-transform duration-300 ${
            !isOutOfStock ? "group-hover:scale-105" : "grayscale"
          }`}
        />

        {/* Out of stock overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-neutral-900/60 z-20 flex items-center justify-center">
            <span className="bg-neutral-800 text-white text-[9.5px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded border border-neutral-700">
              Out of stock
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-2.5 flex-1 flex flex-col justify-between gap-1.5">
        <div>
          <div className="flex items-start justify-between gap-1">
            <h4
              className={`text-[13.5px] lg:text-[14.5px] font-extrabold leading-tight transition-colors line-clamp-1 ${
                isOutOfStock
                  ? "text-neutral-400"
                  : "text-neutral-900 group-hover:text-orange-600"
              }`}
            >
              {item.name}
            </h4>

            {/* Customizer trigger if deep modifiers exist */}
            {hasModifiers && !isOutOfStock && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenModifiers(item);
                }}
                className="text-neutral-400 hover:text-orange-600 p-0.5 rounded hover:bg-orange-50 transition-colors"
                title="Customize item"
              >
                <SlidersHorizontal size={13} />
              </button>
            )}
          </div>

          {item.description && (
            <p className="text-[10px] lg:text-[11px] text-neutral-400 line-clamp-1 mt-0.5">
              {item.description}
            </p>
          )}
        </div>

        {/* Pricing / Quick Variant Pills Section */}
        <div className="mt-1">
          {hasVariants ? (
            /* Variant Pills: 1-Step Instant Add */
            <div className="flex flex-wrap gap-1">
              {item.variants
                ?.filter((v) => v.isEnabled !== false)
                .map((v) => {
                  const varName = v.name || v.sizeName || v.sizeCode || "";
                  return (
                    <button
                      key={varName}
                      type="button"
                      disabled={isOutOfStock}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isOutOfStock) {
                          addVariantToCart(item, {
                            name: varName,
                            price: v.price,
                          });
                        }
                      }}
                      className="flex-1 min-w-[55px] py-1 px-1.5 rounded-lg bg-orange-50 hover:bg-orange-500 hover:text-white border border-orange-200 text-orange-900 text-[10.5px] font-bold transition-all flex items-center justify-between cursor-pointer active:scale-95 shadow-2xs"
                    >
                      <span className="truncate mr-1">{varName}</span>
                      <span className="font-black text-[11px]">₹{v.price}</span>
                    </button>
                  );
                })}
            </div>
          ) : (
            /* Single Price: 1-Click Instant Add */
            <div className="flex items-center justify-between">
              <span className="text-[14px] lg:text-[15px] font-black text-neutral-900">
                ₹{item.price}
              </span>

              {!isOutOfStock ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    addToCart(item, []);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-orange-50 hover:bg-orange-500 text-orange-700 hover:text-white border border-orange-200 text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95 shadow-2xs"
                >
                  <Plus size={12} strokeWidth={2.5} />
                  <span>Add</span>
                </button>
              ) : (
                <span className="text-[9px] font-bold text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded">
                  Unavailable
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
