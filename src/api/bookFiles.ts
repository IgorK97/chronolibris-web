import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, axiosInstance } from './apiClient';
import type {
  BookFileDto,
  // UpdateBookFileRequest,
  UploadBookFileRequest,
} from '../types';

export const bookFilesApi = {
  getBookFiles: (bookId: number, adminMode: boolean): Promise<BookFileDto[]> =>
    apiClient.get<BookFileDto[]>(`/BookFiles/book/${bookId}?mode=${adminMode}`),

  uploadBookFile: async (data: UploadBookFileRequest): Promise<number> => {
    const formData = new FormData();
    formData.append('bookId', data.bookId.toString());
    formData.append('formatId', data.formatId.toString());
    formData.append('isReadable', data.isReadable.toString());
    formData.append('file', data.file);
    if (data.historicalText != null)
      formData.append('historical', data.historicalText.toString());

    const response = await axiosInstance.post<number>('/BookFiles', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deleteBookFile: (id: number): Promise<void> =>
    apiClient.delete(`/BookFiles/${id}`),

  download: (bookFileId: number) =>
    apiClient.download(`/bookFiles/${bookFileId}/download`),
};

export const useDownloadBookFile = () => {
  return useMutation({
    mutationFn: (bookFileId: number) => bookFilesApi.download(bookFileId),
  });
};

export const useBookFiles = (bookId: number | null, mode: boolean) => {
  return useQuery({
    queryKey: ['bookFiles', bookId],
    queryFn: () => {
      return bookFilesApi.getBookFiles(bookId!, mode);
    },
    enabled: !!bookId,
    staleTime: 2 * 60 * 1000,
  });
};

export const useUploadBookFile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: bookFilesApi.uploadBookFile,

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['bookFiles', variables.bookId],
      });
    },
  });
};

export const useDeleteBookFile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: bookFilesApi.deleteBookFile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookFiles'] });
    },
  });
};
