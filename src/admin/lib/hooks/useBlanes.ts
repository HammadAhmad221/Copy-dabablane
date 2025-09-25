import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { getBlanes, getBlaneAlaUne, PopularBlanes, NewBlanes, BlaneParams } from '../services/front/blaneService';
import { Blane } from '../types/blane';

export const useBlanes = (params?: BlaneParams) => {
  return useQuery<Blane[], Error>({
    queryKey: ['blanes', params],
    queryFn: () => getBlanes(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
  });
};

export const usePopularBlanes = () => {
  return useQuery<Blane[], Error>({
    queryKey: ['popularBlanes'],
    queryFn: PopularBlanes,
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 60 * 60 * 1000, // 1 hour
  });
};

export const useNewBlanes = () => {
  return useQuery<Blane[], Error>({
    queryKey: ['newBlanes'],
    queryFn: NewBlanes,
    staleTime: 5 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
  });
};

export const useBlaneAlaUne = (params?: BlaneParams) => {
  return useQuery<Blane[], Error>({
    queryKey: ['blaneAlaUne', params],
    queryFn: () => getBlaneAlaUne(params),
    staleTime: 5 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
  });
}; 