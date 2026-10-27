import React, { useState, useRef, useEffect } from 'react';
import { TelemetryPacket } from '../types/iot';
import {
  Bluetooth,
  Terminal,
  Send,
  Trash2,
  Download,
  Wifi,
  Activity,
  Zap,
  Sun,
  Mic,
  Volume2,
} from 'lucide-react';

interface BluetoothPanelProps {
  isBluetoothConnected: boolean;
  bluetoothDeviceName: string;
  bluetoothBaudRate: number;
  telemetryHistory: TelemetryPacket[];
  serialLogs: Array<{ id: string; time: string; text: string; type: 'tx' | 'rx' | 'sys' }>;
  connectBluetoothReal: () => void;
  disconnectBluetooth: () => void;
  sendBluetoothCommand: (cmd: string) => void;
}

export const BluetoothPanel: React.FC<BluetoothPanelProps> = ({
  isBluetoothConnected,
  bluetoothDeviceName,
  bluetoothBaudRate,
  telemetryHistory,
  serialLogs,
  connectBluetoothReal,
  disconnectBluetooth,
  sendBluetoothCommand,
}) => {
  const [commandInput, setCommandInput] = useState('');
  const terminalBottomRef = useRef<HTMLDivElement>(null);
  const latestTelemetry = telemetryHistory[telemetryHistory.length - 1];

  const handleSendCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandInput.trim()) return;
    sendBluetoothCommand(commandInput.trim());
    setCommandInput('');
  };

  const handleExportLogs = () => {
    const textContent = serialLogs
      .map((log) => `[${log.time}] [${log.type.toUpperCase()}] ${log.text}`)
      .reverse()
      .join('\n');
    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `arduino_bluetooth_telemetry_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Bluetooth Connection Control Card */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div
              className={`p-3 rounded-xl border ${
                isBluetoothConnected
                  ? 'bg-blue-500/10 border-blue-500/40 text-blue-400'
                  : 'bg-slate-800 border-slate-700 text-slate-500'
              }`}
            >
              <Bluetooth className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">
                  Enlace de Comunicación Bluetooth (HC-05 / R4 BLE)
                </h2>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                    isBluetoothConnected
                      ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-400'
                      : 'bg-slate-950 border-slate-800 text-slate-500'
                  }`}
                >
                  {isBluetoothConnected ? 'CONECTADO Y TRANSMITIENDO' : 'DESCONECTADO'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isBluetoothConnected
                  ? `Vinculado con ${bluetoothDeviceName} • ${bluetoothBaudRate} Baudios • UART Serial1`
                  : 'Listo para emparejar con el módulo HC-05 o el Bluetooth LE del Arduino UNO R4 WiFi.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isBluetoothConnected ? (
              <button
                onClick={disconnectBluetooth}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
              >
                Desconectar
              </button>
            ) : (
              <button
                onClick={connectBluetoothReal}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2"
              >
                <Bluetooth className="w-4 h-4" />
                <span>Enlazar Módulo Bluetooth</span>
              </button>
            )}
          </div>
        </div>

        {/* Real-Time Live Decoded Numeric Dashboard */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6">
          {/* LDR Metric */}
          <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <Sun className="w-3 h-3 text-amber-400" />
                <span>Luz LDR</span>
              </span>
              <span className="font-mono text-[10px] text-blue-400">A0</span>
            </div>
            <div className="text-base font-bold text-white font-mono">
              {latestTelemetry ? latestTelemetry.ldrAdc : 0} <span className="text-xs text-slate-400">ADC</span>
            </div>
            <div className="text-[10px] text-slate-400">
              {latestTelemetry?.ldrAdc && latestTelemetry.ldrAdc >= 500 ? 'Luz Alta (≥500)' : 'Oscuridad (<500)'}
            </div>
          </div>

          {/* Motor 1 Metric */}
          <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-emerald-400" />
                <span>Motor 1 (Luz)</span>
              </span>
              <span className="font-mono text-[10px] text-blue-400">L298N</span>
            </div>
            <div className="text-base font-bold text-emerald-400 font-mono">
              {latestTelemetry ? latestTelemetry.motor1Dir : 'STOP'}
            </div>
            <div className="text-[10px] text-slate-400">
              PWM {latestTelemetry ? latestTelemetry.motor1Speed : 0}/255
            </div>
          </div>

          {/* Sound / Clap Metric */}
          <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <Mic className="w-3 h-3 text-cyan-400" />
                <span>Sonido dB</span>
              </span>
              <span className="font-mono text-[10px] text-blue-400">D2</span>
            </div>
            <div className="text-base font-bold text-white font-mono">
              {latestTelemetry ? latestTelemetry.soundDb : 40} <span className="text-xs text-slate-400">dB</span>
            </div>
            <div className="text-[10px] text-slate-400">
              Aplausos: {latestTelemetry ? latestTelemetry.clapCount : 0}
            </div>
          </div>

          {/* Motor 2 Metric */}
          <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-purple-400" />
                <span>Motor 2 + LED</span>
              </span>
              <span className="font-mono text-[10px] text-blue-400">D12/D13</span>
            </div>
            <div
              className={`text-base font-bold font-mono ${
                latestTelemetry?.motor2Active ? 'text-emerald-400' : 'text-slate-500'
              }`}
            >
              {latestTelemetry?.motor2Active ? 'ENCENDIDO' : 'APAGADO'}
            </div>
            <div className="text-[10px] text-slate-400">
              LED: {latestTelemetry?.ledActive ? 'ACTIVO' : 'OFF'}
            </div>
          </div>

          {/* Vibration / Alarm Metric */}
          <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <Activity className="w-3 h-3 text-red-400" />
                <span>Vibración</span>
              </span>
              <span className="font-mono text-[10px] text-blue-400">D3</span>
            </div>
            <div
              className={`text-base font-bold font-mono ${
                latestTelemetry?.vibration ? 'text-red-400 animate-pulse' : 'text-slate-300'
              }`}
            >
              {latestTelemetry?.vibration ? '¡IMPACTO!' : 'ESTABLE'}
            </div>
            <div className="text-[10px] text-slate-400">
              Interrupción FALLING
            </div>
          </div>

          {/* 7-Segment Countdown Metric */}
          <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <Volume2 className="w-3 h-3 text-red-400" />
                <span>Display / Buzzer</span>
              </span>
              <span className="font-mono text-[10px] text-blue-400">D8/7Seg</span>
            </div>
            <div
              className={`text-base font-bold font-mono ${
                latestTelemetry?.seg7Digit !== null ? 'text-red-400' : 'text-slate-500'
              }`}
            >
              {latestTelemetry?.seg7Digit !== null ? `CUENTA: ${latestTelemetry.seg7Digit}` : 'EN ESPERA'}
            </div>
            <div className="text-[10px] text-slate-400">
              Buzzer: {latestTelemetry?.buzzer ? 'SONANDO' : 'OFF'}
            </div>
          </div>
        </div>
      </div>

      {/* Split Section: Real-time Oscilloscope & Interactive Serial Terminal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Real-time Oscilloscope Graph (6 cols) */}
        <div className="lg:col-span-6 p-5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col justify-between shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Osciloscopio de Telemetría (LDR & Nivel Acústico)
              </h3>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono">
              <span className="flex items-center gap-1 text-amber-400">
                <span className="w-2 h-0.5 bg-amber-400 rounded-full" /> LDR ADC
              </span>
              <span className="flex items-center gap-1 text-cyan-400">
                <span className="w-2 h-0.5 bg-cyan-400 rounded-full" /> Sonido dB
              </span>
            </div>
          </div>

          {/* SVG Waveform Canvas */}
          <div className="w-full h-56 bg-slate-950 border border-slate-800/90 rounded-xl p-2 relative overflow-hidden flex items-end">
            {/* Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none p-3 opacity-20">
              <div className="border-b border-slate-700 w-full" />
              <div className="border-b border-slate-700 w-full" />
              <div className="border-b border-slate-700 w-full" />
              <div className="border-b border-slate-700 w-full" />
            </div>

            <svg viewBox="0 0 400 180" className="w-full h-full" preserveAspectRatio="none">
              {/* LDR threshold reference line at 500 (180 - (500/1023)*160 - 10) */}
              <line
                x1="0"
                y1={180 - (500 / 1023) * 160 - 10}
                x2="400"
                y2={180 - (500 / 1023) * 160 - 10}
                stroke="#d97706"
                strokeWidth="1"
                strokeDasharray="4 4"
                opacity="0.4"
              />

              {/* LDR ADC Polyline */}
              {telemetryHistory.length > 1 && (
                <polyline
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={telemetryHistory
                    .map((item, idx) => {
                      const x = (idx / (telemetryHistory.length - 1)) * 400;
                      const y = 180 - (item.ldrAdc / 1023) * 150 - 10;
                      return `${x.toFixed(1)},${y.toFixed(1)}`;
                    })
                    .join(' ')}
                />
              )}

              {/* Sound dB Polyline */}
              {telemetryHistory.length > 1 && (
                <polyline
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={telemetryHistory
                    .map((item, idx) => {
                      const x = (idx / (telemetryHistory.length - 1)) * 400;
                      const y = 180 - (item.soundDb / 100) * 150 - 10;
                      return `${x.toFixed(1)},${y.toFixed(1)}`;
                    })
                    .join(' ')}
                />
              )}
            </svg>
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mt-2 px-1">
            <span>-12s</span>
            <span>Muestreo continuo @ 250ms</span>
            <span>Ahora</span>
          </div>
        </div>

        {/* Interactive Serial Terminal & Command Transmitter (6 cols) */}
        <div className="lg:col-span-6 p-5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col justify-between shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Monitor Serial / Consola Bluetooth
              </h3>
            </div>
            <button
              onClick={handleExportLogs}
              title="Descargar registro de telemetría"
              className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>

          {/* Terminal log output */}
          <div className="w-full h-56 bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs overflow-y-auto space-y-1.5 scrollbar-thin">
            {serialLogs.slice(0, 40).map((log) => {
              let colorClass = 'text-slate-300';
              if (log.type === 'tx') colorClass = 'text-cyan-400 font-semibold';
              if (log.type === 'sys') colorClass = 'text-amber-400';
              if (log.text.includes('Alarma') || log.text.includes('Vibración'))
                colorClass = 'text-red-400 font-semibold';

              return (
                <div key={log.id} className="leading-relaxed flex items-start gap-2">
                  <span className="text-slate-500 text-[10px] shrink-0">[{log.time}]</span>
                  <span className={colorClass}>{log.text}</span>
                </div>
              );
            })}
            <div ref={terminalBottomRef} />
          </div>

          {/* Command Input Bar */}
          <form onSubmit={handleSendCommand} className="mt-3 flex items-center gap-2">
            <input
              type="text"
              value={commandInput}
              onChange={(e) => setCommandInput(e.target.value)}
              placeholder="Ej: M2_ON, CLAP, VIB_TRIGGER, ALARM_RESET..."
              className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
            <button
              type="submit"
              className="p-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-sm transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Quick Command Chips */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <button
              type="button"
              onClick={() => sendBluetoothCommand('CLAP')}
              className="px-2 py-1 text-[10px] font-mono bg-slate-950 text-slate-300 border border-slate-800 rounded hover:bg-slate-800"
            >
              CLAP
            </button>
            <button
              type="button"
              onClick={() => sendBluetoothCommand('M2_ON')}
              className="px-2 py-1 text-[10px] font-mono bg-slate-950 text-slate-300 border border-slate-800 rounded hover:bg-slate-800"
            >
              M2_ON
            </button>
            <button
              type="button"
              onClick={() => sendBluetoothCommand('M2_OFF')}
              className="px-2 py-1 text-[10px] font-mono bg-slate-950 text-slate-300 border border-slate-800 rounded hover:bg-slate-800"
            >
              M2_OFF
            </button>
            <button
              type="button"
              onClick={() => sendBluetoothCommand('VIB_TRIGGER')}
              className="px-2 py-1 text-[10px] font-mono bg-slate-950 text-slate-300 border border-slate-800 rounded hover:bg-slate-800"
            >
              VIB_TRIGGER
            </button>
            <button
              type="button"
              onClick={() => sendBluetoothCommand('ALARM_RESET')}
              className="px-2 py-1 text-[10px] font-mono bg-slate-950 text-slate-300 border border-slate-800 rounded hover:bg-slate-800"
            >
              ALARM_RESET
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
