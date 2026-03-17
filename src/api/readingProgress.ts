import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './apiClient';

export interface ReadingProgressDto {
  id: number;
  percentage: number;
  paraIndex: number;
  readingDate: string;
  userId: number;
  bookFileId: number;
}

export interface UpsertReadingProgressRequest {
  bookFileId: number;
  percentage: number;
  paraIndex: number;
}

export const readingProgressApi = {
  get: (bookFileId: number): Promise<ReadingProgressDto | null> =>
    apiClient.get(`/ReadingProgress/${bookFileId}`),

  upsert: (data: UpsertReadingProgressRequest): Promise<ReadingProgressDto> =>
    apiClient.post('/ReadingProgress', data),
};

export const useReadingProgress = (bookFileId: number | null) =>
  useQuery({
    queryKey: ['readingProgress', bookFileId],
    queryFn: () => readingProgressApi.get(bookFileId!),
    enabled: bookFileId !== null,
    staleTime: 5 * 60 * 1000,
  });

export const useUpsertReadingProgress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: readingProgressApi.upsert,
    onSuccess: (data) => {
      queryClient.setQueryData(['readingProgress', data.bookFileId], data);
    },
  });
};
