'use client';

import React from 'react';
import { UtensilsCrossed, Clock, Receipt } from 'lucide-react';

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

/**
 * Realistic Architectural Top-Down Restaurant Chair
 * Features an ergonomic curved backrest arc, padded upholstered seat cushion,
 * contour stitching, structural frame posts, and sleek armrests with drop-shadow elevation.
 */
function TopDownChair({
  rotation = 0,
  status = 'available',
  compact = false,
}: {
  rotation?: number;
  status?: 'available' | 'occupied' | 'billed' | 'reserved';
  compact?: boolean;
}) {
  const width = compact ? 23 : 29;
  const height = compact ? 16 : 21;

  // Status color palettes with frame, cushion, and accent definitions
  const colors = {
    available: {
      backrest: '#059669', // emerald-600
      cushion: '#ecfdf5', // emerald-50
      cushionBorder: '#6ee7b7', // emerald-300
      armrest: '#047857', // emerald-700
      post: '#065f46', // emerald-800
      stitch: '#34d399', // emerald-400
    },
    occupied: {
      backrest: '#e11d48', // rose-600
      cushion: '#ffe4e6', // rose-100
      cushionBorder: '#fda4af', // rose-300
      armrest: '#be123c', // rose-700
      post: '#9f1239', // rose-800
      stitch: '#fb7185', // rose-400
    },
    billed: {
      backrest: '#d97706', // amber-600
      cushion: '#fef3c7', // amber-100
      cushionBorder: '#fcd34d', // amber-300
      armrest: '#b45309', // amber-700
      post: '#92400e', // amber-800
      stitch: '#f59e0b', // amber-500
    },
    reserved: {
      backrest: '#7c3aed', // purple-600
      cushion: '#f5f3ff', // purple-50
      cushionBorder: '#c4b5fd', // purple-300
      armrest: '#6d28d9', // purple-700
      post: '#5b21b6', // purple-800
      stitch: '#a78bfa', // purple-400
    },
  }[status] || {
    backrest: '#059669',
    cushion: '#ecfdf5',
    cushionBorder: '#6ee7b7',
    armrest: '#047857',
    post: '#065f46',
    stitch: '#34d399',
  };

  return (
    <div
      className="flex items-center justify-center shrink-0 transition-transform duration-200 pointer-events-none select-none"
      style={{
        transform: `rotate(${rotation}deg)`,
        filter: 'drop-shadow(0 2px 3px rgba(0, 0, 0, 0.12))',
      }}
    >
      <svg
        width={width}
        height={height}
        viewBox="0 0 30 22"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Soft Upholstered Seat Cushion */}
        <rect
          x="6"
          y="7"
          width="18"
          height="13.5"
          rx="3.5"
          fill={colors.cushion}
          stroke={colors.cushionBorder}
          strokeWidth="1.2"
        />

        {/* Cushion contour stitching */}
        <path
          d="M 9.5 13.5 C 13 15 17 15 20.5 13.5"
          stroke={colors.stitch}
          strokeWidth="1"
          strokeLinecap="round"
          opacity="0.85"
        />

        {/* Ergonomic Curved Backrest Arc */}
        <path
          d="M 3.5 16 C 3.5 3.5, 26.5 3.5, 26.5 16"
          fill="none"
          stroke={colors.backrest}
          strokeWidth="3.2"
          strokeLinecap="round"
        />

        {/* Left Armrest */}
        <line
          x1="3.5"
          y1="12"
          x2="3.5"
          y2="17.5"
          stroke={colors.armrest}
          strokeWidth="2.6"
          strokeLinecap="round"
        />
        {/* Left Frame Post Cap */}
        <circle cx="5" cy="5.8" r="1.3" fill={colors.post} />

        {/* Right Armrest */}
        <line
          x1="26.5"
          y1="12"
          x2="26.5"
          y2="17.5"
          stroke={colors.armrest}
          strokeWidth="2.6"
          strokeLinecap="round"
        />
        {/* Right Frame Post Cap */}
        <circle cx="25" cy="5.8" r="1.3" fill={colors.post} />
      </svg>
    </div>
  );
}

