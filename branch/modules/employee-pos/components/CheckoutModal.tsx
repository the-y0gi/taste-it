"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  CreditCard,
  Banknote,
  Clock,
  Utensils,
  ShoppingBag,
  Minus,
  Plus,
  UserPlus,
  Tag,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  Truck,
  QrCode,
  Copy,
  Check,
  Smartphone,
  TableProperties,
  ArrowRight,
} from "lucide-react";
import toast from "react-hot-toast";
import { usePosStore } from "../store/pos.store";
import OrderLaterModal from "./OrderLaterModal";
import PromoDiscountModal from "./PromoDiscountModal";
import CustomerModal from "./CustomerModal";
import TableSelectorModal from "./TableSelectorModal";

const ORDER_TYPE_LABELS: Record<
  string,
  { label: string; icon: React.ReactNode }
> = {
  takeout: { label: "Takeout", icon: <ShoppingBag size={11} /> },
  delivery: { label: "Delivery", icon: <Truck size={11} /> },
  "dine-in": { label: "Dine In", icon: <Utensils size={11} /> },
};

// Helper to calculate smart Indian currency notes for quick tender
const getQuickTenderAmounts = (amt: number): number[] => {
  const roundAmt = Math.ceil(amt);
  const options = new Set<number>();
  options.add(roundAmt);

  if (amt <= 100) {
    if (roundAmt < 100) options.add(100);
    options.add(200);
    options.add(500);
  } else if (amt <= 200) {
    if (roundAmt < 200) options.add(200);
    options.add(500);
  } else if (amt <= 500) {
    if (roundAmt < 500) options.add(500);
    options.add(1000);
  } else {
    const next100 = Math.ceil(amt / 100) * 100;
    const next500 = Math.ceil(amt / 500) * 500;
    options.add(next100);
    if (next500 > next100) options.add(next500);
    options.add(Math.ceil(amt / 1000) * 1000);
  }
  return Array.from(options).sort((a, b) => a - b).slice(0, 4);
};

