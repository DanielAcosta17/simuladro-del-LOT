export const ARDUINO_UNO_R4_FIRMWARE_CODE = `/*
  =============================================================================
  PROYECTO: Sistema IoT Inteligente con Arduino UNO R4 WiFi — Versión 2.0
  SUBSISTEMAS:
    1. Control por Luz (LDR + Divisor 10k + Driver L298N + Motor DC 1)
    2. Control por Sonido (Sensor SY-M213 + Driver L298N + Motor DC 2 + LED)
    3. Seguridad por Vibración (Sensor de Vibración + Buzzer Activo/Pasivo)
    4. Visualización y Cuenta Regresiva (Display 7 Segmentos Ánodo Común 9 a 0)
    5. Conectividad Bluetooth (HC-05 / Serial1 o BLE integrado Arduino R4)
    6. Alimentación Eléctrica Externa (12V Motores, 5V Arduino, GND común)
  =============================================================================
*/

#include <Arduino.h>

// -------------------------------------------------------------
// DEFINICIÓN DE PINES
// -------------------------------------------------------------

// Subsistema 1: Control por Luz
const int PIN_LDR = A0;             // Fotorresistencia con divisor 10 kΩ
const int PIN_M1_IN1 = 4;           // Driver L298N IN1
const int PIN_M1_IN2 = 5;           // Driver L298N IN2
const int PIN_M1_ENA = 6;           // Driver L298N ENA (PWM)

// Subsistema 2: Control por Sonido
const int PIN_SOUND = 2;            // Sensor de sonido SY-M213 (salida digital)
const int PIN_M2_IN3 = 7;           // Driver L298N IN3
const int PIN_M2_IN4 = 11;          // Driver L298N IN4
const int PIN_M2_ENB = 12;          // Driver L298N ENB (PWM/Digital)
const int PIN_LED_INDICATOR = 13;   // LED indicador de estado del sistema

// Subsistema 3: Seguridad por Vibración
const int PIN_VIBRATION = 3;        // Sensor de vibración SW-420 (Interrupción)
const int PIN_BUZZER = 8;           // Buzzer de alarma

// Subsistema 4: Display 7 Segmentos (ÁNODO COMÚN)
// Ánodo a +5V. Segmentos activos en nivel BAJO (LOW = Encendido, HIGH = Apagado)
const int SEG_PINS[7] = {
  9,   // Segmento A
  10,  // Segmento B
  A1,  // Segmento C
  A2,  // Segmento D
  A3,  // Segmento E
  A4,  // Segmento F
  A5   // Segmento G
};

// Tabla de dígitos 0-9 para Ánodo Común (0 = Encendido, 1 = Apagado)
// {A, B, C, D, E, F, G}
const byte DIGIT_PATTERNS[10][7] = {
  {0, 0, 0, 0, 0, 0, 1}, // 0
  {1, 0, 0, 1, 1, 1, 1}, // 1
  {0, 0, 1, 0, 0, 1, 0}, // 2
  {0, 0, 0, 0, 1, 1, 0}, // 3
  {1, 0, 0, 1, 1, 0, 0}, // 4
  {0, 1, 0, 0, 1, 0, 0}, // 5
  {0, 1, 0, 0, 0, 0, 0}, // 6
  {0, 0, 0, 1, 1, 1, 1}, // 7
  {0, 0, 0, 0, 0, 0, 0}, // 8
  {0, 0, 0, 0, 1, 0, 0}  // 9
};

// -------------------------------------------------------------
// VARIABLES Y ESTADOS DEL SISTEMA
// -------------------------------------------------------------
const int UMBRAL_LUZ = 500;         // Umbral LDR (>= 500 Luz, < 500 Oscuridad)
const int PWM_VELOCIDAD_M1 = 200;   // Velocidad PWM Motor 1
const int PWM_VELOCIDAD_M2 = 220;   // Velocidad PWM Motor 2

// Control de aplausos
bool motor2Activo = false;
volatile int contadorAplausos = 0;
unsigned long tiempoPrimerAplauso = 0;
const unsigned long VENTANA_DOBLE_APLAUSO = 1000; // 1 segundo máximo entre aplausos
const unsigned long DEBOUNCE_APLAUSO = 200;        // Filtro antirrebote

// Control de alarma y cuenta regresiva
volatile bool alarmaActivada = false;
int cuentaRegresiva = -1;
unsigned long ultimoSegundoCuenta = 0;

// Temporización de telemetría Bluetooth
unsigned long ultimoEnvioTelemetria = 0;
const unsigned long INTERVALO_TELEMETRIA = 250; // Cada 250 ms

// -------------------------------------------------------------
// RUTINAS DE INTERRUPCIÓN
// -------------------------------------------------------------
void ISR_Vibracion() {
  // Cuando se detecta vibración, se activa inmediatamente la alarma si está en reposo
  if (!alarmaActivada) {
    alarmaActivada = true;
    cuentaRegresiva = 9; // Inicia en 9
    ultimoSegundoCuenta = millis();
  }
}

// -------------------------------------------------------------
// FUNCIONES AUXILIARES DE HARDWARE
// -------------------------------------------------------------
void apagarDisplay() {
  for (int i = 0; i < 7; i++) {
    digitalWrite(SEG_PINS[i], HIGH); // HIGH apaga en Ánodo Común
  }
}

void mostrarDigito(int digito) {
  if (digito < 0 || digito > 9) {
    apagarDisplay();
    return;
  }
  for (int i = 0; i < 7; i++) {
    digitalWrite(SEG_PINS[i], DIGIT_PATTERNS[digito][i]);
  }
}

void controlarMotor1(int lecturaLuz) {
  // Con luz gira en un sentido (Horario), con oscuridad en sentido contrario (Antihorario)
  if (lecturaLuz >= UMBRAL_LUZ) {
    // Sentido Horario (Luz)
    digitalWrite(PIN_M1_IN1, HIGH);
    digitalWrite(PIN_M1_IN2, LOW);
    analogWrite(PIN_M1_ENA, PWM_VELOCIDAD_M1);
  } else {
    // Sentido Antihorario (Oscuridad)
    digitalWrite(PIN_M1_IN1, LOW);
    digitalWrite(PIN_M1_IN2, HIGH);
    analogWrite(PIN_M1_ENA, PWM_VELOCIDAD_M1);
  }
}

void controlarMotor2(bool encendido) {
  if (encendido) {
    digitalWrite(PIN_M2_IN3, HIGH);
    digitalWrite(PIN_M2_IN4, LOW);
    analogWrite(PIN_M2_ENB, PWM_VELOCIDAD_M2);
    digitalWrite(PIN_LED_INDICATOR, HIGH);
  } else {
    digitalWrite(PIN_M2_IN3, LOW);
    digitalWrite(PIN_M2_IN4, LOW);
    analogWrite(PIN_M2_ENB, 0);
    digitalWrite(PIN_LED_INDICATOR, LOW);
  }
}

void enviarTelemetriaBluetooth(int ldrValor) {
  // Paquete JSON estándar para el simulador y la aplicación de monitoreo
  Serial.print("{\\"t\\":");
  Serial.print(millis());
  Serial.print(",\\"ldr\\":");
  Serial.print(ldrValor);
  Serial.print(",\\"m1\\":\\");
  Serial.print((ldrValor >= UMBRAL_LUZ) ? "CW" : "CCW");
  Serial.print("\\",\\"m2\\":");
  Serial.print(motor2Activo ? 1 : 0);
  Serial.print(",\\"led\\":");
  Serial.print(motor2Activo ? 1 : 0);
  Serial.print(",\\"alarm\\":");
  Serial.print(alarmaActivada ? 1 : 0);
  Serial.print(",\\"seg7\\":");
  Serial.print(cuentaRegresiva);
  Serial.println("}");
}

// -------------------------------------------------------------
// SETUP
// -------------------------------------------------------------
void setup() {
  Serial.begin(115200);   // Monitor serie USB
  Serial1.begin(9600);    // Puerto Bluetooth HC-05 (TX1/RX1 en Arduino R4)

  // Configuración de pines de entrada
  pinMode(PIN_LDR, INPUT);
  pinMode(PIN_SOUND, INPUT);
  pinMode(PIN_VIBRATION, INPUT_PULLUP);

  // Configuración de pines de salida L298N
  pinMode(PIN_M1_IN1, OUTPUT);
  pinMode(PIN_M1_IN2, OUTPUT);
  pinMode(PIN_M1_ENA, OUTPUT);
  pinMode(PIN_M2_IN3, OUTPUT);
  pinMode(PIN_M2_IN4, OUTPUT);
  pinMode(PIN_M2_ENB, OUTPUT);

  // Indicador y Alarma
  pinMode(PIN_LED_INDICATOR, OUTPUT);
  pinMode(PIN_BUZZER, OUTPUT);
  digitalWrite(PIN_BUZZER, LOW);
  digitalWrite(PIN_LED_INDICATOR, LOW);

  // Configuración pines Display 7 Segmentos
  for (int i = 0; i < 7; i++) {
    pinMode(SEG_PINS[i], OUTPUT);
  }
  apagarDisplay();

  // Interrupción para detección de vibración (Pin 3)
  attachInterrupt(digitalPinToInterrupt(PIN_VIBRATION), ISR_Vibracion, FALLING);

  Serial.println(">>> Sistema IoT Arduino UNO R4 WiFi v2.0 Iniciado <<<");
}

// -------------------------------------------------------------
// LOOP PRINCIPAL (COORDINACIÓN DE SUBSISTEMAS)
// -------------------------------------------------------------
void loop() {
  unsigned long tiempoActual = millis();

  // 1. SUBSISTEMA DE CONTROL POR LUZ
  int lecturaLdr = analogRead(PIN_LDR);
  controlarMotor1(lecturaLdr);

  // 2. SUBSISTEMA DE CONTROL POR SONIDO (APLAUSOS)
  static unsigned long ultimoPulsoSonido = 0;
  int estadoSonido = digitalRead(PIN_SOUND);

  if (estadoSonido == HIGH && (tiempoActual - ultimoPulsoSonido > DEBOUNCE_APLAUSO)) {
    ultimoPulsoSonido = tiempoActual;
    contadorAplausos++;

    if (contadorAplausos == 1) {
      tiempoPrimerAplauso = tiempoActual;
    }
  }

  // Evaluar ventana de tiempo tras el primer aplauso
  if (contadorAplausos > 0) {
    if (tiempoActual - tiempoPrimerAplauso > VENTANA_DOBLE_APLAUSO) {
      if (contadorAplausos == 1) {
        // 1 Aplauso: Enciende Motor 2 y LED
        motor2Activo = true;
      } else if (contadorAplausos >= 2) {
        // 2 Aplausos: Apaga Motor 2 y LED
        motor2Activo = false;
      }
      controlarMotor2(motor2Activo);
      contadorAplausos = 0; // Reiniciar contador
    }
  }

  // 3 & 4. SUBSISTEMAS DE SEGURIDAD POR VIBRACIÓN Y CUENTA REGRESIVA
  if (alarmaActivada) {
    digitalWrite(PIN_BUZZER, HIGH); // Activar alarma sonora
    mostrarDigito(cuentaRegresiva);

    // Decrementar cada 1000 ms (1 segundo)
    if (tiempoActual - ultimoSegundoCuenta >= 1000) {
      ultimoSegundoCuenta = tiempoActual;
      cuentaRegresiva--;

      if (cuentaRegresiva < 0) {
        // Al llegar a 0 se apaga la alarma y el display
        alarmaActivada = false;
        digitalWrite(PIN_BUZZER, LOW);
        apagarDisplay();
        cuentaRegresiva = -1;
      }
    }
  } else {
    digitalWrite(PIN_BUZZER, LOW);
    apagarDisplay();
  }

  // 5. TELEMETRÍA BLUETOOTH EN TIEMPO REAL
  if (tiempoActual - ultimoEnvioTelemetria >= INTERVALO_TELEMETRIA) {
    ultimoEnvioTelemetria = tiempoActual;
    enviarTelemetriaBluetooth(lecturaLdr);
  }

  // 6. PROCESAMIENTO DE COMANDOS REMOTOS BLUETOOTH
  if (Serial1.available() > 0 || Serial.available() > 0) {
    String comando = "";
    if (Serial1.available() > 0) comando = Serial1.readStringUntil('\\n');
    else comando = Serial.readStringUntil('\\n');
    comando.trim();

    if (comando == "M2_ON") {
      motor2Activo = true;
      controlarMotor2(true);
    } else if (comando == "M2_OFF") {
      motor2Activo = false;
      controlarMotor2(false);
    } else if (comando == "TRIGGER_ALARM") {
      ISR_Vibracion();
    } else if (comando == "RESET_ALARM") {
      alarmaActivada = false;
      cuentaRegresiva = -1;
      digitalWrite(PIN_BUZZER, LOW);
      apagarDisplay();
    }
  }
}
`;
