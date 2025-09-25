import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { HomeProvider } from './user/lib/contexts/HomeContext';
import RoleBasedRouter from "./lib/roleBasedRouter";
import GlobalErrorBoundary from './user/components/ui/GlobalErrorBoundary';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

const AppContent = () => {
  return (
    <div className="min-h-screen">
      <RoleBasedRouter />
    </div>
  );
};

const App = () => {
  return (
    <GlobalErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <HomeProvider>
              <AppContent />
              <Toaster 
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#FFFFFF',
                    color: '#333333',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)'
                  },
                  success: {
                    style: {
                      border: '1px solid #22c55e',
                      borderLeft: '4px solid #22c55e'
                    }
                  },
                  error: {
                    style: {
                      border: '1px solid #ef4444',
                      borderLeft: '4px solid #ef4444'
                    },
                    duration: 5000
                  }
                }}
              />
            </HomeProvider>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </GlobalErrorBoundary>
  );
};

export default App;
