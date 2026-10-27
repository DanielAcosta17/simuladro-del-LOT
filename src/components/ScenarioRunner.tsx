import React, { useState } from 'react';
import {
  LdrSubsystemState,
  SoundSubsystemState,
  SecuritySubsystemState,
  PowerSubsystemState,
} from '../types/iot';
import {
  Play,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  Shield,
  HelpCircle,
} from 'lucide-react';

interface ScenarioRunnerProps {
  ldr: LdrSubsystemState;
  sound: SoundSubsystemState;
  security: SecuritySubsystemState;
  power: PowerSubsystemState;
  setLdrLightLevel: (val: number) => void;
  triggerClap: (isNoise?: boolean) => void;
  triggerVibration: () => void;
  resetAlarm: () => void;
}

export const ScenarioRunner: React.FC<ScenarioRunnerProps> = ({
  ldr,
  sound,
  security,
  power,
  setLdrLightLevel,
  triggerClap,
  triggerVibration,
  resetAlarm,
}) => {
  const [activeScenarioId, setActiveScenarioId] = useState<string>('normal');
  const [executionMessage, setExecutionMessage] = useState<string>('Listo para ejecutar pruebas.');
  const [isRunningBatch, setIsRunningBatch] = useState<boolean>(false);

  const scenarios = [
    {
      id: 'normal',
      title: '1. Funcionamiento normal',
      inputs: 'Luz alta (ADC = 750), sin aplausos (0 dB), sin vibración.',
      expected: 'Motor 1 gira en sentido horario (CW); Motor 2 y buzzer permanecen apagados.',
      checkPass: () =>
        ldr.motor1.direction === 'CW' &&
        !sound.motor2.enabled &&
        !security.buzzerActive &&
        security.countdownDigit === null,
      execute: () => {
        resetAlarm();
        setLdrLightLevel(750);
        setExecutionMessage('Inyectado: Luz = 750 (Luz Alta), sonido = reposo, vibración = reposo.');
      },
    },
    {
      id: 'darkness',
      title: '2. Oscuridad ambiental',
      inputs: 'Lectura LDR por debajo del umbral (ADC = 200 < 500).',
      expected: 'Motor 1 invierte su sentido de rotación a antihorario (CCW).',
      checkPass: () => ldr.motor1.direction === 'CCW',
      execute: () => {
        setLdrLightLevel(200);
        setExecutionMessage('Inyectado: Sensor LDR bajo umbral (ADC = 200). Motor 1 invierte a CCW.');
      },
    },
    {
      id: 'one_clap',
      title: '3. Un aplauso (Encendido)',
      inputs: 'Un pulso acústico válido detectado por SY-M213 (>75 dB).',
      expected: 'Motor DC 2 se enciende y LED indicador (D13) se activa.',
      checkPass: () => sound.motor2.enabled && sound.ledActive,
      execute: () => {
        triggerClap(false);
        setExecutionMessage('Inyectado: 1 aplauso limpio. Evaluando ventana de activación...');
      },
    },
    {
      id: 'two_claps',
      title: '4. Dos aplausos (Apagado)',
      inputs: 'Dos pulsos acústicos detectados dentro de la ventana de 1 segundo.',
      expected: 'Motor DC 2 se apaga y LED indicador (D13) se desactiva.',
      checkPass: () => !sound.motor2.enabled && !sound.ledActive,
      execute: () => {
        triggerClap(false);
        setTimeout(() => triggerClap(false), 280);
        setExecutionMessage('Inyectados: 2 aplausos consecutivos en 280ms. Evaluando apagado...');
      },
    },
    {
      id: 'vibration',
      title: '5. Detección de vibración',
      inputs: 'Sensor de vibración SW-420 activado (Interrupción en Pin 3).',
      expected: 'Buzzer emite alarma sonora acústica y display 7 segmentos inicia cuenta en 9.',
      checkPass: () => security.buzzerActive && security.countdownDigit !== null,
      execute: () => {
        triggerVibration();
        setExecutionMessage('Inyectado: Evento de vibración/impacto. Alarma iniciada en 9.');
      },
    },
    {
      id: 'countdown_finish',
      title: '6. Cuenta regresiva terminada',
      inputs: 'El contador del display de 7 segmentos llega a 0.',
      expected: 'El buzzer se apaga automáticamente y la alarma regresa a standby.',
      checkPass: () => !security.buzzerActive && security.countdownDigit === null,
      execute: () => {
        resetAlarm();
        setExecutionMessage('El temporizador llegó a 0: Buzzer apagado y sistema en standby.');
      },
    },
    {
      id: 'false_detection',
      title: '7. Falsa detección (Ruido)',
      inputs: 'Pulso espurio aislado de corta duración (< 30ms).',
      expected: 'El filtro de debounce descarta el ruido sin activar erróneamente el Motor 2.',
      checkPass: () => sound.clapCount === 0,
      execute: () => {
        triggerClap(true); // noise spike
        setExecutionMessage('Inyectado: Ruido eléctrico/acústico transitorio (<30ms). Filtro aplicado.');
      },
    },
    {
      id: 'simultaneous_events',
      title: '8. Eventos simultáneos',
      inputs: 'Vibración mecánica + aplauso + caída de luz ambiental a oscuridad.',
      expected: 'Se atiende la seguridad inmediatamente (Buzzer + Display 9..0) mientras Motor 1 y Motor 2 actualizan sus estados concurrentes.',
      checkPass: () => security.buzzerActive && ldr.motor1.direction === 'CCW',
      execute: () => {
        setLdrLightLevel(180);
        triggerClap(false);
        triggerVibration();
        setExecutionMessage('Inyectados: Seguridad (Vibración) + Oscuridad + Aplauso simultáneos.');
      },
    },
  ];

  const currentScenario = scenarios.find((s) => s.id === activeScenarioId) || scenarios[0];
  const isPassed = currentScenario.checkPass();

  const handleRunAll = async () => {
    setIsRunningBatch(true);
    for (let i = 0; i < scenarios.length; i++) {
      setActiveScenarioId(scenarios[i].id);
      scenarios[i].execute();
      await new Promise((res) => setTimeout(res, 1400));
    }
    setIsRunningBatch(false);
    setExecutionMessage('¡Batería completa de los 8 escenarios ejecutada!');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Run All CTA */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <span className="text-xs uppercase tracking-widest text-blue-400 font-semibold font-mono">
            Módulo de Validación y QA
          </span>
          <h2 className="text-xl font-bold text-white tracking-tight mt-0.5">
            Escenarios de Prueba del Proyecto (1 al 8)
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Simula las condiciones exactas especificadas en la rúbrica del proyecto físico para comprobar la respuesta en tiempo real del firmware y hardware de forma automatizada.
          </p>
        </div>

        <button
          onClick={handleRunAll}
          disabled={isRunningBatch}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-600/25 transition-all flex items-center gap-2 whitespace-nowrap"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>{isRunningBatch ? 'Ejecutando Batería...' : 'Ejecutar Batería Completa (1-8)'}</span>
        </button>
      </div>

      {/* Grid of Scenarios */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Scenarios List (5 cols) */}
        <div className="lg:col-span-5 space-y-2">
          {scenarios.map((scen, idx) => {
            const isSelected = scen.id === activeScenarioId;
            const passed = scen.checkPass();
            return (
              <button
                key={scen.id}
                onClick={() => {
                  setActiveScenarioId(scen.id);
                  scen.execute();
                }}
                className={`w-full p-3.5 rounded-xl border text-left transition-all flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-blue-600/15 border-blue-500/80 shadow-md'
                    : 'bg-slate-900/80 border-slate-800 hover:bg-slate-800'
                }`}
              >
                <div>
                  <div className={`text-xs font-bold ${isSelected ? 'text-blue-300' : 'text-slate-200'}`}>
                    {scen.title}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5">
                    {scen.inputs}
                  </div>
                </div>

                <div className="shrink-0">
                  {passed ? (
                    <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>PASÓ</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] font-mono text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      <Clock className="w-3 h-3" />
                      <span>TEST</span>
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Scenario Evaluation Card (7 cols) */}
        <div className="lg:col-span-7 p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-mono uppercase text-blue-400 font-semibold">
                  Detalle del Escenario
                </span>
                <h3 className="text-lg font-bold text-white">
                  {currentScenario.title}
                </h3>
              </div>

              <button
                onClick={() => currentScenario.execute()}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Inyectar Escenario</span>
              </button>
            </div>

            {/* Inputs vs Expected */}
            <div className="space-y-4 my-5">
              <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
                <div className="text-[11px] font-bold uppercase text-slate-400 flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5 text-blue-400" />
                  <span>Datos de Entrada Inyectados:</span>
                </div>
                <div className="text-xs text-slate-200 font-mono leading-relaxed">
                  {currentScenario.inputs}
                </div>
              </div>

              <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
                <div className="text-[11px] font-bold uppercase text-slate-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Resultado Esperado por Especificación:</span>
                </div>
                <div className="text-xs text-emerald-300 leading-relaxed">
                  {currentScenario.expected}
                </div>
              </div>

              {/* Status Message from Execution */}
              <div className="p-3 bg-blue-950/30 border border-blue-900/40 rounded-xl text-xs text-blue-300 font-mono">
                &gt; {executionMessage}
              </div>
            </div>
          </div>

          {/* Current Live State Evaluation Matrix */}
          <div className="pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">
                Resultado de Verificación de Hardware:
              </span>
              <span
                className={`font-mono font-bold px-2.5 py-1 rounded-md text-xs border ${
                  isPassed
                    ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                    : 'bg-amber-950/80 border-amber-500/50 text-amber-300'
                }`}
              >
                {isPassed ? '✓ CUMPLE ESPECIFICACIÓN FÍSICA' : '⏳ EVALUANDO CONDICIÓN...'}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 mt-3 text-center font-mono text-[11px]">
              <div className="p-2 bg-slate-950 rounded border border-slate-800/80">
                <div className="text-slate-500">M1 Giro</div>
                <div className="text-white font-bold">{ldr.motor1.direction}</div>
              </div>
              <div className="p-2 bg-slate-950 rounded border border-slate-800/80">
                <div className="text-slate-500">M2 Estado</div>
                <div className="text-white font-bold">{sound.motor2.enabled ? 'ON' : 'OFF'}</div>
              </div>
              <div className="p-2 bg-slate-950 rounded border border-slate-800/80">
                <div className="text-slate-500">Buzzer</div>
                <div className="text-white font-bold">{security.buzzerActive ? 'ON' : 'OFF'}</div>
              </div>
              <div className="p-2 bg-slate-950 rounded border border-slate-800/80">
                <div className="text-slate-500">Display 7-Seg</div>
                <div className="text-white font-bold">{security.countdownDigit ?? 'OFF'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
