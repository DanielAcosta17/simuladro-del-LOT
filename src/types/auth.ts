export interface TeamMember {
  id: string;
  username: string;
  fullName: string;
  role: string;
  email: string;
  avatarColor: string;
  joinedAt: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  currentUser: TeamMember | null;
}
