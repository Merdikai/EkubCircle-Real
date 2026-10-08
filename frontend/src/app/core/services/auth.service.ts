import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, of } from 'rxjs';
import { User, UserRole, AuthSession, LoginRequest } from '../models';

const STORAGE_KEY = 'ekub_auth_session';

export const DEMO_USERS: User[] = [
  {
    id: 1,
    fullName: 'Abebe Bikila (Organizer)',
    email: 'organizer@ekub.local',
    role: 'Organizer',
    phoneNumber: '+251911111111',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    walletBalance: 12500,
    createdAt: '2026-01-01T08:00:00Z'
  },
  {
    id: 2,
    fullName: 'Hana Girma',
    email: 'member1@ekub.local',
    role: 'Member',
    phoneNumber: '+251911222222',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    walletBalance: 4500,
    createdAt: '2026-01-01T09:30:00Z'
  },
  {
    id: 3,
    fullName: 'Dawit Tadesse',
    email: 'member2@ekub.local',
    role: 'Member',
    phoneNumber: '+251911333333',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    walletBalance: 5000,
    createdAt: '2026-01-01T11:00:00Z'
  },
  {
    id: 4,
    fullName: 'Meron Bekele',
    email: 'member3@ekub.local',
    role: 'Member',
    phoneNumber: '+251911444444',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    walletBalance: 6000,
    createdAt: '2026-01-01T12:00:00Z'
  },
  {
    id: 5,
    fullName: 'Selam Fikre',
    email: 'member4@ekub.local',
    role: 'Member',
    phoneNumber: '+251911555555',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    walletBalance: 3500,
    createdAt: '2026-01-01T13:00:00Z'
  },
  {
    id: 99,
    fullName: 'Hackathon Admin',
    email: 'admin@hackathon.local',
    role: 'Admin',
    phoneNumber: '+251911000000',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    walletBalance: 99999,
    createdAt: '2026-01-01T00:00:00Z'
  }
];

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private readonly sessionSignal = signal<AuthSession | null>(this.loadStoredSession());

  // Public Signals
  readonly session = this.sessionSignal.asReadonly();
  readonly currentUser = computed(() => this.sessionSignal()?.user ?? null);
  readonly isAuthenticated = computed(() => !!this.sessionSignal());
  readonly isOrganizer = computed(() => {
    const role = this.currentUser()?.role?.toLowerCase();
    return role === 'organizer' || role === 'admin';
  });
  readonly isAdmin = computed(() => {
    const role = this.currentUser()?.role?.toLowerCase();
    return role === 'admin';
  });
  readonly isMember = computed(() => {
    const role = this.currentUser()?.role?.toLowerCase();
    return role === 'member';
  });

  isOrganizerOf(circle?: { createdByUserId?: number } | null): boolean {
    if (!circle) return false;
    const user = this.currentUser();
    if (!user) return false;
    if (user.role?.toLowerCase() === 'admin') return true;
    if (circle.createdByUserId) {
      return circle.createdByUserId === user.id;
    }
    return this.isOrganizer();
  }

  normalizeRole(role?: string): UserRole {
    if (!role) return 'Member';
    const r = role.trim().toLowerCase();
    if (r === 'admin' || r === 'administrator') return 'Admin';
    if (r === 'organizer' || r === 'organizers') return 'Organizer';
    return 'Member';
  }

  constructor() {
    const current = this.sessionSignal();
    if (current?.user) {
      current.user.role = this.normalizeRole(current.user.role);
      this.sessionSignal.set({ ...current });
    }
  }

  loginApi(credentials: LoginRequest): Observable<AuthSession> {
    return this.http.post<AuthSession>('/api/auth/login', credentials).pipe(
      tap(session => {
        if (session?.user) {
          session.user.role = this.normalizeRole(session.user.role);
        }
        this.sessionSignal.set(session);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
        } catch {}
      })
    );
  }

  registerApi(data: { fullName: string; email: string; password: string; role: string; phoneNumber?: string }): Observable<AuthSession> {
    return this.http.post<AuthSession>('/api/auth/register', data).pipe(
      tap(session => {
        if (session?.user) {
          session.user.role = this.normalizeRole(session.user.role);
        }
        this.sessionSignal.set(session);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
        } catch {}
      })
    );
  }

  loginWithDemoUser(user: User): Observable<AuthSession> {
    const password = user.role?.toLowerCase() === 'admin' ? 'Admin123!' : 'Ekub123!';
    return this.loginApi({ email: user.email, password }).pipe(
      catchError(() => {
        // Fallback offline mock session only if backend is not reachable
        const normalizedUser: User = {
          ...user,
          role: this.normalizeRole(user.role)
        };
        const fallbackSession: AuthSession = {
          user: normalizedUser,
          token: `demo-token-${user.id}`,
          expiresAt: new Date(Date.now() + 86400000).toISOString()
        };
        this.sessionSignal.set(fallbackSession);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(fallbackSession));
        } catch {}
        return of(fallbackSession);
      })
    );
  }

  login(credentials: LoginRequest): boolean {
    const foundUser = DEMO_USERS.find(
      u => u.email.toLowerCase() === credentials.email.toLowerCase()
    ) || DEMO_USERS[0];
    this.loginWithDemoUser(foundUser).subscribe();
    return true;
  }

  updateWalletBalance(delta: number): void {
    const current = this.sessionSignal();
    if (!current) return;

    const newBalance = Math.max(0, (current.user.walletBalance ?? 0) + delta);
    const updatedUser: User = { ...current.user, walletBalance: newBalance };
    const updatedSession: AuthSession = { ...current, user: updatedUser };

    this.sessionSignal.set(updatedSession);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSession));
    } catch {}
  }

  logout(): void {
    this.sessionSignal.set(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    this.router.navigate(['/login']);
  }

  private loadStoredSession(): AuthSession | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) as AuthSession;
      }
    } catch {
      return null;
    }
    return null;
  }
}
