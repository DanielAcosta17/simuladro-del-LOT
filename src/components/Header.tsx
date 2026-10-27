import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Volume2, VolumeX } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isAudioMuted: boolean;
  toggleAudioMute: () => void;
  openFirmwareModal: () => void;
  openPinoutModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  isAudioMuted,
  toggleAudioMute,
}) => {
  const { currentUser, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-6 py-3.5">
        {/* Zone 1: Brand wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-lg font-bold tracking-tight text-white whitespace-nowrap">
            Simulador IoT R4
          </span>
          <span className="text-xs font-mono text-blue-400 bg-blue-950/60 border border-blue-800/40 px-2 py-0.5 rounded">
            v2.0
          </span>
        </div>

        {/* Zone 2: 4-5 single-line navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          <button
            onClick={() => setActiveTab('workbench')}
            className={`whitespace-nowrap transition-colors hover:text-white ${
              activeTab === 'workbench' ? 'text-blue-400 font-semibold' : ''
            }`}
          >
            Banco Interactivo
          </button>
          <button
            onClick={() => setActiveTab('subsystems')}
            className={`whitespace-nowrap transition-colors hover:text-white ${
              activeTab === 'subsystems' ? 'text-blue-400 font-semibold' : ''
            }`}
          >
            Subsistemas 1-6
          </button>
          <button
            onClick={() => setActiveTab('scenarios')}
            className={`whitespace-nowrap transition-colors hover:text-white ${
              activeTab === 'scenarios' ? 'text-blue-400 font-semibold' : ''
            }`}
          >
            Escenarios de Prueba
          </button>
          <button
            onClick={() => setActiveTab('bluetooth')}
            className={`whitespace-nowrap transition-colors hover:text-white ${
              activeTab === 'bluetooth' ? 'text-blue-400 font-semibold' : ''
            }`}
          >
            Bluetooth & Telemetría
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`whitespace-nowrap transition-colors hover:text-white ${
              activeTab === 'code' ? 'text-blue-400 font-semibold' : ''
            }`}
          >
            Código Arduino C++
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action Area */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={toggleAudioMute}
            title={isAudioMuted ? 'Activar sonido del Buzzer' : 'Silenciar sonido del Buzzer'}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 border border-slate-700 rounded-lg transition-colors"
          >
            {isAudioMuted ? <VolumeX className="w-4 h-4 text-amber-400" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {currentUser && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="hidden lg:flex flex-col text-right">
                <span className="text-xs font-semibold text-slate-200 leading-tight">
                  {currentUser.fullName}
                </span>
                <span className="text-[11px] text-slate-400">
                  {currentUser.role}
                </span>
              </div>
              <button
                onClick={logout}
                title="Cerrar sesión"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors whitespace-nowrap"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Salir</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
