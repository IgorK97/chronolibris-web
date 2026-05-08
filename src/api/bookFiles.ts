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
  // 1. application/json
  //    {"bookId": 5, "formatId": 2}
  //    только текст, бинарник не положить

  // 2. application/x-www-form-urlencoded
  //    bookId=5&formatId=2
  //    тоже только текст, как строка в URL

  // 3. multipart/form-data
  //    ----boundary
  //    bookId: 5
  //    ----boundary
  //    [бинарные байты файла]
  //    ----boundary--
  //    смешанный: каждая часть своего типа

  //Обычный JSON не может содержать бинарные данные (файл).
  //один HTTP запрос. multipart — это просто формат тела (body) этого запроса
  // multipart/form-data разбивает запрос на части, каждая со своим заголовком:
  //POST /BookFiles HTTP/1.1
  // Content-Type: multipart/form-data; boundary=----abc123
  // --
  // Content-Disposition: form-data; name="bookId"
  //
  // 123
  // --
  // Content-Disposition: form-data; name="file"; filename="book.pdf"
  // Content-Type: application/pdf
  //
  // [бинарные данные файла]
  // --

  //на сервере - [FromForm]

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
      if (bookId === null) throw new Error('ID книги не указан');
      return bookFilesApi.getBookFiles(bookId, mode);
    },
    enabled: bookId !== null,
    staleTime: 2 * 60 * 1000,
  });
};

export const useUploadBookFile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: bookFilesApi.uploadBookFile,
    //discard (в C#) или unused variable convention (в TypeScript/JS)

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
