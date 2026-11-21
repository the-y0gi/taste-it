'use client';

import React from 'react';
import { TaxFeesSettings } from './settingsTypes';
import {
  Percent,
  Receipt,
  Truck,
  Edit2,
  Check,
  X,
  HelpCircle,
  Calculator,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

interface TaxFeesTabProps {
  taxFeesSettings: TaxFeesSettings;
  setTaxFeesSettings: React.Dispatch<React.SetStateAction<TaxFeesSettings>>;
  onSubmit: (e: React.FormEvent) => void;
  saving?: boolean;
}

export default function TaxFeesTab({
  taxFeesSettings,
  setTaxFeesSettings,
  onSubmit,
  saving = false,
}: TaxFeesTabProps) {
  const [isEditing, setIsEditing] = React.useState(false);

  // Sync CGST / SGST rates if not initialized
  const totalGst = Number(taxFeesSettings.gstTaxRate) || 0;
  const initialCgst =
    taxFeesSettings.cgstRate !== undefined
      ? String(taxFeesSettings.cgstRate)
      : (totalGst / 2).toFixed(2);
  const initialSgst =
    taxFeesSettings.sgstRate !== undefined
      ? String(taxFeesSettings.sgstRate)
      : (totalGst / 2).toFixed(2);

  // When user edits Total GST -> auto split into CGST (50%) & SGST (50%)
  const handleTotalGstChange = (val: string) => {
    const num = parseFloat(val) || 0;
    const half = (num / 2).toFixed(2);
    setTaxFeesSettings((prev) => ({
      ...prev,
      gstTaxRate: val,
      cgstRate: half,
      sgstRate: half,
      pstTaxRate: '0.00',
      hstTaxRate: '0.00',
    }));
  };

  // When user edits CGST directly
  const handleCgstChange = (val: string) => {
    const cgstNum = parseFloat(val) || 0;
    const sgstNum = parseFloat(String(taxFeesSettings.sgstRate ?? initialSgst)) || 0;
    const newTotal = (cgstNum + sgstNum).toFixed(2);
    setTaxFeesSettings((prev) => ({
      ...prev,
      cgstRate: val,
      gstTaxRate: newTotal,
      pstTaxRate: '0.00',
      hstTaxRate: '0.00',
    }));
  };

  // When user edits SGST directly
  const handleSgstChange = (val: string) => {
    const sgstNum = parseFloat(val) || 0;
    const cgstNum = parseFloat(String(taxFeesSettings.cgstRate ?? initialCgst)) || 0;
    const newTotal = (cgstNum + sgstNum).toFixed(2);
    setTaxFeesSettings((prev) => ({
      ...prev,
      sgstRate: val,
      gstTaxRate: newTotal,
      pstTaxRate: '0.00',
      hstTaxRate: '0.00',
    }));
  };

  const handleDeliveryFeeChange = (val: string) => {
    setTaxFeesSettings((prev) => ({
      ...prev,
      deliveryFee: val,
    }));
  };

  // Apply Quick Preset (5%, 12%, 18%)
  const applyPreset = (rate: number) => {
    if (!isEditing) return;
    const half = (rate / 2).toFixed(2);
    setTaxFeesSettings((prev) => ({
      ...prev,
      gstTaxRate: rate.toFixed(2),
      cgstRate: half,
      sgstRate: half,
      pstTaxRate: '0.00',
      hstTaxRate: '0.00',
    }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(e);
    setIsEditing(false);
  };

  // Live simulation calculations
  const sampleSubtotal = 200.0;
  const currentCgst = parseFloat(String(taxFeesSettings.cgstRate ?? initialCgst)) || 0;
  const currentSgst = parseFloat(String(taxFeesSettings.sgstRate ?? initialSgst)) || 0;
  const currentTotalGst = currentCgst + currentSgst;
  const deliveryFee = Number(taxFeesSettings.deliveryFee) || 0;

  const cgstAmount = (sampleSubtotal * currentCgst) / 100;
  const sgstAmount = (sampleSubtotal * currentSgst) / 100;
  const totalTaxAmount = cgstAmount + sgstAmount;
  const grandTotal = sampleSubtotal + totalTaxAmount + deliveryFee;

  return (
    <div className="w-full space-y-6 font-sans">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-neutral-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-primary text-white flex items-center justify-center font-bold shadow-xs flex-shrink-0">
            <Receipt size={20} />
          </div>
          <div>
            <h2 className="text-[17px] font-900 text-neutral-900 tracking-tight flex items-center gap-2">
              Indian GST &amp; Delivery Charges Settings
            </h2>
            <p className="text-[12px] text-neutral-500 mt-0.5">
              Set CGST + SGST tax rates and default order delivery fees applied to POS billing and guest receipts.
            </p>
          </div>
        </div>

        {/* Header Action Button */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          {!isEditing ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-[11px] font-800 uppercase tracking-wide transition-all cursor-pointer shadow-xs flex items-center gap-1.5 active:scale-95"
            >
              <Edit2 size={13} /> Edit Tax Rules
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
                    <Check size={14} /> Save Tax Rates
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-6">
        {/* ── Balanced Two-Column Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ── LEFT COLUMN (7 COLS): Indian GST Inputs ── */}
          <div className="lg:col-span-7 space-y-5">
            {/* Card 1: Indian Goods & Services Tax (GST) */}
            <div className="bg-white border border-neutral-200 rounded-2xl p-5 space-y-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                <div className="flex items-center gap-2">
                  <Percent size={16} className="text-brand-primary" />
                  <h3 className="text-[13px] font-800 text-neutral-900 uppercase tracking-wide">
                    Indian GST Tax Configuration
                  </h3>
                </div>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                  Official GST Compliance
                </span>
              </div>

              {/* Quick Preset Buttons */}
              {isEditing && (
                <div className="space-y-1.5 bg-neutral-50 p-3 rounded-xl border border-neutral-100">
                  <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide flex items-center gap-1">
                    <Sparkles size={11} className="text-brand-primary" />
                    Quick Restaurant Rate Presets:
                  </span>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => applyPreset(5)}
                      className="px-2.5 py-1 rounded-lg bg-white border border-neutral-200 hover:border-brand-primary text-[11px] font-bold text-neutral-800 hover:text-brand-primary transition-all cursor-pointer shadow-2xs"
                    >
                      5.00% GST (2.5% CGST + 2.5% SGST)
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset(12)}
                      className="px-2.5 py-1 rounded-lg bg-white border border-neutral-200 hover:border-brand-primary text-[11px] font-bold text-neutral-800 hover:text-brand-primary transition-all cursor-pointer shadow-2xs"
                    >
                      12.00% GST (6% + 6%)
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset(18)}
                      className="px-2.5 py-1 rounded-lg bg-white border border-neutral-200 hover:border-brand-primary text-[11px] font-bold text-neutral-800 hover:text-brand-primary transition-all cursor-pointer shadow-2xs"
                    >
                      18.00% GST (9% + 9%)
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset(0)}
                      className="px-2.5 py-1 rounded-lg bg-white border border-neutral-200 hover:border-brand-primary text-[11px] font-bold text-neutral-600 hover:text-neutral-900 transition-all cursor-pointer shadow-2xs"
                    >
                      0% (Tax Exempt)
                    </button>
                  </div>
                </div>
              )}

              {/* Total GST Master Input */}
              <div className="space-y-1.5">
                <label className="block text-[11.5px] font-800 uppercase tracking-wider text-neutral-700 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Percent size={13} className="text-brand-primary" />
                    <span>Total GST Tax Rate (%)</span>
                    <span className="text-red-500">*</span>
                  </span>
                  <span className="text-[10px] text-neutral-400 font-medium normal-case">
                    Standard Food Service: 5.00%
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    disabled={!isEditing}
                    value={taxFeesSettings.gstTaxRate}
                    onChange={(e) => handleTotalGstChange(e.target.value)}
                    placeholder="5.00"
                    className={`w-full pl-4 pr-10 py-2.5 rounded-xl border text-[13.5px] font-bold font-mono transition-all ${
                      isEditing
                        ? 'bg-white border-brand-primary text-neutral-900 focus:outline-none ring-2 ring-brand-primary/10'
                        : 'bg-neutral-50/70 border-neutral-200 text-neutral-800 cursor-not-allowed'
                    }`}
                    required
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 font-bold text-xs">
                    %
                  </span>
                </div>
              </div>

              {/* CGST & SGST Split Inputs (Side by Side) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                {/* CGST Input */}
                <div className="space-y-1.5 p-3.5 bg-neutral-50/70 rounded-xl border border-neutral-200/80">
                  <label className="block text-[11px] font-800 uppercase tracking-wider text-neutral-800">
                    Central GST (CGST) % *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="50"
                      disabled={!isEditing}
                      value={taxFeesSettings.cgstRate ?? initialCgst}
                      onChange={(e) => handleCgstChange(e.target.value)}
                      placeholder="2.50"
                      className={`w-full pl-3.5 pr-8 py-2 rounded-lg border text-[12.5px] font-mono font-bold transition-all ${
                        isEditing
                          ? 'bg-white border-brand-primary text-neutral-900 focus:outline-none'
                          : 'bg-white border-neutral-200 text-neutral-800 cursor-not-allowed'
                      }`}
                      required
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 font-bold text-xs">
                      %
                    </span>
                  </div>
                  <p className="text-[10px] text-neutral-500">
                    Central Govt tax component (half of total GST).
                  </p>
                </div>

                {/* SGST Input */}
                <div className="space-y-1.5 p-3.5 bg-neutral-50/70 rounded-xl border border-neutral-200/80">
                  <label className="block text-[11px] font-800 uppercase tracking-wider text-neutral-800">
                    State GST (SGST) % *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="50"
                      disabled={!isEditing}
                      value={taxFeesSettings.sgstRate ?? initialSgst}
                      onChange={(e) => handleSgstChange(e.target.value)}
                      placeholder="2.50"
                      className={`w-full pl-3.5 pr-8 py-2 rounded-lg border text-[12.5px] font-mono font-bold transition-all ${
                        isEditing
                          ? 'bg-white border-brand-primary text-neutral-900 focus:outline-none'
                          : 'bg-white border-neutral-200 text-neutral-800 cursor-not-allowed'
                      }`}
                      required
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 font-bold text-xs">
                      %
                    </span>
                  </div>
                  <p className="text-[10px] text-neutral-500">
                    State Govt tax component (half of total GST).
                  </p>
                </div>
              </div>

              {/* Status Note */}
              <div className="flex items-center gap-2 text-[11px] text-emerald-800 bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-200/80">
                <ShieldCheck size={14} className="text-emerald-600 flex-shrink-0" />
                <span>
                  <strong>Compliant Tax Breakdown:</strong> Customer invoices will print as{' '}
                  <span className="font-mono font-bold">
                    {currentCgst.toFixed(2)}% CGST
                  </span>{' '}
                  +{' '}
                  <span className="font-mono font-bold">
                    {currentSgst.toFixed(2)}% SGST
                  </span>{' '}
                  (Total GST:{' '}
                  <span className="font-mono font-bold">
                    {currentTotalGst.toFixed(2)}%
                  </span>
                  ).
                </span>
              </div>
            </div>

            {/* Card 2: Fulfillment & Delivery Charges */}
            <div className="bg-white border border-neutral-200 rounded-2xl p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                <div className="flex items-center gap-2">
                  <Truck size={16} className="text-brand-primary" />
                  <h3 className="text-[13px] font-800 text-neutral-900 uppercase tracking-wide">
                    Delivery Fulfillment Fee
                  </h3>
                </div>
                <span className="text-[10px] text-neutral-400 font-medium">Auto-applied</span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11.5px] font-800 uppercase tracking-wider text-neutral-700 flex items-center justify-between">
                  <span>Default Flat Delivery Charge</span>
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 font-bold text-xs">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    disabled={!isEditing}
                    value={taxFeesSettings.deliveryFee}
                    onChange={(e) => handleDeliveryFeeChange(e.target.value)}
                    placeholder="40.00"
                    className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-[13px] font-bold font-mono transition-all ${
                      isEditing
                        ? 'bg-white border-brand-primary text-neutral-900 focus:outline-none ring-2 ring-brand-primary/10'
                        : 'bg-neutral-50/70 border-neutral-200 text-neutral-800 cursor-not-allowed'
                    }`}
                    required
                  />
                </div>
                <p className="text-[10.5px] text-neutral-500">
                  Automatically added to cart total when Cashier selects <strong>&ldquo;Delivery&rdquo;</strong> order mode.
                </p>
              </div>
            </div>

            {/* Note */}
            <div className="bg-neutral-50 border border-neutral-200/80 rounded-2xl p-4 flex items-start gap-3">
              <HelpCircle size={18} className="text-neutral-500 flex-shrink-0 mt-0.5" />
              <div className="text-[11.5px] text-neutral-600 space-y-1">
                <p className="font-bold text-neutral-800">GST India Rules</p>
                <p className="leading-relaxed">
                  In India, food and beverage sales strictly follow Goods and Services Tax (GST). Foreign sales taxes (PST/HST) have been removed from your system.
                </p>
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN (5 COLS): Live Invoice Tax Simulation ── */}
          <div className="lg:col-span-5 bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-xs flex flex-col">
            {/* Header */}
            <div className="bg-neutral-900 text-white px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calculator size={15} className="text-brand-primary" />
                <span className="text-[12.5px] font-800 uppercase tracking-wide">
                  Live GST Bill Simulation
                </span>
              </div>
              <span className="text-[9.5px] font-mono uppercase px-2 py-0.5 rounded bg-white/10 text-neutral-300 font-bold">
                GST Compliant
              </span>
            </div>

            {/* Receipt Body */}
            <div className="p-5 space-y-4 bg-neutral-50/50 flex-1">
              <p className="text-[11px] text-neutral-500">
                Real-time preview of how a sample order of <strong>₹200.00</strong> will be calculated at checkout:
              </p>

              {/* Mock Order Card */}
              <div className="bg-white rounded-xl border border-neutral-200 p-4 space-y-3 shadow-2xs font-sans">
                <div className="flex justify-between items-center pb-2 border-b border-neutral-100 text-[12px]">
                  <span className="font-bold text-neutral-800">1x Butter Paneer Meal</span>
                  <span className="font-mono font-bold text-neutral-900">₹200.00</span>
                </div>

                <div className="space-y-1.5 text-[11px] text-neutral-600">
                  <div className="flex justify-between">
                    <span>Order Subtotal:</span>
                    <span className="font-mono font-semibold">₹{sampleSubtotal.toFixed(2)}</span>
                  </div>

                  {/* GST Breakup */}
                  <div className="pt-1 border-t border-neutral-100 space-y-1 text-[10.5px]">
                    <div className="flex justify-between text-neutral-700">
                      <span className="font-medium">
                        ▪ CGST ({currentCgst.toFixed(2)}%):
                      </span>
                      <span className="font-mono font-bold text-neutral-800">
                        ₹{cgstAmount.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-neutral-700">
                      <span className="font-medium">
                        ▪ SGST ({currentSgst.toFixed(2)}%):
                      </span>
                      <span className="font-mono font-bold text-neutral-800">
                        ₹{sgstAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between text-neutral-800 pt-1 border-t border-neutral-100">
                    <span className="font-bold">Total GST ({currentTotalGst.toFixed(2)}%):</span>
                    <span className="font-mono font-bold text-neutral-900">
                      ₹{totalTaxAmount.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between text-neutral-700 pt-1 border-t border-neutral-100">
                    <span>Delivery Charges:</span>
                    <span className="font-mono font-semibold">₹{deliveryFee.toFixed(2)}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-neutral-200 flex justify-between items-center">
                  <div>
                    <span className="text-[11px] font-extrabold uppercase tracking-wide text-neutral-900 block">
                      Total Invoice Amount
                    </span>
                    <span className="text-[9.5px] text-emerald-700 font-bold">
                      CGST + SGST Inclusive
                    </span>
                  </div>
                  <span className="text-[17px] font-900 font-mono text-brand-primary">
                    ₹{grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Status info */}
              <div className="p-3 bg-white rounded-xl border border-neutral-200 text-[11px] text-neutral-600 flex items-center gap-2 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                <span>
                  Status:{' '}
                  <strong className="text-neutral-800">
                    {isEditing ? 'Editing Rules in Progress' : 'Active on POS Checkout'}
                  </strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
