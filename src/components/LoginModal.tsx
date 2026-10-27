import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, Key, ShieldCheck, ArrowRight, AlertCircle, Cpu, Eye, EyeOff, User } from 'lucide-react';

export const LoginModal: React.FC = () => {
  const { login, registerMember } = useAuth();
  const [emailOrUser, setEmailOrUser] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  // New member form fields
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('Ingeniero IoT');
  const [newPassword, setNewPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (isRegistering) {
      const generatedUsername = newEmail.split('@')[0] || `user_${Date.now()}`;
      const regRes = registerMember({
        fullName: newFullName,
        username: generatedUsername,
        role: newRole,
        email: newEmail.trim().toLowerCase(),
        avatarColor: 'from-blue-600 to-indigo-600',
        password: newPassword,
      });

      if (!regRes.success) {
        setErrorMsg(regRes.error || 'Error al registrar.');
        return;
      }

      // Auto login after registration
      const logRes = login(newEmail, newPassword);
      if (!logRes.success) {
        setErrorMsg(logRes.error || 'Error al iniciar sesión.');
      }
    } else {
      const res = login(emailOrUser, password);
      if (!res.success) {
        setErrorMsg(res.error || 'Credenciales inválidas.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header Banner */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border-b border-slate-800">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-400">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs uppercase tracking-widest text-blue-400 font-semibold">
                Control de Acceso de Equipo
              </span>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Simulador IoT Arduino UNO R4 WiFi
              </h1>
            </div>
          </div>
          <p className="text-sm text-slate-400">
            Módulo de autenticación obligatoria. Ingrese con sus credenciales asignadas para acceder al banco de pruebas y telemetría v2.0.
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 bg-red-950/50 border border-red-500/40 rounded-xl text-red-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegistering ? (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Nombre Completo
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={newFullName}
                      onChange={(e) => setNewFullName(e.target.value)}
                      placeholder="Rodrigo Cervantes"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="rodricerv2612@gmail.com"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Rol en el Proyecto
                  </label>
                  <input
                    type="text"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    placeholder="Líder de Proyecto & Automatización"
                    className="w-full px-3 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Contraseña
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Ingresa tu contraseña"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={emailOrUser}
                      onChange={(e) => setEmailOrUser(e.target.value)}
                      placeholder="rodricerv2612@gmail.com"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Ingresa tu contraseña"
                      className="w-full pl-9 pr-10 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl shadow-lg shadow-blue-600/25 transition-all text-sm mt-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isRegistering ? 'Crear Cuenta e Ingresar' : 'Iniciar Sesión'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Toggle Register / Login */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs text-slate-400">
            <span>
              {isRegistering ? '¿Ya tienes cuenta?' : '¿Registrar a otro integrante?'}
            </span>
            <button
              type="button"
              onClick={() => {
                setIsRegistering(!isRegistering);
                setErrorMsg('');
              }}
              className="text-blue-400 hover:text-blue-300 font-medium underline-offset-4 hover:underline"
            >
              {isRegistering ? 'Iniciar Sesión' : 'Registrar Integrante'}
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span>Arduino UNO R4 WiFi & L298N Architecture</span>
          <span className="font-mono">v2.0 • Segura & Encriptada</span>
        </div>
      </div>
    </div>
  );
};
