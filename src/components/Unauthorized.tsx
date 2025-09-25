import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Unauthorized: React.FC = () => {
  const { user, logout } = useAuth();
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        <h1 className="text-3xl font-bold text-red-600 mb-4">Unauthorized Access</h1>
        <p className="text-gray-700 mb-4">
          You don't have permission to access this page.
        </p>
        {user && (
          <p className="text-gray-600 mb-4">
            Current role: <span className="font-semibold">{user.role}</span>
          </p>
        )}
        <p className="text-gray-600 mb-6">
          Please contact an administrator if you believe this is an error.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => window.history.back()}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
          <button
            onClick={() => logout()}
            className="bg-gray-200 text-gray-700 px-6 py-2 rounded hover:bg-gray-300 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized; 