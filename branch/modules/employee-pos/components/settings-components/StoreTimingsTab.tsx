'use client';

import React, { useState } from 'react';
import {
  ChevronDown,
  AlertTriangle,
  Check,
  X,
  Clock,
  Edit2,
  CalendarCheck,
  CalendarOff,
} from 'lucide-react';
import { StoreTiming } from './settingsTypes';

interface StoreTimingsTabProps {
  storeTimings: StoreTiming[];
  setStoreTimings: React.Dispatch<React.SetStateAction<StoreTiming[]>>;
  isEmergencyClosed: boolean;
  setIsEmergencyClosed: React.Dispatch<React.SetStateAction<boolean>>;
  onSubmit: (e: React.FormEvent) => void;
}

export default function StoreTimingsTab({
  storeTimings,
  setStoreTimings,
  isEmergencyClosed,
  setIsEmergencyClosed,
  onSubmit,
}: StoreTimingsTabProps) {
  const [isEditing, setIsEditing] = useState(false);

  const handleTimingFieldChange = (
    index: number,
    field: keyof StoreTiming,
    value: string
  ) => {
    setStoreTimings(
      storeTimings.map((t, idx) => (idx === index ? { ...t, [field]: value } : t))
    );
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(e);
    setIsEditing(false);
  };

  return (
    <div className="w-full space-y-6 font-sans">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-neutral-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-primary text-white flex items-center justify-center font-bold shadow-xs flex-shrink-0">
            <Clock size={20} />
          </div>
          <div>
            <h2 className="text-[17px] font-900 text-neutral-900 tracking-tight flex items-center gap-2">
              Store Operating Schedule & Hours
            </h2>
            <p className="text-[12px] text-neutral-500 mt-0.5">
              Weekly operating hours by day, customer online ordering windows, and emergency closure.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          {!isEditing ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-[11px] font-800 uppercase tracking-wide transition-all cursor-pointer shadow-xs flex items-center gap-1.5 active:scale-95"
            >
              <Edit2 size={13} /> Edit Hours
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3.5 py-2 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 text-[11px] font-700 uppercase tracking-wide transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
              >
                <X size={13} /> Cancel
              </button>
              <button
                type="button"
                onClick={handleFormSubmit}
                className="px-5 py-2 rounded-xl bg-brand-primary hover:bg-orange-600 text-white text-[11px] font-900 uppercase tracking-wide transition-all cursor-pointer shadow-xs flex items-center gap-1.5 active:scale-95"
              >
                <Check size={14} /> Save Schedule
              </button>
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-6">
        {/* ── Emergency Closure Override Card ── */}
        <div
          className={`border rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
            isEmergencyClosed
              ? 'bg-rose-50/80 border-rose-200 shadow-xs'
              : 'bg-emerald-50/50 border-emerald-200/80 shadow-2xs'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold flex-shrink-0 shadow-xs ${
                isEmergencyClosed
                  ? 'bg-rose-600 text-white'
                  : 'bg-emerald-600 text-white'
              }`}
            >
              <AlertTriangle size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-[13.5px] font-bold text-neutral-900 uppercase tracking-wide">
                  Emergency Same-Day Store Closure Override
                </h4>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                    isEmergencyClosed
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {isEmergencyClosed ? 'STORE CLOSED TODAY' : 'NORMAL HOURS ACTIVE'}
                </span>
              </div>
              <p className="text-[11.5px] text-neutral-600 mt-0.5">
                {isEmergencyClosed
                  ? 'Store is currently marked CLOSED for today. Online web and QR menu ordering is paused.'
                  : 'Store is accepting orders normally according to the weekly operating schedule below.'}
              </p>
            </div>
          </div>

          <label
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-white shadow-2xs ${
              isEditing ? 'cursor-pointer hover:bg-neutral-50' : 'cursor-not-allowed opacity-70'
            }`}
          >
            <input
              type="checkbox"
              disabled={!isEditing}
              checked={isEmergencyClosed}
              onChange={(e) => setIsEmergencyClosed(e.target.checked)}
              className="w-4 h-4 text-rose-600 rounded border-neutral-300 focus:ring-rose-500 cursor-pointer"
            />
            <span className="text-[11px] font-bold text-neutral-800">
              {isEmergencyClosed ? 'Closed Today' : 'Open Today'}
            </span>
          </label>
        </div>

        {/* ── Weekly Operating Hours Table ── */}
        <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs font-sans">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-extrabold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-3.5">Day of Week</th>
                  <th className="px-6 py-3.5">Opening Time</th>
                  <th className="px-6 py-3.5">Closing Time</th>
                  <th className="px-6 py-3.5">Operating Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-neutral-700">
                {storeTimings.map((t, idx) => {
                  const isClosed = t.isHoliday === 'Yes';
                  return (
                    <tr
                      key={t.day}
                      className={`hover:bg-neutral-50/70 transition-colors ${
                        isClosed ? 'bg-neutral-50/40 text-neutral-400' : ''
                      }`}
                    >
                      <td className="px-6 py-4 font-bold text-neutral-900 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-brand-primary" />
                          <span className="text-[13px]">{t.day}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        <input
                          type="text"
                          disabled={!isEditing || isClosed}
                          value={t.startTime}
                          onChange={(e) =>
                            handleTimingFieldChange(idx, 'startTime', e.target.value)
                          }
                          className={`border rounded-xl px-3.5 py-1.5 text-xs font-mono font-bold w-[140px] transition-all ${
                            isEditing && !isClosed
                              ? 'bg-white border-brand-primary text-neutral-900 focus:outline-none ring-2 ring-brand-primary/10'
                              : 'bg-neutral-50/70 border-neutral-200 text-neutral-700 cursor-not-allowed'
                          }`}
                        />
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        <input
                          type="text"
                          disabled={!isEditing || isClosed}
                          value={t.endTime}
                          onChange={(e) =>
                            handleTimingFieldChange(idx, 'endTime', e.target.value)
                          }
                          className={`border rounded-xl px-3.5 py-1.5 text-xs font-mono font-bold w-[140px] transition-all ${
                            isEditing && !isClosed
                              ? 'bg-white border-brand-primary text-neutral-900 focus:outline-none ring-2 ring-brand-primary/10'
                              : 'bg-neutral-50/70 border-neutral-200 text-neutral-700 cursor-not-allowed'
                          }`}
                        />
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        <div className="relative w-[130px]">
                          <select
                            disabled={!isEditing}
                            value={t.isHoliday}
                            onChange={(e) =>
                              handleTimingFieldChange(idx, 'isHoliday', e.target.value)
                            }
                            className={`w-full border rounded-xl pl-3 pr-8 py-1.5 text-xs font-bold appearance-none transition-all ${
                              isEditing
                                ? 'bg-white border-brand-primary text-neutral-900 cursor-pointer focus:outline-none ring-2 ring-brand-primary/10'
                                : 'bg-neutral-50/70 border-neutral-200 text-neutral-700 cursor-not-allowed'
                            }`}
                          >
                            <option value="No">Open Scheduled</option>
                            <option value="Yes">Closed / Holiday</option>
                          </select>
                          <ChevronDown
                            size={14}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </form>
    </div>
  );
}
