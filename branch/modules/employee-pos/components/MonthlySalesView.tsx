'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { BarChart3, AlertCircle } from 'lucide-react';

interface MonthlySalesRow {
  date: string;
  rawDate: string;
  salesSummary: {
    subtotal: number;
    deliveryCharges: number;
    debitCharges?: number;
    discount: number;
    tax: number;
    grandTotal: number;
    tips: number;
    finalAmount: number;
  };
  paymentType: {
    cash: number;
    upi?: number;
    card?: number;
    accountPay?: number;
    creditCardSales?: number;
    debitCardSales?: number;
    grandTotal: number;
    debitTips?: number;
    creditTips?: number;
    finalAmount: number;
  };
  orderType: {
    takeout: number;
    dineIn: number;
    delivery: number;
    driveThrough: number;
    total: number;
  };
  orders: {
    completed: number;
    paidCancelled: number;
    unpaidCancelled: number;
    refund: number;
    refundAmount: number;
  };
  taxBreakdown: {
    cgst?: number;
    sgst?: number;
    pst?: number;
    gst: number;
    hst?: number;
    total: number;
  };
  online: {
    website: number;
    zomato?: number;
    swiggy?: number;
    uber?: number;
    skip?: number;
    doordash?: number;
    total: number;
  };
  pos: {
    posSales: number;
    total: number;
  };
  expense: {
    amount: number;
  };
  shortage: {
    shortage: number;
    overage: number;
  };
  deposit: {
    cash: number;
    card: number;
    accountPay: number;
  };
}

interface MonthlySalesViewProps {
  startDate: string;
  endDate: string;
}

