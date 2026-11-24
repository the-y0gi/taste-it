'use client';

import React from 'react';
import { UtensilsCrossed } from 'lucide-react';

export interface DiningTableData {
  _id?: string;
  name: string;
  section?: string;
  capacity: number;
  shape?: 'square' | 'round' | 'rectangle';
  status: 'available' | 'occupied' | 'billed' | 'reserved';
  currentOrderId?: {
    orderNumber?: string;
    total?: number;
  } | null;
  occupiedSince?: string | null;
}

interface DiningTableGraphicProps {
  table: DiningTableData;
  timeElapsed?: string | null;
  compact?: boolean;
}

export default function DiningTableGraphic({
  table,
  timeElapsed,
  compact = false,
}: DiningTableGraphicProps) {
  const capacity = Math.max(1, table.capacity || 4);
  const shape = table.shape || 'square';
  const isAvailable = table.status === 'available';
  const isOccupied = table.status === 'occupied';
  const isBilled = table.status === 'billed';

  // Chair color theme
  const chairTheme = isOccupied
    ? 'bg-rose-200 border-rose-400 shadow-rose-200/50'
    : isBilled
    ? 'bg-amber-200 border-amber-400 shadow-amber-200/50'
    : 'bg-emerald-100 border-emerald-300 shadow-emerald-100/50';

  const chairBackrest = isOccupied
    ? 'bg-rose-400'
    : isBilled
    ? 'bg-amber-400'
    : 'bg-emerald-400';

  // Table surface styling
  const tableBorder = isOccupied
    ? 'border-rose-400 ring-4 ring-rose-400/15 shadow-md bg-gradient-to-b from-rose-50/80 via-white to-rose-50/40'
    : isBilled
    ? 'border-amber-400 ring-4 ring-amber-400/15 shadow-md bg-gradient-to-b from-amber-50/80 via-white to-amber-50/40'
    : 'border-emerald-300 hover:border-emerald-500 shadow-sm bg-gradient-to-b from-white via-white to-emerald-50/30';

  // ── 1. Round Table (Radial Chair Layout) ──
  if (shape === 'round') {
    const radius = compact ? 42 : 56;
    const angles = Array.from({ length: capacity }, (_, i) => (360 / capacity) * i);
    const tableSize = compact ? 'w-[74px] h-[74px]' : 'w-[98px] h-[98px]';

    return (
      <div className={`relative w-full ${compact ? 'h-[110px]' : 'h-[148px]'} flex items-center justify-center my-0.5`}>
        {/* Radial Chairs around circle */}
        {angles.map((angle, idx) => (
          <div
            key={idx}
            className="absolute flex flex-col items-center pointer-events-none"
            style={{
              transform: `rotate(${angle}deg) translateY(-${radius}px)`,
            }}
          >
            <div
              className={`${
                compact ? 'w-4 h-2' : 'w-6 h-3'
              } rounded-t-md border border-b-0 shadow-2xs flex items-center justify-center ${chairTheme}`}
            >
              <div className={`${compact ? 'w-2 h-0.5' : 'w-3.5 h-0.5'} rounded-full ${chairBackrest} opacity-60`} />
            </div>
          </div>
        ))}

        {/* Circular Table Top */}
        <div
          className={`relative z-10 ${tableSize} rounded-full border-2 flex flex-col items-center justify-center p-1.5 text-center transition-all ${tableBorder}`}
        >
          <span className={`${compact ? 'text-[11px]' : 'text-[14px]'} font-900 text-neutral-900 leading-none tracking-tight`}>
            {table.name}
          </span>

          {isAvailable && (
            <div className="flex flex-col items-center mt-0.5">
              <UtensilsCrossed size={compact ? 12 : 15} className="text-emerald-600 mb-0.5" />
              <span className={`${compact ? 'text-[7px]' : 'text-[8.5px]'} font-800 text-emerald-700 uppercase tracking-wider`}>
                {capacity} Seats
              </span>
            </div>
          )}

          {isOccupied && table.currentOrderId && (
            <div className="flex flex-col items-center mt-0.5">
              <span className={`${compact ? 'text-[10px]' : 'text-[13px]'} font-900 text-rose-700 leading-tight`}>
                ₹{(table.currentOrderId.total || 0).toFixed(0)}
              </span>
              {!compact && (
                <span className="text-[8px] font-800 text-neutral-500 leading-none">
                  {timeElapsed || 'Active'}
                </span>
              )}
            </div>
          )}

          {isBilled && table.currentOrderId && (
            <div className="flex flex-col items-center mt-0.5">
              <span className={`${compact ? 'text-[10px]' : 'text-[13px]'} font-900 text-amber-900 leading-tight`}>
                ₹{(table.currentOrderId.total || 0).toFixed(0)}
              </span>
              <span className={`${compact ? 'text-[7px]' : 'text-[8px]'} font-800 text-amber-700 uppercase leading-none`}>
                Billed
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── 2. Rectangular or Square Table (Perimeter Chairs) ──
  const isRect = shape === 'rectangle' || capacity >= 6;
  const sideChairs = isRect && capacity >= 6 ? 1 : 0;
  const remaining = capacity - sideChairs * 2;
  const topChairs = Math.max(1, Math.ceil(remaining / 2));
  const bottomChairs = Math.max(1, Math.floor(remaining / 2));
  const leftChairs = sideChairs;
  const rightChairs = sideChairs;

  const tableWidth = compact
    ? isRect ? 'w-[105px]' : 'w-[82px]'
    : isRect ? 'w-[144px] sm:w-[154px]' : 'w-[110px] sm:w-[120px]';

  const tableHeight = compact ? 'h-[68px]' : 'h-[92px]';

  return (
    <div className={`relative w-full ${compact ? 'h-[110px]' : 'h-[148px]'} flex items-center justify-center my-0.5`}>
      {/* ── Table Top Surface Container ── */}
      <div
        className={`relative z-10 ${tableWidth} ${tableHeight} rounded-2xl border-2 flex flex-col items-center justify-center p-2 text-center transition-all ${tableBorder}`}
      >
        {/* Top Chairs */}
        <div className="absolute -top-3 left-0 right-0 flex justify-center items-center gap-1.5 sm:gap-2 pointer-events-none">
          {Array.from({ length: topChairs }).map((_, i) => (
            <div
              key={`top-${i}`}
              className={`${
                compact ? 'w-4 h-2' : 'w-6 h-3'
              } rounded-t-md border border-b-0 shadow-2xs flex items-center justify-center ${chairTheme}`}
            >
              <div className={`${compact ? 'w-2 h-0.5' : 'w-3.5 h-0.5'} rounded-full ${chairBackrest} opacity-60`} />
            </div>
          ))}
        </div>

        {/* Bottom Chairs */}
        <div className="absolute -bottom-3 left-0 right-0 flex justify-center items-center gap-1.5 sm:gap-2 pointer-events-none">
          {Array.from({ length: bottomChairs }).map((_, i) => (
            <div
              key={`bot-${i}`}
              className={`${
                compact ? 'w-4 h-2' : 'w-6 h-3'
              } rounded-b-md border border-t-0 shadow-2xs flex items-center justify-center ${chairTheme}`}
            >
              <div className={`${compact ? 'w-2 h-0.5' : 'w-3.5 h-0.5'} rounded-full ${chairBackrest} opacity-60`} />
            </div>
          ))}
        </div>

        {/* Left Chairs */}
        {leftChairs > 0 && (
          <div className="absolute -left-3 top-0 bottom-0 flex flex-col justify-center items-center gap-1 pointer-events-none">
            {Array.from({ length: leftChairs }).map((_, i) => (
              <div
                key={`left-${i}`}
                className={`${
                  compact ? 'w-2 h-4' : 'w-3 h-6'
                } rounded-l-md border border-r-0 shadow-2xs flex items-center justify-center ${chairTheme}`}
              >
                <div className={`${compact ? 'w-0.5 h-2' : 'w-0.5 h-3.5'} rounded-full ${chairBackrest} opacity-60`} />
              </div>
            ))}
          </div>
        )}

        {/* Right Chairs */}
        {rightChairs > 0 && (
          <div className="absolute -right-3 top-0 bottom-0 flex flex-col justify-center items-center gap-1 pointer-events-none">
            {Array.from({ length: rightChairs }).map((_, i) => (
              <div
                key={`right-${i}`}
                className={`${
                  compact ? 'w-2 h-4' : 'w-3 h-6'
                } rounded-r-md border border-l-0 shadow-2xs flex items-center justify-center ${chairTheme}`}
              >
                <div className={`${compact ? 'w-0.5 h-2' : 'w-0.5 h-3.5'} rounded-full ${chairBackrest} opacity-60`} />
              </div>
            ))}
          </div>
        )}

        {/* ── Table Top Surface Content ── */}
        <div className="flex items-center justify-center gap-1 leading-none">
          <span className={`${compact ? 'text-[11px]' : 'text-[14px]'} font-900 text-neutral-900 tracking-tight`}>
            {table.name}
          </span>
          <span className={`${compact ? 'text-[8.5px]' : 'text-[10px]'} text-neutral-400 font-700`}>
            ({capacity}p)
          </span>
        </div>

        {isAvailable && (
          <div className="flex flex-col items-center mt-1">
            <UtensilsCrossed size={compact ? 12 : 15} className="text-emerald-600 mb-0.5" />
            <span className={`${compact ? 'text-[7px]' : 'text-[8.5px]'} font-800 text-emerald-700 uppercase tracking-wider mt-0.5`}>
              Available
            </span>
          </div>
        )}

        {isOccupied && table.currentOrderId && (
          <div className="flex flex-col items-center mt-0.5 sm:mt-1">
            <span className={`${compact ? 'text-[11px]' : 'text-[13.5px]'} font-900 text-rose-700 leading-tight`}>
              ₹{(table.currentOrderId.total || 0).toFixed(0)}
            </span>
            <div className={`flex items-center gap-1 ${compact ? 'text-[7px]' : 'text-[8.5px]'} font-800 text-neutral-500 mt-0.5`}>
              <span>#{table.currentOrderId.orderNumber}</span>
              {!compact && timeElapsed && <span>• {timeElapsed}</span>}
            </div>
          </div>
        )}

        {isBilled && table.currentOrderId && (
          <div className="flex flex-col items-center mt-0.5 sm:mt-1">
            <span className={`${compact ? 'text-[11px]' : 'text-[13.5px]'} font-900 text-amber-900 leading-tight`}>
              ₹{(table.currentOrderId.total || 0).toFixed(0)}
            </span>
            <span className={`${compact ? 'text-[7px]' : 'text-[8.5px]'} font-800 text-amber-700 uppercase tracking-wider`}>
              Payment Pending
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
