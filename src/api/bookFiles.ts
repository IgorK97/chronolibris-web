import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, axiosInstance } from './apiClient';
import type {
  BookFileDto,
  UpdateBookFileRequest,
  UploadBookFileRequest,
} from '../types';

export const bookFilesApi = {
  getBookFiles: (bookId: number): Promise<BookFileDto[]> =>
    apiClient.get<BookFileDto[]>(`/BookFiles/book/${bookId}`),

  getBookFile: (id: number): Promise<BookFileDto> =>
    apiClient.get<BookFileDto>(`/BookFiles/${id}`),

  uploadBookFile: async (data: UploadBookFileRequest): Promise<number> => {
    const formData = new FormData();
    formData.append('bookId', data.bookId.toString());
    formData.append('formatId', data.formatId.toString());
    formData.append('isReadable', data.isReadable.toString());
    formData.append('file', data.file);

    const response = await axiosInstance.post<number>('/BookFiles', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  //Нельзя это упростить?
  updateBookFile: async (data: UpdateBookFileRequest): Promise<number> => {
    const formData = new FormData();
    formData.append('isReadable', data.isReadable.toString());
    formData.append('file', data.file);

    const response = await axiosInstance.put<number>(
      `/BookFiles/book/${data.bookId}/format/${data.formatId}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  deleteBookFile: (id: number): Promise<void> =>
    apiClient.delete(`/BookFiles/${id}`),

  download: (bookFileId: number) =>
    apiClient.download(`/bookFiles/${bookFileId}/download`),

  // downloadBookFile: async (id: number): Promise<Blob> => {
  //   const response = await axiosInstance.get(`/BookFiles/${id}/download`, {
  //     responseType: 'blob',
  //   });
  //   return response.data;
  // },
};

export const useBookFiles = (bookId: number | null) => {
  return useQuery({
    queryKey: ['bookFiles', bookId],
    queryFn: () => {
      if (bookId === null) throw new Error('ID книги не указан');
      return bookFilesApi.getBookFiles(bookId);
    },
    enabled: bookId !== null,
    staleTime: 2 * 60 * 1000,
  });
};

export const useBookFile = (id: number | null) => {
  return useQuery({
    queryKey: ['bookFile', id],
    queryFn: () => {
      if (id === null) throw new Error('ID файла не указан');
      return bookFilesApi.getBookFile(id);
    },
    enabled: id !== null,
    staleTime: 5 * 60 * 1000,
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

export const useUpdateBookFile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: bookFilesApi.updateBookFile,
    //Почему, если поставить _, то ошибка исчезает?
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
    //какие здесь параметры?
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookFiles'] });
    },
  });
};

// export const useDownloadBookFile = () => {
//   return useMutation({
//     mutationFn: bookFilesApi.downloadBookFile,
//   });
// };
