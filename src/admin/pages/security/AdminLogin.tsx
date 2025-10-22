import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import logo from '../../../assets/images/dabablanelogo.webp';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get redirect path from location state or default based on role
  const getDefaultPath = (role?: string) => {
    return role === 'admin' ? '/admin' : '/admin/blanes';
  };
  
  const from = location.state?.from?.pathname || getDefaultPath(user?.role);
  
  const [formError, setFormError] = useState<string | null>(null);
  const [redirected, setRedirected] = useState(false);

  // Check if user is already authenticated - only redirect once
  useEffect(() => {
    if (isAuthenticated && !redirected) {
      setRedirected(true);
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, user, navigate, from, redirected]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    if (!email || !password) {
      setFormError('Email and password are required');
      return;
    }
    
    try {
      await login(email, password);
      
      // Login successful, but let the useEffect handle the redirect
      // to prevent race conditions
      setRedirected(true);
    } catch (err) {
      setFormError('Authentication failed. Please check your credentials and try again.');
    }
  };

  // Don't render the login form if already authenticated and redirecting
  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-800 text-center">
          <p>Already authenticated. Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex justify-center mb-6">
            <img src={logo} alt="Dabablane Logo" className="h-16 w-auto" />
          </div>
          
          {(formError || error) && (
            <div className="bg-red-500 text-white p-3 rounded mb-6">
              {formError || error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type="password"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full bg-gradient-to-r from-[#197874] to-red-400 text-white py-2 rounded-md font-medium hover:opacity-90 transition-opacity ${
                isLoading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin; 