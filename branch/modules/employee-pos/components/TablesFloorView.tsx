'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  TableProperties,
  Users,
  Clock,
  Receipt,
  Plus,
  RefreshCw,
  ArrowRightLeft,
  DollarSign,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronRight,
  Printer,
  Sparkles,
  UtensilsCrossed,
  ChefHat,
} from 'lucide-react';
import { usePosStore } from '../store/pos.store';
import DiningTableGraphic from './DiningTableGraphic';
import TableBillModal from './TableBillModal';

interface TableOrder {
  _id: string;
  orderNumber: string;
  orderType: string;
  paymentStatus: string;
  orderStatus: string;
  total: number;
  items: any[];
  createdAt: string;
}

interface TableData {
  _id: string;
  name: string;
  section: string;
  capacity: number;
  shape: 'square' | 'round' | 'rectangle';
  status: 'available' | 'occupied' | 'billed' | 'reserved';
  currentOrderId?: TableOrder | null;
  occupiedSince?: string | null;
  isActive: boolean;
}

export default function TablesFloorView() {
  const router = useRouter();
  const { setTable, setOrderType, openCheckout, loadOrderForEditing, clearCart, setPaymentTiming, checkoutOpen } = usePosStore();

  const [tables, setTables] = useState<TableData[]>([]);
  const [sections, setSections] = useState<string[]>([]);
  const [activeSection, setActiveSection] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Transfer Modal State
  const [transferModalOpen, setTransferModalOpen] = useState<boolean>(false);
  const [transferSourceTable, setTransferSourceTable] = useState<TableData | null>(null);

  // Bill / Receipt Modal State
  const [billModalOpen, setBillModalOpen] = useState<boolean>(false);
  const [billModalTable, setBillModalTable] = useState<TableData | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  const getBranchId = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('rms_branch');
        if (raw) {
          const b = JSON.parse(raw);
          return b._id || b.id;
        }
      } catch {}
    }
    return '';
  }, []);

  const fetchTables = useCallback(async (isSilent = false) => {
    const branchId = getBranchId();
    if (!branchId) {
      setLoading(false);
      return;
    }

    try {
      if (!isSilent) setLoading(true);
      const res = await axios.get(`${API_URL}/tables?branchId=${branchId}`, {
        withCredentials: true,
      });

      if (res.data?.success) {
        setTables(res.data.data || []);
        setSections(res.data.sections || []);
      }
    } catch (err: any) {
      if (!isSilent) toast.error('Failed to load table floor plan');
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [API_URL, getBranchId]);

  useEffect(() => {
    fetchTables();
    // Auto-refresh table statuses every 15 seconds
    const interval = setInterval(() => {
      fetchTables(true);
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchTables]);

  // Auto-refresh tables when checkout modal closes (e.g. after bill settlement)
  useEffect(() => {
    if (!checkoutOpen) {
      fetchTables(true);
    }
  }, [checkoutOpen, fetchTables]);

  // Format elapsed time (e.g. "24m")
  const getElapsedTime = (occupiedSince?: string | null, createdAt?: string | null) => {
    const timeStr = occupiedSince || createdAt;
    if (!timeStr) return null;
    const diffMs = Date.now() - new Date(timeStr).getTime();
    const diffMins = Math.max(0, Math.floor(diffMs / 60000));
    if (diffMins < 60) return `${diffMins}m`;
    const hrs = Math.floor(diffMins / 60);
    const remMins = diffMins % 60;
    return `${hrs}h ${remMins}m`;
  };

  // 1. Click Available Table -> Select Table & Open POS Cart for Dine-In
  const handleSelectVacantTable = (t: TableData) => {
    const orderId = t.currentOrderId?._id || (typeof t.currentOrderId === 'string' ? t.currentOrderId : null);
    if (orderId) {
      handleAddItemsToTable(t);
      return;
    }
    clearCart();
    setTable({
      id: t._id,
      name: t.name,
      status: 'available',
    });
    setOrderType('dine-in');
    setPaymentTiming('pay-later');
    toast.success(`Selected ${t.name} for Dine-In order`);
    router.push('/employee/pos');
  };

  // 2. Click "Add Items" / "+ KOT" on Occupied Table -> Select Table & Open POS Cart to add running KOT items
  const handleAddItemsToTable = async (t: TableData) => {
    let fullOrder: any = t.currentOrderId;
    const orderId = (typeof t.currentOrderId === 'object' && t.currentOrderId?._id)
      ? t.currentOrderId._id
      : (typeof t.currentOrderId === 'string' ? t.currentOrderId : null);

    if (orderId) {
      try {
        setActionLoading(true);
        const res = await axios.get(`${API_URL}/orders/${orderId}`, {
          withCredentials: true,
        });
        if (res.data?.success && res.data?.data) {
          fullOrder = res.data.data;
        }
      } catch (err: any) {
        console.warn("Could not fetch order by ID, using populated order:", err);
      } finally {
        setActionLoading(false);
      }
    }

    if (fullOrder && (fullOrder.items || fullOrder._id)) {
      if (!fullOrder.table || !fullOrder.table.name) {
        fullOrder.table = { id: t._id, name: t.name, status: t.status };
      }
      loadOrderForEditing(fullOrder);
      setPaymentTiming('pay-later');
      toast.success(`Loaded running order #${fullOrder.orderNumber || ''} (${t.name})`);
      router.push('/employee/pos');
      return;
    }

    setTable({
      id: t._id,
      name: t.name,
      status: t.status,
    });
    setOrderType('dine-in');
    setPaymentTiming('pay-later');
    toast.success(`Adding items to ${t.name}`);
    router.push('/employee/pos');
  };

  // 3. Open Bill / Receipt Modal & Auto-mark Billed
  const handleOpenBillModal = async (t: TableData) => {
    setBillModalTable(t);
    setBillModalOpen(true);

    // If occupied, mark as billed in DB in the background
    if (t.status === 'occupied') {
      const orderId = (typeof t.currentOrderId === 'object' && t.currentOrderId?._id)
        ? t.currentOrderId._id
        : (typeof t.currentOrderId === 'string' ? t.currentOrderId : undefined);

      try {
        await axios.patch(
          `${API_URL}/tables/${t._id}/status`,
          { status: 'billed', orderId },
          { withCredentials: true }
        );
        fetchTables(true);
      } catch (err: any) {
        console.warn('Could not auto-mark table as billed:', err);
      }
    }
  };

  const handleMarkBilled = (t: TableData) => {
    handleOpenBillModal(t);
  };

  // 4. Settle / Pay Table Order (Direct modal popup over Floor Plan!)
  const handleSettleTable = async (t: TableData) => {
    let fullOrder: any = t.currentOrderId;
    const orderId = (typeof t.currentOrderId === 'object' && t.currentOrderId?._id)
      ? t.currentOrderId._id
      : (typeof t.currentOrderId === 'string' ? t.currentOrderId : null);

    if (!orderId && !fullOrder) {
      toast.error(`No running order to settle for ${t.name}`);
      return;
    }

    try {
      setActionLoading(true);
      if (orderId) {
        try {
          const res = await axios.get(`${API_URL}/orders/${orderId}`, {
            withCredentials: true,
          });
          if (res.data?.success && res.data?.data) {
            fullOrder = res.data.data;
          }
        } catch (fetchErr) {
          console.warn("Could not fetch order by ID, using populated order on table:", fetchErr);
        }
      }

      if (!fullOrder) {
        toast.error('Could not load order for settlement');
        return;
      }

      if (!fullOrder.table || !fullOrder.table.name) {
        fullOrder.table = { id: t._id, name: t.name, status: t.status };
      }

      loadOrderForEditing(fullOrder);
      setPaymentTiming('pay-now');
      openCheckout();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to open settlement');
    } finally {
      setActionLoading(false);
    }
  };

  // 5. Open Transfer Modal
  const handleOpenTransferModal = (t: TableData) => {
    setTransferSourceTable(t);
    setTransferModalOpen(true);
  };

  // 6. Execute Table Transfer
  const handleExecuteTransfer = async (targetTable: TableData) => {
    if (!transferSourceTable) return;

    try {
      setActionLoading(true);
      const res = await axios.post(
        `${API_URL}/tables/transfer`,
        {
          fromTableId: transferSourceTable._id,
          toTableId: targetTable._id,
        },
        { withCredentials: true }
      );

      if (res.data?.success) {
        toast.success(`Shifted order from ${transferSourceTable.name} to ${targetTable.name}!`);
        setTransferModalOpen(false);
        setTransferSourceTable(null);
        fetchTables(true);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to shift table');
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered Tables
  const filteredTables = useMemo(() => {
    return tables.filter((t) => {
      const matchesSection = activeSection === 'all' || (t.section || 'Main Dining') === activeSection;
      const matchesSearch = !searchQuery.trim() || t.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
      return matchesSection && matchesSearch;
    });
  }, [tables, activeSection, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = tables.length;
    const available = tables.filter((t) => t.status === 'available').length;
    const occupied = tables.filter((t) => t.status === 'occupied').length;
    const billed = tables.filter((t) => t.status === 'billed').length;
    const totalSalesRunning = tables
      .filter((t) => (t.status === 'occupied' || t.status === 'billed') && t.currentOrderId)
      .reduce((sum, t) => sum + (t.currentOrderId?.total || 0), 0);
    return { total, available, occupied, billed, totalSalesRunning };
  }, [tables]);

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-100 overflow-hidden font-sans">
      {/* ── Subheader Controls ── */}
      <div className="bg-white border-b border-neutral-200 px-4 md:px-6 py-3 flex flex-wrap items-center justify-between gap-3 flex-shrink-0 shadow-xs">
        {/* Left: Title & Quick Status Counters */}
        <div className="flex items-center gap-3 md:gap-5 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand-primary text-white flex items-center justify-center font-bold shadow-xs">
              <TableProperties size={16} />
            </div>
            <div>
              <h1 className="text-[14px] md:text-[15px] font-900 text-neutral-900 uppercase tracking-tight leading-none">
                Dining Floor & Tables
              </h1>
              <p className="text-[10px] text-neutral-400 font-600 mt-0.5">Live Occupancy & Table Orders</p>
            </div>
          </div>

          {/* Quick Counter Pills */}
          <div className="flex items-center gap-1.5 text-[11px] font-800">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{stats.available} Available</span>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 flex items-center gap-1.5 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>{stats.occupied} Occupied</span>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1.5 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>{stats.billed} Billed</span>
            </span>
          </div>
        </div>

        {/* Right: Search, Running Dine-In Sales & Refresh */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {stats.totalSalesRunning > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 bg-orange-50 border border-orange-200 px-3 py-1 rounded-xl text-[11px] font-800 text-brand-primary">
              <Receipt size={13} />
              <span>Running: ₹{stats.totalSalesRunning.toFixed(2)}</span>
            </div>
          )}

          {/* Search Table */}
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search table..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-xl text-[11.5px] font-700 text-neutral-800 focus:outline-none focus:border-brand-primary w-32 sm:w-40"
            />
          </div>

          {/* Refresh button */}
          <button
            type="button"
            onClick={() => fetchTables(false)}
            className="p-1.5 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-xl text-neutral-600 hover:text-brand-primary transition-all cursor-pointer"
            title="Refresh floor"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* ── Section Tabs Bar ── */}
      <div className="bg-white border-b border-neutral-200/80 px-4 md:px-6 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar flex-shrink-0">
        <button
          type="button"
          onClick={() => setActiveSection('all')}
          className={`px-3.5 py-1.5 rounded-xl text-[11px] font-800 uppercase tracking-wide transition-all cursor-pointer border whitespace-nowrap ${
            activeSection === 'all'
              ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
              : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
          }`}
        >
          All Areas ({tables.length})
        </button>
        {sections.map((sec) => {
          const count = tables.filter((t) => (t.section || 'Main Dining') === sec).length;
          return (
            <button
              key={sec}
              type="button"
              onClick={() => setActiveSection(sec)}
              className={`px-3.5 py-1.5 rounded-xl text-[11px] font-800 uppercase tracking-wide transition-all cursor-pointer border whitespace-nowrap ${
                activeSection === sec
                  ? 'bg-brand-primary text-white border-brand-primary shadow-xs'
                  : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
              }`}
            >
              {sec} ({count})
            </button>
          );
        })}
      </div>

      {/* ── Floor Plan Table Cards Grid ── */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 min-h-0">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-28 gap-3 text-neutral-400">
            <div className="w-9 h-9 border-3 border-brand-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-800 uppercase tracking-wider text-neutral-500">
              Loading Dining Floor Layout...
            </p>
          </div>
        ) : filteredTables.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white border border-dashed border-neutral-300 rounded-3xl gap-3">
            <div className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center text-neutral-400">
              <TableProperties size={28} />
            </div>
            <p className="text-[14px] font-800 text-neutral-800">No tables matching this filter</p>
            <p className="text-[12px] text-neutral-500 font-500">
              Switch section tabs or adjust search query.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredTables.map((table) => {
              const isAvailable = table.status === 'available';
              const isOccupied = table.status === 'occupied';
              const isBilled = table.status === 'billed';
              const timeElapsed = getElapsedTime(table.occupiedSince, table.currentOrderId?.createdAt);

              return (
                <div
                  key={table._id}
                  className={`relative rounded-3xl border-2 p-3.5 flex flex-col justify-between transition-all select-none shadow-xs hover:shadow-md ${
                    isAvailable
                      ? 'bg-white border-emerald-200/90 hover:border-emerald-400 cursor-pointer'
                      : isOccupied
                      ? 'bg-white border-rose-300 shadow-sm'
                      : isBilled
                      ? 'bg-white border-amber-300 shadow-sm'
                      : 'bg-white border-neutral-200'
                  }`}
                  onClick={isAvailable ? () => handleSelectVacantTable(table) : undefined}
                >
                  {/* Card Header: Section Badge + Status Pill */}
                  <div className="flex items-center justify-between mb-1 pb-1.5 border-b border-neutral-100">
                    <span className="text-[10px] font-800 text-neutral-400 uppercase tracking-wider truncate max-w-[110px]">
                      {table.section || 'Main Dining'}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-800 uppercase tracking-wide border ${
                        isAvailable
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : isOccupied
                          ? 'bg-rose-50 text-rose-800 border-rose-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isAvailable
                            ? 'bg-emerald-500'
                            : isOccupied
                            ? 'bg-rose-500 animate-pulse'
                            : 'bg-amber-500'
                        }`}
                      />
                      <span>{table.status}</span>
                    </span>
                  </div>

                  {/* ── Realistic Top-Down Table & Chairs Visual ── */}
                  <div className="py-1">
                    <DiningTableGraphic
                      table={table}
                      timeElapsed={timeElapsed}
                    />
                  </div>

                  {/* ── Compact Ordered Items Bar (Single-row, fixed height, click opens itemized bill) ── */}
                  {(isOccupied || isBilled) && table.currentOrderId && (() => {
                    const totalItems = table.currentOrderId.items && table.currentOrderId.items.length > 0
                      ? table.currentOrderId.items.reduce((s: number, i: any) => s + (i.quantity || 1), 0)
                      : (table.currentOrderId.total ? 1 : 0);

                    return (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenBillModal(table);
                        }}
                        className="my-1.5 px-3 py-2 rounded-2xl bg-neutral-50/90 hover:bg-amber-50/80 border border-neutral-200/90 hover:border-amber-300 transition-all cursor-pointer group select-none shadow-2xs flex items-center justify-between"
                        title="Click to view full receipt & itemized bill"
                      >
                        <div className="flex items-center gap-1.5 text-[10.5px] font-800 text-neutral-700 group-hover:text-amber-900 truncate mr-2">
                          <Receipt size={12} className="text-amber-600 shrink-0" />
                          <span className="truncate">
                            {totalItems > 0
                              ? `${totalItems} ${totalItems === 1 ? 'Item' : 'Items'} Ordered`
                              : 'Order Active'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-[11px] font-900 text-neutral-900 group-hover:text-amber-800">
                            ₹{(table.currentOrderId.total || 0).toFixed(0)}
                          </span>
                          <span className="text-[9.5px] font-800 text-amber-700 group-hover:translate-x-0.5 transition-transform flex items-center">
                            Bill <ChevronRight size={11} />
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* ── Bottom Action Dock ── */}
                  <div className="pt-2 border-t border-neutral-100 mt-1">
                    {isAvailable ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectVacantTable(table);
                        }}
                        className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11.5px] font-800 tracking-wide uppercase transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5 active:scale-98"
                      >
                        <UtensilsCrossed size={13} />
                        <span>Seat Guests</span>
                      </button>
                    ) : isOccupied ? (
                      <div className="space-y-1.5">
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleAddItemsToTable(table)}
                            className="py-1.5 px-2 rounded-xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-neutral-800 hover:text-brand-primary text-[10.5px] font-800 uppercase transition-all cursor-pointer flex items-center justify-center gap-1"
                            title="Add items to kitchen KOT"
                          >
                            <Plus size={12} />
                            <span>KOT</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenTransferModal(table)}
                            className="py-1.5 px-2 rounded-xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-neutral-700 hover:text-brand-primary text-[10.5px] font-800 uppercase transition-all cursor-pointer flex items-center justify-center gap-1"
                            title="Shift / Transfer table"
                          >
                            <ArrowRightLeft size={12} />
                            <span>Shift</span>
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenBillModal(table)}
                            className="py-1.5 px-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[10.5px] font-800 uppercase transition-all cursor-pointer shadow-2xs flex items-center justify-center gap-1"
                            title="Print bill & receipt"
                          >
                            <Printer size={12} />
                            <span>Bill</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSettleTable(table)}
                            className="py-1.5 px-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[10.5px] font-900 uppercase transition-all cursor-pointer shadow-2xs flex items-center justify-center gap-1"
                            title="Settle bill & free table"
                          >
                            <span>Settle ₹</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* isBilled */
                      <div className="space-y-1.5">
                        <div className="grid grid-cols-3 gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleAddItemsToTable(table)}
                            className="py-1.5 px-1 rounded-xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-neutral-700 text-[10px] font-800 uppercase cursor-pointer"
                            title="Add more items"
                          >
                            + Item
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenBillModal(table)}
                            className="py-1.5 px-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-800 uppercase cursor-pointer shadow-2xs flex items-center justify-center gap-1"
                            title="View & print bill slip"
                          >
                            <Printer size={11} />
                            <span>Bill</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSettleTable(table)}
                            className="py-1.5 px-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[10.5px] font-900 uppercase tracking-wide cursor-pointer shadow-xs flex items-center justify-center gap-0.5 active:scale-98"
                            title="Settle bill & free table"
                          >
                            <span>Settle ₹</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Table Shift / Transfer Modal ── */}
      {transferModalOpen && transferSourceTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-2xl max-w-md w-full overflow-hidden animate-scale-up">
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <ArrowRightLeft size={16} />
                </div>
                <div>
                  <h3 className="text-[13.5px] font-900 text-neutral-900 uppercase leading-none">
                    Shift Order from {transferSourceTable.name}
                  </h3>
                  <p className="text-[10px] text-neutral-500 font-500 mt-0.5">
                    Select an available table to transfer this active order
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTransferModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-500 flex items-center justify-center cursor-pointer transition-all"
              >
                <X size={14} />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <p className="text-[11px] font-700 text-neutral-500 uppercase tracking-wide">
                Available Tables ({tables.filter((t) => t.status === 'available').length})
              </p>

              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {tables
                  .filter((t) => t.status === 'available')
                  .map((t) => (
                    <button
                      key={t._id}
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleExecuteTransfer(t)}
                      className="w-full p-3 rounded-xl border border-neutral-200 hover:border-brand-primary bg-neutral-50 hover:bg-orange-50/50 flex items-center justify-between transition-all cursor-pointer group text-left"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-white border border-neutral-200 group-hover:border-brand-primary flex items-center justify-center font-bold text-neutral-800 group-hover:text-brand-primary shadow-2xs">
                          {t.name}
                        </div>
                        <div>
                          <p className="text-[12.5px] font-800 text-neutral-900 leading-tight">
                            {t.name}
                          </p>
                          <p className="text-[10px] text-neutral-500 font-600">
                            {t.section} • {t.capacity} Guests
                          </p>
                        </div>
                      </div>
                      <span className="text-[11px] font-800 text-brand-primary group-hover:translate-x-1 transition-all">
                        Shift Here →
                      </span>
                    </button>
                  ))}

                {tables.filter((t) => t.status === 'available').length === 0 && (
                  <div className="py-8 text-center text-neutral-400">
                    <p className="text-xs font-700">No available tables right now.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="px-5 py-3 bg-neutral-50 border-t border-neutral-100 flex justify-end">
              <button
                type="button"
                onClick={() => setTransferModalOpen(false)}
                className="px-4 py-1.5 rounded-xl border border-neutral-200 text-neutral-600 hover:bg-neutral-100 text-[11px] font-700 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Table Bill & Thermal Receipt Modal ── */}
      <TableBillModal
        isOpen={billModalOpen}
        onClose={() => setBillModalOpen(false)}
        table={billModalTable as any}
        onSettle={(t) => handleSettleTable(t as any)}
        onRefresh={() => fetchTables(true)}
      />
    </div>
  );
}
