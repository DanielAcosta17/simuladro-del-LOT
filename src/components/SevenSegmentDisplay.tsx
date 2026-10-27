import React from 'react';

interface SevenSegmentDisplayProps {
  value: number | null; // 0 to 9 or null
  activeLow?: boolean; // Common Anode uses active low (LOW = ON)
  showPinout?: boolean;
}

// 7-segment mapping (a, b, c, d, e, f, g)
const SEGMENTS_MAP: Record<number, boolean[]> = {
  0: [true, true, true, true, true, true, false],
  1: [false, true, true, false, false, false, false],
  2: [true, true, false, true, true, false, true],
  3: [true, true, true, true, false, false, true],
  4: [false, true, true, false, false, true, true],
  5: [true, false, true, true, false, true, true],
  6: [true, false, true, true, true, true, true],
  7: [true, true, true, false, false, false, false],
  8: [true, true, true, true, true, true, true],
  9: [true, true, true, true, false, true, true],
};

export const SevenSegmentDisplay: React.FC<SevenSegmentDisplayProps> = ({
  value,
  activeLow = true,
  showPinout = true,
}) => {
  const activeSegments = value !== null && value >= 0 && value <= 9
    ? SEGMENTS_MAP[value]
    : [false, false, false, false, false, false, false];

  const [a, b, c, d, e, f, g] = activeSegments;

  const getSegmentStyle = (active: boolean) => {
    if (active) {
      return {
        fill: '#ef4444',
        filter: 'drop-shadow(0px 0px 8px rgba(239, 68, 68, 0.9))',
        opacity: 1,
      };
    }
    return {
      fill: '#1f2937',
      opacity: 0.18,
    };
  };

  return (
    <div className="flex flex-col items-center">
      {/* Physical package */}
      <div className="relative p-4 bg-slate-950 border-2 border-slate-700/80 rounded-xl shadow-2xl flex flex-col items-center">
        {/* Top common anode pin indicator */}
        <div className="flex items-center gap-1.5 mb-2 text-[10px] font-mono text-red-400 bg-red-950/40 border border-red-800/40 px-2 py-0.5 rounded">
          <span>+5V ÁNODO COMÚN</span>
        </div>

        {/* 7-Segment SVG */}
        <svg
          viewBox="0 0 130 190"
          className="w-24 h-36"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Background grid glass */}
          <rect x="2" y="2" width="126" height="186" rx="6" fill="#090d16" />

          {/* Segment a (Top horizontal) */}
          <polygon
            points="32,20  98,20  88,32  42,32"
            style={getSegmentStyle(a)}
            className="transition-colors duration-150"
          />

          {/* Segment b (Top right vertical) */}
          <polygon
            points="100,24  112,36  102,86  92,78"
            style={getSegmentStyle(b)}
            className="transition-colors duration-150"
          />

          {/* Segment c (Bottom right vertical) */}
          <polygon
            points="92,106  102,98  112,148  100,160"
            style={getSegmentStyle(c)}
            className="transition-colors duration-150"
          />

          {/* Segment d (Bottom horizontal) */}
          <polygon
            points="42,152  88,152  98,164  32,164"
            style={getSegmentStyle(d)}
            className="transition-colors duration-150"
          />

          {/* Segment e (Bottom left vertical) */}
          <polygon
            points="18,160  28,148  38,98  28,106"
            style={getSegmentStyle(e)}
            className="transition-colors duration-150"
          />

          {/* Segment f (Top left vertical) */}
          <polygon
            points="28,78  38,86  28,36  18,24"
            style={getSegmentStyle(f)}
            className="transition-colors duration-150"
          />

          {/* Segment g (Middle horizontal) */}
          <polygon
            points="40,88  90,88  96,94  90,100  40,100  34,94"
            style={getSegmentStyle(g)}
            className="transition-colors duration-150"
          />

          {/* Decimal Point (DP) */}
          <circle
            cx="115"
            cy="164"
            r="5"
            style={{ fill: '#1f2937', opacity: 0.2 }}
          />
        </svg>

        {/* State label */}
        <div className="mt-2 text-center">
          <div className="text-xs font-mono font-bold text-slate-300">
            {value !== null ? `DÍGITO: ${value}` : 'EN ESPERA (OFF)'}
          </div>
          {activeLow && (
            <div className="text-[10px] text-slate-400 mt-0.5">
              Ánodo Común (0=ON, 1=OFF)
            </div>
          )}
        </div>
      </div>

      {showPinout && (
        <div className="mt-2 text-[10px] font-mono text-slate-400 text-center">
          7x Resistencias 220 Ω (Pines D9..D10, A1..A5)
        </div>
      )}
    </div>
  );
};
