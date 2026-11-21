"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  MessageSquare,
  QrCode,
  CheckCircle2,
  RefreshCw,
  Send,
  Smartphone,
  Trash2,
  ShieldCheck,
  Sparkles,
  CheckCheck,
  Sliders,
  HelpCircle,
  PhoneCall,
  Store,
  ChevronRight,
  ExternalLink,
} from "lucide-react";

interface WhatsAppStatus {
  connected: boolean;
  status: "disconnected" | "connecting" | "qr_ready" | "connected";
  phone: string | null;
  qrCode: string | null;
}

export default function WhatsAppGatewayTab() {
  const [data, setData] = useState<WhatsAppStatus>({
    connected: false,
    status: "disconnected",
    phone: null,
    qrCode: null,
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [testPhone, setTestPhone] = useState("");
  const [sendingTest, setSendingTest] = useState(false);

  // Dynamic registered restaurant brand info
  const [restaurantName, setRestaurantName] = useState("Restaurant POS");
  const [restaurantLogo, setRestaurantLogo] = useState<string | null>(null);

  // Preference switches
  const [autoSendOnOrder, setAutoSendOnOrder] = useState(true);
  const [includeGstSplit, setIncludeGstSplit] = useState(true);
  const [includeReviewLink, setIncludeReviewLink] = useState(true);

  // Load preferences from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("rms_whatsapp_preferences");
        if (raw) {
          const p = JSON.parse(raw);
          if (typeof p.autoDispatch === "boolean") setAutoSendOnOrder(p.autoDispatch);
          if (typeof p.includeGstSplit === "boolean") setIncludeGstSplit(p.includeGstSplit);
          if (typeof p.includeGreeting === "boolean") setIncludeReviewLink(p.includeGreeting);
        }
      } catch (e) {}
    }
  }, []);

  const updatePreference = (
    key: "autoDispatch" | "includeGstSplit" | "includeGreeting",
    val: boolean
  ) => {
    let nextAuto = autoSendOnOrder;
    let nextGst = includeGstSplit;
    let nextGreet = includeReviewLink;

    if (key === "autoDispatch") {
      nextAuto = val;
      setAutoSendOnOrder(val);
    } else if (key === "includeGstSplit") {
      nextGst = val;
      setIncludeGstSplit(val);
    } else if (key === "includeGreeting") {
      nextGreet = val;
      setIncludeReviewLink(val);
    }

    if (typeof window !== "undefined") {
      localStorage.setItem(
        "rms_whatsapp_preferences",
        JSON.stringify({
          autoDispatch: nextAuto,
          includeGstSplit: nextGst,
          includeGreeting: nextGreet,
        })
      );
      window.dispatchEvent(new Event("rms_whatsapp_preferences_updated"));
      toast.success("Rule preferences updated & saved", {
        id: "wa-pref",
        duration: 1500,
      });
    }
  };

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

  // Load registered restaurant name & logo
  useEffect(() => {
    const loadBranch = () => {
      if (typeof window !== "undefined") {
        const raw = localStorage.getItem("rms_branch");
        if (raw) {
          try {
            const b = JSON.parse(raw);
            const name = b.name || "Restaurant POS";
            setRestaurantName(name);
            const logo = b.logo || b.settings?.mainSettings?.logo || null;
            setRestaurantLogo(logo);
          } catch (e) {}
        }
      }
    };

    loadBranch();
    window.addEventListener("rms_branch_updated", loadBranch);
    window.addEventListener("storage", loadBranch);
    return () => {
      window.removeEventListener("rms_branch_updated", loadBranch);
      window.removeEventListener("storage", loadBranch);
    };
  }, []);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await axios.get(`${apiUrl}/whatsapp/status`);
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (err) {
      // Backend offline or restarting
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    fetchStatus();

    // Poll status when awaiting QR code scan
    pollIntervalRef.current = setInterval(() => {
      fetchStatus();
    }, 3000);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [fetchStatus]);

  const handleConnect = async () => {
    setActionLoading(true);
    try {
      const res = await axios.post(`${apiUrl}/whatsapp/connect`);
      if (res.data?.success) {
        setData(res.data.data);
        toast.success("Initializing device link... Scan code ready.");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to start WhatsApp gateway.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to unlink this WhatsApp account from the restaurant POS?")) return;
    setActionLoading(true);
    try {
      const res = await axios.post(`${apiUrl}/whatsapp/disconnect`);
      if (res.data?.success) {
        setData(res.data.data);
        toast.success("WhatsApp account unlinked successfully.");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to unlink account.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhone || testPhone.trim().length < 10) {
      toast.error("Please enter a valid 10-digit mobile number.");
      return;
    }

    setSendingTest(true);
    try {
      const res = await axios.post(`${apiUrl}/whatsapp/test-message`, {
        phone: testPhone,
        branchName: restaurantName,
        preferences: {
          includeGstSplit,
          includeGreeting: includeReviewLink,
        },
      });
      if (res.data?.success) {
        toast.success(`Sample invoice dispatched to +${res.data.data?.phone}!`);
        setTestPhone("");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to send sample receipt.");
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <div className="w-full space-y-6 font-sans">
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-neutral-100">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
              <MessageSquare size={19} />
            </div>
            <div>
              <h2 className="text-[18px] font-900 text-neutral-900 tracking-tight flex items-center gap-2">
                WhatsApp E-Billing & Digital Receipts
              </h2>
              <p className="text-[12px] text-neutral-500 mt-0.5">
                Automated guest receipt delivery, GST invoices, and real-time order notifications.
              </p>
            </div>
          </div>
        </div>

        {/* Live Channel Status Pill */}
        <div className="flex items-center gap-3">
          {data.connected ? (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-800 tracking-wide">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>ACTIVE • +{data.phone}</span>
            </div>
          ) : data.status === "qr_ready" ? (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-800 tracking-wide">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
              <span>AWAITING QR SCAN</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-100 text-neutral-600 border border-neutral-200 text-[11px] font-700 tracking-wide">
              <span className="w-2.5 h-2.5 rounded-full bg-neutral-400" />
              <span>SERVICE INACTIVE</span>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-9 h-9 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : data.connected ? (
        /* ══ STATE 1: CONNECTED & OPERATIONAL ══ */
        <div className="w-full space-y-6">
          {/* Active Channel Overview Banner (Full Width) */}
          <div className="w-full bg-gradient-to-r from-emerald-50/90 via-white to-emerald-50/40 border border-emerald-200 rounded-2xl p-5 shadow-xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md flex-shrink-0">
                  <ShieldCheck size={28} />
                </div>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="text-[15.5px] font-900 text-neutral-900">
                      WhatsApp Invoicing Gateway Active
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-800 uppercase tracking-wider">
                      Verified Outlet Device
                    </span>
                  </div>
                  <p className="text-[12px] text-neutral-600 mt-1">
                    Linked Phone Number:{" "}
                    <span className="font-mono font-bold text-emerald-950 text-[13.5px]">
                      +{data.phone}
                    </span>
                    <span className="mx-2 text-neutral-300">•</span>
                    <span>Channel: End-to-End Encrypted</span>
                  </p>
                  <p className="text-[11.5px] text-neutral-500 mt-1 flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-emerald-600 flex-shrink-0" />
                    Orders placed with WhatsApp receipt enabled will automatically deliver digital invoices to guests.
                  </p>
                </div>
              </div>

              {/* Top Banner Actions */}
              <div className="flex items-center gap-2 self-start lg:self-center">
                <button
                  type="button"
                  onClick={fetchStatus}
                  className="px-3 py-2 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 text-[11px] font-700 uppercase tracking-wide transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  title="Check Live Connection"
                >
                  <RefreshCw size={12} /> Sync Status
                </button>
                <button
                  type="button"
                  onClick={handleDisconnect}
                  disabled={actionLoading}
                  className="px-3.5 py-2 rounded-xl border border-neutral-200 hover:border-red-300 bg-white hover:bg-red-50 text-neutral-600 hover:text-red-600 text-[11px] font-700 uppercase tracking-wide transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  <Trash2 size={12} /> Unlink Device
                </button>
              </div>
            </div>
          </div>

          {/* ══ BALANCED TWO-COLUMN FULL-WIDTH GRID ══ */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full items-start">
            {/* ── LEFT COLUMN (7 COLS): Controls, Settings & Test ── */}
            <div className="lg:col-span-7 space-y-5">
              {/* Card 1: Sample Dispatch Tool */}
              <div className="bg-white border border-neutral-200 rounded-2xl p-5 space-y-4 shadow-xs">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-emerald-600" />
                    <h4 className="text-[13px] font-800 text-neutral-900 uppercase tracking-wide">
                      Send Test / Verification Receipt
                    </h4>
                  </div>
                  <span className="text-[10px] text-neutral-400 font-medium">
                    Live Dispatch
                  </span>
                </div>

                <p className="text-[12px] text-neutral-600 leading-relaxed">
                  Enter any WhatsApp mobile number to test the real-time delivery and preview the guest-facing digital receipt:
                </p>

                <form onSubmit={handleSendTest} className="space-y-3">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[12.5px] font-bold text-neutral-400">
                        +91
                      </span>
                      <input
                        type="tel"
                        maxLength={10}
                        placeholder="Enter 10-digit mobile number"
                        value={testPhone}
                        onChange={(e) =>
                          setTestPhone(e.target.value.replace(/\D/g, ""))
                        }
                        className="w-full border border-neutral-200 rounded-xl pl-12 pr-4 py-2.5 text-[13px] font-mono text-neutral-800 bg-neutral-50/60 focus:outline-none focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-600/10 transition-all"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={sendingTest || !testPhone}
                      className={`px-5 py-2.5 rounded-xl text-[12px] font-800 uppercase tracking-wide transition-all flex items-center justify-center gap-1.5 whitespace-nowrap shadow-xs active:scale-[0.98] ${
                        sendingTest || !testPhone
                          ? "bg-neutral-100 text-neutral-400 cursor-not-allowed border border-neutral-200"
                          : "bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-emerald-600/20"
                      }`}
                    >
                      {sendingTest ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send size={13} /> Dispatch Test
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Card 2: Invoicing Preferences */}
              <div className="bg-white border border-neutral-200 rounded-2xl p-5 space-y-4 shadow-xs">
                <div className="flex items-center gap-2 pb-2 border-b border-neutral-100">
                  <Sliders size={16} className="text-neutral-700" />
                  <h4 className="text-[13px] font-800 text-neutral-900 uppercase tracking-wide">
                    Dispatch Preferences & Rules
                  </h4>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3 rounded-xl border border-neutral-200 hover:bg-neutral-50 transition-colors cursor-pointer">
                    <div>
                      <p className="text-[12px] font-700 text-neutral-900">
                        Auto-Dispatch on Checkout
                      </p>
                      <p className="text-[10.5px] text-neutral-500 mt-0.5">
                        Automatically sends the bill when cashier finishes order with WhatsApp option checked.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={autoSendOnOrder}
                      onChange={(e) => updatePreference("autoDispatch", e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded border-neutral-300 focus:ring-emerald-500 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl border border-neutral-200 hover:bg-neutral-50 transition-colors cursor-pointer">
                    <div>
                      <p className="text-[12px] font-700 text-neutral-900">
                        Include CGST & SGST Split
                      </p>
                      <p className="text-[10.5px] text-neutral-500 mt-0.5">
                        Displays compliant 2.5% CGST + 2.5% SGST tax breakup directly in WhatsApp message.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={includeGstSplit}
                      onChange={(e) => updatePreference("includeGstSplit", e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded border-neutral-300 focus:ring-emerald-500 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl border border-neutral-200 hover:bg-neutral-50 transition-colors cursor-pointer">
                    <div>
                      <p className="text-[12px] font-700 text-neutral-900">
                        Customer Loyalty & Greeting Footer
                      </p>
                      <p className="text-[10.5px] text-neutral-500 mt-0.5">
                        Appends warm outlet greetings (&ldquo;Thank you for ordering with {restaurantName}!&rdquo;).
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={includeReviewLink}
                      onChange={(e) => updatePreference("includeGreeting", e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded border-neutral-300 focus:ring-emerald-500 cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              {/* Card 3: Enterprise Operational Notes */}
              <div className="bg-neutral-50 border border-neutral-200/80 rounded-2xl p-4 flex items-start gap-3">
                <HelpCircle size={18} className="text-neutral-500 flex-shrink-0 mt-0.5" />
                <div className="text-[11.5px] text-neutral-600 space-y-1">
                  <p className="font-bold text-neutral-800">
                    Enterprise Multi-Device Synchronization
                  </p>
                  <p className="leading-relaxed">
                    The POS uses WhatsApp&rsquo;s official Multi-Device protocol. Your primary restaurant phone does not need to stay on the same Wi-Fi, and no WhatsApp application opens on the cashier&rsquo;s screen. In case of connectivity loss, POS billing continues uninterrupted.
                  </p>
                </div>
              </div>
            </div>

            {/* ── RIGHT COLUMN (5 COLS): Authentic WhatsApp Chat Preview ── */}
            <div className="lg:col-span-5 bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-xs flex flex-col">
              {/* WhatsApp Phone Mockup Header */}
              <div className="bg-[#075E54] text-white px-4 py-3 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-white text-[#075E54] flex items-center justify-center font-bold text-xs shadow-xs overflow-hidden flex-shrink-0 border border-white/20">
                    {restaurantLogo ? (
                      <img
                        src={restaurantLogo}
                        alt={restaurantName}
                        className="w-full h-full object-contain p-0.5 bg-white"
                      />
                    ) : (
                      <Store size={16} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-[13px] font-bold leading-none truncate capitalize">
                        {restaurantName}
                      </p>
                      <CheckCircle2 size={12} className="text-emerald-300 fill-emerald-300 flex-shrink-0" />
                    </div>
                    <p className="text-[10px] text-emerald-100/90 mt-0.5">
                      Official Business Account
                    </p>
                  </div>
                </div>
                <div className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-emerald-100 flex-shrink-0">
                  Live Preview
                </div>
              </div>

              {/* WhatsApp Chat Body with textured background */}
              <div className="bg-[#EFEAE2] p-4 flex-1 space-y-3 font-sans min-h-[380px] flex flex-col justify-start relative">
                {/* Date bubble */}
                <div className="flex justify-center">
                  <span className="bg-white/80 backdrop-blur-xs text-neutral-600 text-[10px] px-3 py-0.5 rounded-full shadow-2xs font-medium">
                    Today
                  </span>
                </div>

                {/* WhatsApp Message Bubble */}
                <div className="bg-white rounded-2xl rounded-tl-xs p-3.5 shadow-sm text-neutral-800 max-w-[94%] space-y-2 relative border border-neutral-200/40">
                  {/* Bill Header */}
                  <div className="border-b border-neutral-100 pb-2">
                    <p className="text-[12.5px] font-bold text-neutral-900 tracking-tight uppercase">
                      🧾 {restaurantName}
                    </p>
                    <p className="text-[11px] font-semibold text-neutral-700">
                      Digital Receipt • Order #102
                    </p>
                  </div>

                  {/* Metadata */}
                  <div className="text-[10.5px] text-neutral-600 space-y-0.5">
                    <p>📅 <strong>Date:</strong> 21 Nov 2026 • 04:15 PM</p>
                    <p>📦 <strong>Order Type:</strong> TAKEOUT</p>
                    <p>👤 <strong>Guest:</strong> Rohan Sharma</p>
                  </div>

                  {/* Order Items */}
                  <div className="border-t border-b border-neutral-100 py-1.5 text-[11px] text-neutral-800 space-y-1">
                    <div className="flex justify-between font-medium">
                      <span>▪ 1x Cheese Overloaded Burger</span>
                      <span>₹120.00</span>
                    </div>
                  </div>

                  {/* Tax & Total */}
                  <div className="text-[10.5px] text-neutral-600 space-y-0.5">
                    <div className="flex justify-between">
                      <span>Sub Total:</span>
                      <span>₹120.00</span>
                    </div>
                    {includeGstSplit && (
                      <>
                        <div className="flex justify-between">
                          <span>CGST (2.5%):</span>
                          <span>₹3.00</span>
                        </div>
                        <div className="flex justify-between">
                          <span>SGST (2.5%):</span>
                          <span>₹3.00</span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between text-[12px] font-bold text-neutral-900 pt-1 border-t border-neutral-100 mt-1">
                      <span>TOTAL AMOUNT:</span>
                      <span className="text-emerald-700 font-extrabold">₹126.00</span>
                    </div>
                    <p className="text-[10px] text-emerald-800 font-semibold pt-0.5">
                      ✓ PAID via UPI
                    </p>
                  </div>

                  {/* Footer Greetings */}
                  {includeReviewLink && (
                    <div className="border-t border-neutral-100 pt-1.5 text-[10px] text-neutral-500 italic">
                      🙏 Thank you for dining with {restaurantName}! Have a wonderful day & visit again ✨
                    </div>
                  )}

                  {/* Message Timestamp & Blue Ticks */}
                  <div className="flex items-center justify-end gap-1 text-[9px] text-neutral-400 pt-1">
                    <span>04:15 PM</span>
                    <CheckCheck size={13} className="text-sky-500" />
                  </div>
                </div>

                {/* Simulated Quick Action Pill under bubble */}
                <div className="flex justify-start">
                  <div className="bg-white/90 hover:bg-white text-emerald-800 border border-emerald-200/80 rounded-xl px-3 py-1 text-[10px] font-bold shadow-2xs inline-flex items-center gap-1.5">
                    <span>Rate Us on Google</span>
                    <ExternalLink size={10} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ══ STATE 2: NOT CONNECTED (DEVICE LINKING FULL WIDTH) ══ */
        <div className="w-full bg-white border border-neutral-200 rounded-2xl p-6 md:p-8 shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left: Pairing Instructions (7 Cols) */}
            <div className="lg:col-span-7 space-y-5">
              <div className="space-y-1.5">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-800 uppercase tracking-wider">
                  One-Time Device Setup
                </span>
                <h3 className="text-[18px] font-900 text-neutral-900">
                  Connect Restaurant WhatsApp Device
                </h3>
                <p className="text-[12.5px] text-neutral-500 leading-relaxed">
                  Link your official restaurant or outlet WhatsApp phone once. The system securely maintains device sync to dispatch digital receipts to your customers.
                </p>
              </div>

              <ol className="space-y-3.5 text-[12.5px] text-neutral-700">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[11px] flex-shrink-0 mt-0.5">
                    1
                  </span>
                  <div>
                    <strong>Open WhatsApp</strong> on your restaurant or outlet mobile device.
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[11px] flex-shrink-0 mt-0.5">
                    2
                  </span>
                  <div>
                    Navigate to <strong>Linked Devices</strong> (Settings on iOS or ⋮ More Options on Android).
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[11px] flex-shrink-0 mt-0.5">
                    3
                  </span>
                  <div>
                    Tap <strong>Link a Device</strong> and point your camera at the QR code displayed on the right.
                  </div>
                </li>
              </ol>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleConnect}
                  disabled={actionLoading}
                  className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-800 uppercase tracking-wide transition-all shadow-xs cursor-pointer flex items-center gap-2"
                >
                  <RefreshCw size={14} className={actionLoading ? "animate-spin" : ""} />
                  {data.status === "qr_ready" ? "Refresh Pairing Code" : "Initialize Device Link"}
                </button>
              </div>
            </div>

            {/* Right: Live QR Code Card (5 Cols) */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center p-8 bg-neutral-50 rounded-2xl border border-neutral-200">
              {data.status === "qr_ready" && data.qrCode ? (
                <div className="space-y-3 flex flex-col items-center animate-scale-up">
                  <div className="p-3 bg-white rounded-2xl border border-neutral-300 shadow-md">
                    <img
                      src={data.qrCode}
                      alt="WhatsApp Pairing QR"
                      className="w-64 h-64 object-contain rounded-xl"
                    />
                  </div>
                  <p className="text-[11.5px] font-700 text-neutral-600 flex items-center gap-2 animate-pulse">
                    <Smartphone size={15} className="text-emerald-600" />
                    Scan QR code with WhatsApp camera
                  </p>
                </div>
              ) : (
                <div className="text-center py-12 space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-neutral-200 flex items-center justify-center mx-auto text-neutral-400">
                    <QrCode size={34} />
                  </div>
                  <div>
                    <p className="text-[13.5px] font-700 text-neutral-700">
                      No active pairing code
                    </p>
                    <p className="text-[11.5px] text-neutral-400 mt-1 max-w-[260px]">
                      Click the green button on the left to generate your outlet QR code.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
