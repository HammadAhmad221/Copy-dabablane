import { useState, useEffect } from 'react';
import { HomeResponse } from '../types/home';
import { HomeService } from '../api/services/homeService';

export const useHomeData = () => {
  const [data, setData] = useState<HomeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await HomeService.getHomeData();
        setData(response);
        setIsError(null);
      } catch (error) {
        setIsError(error as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return {
    data,
    isLoading,
    isError,
  };
}; 