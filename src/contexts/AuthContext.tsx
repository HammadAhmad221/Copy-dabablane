import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../admin/lib/api/services/autho';

interface User {
  id: string;
  name?: string;
  email: string;
  role: 'admin' | string;
  token: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
  authReady: boolean;
}

// Flexible response interface to handle various API formats
interface FlexibleAuthResponse {
  data?: {
    token?: string;
    user_token?: string;
    user?: {
      id?: number | string;
      name?: string;
      email?: string;
      roles?: string[];
    };
    roles?: string[];
  };
  token?: string;
  access_token?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);

  // Check if token is valid (not expired, properly formatted)
  const isTokenValid = useCallback((token: string): boolean => {
    if (!token) return false;
    
    // Check if it's a JWT token
    if (token.split('.').length === 3) {
      try {
        // Get the payload part of the JWT token
        const payload = token.split('.')[1];
        // Convert base64 to JSON
        const decodedPayload = JSON.parse(atob(payload));
        
        // Check if token is expired
        if (decodedPayload.exp && decodedPayload.exp * 1000 < Date.now()) {
          console.warn('Token is expired');
          return false;
        }
        
        return true;
      } catch (err) {
        console.error('Error parsing JWT token:', err);
        return false;
      }
    }
    
    // For non-JWT tokens, we just check if it exists
    return token.length > 0;
  }, []);

  // Check for existing auth token on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        // Check for existing auth token or session
        const token = localStorage.getItem('authToken');
        const userData = localStorage.getItem('userData');
        
        if (token && userData) {
          try {
            // Verify token validity
            if (!isTokenValid(token)) {
              console.warn('Stored token is invalid, clearing auth data');
              localStorage.removeItem('authToken');
              localStorage.removeItem('userData');
              setIsAuthenticated(false);
              setUser(null);
            } else {
              const parsedUser = JSON.parse(userData);
              setIsAuthenticated(true);
              setUser(parsedUser);
            }
          } catch (err) {
            // Invalid user data stored, clear it
            console.error('Error parsing stored user data:', err);
            localStorage.removeItem('authToken');
            localStorage.removeItem('userData');
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        // Mark auth check as complete and loading as done
        setIsLoading(false);
        setAuthReady(true);
      }
    };
    
    checkAuth();
  }, [isTokenValid]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Use the backend authentication service
      const response = await authService.login({ email, password });
      
      // Log the entire response to debug its structure
      
      // Use the flexible interface to safely access potential properties
      const flexResponse = response as unknown as FlexibleAuthResponse;
      
      // Extract token from different possible locations
      const tokenValue = 
        flexResponse.data?.token || 
        flexResponse.data?.user_token || 
        flexResponse.token || 
        flexResponse.access_token || 
        '';
      
      if (!tokenValue) {
        throw new Error('No token found in response');
      }
      
      // Extract roles from different possible locations
      const roles = 
        flexResponse.data?.roles || 
        flexResponse.data?.user?.roles || 
        [];
      
      // Extract user data from the response
      const userData: User = {
        id: (flexResponse.data?.user?.id || '0').toString(),
        name: flexResponse.data?.user?.name || '',
        email: flexResponse.data?.user?.email || email,
        role: (Array.isArray(roles) && roles.includes('admin')) ? 'admin' : (Array.isArray(roles) ? roles[0] : '') || 'user',
        token: tokenValue
      };
      
      // Store auth data in localStorage
      localStorage.setItem('authToken', userData.token);
      localStorage.setItem('userData', JSON.stringify(userData));
      
      // Update state after localStorage is set
      setIsAuthenticated(true);
      setUser(userData);
    } catch (err) {
      console.error('Login error:', err);
      setError('Failed to login. Please check your credentials.');
      throw err; // Re-throw to handle in the component
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      // Call backend logout service
      await authService.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsAuthenticated(false);
      setUser(null);
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      user, 
      login,
      logout,
      isLoading,
      error,
      authReady
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 