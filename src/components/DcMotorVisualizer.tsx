import React from 'react';
import { MotorDirection } from '../types/iot';
import { RotateCw, RotateCcw, Zap } from 'lucide-react';

interface DcMotorVisualizerProps {
  label: string;
  subsystemLabel: string;
  direction: MotorDirection;
  speedPwm: number;
  rpm: number;
  voltage: number;
  driverInputs: { inA: string; inB: string; enable: string };
  isPowered: boolean;
}

export const DcMotorVisualizer: React.FC<DcMotorVisualizerProps> = ({
  label,
  subsystemLabel,
  direction,
  speedPwm,
  rpm,
  voltage,
  driverInputs,
  isPowered,
}) => {
  const isSpinning = isPowered && direction !== 'STOP' && speedPwm > 0;
  const isCW = direction === 'CW';

  return (
    <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl flex flex-col items-center">
      <div className="w-full flex items-center justify-between mb-3">
        <div>
          <span className="text-xs font-semibold text-slate-200 block">{label}</span>
          <span className="text-[11px] text-slate-400">{subsystemLabel}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${
              isSpinning ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-slate-600'
            }`}
          />
          <span className="text-xs font-mono font-medium text-slate-300">
            {isSpinning ? (isCW ? 'GIRO CW (HORARIO)' : 'GIRO CCW (ANTIHORARIO)') : 'DETENIDO'}
          </span>
        </div>
      </div>

      {/* Motor Mechanical Body with animated rotor */}
      <div className="relative w-32 h-32 flex items-center justify-center my-1">
        {/* Metal casing */}
        <div className="w-28 h-28 rounded-full bg-gradient-to-br from-slate-700 via-slate-800 to-slate-950 border-4 border-slate-600 shadow-xl flex items-center justify-center relative">
          {/* Motor mounting screw tabs */}
          <div className="absolute top-1 left-1/2 -translate-x-1/2 w-3 h-2 bg-slate-500 rounded-xs" />
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-3 h-2 bg-slate-500 rounded-xs" />
          <div className="absolute left-1 top-1/2 -translate-y-1/2 w-2 h-3 bg-slate-500 rounded-xs" />
          <div className="absolute right-1 top-1/2 -translate-y-1/2 w-2 h-3 bg-slate-500 rounded-xs" />

          {/* Rotor disc */}
          <div
            className={`w-20 h-20 rounded-full border-2 border-slate-400/30 bg-slate-900/80 flex items-center justify-center relative ${
              isSpinning
                ? isCW
                  ? 'animate-[spin_0.8s_linear_infinite]'
                  : 'animate-[spin_0.8s_linear_infinite_reverse]'
                : ''
            }`}
          >
            {/* Gear spokes */}
            <div className="absolute w-full h-1 bg-amber-500/80 rounded" />
            <div className="absolute h-full w-1 bg-amber-500/80 rounded" />
            <div className="absolute w-full h-1 bg-amber-500/80 rounded rotate-45" />
            <div className="absolute h-full w-1 bg-amber-500/80 rounded rotate-45" />

            {/* Brass Shaft Center */}
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-600 to-amber-300 border border-amber-200 shadow-md flex items-center justify-center z-10">
              <div className="w-2 h-2 rounded-full bg-slate-900" />
            </div>
          </div>
        </div>

        {/* Direction Overlay Icons */}
        {isSpinning && (
          <div className="absolute bottom-0 right-0 p-1.5 bg-slate-950/80 border border-slate-700 rounded-lg text-amber-400">
            {isCW ? <RotateCw className="w-4 h-4" /> : <RotateCcw className="w-4 h-4" />}
          </div>
        )}
      </div>

      {/* Telemetry Metrics */}
      <div className="w-full grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-800 text-center font-mono">
        <div className="bg-slate-950/50 p-1.5 rounded-lg border border-slate-800/80">
          <div className="text-[10px] text-slate-400">PWM</div>
          <div className="text-xs font-semibold text-white">{isSpinning ? speedPwm : 0}/255</div>
        </div>
        <div className="bg-slate-950/50 p-1.5 rounded-lg border border-slate-800/80">
          <div className="text-[10px] text-slate-400">VELOCIDAD</div>
          <div className="text-xs font-semibold text-white">{isSpinning ? Math.abs(rpm) : 0} RPM</div>
        </div>
        <div className="bg-slate-950/50 p-1.5 rounded-lg border border-slate-800/80">
          <div className="text-[10px] text-slate-400">TENSIÓN</div>
          <div className="text-xs font-semibold text-white">{isSpinning ? voltage.toFixed(1) : '0.0'} V</div>
        </div>
      </div>

      {/* Driver L298N Pin States */}
      <div className="w-full flex items-center justify-between text-[11px] font-mono text-slate-400 mt-2 bg-slate-950/30 px-2 py-1 rounded">
        <span>L298N: {driverInputs.inA} / {driverInputs.inB}</span>
        <span className="flex items-center gap-1">
          <Zap className="w-3 h-3 text-amber-400" />
          <span>ENA/B: {driverInputs.enable}</span>
        </span>
      </div>
    </div>
  );
};
