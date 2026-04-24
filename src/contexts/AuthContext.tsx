import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole, AuthState } from '@/types/auth';
import { auth, googleProvider, signInWithPopup } from '@/lib/firebase';

interface StoredUser {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  phone?: string;
  createdAt: string;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string, role: UserRole) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, name: string, role: UserRole, additionalData?: Record<string, any>, onSuccess?: () => void) => Promise<{ success: boolean; error?: string }>;
  googleLogin: (role: UserRole, onSuccess?: () => void) => Promise<boolean>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  setRole: (role: UserRole) => void;
  selectedRole: UserRole | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_ORIGIN = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000';
const API_BASE_URL = API_ORIGIN.endsWith('/api') ? API_ORIGIN : `${API_ORIGIN}/api`;
const AUTH_STORAGE_KEY = 'quickeats_auth';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setAuthState({
          user: parsed.user,
          token: parsed.token,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    } else {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const signup = async (email: string, password: string, name: string, role: UserRole, additionalData?: Record<string, any>, onSuccess?: () => void): Promise<{ success: boolean; error?: string }> => {
    try {
      // Convert 'delivery' to 'delivery_boy' for backend compatibility
      const backendRole = role === 'delivery' ? 'delivery_boy' : role;

      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
          role: backendRole,
          ...(additionalData || {}),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.message || 'Signup failed' };
      }

      // Normalize backend role to frontend role naming
      const normalizedRole = data.user.role === 'delivery_boy' ? 'delivery' : data.user.role;
      const normalizedUser = { ...data.user, role: normalizedRole } as User;

      const authData = { user: normalizedUser, token: data.token };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
      setAuthState({
        user: normalizedUser,
        token: data.token,
        isAuthenticated: true,
        isLoading: false,
      });

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const login = async (email: string, password: string, role: UserRole): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // If account deleted, offer recovery request
        if (data && data.message && data.message.toLowerCase().includes('deleted')) {
          const ask = window.confirm('This account is deleted. Do you want to request recovery from admin?');
          if (ask) {
            try {
              await fetch(`${API_BASE_URL}/users/recover-request`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
              });
              alert('Recovery request sent to admin. You will be notified when approved.');
            } catch (e) {
              console.error('Recovery request failed', e);
              alert('Failed to send recovery request');
            }
          }
        }
        return { success: false, error: data.message || 'Login failed' };
      }

      // Normalize backend role to frontend role naming
      const normalizedRole = data.user.role === 'delivery_boy' ? 'delivery' : data.user.role;

      // Check if the role matches (after normalization)
      if (normalizedRole !== role) {
        return { success: false, error: `This account is registered as ${normalizedRole === 'user' ? 'Customer' : normalizedRole === 'owner' ? 'Restaurant Owner' : 'Delivery Partner'}` };
      }

      const normalizedUser = { ...data.user, role: normalizedRole } as User;
      const authData = { user: normalizedUser, token: data.token };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
      setAuthState({
        user: normalizedUser,
        token: data.token,
        isAuthenticated: true,
        isLoading: false,
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const googleLogin = async (role: UserRole, onSuccess?: () => void): Promise<boolean> => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;

      if (!firebaseUser.email) {
        alert("Google account must have an email address.");
        return false;
      }

      const backendRole = role === 'delivery' ? 'delivery_boy' : role;

      const response = await fetch(`${API_BASE_URL}/auth/google-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: firebaseUser.displayName || 'Google User',
          email: firebaseUser.email,
          googleId: firebaseUser.uid,
          profilePicture: firebaseUser.photoURL,
          role: backendRole,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || 'Google login failed');
        return false;
      }

      // Normalize backend role to frontend role naming
      const normalizedRole = data.user.role === 'delivery_boy' ? 'delivery' : data.user.role;
      const normalizedUser = { ...data.user, role: normalizedRole } as User;

      const authData = { user: normalizedUser, token: data.token };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
      
      setAuthState({
        user: normalizedUser,
        token: data.token,
        isAuthenticated: true,
        isLoading: false,
      });

      if (onSuccess) {
        onSuccess();
      }

      return true;
    } catch (error) {
      console.error('Google login error:', error);
      // Don't alert if user closed the popup
      if ((error as any)?.code !== 'auth/popup-closed-by-user') {
        alert('Failed to login with Google. Please try again.');
      }
      return false;
    }
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.message || 'Failed to send reset email' };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const logout = () => {
    // Clear auth data
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setAuthState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
    setSelectedRole(null);

    // Clear all user-specific data from localStorage
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('quickeats_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));

    // Navigate to landing page
    window.location.href = '/';
  };

  const setRole = (role: UserRole) => {
    setSelectedRole(role);
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        signup,
        googleLogin,
        resetPassword,
        logout,
        setRole,
        selectedRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}