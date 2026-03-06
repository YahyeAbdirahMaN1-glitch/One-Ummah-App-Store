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
    console.log('LOGIN: Starting...', email);
    
    const response = await fetch(`${API_URL}/signIn`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    console.log('LOGIN: Response status:', response.status);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Login failed' }));
      throw new Error(error.error || 'Invalid email or password');
    }

    const data = await response.json();
    console.log('LOGIN: Success, userId:', data.userId);
    
    if (data.userId) {
      localStorage.setItem('userId', data.userId);
      setUser(data.user);
    }
    
    return data;
  };

  const signup = async (email: string, password: string, name: string, gender: string) => {
    console.log('SIGNUP: Starting...', email, name);
    
    const response = await fetch(`${API_URL}/signUp`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, name, gender }),
    });

    console.log('SIGNUP: Response status:', response.status);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Signup failed' }));
      throw new Error(error.error || 'Could not create account');
    }

    const data = await response.json();
    console.log('SIGNUP: Success, userId:', data.userId);
    
    if (data.userId) {
      localStorage.setItem('userId', data.userId);
    }
    
    // Fetch full user data
    const userResponse = await fetch(`${API_URL}/getUser`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId: data.userId }),
    });
    
    if (userResponse.ok) {
      const userData = await userResponse.json();
      setUser(userData.user);
    }
    
    return data;
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
