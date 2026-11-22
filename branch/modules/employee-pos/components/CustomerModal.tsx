"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Search,
  Keyboard,
  Check,
  MapPin,
  User,
  Phone,
  Mail,
  FileText,
  Navigation,
  Trash2,
  Sparkles,
  Building,
  RotateCcw,
} from "lucide-react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { usePosStore } from "../store/pos.store";

// Helper function to geocode manual address inputs (Primary: Mapbox India, Fallback: Nominatim India)
const geocodeManualAddress = async (
  address: string,
  postalCode?: string,
  branchCoords?: { lat: number; lng: number } | null,
): Promise<{ lat: number; lng: number } | null> => {
  const cleanAddr = (address || "").trim();
  const cleanPostal = (postalCode || "").trim();
  if (!cleanAddr) return null;

  const combinedQuery = `${cleanAddr}${cleanPostal ? " " + cleanPostal : ""}`;
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  try {
    // 1. Primary Priority: Mapbox India High-Precision Geocoding with optional branch proximity
    if (mapboxToken && !mapboxToken.includes("demo_token")) {
      let proximityParam = "";
      if (branchCoords?.lat && branchCoords?.lng) {
        proximityParam = `&proximity=${branchCoords.lng},${branchCoords.lat}`;
      }
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(combinedQuery)}.json?country=in&types=address,postcode,place,locality,neighborhood,poi&limit=1${proximityParam}&access_token=${mapboxToken}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data?.features?.length > 0) {
        const [lng, lat] = data.features[0].center;
        return { lat, lng };
      }
    }

    // 2. Secondary Fallback: Nominatim India
    const inQuery = `${combinedQuery}, India`;
    const resIn = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&countrycodes=in&addressdetails=1&limit=1&q=${encodeURIComponent(inQuery)}`,
    );
    const jsonIn = await resIn.json();
    if (Array.isArray(jsonIn) && jsonIn.length > 0) {
      return { lat: parseFloat(jsonIn[0].lat), lng: parseFloat(jsonIn[0].lon) };
    }
  } catch (err) {
    console.warn("Manual Geocoding Error:", err);
  }

  return null;
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface FormValues {
  phone: string;
  email: string;
  name: string;
  address: string;
  postalCode: string;
  driverNotes: string;
  searchQuery: string;
  searchAddress: string;
}

interface AddressSuggestion {
  displayName: string;
  address: string;
  postalCode: string;
  lat: number;
  lng: number;
}

interface MatchedCustomer {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  postalCode?: string;
  driverNotes?: string;
  lat?: number;
  lng?: number;
  ordersCount?: number;
}

const KEYBOARD_ROWS = [
  ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "=", "Backspace"],
  ["Tab", "q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "[", "]", "\\"],
  ["Caps Lock", "a", "s", "d", "f", "g", "h", "j", "k", "l", ";", "'", "Enter"],
  ["@", ".", "z", "x", "c", "v", "b", "n", "m", ",", "/", "Shift"],
  ["Space"],
];

export default function CustomerModal({ isOpen, onClose }: Props) {
  const { setCustomer, selectedCustomer, orderType } = usePosStore();
  const [keyboardEnabled, setKeyboardEnabled] = useState(false); // Default false for clean spacious desktop view
  const [activeField, setActiveField] = useState<keyof FormValues | null>("phone");
  const [capsLock, setCapsLock] = useState(false);
  const [addressTab, setAddressTab] = useState<"auto" | "manual">("auto");
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [matchedCustomer, setMatchedCustomer] = useState<MatchedCustomer | null>(null);
  const [showAddressSection, setShowAddressSection] = useState(orderType === "delivery");
  const searchAbortRef = useRef<AbortController | null>(null);

  const [branchCoords, setBranchCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedCoords, setSelectedCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(
    selectedCustomer?.lat && selectedCustomer?.lng
      ? { lat: selectedCustomer.lat, lng: selectedCustomer.lng }
      : null,
  );

  const { register, handleSubmit, reset, setValue, getValues, watch } =
    useForm<FormValues>({
      defaultValues: {
        phone: selectedCustomer?.phone || "",
        email: selectedCustomer?.email || "",
        name: selectedCustomer?.name || "",
        address: selectedCustomer?.address || "",
        postalCode: selectedCustomer?.postalCode || "",
        driverNotes: selectedCustomer?.driverNotes || "",
        searchQuery: selectedCustomer?.phone || "",
        searchAddress: "",
      },
    });

  const watchPhone = watch("phone");
  const watchName = watch("name");
  const watchSearchAddress = watch("searchAddress");
  const watchAddress = watch("address");
  const watchPostalCode = watch("postalCode");

  // Read branch coordinates for location-biased autocomplete
  useEffect(() => {
    try {
      const raw = localStorage.getItem("rms_branch");
      if (raw) {
        const b = JSON.parse(raw);
        if (b.lat && b.lng && !(b.lat === 0 && b.lng === 0)) {
          setBranchCoords({ lat: Number(b.lat), lng: Number(b.lng) });
        }
      }
    } catch {}
  }, []);

  // Sync with changes when opening
  useEffect(() => {
    if (isOpen) {
      reset({
        phone: selectedCustomer?.phone || "",
        email: selectedCustomer?.email || "",
        name: selectedCustomer?.name || "",
        address: selectedCustomer?.address || "",
        postalCode: selectedCustomer?.postalCode || "",
        driverNotes: selectedCustomer?.driverNotes || "",
        searchQuery: selectedCustomer?.phone || "",
        searchAddress: "",
      });
      setSelectedCoords(
        selectedCustomer?.lat && selectedCustomer?.lng
          ? { lat: selectedCustomer.lat, lng: selectedCustomer.lng }
          : null,
      );
      setMatchedCustomer(null);
      setShowAddressSection(
        orderType === "delivery" || Boolean(selectedCustomer?.address),
      );
      setActiveField("phone");
    }
  }, [isOpen, selectedCustomer, orderType, reset]);

  const addressCacheRef = useRef<Map<string, AddressSuggestion[]>>(new Map());

  // ── High-Precision Mapbox India Address Autocomplete ──
  useEffect(() => {
    const query = (watchSearchAddress || "").trim();
    if (query.length < 3) {
      setAddressSuggestions([]);
      setIsSearchingAddress(false);
      return;
    }

    const cacheKey = query.toLowerCase();

    // 0ms instant response from memory cache
    if (addressCacheRef.current.has(cacheKey)) {
      setAddressSuggestions(addressCacheRef.current.get(cacheKey)!);
      setIsSearchingAddress(false);
      return;
    }

    const abortController = new AbortController();

    const timer = setTimeout(async () => {
      setIsSearchingAddress(true);
      try {
        const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

        // 1. Primary: Mapbox India (country=in)
        if (mapboxToken && !mapboxToken.includes("demo_token")) {
          let proximityParam = "";
          if (branchCoords?.lat && branchCoords?.lng) {
            proximityParam = `&proximity=${branchCoords.lng},${branchCoords.lat}`;
          }
          const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?country=in&types=address,postcode,place,locality,neighborhood,poi&autocomplete=true&limit=8${proximityParam}&access_token=${mapboxToken}`;
          const res = await fetch(url, { signal: abortController.signal });
          const data = await res.json();

          if (data?.features?.length > 0) {
            const parsed: AddressSuggestion[] = data.features.map((feature: any) => {
              const [lng, lat] = feature.center || [0, 0];
              const fullAddr = feature.place_name || "";
              let postcode = "";
              const postcodeCtx = feature.context?.find((c: any) => c.id?.startsWith("postcode"));
              if (postcodeCtx) postcode = postcodeCtx.text || "";

              return {
                displayName: fullAddr,
                address: fullAddr,
                postalCode: postcode,
                lat,
                lng,
              };
            });

            addressCacheRef.current.set(cacheKey, parsed);
            setAddressSuggestions(parsed);
            setIsSearchingAddress(false);
            return;
          } else {
            setAddressSuggestions([]);
          }
        }

        // 2. Secondary Fallback: OpenStreetMap Nominatim India
        const inQuery = `${query}, India`;
        const resIn = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&countrycodes=in&addressdetails=1&limit=8&q=${encodeURIComponent(inQuery)}`,
          {
            signal: abortController.signal,
            headers: { "Accept-Language": "en" },
          },
        );
        const jsonIn = await resIn.json();

        if (Array.isArray(jsonIn) && jsonIn.length > 0) {
          const parsed: AddressSuggestion[] = jsonIn.map((item: any) => {
            const addr = item.address || {};
            const street = addr.road || addr.street || addr.neighbourhood || addr.suburb || "";
            const city = addr.city || addr.town || addr.village || addr.county || "";
            const state = addr.state || "";
            const postcode = addr.postcode || "";
            const parts = [street, city, state, postcode].filter(Boolean);
            const fullAddr = parts.join(", ") || item.display_name || "";
            return {
              displayName: item.display_name || fullAddr,
              address: fullAddr,
              postalCode: postcode,
              lat: parseFloat(item.lat),
              lng: parseFloat(item.lon),
            };
          });

          addressCacheRef.current.set(cacheKey, parsed);
          setAddressSuggestions(parsed);
        } else {
          setAddressSuggestions([]);
        }
      } catch (err: any) {
        if (err.name !== "AbortError") console.error("Autocomplete error:", err);
      } finally {
        if (!abortController.signal.aborted) {
          setIsSearchingAddress(false);
        }
      }
    }, 320);

    return () => {
      clearTimeout(timer);
      abortController.abort();
    };
  }, [watchSearchAddress, branchCoords]);

  // Live Geocoding for manual Indian address inputs
  useEffect(() => {
    if (addressTab !== "manual" || !watchAddress || watchAddress.trim().length < 3) {
      return;
    }

    const timer = setTimeout(async () => {
      const coords = await geocodeManualAddress(watchAddress, watchPostalCode, branchCoords);
      if (coords) {
        setSelectedCoords(coords);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [watchAddress, watchPostalCode, addressTab, branchCoords]);

  // ── Auto-Search Existing Repeat Customers by Mobile (Instant Suggestion) ──
  const searchCustomerOnline = async (query: string) => {
    const clean = query.trim();
    if (!clean || clean.length < 3) {
      setMatchedCustomer(null);
      return;
    }

    if (searchAbortRef.current) searchAbortRef.current.abort();
    const abort = new AbortController();
    searchAbortRef.current = abort;

    setIsSearchingCustomer(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const res = await fetch(
        `${apiUrl}/orders/customers/search?query=${encodeURIComponent(clean)}`,
        { signal: abort.signal, credentials: "include" },
      );
      if (abort.signal.aborted) return;
      const json = await res.json();
      if (json.success && json.data) {
        setMatchedCustomer(json.data);
      } else {
        setMatchedCustomer(null);
      }
    } catch {
      setMatchedCustomer(null);
    } finally {
      if (!abort.signal.aborted) setIsSearchingCustomer(false);
    }
  };

  const handleApplyMatchedCustomer = (customer: MatchedCustomer) => {
    setValue("phone", customer.phone || "");
    setValue("name", customer.name || "");
    if (customer.email) setValue("email", customer.email);
    if (customer.address) {
      setValue("address", customer.address);
      setShowAddressSection(true);
    }
    if (customer.postalCode) setValue("postalCode", customer.postalCode);
    if (customer.driverNotes) setValue("driverNotes", customer.driverNotes);
    if (customer.lat && customer.lng) {
      setSelectedCoords({ lat: customer.lat, lng: customer.lng });
    }
    setMatchedCustomer(null);
    toast.success(`Matched profile loaded for ${customer.name || customer.phone}!`);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleClearCustomer = () => {
    setCustomer(null);
    reset({
      phone: "",
      email: "",
      name: "",
      address: "",
      postalCode: "",
      driverNotes: "",
      searchQuery: "",
      searchAddress: "",
    });
    setSelectedCoords(null);
    setMatchedCustomer(null);
    toast("Customer detached from order");
  };

  const onSubmit = async (data: FormValues) => {
    const cleanPhone = data.phone.trim().replace(/\D/g, "");
    if (cleanPhone.length > 0 && cleanPhone.length !== 10) {
      toast.error("Indian mobile number must be exactly 10 digits.");
      return;
    }

    const finalName = data.name.trim() || (cleanPhone ? `Customer ${cleanPhone.slice(-4)}` : "Walk-in Guest");

    let finalLat = selectedCoords?.lat || null;
    let finalLng = selectedCoords?.lng || null;

    if (data.address && (!finalLat || !finalLng)) {
      const coords = await geocodeManualAddress(data.address, data.postalCode, branchCoords);
      if (coords) {
        finalLat = coords.lat;
        finalLng = coords.lng;
      }
    }

    setCustomer({
      name: finalName,
      phone: cleanPhone,
      email: data.email?.trim() || undefined,
      address: data.address?.trim() || undefined,
      postalCode: data.postalCode?.trim() || undefined,
      driverNotes: data.driverNotes?.trim() || undefined,
      lat: finalLat || undefined,
      lng: finalLng || undefined,
    });

    toast.success(`Customer ${finalName} attached to order!`);
    onClose();
  };

  const handleKeyPress = (key: string) => {
    if (!activeField) return;
    const currentVal = getValues(activeField) || "";

    let newVal = "";
    if (key === "Backspace") {
      newVal = currentVal.slice(0, -1);
    } else if (key === "Space") {
      newVal = currentVal + " ";
    } else if (key === "Tab") {
      const fields: (keyof FormValues)[] = [
        "phone",
        "name",
        "email",
        "searchAddress",
        "address",
        "postalCode",
        "driverNotes",
      ];
      const idx = fields.indexOf(activeField);
      if (idx !== -1) {
        const nextField = fields[(idx + 1) % fields.length];
        setActiveField(nextField);
      }
      return;
    } else if (key === "Enter") {
      handleSubmit(onSubmit)();
      return;
    } else if (key === "Caps Lock") {
      setCapsLock(!capsLock);
      return;
    } else if (key === "Shift") {
      setCapsLock(!capsLock);
      return;
    } else {
      const char = capsLock ? key.toUpperCase() : key.toLowerCase();
      newVal = currentVal + char;
    }

    setValue(activeField, newVal);
    if (activeField === "phone") {
      searchCustomerOnline(newVal);
    }
  };

  const registerWithFocus = (name: keyof FormValues, options?: any) => {
    return {
      ...register(name, options),
      onFocus: () => setActiveField(name),
    };
  };

  if (!isOpen) return null;

  const isPhoneValid = (watchPhone || "").replace(/\D/g, "").length === 10;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-5">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-neutral-900/60 backdrop-blur-xs transition-opacity" onClick={handleClose} />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col z-10 border border-neutral-200 animate-scale-up font-sans">
        {/* ── Modal Header with Dynamic Brand Accent ── */}
        <div className="bg-brand-primary text-white px-5 py-3.5 flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
              <User size={16} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-900 tracking-wider uppercase">
                  Customer & Order Delivery Profile
                </h3>
                {orderType && (
                  <span className="text-[9.5px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-white/25 text-white tracking-wider">
                    {orderType.replace("-", " ")}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-white/80 font-medium">
                Customer contact details for WhatsApp billing & delivery fulfillment.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle On-Screen Virtual Keyboard */}
            <button
              type="button"
              onClick={() => setKeyboardEnabled(!keyboardEnabled)}
              className={`px-2.5 py-1.5 rounded-xl text-[10.5px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                keyboardEnabled
                  ? "bg-white text-neutral-900 shadow-xs"
                  : "bg-white/15 hover:bg-white/25 text-white"
              }`}
              title="Toggle Touch Screen Virtual Keyboard"
            >
              <Keyboard size={13} />
              <span className="hidden sm:inline">Keyboard</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={handleClose}
              className="w-7 h-7 rounded-xl bg-white/15 hover:bg-white/30 text-white flex items-center justify-center cursor-pointer transition-all active:scale-95"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* ── Modal Scrollable Body ── */}
        <div className="overflow-y-auto max-h-[82vh] bg-[#FAF9F6] p-4 sm:p-5">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* ── 1. PRIMARY CONTACT DETAILS (India WhatsApp-First) ── */}
            <div className="bg-white rounded-2xl border border-neutral-200/80 p-4 sm:p-4.5 shadow-2xs space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-brand-primary" />
                  <span className="text-[11.5px] font-800 text-neutral-800 uppercase tracking-wider">
                    Mobile Number & Identity
                  </span>
                </div>
                {isPhoneValid && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Check size={11} className="text-emerald-600" /> WhatsApp Bill Enabled
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* 10-Digit Mobile Number with Indian Flag & +91 prefix */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-800 text-neutral-600 uppercase tracking-wider">
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3 flex items-center gap-1 text-[11.5px] font-bold text-neutral-500 pointer-events-none select-none">
                      <span>🇮🇳</span>
                      <span>+91</span>
                      <span className="text-neutral-300">|</span>
                    </div>
                    <input
                      {...registerWithFocus("phone", {
                        onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                          const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                          setValue("phone", val);
                          searchCustomerOnline(val);
                        },
                      })}
                      type="tel"
                      inputMode="numeric"
                      placeholder="98765 43210"
                      className="w-full h-10 pl-16 pr-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold font-mono text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-brand-primary focus:bg-white focus:ring-2 focus:ring-brand-primary/10 transition-all tracking-wider"
                    />
                    {isSearchingCustomer && (
                      <div className="absolute right-3 w-3.5 h-3.5 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
                    )}
                  </div>
                </div>

                {/* Customer Full Name */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-800 text-neutral-600 uppercase tracking-wider">
                    Customer Full Name
                  </label>
                  <div className="relative">
                    <input
                      {...registerWithFocus("name", {
                        onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                          const val = e.target.value;
                          const formatted = val
                            .split(" ")
                            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                            .join(" ");
                          setValue("name", formatted);
                        },
                      })}
                      type="text"
                      placeholder="e.g. Rahul Sharma"
                      className="w-full h-10 pl-8 pr-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-brand-primary focus:bg-white focus:ring-2 focus:ring-brand-primary/10 transition-all"
                    />
                    <User size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                  </div>
                </div>

                {/* Email Address (Optional) */}
                <div className="sm:col-span-2 space-y-1">
                  <label className="block text-[10px] font-800 text-neutral-600 uppercase tracking-wider flex items-center justify-between">
                    <span>Email Address (Optional)</span>
                    <span className="text-[9.5px] text-neutral-400 font-normal">For tax invoice copy</span>
                  </label>
                  <div className="relative">
                    <input
                      {...registerWithFocus("email")}
                      type="email"
                      placeholder="customer@gmail.com"
                      className="w-full h-9 pl-8 pr-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-semibold text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-brand-primary focus:bg-white focus:ring-2 focus:ring-brand-primary/10 transition-all"
                    />
                    <Mail size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                  </div>
                </div>
              </div>

              {/* ── Repeat Customer Suggestion Box (Instant 1-Click Load) ── */}
              {matchedCustomer && (
                <div className="p-3 bg-orange-50/50 border border-brand-primary/30 rounded-xl flex items-center justify-between gap-3 animate-fade-in">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-brand-primary text-white flex items-center justify-center shrink-0">
                      <Sparkles size={13} />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[11px] font-extrabold text-neutral-900 block truncate">
                        Existing Customer: {matchedCustomer.name || matchedCustomer.phone}
                      </span>
                      <span className="text-[9.5px] text-neutral-500 font-medium block truncate">
                        {matchedCustomer.address
                          ? `Saved Address: ${matchedCustomer.address}`
                          : "Saved profile found in directory"}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleApplyMatchedCustomer(matchedCustomer)}
                    className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-[10.5px] font-extrabold uppercase tracking-wider shrink-0 transition-all cursor-pointer shadow-2xs active:scale-95"
                  >
                    Load Profile
                  </button>
                </div>
              )}
            </div>

            {/* ── 2. DELIVERY ADDRESS & MAPBOX INDIA GEOCODING ── */}
            <div className="bg-white rounded-2xl border border-neutral-200/80 p-4 sm:p-4.5 shadow-2xs space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-brand-primary" />
                  <span className="text-[11.5px] font-800 text-neutral-800 uppercase tracking-wider">
                    Delivery Address & Rider Routing (India)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {!showAddressSection ? (
                    <button
                      type="button"
                      onClick={() => setShowAddressSection(true)}
                      className="text-[10.5px] font-extrabold text-brand-primary hover:underline cursor-pointer"
                    >
                      + Add Address
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 text-[10.5px] font-bold">
                      <button
                        type="button"
                        onClick={() => setAddressTab("auto")}
                        className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                          addressTab === "auto"
                            ? "bg-brand-primary text-white shadow-2xs"
                            : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                        }`}
                      >
                        Auto-Search
                      </button>
                      <button
                        type="button"
                        onClick={() => setAddressTab("manual")}
                        className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                          addressTab === "manual"
                            ? "bg-brand-primary text-white shadow-2xs"
                            : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                        }`}
                      >
                        Manual Fields
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {showAddressSection && (
                <div className="space-y-3">
                  {addressTab === "auto" ? (
                    <div className="space-y-2">
                      <div className="relative">
                        <input
                          {...registerWithFocus("searchAddress")}
                          placeholder="Search Street, Sector, Landmark or Colony with Mapbox India..."
                          className="w-full h-10 pl-9 pr-9 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-semibold text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-brand-primary focus:bg-white focus:ring-2 focus:ring-brand-primary/10 transition-all"
                        />
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                        {isSearchingAddress && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
                        )}
                      </div>

                      {/* Mapbox India Suggestions Dropdown */}
                      {addressSuggestions.length > 0 && (
                        <div className="bg-white border border-neutral-200 rounded-xl divide-y divide-neutral-100 shadow-lg max-h-[180px] overflow-y-auto">
                          {addressSuggestions.map((item, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setValue("address", item.address);
                                if (item.postalCode) setValue("postalCode", item.postalCode);
                                setValue("searchAddress", "");
                                setSelectedCoords({ lat: item.lat, lng: item.lng });
                                setAddressSuggestions([]);
                                toast.success("Address & Pin captured for India routing!");
                              }}
                              className="w-full text-left px-3.5 py-2.5 text-[11px] font-semibold text-neutral-800 hover:bg-orange-50/60 transition-all flex items-center justify-between gap-3 cursor-pointer"
                            >
                              <div className="flex items-start gap-2 min-w-0">
                                <MapPin size={12} className="text-brand-primary shrink-0 mt-0.5" />
                                <span className="line-clamp-1">{item.displayName}</span>
                              </div>
                              <span className="text-[9px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded shrink-0">
                                Set Pin
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2 space-y-1">
                        <label className="block text-[9.5px] font-800 text-neutral-600 uppercase tracking-wider">
                          Street, Flat, House or Area
                        </label>
                        <input
                          {...registerWithFocus("address")}
                          placeholder="e.g. Flat 302, Palm Heights, Main Market"
                          className="w-full h-9 px-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-semibold text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-brand-primary focus:bg-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[9.5px] font-800 text-neutral-600 uppercase tracking-wider">
                          Indian PIN Code (6-Digits)
                        </label>
                        <input
                          {...registerWithFocus("postalCode", {
                            onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                              const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                              setValue("postalCode", v);
                            },
                          })}
                          maxLength={6}
                          placeholder="e.g. 110001"
                          className="w-full h-9 px-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold font-mono text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-brand-primary focus:bg-white tracking-wider"
                        />
                      </div>
                    </div>
                  )}

                  {/* Active Address Status Pill */}
                  <div className="bg-neutral-50/80 border border-neutral-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="min-w-0">
                      <span className="text-[10px] font-extrabold uppercase text-neutral-400 block tracking-wider">
                        Active Selected Address:
                      </span>
                      <span className="font-bold text-neutral-800 block truncate text-[11.5px] mt-0.5">
                        {watchAddress || <em className="text-neutral-400">No address assigned yet</em>}
                      </span>
                    </div>

                    <div className="shrink-0">
                      {selectedCoords ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono text-[10px] font-bold">
                          <Navigation size={10} className="text-emerald-600" />
                          GPS ({selectedCoords.lat.toFixed(3)}, {selectedCoords.lng.toFixed(3)})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                          Auto-Pin on Order
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Driver Delivery Notes / Landmark */}
                  <div className="space-y-1">
                    <label className="block text-[9.5px] font-800 text-neutral-600 uppercase tracking-wider flex items-center gap-1">
                      <FileText size={11} className="text-brand-primary" />
                      <span>Rider Notes & Landmark Instructions</span>
                    </label>
                    <input
                      {...registerWithFocus("driverNotes")}
                      placeholder="e.g. Near Shiv Mandir, 2nd floor, call on arrival, don't ring bell..."
                      className="w-full h-9 px-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-brand-primary focus:bg-white"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* ── Virtual Keyboard (Collapsible for Clean Desktop POS) ── */}
            {keyboardEnabled && (
              <div className="border border-neutral-200/80 bg-neutral-100/70 p-2.5 rounded-2xl select-none animate-fade-in shadow-inner">
                <div className="flex flex-col gap-1 max-w-[760px] mx-auto">
                  {KEYBOARD_ROWS.map((row, rowIdx) => (
                    <div key={rowIdx} className="flex gap-1 justify-center">
                      {row.map((key) => {
                        let btnClass =
                          "h-10 rounded-lg font-bold text-[12px] transition-all active:scale-95 cursor-pointer shadow-2xs flex items-center justify-center bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50 ";

                        if (key === "Backspace") {
                          btnClass += "w-20 bg-neutral-200/80 text-neutral-800 hover:bg-neutral-300";
                        } else if (key === "Tab") {
                          btnClass += "w-16 bg-neutral-200/80 text-neutral-800 hover:bg-neutral-300";
                        } else if (key === "Caps Lock") {
                          btnClass +=
                            "w-22 bg-neutral-200/80 text-neutral-800 " +
                            (capsLock ? "border-brand-primary ring-2 ring-brand-primary/20" : "");
                        } else if (key === "Enter") {
                          btnClass += "w-22 bg-brand-primary text-white border-none shadow-xs";
                        } else if (key === "Shift") {
                          btnClass += "w-20 bg-neutral-200/80 text-neutral-800";
                        } else if (key === "Space") {
                          btnClass += "w-[280px] hover:bg-neutral-50";
                        } else {
                          btnClass += "w-10 sm:w-11";
                        }

                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => handleKeyPress(key)}
                            className={btnClass}
                          >
                            {key === "Caps Lock" && capsLock
                              ? "CAPS"
                              : capsLock && key.length === 1
                              ? key.toUpperCase()
                              : key}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Modal Footer Buttons ── */}
            <div className="flex items-center justify-between pt-2 border-t border-neutral-200">
              {selectedCustomer ? (
                <button
                  type="button"
                  onClick={handleClearCustomer}
                  className="px-3.5 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 size={13} />
                  <span>Detach Customer</span>
                </button>
              ) : (
                <span className="text-[11px] text-neutral-400 font-medium">
                  {isPhoneValid ? "✓ Ready to attach" : "Enter 10-digit mobile number"}
                </span>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 border border-neutral-200 text-neutral-700 text-xs font-bold rounded-xl hover:bg-white transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-900 rounded-xl transition-all shadow-md shadow-brand-primary/20 active:scale-95 cursor-pointer uppercase tracking-wider flex items-center gap-1.5"
                >
                  <Check size={14} />
                  <span>Save & Attach Customer</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
