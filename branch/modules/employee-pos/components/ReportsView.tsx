'use client';

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  Printer, Calendar, SlidersHorizontal, RefreshCw, PlusCircle, 
  Receipt, IndianRupee, ArrowUpRight, CheckCircle, XCircle, FileText
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ReportsView() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  const getFallbackData = useCallback(() => ({
    completedOrders: { count: 0, totalAmount: 0 },
    cancelledOrders: { count: 0, totalAmount: 0 },
    refundOrders: { count: 0, totalAmount: 0 },
    financials: {
      allCategoryTotal: 0,
      subTotal: 0,
      deliveryCharges: 0,
      debitCardCharges: 0,
      discount: 0,
      tax: 0,
      grandTotal: 0,
      tips: 0,
      finalAmount: 0
    },
    categorySales: [
      { name: 'Lunch Special', total: 0 },
      { name: 'Mini Delight Meal', total: 0 },
      { name: 'All Dinners & Snacks', total: 0 },
      { name: 'Promotions', total: 0 },
      { name: 'Sides', total: 0 },
      { name: 'Beverages & Desserts', total: 0 },
      { name: 'Simply Chicken', total: 0 },
      { name: 'Open Item', total: 0 }
    ],
    discountSummary: { percentageDiscount: 0, total: 0 },
    taxSummary: { cgst: 0, sgst: 0, gst: 0, total: 0 },
    salesReceived: {
      cash: 0,
      upi: 0,
      card: 0,
      grandTotal: 0,
      finalAmount: 0
    },
    orderTypeSummary: {
      takeout: 0,
      dineIn: 0,
      driveThrough: 0,
      total: 0
    },
    channelSummary: {
      online: 0,
      zomato: 0,
      swiggy: 0,
      pos: 0
    },
    expense: []
  }), []);

  const fetchReportsSummary = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      let branchId: string | undefined = undefined;
      if (typeof window !== 'undefined') {
        const rawBranch = localStorage.getItem('rms_branch');
        if (rawBranch) {
          try {
            const b = JSON.parse(rawBranch);
            branchId = b._id;
          } catch (e) {}
        }
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const res = await axios.get(`${apiUrl}/orders/reports-summary`, {
        params: { ...(branchId ? { branchId } : {}) },
        timeout: 10000
      });
      if (res.data.success) {
        setData(res.data.data);
      } else {
        setData(getFallbackData());
      }
    } catch (err) {
      console.warn('Backend connection issue, using fallback empty values:', err);
      setData(getFallbackData());
    } finally {
      if (showLoader) setLoading(false);
    }
  }, [getFallbackData]);

  useEffect(() => {
    fetchReportsSummary();
  }, [fetchReportsSummary]);

  if (loading || !data) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-neutral-400 font-600 text-[12px] p-12 gap-3">
        <span className="animate-spin text-2xl text-brand-primary">⏳</span>
        <span>Loading All-Time Reports Summary...</span>
      </div>
    );
  }

  const {
    completedOrders,
    cancelledOrders,
    refundOrders,
    financials,
    categorySales,
    discountSummary,
    taxSummary,
    salesReceived,
    orderTypeSummary,
    channelSummary,
    expense
  } = data;

  // Summing up expenses
  const totalGst = expense ? expense.reduce((sum: number, exp: any) => sum + (exp.gst || 0), 0) : 0;
  const totalExpenseAmount = expense ? expense.reduce((sum: number, exp: any) => sum + (exp.total || exp.amount || 0), 0) : 0;

  return (
    <div className="flex-1 overflow-y-auto space-y-6 pb-10 select-none font-sans text-neutral-900 pr-1">
      
      {/* ── Top Control Bar ── */}
      <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-neutral-700 text-[13px] font-750">
          <Calendar size={16} className="text-brand-primary" />
          <span>Report Scope: <strong className="text-neutral-900 font-900">All-Times</strong></span>
        </div>

        <div className="flex items-center gap-2.5">
          <button 
            onClick={() => fetchReportsSummary()}
            className="p-1.5 rounded-lg border border-neutral-250 bg-neutral-50 hover:bg-neutral-100 text-neutral-600 hover:text-brand-primary transition-all cursor-pointer shadow-2xs"
            title="Refresh Report"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* ── Two Column Report Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        
        {/* ==================== LEFT COLUMN ==================== */}
        <div className="space-y-6">
          
          {/* 1. SALES SUMMARY BY CATEGORY */}
          <div className="bg-white border border-neutral-200 rounded-xl shadow-xs overflow-hidden">
            <div className="bg-brand-primary text-white px-4 py-2.5 font-900 text-[12px] lg:text-[13.5px] uppercase tracking-wider flex items-center justify-between">
              <span>Sales Summary By Category</span>
              <span className="text-[10px] lg:text-[11.5px] bg-white/20 px-2 py-0.5 rounded font-700">Total</span>
            </div>
            <div className="p-0">
              <table className="w-full text-left text-[12px] lg:text-[13.5px]">
                <tbody className="divide-y divide-neutral-200/60 font-660">
                  {categorySales && categorySales.length > 0 ? (
                    categorySales.map((cat: any) => (
                      <tr key={cat.name} className="hover:bg-neutral-50/70">
                        <td className="py-2.5 px-4 text-neutral-800 font-650">{cat.name}</td>
                        <td className="py-2.5 px-4 text-right font-800 text-neutral-900 font-mono">₹{cat.total.toFixed(2)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={2} className="py-3 px-4 text-center text-neutral-400 font-500">No category records found.</td>
                    </tr>
                  )}
                  {/* Totals Section */}
                  <tr className="bg-neutral-50/80 font-800 text-neutral-900 border-t border-neutral-200">
                    <td className="py-2.5 px-4 uppercase text-[11px] tracking-wide">All Category Total</td>
                    <td className="py-2.5 px-4 text-right font-mono font-700">₹{financials.allCategoryTotal.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 text-neutral-700">Sub Total</td>
                    <td className="py-2.5 px-4 text-right font-700 text-neutral-900 font-mono">₹{financials.subTotal.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4 text-neutral-500">Delivery Charges</td>
                    <td className="py-2 px-4 text-right font-600 text-neutral-500 font-mono">₹{financials.deliveryCharges.toFixed(2)}</td>
                  </tr>

                  <tr>
                    <td className="py-2 px-4 text-neutral-700">Discount</td>
                    <td className="py-2 px-4 text-right font-700 text-amber-600 font-mono">₹{financials.discount.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4 text-neutral-700">Tax</td>
                    <td className="py-2 px-4 text-right font-700 text-neutral-900 font-mono">₹{financials.tax.toFixed(2)}</td>
                  </tr>
                  <tr className="bg-orange-50/60 font-900 text-neutral-900 border-y border-brand-primary/20">
                    <td className="py-2.5 px-4 uppercase text-[11px] tracking-wide">Grand Total</td>
                    <td className="py-2.5 px-4 text-right text-brand-primary font-900 text-sm font-mono">₹{financials.grandTotal.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4 text-neutral-500">Tips</td>
                    <td className="py-2 px-4 text-right font-600 text-neutral-500 font-mono">₹{financials.tips.toFixed(2)}</td>
                  </tr>
                  <tr className="bg-neutral-900 text-white font-900">
                    <td className="py-2.5 px-4 uppercase text-[11px] tracking-wide">Final Amount</td>
                    <td className="py-2.5 px-4 text-right text-sm text-emerald-400 font-900 font-mono">₹{financials.finalAmount.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 2. SALES RECEIVED (Indian Payment Modes: Cash, UPI, Card) */}
          <div className="bg-white border border-neutral-200 rounded-xl shadow-xs overflow-hidden">
            <div className="bg-brand-primary text-white px-4 py-2.5 font-900 text-[12px] lg:text-[13.5px] uppercase tracking-wider flex items-center justify-between">
              <span>Sales Received</span>
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded font-700">Payment Modes</span>
            </div>
            <table className="w-full text-left text-[12px] lg:text-[13.5px]">
              <thead>
                <tr className="bg-neutral-100/80 text-neutral-600 font-800 text-[10px] uppercase tracking-wider border-b border-neutral-200/80">
                  <th className="py-2 px-4">Payment Mode</th>
                  <th className="py-2 px-4 text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200/60 font-650 text-neutral-800">
                <tr>
                  <td className="py-2.5 px-4 font-700 text-neutral-800">Cash</td>
                  <td className="py-2.5 px-4 text-right font-800 text-emerald-600 font-mono">
                    ₹{(salesReceived.cash || 0).toFixed(2)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-700 text-neutral-800">UPI</td>
                  <td className="py-2.5 px-4 text-right font-800 text-indigo-600 font-mono">
                    ₹{(salesReceived.upi || 0).toFixed(2)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-700 text-neutral-800">Card</td>
                  <td className="py-2.5 px-4 text-right font-800 text-purple-700 font-mono">
                    ₹{(salesReceived.card || ((salesReceived.creditCardSales || 0) + (salesReceived.debitCardSales || 0))).toFixed(2)}
                  </td>
                </tr>
                <tr className="bg-neutral-900 text-white font-900">
                  <td className="py-2.5 px-4 uppercase text-[10.5px]">Total Collected</td>
                  <td className="py-2.5 px-4 text-right text-emerald-400 font-900 font-mono text-sm">
                    ₹{(salesReceived.grandTotal || financials.grandTotal || 0).toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 3. ORDER TYPE */}
          <div className="bg-white border border-neutral-200 rounded-xl shadow-xs overflow-hidden">
            <div className="bg-brand-primary text-white px-4 py-2.5 font-900 text-[12px] uppercase tracking-wider">
              Order Type
            </div>
            <table className="w-full text-left text-[12px]">
              <thead>
                <tr className="bg-neutral-100/80 text-neutral-600 font-800 text-[10px] uppercase tracking-wider border-b border-neutral-200/80">
                  <th className="py-2 px-4">Order Type</th>
                  <th className="py-2 px-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200/60 font-650 text-neutral-800">
                <tr>
                  <td className="py-2 px-4">Take-Out</td>
                  <td className="py-2 px-4 text-right font-700 font-mono">₹{orderTypeSummary.takeout.toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="py-2 px-4">Dine-in</td>
                  <td className="py-2 px-4 text-right font-700 font-mono">₹{orderTypeSummary.dineIn.toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="py-2 px-4">Drive Through</td>
                  <td className="py-2 px-4 text-right font-700 font-mono">₹{orderTypeSummary.driveThrough.toFixed(2)}</td>
                </tr>
                <tr className="bg-orange-50/60 font-900 text-neutral-900 border-t border-brand-primary/20">
                  <td className="py-2 px-4 uppercase text-[10.5px]">Total</td>
                  <td className="py-2 px-4 text-right text-brand-primary font-900 font-mono">₹{orderTypeSummary.total.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 4. EXPENSE */}
          <div className="bg-white border border-neutral-200 rounded-xl shadow-xs overflow-hidden">
            <div className="bg-brand-primary text-white px-4 py-2.5 font-900 text-[12px] uppercase tracking-wider flex items-center justify-between">
              <span>Expense</span>
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded font-700">Payouts</span>
            </div>
            <table className="w-full text-left text-[12px]">
              <thead>
                <tr className="bg-neutral-100/80 text-neutral-600 font-800 text-[10px] uppercase tracking-wider border-b border-neutral-200/80">
                  <th className="py-2 px-4">Payee / Description</th>
                  <th className="py-2 px-4 text-center">Mode</th>
                  <th className="py-2 px-4 text-center">GST (₹)</th>
                  <th className="py-2 px-4 text-right">Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200/60 font-650 text-neutral-800">
                {expense && expense.length > 0 ? (
                  <>
                    {expense.map((exp: any, idx: number) => (
                      <tr key={idx} className="hover:bg-neutral-50/70">
                        <td className="py-2.5 px-4 font-700 text-neutral-900">{exp.employee || exp.employeeName || 'Store Expense'}</td>
                        <td className="py-2.5 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-800 uppercase tracking-wider ${exp.paymentMode === 'card' ? 'bg-purple-100 text-purple-800 border border-purple-200' : exp.paymentMode === 'upi' ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'}`}>
                            {exp.paymentMode || 'cash'}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-center text-neutral-500 font-mono">₹{Number(exp.gst || 0).toFixed(2)}</td>
                        <td className="py-2.5 px-4 text-right font-800 text-brand-primary font-mono">₹{Number(exp.total || exp.amount || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                    {/* Totals Section */}
                    <tr className="bg-neutral-50/80 font-800 text-neutral-900 border-t border-neutral-200">
                      <td colSpan={2} className="py-2.5 px-4 uppercase text-[10px] tracking-wide font-900">Total</td>
                      <td className="py-2.5 px-4 text-center text-neutral-900 font-900 font-mono">₹{totalGst.toFixed(2)}</td>
                      <td className="py-2.5 px-4 text-right text-brand-primary font-900 font-mono">₹{totalExpenseAmount.toFixed(2)}</td>
                    </tr>
                  </>
                ) : (
                  <tr>
                    <td colSpan={4} className="py-3 px-4 text-center text-neutral-400 font-600">No Record Found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>

        {/* ==================== RIGHT COLUMN ==================== */}
        <div className="space-y-6">
          
          {/* 1. COMPLETED ORDERS */}
          <div className="bg-white border border-neutral-200 rounded-xl shadow-xs overflow-hidden">
            <div className="bg-brand-primary text-white px-4 py-2.5 font-900 text-[12px] uppercase tracking-wider">
              Completed Orders
            </div>
            <table className="w-full text-left text-[12px]">
              <thead>
                <tr className="bg-neutral-100/80 text-neutral-600 font-800 text-[10px] uppercase tracking-wider border-b border-neutral-100">
                  <th className="py-2 px-4">Payment Status</th>
                  <th className="py-2 px-4 text-center"># Of Orders</th>
                  <th className="py-2 px-4 text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-650 text-neutral-800">
                <tr>
                  <td className="py-2.5 px-4 font-700 text-emerald-600 flex items-center gap-1.5">
                    <CheckCircle size={14} />
                    <span>Paid</span>
                  </td>
                  <td className="py-2.5 px-4 text-center font-800 bg-neutral-50">{completedOrders.count}</td>
                  <td className="py-2.5 px-4 text-right font-800 text-emerald-600 font-mono">₹{completedOrders.totalAmount.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 2. CANCELLED ORDERS */}
          <div className="bg-white border border-neutral-200 rounded-xl shadow-xs overflow-hidden">
            <div className="bg-brand-primary text-white px-4 py-2.5 font-900 text-[12px] uppercase tracking-wider">
              Cancelled Orders
            </div>
            <table className="w-full text-left text-[12px]">
              <thead>
                <tr className="bg-neutral-100/80 text-neutral-600 font-800 text-[10px] uppercase tracking-wider border-b border-neutral-100">
                  <th className="py-2 px-4">Payment Status</th>
                  <th className="py-2 px-4 text-center"># Of Orders</th>
                  <th className="py-2 px-4 text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody>
                {cancelledOrders && cancelledOrders.count > 0 ? (
                  <tr className="font-650 text-neutral-800">
                    <td className="py-2.5 px-4 font-700 text-red-600 flex items-center gap-1.5">
                      <XCircle size={14} />
                      <span>Cancelled</span>
                    </td>
                    <td className="py-2.5 px-4 text-center font-800 bg-neutral-50">{cancelledOrders.count}</td>
                    <td className="py-2.5 px-4 text-right font-800 text-red-600 font-mono">₹{cancelledOrders.totalAmount.toFixed(2)}</td>
                  </tr>
                ) : (
                  <tr>
                    <td colSpan={3} className="py-3 px-4 text-center text-neutral-400 font-600">No Record Found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* 3. REFUND ORDERS */}
          <div className="bg-white border border-neutral-200 rounded-xl shadow-xs overflow-hidden">
            <div className="bg-brand-primary text-white px-4 py-2.5 font-900 text-[12px] uppercase tracking-wider">
              Refund Orders
            </div>
            <table className="w-full text-left text-[12px]">
              <thead>
                <tr className="bg-neutral-100 text-neutral-600 font-800 text-[10px] uppercase tracking-wider border-b border-neutral-200">
                  <th className="py-2 px-4 text-center"># Of Refund Orders</th>
                  <th className="py-2 px-4 text-right">Total Refund Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={2} className="py-3 px-4 text-center text-neutral-400 font-600">No Record Found.</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 4. DISCOUNT & PROMO SUMMARY */}
          <div className="bg-white border border-neutral-200 rounded-xl shadow-xs overflow-hidden">
            <div className="bg-brand-primary text-white px-4 py-2.5 font-900 text-[12px] uppercase tracking-wider">
              Discount & Promo Summary
            </div>
            <table className="w-full text-left text-[12px]">
              <thead>
                <tr className="bg-neutral-100/80 text-neutral-600 font-800 text-[10px] uppercase tracking-wider border-b border-neutral-200/80">
                  <th className="py-2 px-4">Description</th>
                  <th className="py-2 px-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200/60 font-650 text-neutral-800">
                <tr>
                  <td className="py-2 px-4">Discount</td>
                  <td className="py-2 px-4 text-right font-700 text-amber-600 font-mono">₹{discountSummary.percentageDiscount.toFixed(2)}</td>
                </tr>
                <tr className="bg-neutral-50 font-900 text-neutral-900 border-t border-neutral-200/80">
                  <td className="py-2 px-4 uppercase text-[10.5px]">Total</td>
                  <td className="py-2 px-4 text-right text-amber-600 font-900 font-mono">₹{discountSummary.total.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 5. TAX SUMMARY (Indian GST: CGST + SGST) */}
          <div className="bg-white border border-neutral-200 rounded-xl shadow-xs overflow-hidden">
            <div className="bg-brand-primary text-white px-4 py-2.5 font-900 text-[12px] uppercase tracking-wider flex items-center justify-between">
              <span>GST Tax Summary</span>
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded font-700">Indian GST</span>
            </div>
            <table className="w-full text-left text-[12px]">
              <thead>
                <tr className="bg-neutral-100/80 text-neutral-600 font-800 text-[10px] uppercase tracking-wider border-b border-neutral-200/80">
                  <th className="py-2 px-4">Component</th>
                  <th className="py-2 px-4 text-right">Tax Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200/60 font-650 text-neutral-800">
                <tr>
                  <td className="py-2.5 px-4 font-700 text-neutral-800">CGST (Central Tax)</td>
                  <td className="py-2.5 px-4 text-right font-700 text-neutral-900 font-mono">
                    ₹{((taxSummary.cgst !== undefined ? taxSummary.cgst : (taxSummary.gst || taxSummary.total || 0) / 2)).toFixed(2)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-700 text-neutral-800">SGST (State Tax)</td>
                  <td className="py-2.5 px-4 text-right font-700 text-neutral-900 font-mono">
                    ₹{((taxSummary.sgst !== undefined ? taxSummary.sgst : (taxSummary.gst || taxSummary.total || 0) / 2)).toFixed(2)}
                  </td>
                </tr>
                <tr className="bg-neutral-900 text-white font-900 border-t border-neutral-200/80">
                  <td className="py-2.5 px-4 uppercase text-[10.5px]">Total GST Collected</td>
                  <td className="py-2.5 px-4 text-right font-900 font-mono text-emerald-400">
                    ₹{(taxSummary.total || taxSummary.gst || 0).toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 7. ORDER TYPE (Channel Breakdown - Online vs POS) */}
          <div className="bg-white border border-neutral-200 rounded-xl shadow-xs overflow-hidden">
            <div className="bg-brand-primary text-white px-4 py-2.5 font-900 text-[12px] uppercase tracking-wider">
              Order Channel Breakdown
            </div>

            <div className="p-4 space-y-3">
              {/* Online & Food Aggregators */}
              <div className="border border-neutral-200 rounded-lg overflow-hidden">
                <div className="bg-neutral-100 px-3 py-1 font-800 text-[11px] uppercase text-neutral-700 flex items-center justify-between">
                  <span>Aggregators & Online</span>
                </div>
                <table className="w-full text-left text-[12px]">
                  <tbody className="divide-y divide-neutral-200/60">
                    <tr>
                      <td className="py-2 px-3 font-650 text-neutral-700">Direct Online (Website / App)</td>
                      <td className="py-2 px-3 text-right font-700 text-blue-700 font-mono">₹{(channelSummary.online || 0).toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-650 text-neutral-700">Zomato</td>
                      <td className="py-2 px-3 text-right font-700 text-red-600 font-mono">₹{(channelSummary.zomato || channelSummary.doordash || 0).toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-650 text-neutral-700">Swiggy</td>
                      <td className="py-2 px-3 text-right font-700 text-orange-600 font-mono">₹{(channelSummary.swiggy || channelSummary.skip || 0).toFixed(2)}</td>
                    </tr>
                    <tr className="bg-neutral-50 font-900 border-t border-neutral-200/80">
                      <td className="py-2 px-3 uppercase text-[10px]">Total Aggregators & Online</td>
                      <td className="py-2 px-3 text-right text-brand-primary font-900 font-mono">
                        ₹{(
                          (channelSummary.online || 0) +
                          (channelSummary.zomato || channelSummary.doordash || 0) +
                          (channelSummary.swiggy || channelSummary.skip || 0)
                        ).toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              {/* POS */}
              <div className="border border-neutral-200 rounded-lg overflow-hidden">
                <div className="bg-neutral-100 px-3 py-1 font-800 text-[11px] uppercase text-neutral-700 flex items-center justify-between">
                  <span>In-Store Terminal</span>
                </div>
                <table className="w-full text-left text-[12px]">
                  <tbody className="divide-y divide-neutral-200/60">
                    <tr>
                      <td className="py-2 px-3 font-650 text-neutral-700">POS Terminal (Dine-in / Counter)</td>
                      <td className="py-2 px-3 text-right font-700 text-purple-700 font-mono">₹{(channelSummary.pos || 0).toFixed(2)}</td>
                    </tr>
                    <tr className="bg-neutral-50 font-900 border-t border-neutral-200/80">
                      <td className="py-2 px-3 uppercase text-[10px]">Total In-Store</td>
                      <td className="py-2 px-3 text-right text-brand-primary font-900 font-mono">₹{(channelSummary.pos || 0).toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
