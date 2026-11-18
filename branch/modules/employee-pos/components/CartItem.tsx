'use client';

import React from 'react';
import { Plus, Minus, Trash2, Pencil } from 'lucide-react';
import { CartItem as CartItemType } from '../types';
import { usePosStore } from '../store/pos.store';

interface CartItemProps {
  item: CartItemType;
  onEdit?: (item: CartItemType) => void;
}

export default function CartItem({ item, onEdit }: CartItemProps) {
  const { increaseQuantity, decreaseQuantity, removeFromCart } = usePosStore();

  // Strip duplicate variant text from item.name if already present
  const cleanName = item.selectedVariant?.name && item.name.includes(`(${item.selectedVariant.name})`)
    ? item.name.replace(`(${item.selectedVariant.name})`, '').trim()
    : item.name;

  return (
    <div className="py-2.5 border-b border-neutral-100 group last:border-0 hover:bg-neutral-50/50 rounded-xl px-1 transition-colors">
      {/* ── Top Row: Thumbnail + Item Details (Left) & Price (Right) ── */}
      <div className="flex items-start gap-2.5">
        {/* Thumbnail with Indian Food Type Badge */}
        <div className="relative w-10 h-10 lg:w-11 lg:h-11 rounded-lg overflow-hidden bg-neutral-100 border border-neutral-200 flex-shrink-0 mt-0.5 shadow-2xs">
          <img src={item.image} alt={cleanName} className="w-full h-full object-cover" />
          {item.foodType && (
            <div className="absolute top-1 left-1 bg-white/95 rounded-sm p-[1.5px] shadow-xs">
              <span
                className={`block w-2.5 h-2.5 rounded-full ${
                  item.foodType === 'non_veg'
                    ? 'bg-red-600'
                    : item.foodType === 'egg'
                    ? 'bg-amber-500'
                    : 'bg-green-600'
                }`}
              />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h5 className="text-[12.5px] lg:text-[13.5px] font-800 text-neutral-900 leading-snug">
              {cleanName}
            </h5>
            {item.shortcode && (
              <span className="text-[8.5px] font-900 font-mono bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded border border-neutral-200 uppercase">
                {item.shortcode}
              </span>
            )}
          </div>

          {/* Selected Variant (Indian e.g. Lite / Heavy / Half / Full) */}
          {item.selectedVariant?.name && (
            <div className="mt-0.5">
              <span className="inline-block px-1.5 py-0.5 rounded bg-orange-50 text-orange-700 font-800 text-[9.5px] border border-orange-200/80">
                {item.selectedVariant.name}
              </span>
            </div>
          )}

          {/* Selected Addons */}
          {item.selectedAddons && item.selectedAddons.length > 0 && (
            <div className="text-[10px] text-neutral-500 mt-1 space-y-0.5">
              {item.selectedAddons.map((addon, aIdx) => (
                <p key={aIdx} className="font-600 text-neutral-600">
                  + {addon.name} {addon.price > 0 ? `(₹${addon.price})` : ''}
                </p>
              ))}
            </div>
          )}

          {/* Legacy Modifiers */}
          {item.selectedModifiers && item.selectedModifiers.length > 0 ? (
            <div className="text-[10px] lg:text-[11px] text-neutral-500 mt-1 space-y-0.5 leading-tight">
              {item.selectedModifiers.map((m, idx) => (
                <p
                  key={idx}
                  className={
                    m.isRoot
                      ? 'font-700 text-neutral-700 mt-1 first:mt-0.5'
                      : 'pl-2 text-neutral-500 font-500'
                  }
                >
                  {m.isRoot ? m.optionName : `• ${m.optionName}`}
                </p>
              ))}
            </div>
          ) : !item.selectedVariant?.name && (!item.selectedAddons || item.selectedAddons.length === 0) ? (
            <p className="text-[9.5px] text-neutral-400 font-500 mt-0.5 leading-tight">
              Standard
            </p>
          ) : null}

          {item.note && (
            <p className="text-[9px] lg:text-[10px] font-600 text-amber-600 bg-amber-50 rounded px-1.5 py-0.5 mt-1 border border-amber-100 inline-block max-w-full break-words">
              {item.note}
            </p>
          )}
        </div>

        {/* Qty + Price (INR ₹) */}
        <div className="text-right flex-shrink-0 pt-0.5">
          <span className="text-[13px] lg:text-[14px] font-900 text-neutral-900 block leading-none">
            ₹{item.totalPrice.toFixed(2)}
          </span>
          {item.quantity > 1 && (
            <span className="text-[9.5px] text-neutral-400 font-bold mt-1 block">
              ₹{(item.totalPrice / item.quantity).toFixed(2)} ea
            </span>
          )}
        </div>
      </div>

      {/* ── Bottom Row: Quantity Stepper + Edit & Delete Action Buttons ── */}
      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-neutral-100">
        <span className="text-[10px] font-bold text-neutral-400">
          Qty: <span className="text-neutral-800 font-extrabold">{item.quantity}</span>
        </span>

        <div className="flex items-center gap-1.5">
          {/* Qty control */}
          <div className="flex items-center border border-neutral-200 rounded-lg overflow-hidden bg-white shadow-2xs">
            <button
              onClick={() => decreaseQuantity(item.id)}
              className="w-6 h-6 flex items-center justify-center text-neutral-600 hover:bg-neutral-100 hover:text-brand-primary transition-all cursor-pointer"
              title="Decrease quantity"
            >
              <Minus size={10} strokeWidth={2.5} />
            </button>
            <span className="w-7 h-6 flex items-center justify-center text-[11px] lg:text-[12px] font-800 text-neutral-900 border-x border-neutral-200">
              {item.quantity}
            </span>
            <button
              onClick={() => increaseQuantity(item.id)}
              className="w-6 h-6 flex items-center justify-center text-neutral-600 hover:bg-neutral-100 hover:text-green-600 transition-all cursor-pointer"
              title="Increase quantity"
            >
              <Plus size={10} strokeWidth={2.5} />
            </button>
          </div>

          {/* Edit */}
          {onEdit && (
            <button
              onClick={() => onEdit(item)}
              className="w-6 h-6 flex items-center justify-center text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all cursor-pointer shadow-2xs"
              title="Edit item options"
            >
              <Pencil size={11} />
            </button>
          )}

          {/* Delete */}
          <button
            onClick={() => removeFromCart(item.id)}
            className="w-6 h-6 flex items-center justify-center text-red-500 bg-red-50 hover:bg-red-100 hover:text-red-600 rounded-lg transition-all cursor-pointer shadow-2xs"
            title="Remove item"
          >
            <Trash2 size={11} />
          </button>
        </div>
      </div>
    </div>
  );
}
