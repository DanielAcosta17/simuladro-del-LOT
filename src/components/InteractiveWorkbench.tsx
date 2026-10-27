import React from 'react';
import {
  LdrSubsystemState,
  SoundSubsystemState,
  SecuritySubsystemState,
  PowerSubsystemState,
} from '../types/iot';
import { DcMotorVisualizer } from './DcMotorVisualizer';
import { SevenSegmentDisplay } from './SevenSegmentDisplay';
import {
  Sun,
  Moon,
  Mic,
  Activity,
  Bell,
  Cpu,
  Power,
  Volume2,
  Zap,
} from 'lucide-react';

interface InteractiveWorkbenchProps {
  ldr: LdrSubsystemState;
  sound: SoundSubsystemState;
  security: SecuritySubsystemState;
  power: PowerSubsystemState;
  setLdrLightLevel: (val: number) => void;
  triggerClap: (isNoise?: boolean) => void;
  triggerVibration: () => void;
  resetAlarm: () => void;
  toggleExternalSupply: () => void;
  toggleUsbPower: () => void;
  toggleCommonGnd: () => void;
}

export const InteractiveWorkbench: React.FC<InteractiveWorkbenchProps> = ({
  ldr,
  sound,
  security,
  power,
  setLdrLightLevel,
  triggerClap,
  triggerVibration,
  resetAlarm,
  toggleExternalSupply,
  toggleUsbPower,
  toggleCommonGnd,
}) => {
  const isPowered = power.isExternalSupplyOn && power.commonGndConnected && power.isUsbConnected;

  return (
    <div className="space-y-6">
      {/* Power Rail & Diagnostic Warning Bar */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400">
            <Power className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <span>Subsistema de Alimentación Eléctrica</span>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.2 rounded">
                Ref. Común GND
              </span>
            </div>
            <div className="text-xs text-slate-400">
              Alimentación segregada: 12V DC para Driver L298N y 5V USB para Arduino UNO R4.
            </div>
          </div>
        </div>

        {/* Power Toggles */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleExternalSupply}
            className={`px-3 py-1.5 text-xs font-mono font-medium rounded-lg border transition-all ${
              power.isExternalSupplyOn
                ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 shadow-sm'
                : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}
          >
            {power.isExternalSupplyOn ? '12V DC: CONECTADA' : '12V DC: APAGADA'}
          </button>

          <button
            onClick={toggleUsbPower}
            className={`px-3 py-1.5 text-xs font-mono font-medium rounded-lg border transition-all ${
              power.isUsbConnected
                ? 'bg-blue-500/20 border-blue-500/60 text-blue-300 shadow-sm'
                : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}
          >
            {power.isUsbConnected ? 'USB 5V: CONECTADO' : 'USB 5V: DESCONECTADO'}
          </button>

          <button
            onClick={toggleCommonGnd}
            className={`px-3 py-1.5 text-xs font-mono font-medium rounded-lg border transition-all ${
              power.commonGndConnected
                ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 shadow-sm'
                : 'bg-red-500/20 border-red-500/60 text-red-300 animate-pulse'
            }`}
          >
            {power.commonGndConnected ? 'GND COMÚN: OK' : 'GND: FLOTANTE'}
          </button>
        </div>
      </div>

      {!power.commonGndConnected && (
        <div className="p-3 bg-red-950/70 border border-red-500/60 rounded-xl text-xs text-red-200">
          ⚠️ <strong>Advertencia eléctrica:</strong> La referencia común GND está desconectada. Las señales lógicas entre Arduino y el driver L298N pierden masa de referencia y los motores no pueden operar de forma segura.
        </div>
      )}

      {/* Main Interactive Workbench Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Sensors & Actuator Controls (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* 1. LDR Light Sensor Control Box */}
          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sun className={`w-4 h-4 ${ldr.isDark ? 'text-slate-500' : 'text-amber-400'}`} />
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                  1. Sensor de Luz (LDR + 10 kΩ)
                </span>
              </div>
              <span className="text-xs font-mono text-blue-400 font-semibold">
                Pin A0
              </span>
            </div>

            <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-lg space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Lectura ADC:</span>
                <span className="text-white font-bold">{ldr.rawAdc} / 1023</span>
              </div>
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Estado detectado:</span>
                <span className={`font-bold ${ldr.isDark ? 'text-indigo-400' : 'text-amber-400'}`}>
                  {ldr.isDark ? 'OSCURIDAD (< 500)' : 'LUZ ALTA (≥ 500)'}
                </span>
              </div>
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Sentido Motor 1:</span>
                <span className="text-emerald-400 font-bold">
                  {isPowered ? (ldr.isDark ? 'CCW (Antihorario)' : 'CW (Horario)') : 'INACTIVO'}
                </span>
              </div>

              {/* Slider for light intensity */}
              <div className="pt-2">
                <input
                  type="range"
                  min="0"
                  max="1023"
                  value={ldr.rawAdc}
                  onChange={(e) => setLdrLightLevel(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              {/* Quick Preset Buttons */}
              <div className="grid grid-cols-2 gap-1.5 pt-1">
                <button
                  onClick={() => setLdrLightLevel(820)}
                  className="px-2 py-1 text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700/60"
                >
                  ☀️ Sol / Luz (820)
                </button>
                <button
                  onClick={() => setLdrLightLevel(220)}
                  className="px-2 py-1 text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700/60"
                >
                  🌑 Oscuridad (220)
                </button>
              </div>
            </div>
          </div>

          {/* 2. Sound Sensor SY-M213 Control Box */}
          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mic className={`w-4 h-4 ${sound.isClapTriggered ? 'text-red-400 animate-pulse' : 'text-blue-400'}`} />
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                  2. Sensor Sonido (SY-M213)
                </span>
              </div>
              <span className="text-xs font-mono text-blue-400 font-semibold">
                Pin D2
              </span>
            </div>

            <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-lg space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Nivel acústico:</span>
                <span className="text-white font-bold">{sound.soundLevelDb} dB</span>
              </div>
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Motor 2 & LED (D13):</span>
                <span className={`font-bold ${sound.motor2.enabled ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {sound.motor2.enabled ? 'ENCENDIDO' : 'APAGADO'}
                </span>
              </div>
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Aplausos en ventana:</span>
                <span className="text-amber-400 font-bold">{sound.clapCount}</span>
              </div>

              {/* Clap Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={() => triggerClap(false)}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>👏 1 Aplauso</span>
                </button>
                <button
                  onClick={() => {
                    triggerClap(false);
                    setTimeout(() => triggerClap(false), 300);
                  }}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs rounded-lg border border-slate-700 transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>👏👏 Doble Aplauso</span>
                </button>
              </div>

              {/* False Noise Button */}
              <button
                onClick={() => triggerClap(true)}
                className="w-full py-1 text-[11px] font-mono text-slate-400 hover:text-slate-300 bg-slate-900 border border-slate-800 rounded transition-colors"
              >
                ⚡ Probar Ruido Espurio (&lt;30ms - Antirrebote)
              </button>
            </div>
          </div>

          {/* 3. Vibration Sensor SW-420 Control Box */}
          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className={`w-4 h-4 ${security.alarmActive ? 'text-red-400 animate-pulse' : 'text-purple-400'}`} />
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                  3. Seguridad Vibración (SW-420)
                </span>
              </div>
              <span className="text-xs font-mono text-blue-400 font-semibold">
                Pin D3 (ISR)
              </span>
            </div>

            <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-lg space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Estado de Seguridad:</span>
                <span className={`font-bold ${security.alarmActive ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
                  {security.alarmActive ? '¡ALARMA ACTIVADA!' : 'MONITOREO SEGURO'}
                </span>
              </div>
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Buzzer Acústico (D8):</span>
                <span className={`font-bold ${security.buzzerActive ? 'text-red-400' : 'text-slate-500'}`}>
                  {security.buzzerActive ? 'SONANDO (2.4 kHz)' : 'SILENCIOSO'}
                </span>
              </div>
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">RFID v2.0:</span>
                <span className="text-slate-400 line-through">Descontinuado en v2.0</span>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={triggerVibration}
                  className="flex-1 py-2 px-3 bg-red-600 hover:bg-red-500 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>Simular Vibración / Golpe</span>
                </button>
                {security.alarmActive && (
                  <button
                    onClick={resetAlarm}
                    className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg border border-slate-700"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Center & Right Column: Interactive Circuit & Actuators Canvas (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Visual Hardware Board representation */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl relative overflow-hidden shadow-2xl">
            {/* Background grid */}
            <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-800">
              {/* Arduino Uno R4 WiFi Board Badge */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-cyan-950 border border-cyan-500/40 p-2 flex flex-col items-center justify-center text-cyan-400 shadow-lg">
                  <Cpu className="w-7 h-7" />
                  <span className="text-[10px] font-mono font-bold mt-1">UNO R4</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-white">Arduino UNO R4 WiFi</span>
                    <span className="text-[10px] font-mono bg-cyan-950 text-cyan-400 border border-cyan-800/60 px-1.5 py-0.5 rounded">
                      RA4M1 48MHz
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Microcontrolador principal • Bluetooth BLE & WiFi integrado • 14 I/O Digitales • 6 Analógicos
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 text-[11px] font-mono text-slate-400">
                    <span className="text-emerald-400">USB 5.0V</span>
                    <span>·</span>
                    <span className="text-amber-400">L298N 12.0V</span>
                    <span>·</span>
                    <span className="text-blue-400">{power.totalCurrentMa} mA total</span>
                  </div>
                </div>
              </div>

              {/* Status LED D13 physical indicator */}
              <div className="flex items-center gap-3 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-6 h-6 rounded-full border-2 transition-all ${
                      sound.ledActive && power.isUsbConnected
                        ? 'bg-amber-400 border-amber-200 shadow-[0_0_15px_rgba(251,191,36,0.9)] scale-110'
                        : 'bg-slate-800 border-slate-700'
                    }`}
                  />
                  <span className="text-[10px] font-mono text-slate-400 mt-1">LED D13</span>
                </div>
                <div className="text-left text-xs">
                  <div className="font-semibold text-slate-200">Indicador Visual</div>
                  <div className="text-[11px] text-slate-400">
                    {sound.ledActive ? 'ENCENDIDO (1 Aplauso)' : 'APAGADO (2 Aplausos)'}
                  </div>
                </div>
              </div>
            </div>

            {/* Actuators Row: 7-Segment Display & Motors */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-6">
              {/* 7-Segment Countdown Module (4 cols) */}
              <div className="md:col-span-4 flex flex-col items-center justify-center p-4 bg-slate-950/60 border border-slate-800 rounded-xl">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  4. Display 7 Segmentos
                </span>
                <SevenSegmentDisplay
                  value={security.countdownDigit}
                  activeLow={true}
                  showPinout={true}
                />
                <div className="mt-2 text-center">
                  <div className="text-xs text-slate-400">
                    {security.alarmActive
                      ? `Cuenta Regresiva Activa: ${security.countdownRemainingSec}s`
                      : 'Standby: Esperando evento de vibración'}
                  </div>
                </div>
              </div>

              {/* Motor 1 & Motor 2 Visualizers (8 cols) */}
              <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Motor DC 1 (Luz) */}
                <DcMotorVisualizer
                  label="Motor DC 1"
                  subsystemLabel="Subsistema 1: Control por Luz"
                  direction={ldr.motor1.direction}
                  speedPwm={ldr.motor1.speed}
                  rpm={ldr.motor1.rpm}
                  voltage={ldr.motor1.voltage}
                  driverInputs={{
                    inA: ldr.isDark ? 'LOW' : 'HIGH',
                    inB: ldr.isDark ? 'HIGH' : 'LOW',
                    enable: 'D6 (200 PWM)',
                  }}
                  isPowered={isPowered}
                />

                {/* Motor DC 2 (Sonido / Aplausos) */}
                <DcMotorVisualizer
                  label="Motor DC 2"
                  subsystemLabel="Subsistema 2: Control por Sonido"
                  direction={sound.motor2.direction}
                  speedPwm={sound.motor2.speed}
                  rpm={sound.motor2.rpm}
                  voltage={sound.motor2.voltage}
                  driverInputs={{
                    inA: sound.motor2.enabled ? 'HIGH' : 'LOW',
                    inB: 'LOW',
                    enable: sound.motor2.enabled ? 'D12 (220 PWM)' : 'D12 (0)',
                  }}
                  isPowered={isPowered}
                />
              </div>
            </div>

            {/* Piezoelectric Buzzer Sound Feedback Strip */}
            <div className="mt-6 p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg border ${
                    security.buzzerActive
                      ? 'bg-red-500/20 border-red-500/50 text-red-400 animate-bounce'
                      : 'bg-slate-800 border-slate-700 text-slate-500'
                  }`}
                >
                  <Volume2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-200">
                    Buzzer Alarma (Pin Digital D8)
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Frecuencia: 2400 Hz piezoeléctrico • Sincronizado con cuenta regresiva del display
                  </div>
                </div>
              </div>
              <span className={`text-xs font-mono font-bold ${security.buzzerActive ? 'text-red-400' : 'text-slate-500'}`}>
                {security.buzzerActive ? 'EMITIENDO ALARMA ACÚSTICA' : 'SILENCIOSO'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
