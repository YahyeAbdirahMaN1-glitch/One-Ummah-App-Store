import { useState, useEffect } from 'react';
import { API_URL } from '../config';

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
      
      const response = await fetch(`${API_URL}/getUser`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ userId }),
        mode: 'cors',
      });
      
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
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
      console.log('=== LOGIN DEBUG ===');
      console.log('API_URL:', API_URL);
      console.log('Login endpoint:', `${API_URL}/signIn`);
      console.log('Email:', email);
      console.log('User agent:', navigator.userAgent);
      console.log('Platform:', navigator.platform);
      
      const response = await fetch(`${API_URL}/signIn`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
        mode: 'cors',
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response body:', errorText);
        
        let errorMessage = 'Login failed';
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Login successful, userId:', data.userId);
      
      // Store user ID in localStorage
      if (data.userId) {
        localStorage.setItem('userId', data.userId);
        setUser(data.user);
      }
      
      return data;
    } catch (error: any) {
      console.error('=== LOGIN ERROR ===');
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('Full error object:', error);
      
      // Provide iOS-specific error messages
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        throw new Error('Cannot connect to server. Please check:\n1. Your internet connection\n2. The app has permission to access network\n3. The server is running');
      }
      
      throw new Error(error.message || 'Network error - please check your internet connection');
    }
  };

  const signup = async (email: string, password: string, name: string, gender: string) => {
    try {
      console.log('=== SIGNUP DEBUG ===');
      console.log('API_URL:', API_URL);
      console.log('Signup endpoint:', `${API_URL}/signUp`);
      console.log('Email:', email);
      console.log('Name:', name);
      console.log('Gender:', gender);
      
      const response = await fetch(`${API_URL}/signUp`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ email, password, name, gender }),
        credentials: 'include',
        mode: 'cors',
      });

      console.log('Signup response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response body:', errorText);
        
        let errorMessage = 'Signup failed';
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Signup successful, userId:', data.userId);
      
      // Store user ID in localStorage
      if (data.userId) {
        localStorage.setItem('userId', data.userId);
      }
      
      // Fetch full user data
      console.log('Fetching user data...');
      const userResponse = await fetch(`${API_URL}/getUser`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ userId: data.userId }),
        mode: 'cors',
      });
      
      if (userResponse.ok) {
        const userData = await userResponse.json();
        console.log('User data fetched successfully');
        setUser(userData.user);
      } else {
        console.error('Failed to fetch user data, status:', userResponse.status);
      }
      
      return data;
    } catch (error: any) {
      console.error('=== SIGNUP ERROR ===');
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('Full error object:', error);
      
      // Provide iOS-specific error messages
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        throw new Error('Cannot connect to server. Please check:\n1. Your internet connection\n2. The app has permission to access network\n3. The server is running');
      }
      
      throw new Error(error.message || 'Signup failed');
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