export default function CheckoutModal() {
  const {
    checkoutOpen,
    closeCheckout,
    orderType,
    setOrderType,
    cartItems,
    subtotal,
    tax,
    discount,
    total,
    appliedPromo,
    manualDiscountType,
    manualDiscountValue,
    paymentTiming,
    setPaymentTiming,
    paymentType,
    setPaymentType,
    paymentMethod,
    setPaymentMethod,
    branchTaxFees,
    splitPayments,
    addSplitPayment,
    removeSplitPayment,
    setCashGiven,
    cashGiven,
    changeAmount,
    orderSource,
    setOrderSource,
    aggregatorOrderId,
    setAggregatorOrderId,
    whatsappReceipt,
    setWhatsappReceipt,
    orderTiming,
    setOrderTiming,
    scheduledAt,
    setScheduledAt,
    orderNotes,
    setOrderNotes,
    selectedCustomer,
    selectedTable,
    setTable,
    placeOrder,
    placingOrder,
    skipLastDigits,
    setSkipLastDigits,
    editingOrderId,
    editingOrderNumber,
    updateOrder,
    updatingOrder,
  } = usePosStore();

  const [showOrderLater, setShowOrderLater] = useState(false);
  const [showPromo, setShowPromo] = useState(false);
  const [showCustomer, setShowCustomer] = useState(false);
  const [showTableModal, setShowTableModal] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [branchInfo, setBranchInfo] = useState<{ name: string; upiId: string }>({
    name: "Taste-It Restaurant",
    upiId: "tasteit@upi",
  });

  const submittingRef = useRef(false);

  // Split payment helper states
  const [nextSplitAmount, setNextSplitAmount] = useState<string>("");
  const [nextSplitMethod, setNextSplitMethod] = useState<"cash" | "upi" | "card">("cash");

  const splitTotal = splitPayments.reduce((s, p) => s + p.amount, 0);
  const splitRemaining = Math.max(0, total - splitTotal);

  useEffect(() => {
    if (splitPayments.length > 0 && splitRemaining > 0.01) {
      setNextSplitAmount(splitRemaining.toFixed(2));
    } else {
      setNextSplitAmount("");
    }
  }, [splitPayments.length, splitRemaining]);

  // Load branch name & UPI ID from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem("rms_branch");
      if (raw) {
        try {
          const b = JSON.parse(raw);
          const name = b.name || "Taste-It Restaurant";
          const upi =
            b.settings?.mainSettings?.upiId ||
            b.upiId ||
            `${name.toLowerCase().replace(/[^a-z0-9]/g, "")}@upi`;
          setBranchInfo({ name, upiId: upi });
        } catch (e) {}
      }
    }
  }, []);

  // Sync WhatsApp auto-dispatch default from preferences
  useEffect(() => {
    if (checkoutOpen && typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("rms_whatsapp_preferences");
        if (raw) {
          const p = JSON.parse(raw);
          if (typeof p.autoDispatch === "boolean") {
            setWhatsappReceipt(p.autoDispatch);
          }
        }
      } catch (e) {}
    }
  }, [checkoutOpen, setWhatsappReceipt]);

  // Prepopulate item notes if empty
  useEffect(() => {
    if (checkoutOpen) {
      const notesArray = cartItems
        .filter((item) => item.note && item.note.trim() !== "")
        .map((item) => {
          return cartItems.length === 1
            ? item.note
            : `${item.name}: ${item.note}`;
        });
      const itemNotes = notesArray.join(", ");
      if (itemNotes && !orderNotes) {
        setOrderNotes(itemNotes);
      }
    }
  }, [checkoutOpen, cartItems, orderNotes, setOrderNotes]);

  const isThirdParty = ["doordash", "skip", "ubereats", "zomato", "swiggy"].includes(
    orderSource,
  );

  // Dynamic UPI URI & QR Server Link
  const upiUri = `upi://pay?pa=${branchInfo.upiId}&pn=${encodeURIComponent(
    branchInfo.name,
  )}&am=${total.toFixed(2)}&cu=INR&tn=${encodeURIComponent(
    "Order " + (editingOrderNumber || "POS"),
  )}`;

  const upiQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(
    upiUri,
  )}`;

  const handleCopyUpi = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(branchInfo.upiId);
      setCopiedUpi(true);
      toast.success("UPI ID copied!");
      setTimeout(() => setCopiedUpi(false), 2000);
    }
  };

  const handleOrderTypeChange = (
    type: "takeout" | "delivery" | "dine-in",
  ) => {
    setOrderType(type);
    if (type === "delivery") {
      if (
        !selectedCustomer ||
        !selectedCustomer.name ||
        !selectedCustomer.name.trim() ||
        !selectedCustomer.phone ||
        !selectedCustomer.phone.trim() ||
        !selectedCustomer.address ||
        !selectedCustomer.address.trim()
      ) {
        setShowCustomer(true);
      }
    } else if (type === "dine-in" && !selectedTable) {
      setShowTableModal(true);
    }
  };

  const handleOrderTimingChange = (timing: "now" | "later") => {
    setOrderTiming(timing);
    if (timing === "later") {
      setShowOrderLater(true);
    } else {
      setScheduledAt(null);
    }
  };

  const handlePlaceOrder = async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;

    // Validate Dine-In Table
    if (orderType === "dine-in" && !selectedTable) {
      toast.error("Please assign a dining table for Dine-In order.");
      setShowTableModal(true);
      submittingRef.current = false;
      return;
    }

    // Validate Delivery Order Customer Info
    if (orderType === "delivery") {
      if (
        !selectedCustomer ||
        !selectedCustomer.name ||
        !selectedCustomer.name.trim() ||
        !selectedCustomer.phone ||
        !selectedCustomer.phone.trim() ||
        !selectedCustomer.address ||
        !selectedCustomer.address.trim()
      ) {
        toast.error(
          "Customer Name, Phone, and Delivery Address are required for Delivery orders.",
        );
        setShowCustomer(true);
        submittingRef.current = false;
        return;
      }
    }

    // Validate 3rd Party Aggregator Orders
    if (orderSource === "zomato" || orderSource === "swiggy") {
      if (!aggregatorOrderId || !aggregatorOrderId.trim()) {
        toast.error(`Please enter the ${orderSource.toUpperCase()} Order ID.`);
        submittingRef.current = false;
        return;
      }
    }

    if (orderSource === "skip") {
      if (!skipLastDigits || !/^\d{6}$/.test(skipLastDigits)) {
        toast.error("Please enter a valid 6 digit number for Skip.");
        submittingRef.current = false;
        return;
      }
    }

    if (paymentTiming === "pay-now") {
      if (paymentType === "split") {
        if (splitPayments.length < 2) {
          toast.error("Please enter at least 2 split payments.");
          submittingRef.current = false;
          return;
        }
        const sumOk = Math.abs(splitTotal - total) < 0.01;
        if (!sumOk) {
          toast.error(
            `Remaining split balance is ₹${splitRemaining.toFixed(
              2,
            )}. Please pay full amount.`,
          );
          submittingRef.current = false;
          return;
        }
      } else if (!isThirdParty) {
        if (paymentMethod === "cash" && cashGiven < total) {
          toast.error("Cash given is less than the total amount.");
          submittingRef.current = false;
          return;
        }
      }
    }

    if (orderTiming === "later" && !scheduledAt) {
      toast.error("Please confirm the pickup schedule.");
      submittingRef.current = false;
      return;
    }

    try {
      if (editingOrderId) {
        const updated = await updateOrder();
        if (updated) {
          toast.success(
            <div className="flex flex-col gap-0.5 text-left">
              <span className="font-700 text-[11px] text-green-900">
                {paymentTiming === "pay-now"
                  ? "Table Bill Settled & Paid! 🎉"
                  : "Order Updated & KOT Sent! 🍽️"}
              </span>
              <span className="text-[10px] text-green-800">
                {updated.orderNumber} • {updated.orderType.toUpperCase()}
                {selectedTable ? ` • Table ${selectedTable.name}` : ""}
              </span>
              <span className="font-600 text-[10px] text-green-950">
                {updated.paymentStatus === "paid"
                  ? `✓ Paid ₹${updated.total.toFixed(2)} (${(updated.paymentMethod || paymentMethod).toUpperCase()})`
                  : "⏳ Running Dine-In Table Bill"}
              </span>
              {whatsappReceipt && selectedCustomer?.phone && (
                <span className="text-[9px] text-emerald-800 flex items-center gap-1 mt-0.5">
                  📱 WhatsApp Bill queued for +91 {selectedCustomer.phone}
                </span>
              )}
            </div>,
          );
        }
      } else {
        const order = await placeOrder();
        if (order) {
          toast.success(
            <div className="flex flex-col gap-0.5 text-left">
              <span className="font-700 text-[11px] text-green-900">
                {orderType === "dine-in" && paymentTiming === "pay-later"
                  ? "KOT Sent to Kitchen! 🍽️"
                  : "Order Placed Successfully! 🎉"}
              </span>
              <span className="text-[10px] text-green-800">
                {order.orderNumber} • {order.orderType.toUpperCase()}
                {selectedTable ? ` • Table ${selectedTable.name}` : ""}
              </span>
              <span className="font-600 text-[10px] text-green-950">
                {order.paymentStatus === "unpaid"
                  ? "⏳ Table Bill / Pay Later"
                  : `✓ Paid ₹${order.total.toFixed(2)} (${order.paymentMethod?.toUpperCase()})`}
              </span>
              {whatsappReceipt && selectedCustomer?.phone && (
                <span className="text-[9px] text-emerald-800 flex items-center gap-1 mt-0.5">
                  📱 WhatsApp Bill queued for +91 {selectedCustomer.phone}
                </span>
              )}
            </div>,
          );
        }
      }
    } finally {
      submittingRef.current = false;
    }
  };

  if (!checkoutOpen) return null;

  const discountLabel = appliedPromo
    ? `${appliedPromo.code} (-₹${appliedPromo.discountAmount.toFixed(2)})`
    : manualDiscountType === "percentage"
      ? `${manualDiscountValue}% off (-₹${discount.toFixed(2)})`
      : manualDiscountType === "flat"
        ? `-₹${discount.toFixed(2)}`
        : null;

  const formatScheduled = (iso: string | null) => {
    if (!iso) return "";
    const d = new Date(iso);
    return (
      d.toLocaleDateString("en-IN", {
        weekday: "short",
        month: "short",
        day: "numeric",
      }) +
      ", " +
      d.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    );
  };

  const gstRate = branchTaxFees?.gstTaxRate ?? 5;
  const halfGstRate = (gstRate / 2).toFixed(1);
  const halfTaxAmount = (tax / 2).toFixed(2);
  const quickTenders = getQuickTenderAmounts(total);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-[2px] flex items-center justify-center p-3">
        {/* Modal Window */}
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-scale-up">
          {/* ── Header ── */}
          <div
            className={`${
              editingOrderId && paymentTiming === "pay-now"
                ? "bg-emerald-600"
                : editingOrderId
                ? "bg-amber-600"
                : "bg-brand-primary"
            } px-5 py-3 flex items-center gap-3 flex-shrink-0 transition-colors`}
          >
            <h2 className="text-[14px] font-900 text-white uppercase tracking-widest flex items-center gap-2">
              {editingOrderId && paymentTiming === "pay-now"
                ? `Settle Order ${editingOrderNumber}`
                : editingOrderId
                ? `Update Order ${editingOrderNumber}`
                : "Checkout & Order"}
            </h2>

            {/* Order type pills */}
            <div className="flex items-center gap-1.5 ml-2">
              {(isThirdParty
                ? (["takeout", "delivery"] as const)
                : (["takeout", "delivery", "dine-in"] as const)
              ).map((t) => {
                const entry = ORDER_TYPE_LABELS[t];
                if (!entry) return null;
                const { label, icon } = entry;
                return (
                  <button
                    key={t}
                    onClick={() => handleOrderTypeChange(t)}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-800 uppercase tracking-wide transition-all cursor-pointer flex items-center gap-1.5 ${
                      orderType === t
                        ? "bg-white text-brand-primary shadow-sm"
                        : "bg-white/20 text-white hover:bg-white/30"
                    }`}
                  >
                    {icon}
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Dine-In Table Badge in Header */}
            {orderType === "dine-in" && (
              <button
                type="button"
                onClick={() => setShowTableModal(true)}
                className={`ml-2 px-3 py-1 rounded-full text-[11px] font-800 uppercase tracking-wide flex items-center gap-1.5 transition-all cursor-pointer ${
                  selectedTable
                    ? "bg-amber-400 text-neutral-900 shadow-sm"
                    : "bg-white/30 text-white animate-pulse"
                }`}
                title="Click to assign or change table"
              >
                <TableProperties size={12} />
                {selectedTable ? selectedTable.name : "+ Select Table"}
              </button>
            )}

            <button
              onClick={closeCheckout}
              className="ml-auto flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white px-3.5 py-1.5 rounded-full text-[11px] font-900 uppercase transition-all cursor-pointer"
            >
              <X size={13} strokeWidth={2.5} /> Close
            </button>
          </div>

          {/* ── Body ── */}
          <div className="flex flex-1 overflow-hidden min-h-0">
            {/* ══ LEFT COLUMN — Payment Panel ══ */}
            <div className="w-1/2 border-r border-neutral-100 flex flex-col overflow-hidden bg-neutral-50/30">
              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
                {/* Pay Now / Pay Later Switcher */}
                {!isThirdParty && (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setPaymentTiming("pay-now")}
                      className={`py-2.5 rounded-xl text-[11px] font-700 uppercase tracking-wide transition-all cursor-pointer active:scale-[0.98] ${
                        paymentTiming === "pay-now"
                          ? "bg-brand-primary text-white shadow-sm"
                          : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
                      }`}
                    >
                      Pay Now
                    </button>
                    <button
                      onClick={() => setPaymentTiming("pay-later")}
                      className={`py-2.5 rounded-xl text-[11px] font-700 uppercase tracking-wide transition-all cursor-pointer active:scale-[0.98] ${
                        paymentTiming === "pay-later"
                          ? "bg-brand-primary text-white shadow-sm"
                          : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
                      }`}
                    >
                      {orderType === "dine-in"
                        ? "Pay Later (KOT First)"
                        : "Pay Later"}
                    </button>
                  </div>
                )}

                {/* One Time / Split Payment */}
                {paymentTiming === "pay-now" && !isThirdParty && (
                  <div className="grid grid-cols-2 gap-2">
                    {(["one-time", "split"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setPaymentType(t)}
                        className={`py-2 rounded-xl text-[10.5px] font-700 uppercase tracking-wide transition-all cursor-pointer active:scale-[0.98] ${
                          paymentType === t
                            ? "bg-neutral-800 text-white shadow-sm"
                            : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
                        }`}
                      >
                        {t === "one-time" ? "Single Payment" : "Split Payment"}
                      </button>
                    ))}
                  </div>
                )}

                {/* Pay Later Information Card */}
                {paymentTiming === "pay-later" && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-amber-600" />
                      <p className="text-[12px] font-800 text-amber-900">
                        {orderType === "dine-in"
                          ? "Dine-In Table Post-Paid Mode"
                          : "Payment Pending"}
                      </p>
                    </div>
                    <p className="text-[10.5px] text-amber-800 leading-relaxed">
                      {orderType === "dine-in"
                        ? `Order will punch KOT for ${
                            selectedTable?.name || "the assigned table"
                          } directly to the kitchen. Bill can be paid when table finishes dining.`
                        : "Order will be placed as UNPAID. Customer can pay during pickup or parcel delivery."}
                    </p>
                  </div>
                )}

                {/* ── ONE TIME PAYMENT CONTENT ── */}
                {paymentTiming === "pay-now" &&
                  paymentType === "one-time" &&
                  !isThirdParty && (
                    <>
                      {/* Amount To Pay */}
                      <div className="flex items-center justify-between border border-neutral-200 rounded-xl px-4 py-3 bg-brand-primary/5">
                        <span className="text-[11px] font-700 text-neutral-600 uppercase tracking-wide">
                          Total Amount To Pay
                        </span>
                        <span className="text-[18px] font-900 text-brand-primary">
                          ₹{total.toFixed(2)}
                        </span>
                      </div>

                      {/* Payment Method Selector (Cash / UPI / Card) */}
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => setPaymentMethod("cash")}
                          className={`py-2.5 rounded-xl text-[11px] font-700 uppercase tracking-wide transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98] ${
                            paymentMethod === "cash"
                              ? "bg-brand-primary text-white shadow-sm"
                              : "bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-100"
                          }`}
                        >
                          <Banknote size={14} /> Cash
                        </button>
                        <button
                          onClick={() => setPaymentMethod("upi")}
                          className={`py-2.5 rounded-xl text-[11px] font-700 uppercase tracking-wide transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98] ${
                            paymentMethod === "upi"
                              ? "bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/20"
                              : "bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-100"
                          }`}
                        >
                          <QrCode size={14} /> UPI / QR
                        </button>
                        <button
                          onClick={() => setPaymentMethod("card")}
                          className={`py-2.5 rounded-xl text-[11px] font-700 uppercase tracking-wide transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98] ${
                            paymentMethod === "card"
                              ? "bg-neutral-800 text-white shadow-sm"
                              : "bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-100"
                          }`}
                        >
                          <CreditCard size={14} /> Card
                        </button>
                      </div>

                      {/* ══ DYNAMIC UPI PAYMENT PANEL ══ */}
                      {paymentMethod === "upi" && (
                        <div className="bg-white border border-emerald-200 rounded-xl p-3.5 space-y-3 shadow-xs">
                          {/* QR Code and Scan Info */}
                          <div className="flex items-center gap-3">
                            <div className="w-28 h-28 bg-white p-1 rounded-xl border border-emerald-200 flex-shrink-0 flex items-center justify-center shadow-xs">
                              <img
                                src={upiQrUrl}
                                alt="UPI Dynamic QR"
                                className="w-full h-full object-contain rounded-lg"
                              />
                            </div>
                            <div className="flex-1 space-y-1.5">
                              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-800 uppercase tracking-wide">
                                <QrCode size={10} /> Dynamic UPI QR
                              </div>
                              <p className="text-[14px] font-900 text-emerald-950">
                                Scan & Pay ₹{total.toFixed(2)}
                              </p>
                              <div className="flex items-center gap-1 text-[10.5px] text-neutral-600 font-mono bg-neutral-100 px-2 py-1 rounded-md">
                                <span className="truncate">{branchInfo.upiId}</span>
                                <button
                                  type="button"
                                  onClick={handleCopyUpi}
                                  className="ml-auto text-neutral-500 hover:text-emerald-700 cursor-pointer p-0.5"
                                  title="Copy UPI VPA"
                                >
                                  {copiedUpi ? (
                                    <Check size={11} className="text-emerald-600" />
                                  ) : (
                                    <Copy size={11} />
                                  )}
                                </button>
                              </div>
                              <p className="text-[9px] text-neutral-400">
                                Works with Google Pay, PhonePe, Paytm, BHIM & all UPI apps
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* ══ CASH PAYMENT PANEL ══ */}
                      {paymentMethod === "cash" && (
                        <div className="space-y-3">
                          {/* Quick Cash Tender Notes (One-Tap Selection) */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <label className="text-[10.5px] font-700 text-neutral-700 uppercase tracking-wide">
                                Quick Tender (One-Tap Note)
                              </label>
                              <span className="text-[9.5px] text-neutral-400">
                                Tap note received from customer
                              </span>
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                              {quickTenders.map((amt) => {
                                const isExact = Math.abs(amt - total) < 0.01;
                                const isCurrent = Math.abs(cashGiven - amt) < 0.01;
                                return (
                                  <button
                                    key={amt}
                                    type="button"
                                    onClick={() => setCashGiven(amt)}
                                    className={`py-2.5 px-1.5 rounded-xl text-[12px] font-800 transition-all cursor-pointer flex flex-col items-center justify-center border active:scale-95 ${
                                      isCurrent
                                        ? "bg-brand-primary text-white border-brand-primary shadow-sm"
                                        : "bg-white border-neutral-200 text-neutral-800 hover:bg-neutral-50 hover:border-brand-primary/40"
                                    }`}
                                  >
                                    <span>₹{amt}</span>
                                    {isExact && (
                                      <span
                                        className={`text-[8.5px] uppercase tracking-tighter ${
                                          isCurrent ? "text-white/80" : "text-brand-primary font-bold"
                                        }`}
                                      >
                                        Exact
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Custom Amount Input */}
                          <div>
                            <label className="block text-[10.5px] font-700 text-neutral-600 mb-1.5 uppercase tracking-wide">
                              Or Enter Cash Amount Given
                            </label>
                            <div className="relative">
                              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[13px] font-700 text-neutral-400">
                                ₹
                              </span>
                              <input
                                type="number"
                                placeholder="0.00"
                                min="0"
                                step="1"
                                value={cashGiven > 0 ? cashGiven : ""}
                                onChange={(e) =>
                                  setCashGiven(parseFloat(e.target.value) || 0)
                                }
                                className="w-full border border-neutral-200 rounded-xl pl-8 pr-4 py-2.5 text-[13px] font-700 text-neutral-800 bg-white focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 transition-all"
                              />
                            </div>
                          </div>

                          {/* Cash Given & Return Change Breakdown */}
                          {cashGiven > 0 && (
                            <div className="bg-white border border-neutral-200 rounded-xl p-3.5 space-y-2 shadow-xs">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] text-neutral-500 font-500">
                                  Cash Given:
                                </span>
                                <span className="text-[13px] font-800 text-neutral-800">
                                  ₹{cashGiven.toFixed(2)}
                                </span>
                              </div>
                              <div className="flex items-center justify-between pt-1.5 border-t border-neutral-100">
                                <span className="text-[11.5px] text-neutral-700 font-700">
                                  Change Due / Wapas:
                                </span>
                                <span
                                  className={`text-[15px] font-900 ${
                                    changeAmount >= 0
                                      ? "text-emerald-600"
                                      : "text-rose-600"
                                  }`}
                                >
                                  ₹{changeAmount.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* ══ CARD PAYMENT PANEL ══ */}
                      {paymentMethod === "card" && (
                        <div className="bg-white border border-neutral-200 rounded-xl p-4 flex flex-col items-center text-center gap-2">
                          <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-700">
                            <CreditCard size={22} />
                          </div>
                          <div>
                            <p className="text-[12px] font-800 text-neutral-900">
                              POS Card Machine Ready
                            </p>
                            <p className="text-[10.5px] text-neutral-500 mt-0.5">
                              Swipe, Tap, or Insert card on POS EDC machine for ₹
                              {total.toFixed(2)}.
                            </p>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                {/* ══ ACCOUNT PAY (3rd Party Aggregators: Zomato, Swiggy, etc.) ══ */}
                {paymentTiming === "pay-now" &&
                  paymentType === "one-time" &&
                  isThirdParty && (
                    <div className="space-y-3">
                      <div className="border border-neutral-200 rounded-xl px-4 py-3 bg-brand-primary/5 flex items-center justify-between">
                        <span className="text-[11px] font-700 text-neutral-600 uppercase">
                          Aggregator Bill Amount
                        </span>
                        <span className="text-[18px] font-900 text-brand-primary">
                          ₹{total.toFixed(2)}
                        </span>
                      </div>

                      <div className="bg-white border border-emerald-200 rounded-xl p-3.5 flex items-start gap-2.5">
                        <CheckCircle
                          size={18}
                          className="text-emerald-600 flex-shrink-0 mt-0.5"
                        />
                        <div>
                          <p className="text-[11.5px] font-800 text-emerald-950">
                            Account Pay (Direct Partner Settlement)
                          </p>
                          <p className="text-[10px] text-emerald-800 mt-0.5 leading-relaxed">
                            Order placed via{" "}
                            <span className="font-bold uppercase">
                              {orderSource}
                            </span>
                            . Payment will be settled via weekly aggregator account payout.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                {/* ══ SPLIT PAYMENT ══ */}
                {paymentTiming === "pay-now" && paymentType === "split" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                      <p className="text-[11px] font-700 text-neutral-700 uppercase tracking-wide">
                        Split Payments
                      </p>
                      <span
                        className={`text-[11px] font-800 ${
                          splitRemaining < 0.01
                            ? "text-green-600"
                            : "text-brand-primary"
                        }`}
                      >
                        Paid: ₹{splitTotal.toFixed(2)} / ₹{total.toFixed(2)}
                      </span>
                    </div>

                    {/* Processed Splits */}
                    {splitPayments.length > 0 && (
                      <div className="space-y-1.5">
                        {splitPayments.map((sp, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between bg-white border border-neutral-200 rounded-xl px-3 py-2"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-800 text-neutral-500">
                                #{i + 1}
                              </span>
                              <span className="text-[11px] font-700 text-neutral-800">
                                ₹{sp.amount.toFixed(2)}
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-700 uppercase bg-neutral-100 text-neutral-700">
                                {sp.method}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeSplitPayment(i)}
                              className="text-red-400 hover:text-red-600 transition-colors cursor-pointer p-0.5 hover:bg-neutral-100 rounded-md"
                              title="Remove Payment"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Next Split Input */}
                    {splitRemaining > 0.01 ? (
                      <div className="bg-white border border-dashed border-neutral-300 rounded-xl p-3 space-y-2.5">
                        <p className="text-[10px] font-700 text-neutral-700 uppercase tracking-wide">
                          Pay Next Split (Remaining: ₹{splitRemaining.toFixed(2)})
                        </p>

                        <div className="space-y-1">
                          <label className="block text-[9px] font-600 text-neutral-500 uppercase tracking-wide">
                            Amount (₹)
                          </label>
                          <input
                            type="number"
                            placeholder="Enter split amount"
                            min="0.01"
                            max={splitRemaining}
                            step="0.01"
                            value={nextSplitAmount}
                            onChange={(e) => setNextSplitAmount(e.target.value)}
                            className="w-full border border-neutral-200 rounded-lg px-3 py-1.5 text-[11px] font-bold text-neutral-800 bg-neutral-50 focus:outline-none focus:border-brand-primary focus:bg-white"
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-1.5">
                          {(["cash", "upi", "card"] as const).map((m) => (
                            <button
                              key={m}
                              type="button"
                              onClick={() => setNextSplitMethod(m)}
                              className={`py-1.5 rounded-lg text-[10px] font-700 uppercase transition-all cursor-pointer border ${
                                nextSplitMethod === m
                                  ? "bg-brand-primary border-brand-primary text-white shadow-xs"
                                  : "bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                              }`}
                            >
                              {m}
                            </button>
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const amt = parseFloat(nextSplitAmount);
                            if (isNaN(amt) || amt <= 0) {
                              toast.error("Please enter a valid amount.");
                              return;
                            }
                            if (amt > splitRemaining + 0.01) {
                              toast.error(
                                `Amount cannot exceed remaining balance of ₹${splitRemaining.toFixed(
                                  2,
                                )}`,
                              );
                              return;
                            }
                            addSplitPayment({
                              method: nextSplitMethod,
                              amount: amt,
                            });
                          }}
                          className="w-full py-2 bg-neutral-800 hover:bg-neutral-900 text-white rounded-lg text-[10.5px] font-700 uppercase transition-all cursor-pointer shadow-xs"
                        >
                          Add ₹{parseFloat(nextSplitAmount || "0").toFixed(2)} (
                          {nextSplitMethod.toUpperCase()})
                        </button>
                      </div>
                    ) : (
                      <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
                        <p className="text-[11px] font-800 text-green-700">
                          ✓ All splits fully paid!
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ── Fixed Bottom CTA Button ── */}
              <div className="flex-shrink-0 p-4 pt-3 border-t border-neutral-100 bg-white">
                <button
                  onClick={handlePlaceOrder}
                  disabled={
                    placingOrder ||
                    updatingOrder ||
                    cartItems.length === 0 ||
                    (paymentTiming === "pay-now" &&
                      paymentType === "split" &&
                      splitRemaining > 0.01)
                  }
                  className={`w-full py-3 rounded-xl text-[13px] font-800 uppercase tracking-wide transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-sm ${
                    placingOrder ||
                    updatingOrder ||
                    cartItems.length === 0 ||
                    (paymentTiming === "pay-now" &&
                      paymentType === "split" &&
                      splitRemaining > 0.01)
                      ? "bg-neutral-200 text-neutral-400 cursor-not-allowed shadow-none"
                      : editingOrderId && paymentTiming === "pay-now"
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-emerald-600/20"
                        : editingOrderId
                          ? "bg-amber-600 hover:bg-amber-700 text-white cursor-pointer shadow-amber-600/20"
                          : orderType === "dine-in" && paymentTiming === "pay-later"
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-emerald-600/20"
                            : "bg-brand-primary hover:bg-brand-primary-hover text-white cursor-pointer shadow-brand-primary/20"
                  }`}
                >
                  {placingOrder || updatingOrder ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />{" "}
                      {editingOrderId ? (paymentTiming === "pay-now" ? "Settling Bill..." : "Updating Order...") : "Placing Order..."}
                    </>
                  ) : paymentTiming === "pay-now" &&
                    paymentType === "split" &&
                    splitRemaining > 0.01 ? (
                    <>Remaining balance: ₹{splitRemaining.toFixed(2)}</>
                  ) : editingOrderId && paymentTiming === "pay-now" ? (
                    <>
                      💰 Pay & Settle Bill ₹{total.toFixed(2)}
                    </>
                  ) : editingOrderId && paymentTiming === "pay-later" ? (
                    <>
                      🍽️ Update Order & Fire KOT (₹{total.toFixed(2)})
                    </>
                  ) : orderType === "dine-in" && paymentTiming === "pay-later" ? (
                    <>
                      🍽️ Punch KOT & Open Table{" "}
                      {selectedTable ? `(${selectedTable.name})` : ""}
                    </>
                  ) : paymentTiming === "pay-later" ? (
                    <>{editingOrderId ? "Update Order (Pay Later)" : "Place Order (Pay Later)"}</>
                  ) : (
                    <>
                      {editingOrderId
                        ? `Update Order ₹${total.toFixed(2)}`
                        : `Place Order ₹${total.toFixed(2)}`}
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* ══ RIGHT COLUMN — Order Details Panel ══ */}
            <div className="w-1/2 flex flex-col overflow-y-auto p-4 space-y-3 no-scrollbar bg-white">
              {/* Order Now / Order Later */}
              <div className="grid grid-cols-2 gap-2">
                {(["now", "later"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => handleOrderTimingChange(t)}
                    className={`py-2 rounded-xl text-[11px] font-700 uppercase tracking-wide transition-all cursor-pointer active:scale-[0.98] ${
                      orderTiming === t
                        ? "bg-brand-primary text-white shadow-sm"
                        : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
                    }`}
                  >
                    {t === "now" ? "Order Now" : "Order Later"}
                  </button>
                ))}
              </div>

              {/* Scheduled time preview */}
              {orderTiming === "later" && scheduledAt && (
                <div className="bg-orange-50 border border-orange-100 rounded-xl p-2.5 flex items-center gap-2">
                  <Clock size={13} className="text-brand-primary flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-[10px] font-600 text-brand-primary">
                      Scheduled Pickup
                    </p>
                    <p className="text-[11px] font-700 text-neutral-800">
                      {formatScheduled(scheduledAt)}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowOrderLater(true)}
                    className="text-[9px] font-600 text-brand-primary hover:underline cursor-pointer"
                  >
                    Change
                  </button>
                </div>
              )}

              {/* ── Order Source (Counter & Aggregators: POS, Zomato, Swiggy, Online) ── */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-700 text-neutral-500 uppercase tracking-wide">
                  Order Source
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { id: "pos" as const, label: "POS Counter" },
                    { id: "zomato" as const, label: "Zomato", color: "text-rose-600" },
                    { id: "swiggy" as const, label: "Swiggy", color: "text-amber-600" },
                    { id: "online" as const, label: "Direct Online" },
                  ].map((src) => {
                    const active = orderSource === src.id;
                    return (
                      <button
                        key={src.id}
                        type="button"
                        onClick={() => {
                          setOrderSource(src.id);
                          if (src.id === "zomato" || src.id === "swiggy") {
                            if (orderType === "dine-in") setOrderType("takeout");
                          }
                        }}
                        className={`py-2 px-1 rounded-xl text-[10.5px] font-700 uppercase tracking-tight transition-all cursor-pointer border ${
                          active
                            ? src.id === "zomato"
                              ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                              : src.id === "swiggy"
                                ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                                : "bg-neutral-800 text-white border-neutral-800 shadow-sm"
                            : "bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100"
                        }`}
                      >
                        {src.label}
                      </button>
                    );
                  })}
                </div>

                {/* Aggregator Order ID Field */}
                {(orderSource === "zomato" || orderSource === "swiggy") && (
                  <div className="space-y-1 mt-1 p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl">
                    <label className="block text-[10px] font-700 text-neutral-600 uppercase tracking-wide">
                      {orderSource.toUpperCase()} Order ID
                    </label>
                    <input
                      type="text"
                      placeholder={`Enter ${orderSource.toUpperCase()} ID (e.g. ${
                        orderSource === "zomato" ? "ZOM-4819" : "SWG-8092"
                      })`}
                      value={aggregatorOrderId}
                      onChange={(e) => setAggregatorOrderId(e.target.value)}
                      className="w-full border border-neutral-200 rounded-lg px-3 py-1.5 text-[11px] font-mono text-neutral-800 bg-white focus:outline-none focus:border-brand-primary"
                    />
                  </div>
                )}
              </div>

              {/* ── Dine-In Table Linking Banner (When Dine-In Active) ── */}
              {orderType === "dine-in" && (
                <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-brand-primary text-white flex items-center justify-center font-bold text-sm shadow-xs">
                      🍽️
                    </div>
                    <div>
                      <p className="text-[9.5px] font-700 text-neutral-500 uppercase tracking-wide">
                        Assigned Table
                      </p>
                      <p className="text-[12px] font-800 text-neutral-900">
                        {selectedTable ? selectedTable.name : "No Table Selected"}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowTableModal(true)}
                    className="px-3 py-1.5 rounded-lg bg-white border border-brand-primary text-brand-primary text-[10.5px] font-700 hover:bg-brand-primary hover:text-white transition-all cursor-pointer shadow-xs"
                  >
                    {selectedTable ? "Change Table" : "+ Choose Table"}
                  </button>
                </div>
              )}

              {/* Order Notes */}
              <div>
                <label className="block text-[10px] font-600 text-neutral-500 mb-1 uppercase tracking-wide flex items-center gap-1">
                  <FileText size={10} /> Cooking Notes / Instructions
                </label>
                <textarea
                  placeholder="e.g. Less spicy, extra sauce, without onion..."
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  rows={2}
                  className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-[11px] font-500 text-neutral-700 bg-neutral-50 focus:outline-none focus:border-brand-primary focus:bg-white resize-none transition-all"
                />
              </div>

              {/* Customer Info (Mobile First) & WhatsApp Toggle */}
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCustomer(true)}
                    className={`py-2 rounded-xl text-[11px] font-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                      selectedCustomer
                        ? "bg-orange-50 border-brand-primary text-brand-primary"
                        : "bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50"
                    }`}
                  >
                    <Smartphone size={13} />
                    <span className="truncate">
                      {selectedCustomer
                        ? `${selectedCustomer.name} (${selectedCustomer.phone || ""})`
                        : "+ Add Mobile / Customer"}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowPromo(true)}
                    className={`py-2 rounded-xl text-[11px] font-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                      discountLabel
                        ? "bg-green-50 border-green-500 text-green-700"
                        : "bg-neutral-800 text-white hover:bg-neutral-700 border-neutral-800"
                    }`}
                  >
                    <Tag size={13} />
                    <span className="truncate">
                      {discountLabel ? discountLabel : "Add Promo / Discount"}
                    </span>
                  </button>
                </div>

                {/* WhatsApp Digital Bill Option */}
                <label className="flex items-center justify-between p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl cursor-pointer hover:bg-emerald-50 transition-colors">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                      W
                    </div>
                    <div className="text-left">
                      <p className="text-[10.5px] font-700 text-emerald-950">
                        Send Bill on WhatsApp
                      </p>
                      <p className="text-[9px] text-emerald-700">
                        {selectedCustomer?.phone
                          ? `Will send receipt to +91 ${selectedCustomer.phone}`
                          : "Customer mobile number required"}
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={whatsappReceipt}
                    onChange={(e) => setWhatsappReceipt(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded border-neutral-300 focus:ring-emerald-500 cursor-pointer"
                  />
                </label>
              </div>

              {/* ── Order Summary with Indian GST Split ── */}
              <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3.5 space-y-1.5">
                <p className="text-[11px] font-800 text-neutral-800 uppercase tracking-wide text-center pb-1 border-b border-neutral-200">
                  Order Summary
                </p>

                {/* Items count & Subtotal */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-neutral-500 font-500">
                    Items ({cartItems.length})
                  </span>
                  <span className="text-[10px] font-600 text-neutral-700">
                    ₹{subtotal.toFixed(2)}
                  </span>
                </div>

                {/* Discount */}
                {discount > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-green-600 font-500 flex items-center gap-1">
                      <CheckCircle size={9} /> Discount
                    </span>
                    <span className="text-[10px] font-700 text-green-600">
                      -₹{discount.toFixed(2)}
                    </span>
                  </div>
                )}

                {/* Delivery fee */}
                {orderType === "delivery" && (
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-brand-primary font-600 flex items-center gap-1">
                      <Truck size={10} /> Delivery Fee
                    </span>
                    <span className="text-[10px] font-700 text-brand-primary">
                      +₹{(branchTaxFees?.deliveryFee ?? 40).toFixed(2)}
                    </span>
                  </div>
                )}

                {/* Indian GST Split: CGST + SGST */}
                <div className="space-y-1 py-1 border-t border-b border-neutral-200 my-1">
                  <div className="flex items-center justify-between text-[10px] text-neutral-500">
                    <span>CGST ({halfGstRate}%)</span>
                    <span className="font-600 text-neutral-700">
                      ₹{halfTaxAmount}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-neutral-500">
                    <span>SGST ({halfGstRate}%)</span>
                    <span className="font-600 text-neutral-700">
                      ₹{halfTaxAmount}
                    </span>
                  </div>
                </div>

                {/* Total */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11.5px] font-800 text-neutral-900">
                    Total Amount
                  </span>
                  <span className="text-[16px] font-900 text-brand-primary">
                    ₹{total.toFixed(2)}
                  </span>
                </div>

                {paymentTiming === "pay-later" && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1 flex items-center gap-1.5 mt-1">
                    <Clock size={10} className="text-amber-600" />
                    <span className="text-[9.5px] font-600 text-amber-700">
                      {orderType === "dine-in"
                        ? "Dine-in KOT mode: marked UNPAID until table settlement"
                        : "Will be marked UNPAID until pickup"}
                    </span>
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={closeCheckout}
                  className="text-[10.5px] font-600 text-red-500 hover:text-red-700 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <X size={11} /> Cancel Order
                </button>
                <div className="text-[9.5px] text-neutral-400 font-500">
                  Taste-It POS Terminal
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-modals */}
      <OrderLaterModal
        isOpen={showOrderLater}
        onClose={() => setShowOrderLater(false)}
        onConfirm={(iso) => {
          setScheduledAt(iso);
          setOrderTiming("later");
        }}
      />
      <PromoDiscountModal
        isOpen={showPromo}
        onClose={() => setShowPromo(false)}
      />
      <CustomerModal
        isOpen={showCustomer}
        onClose={() => setShowCustomer(false)}
      />
      <TableSelectorModal
        isOpen={showTableModal}
        onClose={() => setShowTableModal(false)}
      />
    </>
  );
}
