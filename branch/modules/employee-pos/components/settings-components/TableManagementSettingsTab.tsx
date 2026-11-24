'use client';

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  TableProperties,
  Plus,
  Trash2,
  Edit2,
  Users,
  RefreshCw,
  Check,
  X,
  Layers,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import DiningTableGraphic from '../DiningTableGraphic';

interface TableItem {
  _id: string;
  name: string;
  section: string;
  capacity: number;
  shape: 'square' | 'round' | 'rectangle';
  status: 'available' | 'occupied' | 'billed' | 'reserved';
  isActive: boolean;
  currentOrderId?: {
    orderNumber: string;
    total: number;
  } | null;
}

interface TableManagementSettingsTabProps {
  branchId?: string;
}

export default function TableManagementSettingsTab({ branchId }: TableManagementSettingsTabProps) {
  const [tables, setTables] = useState<TableItem[]>([]);
  const [sections, setSections] = useState<string[]>([]);
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Modal / Form state for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingTable, setEditingTable] = useState<TableItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    section: 'Main Dining',
    capacity: 4,
    shape: 'square' as 'square' | 'round' | 'rectangle',
  });
  const [customSectionInput, setCustomSectionInput] = useState<string>('');
  const [isCustomSection, setIsCustomSection] = useState<boolean>(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  // Resolve branchId from localStorage if not passed
  const getResolvedBranchId = useCallback(() => {
    if (branchId) return branchId;
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
  }, [branchId]);

  const fetchTables = useCallback(async () => {
    const bId = getResolvedBranchId();
    if (!bId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/tables?branchId=${bId}`, {
        withCredentials: true,
      });

      if (res.data?.success) {
        setTables(res.data.data || []);
        setSections(res.data.sections || []);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load dining tables');
    } finally {
      setLoading(false);
    }
  }, [API_URL, getResolvedBranchId]);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  const handleOpenAddModal = () => {
    setEditingTable(null);
    setFormData({
      name: '',
      section: sections[0] || 'Main Dining',
      capacity: 4,
      shape: 'square',
    });
    setIsCustomSection(false);
    setCustomSectionInput('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (t: TableItem) => {
    setEditingTable(t);
    setFormData({
      name: t.name,
      section: t.section,
      capacity: t.capacity,
      shape: t.shape,
    });
    setIsCustomSection(false);
    setCustomSectionInput('');
    setIsModalOpen(true);
  };

  const handleSaveTable = async (e: React.FormEvent) => {
    e.preventDefault();
    const bId = getResolvedBranchId();
    if (!bId) {
      toast.error('Branch session not detected. Please refresh.');
      return;
    }

    if (!formData.name.trim()) {
      toast.error('Please enter a table name/number (e.g. T-1)');
      return;
    }

    const resolvedSection = isCustomSection
      ? customSectionInput.trim() || 'Main Dining'
      : formData.section.trim();

    try {
      setActionLoading(true);
      if (editingTable) {
        // Update table
        const res = await axios.put(
          `${API_URL}/tables/${editingTable._id}`,
          {
            name: formData.name.trim(),
            section: resolvedSection,
            capacity: Number(formData.capacity) || 4,
            shape: formData.shape,
          },
          { withCredentials: true }
        );
        if (res.data?.success) {
          toast.success(`Table "${formData.name}" updated successfully!`);
          setIsModalOpen(false);
          fetchTables();
        }
      } else {
        // Create table
        const res = await axios.post(
          `${API_URL}/tables`,
          {
            branchId: bId,
            name: formData.name.trim(),
            section: resolvedSection,
            capacity: Number(formData.capacity) || 4,
            shape: formData.shape,
          },
          { withCredentials: true }
        );
        if (res.data?.success) {
          toast.success(`Table "${formData.name}" added successfully!`);
          setIsModalOpen(false);
          fetchTables();
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save table');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTable = async (t: TableItem) => {
    if (t.status === 'occupied' || t.status === 'billed') {
      toast.error(`Cannot delete ${t.name} while it is currently occupied!`);
      return;
    }

    if (!confirm(`Are you sure you want to delete table "${t.name}"?`)) return;

    try {
      setActionLoading(true);
      const res = await axios.delete(`${API_URL}/tables/${t._id}`, {
        withCredentials: true,
      });
      if (res.data?.success) {
        toast.success(`Table "${t.name}" deleted successfully.`);
        fetchTables();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete table');
    } finally {
      setActionLoading(false);
    }
  };

  const handleForceClearTable = async (t: TableItem) => {
    if (!confirm(`Force-clear table "${t.name}"? This will reset its status to Available.`)) return;

    try {
      setActionLoading(true);
      const res = await axios.post(`${API_URL}/tables/${t._id}/clear`, {}, {
        withCredentials: true,
      });
      if (res.data?.success) {
        toast.success(`Table "${t.name}" is now available.`);
        fetchTables();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to clear table');
    } finally {
      setActionLoading(false);
    }
  };

  // Filter tables by selected section
  const filteredTables = selectedSection === 'all'
    ? tables
    : tables.filter((t) => (t.section || 'Main Dining') === selectedSection);

  const totalSeats = tables.reduce((sum, t) => sum + (t.capacity || 0), 0);
  const occupiedCount = tables.filter((t) => t.status === 'occupied').length;
  const availableCount = tables.filter((t) => t.status === 'available').length;

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* ── Top Header & Stats Summary ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-neutral-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-100 text-brand-primary flex items-center justify-center font-bold">
              <TableProperties size={18} />
            </div>
            <h2 className="text-[16px] font-900 text-neutral-900 tracking-tight uppercase">
              Dining Tables & Floor Sections
            </h2>
          </div>
          <p className="text-[12px] text-neutral-500 font-500 mt-1">
            Configure restaurant dining areas (AC Hall, Rooftop, Garden), table numbers and guest seating capacities.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchTables}
            className="p-2.5 rounded-xl border border-neutral-200 text-neutral-600 hover:text-brand-primary hover:bg-neutral-50 transition-all cursor-pointer"
            title="Refresh tables"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 rounded-xl bg-brand-primary text-white text-[12px] font-800 uppercase tracking-wide flex items-center gap-1.5 shadow-sm hover:opacity-95 transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>Add New Table</span>
          </button>
        </div>
      </div>

      {/* ── Metric Badges ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-neutral-50 border border-neutral-200/80 rounded-2xl p-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black">
            <TableProperties size={18} />
          </div>
          <div>
            <p className="text-[10px] font-700 text-neutral-500 uppercase tracking-wide">Total Tables</p>
            <p className="text-[18px] font-900 text-neutral-900 leading-tight">{tables.length}</p>
          </div>
        </div>

        <div className="bg-neutral-50 border border-neutral-200/80 rounded-2xl p-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black">
            <Check size={18} />
          </div>
          <div>
            <p className="text-[10px] font-700 text-neutral-500 uppercase tracking-wide">Available</p>
            <p className="text-[18px] font-900 text-emerald-700 leading-tight">{availableCount}</p>
          </div>
        </div>

        <div className="bg-neutral-50 border border-neutral-200/80 rounded-2xl p-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-black">
            <Users size={18} />
          </div>
          <div>
            <p className="text-[10px] font-700 text-neutral-500 uppercase tracking-wide">Occupied</p>
            <p className="text-[18px] font-900 text-rose-700 leading-tight">{occupiedCount}</p>
          </div>
        </div>

        <div className="bg-neutral-50 border border-neutral-200/80 rounded-2xl p-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-black">
            <Layers size={18} />
          </div>
          <div>
            <p className="text-[10px] font-700 text-neutral-500 uppercase tracking-wide">Total Capacity</p>
            <p className="text-[18px] font-900 text-amber-700 leading-tight">{totalSeats} <span className="text-[11px] font-600 text-neutral-500">Seats</span></p>
          </div>
        </div>
      </div>

      {/* ── Section Filter Pills ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <button
          type="button"
          onClick={() => setSelectedSection('all')}
          className={`px-3.5 py-1.5 rounded-xl text-[11px] font-800 uppercase tracking-wide transition-all cursor-pointer border ${
            selectedSection === 'all'
              ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
              : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300'
          }`}
        >
          All Sections ({tables.length})
        </button>
        {sections.map((sec) => {
          const count = tables.filter((t) => (t.section || 'Main Dining') === sec).length;
          return (
            <button
              key={sec}
              type="button"
              onClick={() => setSelectedSection(sec)}
              className={`px-3.5 py-1.5 rounded-xl text-[11px] font-800 uppercase tracking-wide transition-all cursor-pointer border whitespace-nowrap ${
                selectedSection === sec
                  ? 'bg-brand-primary text-white border-brand-primary shadow-xs'
                  : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300'
              }`}
            >
              {sec} ({count})
            </button>
          );
        })}
      </div>

      {/* ── Tables Grid ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-neutral-400">
          <div className="w-8 h-8 border-3 border-brand-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-700 uppercase tracking-wide">Loading tables...</p>
        </div>
      ) : filteredTables.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-neutral-50 border border-dashed border-neutral-200 rounded-2xl gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white border border-neutral-200 flex items-center justify-center text-neutral-400">
            <TableProperties size={24} />
          </div>
          <div className="text-center">
            <p className="text-[13px] font-800 text-neutral-800">No tables found</p>
            <p className="text-[11px] text-neutral-400 font-500 mt-0.5">
              Click &quot;Add New Table&quot; above to create your first dining table.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="px-4 py-2 rounded-xl bg-brand-primary text-white text-[11px] font-800 uppercase tracking-wide cursor-pointer hover:opacity-95"
          >
            + Create First Table
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {filteredTables.map((table) => {
            const isOccupied = table.status === 'occupied';
            const isBilled = table.status === 'billed';

            return (
              <div
                key={table._id}
                className={`relative bg-white border-2 rounded-2xl p-4 transition-all flex flex-col justify-between gap-3 shadow-xs hover:shadow-md ${
                  isOccupied
                    ? 'border-rose-300 bg-rose-50/20'
                    : isBilled
                    ? 'border-amber-300 bg-amber-50/20'
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                {/* Header row: Table name & status pill */}
                <div className="flex items-start justify-between pb-1.5 border-b border-neutral-100">
                  <div>
                    <h4 className="text-[14px] font-900 text-neutral-900 leading-tight">
                      {table.name}
                    </h4>
                    <span className="text-[10px] font-700 text-neutral-400 uppercase tracking-wide">
                      {table.section || 'Main Dining'}
                    </span>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-800 uppercase tracking-wide border ${
                      isOccupied
                        ? 'bg-rose-100 text-rose-800 border-rose-200'
                        : isBilled
                        ? 'bg-amber-100 text-amber-800 border-amber-200'
                        : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    }`}
                  >
                    {table.status}
                  </span>
                </div>

                {/* Physical Table & Chairs Graphic */}
                <div className="py-1">
                  <DiningTableGraphic table={table} compact />
                </div>

                {/* Details row: Capacity */}
                <div className="space-y-1.5 py-1">
                  <div className="flex items-center justify-between text-[11px] text-neutral-600">
                    <span className="flex items-center gap-1 font-600">
                      <Users size={12} className="text-neutral-400" />
                      <span>Capacity:</span>
                    </span>
                    <span className="font-800 text-neutral-800">{table.capacity} Guests</span>
                  </div>

                  {isOccupied && table.currentOrderId && (
                    <div className="p-2 bg-rose-50 border border-rose-200 rounded-xl text-[10.5px] flex items-center justify-between">
                      <span className="font-700 text-rose-900">
                        Order #{table.currentOrderId.orderNumber}
                      </span>
                      <span className="font-900 text-rose-800">
                        ₹{(table.currentOrderId.total || 0).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Footer action buttons */}
                <div className="flex items-center justify-between pt-2.5 border-t border-neutral-100 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(table)}
                    className="flex-1 py-1.5 px-2 rounded-xl bg-neutral-50 hover:bg-neutral-100 text-neutral-700 text-[10.5px] font-700 border border-neutral-200 flex items-center justify-center gap-1 cursor-pointer transition-all"
                  >
                    <Edit2 size={11} />
                    <span>Edit</span>
                  </button>

                  {isOccupied || isBilled ? (
                    <button
                      type="button"
                      onClick={() => handleForceClearTable(table)}
                      className="py-1.5 px-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-[10.5px] font-700 border border-amber-200 flex items-center justify-center gap-1 cursor-pointer transition-all"
                      title="Force clear table status"
                    >
                      <RefreshCw size={11} />
                      <span>Free</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleDeleteTable(table)}
                      className="py-1.5 px-2 rounded-xl bg-neutral-50 hover:bg-rose-50 text-neutral-500 hover:text-rose-600 text-[10.5px] font-700 border border-neutral-200 hover:border-rose-200 flex items-center justify-center gap-1 cursor-pointer transition-all"
                      title="Delete table"
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Add / Edit Table Modal ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-2xl max-w-md w-full overflow-hidden animate-scale-up">
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-brand-primary text-white flex items-center justify-center font-bold">
                  <TableProperties size={16} />
                </div>
                <h3 className="text-[14px] font-900 text-neutral-900 uppercase">
                  {editingTable ? `Edit Table: ${editingTable.name}` : 'Add New Dining Table'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-500 flex items-center justify-center cursor-pointer transition-all"
              >
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleSaveTable} className="p-5 space-y-4">
              {/* Table Name / Number */}
              <div>
                <label className="block text-[10.5px] font-800 text-neutral-700 uppercase tracking-wide mb-1">
                  Table Name / Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. T-1, Table 4, Roof-02"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2 text-[12.5px] font-700 text-neutral-900 focus:outline-none focus:border-brand-primary focus:bg-white"
                />
              </div>

              {/* Section / Floor Selection */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[10.5px] font-800 text-neutral-700 uppercase tracking-wide">
                    Section / Floor Area *
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCustomSection(!isCustomSection)}
                    className="text-[10px] font-800 text-brand-primary hover:underline cursor-pointer"
                  >
                    {isCustomSection ? '← Choose Existing Section' : '+ New Custom Section'}
                  </button>
                </div>

                {isCustomSection ? (
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rooftop, Garden, 1st Floor, Family AC"
                    value={customSectionInput}
                    onChange={(e) => setCustomSectionInput(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2 text-[12.5px] font-700 text-neutral-900 focus:outline-none focus:border-brand-primary focus:bg-white"
                  />
                ) : (
                  <select
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2 text-[12.5px] font-700 text-neutral-900 focus:outline-none focus:border-brand-primary focus:bg-white"
                  >
                    {sections.length > 0 ? (
                      sections.map((sec) => (
                        <option key={sec} value={sec}>
                          {sec}
                        </option>
                      ))
                    ) : (
                      <option value="Main Dining">Main Dining</option>
                    )}
                  </select>
                )}
              </div>

              {/* Seating Capacity & Shape */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10.5px] font-800 text-neutral-700 uppercase tracking-wide mb-1">
                    Capacity (Seats) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    required
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2 text-[12.5px] font-700 text-neutral-900 focus:outline-none focus:border-brand-primary focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[10.5px] font-800 text-neutral-700 uppercase tracking-wide mb-1">
                    Table Shape
                  </label>
                  <select
                    value={formData.shape}
                    onChange={(e) => setFormData({ ...formData, shape: e.target.value as any })}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2 text-[12.5px] font-700 text-neutral-900 focus:outline-none focus:border-brand-primary focus:bg-white"
                  >
                    <option value="square">Square ▢</option>
                    <option value="round">Round ⭕</option>
                    <option value="rectangle">Rectangle ▭</option>
                  </select>
                </div>
              </div>

              {/* Form buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-neutral-200 text-neutral-600 hover:bg-neutral-50 text-[11.5px] font-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-brand-primary text-white text-[11.5px] font-800 uppercase tracking-wide hover:opacity-95 cursor-pointer disabled:opacity-50 shadow-sm"
                >
                  {actionLoading ? 'Saving...' : editingTable ? 'Save Changes' : 'Create Table'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
