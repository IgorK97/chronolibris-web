import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './apiClient';
import type {
  CreatePublisherRequest,
  PublisherDto,
  UpdatePublisherRequest,
} from '../types';

export const publishersApi = {
  getPublishers: (): Promise<PublisherDto[]> =>
    apiClient.get<PublisherDto[]>('/Publishers'),

  getPublisherById: (id: number): Promise<PublisherDto> =>
    apiClient.get<PublisherDto>(`/Publishers/${id}`),

  createPublisher: (data: CreatePublisherRequest): Promise<number> =>
    apiClient.post<number, CreatePublisherRequest>('/Publishers', data),

  updatePublisher: (id: number, data: UpdatePublisherRequest): Promise<void> =>
    apiClient.put<void, UpdatePublisherRequest>(`/Publishers/${id}`, data),

  deletePublisher: (id: number): Promise<void> =>
    apiClient.delete(`/Publishers/${id}`),
};

export const usePublishers = () => {
  return useQuery({
    queryKey: ['publishers'],
    queryFn: publishersApi.getPublishers,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchInterval: 10 * 60 * 1000,
  });
};

export const usePublisherById = (id: number | null) => {
  return useQuery({
    queryKey: ['publishers', id],
    queryFn: () => {
      return publishersApi.getPublisherById(id!);
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreatePublisher = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: publishersApi.createPublisher,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publishers'] });
    },
  });
};

export const useUpdatePublisher = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePublisherRequest }) =>
      publishersApi.updatePublisher(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publishers'] });
    },
  });
};

export const useDeletePublisher = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: publishersApi.deletePublisher,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publishers'] });
    },
  });
};
