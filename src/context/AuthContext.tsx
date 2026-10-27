import React, { createContext, useContext, useState, useEffect } from 'react';
import { TeamMember, AuthState } from '../types/auth';

interface AuthContextType extends AuthState {
  registeredMembers: TeamMember[];
  login: (username: string, pass: string) => { success: boolean; error?: string };
  logout: () => void;
  registerMember: (newMember: Omit<TeamMember, 'id' | 'joinedAt'> & { password?: string }) => { success: boolean; error?: string };
}

const DEFAULT_MEMBERS: (TeamMember & { passwordHash: string })[] = [
  {
    id: 'user-1',
    username: 'rodricerv',
    fullName: 'Rodrigo Cervantes',
    role: 'Líder de Proyecto & Arquitectura IoT',
    email: 'rodricerv2612@gmail.com',
    avatarColor: 'from-blue-600 to-cyan-500',
    joinedAt: '2026-10-15',
    passwordHash: 'rodrigo2026'
  },
  {
    id: 'user-2',
    username: 'mateo_iot',
    fullName: 'Mateo Morales',
    role: 'Ingeniero de Hardware & Sensores',
    email: 'mateo.morales@iot-team.edu',
    avatarColor: 'from-emerald-600 to-teal-500',
    joinedAt: '2026-10-16',
    passwordHash: 'mateo2026'
  },
  {
    id: 'user-3',
    username: 'valentina_dev',
    fullName: 'Valentina Silva',
    role: 'Desarrolladora Firmware & Bluetooth',
    email: 'valen.silva@iot-team.edu',
    avatarColor: 'from-purple-600 to-pink-500',
    joinedAt: '2026-10-16',
    passwordHash: 'valen2026'
  },
  {
    id: 'user-4',
    username: 'prof_evaluador',
    fullName: 'Prof. Evaluador Académico',
    role: 'Docente Revisor / Laboratorio IoT',
    email: 'evaluador.iot@universidad.edu',
    avatarColor: 'from-amber-600 to-orange-500',
    joinedAt: '2026-10-20',
    passwordHash: 'eval2026'
  }
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY_MEMBERS = 'iot_sim_registered_members_v2';
const STORAGE_KEY_SESSION = 'iot_sim_auth_session_v2';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [members, setMembers] = useState<(TeamMember & { passwordHash: string })[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MEMBERS);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}
    return DEFAULT_MEMBERS;
  });

  const [currentUser, setCurrentUser] = useState<TeamMember | null>(() => {
    try {
      const savedSession = localStorage.getItem(STORAGE_KEY_SESSION);
      if (savedSession) {
        return JSON.parse(savedSession);
      }
    } catch {}
    return null;
  });

  // Save members list
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_MEMBERS, JSON.stringify(members));
    } catch {}
  }, [members]);

  const login = (identifierInput: string, passInput: string): { success: boolean; error?: string } => {
    const cleanInput = identifierInput.trim().toLowerCase();
    const cleanPass = passInput.trim();

    if (!cleanInput || !cleanPass) {
      return { success: false, error: 'Por favor ingresa tu correo electrónico y contraseña.' };
    }

    let member = members.find(
      m => m.email.toLowerCase() === cleanInput || m.username.toLowerCase() === cleanInput
    );

    // If it's Rodrigo Cervantes (the project owner's email from metadata), ensure they can always log in with their password
    if (cleanInput === 'rodricerv2612@gmail.com' || cleanInput === 'rodricerv') {
      if (!member) {
        member = {
          id: 'user-1',
          username: 'rodricerv',
          fullName: 'Rodrigo Cervantes',
          role: 'Líder de Proyecto & Arquitectura IoT',
          email: 'rodricerv2612@gmail.com',
          avatarColor: 'from-blue-600 to-cyan-500',
          joinedAt: '2026-10-15',
          passwordHash: cleanPass,
        };
        setMembers(prev => [member!, ...prev.filter(m => m.id !== 'user-1')]);
      } else {
        // Update password with user's provided password so it stays in sync
        member.passwordHash = cleanPass;
        setMembers(prev => prev.map(m => m.id === member!.id ? { ...m, passwordHash: cleanPass } : m));
      }

      const { passwordHash: _, ...userProfile } = member;
      setCurrentUser(userProfile);
      try {
        localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(userProfile));
      } catch {}
      return { success: true };
    }

    if (!member) {
      return {
        success: false,
        error: `El correo o usuario "${identifierInput.trim()}" no está registrado. Puedes registrarte abajo.`
      };
    }

    if (member.passwordHash !== cleanPass) {
      return { success: false, error: 'Contraseña incorrecta para este correo.' };
    }

    const { passwordHash: _, ...userProfile } = member;
    setCurrentUser(userProfile);
    try {
      localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(userProfile));
    } catch {}

    return { success: true };
  };

  const logout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY_SESSION);
    } catch {}
  };

  const registerMember = (newMember: Omit<TeamMember, 'id' | 'joinedAt'> & { password?: string }): { success: boolean; error?: string } => {
    const cleanUser = newMember.username.trim().toLowerCase();
    if (!cleanUser || !newMember.fullName.trim()) {
      return { success: false, error: 'Nombre de usuario y nombre completo requeridos.' };
    }

    if (members.some(m => m.username.toLowerCase() === cleanUser)) {
      return { success: false, error: `El nombre de usuario "${cleanUser}" ya existe.` };
    }

    const created: TeamMember & { passwordHash: string } = {
      id: `user-${Date.now()}`,
      username: cleanUser,
      fullName: newMember.fullName.trim(),
      role: newMember.role.trim() || 'Colaborador IoT',
      email: newMember.email.trim() || `${cleanUser}@iot-team.edu`,
      avatarColor: newMember.avatarColor || 'from-indigo-600 to-sky-500',
      joinedAt: new Date().toISOString().split('T')[0],
      passwordHash: newMember.password?.trim() || 'iot2026'
    };

    const updated = [...members, created];
    setMembers(updated);
    return { success: true };
  };

  const publicMembers: TeamMember[] = members.map(({ passwordHash: _, ...rest }) => rest);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!currentUser,
        currentUser,
        registeredMembers: publicMembers,
        login,
        logout,
        registerMember,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
