"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  ShoppingBag,
  Users,
  Trash2,
  Plus,
  ChevronRight,
  UtensilsCrossed,
  Banknote,
  QrCode,
  Zap,
  Printer,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { usePosStore } from "../store/pos.store";
import CartItem from "./CartItem";
import ModifierDrawer from "./ModifierDrawer";
import { CartItem as CartItemType, Order } from "../types";

export default function CartPanel() {
  const {
    cartItems,
    selectedCustomer,
    selectedTable,
    orderType,
    subtotal,
    tax,
    discount,
    total,
    clearCart,
    openCheckout,
    nextOrderNumber,
    branchTaxFees,
    menuItems,
    editingOrderId,
    editingOrderNumber,
    cancelEditingOrder,
    updatingOrder,
    placeExpressOrder,
    placingOrder,
  } = usePosStore();

  const [editingCartItem, setEditingCartItem] = useState<CartItemType | null>(null);
  const [isExpressMode, setIsExpressMode] = useState(false);
  const [isPrintingToken, setIsPrintingToken] = useState(false);

  useEffect(() => {
    const checkExpress = () => {
      if (typeof window === "undefined") return;
      try {
        const raw = localStorage.getItem("rms_branch");
        if (raw) {
          const b = JSON.parse(raw);
          setIsExpressMode(b.restaurantType === "tea_stall" || b.featureToggles?.expressBilling === true);
        }
      } catch {}
    };
    checkExpress();
    window.addEventListener("rms_branch_updated", checkExpress);
    window.addEventListener("storage", checkExpress);
    return () => {
      window.removeEventListener("rms_branch_updated", checkExpress);
      window.removeEventListener("storage", checkExpress);
    };
  }, []);

  const playToneChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } catch {}
  };

  const handleExpressPay = async (method: "cash" | "upi") => {
    if (!cartItems.length) {
      toast.error("Cart is empty.");
      return;
    }
    try {
      const order = await placeExpressOrder(method);
      if (order) {
        playToneChime();
        const tokenNum = order.tokenNumber ? `#${order.tokenNumber}` : order.orderNumber;

        // 🖨️ Auto Silent Print direct to Thermal Printer!
        if (order._id) {
          handlePrintTokenSlip(order._id);
        }

        toast.success(`⚡ Token ${tokenNum} Placed & Slip Printed!`, {
          duration: 3500,
        });
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to place order.");
    }
  };

  const handlePrintTokenSlip = async (orderId?: string) => {
    if (!orderId) return;
    setIsPrintingToken(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      await axios.post(`${apiUrl}/orders/${orderId}/print`, { paperSize: "80mm" });
      toast.success("Token slip printed!");
    } catch {
      toast.error("Printer offline — check connection.");
    } finally {
      setIsPrintingToken(false);
    }
  };

  // In Indian restaurants, standard GST is 5% (2.5% CGST + 2.5% SGST)
  const activeTaxRatePercent = branchTaxFees?.gstTaxRate ?? 5;

  const orderNum = editingOrderNumber || nextOrderNumber;

  const validate = () => {
    if (!cartItems.length) {
      toast.error("Cart is empty.");
      return false;
    }
    if (orderType === "dine-in" && !selectedTable) {
      toast.error("Please assign a dining table for Dine-In order.");
      return false;
    }
    return true;
  };

  const handleCreate = () => {
    if (!validate()) return;
    openCheckout();
  };

  const handleClearCart = () => {
    if (cartItems.length === 0) return;

    toast(
      (t) => (
        <div className="flex flex-col gap-2 p-1.5 min-w-[220px]">
          <p className="text-[11.5px] font-700 text-neutral-800 uppercase tracking-wide">
            {editingOrderId ? "Discard Edits" : "Clear Cart"}
          </p>
          <p className="text-[10px] text-neutral-500 font-550">
            {editingOrderId
              ? "Are you sure you want to discard changes for this order?"
              : "Are you sure you want to clear all items from your cart?"}
          </p>
          <div className="flex justify-end gap-2 mt-1.5">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-2.5 py-1 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-600 text-[10px] font-700 transition-all cursor-pointer border border-neutral-200"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                if (editingOrderId) {
                  cancelEditingOrder();
                } else {
                  clearCart();
                }
                toast.success("Cart cleared.");
              }}
              className="px-2.5 py-1 rounded bg-[#DC2626] hover:bg-red-700 text-white text-[10px] font-700 transition-all cursor-pointer"
            >
              Yes, Clear
            </button>
          </div>
        </div>
      ),
      {
        duration: 8000,
      },
    );
  };

  // Find the full MenuItem for the cart item being edited
  const editMenuItem = editingCartItem
    ? menuItems.find((m) => m.id === editingCartItem.menuItemId || m._id === editingCartItem.menuItemId) ?? null
    : null;

  return (
    <>
      {/* Edit Drawer */}
      <ModifierDrawer
        item={editMenuItem}
        isOpen={!!editingCartItem && !!editMenuItem}
        onClose={() => setEditingCartItem(null)}
        editCartItem={editingCartItem}
      />

      <div className="bg-white rounded-xl border border-neutral-200 flex flex-col h-full overflow-hidden select-none">
        {/* ── Header ── */}
        <div className={`flex items-center justify-between px-3.5 py-2.5 border-b flex-shrink-0 ${editingOrderId ? "bg-amber-50/80 border-amber-200" : "border-neutral-100"}`}>
          <div>
            <h3 className={`text-[13px] lg:text-[15px] font-800 leading-tight ${editingOrderId ? "text-amber-900" : "text-neutral-900"}`}>
              {editingOrderId ? "Editing Order" : "Current Order"}
            </h3>
            <span className={`text-[11px] lg:text-[13px] font-800 tracking-wide mt-0.5 block ${editingOrderId ? "text-amber-800" : "text-brand-primary"}`}>
              {orderNum}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {orderType === "dine-in" && selectedTable && (
              <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-800 uppercase tracking-wide flex items-center gap-1 shadow-2xs">
                <UtensilsCrossed size={11} className="text-emerald-700" />
                <span>{selectedTable.name}</span>
              </span>
            )}
            <div className="flex items-center gap-1 bg-neutral-100 px-2 py-0.5 rounded-md">
              <Users size={11} className="text-neutral-500" />
              <span className="text-[10px] lg:text-[11px] font-800 text-neutral-700">
                {selectedCustomer ? 1 : 0}
              </span>
            </div>
            <button
              onClick={handleClearCart}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer"
              title={editingOrderId ? "Cancel editing" : "Clear cart"}
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        {/* ── Cart Items ── */}
        <div className="flex-1 overflow-y-auto px-3.5 min-h-0">
          {cartItems.length > 0 ? (
            <div className="py-1">
              {cartItems.map((item) => (
                <CartItem
                  key={item.id}
                  item={item}
                  onEdit={(cartItem) => setEditingCartItem(cartItem)}
                />
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center py-8 text-center">
              <div className="w-13 h-13 bg-neutral-50 border border-neutral-200 rounded-full flex items-center justify-center mb-2">
                <ShoppingBag size={20} className="text-neutral-300" />
              </div>
              <h4 className="text-[12.5px] lg:text-[14.5px] font-800 text-neutral-700">
                Cart is empty
              </h4>
              <p className="text-[10px] lg:text-[12px] text-neutral-400 mt-1 leading-normal">
                Select items from the menu
              </p>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="border-t border-neutral-100 px-3.5 py-3 space-y-3 flex-shrink-0">
          {/* Add More */}
          {/* <button
            onClick={() =>
              document
                .getElementById("menu-grid-section")
                ?.scrollIntoView({ behavior: "smooth" })
            }
            className="w-full py-2 rounded-lg border border-dashed border-neutral-300 text-neutral-600 hover:border-brand-primary hover:text-brand-primary text-[11px] lg:text-[12px] font-700 flex items-center justify-center gap-1.5 hover:bg-orange-50/30 transition-all cursor-pointer"
          >
            <Plus size={12} />
            Add More Items
          </button> */}

          {/* Totals in INR ₹ */}
          <div className="space-y-1.5">
            {[
              {
                label: "Subtotal",
                value: `₹${subtotal.toFixed(2)}`,
                cls: "text-neutral-800",
              },
              {
                label: `GST (${activeTaxRatePercent}%)`,
                value: `₹${tax.toFixed(2)}`,
                cls: "text-neutral-600",
              },
              ...(discount > 0
                ? [
                    {
                      label: "Discount",
                      value: `-₹${discount.toFixed(2)}`,
                      cls: "text-green-600",
                    },
                  ]
                : []),
            ].map(({ label, value, cls }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-[11px] lg:text-[13px] font-600 text-neutral-500">
                  {label}
                </span>
                <span className={`text-[11px] lg:text-[13px] font-700 ${cls}`}>{value}</span>
              </div>
            ))}
            <div className="flex items-center justify-between pt-2 border-t border-neutral-100 mt-1">
              <span className="text-[12.5px] lg:text-[14.5px] font-900 text-neutral-900 uppercase tracking-wide">
                Total
              </span>
              <span className="text-[16px] lg:text-[20px] font-900 text-brand-primary">
                ₹{total.toFixed(2)}
              </span>
            </div>
          </div>

          {/* CTA Buttons */}
          {editingOrderId ? (
            <div className="space-y-1.5 pt-0.5">
              <button
                onClick={handleCreate}
                disabled={!cartItems.length || updatingOrder}
                className={`w-full py-3 rounded-xl text-[13px] lg:text-[14.5px] font-900 flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-[0.99] cursor-pointer ${
                  cartItems.length && !updatingOrder
                    ? "bg-amber-600 text-white hover:bg-amber-700 shadow-amber-600/20"
                    : "bg-neutral-100 text-neutral-400 cursor-not-allowed shadow-none"
                }`}
              >
                {updatingOrder ? "Updating Order..." : `Update Order ${editingOrderNumber}`} <ChevronRight size={15} strokeWidth={2.5} />
              </button>
              <button
                onClick={cancelEditingOrder}
                className="w-full py-1 rounded-lg border border-neutral-200 text-neutral-500 hover:bg-neutral-100 text-[10px] font-600 transition-all cursor-pointer"
              >
                Cancel Editing
              </button>
            </div>
          ) : isExpressMode ? (
            <div className="space-y-2 pt-0.5">
              {/* 1-Tap Quick Pay Dock */}
              <div className="grid grid-cols-2 gap-2">
                {/* 1-Tap Cash */}
                <button
                  onClick={() => handleExpressPay("cash")}
                  disabled={!cartItems.length || placingOrder}
                  className={`py-3 px-2 rounded-xl text-[12.5px] lg:text-[13.5px] font-900 flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-[0.98] cursor-pointer ${
                    cartItems.length && !placingOrder
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20"
                      : "bg-neutral-100 text-neutral-400 cursor-not-allowed shadow-none"
                  }`}
                  title="1-Tap Instant Cash Settlement"
                >
                  <Banknote size={16} />
                  <span>{placingOrder ? "..." : `CASH ₹${total.toFixed(0)}`}</span>
                </button>

                {/* 1-Tap UPI */}
                <button
                  onClick={() => handleExpressPay("upi")}
                  disabled={!cartItems.length || placingOrder}
                  className={`py-3 px-2 rounded-xl text-[12.5px] lg:text-[13.5px] font-900 flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-[0.98] cursor-pointer ${
                    cartItems.length && !placingOrder
                      ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20"
                      : "bg-neutral-100 text-neutral-400 cursor-not-allowed shadow-none"
                  }`}
                  title="1-Tap Instant UPI / QR Settlement"
                >
                  <QrCode size={16} />
                  <span>{placingOrder ? "..." : `UPI ₹${total.toFixed(0)}`}</span>
                </button>
              </div>

              {/* Detailed Checkout Option */}
              <button
                onClick={handleCreate}
                disabled={!cartItems.length || placingOrder}
                className="w-full py-1.5 rounded-lg border border-neutral-200 text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50 text-[10.5px] font-700 flex items-center justify-center gap-1 transition-all cursor-pointer"
              >
                <span>More Billing Options</span>
                <ChevronRight size={13} />
              </button>
            </div>
          ) : (
            <div className="space-y-1.5 pt-0.5">
              <button
                onClick={handleCreate}
                disabled={!cartItems.length}
                className={`w-full py-3 lg:py-3.5 rounded-xl text-[13px] lg:text-[14.5px] font-900 flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-[0.99] cursor-pointer ${
                  cartItems.length
                    ? "bg-brand-primary text-white hover:bg-brand-primary-hover shadow-brand-primary/20"
                    : "bg-neutral-100 text-neutral-400 cursor-not-allowed shadow-none"
                }`}
              >
                Create Order <ChevronRight size={15} strokeWidth={2.5} />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
