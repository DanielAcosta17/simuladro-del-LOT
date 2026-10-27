import { useState, useEffect, useRef, useCallback } from 'react';
import {
  LdrSubsystemState,
  SoundSubsystemState,
  SecuritySubsystemState,
  PowerSubsystemState,
  TelemetryPacket,
} from '../types/iot';
import { audioSynth } from '../utils/audio';

export function useIoTSimulator() {
  // 1. Power State
  const [power, setPower] = useState<PowerSubsystemState>({
    externalSupplyVoltage: 12.0,
    isExternalSupplyOn: true,
    usbVoltage: 5.0,
    isUsbConnected: true,
    l298n5vRegulatorEnabled: true,
    commonGndConnected: true,
    totalCurrentMa: 65,
  });

  // 2. LDR Subsystem
  const [ldr, setLdr] = useState<LdrSubsystemState>({
    rawAdc: 720, // Bright initial light
    lux: 650,
    threshold: 500,
    isDark: false,
    motor1: {
      enabled: true,
      direction: 'CW',
      speed: 200,
      rpm: 1450,
      voltage: 9.6,
      currentMa: 220,
    },
  });

  // 3. Sound Subsystem
  const [sound, setSound] = useState<SoundSubsystemState>({
    soundLevelDb: 42,
    thresholdDb: 75,
    isClapTriggered: false,
    clapCount: 0,
    lastClapTimestamp: 0,
    motor2: {
      enabled: false,
      direction: 'STOP',
      speed: 0,
      rpm: 0,
      voltage: 0,
      currentMa: 0,
    },
    ledActive: false,
    filterNoiseDebounceMs: 200,
  });

  // 4. Security & 7-Segment Subsystem
  const [security, setSecurity] = useState<SecuritySubsystemState>({
    vibrationDetected: false,
    vibrationIntensity: 0,
    alarmActive: false,
    buzzerActive: false,
    buzzerFrequency: 2400,
    countdownDigit: null,
    countdownRemainingSec: 0,
    countdownDurationSec: 9,
  });

  // Telemetry buffer & Bluetooth console logs
  const [telemetryHistory, setTelemetryHistory] = useState<TelemetryPacket[]>([]);
  const [serialLogs, setSerialLogs] = useState<Array<{ id: string; time: string; text: string; type: 'tx' | 'rx' | 'sys' }>>([
    {
      id: 'init-1',
      time: new Date().toLocaleTimeString(),
      text: '>>> Arduino UNO R4 WiFi IoT Firmware v2.0 Inicializado <<<',
      type: 'sys'
    },
    {
      id: 'init-2',
      time: new Date().toLocaleTimeString(),
      text: '[SYS] Driver L298N listo | Display Ánodo Común (5V) calibrado',
      type: 'sys'
    }
  ]);

  // Bluetooth Connection state
  const [isBluetoothConnected, setIsBluetoothConnected] = useState<boolean>(false);
  const [bluetoothDeviceName, setBluetoothDeviceName] = useState<string>('HC-05 (Arduino R4)');
  const [bluetoothBaudRate] = useState<number>(9600);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);

  // References for timers
  const clapWindowTimerRef = useRef<number | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);

  // Sound Mute Toggle
  const toggleAudioMute = useCallback(() => {
    setIsAudioMuted(prev => {
      const next = !prev;
      audioSynth.setMuted(next);
      return next;
    });
  }, []);

  // -------------------------------------------------------------
  // SUBSYSTEM 1: LDR LOGIC & MOTOR 1
  // -------------------------------------------------------------
  const setLdrLightLevel = useCallback((rawAdcVal: number) => {
    const clamped = Math.max(0, Math.min(1023, Math.round(rawAdcVal)));
    const lux = Math.round((clamped / 1023) * 1000);
    const isDark = clamped < 500;

    setLdr(prev => {
      const hasPower = power.isExternalSupplyOn && power.commonGndConnected && power.isUsbConnected;
      const direction = hasPower ? (isDark ? 'CCW' : 'CW') : 'STOP';
      const speed = hasPower ? 200 : 0;
      const rpm = hasPower ? (isDark ? -1450 : 1450) : 0;
      const voltage = hasPower ? 9.6 : 0;
      const currentMa = hasPower ? 230 : 0;

      return {
        ...prev,
        rawAdc: clamped,
        lux,
        isDark,
        motor1: {
          ...prev.motor1,
          enabled: hasPower,
          direction,
          speed,
          rpm,
          voltage,
          currentMa,
        },
      };
    });
  }, [power.isExternalSupplyOn, power.commonGndConnected, power.isUsbConnected]);

  // Recalculate Motor 1 when power states change
  useEffect(() => {
    setLdrLightLevel(ldr.rawAdc);
  }, [power.isExternalSupplyOn, power.commonGndConnected, power.isUsbConnected, setLdrLightLevel, ldr.rawAdc]);

  // -------------------------------------------------------------
  // SUBSYSTEM 2: SOUND SENSOR SY-M213 & MOTOR 2 + LED LOGIC
  // -------------------------------------------------------------
  const triggerClap = useCallback((isNoiseSpike: boolean = false) => {
    const now = Date.now();
    audioSynth.playClapSound();

    // Noise filter test scenario: isolated brief spike (<30ms) is discarded by debounce
    if (isNoiseSpike) {
      setSound(prev => ({
        ...prev,
        soundLevelDb: 88,
        isClapTriggered: true,
      }));
      setTimeout(() => {
        setSound(prev => ({ ...prev, soundLevelDb: 42, isClapTriggered: false }));
      }, 50);

      setSerialLogs(prev => [
        {
          id: `log-${Date.now()}`,
          time: new Date().toLocaleTimeString(),
          text: '[FILTRO] Ruido espurio descartado por filtro de debounce (< 30ms)',
          type: 'sys',
        },
        ...prev.slice(0, 50),
      ]);
      return;
    }

    // Valid clap detection
    setSound(prev => {
      const newCount = prev.clapCount + 1;
      return {
        ...prev,
        soundLevelDb: 92,
        isClapTriggered: true,
        clapCount: newCount,
        lastClapTimestamp: now,
      };
    });

    setTimeout(() => {
      setSound(prev => ({ ...prev, soundLevelDb: 42, isClapTriggered: false }));
    }, 180);

    // If timer already running, reset it and wait for window end
    if (clapWindowTimerRef.current) {
      window.clearTimeout(clapWindowTimerRef.current);
    }

    clapWindowTimerRef.current = window.setTimeout(() => {
      setSound(currentSound => {
        const claps = currentSound.clapCount;
        let nextMotorActive = currentSound.motor2.enabled;

        const hasPower = power.isExternalSupplyOn && power.commonGndConnected && power.isUsbConnected;

        if (claps === 1) {
          // 1 clap: Turn ON Motor 2 and LED
          nextMotorActive = true;
          setSerialLogs(prev => [
            {
              id: `log-${Date.now()}`,
              time: new Date().toLocaleTimeString(),
              text: '[SONIDO] 1 Aplauso detectado -> Motor DC 2: ENCENDIDO (CW) | LED: ACTIVADO',
              type: 'rx',
            },
            ...prev.slice(0, 50),
          ]);
        } else if (claps >= 2) {
          // 2 claps: Turn OFF Motor 2 and LED
          nextMotorActive = false;
          setSerialLogs(prev => [
            {
              id: `log-${Date.now()}`,
              time: new Date().toLocaleTimeString(),
              text: '[SONIDO] 2 Aplausos detectados -> Motor DC 2: APAGADO | LED: DESACTIVADO',
              type: 'rx',
            },
            ...prev.slice(0, 50),
          ]);
        }

        const motor2Enabled = nextMotorActive && hasPower;

        return {
          ...currentSound,
          clapCount: 0,
          ledActive: nextMotorActive && power.isUsbConnected,
          motor2: {
            ...currentSound.motor2,
            enabled: motor2Enabled,
            direction: motor2Enabled ? 'CW' : 'STOP',
            speed: motor2Enabled ? 220 : 0,
            rpm: motor2Enabled ? 1600 : 0,
            voltage: motor2Enabled ? 10.4 : 0,
            currentMa: motor2Enabled ? 280 : 0,
          },
        };
      });
      clapWindowTimerRef.current = null;
    }, 850); // 850ms double clap detection window
  }, [power.isExternalSupplyOn, power.commonGndConnected, power.isUsbConnected]);

  // -------------------------------------------------------------
  // SUBSYSTEM 3 & 4: VIBRATION, BUZZER ALARM & 7-SEGMENT COUNTDOWN
  // -------------------------------------------------------------
  const triggerVibration = useCallback(() => {
    audioSynth.playVibrationThud();

    setSecurity(prev => {
      // If already counting down, don't restart interval if active
      if (prev.alarmActive && countdownIntervalRef.current) {
        return { ...prev, vibrationDetected: true };
      }

      // Start alarm sound
      audioSynth.startBuzzerAlarm();

      setSerialLogs(logs => [
        {
          id: `log-${Date.now()}`,
          time: new Date().toLocaleTimeString(),
          text: '[SEGURIDAD] ¡Vibración detectada! Alarma acústica (Buzzer) y Display 7 segmentos activados.',
          type: 'rx',
        },
        ...logs.slice(0, 50),
      ]);

      return {
        ...prev,
        vibrationDetected: true,
        alarmActive: true,
        buzzerActive: true,
        countdownDigit: 9,
        countdownRemainingSec: 9,
      };
    });

    // Clear vibration blink
    setTimeout(() => {
      setSecurity(prev => ({ ...prev, vibrationDetected: false }));
    }, 400);

    // Start 1-second interval countdown from 9 to 0
    if (countdownIntervalRef.current) {
      window.clearInterval(countdownIntervalRef.current);
    }

    countdownIntervalRef.current = window.setInterval(() => {
      setSecurity(prev => {
        if (prev.countdownDigit === null || prev.countdownDigit <= 0) {
          // Finished countdown to 0!
          audioSynth.stopBuzzerAlarm();
          if (countdownIntervalRef.current) {
            window.clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }

          setSerialLogs(logs => [
            {
              id: `log-${Date.now()}`,
              time: new Date().toLocaleTimeString(),
              text: '[SEGURIDAD] Cuenta regresiva finalizada (0) -> Buzzer APAGADO | Sistema en reposo',
              type: 'rx',
            },
            ...logs.slice(0, 50),
          ]);

          return {
            ...prev,
            alarmActive: false,
            buzzerActive: false,
            countdownDigit: null,
            countdownRemainingSec: 0,
          };
        }

        const nextDigit = prev.countdownDigit - 1;
        return {
          ...prev,
          countdownDigit: nextDigit,
          countdownRemainingSec: nextDigit,
        };
      });
    }, 1000);
  }, []);

  const resetAlarm = useCallback(() => {
    audioSynth.stopBuzzerAlarm();
    if (countdownIntervalRef.current) {
      window.clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setSecurity(prev => ({
      ...prev,
      alarmActive: false,
      buzzerActive: false,
      countdownDigit: null,
      countdownRemainingSec: 0,
      vibrationDetected: false,
    }));

    setSerialLogs(logs => [
      {
        id: `log-${Date.now()}`,
        time: new Date().toLocaleTimeString(),
        text: '[SEGURIDAD] Alarma reseteada manualmente a STANDBY',
        type: 'sys',
      },
      ...logs.slice(0, 50),
    ]);
  }, []);

  // -------------------------------------------------------------
  // SUBSYSTEM 6: POWER SUBSYSTEM TOGGLES
  // -------------------------------------------------------------
  const toggleExternalSupply = useCallback(() => {
    setPower(prev => {
      const nextState = !prev.isExternalSupplyOn;
      setSerialLogs(logs => [
        {
          id: `log-${Date.now()}`,
          time: new Date().toLocaleTimeString(),
          text: `[ALIMENTACIÓN] Fuente externa 12V DC ${nextState ? 'CONECTADA' : 'DESCONECTADA'}`,
          type: 'sys',
        },
        ...logs.slice(0, 50),
      ]);
      return {
        ...prev,
        isExternalSupplyOn: nextState,
      };
    });
  }, []);

  const toggleUsbPower = useCallback(() => {
    setPower(prev => {
      const nextState = !prev.isUsbConnected;
      setSerialLogs(logs => [
        {
          id: `log-${Date.now()}`,
          time: new Date().toLocaleTimeString(),
          text: `[ALIMENTACIÓN] Cable USB 5V Arduino ${nextState ? 'ENCHUFADO' : 'DESCONECTADO'}`,
          type: 'sys',
        },
        ...logs.slice(0, 50),
      ]);
      return {
        ...prev,
        isUsbConnected: nextState,
      };
    });
  }, []);

  const toggleCommonGnd = useCallback(() => {
    setPower(prev => {
      const nextState = !prev.commonGndConnected;
      setSerialLogs(logs => [
        {
          id: `log-${Date.now()}`,
          time: new Date().toLocaleTimeString(),
          text: `[ALIMENTACIÓN] Bus de Tierra Común (GND) ${nextState ? 'CERRADO' : 'ABIERTO / FLOTANTE (ADVERTENCIA)'}`,
          type: 'sys',
        },
        ...logs.slice(0, 50),
      ]);
      return {
        ...prev,
        commonGndConnected: nextState,
      };
    });
  }, []);

  // Update total current
  useEffect(() => {
    let current = 0;
    if (power.isUsbConnected) current += 45; // Arduino R4 idle
    if (sound.ledActive) current += 18;
    if (security.buzzerActive) current += 35;
    if (security.countdownDigit !== null) current += 25;
    if (power.isExternalSupplyOn && power.commonGndConnected) {
      if (ldr.motor1.enabled) current += ldr.motor1.currentMa;
      if (sound.motor2.enabled) current += sound.motor2.currentMa;
    }
    setPower(prev => ({ ...prev, totalCurrentMa: current }));
  }, [
    power.isUsbConnected,
    power.isExternalSupplyOn,
    power.commonGndConnected,
    sound.ledActive,
    security.buzzerActive,
    security.countdownDigit,
    ldr.motor1.enabled,
    ldr.motor1.currentMa,
    sound.motor2.enabled,
    sound.motor2.currentMa,
  ]);

  // -------------------------------------------------------------
  // BLUETOOTH & TELEMETRY STREAM
  // -------------------------------------------------------------
  const connectBluetoothReal = async () => {
    try {
      const navAny = navigator as unknown as { bluetooth?: { requestDevice: (opts: unknown) => Promise<{ name?: string }> } };
      if (!navAny.bluetooth) {
        setSerialLogs(logs => [
          {
            id: `log-${Date.now()}`,
            time: new Date().toLocaleTimeString(),
            text: '[BLUETOOTH] Web Bluetooth no está disponible en este navegador o iframe. Activando Emulador HC-05.',
            type: 'sys',
          },
          ...logs.slice(0, 50),
        ]);
        setIsBluetoothConnected(true);
        setBluetoothDeviceName('HC-05 Emulado (UART 9600)');
        return;
      }

      setSerialLogs(logs => [
        {
          id: `log-${Date.now()}`,
          time: new Date().toLocaleTimeString(),
          text: '[BLUETOOTH] Buscando dispositivos Bluetooth (HC-05 / Arduino UNO R4)...',
          type: 'sys',
        },
        ...logs.slice(0, 50),
      ]);

      const device = await navAny.bluetooth.requestDevice({
        acceptAllDevices: true,
      });

      setIsBluetoothConnected(true);
      setBluetoothDeviceName(device.name || 'Dispositivo Bluetooth Conectado');
      setSerialLogs(logs => [
        {
          id: `log-${Date.now()}`,
          time: new Date().toLocaleTimeString(),
          text: `[BLUETOOTH] ¡Enlace establecido con ${device.name || 'Bluetooth Device'}!`,
          type: 'sys',
        },
        ...logs.slice(0, 50),
      ]);
    } catch {
      // Fallback to seamless emulator mode
      setIsBluetoothConnected(true);
      setBluetoothDeviceName('Arduino R4 WiFi BLE (Modo Virtual)');
      setSerialLogs(logs => [
        {
          id: `log-${Date.now()}`,
          time: new Date().toLocaleTimeString(),
          text: '[BLUETOOTH] Enlace virtual activado con puerto serie Arduino UNO R4 WiFi.',
          type: 'sys',
        },
        ...logs.slice(0, 50),
      ]);
    }
  };

  const disconnectBluetooth = useCallback(() => {
    setIsBluetoothConnected(false);
    setSerialLogs(logs => [
      {
        id: `log-${Date.now()}`,
        time: new Date().toLocaleTimeString(),
        text: '[BLUETOOTH] Conexión Bluetooth finalizada.',
        type: 'sys',
      },
      ...logs.slice(0, 50),
    ]);
  }, []);

  const sendBluetoothCommand = useCallback((commandText: string) => {
    const cmd = commandText.trim().toUpperCase();
    if (!cmd) return;

    setSerialLogs(logs => [
      {
        id: `log-${Date.now()}`,
        time: new Date().toLocaleTimeString(),
        text: `> ${cmd}`,
        type: 'tx',
      },
      ...logs.slice(0, 50),
    ]);

    // Handle commands
    if (cmd === 'M1_CW' || cmd === 'LIGHT_HIGH') {
      setLdrLightLevel(800);
    } else if (cmd === 'M1_CCW' || cmd === 'LIGHT_LOW') {
      setLdrLightLevel(200);
    } else if (cmd === 'CLAP') {
      triggerClap();
    } else if (cmd === 'CLAP_X2') {
      triggerClap();
      setTimeout(() => triggerClap(), 300);
    } else if (cmd === 'VIB_TRIGGER' || cmd === 'ALARM_TRIGGER') {
      triggerVibration();
    } else if (cmd === 'ALARM_RESET') {
      resetAlarm();
    } else if (cmd === 'M2_ON') {
      setSound(prev => ({
        ...prev,
        ledActive: true,
        motor2: { ...prev.motor2, enabled: true, direction: 'CW', speed: 220, rpm: 1600, voltage: 10.4, currentMa: 280 }
      }));
    } else if (cmd === 'M2_OFF') {
      setSound(prev => ({
        ...prev,
        ledActive: false,
        motor2: { ...prev.motor2, enabled: false, direction: 'STOP', speed: 0, rpm: 0, voltage: 0, currentMa: 0 }
      }));
    } else if (cmd.startsWith('SET_LDR')) {
      const parts = cmd.split(' ');
      if (parts[1]) {
        const val = parseInt(parts[1], 10);
        if (!isNaN(val)) setLdrLightLevel(val);
      }
    } else {
      setSerialLogs(logs => [
        {
          id: `log-${Date.now()}`,
          time: new Date().toLocaleTimeString(),
          text: `[ARDUINO] Comando desconocido: "${cmd}". Comandos: M1_CW, M1_CCW, CLAP, CLAP_X2, VIB_TRIGGER, ALARM_RESET, M2_ON, M2_OFF, SET_LDR <0-1023>`,
          type: 'rx',
        },
        ...logs.slice(0, 50),
      ]);
    }
  }, [setLdrLightLevel, triggerClap, triggerVibration, resetAlarm]);

  // Periodic Telemetry Generation & History Loop (every 300ms)
  useEffect(() => {
    const interval = setInterval(() => {
      const packet: TelemetryPacket = {
        timestamp: Date.now(),
        ldrAdc: ldr.rawAdc,
        motor1Dir: ldr.motor1.direction,
        motor1Speed: ldr.motor1.speed,
        soundDb: sound.soundLevelDb,
        clapCount: sound.clapCount,
        motor2Active: sound.motor2.enabled,
        ledActive: sound.ledActive,
        vibration: security.vibrationDetected,
        buzzer: security.buzzerActive,
        seg7Digit: security.countdownDigit,
        bluetoothConnected: isBluetoothConnected,
      };

      setTelemetryHistory(prev => {
        const next = [...prev, packet];
        return next.length > 40 ? next.slice(next.length - 40) : next;
      });
    }, 300);

    return () => clearInterval(interval);
  }, [ldr, sound, security, isBluetoothConnected]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      audioSynth.stopBuzzerAlarm();
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      if (clapWindowTimerRef.current) clearTimeout(clapWindowTimerRef.current);
    };
  }, []);

  return {
    power,
    ldr,
    sound,
    security,
    telemetryHistory,
    serialLogs,
    isBluetoothConnected,
    bluetoothDeviceName,
    bluetoothBaudRate,
    isAudioMuted,
    setLdrLightLevel,
    triggerClap,
    triggerVibration,
    resetAlarm,
    toggleExternalSupply,
    toggleUsbPower,
    toggleCommonGnd,
    toggleAudioMute,
    connectBluetoothReal,
    disconnectBluetooth,
    sendBluetoothCommand,
  };
}