export default function DiningTableGraphic({
  table,
  timeElapsed,
  compact = false,
}: DiningTableGraphicProps) {
  const capacity = Math.max(1, table.capacity || 4);
  const shape = table.shape || (capacity >= 6 ? 'rectangle' : 'square');
  const isAvailable = table.status === 'available';
  const isOccupied = table.status === 'occupied';
  const isBilled = table.status === 'billed';

  // Table surface styling & multi-layer borders
  const tableContainerTheme = isOccupied
    ? 'border-rose-400 bg-gradient-to-b from-white via-rose-50/50 to-rose-100/40 shadow-md ring-4 ring-rose-400/15'
    : isBilled
    ? 'border-amber-400 bg-gradient-to-b from-white via-amber-50/50 to-amber-100/40 shadow-md ring-4 ring-amber-400/15'
    : 'border-emerald-400 hover:border-emerald-500 bg-gradient-to-b from-white via-emerald-50/30 to-emerald-100/30 shadow-sm hover:shadow-md ring-4 ring-emerald-400/10';

  const innerBevelBorder = isOccupied
    ? 'border-rose-300/40'
    : isBilled
    ? 'border-amber-300/40'
    : 'border-emerald-300/40';

  const surfaceBoxShadow = isOccupied
    ? '0 6px 16px -2px rgba(244, 63, 94, 0.18), inset 0 1px 1px rgba(255, 255, 255, 0.9), inset 0 -2px 4px rgba(244, 63, 94, 0.08)'
    : isBilled
    ? '0 6px 16px -2px rgba(245, 158, 11, 0.18), inset 0 1px 1px rgba(255, 255, 255, 0.9), inset 0 -2px 4px rgba(245, 158, 11, 0.08)'
    : '0 6px 16px -2px rgba(16, 185, 129, 0.14), inset 0 1px 1px rgba(255, 255, 255, 0.9), inset 0 -2px 4px rgba(16, 185, 129, 0.06)';

  // ── 1. Circular Table with Radial Chairs ──
  if (shape === 'round') {
    const radius = compact ? 42 : 55;
    const angles = Array.from({ length: capacity }, (_, i) => (360 / capacity) * i);
    const tableSize = compact ? 'w-[76px] h-[76px]' : 'w-[98px] h-[98px]';

    return (
      <div
        className={`relative w-full ${
          compact ? 'h-[114px]' : 'h-[148px]'
        } flex items-center justify-center my-1 select-none`}
      >
        <div className={`relative ${tableSize} flex items-center justify-center`}>
          {/* Radial Chairs around the circular table (z-0: tucked under tabletop rim) */}
          {angles.map((angle, idx) => (
            <div
              key={idx}
              className="absolute flex items-center justify-center z-0 pointer-events-none"
              style={{
                transform: `rotate(${angle}deg) translateY(-${radius}px)`,
              }}
            >
              <TopDownChair
                rotation={0}
                status={table.status}
                compact={compact}
              />
            </div>
          ))}

          {/* Circular Table Top Surface (z-10: sits ON TOP of chairs) */}
          <div
            className={`relative z-10 w-full h-full rounded-full border-2.5 flex flex-col items-center justify-center p-2 text-center transition-all ${tableContainerTheme}`}
            style={{ boxShadow: surfaceBoxShadow }}
          >
            {/* Inner Inset Rim (Beveled edge) */}
            <div
              className={`absolute inset-1 rounded-full border border-dashed ${innerBevelBorder} pointer-events-none`}
            />

            {/* Table Header: Name + Capacity */}
            <div className="flex items-center gap-1 z-10 leading-none">
              <span
                className={`${
                  compact ? 'text-[11px]' : 'text-[13px]'
                } font-900 text-neutral-900 tracking-tight`}
              >
                {table.name}
              </span>
              <span
                className={`${
                  compact ? 'text-[8px]' : 'text-[9.5px]'
                } text-neutral-400 font-700`}
              >
                ({capacity}p)
              </span>
            </div>

            {/* Center Info based on Table Status */}
            {isAvailable && (
              <div className="flex flex-col items-center mt-0.5 z-10">
                <div className="w-5 h-5 rounded-full bg-emerald-50 border border-emerald-200/90 flex items-center justify-center text-emerald-600 mb-0.5 shadow-3xs">
                  <UtensilsCrossed size={11} />
                </div>
                <span
                  className={`${
                    compact ? 'text-[7px]' : 'text-[8px]'
                  } font-800 text-emerald-700 uppercase tracking-wider`}
                >
                  Available
                </span>
              </div>
            )}

            {isOccupied && table.currentOrderId && (
              <div className="flex flex-col items-center mt-0.5 z-10">
                <span
                  className={`${
                    compact ? 'text-[11px]' : 'text-[14px]'
                  } font-900 text-rose-700 leading-tight`}
                >
                  ₹{(table.currentOrderId.total || 0).toFixed(0)}
                </span>
                <div
                  className={`flex items-center gap-1 ${
                    compact ? 'text-[7px]' : 'text-[8.5px]'
                  } font-800 text-neutral-500 mt-0.5`}
                >
                  <span className="text-neutral-800 font-900">
                    #{table.currentOrderId.orderNumber}
                  </span>
                  {!compact && timeElapsed && (
                    <span className="flex items-center gap-0.5 text-neutral-500">
                      • <Clock size={8} /> {timeElapsed}
                    </span>
                  )}
                </div>
              </div>
            )}

            {isBilled && table.currentOrderId && (
              <div className="flex flex-col items-center mt-0.5 z-10">
                <span
                  className={`${
                    compact ? 'text-[11px]' : 'text-[14px]'
                  } font-900 text-amber-900 leading-tight`}
                >
                  ₹{(table.currentOrderId.total || 0).toFixed(0)}
                </span>
                <span
                  className={`${
                    compact ? 'text-[7px]' : 'text-[8px]'
                  } font-800 text-amber-800 uppercase tracking-wider bg-amber-100/90 px-1.5 py-0.5 rounded-full border border-amber-300/80 mt-0.5 flex items-center gap-0.5`}
                >
                  <Receipt size={8} /> Billed
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── 2. Square or Rectangular Table with Perimeter Chairs ──
  // Calculate chairs for each side in an authentic balanced layout:
  // - 2p: 1 top, 1 bottom
  // - 4p square: 1 top, 1 bottom, 1 left, 1 right (balanced 4-way restaurant dining table!)
  // - 4p rect (booth): 2 top, 2 bottom
  // - 6p: 2 top, 2 bottom, 1 left, 1 right (standard rectangular family table)
  // - 8p+: 3 top, 3 bottom, 1 left, 1 right
  let topCount = 1;
  let bottomCount = 1;
  let leftCount = 0;
  let rightCount = 0;

  if (capacity === 2) {
    topCount = 1;
    bottomCount = 1;
    leftCount = 0;
    rightCount = 0;
  } else if (capacity === 3) {
    topCount = 1;
    bottomCount = 1;
    leftCount = 1;
    rightCount = 0;
  } else if (capacity === 4) {
    if (shape === 'rectangle') {
      topCount = 2;
      bottomCount = 2;
      leftCount = 0;
      rightCount = 0;
    } else {
      // Classic square 4-top table: 1 on each of 4 sides!
      topCount = 1;
      bottomCount = 1;
      leftCount = 1;
      rightCount = 1;
    }
  } else if (capacity === 5) {
    topCount = 2;
    bottomCount = 2;
    leftCount = 1;
    rightCount = 0;
  } else if (capacity === 6) {
    // 6 seats: 2 top, 2 bottom, 1 left, 1 right
    topCount = 2;
    bottomCount = 2;
    leftCount = 1;
    rightCount = 1;
  } else {
    // 7+ seats
    const sideChairs = 1;
    const remaining = capacity - sideChairs * 2;
    topCount = Math.ceil(remaining / 2);
    bottomCount = Math.floor(remaining / 2);
    leftCount = sideChairs;
    rightCount = sideChairs;
  }

  const isRect = shape === 'rectangle' || capacity >= 6;

  const tableWidth = compact
    ? isRect
      ? 'w-[108px]'
      : 'w-[84px]'
    : isRect
    ? 'w-[148px] sm:w-[156px]'
    : 'w-[114px] sm:w-[122px]';

  const tableHeight = compact ? 'h-[68px]' : 'h-[88px]';

  return (
    <div
      className={`relative w-full ${
        compact ? 'h-[114px]' : 'h-[148px]'
      } flex items-center justify-center my-1 select-none`}
    >
      {/* ── Table Assembly: Table Top + Perimeter Chairs ── */}
      <div className={`relative ${tableWidth} ${tableHeight} flex items-center justify-center`}>
        {/* ── Top Chairs (z-0: Facing Down towards table) ── */}
        <div className="absolute -top-3.5 left-0 right-0 flex justify-center items-center gap-2.5 sm:gap-4 z-0 pointer-events-none">
          {Array.from({ length: topCount }).map((_, i) => (
            <TopDownChair
              key={`top-${i}`}
              rotation={0}
              status={table.status}
              compact={compact}
            />
          ))}
        </div>

        {/* ── Bottom Chairs (z-0: Facing Up towards table) ── */}
        <div className="absolute -bottom-3.5 left-0 right-0 flex justify-center items-center gap-2.5 sm:gap-4 z-0 pointer-events-none">
          {Array.from({ length: bottomCount }).map((_, i) => (
            <TopDownChair
              key={`bot-${i}`}
              rotation={180}
              status={table.status}
              compact={compact}
            />
          ))}
        </div>

        {/* ── Left Chairs (z-0: Facing RIGHT into table, rotation = -90) ── */}
        {leftCount > 0 && (
          <div className="absolute -left-3.5 top-0 bottom-0 flex flex-col justify-center items-center gap-2 z-0 pointer-events-none">
            {Array.from({ length: leftCount }).map((_, i) => (
              <TopDownChair
                key={`left-${i}`}
                rotation={-90}
                status={table.status}
                compact={compact}
              />
            ))}
          </div>
        )}

        {/* ── Right Chairs (z-0: Facing LEFT into table, rotation = 90) ── */}
        {rightCount > 0 && (
          <div className="absolute -right-3.5 top-0 bottom-0 flex flex-col justify-center items-center gap-2 z-0 pointer-events-none">
            {Array.from({ length: rightCount }).map((_, i) => (
              <TopDownChair
                key={`right-${i}`}
                rotation={90}
                status={table.status}
                compact={compact}
              />
            ))}
          </div>
        )}

        {/* ── Table Top Surface (z-10: Sits ON TOP of chairs so cushions tuck under) ── */}
        <div
          className={`relative z-10 w-full h-full rounded-2xl border-2.5 flex flex-col items-center justify-center p-2 text-center transition-all ${tableContainerTheme}`}
          style={{ boxShadow: surfaceBoxShadow }}
        >
          {/* Inner Inset Rim (Beveled wood/marble edge effect) */}
          <div
            className={`absolute inset-1 rounded-xl border border-dashed ${innerBevelBorder} pointer-events-none`}
          />

          {/* ── Table Top Header: Name + Capacity Pill ── */}
          <div className="flex items-center justify-center gap-1.5 z-10 leading-none">
            <span
              className={`${
                compact ? 'text-[11px]' : 'text-[13.5px]'
              } font-900 text-neutral-900 tracking-tight`}
            >
              {table.name}
            </span>
            <span
              className={`${
                compact ? 'text-[8px]' : 'text-[9.5px]'
              } text-neutral-400 font-700`}
            >
              ({capacity}p)
            </span>
          </div>

          {/* Available State: Place-Setting Utensil Icon + Available Pill */}
          {isAvailable && (
            <div className="flex flex-col items-center mt-1 z-10">
              <div className="w-5 h-5 rounded-full bg-emerald-50 border border-emerald-200/90 flex items-center justify-center text-emerald-600 mb-0.5 shadow-3xs">
                <UtensilsCrossed size={11} />
              </div>
              <span
                className={`${
                  compact ? 'text-[7px]' : 'text-[8.5px]'
                } font-800 text-emerald-700 uppercase tracking-wider`}
              >
                Available
              </span>
            </div>
          )}

          {/* Occupied State: Running Bill Amount + Order # + Timer */}
          {isOccupied && table.currentOrderId && (
            <div className="flex flex-col items-center mt-0.5 sm:mt-1 z-10">
              <span
                className={`${
                  compact ? 'text-[11px]' : 'text-[14px]'
                } font-900 text-rose-700 leading-tight`}
              >
                ₹{(table.currentOrderId.total || 0).toFixed(0)}
              </span>
              <div
                className={`flex items-center gap-1 ${
                  compact ? 'text-[7px]' : 'text-[8.5px]'
                } font-800 text-neutral-500 mt-0.5`}
              >
                <span className="text-neutral-800 font-900">
                  #{table.currentOrderId.orderNumber}
                </span>
                {!compact && timeElapsed && (
                  <span className="flex items-center gap-0.5 text-neutral-500">
                    • <Clock size={8} /> {timeElapsed}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Billed State: Running Amount + Payment Pending Pill */}
          {isBilled && table.currentOrderId && (
            <div className="flex flex-col items-center mt-0.5 sm:mt-1 z-10">
              <span
                className={`${
                  compact ? 'text-[11px]' : 'text-[14px]'
                } font-900 text-amber-900 leading-tight`}
              >
                ₹{(table.currentOrderId.total || 0).toFixed(0)}
              </span>
              <span
                className={`${
                  compact ? 'text-[7px]' : 'text-[8px]'
                } font-800 text-amber-800 uppercase tracking-wider bg-amber-100/90 px-1.5 py-0.5 rounded-full border border-amber-300/80 mt-0.5 flex items-center gap-0.5`}
              >
                <Receipt size={8} /> Payment Pending
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
