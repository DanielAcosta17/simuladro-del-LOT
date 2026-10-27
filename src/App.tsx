import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useIoTSimulator } from './hooks/useIoTSimulator';
import { Header } from './components/Header';
import { LoginModal } from './components/LoginModal';
import { InteractiveWorkbench } from './components/InteractiveWorkbench';
import { SubsystemsDetailView } from './components/SubsystemsDetailView';
import { ScenarioRunner } from './components/ScenarioRunner';
import { BluetoothPanel } from './components/BluetoothPanel';
import { FirmwareViewer } from './components/FirmwareViewer';

function AppContent() {
  const { isAuthenticated, currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('workbench');

  const {
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
  } = useIoTSimulator();

  // Mandatory Authentication barrier
  if (!isAuthenticated) {
    return <LoginModal />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-500/30 selection:text-blue-200">
      {/* Top Bar Header adhering strictly to Constitution contract */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isAudioMuted={isAudioMuted}
        toggleAudioMute={toggleAudioMute}
        openFirmwareModal={() => setActiveTab('code')}
        openPinoutModal={() => setActiveTab('subsystems')}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        {activeTab === 'workbench' && (
          <InteractiveWorkbench
            ldr={ldr}
            sound={sound}
            security={security}
            power={power}
            setLdrLightLevel={setLdrLightLevel}
            triggerClap={triggerClap}
            triggerVibration={triggerVibration}
            resetAlarm={resetAlarm}
            toggleExternalSupply={toggleExternalSupply}
            toggleUsbPower={toggleUsbPower}
            toggleCommonGnd={toggleCommonGnd}
          />
        )}

        {activeTab === 'subsystems' && <SubsystemsDetailView />}

        {activeTab === 'scenarios' && (
          <ScenarioRunner
            ldr={ldr}
            sound={sound}
            security={security}
            power={power}
            setLdrLightLevel={setLdrLightLevel}
            triggerClap={triggerClap}
            triggerVibration={triggerVibration}
            resetAlarm={resetAlarm}
          />
        )}

        {activeTab === 'bluetooth' && (
          <BluetoothPanel
            isBluetoothConnected={isBluetoothConnected}
            bluetoothDeviceName={bluetoothDeviceName}
            bluetoothBaudRate={bluetoothBaudRate}
            telemetryHistory={telemetryHistory}
            serialLogs={serialLogs}
            connectBluetoothReal={connectBluetoothReal}
            disconnectBluetooth={disconnectBluetooth}
            sendBluetoothCommand={sendBluetoothCommand}
          />
        )}

        {activeTab === 'code' && <FirmwareViewer />}
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 px-6 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span>Sistema IoT Inteligente — Arduino UNO R4 WiFi & Driver L298N</span>
            <span aria-hidden="true">·</span>
            <span>Versión 2.0</span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span>Sesión activa: {currentUser?.fullName}</span>
            <span aria-hidden="true">·</span>
            <span>Mecatrónica & IoT Lab</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
