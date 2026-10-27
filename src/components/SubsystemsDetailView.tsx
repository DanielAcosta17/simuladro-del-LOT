import React, { useState } from 'react';
import {
  Sun,
  Mic,
  ShieldAlert,
  Hash,
  Cpu,
  Zap,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

export const SubsystemsDetailView: React.FC = () => {
  const [activeSubsystem, setActiveSubsystem] = useState<number>(1);

  const subsystems = [
    {
      id: 1,
      title: 'Subsistema de control por luz',
      badge: 'LDR + L298N + Motor 1',
      icon: Sun,
      color: 'amber',
      components: [
        { name: 'Fotorresistencia (LDR)', desc: 'Detecta los cambios en la intensidad lumínica ambiental.' },
        { name: 'Resistencia de 10 kΩ', desc: 'Permite configurar un divisor de voltaje para lectura analógica en Arduino.' },
        { name: 'Motor DC 1', desc: 'Gira en sentido horario (CW) con luz y en sentido antihorario (CCW) con oscuridad.' },
        { name: 'Driver L298N', desc: 'Puente H para gobernar el sentido de giro e inyectar la corriente necesaria.' },
      ],
      operation:
        'La LDR envía una lectura analógica al Arduino por el pin A0. Según el nivel de luz detectado respecto al umbral calibrado (500), el Arduino ordena al driver L298N mediante los pines IN1, IN2 y ENA invertir el sentido de rotación del Motor 1.',
      pinConnections: [
        'LDR + 10k: Pin A0 (Analógico)',
        'L298N IN1: Pin Digital 4',
        'L298N IN2: Pin Digital 5',
        'L298N ENA (PWM): Pin Digital 6',
      ],
    },
    {
      id: 2,
      title: 'Subsistema de control por sonido',
      badge: 'SY-M213 + Motor 2 + LED',
      icon: Mic,
      color: 'blue',
      components: [
        { name: 'Sensor de sonido SY-M213', desc: 'Detecta pulsos acústicos fuertes como aplausos con umbral ajustable.' },
        { name: 'Motor DC 2', desc: 'Se enciende o apaga según el conteo de aplausos detectados.' },
        { name: 'LED Indicador (D13)', desc: 'Indica visualmente si el subsistema de sonido y motor 2 están activados.' },
        { name: 'Driver L298N', desc: 'Controla el encendido, apagado y sentido de giro del Motor 2.' },
      ],
      operation:
        'Un aplauso detectado activa el Motor 2 y enciende el LED indicador. Dos aplausos consecutivos dentro del intervalo establecido (aprox. 1 segundo) apagan el Motor 2 y el LED. Incorpora filtro de debounce para evitar falsos disparos.',
      pinConnections: [
        'Sensor SY-M213: Pin Digital 2',
        'L298N IN3: Pin Digital 7',
        'L298N IN4: Pin Digital 11',
        'L298N ENB (PWM): Pin Digital 12',
        'LED Indicador: Pin Digital 13',
      ],
    },
    {
      id: 3,
      title: 'Subsistema de seguridad por vibración',
      badge: 'SW-420 + Buzzer Alarma',
      icon: ShieldAlert,
      color: 'red',
      components: [
        { name: 'Sensor de vibración (SW-420)', desc: 'Detecta manipulación indebida, vibraciones mecánicas o golpes.' },
        { name: 'Buzzer Piezoeléctrico', desc: 'Emite una alarma acústica pulsada continua al detectarse manipulación.' },
        { name: 'Arduino UNO R4 WiFi', desc: 'Procesa la señal mediante interrupción externa y activa la cuenta regresiva.' },
      ],
      operation:
        'Cuando el sensor detecta una vibración, el microcontrolador activa el buzzer e inicia de inmediato la cuenta regresiva en el display. En la versión 2.0 del proyecto físico, el lector RFID ha sido retirado deliberadamente.',
      pinConnections: [
        'Sensor Vibración: Pin Digital 3 (Interrupción Externa)',
        'Buzzer Alarma: Pin Digital 8',
      ],
    },
    {
      id: 4,
      title: 'Subsistema de visualización y cuenta regresiva',
      badge: 'Display 7 Segmentos Ánodo Común',
      icon: Hash,
      color: 'purple',
      components: [
        { name: 'Display de 7 segmentos', desc: 'Muestra los números de la cuenta regresiva en secuencia desde 9 hasta 0.' },
        { name: 'Siete resistencias de 220 Ω', desc: 'Limitan la corriente de cada segmento (A..G) para no quemar el display.' },
        { name: 'Arduino UNO R4 WiFi', desc: 'Controla los 7 pines de salida a nivel LOW para encender los segmentos.' },
      ],
      operation:
        'Al detectarse una vibración, el display muestra 9, 8, 7... hasta llegar a 0 con intervalos de 1 segundo. Al finalizar la cuenta regresiva en 0, el buzzer se apaga automáticamente y la alarma regresa a reposo. Conexión de ánodo común a +5V con lógica activa en bajo (0 = ON).',
      pinConnections: [
        'Pin Común Ánodo: +5V del Arduino',
        'Segmento A: Pin Digital 9 (vía 220 Ω)',
        'Segmento B: Pin Digital 10 (vía 220 Ω)',
        'Segmentos C-G: Pines A1, A2, A3, A4, A5 (vía 220 Ω)',
      ],
    },
    {
      id: 5,
      title: 'Subsistema de control central',
      badge: 'Arduino UNO R4 WiFi & Protoboard',
      icon: Cpu,
      color: 'cyan',
      components: [
        { name: 'Arduino UNO R4 WiFi', desc: 'Controlador central con microprocesador RA4M1 (ARM Cortex-M4) y módulo ESP32-S3.' },
        { name: 'Protoboard de distribución', desc: 'Facilita el montaje, distribución de energía y conexiones de prueba.' },
        { name: 'Cables jumper', desc: 'Interconectan los pines analógicos y digitales entre placa, driver y sensores.' },
      ],
      operation:
        'Ejecuta el ciclo principal (loop) coordinando las tareas sinérgicamente: lectura de LDR, máquina de estados para doble aplauso, interrupción por vibración y despacho de telemetría Bluetooth.',
      pinConnections: [
        'Total pines digitales usados: 10',
        'Total pines analógicos usados: 6',
        'Comunicación Bluetooth: UART Serial1 / BLE integrado',
      ],
    },
    {
      id: 6,
      title: 'Subsistema de alimentación eléctrica',
      badge: '12V Motores + 5V Arduino + GND Común',
      icon: Zap,
      color: 'emerald',
      components: [
        { name: 'Fuente externa 5-12V DC', desc: 'Suministra alta corriente a los motores DC a través del driver L298N.' },
        { name: 'Conexión USB 5V Arduino', desc: 'Alimenta el microcontrolador y la lógica de los sensores durante las pruebas.' },
        { name: 'Driver L298N', desc: 'Regulador interno y distribución de potencia hacia los terminales de los motores.' },
        { name: 'Conexiones GND', desc: 'Establecen una referencia eléctrica común entre Arduino, driver y sensores.' },
      ],
      operation:
        'Provee energía limpia y segregada. Precaución: la salida de 12V nunca debe conectarse al pin de 5V del Arduino ni a los sensores para prevenir daños irreversibles. Todas las masas (GND) deben compartir nodo común.',
      pinConnections: [
        'Bornera L298N +12V: Fuente Externa Positiva',
        'Bornera L298N GND: Negativo Fuente + GND Arduino (Masa común)',
        'Bornera L298N +5V: Usado con jumper regulador según especificación',
      ],
    },
  ];

  const current = subsystems.find((s) => s.id === activeSubsystem) || subsystems[0];
  const IconComp = current.icon;

  return (
    <div className="space-y-6">
      {/* Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {subsystems.map((sub) => {
          const SubIcon = sub.icon;
          const isSelected = sub.id === activeSubsystem;
          return (
            <button
              key={sub.id}
              onClick={() => setActiveSubsystem(sub.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                isSelected
                  ? 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-600/20'
                  : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <SubIcon className="w-3.5 h-3.5" />
              <span>{sub.id}. {sub.title.replace('Subsistema de ', '')}</span>
            </button>
          );
        })}
      </div>

      {/* Detail Showcase Card */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-400">
              <IconComp className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-blue-400 font-semibold">
                Subsistema {current.id} de 6 • Versión 2.0
              </span>
              <h2 className="text-xl font-bold text-white tracking-tight">
                {current.title}
              </h2>
            </div>
          </div>
          <div className="text-xs font-mono text-slate-300 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
            {current.badge}
          </div>
        </div>

        {/* Content Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
          {/* Components list (6 cols) */}
          <div className="lg:col-span-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Componentes y Funciones Específicas</span>
            </h3>
            <div className="space-y-2.5">
              {current.components.map((comp, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-1"
                >
                  <div className="text-xs font-bold text-slate-200">
                    {comp.name}
                  </div>
                  <div className="text-xs text-slate-400 leading-relaxed">
                    {comp.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Operation & Wiring Connections (6 cols) */}
          <div className="lg:col-span-6 space-y-5">
            <div>
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-blue-400" />
                <span>Funcionamiento Operativo</span>
              </h3>
              <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl text-xs text-slate-300 leading-relaxed">
                {current.operation}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span>Conexiones y Pines de Hardware</span>
              </h3>
              <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-1.5">
                {current.pinConnections.map((pin, i) => (
                  <div key={i} className="text-xs font-mono text-cyan-300 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    <span>{pin}</span>
                  </div>
                ))}
              </div>
            </div>

            {current.id === 6 && (
              <div className="p-3.5 bg-amber-950/40 border border-amber-500/40 rounded-xl flex items-start gap-3 text-xs text-amber-200">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                <div>
                  <strong>Precaución crítica de alimentación:</strong> No conectes la salida de 12 V directamente al pin de 5 V del Arduino ni a los sensores. Todas las tierras (GND) deben compartir nodo común de referencia para evitar interferencias y comportamientos erráticos.
                </div>
              </div>
            )}

            {/* Real Hardware Reference Assembly Visual */}
            <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
              <div className="relative aspect-video">
                <img
                  src="/src/assets/images/arduino_r4_iot_workbench_1793067016355.jpg"
                  alt="Montaje de Hardware IoT Arduino UNO R4 WiFi y Driver L298N"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent flex items-end p-3">
                  <div className="text-[11px] font-mono text-slate-300">
                    Esquema físico real: Arduino UNO R4 WiFi + L298N + Motores DC + Protoboard
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