export default function MonthlySalesView({ startDate, endDate }: MonthlySalesViewProps) {
  const [data, setData] = useState<MonthlySalesRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMonthlySales = async () => {
    try {
      setLoading(true);
      setError(null);
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
      const res = await axios.get(`${apiUrl}/orders/monthly-sales-summary`, {
        params: { startDate, endDate, ...(branchId ? { branchId } : {}) }
      });
      if (res.data && res.data.success) {
        setData(res.data.data || []);
      } else {
        setError('Failed to fetch monthly sales summary');
      }
    } catch (err: any) {
      console.error('Error fetching monthly sales summary:', err);
      setError(err.response?.data?.message || 'Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthlySales();
  }, [startDate, endDate]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-neutral-400 font-750 text-[12px] gap-2 py-20 select-none">
        <span className="animate-spin text-2xl text-brand-primary">⏳</span>
        <span>Generating monthly sales accounting records...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 bg-white border border-neutral-200 rounded-xl p-8 text-center space-y-4 max-w-4xl font-sans select-none mx-auto">
        <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-500 border border-red-100">
          <AlertCircle size={24} />
        </div>
        <div className="max-w-md mx-auto space-y-2">
          <h3 className="font-800 text-neutral-800 text-sm">Failed to Load Report</h3>
          <p className="text-[11px] text-neutral-500 font-550 leading-relaxed">{error}</p>
        </div>
        <button
          onClick={fetchMonthlySales}
          className="px-6 py-2 bg-brand-primary hover:bg-brand-primary-hover active:scale-95 text-white font-800 text-[11px] uppercase tracking-wider rounded-xl shadow-xs transition-all cursor-pointer"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex-1 bg-white border border-neutral-200 rounded-xl p-12 text-center space-y-4 max-w-4xl font-sans select-none mx-auto">
        <div className="w-14 h-14 bg-neutral-50 rounded-full flex items-center justify-center mx-auto text-neutral-400 border border-neutral-100">
          <BarChart3 size={28} />
        </div>
        <div className="max-w-md mx-auto">
          <h3 className="font-800 text-neutral-800 text-sm">No Sales Records Found</h3>
          <p className="text-[11px] text-neutral-500 font-550 mt-1">
            There are no orders placed within the selected period.
          </p>
        </div>
      </div>
    );
  }

  const totals = data.reduce(
    (acc, row) => {
      acc.salesSummary.subtotal += row.salesSummary.subtotal;
      acc.salesSummary.deliveryCharges += row.salesSummary.deliveryCharges;
      acc.salesSummary.discount += row.salesSummary.discount;
      acc.salesSummary.tax += row.salesSummary.tax;
      acc.salesSummary.grandTotal += row.salesSummary.grandTotal;
      acc.salesSummary.tips += row.salesSummary.tips;
      acc.salesSummary.finalAmount += row.salesSummary.finalAmount;

      acc.paymentType.cash += row.paymentType.cash || 0;
      acc.paymentType.upi += (row.paymentType.upi || 0);
      acc.paymentType.card += (row.paymentType.card || ((row.paymentType.creditCardSales || 0) + (row.paymentType.debitCardSales || 0)));
      acc.paymentType.grandTotal += row.paymentType.grandTotal;
      acc.paymentType.finalAmount += row.paymentType.finalAmount;

      acc.orderType.takeout += row.orderType.takeout;
      acc.orderType.dineIn += row.orderType.dineIn;
      acc.orderType.delivery += row.orderType.delivery;
      acc.orderType.driveThrough += row.orderType.driveThrough;
      acc.orderType.total += row.orderType.total;

      acc.orders.completed += row.orders.completed;
      acc.orders.paidCancelled += row.orders.paidCancelled;
      acc.orders.unpaidCancelled += row.orders.unpaidCancelled;
      acc.orders.refund += row.orders.refund;
      acc.orders.refundAmount += row.orders.refundAmount;

      acc.taxBreakdown.cgst += (row.taxBreakdown.cgst !== undefined ? row.taxBreakdown.cgst : (row.taxBreakdown.gst || row.taxBreakdown.total || 0) / 2);
      acc.taxBreakdown.sgst += (row.taxBreakdown.sgst !== undefined ? row.taxBreakdown.sgst : (row.taxBreakdown.gst || row.taxBreakdown.total || 0) / 2);
      acc.taxBreakdown.total += (row.taxBreakdown.total || row.taxBreakdown.gst || 0);

      acc.online.website += row.online.website;
      acc.online.zomato += (row.online.zomato || row.online.doordash || 0);
      acc.online.swiggy += (row.online.swiggy || row.online.skip || 0);
      acc.online.total += ((row.online.website || 0) + (row.online.zomato || row.online.doordash || 0) + (row.online.swiggy || row.online.skip || 0));

      acc.pos.posSales += row.pos.posSales;
      acc.pos.total += row.pos.total;

      acc.expense.amount += row.expense.amount;

      acc.shortage.shortage += (row.shortage?.shortage || 0);
      acc.shortage.overage += (row.shortage?.overage || 0);

      acc.deposit.cash += row.deposit.cash;
      acc.deposit.card += row.deposit.card;
      acc.deposit.accountPay += row.deposit.accountPay;

      return acc;
    },
    {
      salesSummary: { subtotal: 0, deliveryCharges: 0, discount: 0, tax: 0, grandTotal: 0, tips: 0, finalAmount: 0 },
      paymentType: { cash: 0, upi: 0, card: 0, grandTotal: 0, finalAmount: 0 },
      orderType: { takeout: 0, dineIn: 0, delivery: 0, driveThrough: 0, total: 0 },
      orders: { completed: 0, paidCancelled: 0, unpaidCancelled: 0, refund: 0, refundAmount: 0 },
      taxBreakdown: { cgst: 0, sgst: 0, total: 0 },
      online: { website: 0, zomato: 0, swiggy: 0, total: 0 },
      pos: { posSales: 0, total: 0 },
      expense: { amount: 0 },
      shortage: { shortage: 0, overage: 0 },
      deposit: { cash: 0, card: 0, accountPay: 0 }
    }
  );

  return (
    <div className="flex-1 overflow-hidden flex flex-col font-sans text-neutral-900 pr-1 select-none">
      {/* Scrollbar Styling */}
      <style jsx global>{`
        .table-scrollbar::-webkit-scrollbar {
          height: 9px;
          width: 9px;
        }
        .table-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        .table-scrollbar::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 4px;
        }
        .table-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
      `}</style>

      {/* Main Responsive Table Wrapper */}
      <div className="flex-1 bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="flex-1 overflow-x-auto overflow-y-auto table-scrollbar relative">
          <table className="min-w-[3200px] text-left text-[11px] whitespace-nowrap border-collapse">
            
            {/* Header */}
            <thead className="sticky top-0 z-20 bg-neutral-900 text-white font-850 shadow-sm">
              {/* Row 1: Super Headers */}
              <tr className="border-b border-neutral-800 text-[10.5px] uppercase tracking-wider text-center">
                <th className="sticky left-0 z-30 bg-neutral-900 text-neutral-300 py-2 px-3.5 border-r-2 border-neutral-350 w-[110px]">Date</th>
                <th colSpan={7} className="bg-stone-850/90 text-stone-200 border-r-2 border-neutral-350 w-[740px]">Sales Summary</th>
                <th colSpan={4} className="bg-teal-950/70 text-teal-200 border-r-2 border-neutral-350 w-[450px]">Payment Modes (India)</th>
                <th colSpan={5} className="bg-cyan-950/70 text-cyan-200 border-r-2 border-neutral-350 w-[500px]">Order Type</th>
                <th colSpan={5} className="bg-slate-900/80 text-slate-300 border-r-2 border-neutral-350 w-[450px]">Orders</th>
                <th colSpan={3} className="bg-emerald-950/70 text-emerald-200 border-r-2 border-neutral-350 w-[330px]">GST Tax (CGST + SGST)</th>
                <th colSpan={4} className="bg-pink-950/70 text-pink-200 border-r-2 border-neutral-350 w-[440px]">Aggregators & Online</th>
                <th colSpan={2} className="bg-purple-950/70 text-purple-200 border-r-2 border-neutral-350 w-[220px]">POS Terminal</th>
                <th className="bg-lime-900/70 text-lime-100 border-r-2 border-neutral-350 w-[100px]">Expense</th>
                <th colSpan={2} className="bg-rose-950/70 text-rose-200 border-r-2 border-neutral-350 w-[200px]">Shortage / Overage</th>
                <th colSpan={3} className="bg-amber-950/70 text-amber-200 w-[320px]">Deposit</th>
              </tr>

              {/* Row 2: Sub Columns */}
              <tr className="bg-neutral-800 text-white font-800 text-[9.5px] uppercase tracking-wide border-b border-neutral-700">
                <th className="sticky left-0 z-30 bg-neutral-900 py-2.5 px-3.5 border-r-2 border-neutral-350 text-center w-[110px]">Report Date</th>
                <th className="py-2.5 px-3 text-right w-[100px] border-r border-neutral-700">Sub Total</th>
                <th className="py-2.5 px-3 text-right w-[100px] border-r border-neutral-700">Delivery</th>
                <th className="py-2.5 px-3 text-right w-[100px] border-r border-neutral-700">Discount</th>
                <th className="py-2.5 px-3 text-right w-[80px] border-r border-neutral-700">Tax</th>
                <th className="py-2.5 px-3 text-right w-[110px] border-r border-neutral-700">Grand Total</th>
                <th className="py-2.5 px-3 text-right w-[90px] border-r border-neutral-700">Tips</th>
                <th className="py-2.5 px-3 text-right border-r-2 border-neutral-350 w-[140px]">Final Amount</th>
                <th className="py-2.5 px-3 text-right w-[110px] border-r border-neutral-700">Cash</th>
                <th className="py-2.5 px-3 text-right w-[110px] border-r border-neutral-700">UPI</th>
                <th className="py-2.5 px-3 text-right w-[110px] border-r border-neutral-700">Card</th>
                <th className="py-2.5 px-3 text-right border-r-2 border-neutral-350 w-[120px]">Total Collected</th>
                <th className="py-2.5 px-3 text-right w-[100px] border-r border-neutral-700">Takeout</th>
                <th className="py-2.5 px-3 text-right w-[100px] border-r border-neutral-700">Dine-in</th>
                <th className="py-2.5 px-3 text-right w-[100px] border-r border-neutral-700">Delivery</th>
                <th className="py-2.5 px-3 text-right w-[100px] border-r border-neutral-700">Drive-Thru</th>
                <th className="py-2.5 px-3 text-right border-r-2 border-neutral-350 w-[100px]">Total</th>
                <th className="py-2.5 px-3 text-center w-[90px] border-r border-neutral-700">Completed</th>
                <th className="py-2.5 px-3 text-center w-[90px] border-r border-neutral-700">Paid Cancel</th>
                <th className="py-2.5 px-3 text-center w-[100px] border-r border-neutral-700">Unpaid Cancel</th>
                <th className="py-2.5 px-3 text-center w-[80px] border-r border-neutral-700">Refund</th>
                <th className="py-2.5 px-3 text-right border-r-2 border-neutral-350 w-[90px]">Refund Amt</th>
                <th className="py-2.5 px-3 text-right w-[100px] border-r border-neutral-700">CGST</th>
                <th className="py-2.5 px-3 text-right w-[100px] border-r border-neutral-700">SGST</th>
                <th className="py-2.5 px-3 text-right border-r-2 border-neutral-350 w-[130px]">Total GST</th>
                <th className="py-2.5 px-3 text-right w-[110px] border-r border-neutral-700">Direct Online</th>
                <th className="py-2.5 px-3 text-right w-[110px] border-r border-neutral-700">Zomato</th>
                <th className="py-2.5 px-3 text-right w-[110px] border-r border-neutral-700">Swiggy</th>
                <th className="py-2.5 px-3 text-right border-r-2 border-neutral-350 w-[110px]">Total</th>
                <th className="py-2.5 px-3 text-right w-[110px] border-r border-neutral-700">POS Sales</th>
                <th className="py-2.5 px-3 text-right border-r-2 border-neutral-350 w-[110px]">Total</th>
                <th className="py-2.5 px-3 text-right border-r-2 border-neutral-350 w-[100px]">Expense</th>
                <th className="py-2.5 px-3 text-right w-[100px] border-r border-neutral-700">Shortage</th>
                <th className="py-2.5 px-3 text-right border-r-2 border-neutral-350 w-[100px]">Overage</th>
                <th className="py-2.5 px-3 text-right w-[100px] border-r border-neutral-700">Cash</th>
                <th className="py-2.5 px-3 text-right w-[100px] border-r border-neutral-700">Card</th>
                <th className="py-2.5 px-3 text-right w-[120px]">Account Pay</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-neutral-200 font-650 text-neutral-850">
              {data.map((row, idx) => {
                const cgstVal = row.taxBreakdown.cgst !== undefined ? row.taxBreakdown.cgst : (row.taxBreakdown.gst || row.taxBreakdown.total || 0) / 2;
                const sgstVal = row.taxBreakdown.sgst !== undefined ? row.taxBreakdown.sgst : (row.taxBreakdown.gst || row.taxBreakdown.total || 0) / 2;
                const totalGstVal = row.taxBreakdown.total || row.taxBreakdown.gst || 0;

                const upiVal = row.paymentType.upi || 0;
                const cardVal = row.paymentType.card || ((row.paymentType.creditCardSales || 0) + (row.paymentType.debitCardSales || 0));
                const totalCollectedVal = row.paymentType.grandTotal || (row.paymentType.cash + upiVal + cardVal);

                const zomatoVal = row.online.zomato || row.online.doordash || 0;
                const swiggyVal = row.online.swiggy || row.online.skip || 0;
                const onlineTotalVal = (row.online.website || 0) + zomatoVal + swiggyVal;

                return (
                  <tr key={idx} className="even:bg-neutral-50 hover:bg-neutral-100 transition-colors h-9">
                    <td className="sticky left-0 z-10 bg-white group-even:bg-[#F9FAFB] group-hover:bg-[#F3F4F6] py-1.5 px-3.5 border-r-2 border-neutral-350 text-center font-800 text-neutral-900">{row.date}</td>
                    <td className="py-1.5 px-3 text-right border-r border-neutral-200 font-mono">₹{row.salesSummary.subtotal.toFixed(2)}</td>
                    <td className="py-1.5 px-3 text-right border-r border-neutral-200 font-mono">₹{row.salesSummary.deliveryCharges.toFixed(2)}</td>
                    <td className="py-1.5 px-3 text-right border-r border-neutral-200 text-rose-600 font-mono">(₹{row.salesSummary.discount.toFixed(2)})</td>
                    <td className="py-1.5 px-3 text-right border-r border-neutral-200 font-mono">₹{row.salesSummary.tax.toFixed(2)}</td>
                    <td className="py-1.5 px-3 text-right border-r border-neutral-200 font-mono">₹{row.salesSummary.grandTotal.toFixed(2)}</td>
                    <td className="py-1.5 px-3 text-right border-r border-neutral-200 font-mono">₹{row.salesSummary.tips.toFixed(2)}</td>
                    <td className="py-1.5 px-3 text-right border-r-2 border-neutral-350 font-800 text-neutral-900 font-mono">₹{row.salesSummary.finalAmount.toFixed(2)}</td>
                    
                    {/* Payment Modes */}
                    <td className="py-1.5 px-3 text-right border-r border-neutral-200 font-mono text-emerald-700 font-700">₹{row.paymentType.cash.toFixed(2)}</td>
                    <td className="py-1.5 px-3 text-right border-r border-neutral-200 font-mono text-indigo-700 font-700">₹{upiVal.toFixed(2)}</td>
                    <td className="py-1.5 px-3 text-right border-r border-neutral-200 font-mono text-purple-700 font-700">₹{cardVal.toFixed(2)}</td>
                    <td className="py-1.5 px-3 text-right border-r-2 border-neutral-350 font-800 text-neutral-900 font-mono">₹{totalCollectedVal.toFixed(2)}</td>

                    {/* Order Type */}
                    <td className="py-1.5 px-3 text-right border-r border-neutral-200 font-mono">₹{row.orderType.takeout.toFixed(2)}</td>
                    <td className="py-1.5 px-3 text-right border-r border-neutral-200 font-mono">₹{row.orderType.dineIn.toFixed(2)}</td>
                    <td className="py-1.5 px-3 text-right border-r border-neutral-200 font-mono">₹{row.orderType.delivery.toFixed(2)}</td>
                    <td className="py-1.5 px-3 text-right border-r border-neutral-200 font-mono">₹{row.orderType.driveThrough.toFixed(2)}</td>
                    <td className="py-1.5 px-3 text-right border-r-2 border-neutral-350 font-800 text-neutral-900 font-mono">₹{row.orderType.total.toFixed(2)}</td>

                    {/* Orders Status Counts */}
                    <td className="py-1.5 px-3 text-center border-r border-neutral-200">{row.orders.completed}</td>
                    <td className="py-1.5 px-3 text-center border-r border-neutral-200">{row.orders.paidCancelled}</td>
                    <td className="py-1.5 px-3 text-center border-r border-neutral-200">{row.orders.unpaidCancelled}</td>
                    <td className="py-1.5 px-3 text-center border-r border-neutral-200">{row.orders.refund}</td>
                    <td className="py-1.5 px-3 text-right border-r-2 border-neutral-350 font-mono">₹{row.orders.refundAmount.toFixed(2)}</td>

                    {/* Tax Breakdown */}
                    <td className="py-1.5 px-3 text-right border-r border-neutral-200 font-mono">₹{cgstVal.toFixed(2)}</td>
                    <td className="py-1.5 px-3 text-right border-r border-neutral-200 font-mono">₹{sgstVal.toFixed(2)}</td>
                    <td className="py-1.5 px-3 text-right border-r-2 border-neutral-350 font-800 text-neutral-900 font-mono">₹{totalGstVal.toFixed(2)}</td>

                    {/* Aggregators & Online */}
                    <td className="py-1.5 px-3 text-right border-r border-neutral-200 font-mono text-blue-700">₹{row.online.website.toFixed(2)}</td>
                    <td className="py-1.5 px-3 text-right border-r border-neutral-200 font-mono text-red-600">₹{zomatoVal.toFixed(2)}</td>
                    <td className="py-1.5 px-3 text-right border-r border-neutral-200 font-mono text-orange-600">₹{swiggyVal.toFixed(2)}</td>
                    <td className="py-1.5 px-3 text-right border-r-2 border-neutral-350 font-800 text-neutral-900 font-mono">₹{onlineTotalVal.toFixed(2)}</td>

                    {/* POS */}
                    <td className="py-1.5 px-3 text-right border-r border-neutral-200 font-mono">₹{row.pos.posSales.toFixed(2)}</td>
                    <td className="py-1.5 px-3 text-right border-r-2 border-neutral-350 font-800 text-neutral-900 font-mono">₹{row.pos.total.toFixed(2)}</td>

                    {/* Expense, Shortage, Deposit */}
                    <td className="py-1.5 px-3 text-right border-r-2 border-neutral-350 font-800 text-amber-700 font-mono">₹{row.expense.amount.toFixed(2)}</td>
                    <td className="py-1.5 px-3 text-right border-r border-neutral-200 text-rose-600 font-mono">₹{(row.shortage?.shortage || 0).toFixed(2)}</td>
                    <td className="py-1.5 px-3 text-right border-r-2 border-neutral-350 text-emerald-600 font-mono">₹{(row.shortage?.overage || 0).toFixed(2)}</td>
                    <td className="py-1.5 px-3 text-right border-r border-neutral-200 font-mono">₹{row.deposit.cash.toFixed(2)}</td>
                    <td className="py-1.5 px-3 text-right border-r border-neutral-200 font-mono">₹{row.deposit.card.toFixed(2)}</td>
                    <td className="py-1.5 px-3 text-right font-mono">₹{row.deposit.accountPay.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>

            <tfoot className="sticky bottom-0 z-10 bg-brand-primary text-white font-900">
              <tr className="h-10">
                <td className="sticky left-0 z-30 bg-brand-primary border-r-2 border-neutral-300/40 text-center uppercase tracking-wide">Total</td>
                <td className="py-2.5 px-3 text-right border-r border-neutral-300/20 font-mono">₹{totals.salesSummary.subtotal.toFixed(2)}</td>
                <td className="py-2.5 px-3 text-right border-r border-neutral-300/20 font-mono">₹{totals.salesSummary.deliveryCharges.toFixed(2)}</td>
                <td className="py-2.5 px-3 text-right border-r border-neutral-300/20 font-mono">(₹{totals.salesSummary.discount.toFixed(2)})</td>
                <td className="py-2.5 px-3 text-right border-r border-neutral-300/20 font-mono">₹{totals.salesSummary.tax.toFixed(2)}</td>
                <td className="py-2.5 px-3 text-right border-r border-neutral-300/20 font-mono">₹{totals.salesSummary.grandTotal.toFixed(2)}</td>
                <td className="py-2.5 px-3 text-right border-r border-neutral-300/20 font-mono">₹{totals.salesSummary.tips.toFixed(2)}</td>
                <td className="py-2.5 px-3 text-right border-r-2 border-neutral-350/50 font-mono">₹{totals.salesSummary.finalAmount.toFixed(2)}</td>

                {/* Totals: Payment Modes */}
                <td className="py-2.5 px-3 text-right border-r border-neutral-300/20 font-mono">₹{totals.paymentType.cash.toFixed(2)}</td>
                <td className="py-2.5 px-3 text-right border-r border-neutral-300/20 font-mono">₹{totals.paymentType.upi.toFixed(2)}</td>
                <td className="py-2.5 px-3 text-right border-r border-neutral-300/20 font-mono">₹{totals.paymentType.card.toFixed(2)}</td>
                <td className="py-2.5 px-3 text-right border-r-2 border-neutral-350/50 font-mono">₹{(totals.paymentType.cash + totals.paymentType.upi + totals.paymentType.card).toFixed(2)}</td>

                {/* Totals: Order Type */}
                <td className="py-2.5 px-3 text-right border-r border-neutral-300/20 font-mono">₹{totals.orderType.takeout.toFixed(2)}</td>
                <td className="py-2.5 px-3 text-right border-r border-neutral-300/20 font-mono">₹{totals.orderType.dineIn.toFixed(2)}</td>
                <td className="py-2.5 px-3 text-right border-r border-neutral-300/20 font-mono">₹{totals.orderType.delivery.toFixed(2)}</td>
                <td className="py-2.5 px-3 text-right border-r border-neutral-300/20 font-mono">₹{totals.orderType.driveThrough.toFixed(2)}</td>
                <td className="py-2.5 px-3 text-right border-r-2 border-neutral-350/50 font-mono">₹{totals.orderType.total.toFixed(2)}</td>

                {/* Totals: Orders */}
                <td className="py-2.5 px-3 text-center border-r border-neutral-300/20">{totals.orders.completed}</td>
                <td className="py-2.5 px-3 text-center border-r border-neutral-300/20">{totals.orders.paidCancelled}</td>
                <td className="py-2.5 px-3 text-center border-r border-neutral-300/20">{totals.orders.unpaidCancelled}</td>
                <td className="py-2.5 px-3 text-center border-r border-neutral-300/20">{totals.orders.refund}</td>
                <td className="py-2.5 px-3 text-right border-r-2 border-neutral-350/50 font-mono">₹{totals.orders.refundAmount.toFixed(2)}</td>

                {/* Totals: Tax */}
                <td className="py-2.5 px-3 text-right border-r border-neutral-300/20 font-mono">₹{totals.taxBreakdown.cgst.toFixed(2)}</td>
                <td className="py-2.5 px-3 text-right border-r border-neutral-300/20 font-mono">₹{totals.taxBreakdown.sgst.toFixed(2)}</td>
                <td className="py-2.5 px-3 text-right border-r-2 border-neutral-350/50 font-mono">₹{totals.taxBreakdown.total.toFixed(2)}</td>

                {/* Totals: Aggregators */}
                <td className="py-2.5 px-3 text-right border-r border-neutral-300/20 font-mono">₹{totals.online.website.toFixed(2)}</td>
                <td className="py-2.5 px-3 text-right border-r border-neutral-300/20 font-mono">₹{totals.online.zomato.toFixed(2)}</td>
                <td className="py-2.5 px-3 text-right border-r border-neutral-300/20 font-mono">₹{totals.online.swiggy.toFixed(2)}</td>
                <td className="py-2.5 px-3 text-right border-r-2 border-neutral-350/50 font-mono">₹{totals.online.total.toFixed(2)}</td>

                {/* Totals: POS */}
                <td className="py-2.5 px-3 text-right border-r border-neutral-300/20 font-mono">₹{totals.pos.posSales.toFixed(2)}</td>
                <td className="py-2.5 px-3 text-right border-r-2 border-neutral-350/50 font-mono">₹{totals.pos.total.toFixed(2)}</td>

                {/* Totals: Expense, Shortage, Deposit */}
                <td className="py-2.5 px-3 text-right border-r-2 border-neutral-350/50 font-mono">₹{totals.expense.amount.toFixed(2)}</td>
                <td className="py-2.5 px-3 text-right border-r border-neutral-300/20 font-mono">₹{totals.shortage.shortage.toFixed(2)}</td>
                <td className="py-2.5 px-3 text-right border-r-2 border-neutral-350/50 font-mono">₹{totals.shortage.overage.toFixed(2)}</td>
                <td className="py-2.5 px-3 text-right border-r border-neutral-300/20 font-mono">₹{totals.deposit.cash.toFixed(2)}</td>
                <td className="py-2.5 px-3 text-right border-r border-neutral-300/20 font-mono">₹{totals.deposit.card.toFixed(2)}</td>
                <td className="py-2.5 px-3 text-right font-mono">₹{totals.deposit.accountPay.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
