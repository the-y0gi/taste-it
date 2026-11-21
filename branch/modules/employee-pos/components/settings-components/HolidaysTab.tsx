'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Trash2,
  X,
  Plus,
  Calendar,
  CalendarOff,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Holiday } from './settingsTypes';

interface HolidaysTabProps {
  holidays: Holiday[];
  setHolidays: React.Dispatch<React.SetStateAction<Holiday[]>>;
}

export default function HolidaysTab({ holidays, setHolidays }: HolidaysTabProps) {
  // Local States
  const [holidaySearch, setHolidaySearch] = useState('');
  const [holidayPage, setHolidayPage] = useState(1);
  const [holidayLimit, setHolidayLimit] = useState(10);
  const [isHolidayAddOpen, setIsHolidayAddOpen] = useState(false);
  const [holidayForm, setHolidayForm] = useState({
    startDate: '',
    endDate: '',
    status: true,
  });

  // Operations
  const filteredHolidays = useMemo(() => {
    return holidays.filter(
      (item) =>
        item.startDate.toLowerCase().includes(holidaySearch.toLowerCase()) ||
        item.endDate.toLowerCase().includes(holidaySearch.toLowerCase())
    );
  }, [holidays, holidaySearch]);

  const paginatedHolidays = useMemo(() => {
    const start = (holidayPage - 1) * holidayLimit;
    return filteredHolidays.slice(start, start + holidayLimit);
  }, [filteredHolidays, holidayPage, holidayLimit]);

  const handleAddHoliday = (closeAfter = false) => {
    if (!holidayForm.startDate || !holidayForm.endDate) {
      toast.error('Please select both start and end dates');
      return;
    }
    const newHoliday: Holiday = {
      startDate: holidayForm.startDate,
      endDate: holidayForm.endDate,
      status: holidayForm.status,
      createdDate: new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
    };
    setHolidays([newHoliday, ...holidays]);
    toast.success('Holiday closure added successfully!');
    setHolidayForm({
      startDate: '',
      endDate: '',
      status: true,
    });
    if (closeAfter) setIsHolidayAddOpen(false);
  };

  const executeDeleteHoliday = (index: number) => {
    setHolidays(holidays.filter((_, idx) => idx !== index));
    toast.success('Holiday removed successfully!');
  };

  const handleDeleteHoliday = (index: number) => {
    toast(
      (t) => (
        <div className="flex flex-col gap-2 p-1 text-xs font-sans">
          <p className="font-bold text-neutral-900">
            Remove this scheduled holiday from calendar?
          </p>
          <div className="flex items-center justify-end gap-2 mt-1">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-2.5 py-1 text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-lg font-bold"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                executeDeleteHoliday(index);
              }}
              className="px-2.5 py-1 font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-xs"
            >
              Delete
            </button>
          </div>
        </div>
      ),
      { duration: 5000, position: 'top-center' }
    );
  };

  const totalPages = Math.ceil(filteredHolidays.length / holidayLimit);

  return (
    <div className="w-full space-y-6 font-sans">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-neutral-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-primary text-white flex items-center justify-center font-bold shadow-xs flex-shrink-0">
            <Calendar size={20} />
          </div>
          <div>
            <h2 className="text-[17px] font-900 text-neutral-900 tracking-tight flex items-center gap-2">
              Scheduled Holidays & Festive Closures
            </h2>
            <p className="text-[12px] text-neutral-500 mt-0.5">
              Plan festive closures, special holidays, and scheduled maintenance windows.
            </p>
          </div>
        </div>

        {/* Add Holiday Action */}
        <button
          onClick={() => {
            setHolidayForm({ startDate: '', endDate: '', status: true });
            setIsHolidayAddOpen(true);
          }}
          className="px-4 py-2 rounded-xl bg-brand-primary hover:bg-orange-600 text-white text-[11px] font-800 uppercase tracking-wide transition-all cursor-pointer shadow-xs flex items-center gap-1.5 active:scale-95 self-start sm:self-center"
        >
          <Plus size={14} strokeWidth={2.5} />
          <span>Add Holiday Closure</span>
        </button>
      </div>

      {/* ── Search Bar ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-[300px]">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={holidaySearch}
            onChange={(e) => {
              setHolidaySearch(e.target.value);
              setHolidayPage(1);
            }}
            placeholder="Search dates (e.g. 2026-12)..."
            className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-9.5 pr-8 py-2 text-[12px] text-neutral-700 focus:outline-none focus:border-brand-primary focus:bg-white transition-all"
          />
          {holidaySearch && (
            <button
              onClick={() => setHolidaySearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
            >
              <X size={12} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 text-[11px] text-neutral-500 font-bold self-end sm:self-auto">
          <span>Show:</span>
          <select
            value={holidayLimit}
            onChange={(e) => {
              setHolidayLimit(Number(e.target.value));
              setHolidayPage(1);
            }}
            className="border border-neutral-200 rounded-lg px-2 py-1 bg-neutral-50 text-neutral-700 font-mono text-[11px] focus:outline-none focus:border-brand-primary cursor-pointer"
          >
            <option value={5}>5 per page</option>
            <option value={10}>10 per page</option>
            <option value={20}>20 per page</option>
          </select>
        </div>
      </div>

      {/* ── Table Card ── */}
      <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs font-sans">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-extrabold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-3.5">Closure Start Date</th>
                <th className="px-6 py-3.5">Closure End Date</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Date Created</th>
                <th className="px-6 py-3.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-neutral-700">
              {paginatedHolidays.length > 0 ? (
                paginatedHolidays.map((item, idx) => (
                  <tr key={idx} className="hover:bg-neutral-50/70 transition-colors">
                    <td className="px-6 py-3.5 font-bold text-neutral-900 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-brand-primary" />
                        <span className="font-mono">{item.startDate}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 font-bold text-neutral-900 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-neutral-400" />
                        <span className="font-mono">{item.endDate}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200 text-[10px] font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        Closed Holiday
                      </span>
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap text-neutral-400 text-[11px]">
                      {item.createdDate}
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap text-center">
                      <button
                        onClick={() => handleDeleteHoliday(idx)}
                        className="w-7 h-7 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 inline-flex items-center justify-center transition-all cursor-pointer"
                        title="Delete Holiday"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-neutral-400">
                    <CalendarOff size={32} className="mx-auto text-neutral-300 mb-2" />
                    <p className="text-[13px] font-bold text-neutral-600">No scheduled holidays</p>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      Store operates under regular weekly schedule without planned closures.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer with Pagination */}
        {filteredHolidays.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-3 border-t border-neutral-100 bg-neutral-50/50 text-[11px] text-neutral-500 font-medium">
            <span>
              Showing {Math.min((holidayPage - 1) * holidayLimit + 1, filteredHolidays.length)} to{' '}
              {Math.min(holidayPage * holidayLimit, filteredHolidays.length)} of{' '}
              {filteredHolidays.length} holiday records
            </span>

            <div className="flex items-center gap-1.5">
              <button
                disabled={holidayPage <= 1}
                onClick={() => setHolidayPage((p) => Math.max(1, p - 1))}
                className="w-7 h-7 rounded-lg bg-white border border-neutral-200 text-neutral-600 flex items-center justify-center hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft size={13} />
              </button>
              <span className="px-2 text-xs font-bold text-neutral-700">
                {holidayPage} / {Math.max(1, totalPages)}
              </span>
              <button
                disabled={holidayPage >= totalPages}
                onClick={() => setHolidayPage((p) => p + 1)}
                className="w-7 h-7 rounded-lg bg-white border border-neutral-200 text-neutral-600 flex items-center justify-center hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Add Holiday Modal ── */}
      {isHolidayAddOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-2xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden font-sans border border-neutral-200">
            <div className="bg-neutral-900 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-brand-primary" />
                <h3 className="font-extrabold text-[13px] uppercase tracking-wider">
                  Add Store Holiday
                </h3>
              </div>
              <button
                onClick={() => setIsHolidayAddOpen(false)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                <X size={17} />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="space-y-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-neutral-700 uppercase tracking-wider">
                    Closure Start Date *
                  </label>
                  <input
                    type="date"
                    value={holidayForm.startDate}
                    onChange={(e) =>
                      setHolidayForm({ ...holidayForm, startDate: e.target.value })
                    }
                    className="border border-neutral-200 rounded-xl px-3.5 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-brand-primary"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-neutral-700 uppercase tracking-wider">
                    Closure End Date *
                  </label>
                  <input
                    type="date"
                    value={holidayForm.endDate}
                    onChange={(e) =>
                      setHolidayForm({ ...holidayForm, endDate: e.target.value })
                    }
                    className="border border-neutral-200 rounded-xl px-3.5 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-brand-primary"
                  />
                </div>
              </div>
            </div>

            <div className="bg-neutral-50 px-5 py-3.5 border-t border-neutral-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsHolidayAddOpen(false)}
                className="px-4 py-2 rounded-xl border border-neutral-200 bg-white text-neutral-700 text-xs font-bold uppercase tracking-wide cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleAddHoliday(true)}
                className="px-5 py-2 rounded-xl bg-brand-primary hover:bg-orange-600 text-white text-xs font-extrabold uppercase tracking-wide cursor-pointer shadow-xs active:scale-95 transition-all"
              >
                Add Holiday
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
