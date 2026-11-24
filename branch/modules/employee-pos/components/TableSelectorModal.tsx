'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, TableProperties, RefreshCw, Users } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { usePosStore } from '../store/pos.store';
import { TableInfo } from '../types';
import DiningTableGraphic from './DiningTableGraphic';

interface RealTableItem {
  _id: string;
  name: string;
  section: string;
  capacity: number;
  status: 'available' | 'occupied' | 'billed' | 'reserved';
  currentOrderId?: {
    _id?: string;
    orderNumber: string;
    total: number;
  } | null;
}

const STATUS_STYLES: Record<TableInfo['status'], string> = {
  available: 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:border-emerald-400 hover:bg-emerald-100 cursor-pointer',
  occupied:  'border-rose-200 bg-rose-50 text-rose-600 opacity-80 cursor-not-allowed',
  reserved:  'border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-400 hover:bg-amber-100 cursor-pointer',
  billed:    'border-amber-300 bg-amber-50 text-amber-800 opacity-80 cursor-not-allowed',
};

const STATUS_DOT: Record<TableInfo['status'], string> = {
  available: 'bg-emerald-500',
  occupied:  'bg-rose-500',
  reserved:  'bg-amber-500',
  billed:    'bg-amber-600',
};

export default function TableSelectorModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { selectedTable, setTable, cartItems, loadOrderForEditing, setPaymentTiming } = usePosStore();
  const [tables, setTables] = useState<RealTableItem[]>([]);
  const [sections, setSections] = useState<string[]>([]);
  const [activeSection, setActiveSection] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  const fetchTables = useCallback(async () => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem('rms_branch');
      const branchId = raw ? JSON.parse(raw)?._id || JSON.parse(raw)?.id : null;
      if (!branchId) return;

      setLoading(true);
      const res = await axios.get(`${API_URL}/tables?branchId=${branchId}`, {
        withCredentials: true,
      });

      if (res.data?.success) {
        setTables(res.data.data || []);
        setSections(res.data.sections || []);
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    if (isOpen) {
      fetchTables();
    }
  }, [isOpen, fetchTables]);

  if (!isOpen) return null;

  const handleSelect = async (t: RealTableItem) => {
    if (t.status === 'occupied' || t.status === 'billed') {
      const orderId = t.currentOrderId?._id || (typeof t.currentOrderId === 'string' ? t.currentOrderId : null);
      if (orderId && cartItems.length === 0) {
        try {
          const res = await axios.get(`${API_URL}/orders/${orderId}`, {
            withCredentials: true,
          });
          if (res.data?.success && res.data?.data) {
            const fullOrder = res.data.data;
            if (!fullOrder.table || !fullOrder.table.name) {
              fullOrder.table = { id: t._id, name: t.name, status: t.status };
            }
            loadOrderForEditing(fullOrder);
            setPaymentTiming('pay-later');
            toast.success(`Loaded running order #${fullOrder.orderNumber} for Table ${t.name}`);
            onClose();
            return;
          }
        } catch {
          // fallback
        }
      }
      toast.error(`Table "${t.name}" is occupied with another running order.`);
      return;
    }
    setTable({
      id: t._id,
      name: t.name,
      status: t.status,
    });
    onClose();
  };

  const filteredTables = activeSection === 'all'
    ? tables
    : tables.filter((t) => (t.section || 'Main Dining') === activeSection);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div onClick={onClose} className="absolute inset-0 bg-black/50 backdrop-blur-xs" />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden z-10 animate-scale-up flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-neutral-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-100 text-brand-primary flex items-center justify-center font-bold">
              <TableProperties size={16} />
            </div>
            <div>
              <h3 className="text-[13.5px] font-900 text-neutral-900 uppercase">Select Dining Table</h3>
              <p className="text-[9.5px] text-neutral-400 font-500 mt-0.5">Choose an available table for Dine-In</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-500 hover:bg-neutral-200 transition-all cursor-pointer">
            <X size={13} />
          </button>
        </div>

        {/* Section Filter Pills */}
        {sections.length > 1 && (
          <div className="flex items-center gap-1.5 px-5 py-2.5 bg-neutral-50 border-b border-neutral-100 overflow-x-auto no-scrollbar flex-shrink-0">
            <button
              type="button"
              onClick={() => setActiveSection('all')}
              className={`px-3 py-1 rounded-lg text-[10.5px] font-800 uppercase tracking-wide transition-all cursor-pointer border ${
                activeSection === 'all'
                  ? 'bg-neutral-900 text-white border-neutral-900 shadow-2xs'
                  : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-100'
              }`}
            >
              All ({tables.length})
            </button>
            {sections.map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => setActiveSection(sec)}
                className={`px-3 py-1 rounded-lg text-[10.5px] font-800 uppercase tracking-wide transition-all cursor-pointer border whitespace-nowrap ${
                  activeSection === sec
                    ? 'bg-brand-primary text-white border-brand-primary shadow-2xs'
                    : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                }`}
              >
                {sec}
              </button>
            ))}
          </div>
        )}

        {/* Table Grid */}
        <div className="p-5 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-neutral-400 gap-2">
              <RefreshCw size={20} className="animate-spin text-brand-primary" />
              <p className="text-xs font-700">Loading tables...</p>
            </div>
          ) : filteredTables.length === 0 ? (
            <div className="text-center py-12 text-neutral-400">
              <p className="text-xs font-700">No tables configured for this section.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
              {filteredTables.map((table) => {
                const isActive = selectedTable?.id === table._id;
                const isOccupiedOrBilled = table.status === 'occupied' || table.status === 'billed';

                return (
                  <button
                    key={table._id}
                    onClick={() => handleSelect(table)}
                    className={`relative rounded-2xl border-2 p-1.5 transition-all flex flex-col items-center justify-center ${
                      isActive
                        ? 'border-brand-primary bg-orange-50/80 ring-2 ring-brand-primary/30 shadow-xs'
                        : isOccupiedOrBilled
                        ? 'border-rose-200 bg-rose-50/20 opacity-70 cursor-not-allowed'
                        : 'border-neutral-200 bg-white hover:border-emerald-400 cursor-pointer active:scale-95 shadow-2xs'
                    }`}
                  >
                    <DiningTableGraphic table={table} compact />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Legend + Actions */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-neutral-100 bg-neutral-50/50 flex-shrink-0">
          <div className="flex items-center gap-3 text-[9px] font-600 text-neutral-500">
            {[['bg-emerald-500', 'Available'], ['bg-rose-500', 'Occupied']].map(([dot, label]) => (
              <div key={label} className="flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                {label}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            {selectedTable && (
              <button
                type="button"
                onClick={() => { setTable(null); onClose(); }}
                className="px-3 py-1.5 border border-neutral-200 rounded-xl text-[10px] font-700 text-neutral-600 hover:bg-neutral-100 transition-all cursor-pointer"
              >
                Clear Table
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-brand-primary text-white rounded-xl text-[10px] font-800 uppercase hover:opacity-95 transition-all cursor-pointer shadow-xs"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
