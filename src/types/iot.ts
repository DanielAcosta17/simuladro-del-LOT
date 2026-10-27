export type MotorDirection = 'CW' | 'CCW' | 'STOP';

export interface MotorState {
  enabled: boolean;
  direction: MotorDirection;
  speed: number; // 0 to 255 PWM
  rpm: number; // calculated visual rpm
  voltage: number; // volts applied via L298N
  currentMa: number; // estimated milliamps
}

export interface LdrSubsystemState {
  rawAdc: number; // 0 to 1023 (analog A0)
  lux: number; // calculated illuminance (0 - 1000 lx)
  threshold: number; // default 500
  isDark: boolean;
  motor1: MotorState;
}

export interface SoundSubsystemState {
  soundLevelDb: number; // 30 - 100 dB
  thresholdDb: number; // default 75 dB
  isClapTriggered: boolean;
  clapCount: number;
  lastClapTimestamp: number;
  motor2: MotorState;
  ledActive: boolean;
  filterNoiseDebounceMs: number;
}

export interface SecuritySubsystemState {
  vibrationDetected: boolean;
  vibrationIntensity: number; // 0 - 100%
  alarmActive: boolean;
  buzzerActive: boolean;
  buzzerFrequency: number; // Hz
  countdownDigit: number | null; // 9 down to 0, null when idle
  countdownRemainingSec: number;
  countdownDurationSec: number;
}

export interface PowerSubsystemState {
  externalSupplyVoltage: number; // 12.0 V DC
  isExternalSupplyOn: boolean;
  usbVoltage: number; // 5.0 V DC
  isUsbConnected: boolean;
  l298n5vRegulatorEnabled: boolean;
  commonGndConnected: boolean;
  totalCurrentMa: number;
}

export interface TelemetryPacket {
  timestamp: number;
  ldrAdc: number;
  motor1Dir: MotorDirection;
  motor1Speed: number;
  soundDb: number;
  clapCount: number;
  motor2Active: boolean;
  ledActive: boolean;
  vibration: boolean;
  buzzer: boolean;
  seg7Digit: number | null;
  bluetoothConnected: boolean;
}

export type ScenarioId =
  | 'normal'
  | 'darkness'
  | 'one_clap'
  | 'two_claps'
  | 'vibration'
  | 'countdown_finish'
  | 'false_detection'
  | 'simultaneous_events';

export interface ScenarioDefinition {
  id: ScenarioId;
  title: string;
  category: string;
  inputDescription: string;
  expectedResult: string;
  runScenario: () => void;
}
