import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequest } from '../services/api';

const AUTH_STORAGE_KEY = 'masteryam.auth';

export const AuthContext = createContext({
  isAuthLoading: true,
  token: null,
  user: null,
  register: async () => ({ success: false }),
  login: async () => ({ success: false }),
  refreshMe: async () => ({ success: false }),
  updateAvatar: async () => ({ success: false }),
  updateProfile: async () => ({ success: false }),
  getLeaderboard: async () => ({ success: false }),
  logout: async () => {},
});

export function AuthProvider({ children }) {
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const bootstrapAuth = async () => {
      try {
        const raw = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
        if (!raw) return;

        const parsed = JSON.parse(raw);
        if (parsed?.token && parsed?.user) {
          setToken(parsed.token);
          setUser(parsed.user);
        }
      } catch (error) {
        await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      } finally {
        setIsAuthLoading(false);
      }
    };

    bootstrapAuth();
  }, []);

  const persistAuth = useCallback(async (nextToken, nextUser) => {
    setToken(nextToken);
    setUser(nextUser);

    await AsyncStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({ token: nextToken, user: nextUser })
    );
  }, []);

  const register = useCallback(async ({ pseudo, password, avatarKey }) => {
    try {
      const data = await apiRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ pseudo, password, avatarKey }),
      });

      await persistAuth(data.token, data.user);
      return { success: true, user: data.user };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }, [persistAuth]);

  const login = useCallback(async ({ pseudo, password }) => {
    try {
      const data = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ pseudo, password }),
      });

      await persistAuth(data.token, data.user);
      return { success: true, user: data.user };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }, [persistAuth]);

  const refreshMe = useCallback(async () => {
    if (!token) return { success: false, message: 'Non connecté' };

    try {
      const data = await apiRequest('/api/auth/me', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      await persistAuth(token, data.user);
      return { success: true, user: data.user };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }, [token, persistAuth]);

  const updateAvatar = useCallback(async (avatarKey) => {
    if (!token) return { success: false, message: 'Non connecté' };

    try {
      const data = await apiRequest('/api/auth/avatar', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ avatarKey }),
      });

      await persistAuth(token, data.user);
      return { success: true, user: data.user };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }, [token, persistAuth]);

  const updateProfile = useCallback(async ({ pseudo, currentPassword, newPassword }) => {
    if (!token) return { success: false, message: 'Non connecté' };

    try {
      const data = await apiRequest('/api/auth/profile', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ pseudo, currentPassword, newPassword }),
      });

      const nextToken = data.token || token;
      await persistAuth(nextToken, data.user);
      return { success: true, user: data.user };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }, [token, persistAuth]);

  const getLeaderboard = useCallback(async () => {
    if (!token) return { success: false, message: 'Non connecté' };

    try {
      const data = await apiRequest('/api/auth/leaderboard', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return { success: true, ...data };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }, [token]);

  const logout = useCallback(async () => {
    setToken(null);
    setUser(null);
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
  }, []);

  const value = useMemo(() => ({
    isAuthLoading,
    token,
    user,
    register,
    login,
    refreshMe,
    updateAvatar,
    updateProfile,
    getLeaderboard,
    logout,
  }), [isAuthLoading, token, user, register, login, refreshMe, updateAvatar, updateProfile, getLeaderboard, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
