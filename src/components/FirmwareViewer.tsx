import React, { useState } from 'react';
import { ARDUINO_UNO_R4_FIRMWARE_CODE } from '../utils/firmwareCode';
import { Copy, Check, Download, Code2, Cpu, ShieldCheck } from 'lucide-react';

export const FirmwareViewer: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(ARDUINO_UNO_R4_FIRMWARE_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([ARDUINO_UNO_R4_FIRMWARE_CODE], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Sistema_IoT_Arduino_R4_v2.ino';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
            <Code2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-tight">
                Código Firmware Arduino C++ (.ino)
              </h2>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                Arduino UNO R4 WiFi
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Programa completo listo para compilar y cargar en la placa física mediante Arduino IDE 2.x.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors flex items-center gap-2"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? '¡Copiado!' : 'Copiar Código'}</span>
          </button>
          <button
            onClick={handleDownload}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-600/25 transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Descargar .ino</span>
          </button>
        </div>
      </div>

      {/* Code Editor Preview */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        {/* Editor Top Bar */}
        <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
            <span className="ml-2 text-slate-300 font-semibold">Sistema_IoT_Arduino_R4_v2.ino</span>
          </div>
          <span>C++ • UNO R4 WiFi</span>
        </div>

        {/* Code Content */}
        <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto max-h-[580px] leading-relaxed scrollbar-thin">
          <code>{ARDUINO_UNO_R4_FIRMWARE_CODE}</code>
        </pre>
      </div>

      {/* Hardware Pinout Summary Footer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
          <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span>Pines L298N Motores</span>
          </div>
          <div className="text-xs text-slate-400 font-mono">
            M1: IN1(D4), IN2(D5), ENA(D6 PWM)<br />
            M2: IN3(D7), IN4(D11), ENB(D12 PWM)
          </div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
          <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Sensores & Alarma</span>
          </div>
          <div className="text-xs text-slate-400 font-mono">
            LDR: Pin A0 (Analógico)<br />
            Sonido SY-M213: Pin D2<br />
            Vibración: Pin D3 (ISR) | Buzzer: Pin D8
          </div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
          <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <span className="text-purple-400 font-bold">7S</span>
            <span>Display Ánodo Común</span>
          </div>
          <div className="text-xs text-slate-400 font-mono">
            Ánodo: +5V DC común<br />
            Segmentos A..G: Pines D9, D10, A1, A2, A3, A4, A5 (Activo en LOW)
          </div>
        </div>
      </div>
    </div>
  );
};
