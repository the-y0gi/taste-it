'use client';

import React, { useState, useEffect } from 'react';
import {
  Eye,
  Printer,
  IndianRupee,
  Utensils,
  ShoppingBag,
  Bike,
  User,
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Order } from '../types';

interface OrdersTableViewProps {
  orders: Order[];
  onSelectOrder: (order: Order) => void;
  isServerSide?: boolean;
  currentPage?: number;
  setCurrentPage?: (page: number) => void;
  entriesPerPage?: number;
  setEntriesPerPage?: (limit: number) => void;
  totalEntries?: number;
  hasKds?: boolean;
}

export default function OrdersTableView({
  orders,
  onSelectOrder,
  isServerSide = false,
  currentPage,
  setCurrentPage,
  entriesPerPage,
  setEntriesPerPage,
  totalEntries,
  hasKds: propHasKds,
}: OrdersTableViewProps) {
  // ── Local Pagination States (Fallback for client-side) ──
  const [localCurrentPage, setLocalCurrentPage] = useState(1);
  const [localEntriesPerPage, setLocalEntriesPerPage] = useState(25);

  // ── Check if Branch has KDS / Kitchen Station enabled ──
  const [internalHasKds, setInternalHasKds] = useState(true);

  useEffect(() => {
    const checkKds = () => {
      if (typeof window === 'undefined') return;
      try {
        const raw = localStorage.getItem('rms_branch');
        if (raw) {
          const b = JSON.parse(raw);
          if (b.restaurantType === 'tea_stall') {
            setInternalHasKds(false);
            return;
          }
          const kds =
            b.featureToggles?.kds !== undefined
              ? b.featureToggles.kds
              : b.featureToggles?.kotKitchen;
          setInternalHasKds(kds !== false);
        }
      } catch {}
    };
    checkKds();
    window.addEventListener('rms_branch_updated', checkKds);
    window.addEventListener('storage', checkKds);
    return () => {
      window.removeEventListener('rms_branch_updated', checkKds);
      window.removeEventListener('storage', checkKds);
    };
  }, []);

  const isKdsActive = propHasKds !== undefined ? propHasKds : internalHasKds;

  // ── Format Order Date and Time ──
  const formatOrderDateTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const isToday =
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear();

      const timeStr = d.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

      if (isToday) {
        return (
          <div className="flex flex-col items-start leading-tight">
            <span className="font-800 text-neutral-850 text-[11.5px] lg:text-[13px]">{timeStr}</span>
            <span className="text-[9.5px] text-emerald-600 font-750 uppercase tracking-wide">Today</span>
          </div>
        );
      }

      const dateStrFormatted = d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
      });

      return (
        <div className="flex flex-col items-start leading-tight">
          <span className="font-800 text-neutral-850 text-[11.5px] lg:text-[13px]">{timeStr}</span>
          <span className="text-[9.5px] text-neutral-450 font-600">{dateStrFormatted}</span>
        </div>
      );
    } catch {
      return <span className="text-neutral-500 text-[11px]">{dateStr}</span>;
    }
  };

  // ── Render Kitchen / Order Status Badge (When KDS active) ──
  const renderOrderStatusBadge = (status: string) => {
    let styles = '';
    let label = '';

    switch (status) {
      case 'completed':
        styles = 'bg-emerald-50 text-emerald-700 border-emerald-200/60';
        label = 'Completed';
        break;
      case 'cancelled':
        styles = 'bg-red-50 text-red-700 border-red-200/60';
        label = 'Cancelled';
        break;
      case 'ready':
        styles = 'bg-sky-50 text-sky-700 border-sky-200/60';
        label = 'Ready Pick';
        break;
      case 'preparing':
        styles = 'bg-blue-50 text-blue-700 border-blue-200/60';
        label = 'Preparing';
        break;
      case 'pending':
      default:
        styles = 'bg-orange-50 text-brand-primary border-brand-primary-muted/50';
        label = 'Pending';
        break;
    }

    return (
      <span
        className={`px-2.5 py-1 rounded-full text-[10px] lg:text-[11.5px] font-800 uppercase tracking-wider inline-flex items-center gap-1.5 border ${styles}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-current" />
        {label}
      </span>
    );
  };

  // ── Smart Combined Payment & Mode Badge ──
  const renderPaymentBadge = (order: Order) => {
    const isRefunded =
      order.paymentStatus === 'refunded' || !!(order as any).refundedAt;
    if (isRefunded) {
      return (
        <span className="px-2.5 py-1 rounded-full text-[10px] lg:text-[11.5px] font-800 uppercase tracking-wider inline-flex items-center gap-1.5 bg-neutral-100 text-neutral-600 border border-neutral-300">
          <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
          REFUNDED
        </span>
      );
    }

    if (order.paymentStatus === 'paid') {
      let rawMethod = (order.paymentMethod || '').toLowerCase().trim();
      if (!rawMethod && order.payments && order.payments.length > 0) {
        rawMethod = (order.payments[order.payments.length - 1].method || '')
          .toLowerCase()
          .trim();
      }

      if (rawMethod === 'upi' || rawMethod === 'qr') {
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] lg:text-[11.5px] font-800 uppercase tracking-wider inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            PAID • UPI
          </span>
        );
      }

      if (
        rawMethod === 'card' ||
        rawMethod === 'credit' ||
        rawMethod === 'debit' ||
        rawMethod === 'interac' ||
        rawMethod === 'stripe'
      ) {
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] lg:text-[11.5px] font-800 uppercase tracking-wider inline-flex items-center gap-1.5 bg-purple-50 text-purple-700 border border-purple-200">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            PAID • CARD
          </span>
        );
      }

      if (['online', 'zomato', 'swiggy'].includes(order.orderSource)) {
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] lg:text-[11.5px] font-800 uppercase tracking-wider inline-flex items-center gap-1.5 bg-sky-50 text-sky-700 border border-sky-200">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
            PAID • ONLINE
          </span>
        );
      }

      // Default Cash
      return (
        <span className="px-2.5 py-1 rounded-full text-[10px] lg:text-[11.5px] font-800 uppercase tracking-wider inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          PAID • CASH
        </span>
      );
    }

    // Unpaid
    return (
      <span className="px-2.5 py-1 rounded-full text-[10px] lg:text-[11.5px] font-800 uppercase tracking-wider inline-flex items-center gap-1.5 bg-rose-50 text-rose-700 border border-rose-200">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
        UNPAID
      </span>
    );
  };

  // ── Render Order Type Badge (Indian Formats) ──
  const renderOrderTypeBadge = (order: Order) => {
    const t = order.orderType;
    if (t === 'dine-in') {
      const tableName = order.table?.name
        ? `T-${order.table.name.replace(/^T-?/i, '')}`
        : 'Table';
      return (
        <span className="px-2.5 py-1 rounded-full border text-[10px] lg:text-[11.5px] font-800 uppercase tracking-wide inline-flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-200">
          <Utensils size={11} />
          <span>Dine-In ({tableName})</span>
        </span>
      );
    }
    if (t === 'takeout') {
      return (
        <span className="px-2.5 py-1 rounded-full border text-[10px] lg:text-[11.5px] font-800 uppercase tracking-wide inline-flex items-center gap-1 bg-amber-50 text-amber-800 border-amber-200">
          <ShoppingBag size={11} />
          <span>Takeaway (Parcel)</span>
        </span>
      );
    }
    if (t === 'delivery') {
      const src = (order.orderSource || '').toLowerCase();
      const isZomato = src === 'zomato' || src === 'doordash';
      const isSwiggy = src === 'swiggy' || src === 'skip';
      const label = isZomato
        ? 'Delivery (Zomato)'
        : isSwiggy
        ? 'Delivery (Swiggy)'
        : 'Delivery';
      return (
        <span className="px-2.5 py-1 rounded-full border text-[10px] lg:text-[11.5px] font-800 uppercase tracking-wide inline-flex items-center gap-1 bg-purple-50 text-purple-700 border-purple-200">
          <Bike size={11} />
          <span>{label}</span>
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full border text-[10px] lg:text-[11.5px] font-800 uppercase tracking-wide bg-neutral-100 text-neutral-700 border-neutral-200">
        {order.orderType}
      </span>
    );
  };

  // ── Render Channel Source Tag ──
  const renderSourceTag = (order: Order) => {
    const src = (order.orderSource || 'pos').toLowerCase();
    if (src === 'zomato' || src === 'doordash') {
      return (
        <span className="text-[9px] font-800 uppercase px-1.5 py-0.5 rounded bg-red-100 text-red-700 border border-red-200">
          Zomato
        </span>
      );
    }
    if (src === 'swiggy' || src === 'skip') {
      return (
        <span className="text-[9px] font-800 uppercase px-1.5 py-0.5 rounded bg-orange-100 text-orange-800 border border-orange-200">
          Swiggy
        </span>
      );
    }
    if (src === 'online' || src === 'website' || src === 'app') {
      return (
        <span className="text-[9px] font-800 uppercase px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 border border-sky-200">
          Online
        </span>
      );
    }
    if (src === 'qr' || src === 'table_qr') {
      return (
        <span className="text-[9px] font-800 uppercase px-1.5 py-0.5 rounded bg-violet-100 text-violet-800 border border-violet-200">
          QR Order
        </span>
      );
    }
    return (
      <span className="text-[9px] font-800 uppercase px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600 border border-neutral-200">
        POS Counter
      </span>
    );
  };

  // ── Render Customer / Table Cell ──
  const renderCustomerCell = (order: Order) => {
    const hasCustName = !!(
      order.customer?.name &&
      order.customer.name.trim() !== '' &&
      order.customer.name.toLowerCase() !== 'no name'
    );
    const hasPhone = !!(
      order.customer?.phone &&
      order.customer.phone.trim() !== '' &&
      order.customer.phone !== 'No phone'
    );
    const tableName = order.table?.name;

    if (order.orderType === 'dine-in' && tableName) {
      return (
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-800 text-[11px] border border-blue-200">
            <Utensils size={13} />
          </div>
          <div className="leading-tight">
            <p className="font-800 text-neutral-800 text-[12px] lg:text-[13px]">
              Table {tableName}
            </p>
            <p className="text-[10px] text-neutral-450 font-600 mt-0.5">
              {hasCustName
                ? order.customer?.name
                : hasPhone
                ? order.customer?.phone
                : 'Dine-In Guest'}
            </p>
          </div>
        </div>
      );
    }

    const displayName = hasCustName
      ? order.customer?.name
      : hasPhone
      ? order.customer?.phone
      : 'Walk-in Guest';
    const initials =
      hasCustName && order.customer?.name
        ? order.customer.name.slice(0, 2).toUpperCase()
        : 'WG';

    return (
      <div className="flex items-center gap-2.5">
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-800 uppercase border ${
            hasCustName
              ? 'bg-brand-primary-light border-brand-primary-muted text-brand-primary'
              : 'bg-neutral-100 border-neutral-200 text-neutral-500'
          }`}
        >
          {hasCustName ? initials : <User size={13} />}
        </div>
        <div className="leading-tight">
          <p
            className={`text-[12px] lg:text-[13px] ${
              hasCustName
                ? 'font-800 text-neutral-800'
                : 'font-700 text-neutral-600'
            }`}
          >
            {displayName}
          </p>
          {hasCustName && hasPhone && (
            <p className="text-[10px] text-neutral-450 font-550 mt-0.5">
              {order.customer?.phone}
            </p>
          )}
        </div>
      </div>
    );
  };

  // ── Pagination Calculations ──
  const activeEntriesPerPage =
    isServerSide && entriesPerPage !== undefined
      ? entriesPerPage
      : localEntriesPerPage;
  const activeCurrentPage =
    isServerSide && currentPage !== undefined ? currentPage : localCurrentPage;
  const activeSetCurrentPage =
    isServerSide && setCurrentPage ? setCurrentPage : setLocalCurrentPage;
  const activeSetEntriesPerPage =
    isServerSide && setEntriesPerPage
      ? setEntriesPerPage
      : setLocalEntriesPerPage;

  const totalEntriesCount =
    isServerSide && totalEntries !== undefined ? totalEntries : orders.length;
  const totalPages = Math.ceil(totalEntriesCount / activeEntriesPerPage);

  const activePage = activeCurrentPage > totalPages ? 1 : activeCurrentPage;

  const startIndex = (activePage - 1) * activeEntriesPerPage;
  const endIndex = Math.min(
    startIndex + activeEntriesPerPage,
    totalEntriesCount
  );
  const visibleOrders = isServerSide
    ? orders
    : orders.slice(startIndex, endIndex);

  // ── Handle Thermal Print from Table Row ──
  const handlePrintOrder = async (e: React.MouseEvent, order: Order) => {
    e.stopPropagation();
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    const toastId = `print-${order._id}`;
    try {
      toast.loading(`Printing order #${order.orderNumber}...`, { id: toastId });
      await axios.post(`${apiUrl}/orders/${order._id}/print`, {
        paperSize: '80mm',
      });
      toast.success(`Receipt printed for #${order.orderNumber}!`, {
        id: toastId,
      });
    } catch (err) {
      toast.error('Print failed — check printer connection.', { id: toastId });
    }
  };

  return (
    <div className="bg-white border border-neutral-200 rounded-xl shadow-xs overflow-hidden flex-1 flex flex-col min-h-0 font-sans select-none">
      {/* Table Container */}
      <div className="overflow-x-auto overflow-y-auto flex-1 min-h-[400px]">
        <table className="w-full text-left text-[11.5px] lg:text-[13px] text-neutral-600 font-600 border-collapse table-auto">
          <thead className="bg-neutral-50/80 border-b border-neutral-200 text-neutral-600 text-[10px] lg:text-[11.5px] font-800 uppercase tracking-wider sticky top-0 z-10 backdrop-blur-xs">
            <tr>
              <th className="px-5 py-3.5">Order # / Token</th>
              <th className="px-5 py-3.5">Customer / Table</th>
              <th className="px-5 py-3.5">Order Type</th>
              <th className="px-5 py-3.5 text-right">Grand Total</th>
              <th className="px-5 py-3.5">Payment</th>
              {isKdsActive && <th className="px-5 py-3.5">Kitchen Status</th>}
              <th className="px-5 py-3.5">Time</th>
              <th className="px-5 py-3.5 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {visibleOrders.length > 0 ? (
              visibleOrders.map((order, index) => {
                const grandTotalDisplay = order.total || 0;
                const actualOrderNum = order.orderNumber;
                const shortNum = actualOrderNum.startsWith('#')
                  ? actualOrderNum
                  : `#${actualOrderNum}`;

                return (
                  <tr
                    key={order._id || index}
                    className="hover:bg-amber-50/20 border-b border-neutral-100 transition-colors bg-white last:border-b-0 cursor-pointer"
                    onClick={() => onSelectOrder(order)}
                  >
                    {/* Order Number + Token + Source */}
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col gap-1 items-start">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[11px] lg:text-[13px] font-800 text-neutral-800 bg-neutral-100/90 px-2.5 py-0.5 rounded border border-neutral-200/90 tracking-wide">
                            {shortNum}
                          </span>
                          {order.tokenNumber && (
                            <span className="font-mono text-[9.5px] lg:text-[11px] font-900 text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              Token #{order.tokenNumber}
                            </span>
                          )}
                        </div>
                        <div>{renderSourceTag(order)}</div>
                      </div>
                    </td>

                    {/* Customer / Table */}
                    <td className="px-5 py-3.5">
                      {renderCustomerCell(order)}
                    </td>

                    {/* Order Type */}
                    <td className="px-5 py-3.5">
                      {renderOrderTypeBadge(order)}
                    </td>

                    {/* Grand Total */}
                    <td className="px-5 py-3.5 text-right">
                      <span className="font-900 text-[13px] lg:text-[15px] font-mono text-neutral-900">
                        ₹{grandTotalDisplay.toFixed(2)}
                      </span>
                      {order.promoCode ? (
                        <div className="text-[9.5px] font-800 text-emerald-600 uppercase tracking-wider">
                          Promo: {order.promoCode}
                        </div>
                      ) : null}
                    </td>

                    {/* Combined Payment & Mode Badge */}
                    <td className="px-5 py-3.5">
                      {renderPaymentBadge(order)}
                    </td>

                    {/* Kitchen Status (Only when branch has KDS active) */}
                    {isKdsActive && (
                      <td className="px-5 py-3.5">
                        {renderOrderStatusBadge(order.status)}
                      </td>
                    )}

                    {/* Time & Date */}
                    <td className="px-5 py-3.5">
                      {formatOrderDateTime(order.createdAt)}
                    </td>

                    {/* Actions */}
                    <td
                      className="px-5 py-3.5 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Instant Settle Button for Unpaid Orders */}
                        {order.paymentStatus !== 'paid' && (
                          <button
                            type="button"
                            onClick={() => onSelectOrder(order)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-800 text-[10.5px] lg:text-[11.5px] flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                            title="Collect payment / Settle bill"
                          >
                            <IndianRupee size={12} strokeWidth={2.8} />
                            <span>Settle</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onSelectOrder(order)}
                          className="w-7 h-7 rounded-full bg-neutral-50 hover:bg-brand-primary-light border border-neutral-200 hover:border-brand-primary/30 text-neutral-500 hover:text-brand-primary flex items-center justify-center transition-all duration-150 active:scale-90 cursor-pointer shadow-3xs"
                          title="View order details"
                        >
                          <Eye size={13} strokeWidth={2.2} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handlePrintOrder(e, order)}
                          className="w-7 h-7 rounded-full bg-neutral-50 hover:bg-emerald-50 border border-neutral-200 hover:border-emerald-300 text-neutral-500 hover:text-emerald-600 flex items-center justify-center transition-all duration-150 active:scale-90 cursor-pointer shadow-3xs"
                          title="Print thermal receipt (80mm)"
                        >
                          <Printer size={13} strokeWidth={2.2} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={isKdsActive ? 8 : 7}
                  className="px-5 py-16 text-center text-neutral-450 font-700"
                >
                  No orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Table Pagination Footer */}
      <div className="bg-neutral-50/50 border-t border-neutral-200 px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] lg:text-[12.5px] font-700 text-neutral-500 select-none">
        {/* Left: Entries dropdown */}
        <div className="flex items-center gap-1.5">
          <span className="text-neutral-450 font-550">Show</span>
          <select
            value={activeEntriesPerPage}
            onChange={(e) => {
              activeSetEntriesPerPage(Number(e.target.value));
              activeSetCurrentPage(1);
            }}
            className="bg-white border border-neutral-200 rounded-lg px-2.5 py-1 text-neutral-700 font-600 focus:outline-none focus:border-brand-primary cursor-pointer hover:border-neutral-300 transition-colors"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span className="text-neutral-450 font-550">entries</span>
        </div>

        {/* Middle: Count text */}
        <div className="text-neutral-400 font-550 text-[11.5px] lg:text-[13px]">
          {totalEntriesCount > 0 ? (
            <span>
              Showing {startIndex + 1} to {endIndex} of {totalEntriesCount}{' '}
              entries
            </span>
          ) : (
            <span>Showing 0 to 0 of 0 entries</span>
          )}
        </div>

        {/* Right: Pagination buttons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={activePage === 1}
            onClick={() => activeSetCurrentPage(Math.max(1, activePage - 1))}
            className={`w-7 h-7 rounded-full flex items-center justify-center font-800 transition-all ${
              activePage === 1
                ? 'bg-transparent text-neutral-300 cursor-not-allowed'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 cursor-pointer'
            }`}
          >
            &larr;
          </button>

          {Array.from({ length: totalPages }).map((_, pageIdx) => {
            const pNum = pageIdx + 1;
            const active = activePage === pNum;
            return (
              <button
                key={pNum}
                type="button"
                onClick={() => activeSetCurrentPage(pNum)}
                className={`w-7 h-7 rounded-full flex items-center justify-center font-800 transition-all cursor-pointer text-[10.5px] ${
                  active
                    ? 'bg-brand-primary text-white shadow-sm border border-brand-primary'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {pNum}
              </button>
            );
          })}

          <button
            type="button"
            disabled={activePage === totalPages || totalPages === 0}
            onClick={() =>
              activeSetCurrentPage(Math.min(totalPages, activePage + 1))
            }
            className={`w-7 h-7 rounded-full flex items-center justify-center font-800 transition-all ${
              activePage === totalPages || totalPages === 0
                ? 'bg-transparent text-neutral-300 cursor-not-allowed'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 cursor-pointer'
            }`}
          >
            &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}
