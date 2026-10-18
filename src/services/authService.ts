import { AuthUser, AuthSession, FarmerProfile, BuyerProfile, UserRole, SupportedLanguage } from '../types';

const TOKEN_KEY = 'agriconnect_auth_token_v1';
const LEGACY_TOKEN_KEY = 'agrova_auth_token_v1';
const USER_KEY = 'agriconnect_auth_user_v1';
const LEGACY_USER_KEY = 'agrova_auth_user_v1';

type AuthListener = (user: AuthUser | null) => void;

class AuthService {
  private token: string | null = null;
  private currentUser: AuthUser | null = null;
  private currentProfile: FarmerProfile | BuyerProfile | null = null;
  private listeners: Set<AuthListener> = new Set();
  private isInitialized = false;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        this.token =
          localStorage.getItem(TOKEN_KEY) ||
          sessionStorage.getItem(TOKEN_KEY) ||
          localStorage.getItem(LEGACY_TOKEN_KEY);
        const storedUser =
          localStorage.getItem(USER_KEY) || localStorage.getItem(LEGACY_USER_KEY);
        if (storedUser) {
          this.currentUser = JSON.parse(storedUser);
        }
      } catch (e) {
        console.warn('Failed to read auth state from storage', e);
      }
    }
  }

  public subscribe(listener: AuthListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    this.listeners.forEach((listener) => {
      try {
        listener(this.currentUser);
      } catch (err) {
        console.error('Error in auth listener:', err);
      }
    });
  }

  public getToken(): string | null {
    if (!this.token && typeof window !== 'undefined') {
      this.token = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
    }
    return this.token;
  }

  public getUser(): AuthUser | null {
    return this.currentUser;
  }

  public getProfile(): FarmerProfile | BuyerProfile | null {
    return this.currentProfile;
  }

  public isAuthenticated(): boolean {
    return Boolean(this.currentUser && this.token);
  }

  public async restoreSession(): Promise<{ user: AuthUser | null; profile: FarmerProfile | BuyerProfile | null }> {
    const token = this.getToken();
    if (!token) {
      this.currentUser = null;
      this.currentProfile = null;
      this.isInitialized = true;
      return { user: null, profile: null };
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          this.currentUser = data.user;
          this.currentProfile = data.profile;
          if (typeof window !== 'undefined') {
            localStorage.setItem(USER_KEY, JSON.stringify(data.user));
          }
          this.notify();
          this.isInitialized = true;
          return { user: this.currentUser, profile: this.currentProfile };
        }
      }
      // If server returned 401 or invalid token, clear local state
      this.clearSession();
    } catch (e) {
      console.warn('Session restoration failed; offline or server restarting:', e);
      // If network temporarily down, keep cached user if present
    }

    this.isInitialized = true;
    return { user: this.currentUser, profile: this.currentProfile };
  }

  private async parseResponseData(res: Response, fallbackError: string): Promise<{ ok: boolean; data: any; errorMessage?: string }> {
    const contentType = res.headers.get('content-type') || '';
    let parsed: any = null;

    if (contentType.includes('application/json')) {
      try {
        parsed = await res.json();
      } catch (err) {
        console.warn('Failed to parse JSON despite application/json Content-Type:', err);
      }
    } else {
      try {
        const rawText = await res.text();
        console.warn('Non-JSON response received from server:', rawText.slice(0, 150));
      } catch {}
    }

    if (!parsed) {
      return {
        ok: false,
        data: null,
        errorMessage: res.status >= 500
          ? 'Server temporarily unavailable. Please try again shortly.'
          : fallbackError,
      };
    }

    let errorMessage: string | undefined = undefined;
    if (!parsed.success) {
      if (typeof parsed.error === 'string') {
        errorMessage = parsed.error;
      } else if (parsed.error && typeof parsed.error.message === 'string') {
        errorMessage = parsed.error.message;
      } else if (typeof parsed.message === 'string') {
        errorMessage = parsed.message;
      } else {
        errorMessage = fallbackError;
      }
    }

    return {
      ok: res.ok && parsed.success,
      data: parsed,
      errorMessage,
    };
  }

  public async register(payload: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    farmDistrict?: string;
    farmArea?: number | string;
    businessName?: string;
    businessType?: string;
    phone?: string;
    language?: SupportedLanguage;
  }): Promise<{ success: boolean; user?: AuthUser; profile?: FarmerProfile | BuyerProfile; error?: string }> {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await this.parseResponseData(res, 'Registration failed. Please check the submitted information.');
      if (result.ok && result.data?.success) {
        this.setSession(result.data.token, result.data.user, result.data.profile);
        return { success: true, user: result.data.user, profile: result.data.profile };
      }
      return { success: false, error: result.errorMessage || 'Registration failed' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error during registration.' };
    }
  }

  public async login(
    email: string,
    password: string
  ): Promise<{ success: boolean; user?: AuthUser; profile?: FarmerProfile | BuyerProfile; error?: string }> {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const result = await this.parseResponseData(res, 'Invalid credentials');
      if (result.ok && result.data?.success) {
        this.setSession(result.data.token, result.data.user, result.data.profile);
        return { success: true, user: result.data.user, profile: result.data.profile };
      }
      return { success: false, error: result.errorMessage || 'Invalid credentials' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error during sign in.' };
    }
  }

  public async logout(): Promise<void> {
    const token = this.getToken();
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (e) {
        console.warn('Logout endpoint call failed:', e);
      }
    }
    this.clearSession();
  }

  public async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    const token = this.getToken();
    if (!token) return { success: false, error: 'You must be signed in to change password.' };

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        return { success: true, message: data.message };
      }
      return { success: false, error: data.error || 'Failed to change password.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error.' };
    }
  }

  public async requestPasswordRecovery(
    email: string
  ): Promise<{ success: boolean; recoveryCode?: string; message?: string; error?: string }> {
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        return { success: true, recoveryCode: data.recoveryCode, message: data.message };
      }
      return { success: false, error: data.error || 'Recovery request failed.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error.' };
    }
  }

  public async resetPassword(
    email: string,
    recoveryCode: string,
    newPassword: string
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, recoveryCode, newPassword }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        return { success: true, message: data.message };
      }
      return { success: false, error: data.error || 'Password reset failed.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error.' };
    }
  }

  public async updateProfile(payload: {
    name?: string;
    preferredLanguage?: SupportedLanguage;
    farmProfile?: Partial<FarmerProfile>;
    buyerProfile?: Partial<BuyerProfile>;
    role?: UserRole;
  }): Promise<{ success: boolean; user?: AuthUser; profile?: FarmerProfile | BuyerProfile; error?: string }> {
    const token = this.getToken();
    if (!token) return { success: false, error: 'Authentication required.' };

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        this.currentUser = data.user;
        this.currentProfile = data.profile;
        if (typeof window !== 'undefined') {
          localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        }
        this.notify();
        return { success: true, user: data.user, profile: data.profile };
      }
      return { success: false, error: data.error || 'Failed to update profile.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error.' };
    }
  }

  public async deleteAccount(
    password: string
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    const token = this.getToken();
    if (!token) return { success: false, error: 'Authentication required.' };

    try {
      const res = await fetch('/api/auth/account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        this.clearSession();
        return { success: true, message: data.message };
      }
      return { success: false, error: data.error || 'Failed to delete account.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error.' };
    }
  }

  private setSession(token: string, user: AuthUser, profile: FarmerProfile | BuyerProfile): void {
    this.token = token;
    this.currentUser = user;
    this.currentProfile = profile;
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
    this.notify();
  }

  private clearSession(): void {
    this.token = null;
    this.currentUser = null;
    this.currentProfile = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(LEGACY_TOKEN_KEY);
      sessionStorage.removeItem(LEGACY_TOKEN_KEY);
      localStorage.removeItem(LEGACY_USER_KEY);
    }
    this.notify();
  }
}

export const authService = new AuthService();
