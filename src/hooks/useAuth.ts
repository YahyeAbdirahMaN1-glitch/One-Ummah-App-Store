import { useState, useEffect } from 'react';
import { API_URL } from '../config';
import { CapacitorHttp } from '@capacitor/core';

export interface User {
  id: string;
  name: string | null;
  email: string;
  handle: string | null;
  image: string | null;
  profilePicture: string | null;
  bio: string | null;
  city: string | null;
  country: string | null;
  gender: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const userId = localStorage.getItem('userId');
      
      if (!userId) {
        setUser(null);
        setIsLoading(false);
        return;
      }
      
      const response = await CapacitorHttp.post({
        url: `${API_URL}/getUser`,
        headers: { 
          'Content-Type': 'application/json',
        },
        data: { userId },
      });
      
      if (response.status === 200) {
        setUser(response.data.user);
      } else {
        setUser(null);
        localStorage.removeItem('userId');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      console.log('LOGIN: Starting...', email);
      console.log('LOGIN: API_URL:', API_URL);
      
      // Use CapacitorHttp for better iOS compatibility
      const response = await CapacitorHttp.post({
        url: `${API_URL}/signIn`,
        headers: { 
          'Content-Type': 'application/json',
        },
        data: { email, password },
      });

      console.log('LOGIN: Response status:', response.status);

      if (response.status !== 200) {
        const error = response.data?.error || 'Invalid email or password';
        throw new Error(error);
      }

      const data = response.data;
      console.log('LOGIN: Success, userId:', data.userId);
      
      if (data.userId) {
        localStorage.setItem('userId', data.userId);
        setUser(data.user);
        
        // Set user as online
        await CapacitorHttp.post({
          url: `${API_URL}/updateOnlineStatus`,
          headers: { 'Content-Type': 'application/json' },
          data: { userId: data.userId, isOnline: true },
        });
      }
      
      return data;
    } catch (error: any) {
      console.error('LOGIN: Error:', error);
      throw new Error(error.message || 'Unable to connect to server');
    }
  };

  const signup = async (email: string, password: string, name: string, gender: string) => {
    try {
      console.log('SIGNUP: Starting...', email, name);
      console.log('SIGNUP: API_URL:', API_URL);
      
      // Use CapacitorHttp for better iOS compatibility
      const response = await CapacitorHttp.post({
        url: `${API_URL}/signUp`,
        headers: { 
          'Content-Type': 'application/json',
        },
        data: { email, password, name, gender },
      });

      console.log('SIGNUP: Response status:', response.status);

      if (response.status !== 200) {
        const error = response.data?.error || 'Could not create account';
        throw new Error(error);
      }

      const data = response.data;
      console.log('SIGNUP: Success, userId:', data.userId);
      
      if (data.userId) {
        localStorage.setItem('userId', data.userId);
      }
      
      // Fetch full user data
      const userResponse = await CapacitorHttp.post({
        url: `${API_URL}/getUser`,
        headers: { 
          'Content-Type': 'application/json',
        },
        data: { userId: data.userId },
      });
      
      if (userResponse.status === 200) {
        setUser(userResponse.data.user);
        
        // Set user as online
        await CapacitorHttp.post({
          url: `${API_URL}/updateOnlineStatus`,
          headers: { 'Content-Type': 'application/json' },
          data: { userId: data.userId, isOnline: true },
        });
      }
      
      return data;
    } catch (error: any) {
      console.error('SIGNUP: Error:', error);
      throw new Error(error.message || 'Unable to connect to server');
    }
  };

  const logout = async () => {
    localStorage.removeItem('userId');
    setUser(null);
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    signup,
    logout,
    refreshUser: checkAuth,
  };
}
