"use client";

import React from "react";
import { ChefHat } from "lucide-react";
import { Order, CartItem } from "../types";

interface ThermalReceiptProps {
  order: Order | null;
}

export default function ThermalReceipt({ order }: ThermalReceiptProps) {
  if (!order) return null;

  const formatDateFormatted = (dateStr: string | undefined) => {
    if (!dateStr) return "Sat, Oct 24, 2026 01:40 PM";
    try {
      const d = new Date(dateStr);
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];

      const dayName = days[d.getDay()];
      const monthName = months[d.getMonth()];
      const dayNum = String(d.getDate()).padStart(2, "0");
      const year = d.getFullYear();

      let hours = d.getHours();
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12;
      hours = hours ? hours : 12;
      const strHours = String(hours).padStart(2, "0");
      const minutes = String(d.getMinutes()).padStart(2, "0");

      return `${dayName}, ${monthName} ${dayNum}, ${year} ${strHours}:${minutes} ${ampm}`;
    } catch {
      return dateStr;
    }
  };

  const formattedDateStr = formatDateFormatted(order.createdAt);
  const restaurantName = (order as any).branchName || "Taste-It Restaurant & Cafe";

  return (
    <div className="thermal-receipt-container font-mono text-black text-[13px] font-bold leading-tight select-none">
      {/* Printable Area */}
      <div className="w-[80mm] max-w-full bg-white p-4 mx-auto border border-dashed border-neutral-300 shadow-sm print:shadow-none print:border-none">
        {/* Top Branding Logo */}
        <div className="flex flex-col items-center justify-center text-center mb-2">
          <div className="flex items-center gap-1.5 justify-center mb-1">
            <ChefHat size={22} className="text-black stroke-[2.5]" />
            <div className="leading-tight text-center font-sans">
              <span className="text-base font-900 tracking-tight block uppercase">
                {restaurantName}
              </span>
            </div>
          </div>
        </div>

        {/* Store Information Box */}
        <div className="border border-dashed border-neutral-400 p-2 text-center text-[11.5px] space-y-0.5 mb-3 leading-snug font-bold">
          <p className="font-800">{(order as any)?.branchAddress || "Main Market, City Center"}</p>
          <p className="font-800">{(order as any)?.branchCity || "India"}</p>
          <p className="font-800">Tel # : {(order as any)?.branchPhone || "+91 98765 43210"}</p>
          <p className="font-800">GST# : {(order as any)?.gstNumber || (order as any)?.branchGst || (order as any)?.branch?.settings?.mainSettings?.gstNumber || "07AAAAA0000A1Z5"}</p>
        </div>

        {/* Order Header */}
        <div className="text-center space-y-1 mb-3">
          <h1 className="text-xl font-900 tracking-tight uppercase">
            Order # : {order.orderNumber.replace(/^[#A-Za-z\-]+/, "")}
          </h1>
          <p className="text-[11.5px] font-700 text-neutral-900">
            {formattedDateStr}
          </p>
          <p className="text-[12px] font-900 tracking-wide uppercase">
            ORDER SUMMARY ({order.paymentStatus === "paid" ? "PAID" : "UNPAID"})
          </p>
          <p className="text-[12.5px] font-900 tracking-widest uppercase">
            {(() => {
              const platformLabels: Record<string, string> = {
                doordash: "DoorDash",
                skip: "Skip",
                ubereats: "Uber Eats",
                online: "Online",
              };
              const platform = platformLabels[order.orderSource];
              const typeStr = order.orderType ? order.orderType.replace("-", " ") : "TAKEOUT";
              return platform ? `${platform} ${typeStr}` : typeStr;
            })()}
          </p>
        </div>

        {/* Customer / Order Notes */}
        {(order.notes || (order as any).driverNotes || (order as any).customer?.driverNotes) && (
          <div className="border border-black p-2 my-2 text-center text-[10.5px] font-800 leading-snug uppercase space-y-1.5">
            {order.notes && (
              <div>
                <p className="underline mb-0.5">ORDER NOTE:</p>
                <p className="font-900">"{order.notes}"</p>
              </div>
            )}
            {((order as any).driverNotes || (order as any).customer?.driverNotes) && (
              <div>
                <p className="underline mb-0.5">DRIVER NOTE:</p>
                <p className="font-900">"{(order as any).driverNotes || (order as any).customer?.driverNotes}"</p>
              </div>
            )}
          </div>
        )}

        {/* Items Table Header */}
        <div className="border-t border-b border-dashed border-neutral-800 py-1.5 my-2 font-800 text-[10.5px] grid grid-cols-12 uppercase">
          <span className="col-span-7">ITEMS</span>
          <span className="col-span-2 text-center">QTY</span>
          <span className="col-span-3 text-right">AMT (₹)</span>
        </div>

        {/* Items List */}
        <div className="space-y-2.5 my-2">
          {order.items && order.items.length > 0 ? (
            order.items.map((item: CartItem, idx: number) => {
              const itemTotal =
                (item.totalPrice as number | undefined) ??
                item.basePrice * item.quantity;
              return (
                <div key={idx} className="space-y-0.5">
                  <div className="grid grid-cols-12 font-800 text-[11px] items-start">
                    <span className="col-span-7 pr-1 leading-tight">
                      {item.name}
                    </span>
                    <span className="col-span-2 text-center font-700">
                      {item.quantity}
                    </span>
                    <span className="col-span-3 text-right font-700">
                      ₹{itemTotal.toFixed(2)}
                    </span>
                  </div>

                  {/* Render Selected Variant */}
                  {(item as any).selectedVariant?.name && (
                    <p className="pl-3 text-[10px] text-neutral-800 font-700">
                      Variant: {(item as any).selectedVariant.name}
                    </p>
                  )}

                  {/* Render Selected Addons */}
                  {(item as any).selectedAddons && (item as any).selectedAddons.length > 0 && (
                    <div className="pl-3 text-[10px] text-neutral-700 font-500">
                      {(item as any).selectedAddons.map((addon: any, aIdx: number) => (
                        <p key={aIdx}>
                          + {addon.name} {addon.price > 0 ? `(+₹${addon.price})` : ""}
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Render Modifiers */}
                  {item.selectedModifiers &&
                    item.selectedModifiers.length > 0 && (
                      <div className="pl-3 space-y-0.5 text-[10px] text-neutral-700 font-500">
                        {item.selectedModifiers.map((mod, mIdx) => (
                          <p key={mIdx} className="leading-tight">
                            {mod.optionName}{" "}
                            {mod.price > 0 ? `(+₹${mod.price.toFixed(2)})` : ""}
                          </p>
                        ))}
                      </div>
                    )}

                  {/* Item note if any */}
                  {item.note && (
                    <p className="pl-3 text-[10px] font-700 text-black">
                      Note : {item.note}
                    </p>
                  )}
                </div>
              );
            })
          ) : (
            <p className="text-center py-2 text-neutral-500">
              No items in order
            </p>
          )}
        </div>

        {/* Totals Section */}
        <div className="border-t border-dashed border-neutral-800 pt-2 mt-3 space-y-1 text-[11px] font-600">
          <div className="flex justify-between">
            <span>Subtotal :</span>
            <span className="font-700">
              ₹{(order.subtotal ?? 0).toFixed(2)}
            </span>
          </div>
          {(order.discount ?? 0) > 0 && (
            <div className="flex justify-between">
              <span>
                Discount{order.promoCode ? ` (${order.promoCode})` : ""} :
              </span>
              <span className="font-700">
                -₹{(order.discount ?? 0).toFixed(2)}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span>GST ({((order.taxRate ?? 0.05) * 100).toFixed(0)}%) :</span>
            <span className="font-700">
              ₹{(order.tax ?? 0).toFixed(2)}
            </span>
          </div>
          {(order.tip ?? 0) > 0 && (
            <div className="flex justify-between font-700">
              <span>Tip :</span>
              <span className="font-700">
                +₹{(order.tip ?? 0).toFixed(2)}
              </span>
            </div>
          )}
          <div className="flex justify-between text-[12px] font-900 pt-1 border-t border-neutral-200">
            <span>Total :</span>
            <span className="font-900">₹{(order.total ?? 0).toFixed(2)}</span>
          </div>
        </div>

        {/* Transaction Record Section */}
        {(() => {
          const firstPayment =
            order.payments && order.payments.length > 0
              ? order.payments[0]
              : null;
          const method = (firstPayment?.method || (order as any).paymentMethod || "cash").toLowerCase();
          const isUpi = method === "upi";
          const isCard = ["card", "interac", "debit", "credit"].includes(method);

          return (
            <div className="border-t border-b border-dashed border-neutral-800 py-2 my-3 space-y-1 text-[10px]">
              <p className="text-center font-800 uppercase tracking-wider mb-1">
                TRANSACTION RECORD
              </p>
              {isUpi ? (
                <>
                  <div className="flex justify-between font-600">
                    <span>TYPE :</span>
                    <span className="font-700">UPI / QR</span>
                  </div>
                  <div className="flex justify-between font-600">
                    <span>STATUS :</span>
                    <span className="font-700">SUCCESS</span>
                  </div>
                  <div className="flex justify-between font-600">
                    <span>AMOUNT :</span>
                    <span className="font-700">₹{(order.total ?? 0).toFixed(2)}</span>
                  </div>
                </>
              ) : isCard ? (
                <>
                  <div className="flex justify-between font-600">
                    <span>TYPE :</span>
                    <span className="font-700">CARD / DIGITAL</span>
                  </div>
                  <div className="flex justify-between font-600">
                    <span>AMOUNT :</span>
                    <span className="font-700">₹{(order.total ?? 0).toFixed(2)}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between font-600">
                    <span>TYPE :</span>
                    <span className="font-700">CASH</span>
                  </div>
                  <div className="flex justify-between font-600">
                    <span>CASH GIVEN :</span>
                    <span className="font-700">
                      ₹{(firstPayment?.cashGiven ?? order.total ?? 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between font-600">
                    <span>CHANGE :</span>
                    <span className="font-700">
                      ₹{(firstPayment?.changeGiven ?? 0).toFixed(2)}
                    </span>
                  </div>
                </>
              )}
            </div>
          );
        })()}

        {/* Footer Messages */}
        <div className="text-center pt-2 text-[12px] text-black font-800">
          <p className="font-800">Thank you! Visit us again 🙏</p>
        </div>
      </div>
    </div>
  );
}
