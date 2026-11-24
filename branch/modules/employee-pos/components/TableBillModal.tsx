'use client';

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  Printer,
  Receipt,
  FileDown,
  X,
  CreditCard,
  UtensilsCrossed,
  RefreshCw,
} from 'lucide-react';

export interface TableBillData {
  _id: string;
  name: string;
  section: string;
  capacity: number;
  shape: 'square' | 'round' | 'rectangle';
  status: 'available' | 'occupied' | 'billed' | 'reserved';
  currentOrderId?: any;
  occupiedSince?: string | null;
  isActive: boolean;
}

interface TableBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  table: TableBillData | null;
  onSettle: (table: TableBillData) => void;
  onRefresh?: () => void;
}

export default function TableBillModal({
  isOpen,
  onClose,
  table,
  onSettle,
  onRefresh,
}: TableBillModalProps) {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  // Load latest order details when modal opens
  const fetchOrderDetails = useCallback(async () => {
    if (!table) return;

    const orderId =
      typeof table.currentOrderId === 'object' && table.currentOrderId?._id
        ? table.currentOrderId._id
        : typeof table.currentOrderId === 'string'
        ? table.currentOrderId
        : null;

    // Use populated order as immediate baseline
    if (typeof table.currentOrderId === 'object' && table.currentOrderId?.items) {
      setOrder(table.currentOrderId);
    }

    if (!orderId) return;

    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/orders/${orderId}`, {
        withCredentials: true,
      });

      if (res.data?.success && res.data?.data) {
        setOrder(res.data.data);
      }
    } catch (err: any) {
      console.warn('Could not fetch latest order by id, using cached order on table:', err);
    } finally {
      setLoading(false);
    }
  }, [table, API_URL]);

  useEffect(() => {
    if (isOpen && table) {
      fetchOrderDetails();
    } else {
      setOrder(null);
    }
  }, [isOpen, table, fetchOrderDetails]);

  if (!isOpen || !table) return null;

  // Direct backend silent print to physical receipt printer
  const handlePrintBill = async () => {
    if (!order?._id || isPrinting) return;

    try {
      setIsPrinting(true);
      toast.loading(`Printing bill for Table ${table.name}...`, { id: `print-${order._id}` });
      const res = await axios.post(
        `${API_URL}/orders/${order._id}/print`,
        { paperSize: '80mm' },
        { withCredentials: true }
      );

      if (res.data?.success) {
        toast.success(`Bill printed successfully!`, { id: `print-${order._id}` });
      } else {
        toast.error(res.data?.message || 'Print failed — check printer connection', {
          id: `print-${order._id}`,
        });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Print failed — check printer connection', {
        id: `print-${order._id}`,
      });
    } finally {
      setIsPrinting(false);
    }
  };

  // Download official 80mm PDF Invoice
  const handleDownloadPdf = async () => {
    if (!order?._id || isDownloading) return;

    try {
      setIsDownloading(true);
      toast.loading('Generating invoice PDF...', { id: 'pdf-dl' });
      const response = await axios.get(`${API_URL}/orders/${order._id}/pdf?paperSize=80mm`, {
        responseType: 'blob',
        withCredentials: true,
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Bill-${table.name}-Order-${order.orderNumber || ''}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Bill PDF downloaded successfully!', { id: 'pdf-dl' });
    } catch (err) {
      toast.error('Failed to download invoice PDF', { id: 'pdf-dl' });
    } finally {
      setIsDownloading(false);
    }
  };

  // Calculate items count and financial breakdown
  const items: any[] = order?.items || [];
  const totalItemCount = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const subtotal =
    order?.subtotal ??
    items.reduce((sum, i) => sum + (i.totalPrice || i.basePrice * (i.quantity || 1)), 0);
  const discount = order?.discount || 0;
  const tax = order?.tax ?? subtotal * 0.05;
  const cgst = tax / 2;
  const sgst = tax / 2;
  const grandTotal = order?.total ?? Math.max(0, subtotal - discount + tax);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in font-sans">
      <div className="bg-white rounded-3xl border border-neutral-200 shadow-2xl max-w-2xl w-full flex flex-col max-h-[92vh] overflow-hidden animate-scale-up">
        {/* ── Modal Header ── */}
        <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-xs">
              <Receipt size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[15px] font-900 text-neutral-900 tracking-tight leading-none uppercase">
                  Table {table.name} Bill
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-800 uppercase tracking-wide bg-amber-100 text-amber-900 border border-amber-300">
                  Billed
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 font-600 mt-1 flex items-center gap-2">
                <span>{table.section || 'Main Dining'}</span>
                <span>•</span>
                <span>Order #{order?.orderNumber || '---'}</span>
                {totalItemCount > 0 && (
                  <>
                    <span>•</span>
                    <span>{totalItemCount} Items</span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center cursor-pointer transition-all"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Modal Body Content (Clean Itemized Bill) ── */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {loading && !order ? (
            <div className="py-20 flex flex-col items-center justify-center gap-2 text-neutral-400">
              <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-700">Loading Table Bill Details...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Customer Information (if available) */}
              {order?.customer && (order.customer.name || order.customer.phone) && (
                <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200/80 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] font-800 text-neutral-400 uppercase tracking-wider block">
                      Customer
                    </span>
                    <span className="font-800 text-neutral-800">
                      {order.customer.name || 'Walk-in Guest'}
                    </span>
                  </div>
                  {order.customer.phone && (
                    <span className="font-700 text-neutral-600 bg-white px-2.5 py-1 rounded-lg border border-neutral-200 text-[11px]">
                      📞 {order.customer.phone}
                    </span>
                  )}
                </div>
              )}

              {/* Ordered Items Table */}
              <div className="rounded-2xl border border-neutral-200 overflow-hidden shadow-2xs">
                <div className="bg-neutral-100/80 px-4 py-2 border-b border-neutral-200 grid grid-cols-12 text-[10.5px] font-800 text-neutral-600 uppercase tracking-wider">
                  <span className="col-span-6">Item Description</span>
                  <span className="col-span-2 text-center">Qty</span>
                  <span className="col-span-2 text-right">Rate</span>
                  <span className="col-span-2 text-right">Amount</span>
                </div>

                <div className="divide-y divide-neutral-100 bg-white">
                  {items.length === 0 ? (
                    <div className="py-8 text-center text-neutral-400 text-xs font-700">
                      No items found for this table order.
                    </div>
                  ) : (
                    items.map((item, idx) => {
                      const itemAmt = item.totalPrice ?? item.basePrice * (item.quantity || 1);
                      return (
                        <div
                          key={idx}
                          className="px-4 py-2.5 grid grid-cols-12 items-center text-[12px] hover:bg-neutral-50/60 transition-colors"
                        >
                          {/* Item Name + Modifiers / Variants */}
                          <div className="col-span-6 pr-2">
                            <p className="font-800 text-neutral-900 leading-tight">
                              {item.name}
                            </p>
                            {item.selectedVariant?.name && (
                              <p className="text-[10px] font-600 text-neutral-500 mt-0.5">
                                Variant: {item.selectedVariant.name}
                              </p>
                            )}
                            {item.selectedAddons && item.selectedAddons.length > 0 && (
                              <p className="text-[10px] text-neutral-500">
                                {item.selectedAddons.map((a: any) => `+ ${a.name}`).join(', ')}
                              </p>
                            )}
                            {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                              <p className="text-[10px] text-neutral-500">
                                {item.selectedModifiers.map((m: any) => m.optionName).join(', ')}
                              </p>
                            )}
                            {item.note && (
                              <p className="text-[10px] font-600 text-amber-600 italic">
                                "{item.note}"
                              </p>
                            )}
                          </div>

                          {/* Quantity */}
                          <div className="col-span-2 text-center font-800 text-neutral-800">
                            <span className="px-2 py-0.5 bg-neutral-100 rounded-md">
                              {item.quantity || 1}
                            </span>
                          </div>

                          {/* Base Rate */}
                          <div className="col-span-2 text-right font-700 text-neutral-600">
                            ₹{(item.basePrice || 0).toFixed(2)}
                          </div>

                          {/* Total Line Amount */}
                          <div className="col-span-2 text-right font-900 text-neutral-900">
                            ₹{(itemAmt || 0).toFixed(2)}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* ── Bill Calculation Summary Card ── */}
              <div className="bg-neutral-50/90 rounded-2xl p-4 border border-neutral-200/90 space-y-2">
                <div className="flex items-center justify-between text-[12px] font-700 text-neutral-600">
                  <span>Items Subtotal ({totalItemCount} items)</span>
                  <span className="font-800 text-neutral-800">₹{subtotal.toFixed(2)}</span>
                </div>

                {discount > 0 && (
                  <div className="flex items-center justify-between text-[12px] font-700 text-emerald-600">
                    <span>Discount Applied</span>
                    <span className="font-800">-₹{discount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-[11.5px] font-600 text-neutral-500 pt-1 border-t border-neutral-200/60">
                  <span>CGST (2.5%)</span>
                  <span className="font-700 text-neutral-700">₹{cgst.toFixed(2)}</span>
                </div>

                <div className="flex items-center justify-between text-[11.5px] font-600 text-neutral-500">
                  <span>SGST (2.5%)</span>
                  <span className="font-700 text-neutral-700">₹{sgst.toFixed(2)}</span>
                </div>

                {/* Grand Total */}
                <div className="flex items-center justify-between text-[15px] font-900 text-neutral-900 pt-2 border-t border-neutral-300">
                  <span className="uppercase tracking-tight">Total Bill Amount</span>
                  <span className="text-[18px] text-brand-primary font-900">
                    ₹{grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Modal Footer Action Bar ── */}
        <div className="px-5 py-3.5 bg-neutral-50 border-t border-neutral-200 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          {/* Left Action Buttons: Silent Print to Printer & PDF */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrintBill}
              disabled={isPrinting}
              className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-[11px] font-800 uppercase tracking-wide transition-all cursor-pointer flex items-center gap-1.5 shadow-xs active:scale-98 disabled:opacity-50"
              title="Silent print bill to receipt printer"
            >
              {isPrinting ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Printing...</span>
                </>
              ) : (
                <>
                  <Printer size={14} />
                  <span>Print Bill</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloading}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-neutral-100 border border-neutral-200 text-neutral-700 text-[11px] font-800 uppercase tracking-wide transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-98 disabled:opacity-50"
              title="Download 80mm invoice PDF"
            >
              <FileDown size={14} />
              <span>PDF</span>
            </button>
          </div>

          {/* Right Action: Settle & Close */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-600 text-[11px] font-800 uppercase tracking-wide transition-all cursor-pointer"
            >
              Close
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onSettle(table);
              }}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-900 uppercase tracking-wide transition-all cursor-pointer shadow-sm flex items-center gap-1.5 active:scale-98"
            >
              <CreditCard size={14} />
              <span>Settle ₹{grandTotal.toFixed(0)}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
