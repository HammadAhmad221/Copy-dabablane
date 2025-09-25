import { createContext, ReactNode, useState, useRef, useEffect } from 'react';
import { HomeResponse } from '../types/home';
import { HomeService } from '../api/services/homeService';

interface HomeContextType {
  data: HomeResponse | null;
  isLoading: boolean;
  isError: Error | null;
  retryFetch: () => Promise<void>;
}

export const HomeContext = createContext<HomeContextType | undefined>(undefined);

export const HomeProvider = ({ children }: { children: ReactNode }) => {
  const [data, setData] = useState<HomeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState<Error | null>(null);
  const requestMadeRef = useRef(false);

  // Retry configuration for home data fetching
  const fetchConfig = {
    timeout: 15000, // 15 second timeout (increased for better reliability)
    maxRetries: 2, // Try up to 2 times (3 total attempts)
    retryDelay: 1000 // Start with 1 second delay
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await HomeService.getHomeData(fetchConfig);
      setData(response);
      setIsError(null);
    } catch (error) {
      console.error('Error fetching home data:', error);
      setIsError(error as Error);
      // Set fallback empty data structure to prevent null reference errors
      setData({
        success: false,
        data: {
          categories: [],
          cities: [],
          menu_items: [],
          banner: {
            image_link: '',
            title: '',
            description: '',
            link: '',
            btname1: '',
            image_link2: '',
            title2: '',
            description2: '',
            link2: '',
            btname2: ''
          },
          new_blanes: [],
          popular_blanes: [],
          featured_blane: []
        },
        message: 'Failed to load data'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (requestMadeRef.current) return;
    requestMadeRef.current = true;
    fetchData();
  }, []);

  // Function to manually retry fetching
  const retryFetch = async () => {
    requestMadeRef.current = false; // Reset request made flag
    await fetchData();
  };

  return (
    <HomeContext.Provider value={{ data, isLoading, isError, retryFetch }}>
      {children}
    </HomeContext.Provider>
  );
}; 