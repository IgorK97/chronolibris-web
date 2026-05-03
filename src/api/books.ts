import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { apiClient } from './apiClient';
import type {
  BookDetails,
  ContentDto,
  CreateBookRequest,
  TextSegment,
  TocData,
  UpdateBookRequest,
} from '../types';
import { queryClient } from './queryClient';

export const booksApi = {
  createBook: (data: CreateBookRequest): Promise<number> =>
    apiClient.post<number, CreateBookRequest>('/Books', data),

  updateBook: (id: number, data: UpdateBookRequest): Promise<void> =>
    apiClient.put<void, UpdateBookRequest>(`/Books/${id}`, data),

  getMetadata: (bookId: number, administration: boolean) =>
    apiClient.get<BookDetails>(`/Books/${bookId}/info?mode=${administration}`),

  getBookContents: (bookId: number): Promise<ContentDto[]> =>
    apiClient.get<ContentDto[]>(`/Books/${bookId}/contents`),

  fetchToc: (bookFileId: number): Promise<TocData> =>
    apiClient.get<TocData>(`/Books/files/${bookFileId}/toc`),

  fetchChunk: (
    bookFileId: number,
    chunkIndex: string
  ): Promise<TextSegment[]> =>
    apiClient.get<TextSegment[]>(
      `/books/files/${bookFileId}/chunks/${chunkIndex}`
    ),
};

export const prefetchBookChunk = (
  bookFileId: number,
  nextIdx: number,
  fetchedTocData: TocData | undefined
) => {
  queryClient.prefetchQuery({
    //уникальный ключ кэша, учитывается при рендере,
    //если хотя бы одно из значений изменилось, считается новым запросом это и
    // ищется в кэшэ. Если там нет, новый запрос к серверу
    queryKey: ['chunk', bookFileId, nextIdx],
    queryFn: () => {
      const url = fetchedTocData?.Parts[nextIdx]?.url;
      if (!url) {
        // Если URL нет, отклонить промис с ошибкой
        return Promise.reject(new Error('URL не доступен для следующей части'));
      }
      return booksApi.fetchChunk(bookFileId, fetchedTocData.Parts[nextIdx].url);
    },
    staleTime: Infinity, //повторный запрос к серверу,
    //если данные есть в кэшэ, делаться не будет никогда
    gcTime: 60 * 60 * 1000, //когда данные в кэшэ будут удалены,
    //если нет ни одного компонента, который бы их использовал
    //таким образом, при чтении книги в читалке самые старые не используемые фрагменты
    //будут удалены из кэшэ через час после последнего использования
  });
};
//триггеры фетча: монтирование, фокус, интернет соединение, изменение ключа
//повторный запрос при тех же ключах фетч не триггерит, поэтому время устаревания даже не учитывается
//при триггере фетча - смотрит на кэш. Тогда, если данные в нем,
//определяет то, был ли запрос и каково время сборки мусора
//если запрос был и данные кем-то до сих пор используются или
//если данные уже не используются, но время сборки мусора не прошло,
//то выдает эти данные и смотрит на время устаревания. Если время устаревания прошло,
//то новый запрос, иначе пока отдает эти данные и ничего не делает
//если запроса и не было никогда, то в любом случае новый запрос
//еще раз - ререндер не триггерит рефетч, а вот изменение ключа - триггерит

export const useBookToc = (bookFileId: number) => {
  return useQuery({
    queryKey: ['toc', bookFileId],
    queryFn: () => {
      return booksApi.fetchToc(bookFileId);
    },
    staleTime: Infinity,
    gcTime: 60 * 60 * 1000,
    retry: 1,
    networkMode: 'always',
  });
};

export const useBookChunk = (
  bookFileId: number,
  currentPartIndex: number,
  fetchedTocData: TocData | undefined
) => {
  // console.log('useBookChunk', { bookFileId, currentPartIndex, fetchedTocData });
  return useQuery({
    queryKey: ['chunk', bookFileId, currentPartIndex],
    queryFn: () => {
      //URL существует (fetchedTocData гарантирован enabled, но url может отсутствовать)
      const url = fetchedTocData?.Parts[currentPartIndex]?.url;
      if (!url) {
        // Если URL нет, отклонить промис с ошибкой
        return Promise.reject(new Error('URL не доступен для текущей части'));
      }
      // console.log('fetching chunk with url:', url);
      return booksApi.fetchChunk(bookFileId, url);
    },
    enabled: !!fetchedTocData && currentPartIndex < fetchedTocData.Parts.length,
    staleTime: Infinity,
    gcTime: 60 * 60 * 1000,
    retry: 1,
    networkMode: 'always',
  });
};

export const useBookDetails = (
  bookId: number,
  userName: string,
  administration: boolean = false,
  enabled: boolean
) =>
  useQuery({
    queryKey: ['books', bookId, userName],
    queryFn: () => booksApi.getMetadata(bookId, administration),
    enabled: enabled,
  });

export const useCreateBook = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: booksApi.createBook,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['books'] }),
  });
};

export const useUpdateBook = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateBookRequest }) =>
      booksApi.updateBook(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['books'] }),
  });
};

export const useBookContents = (bookId: number | null) =>
  useQuery({
    queryKey: ['books', bookId, 'contents'],
    queryFn: () => {
      if (bookId === null) throw new Error('ID книги не указан');
      return booksApi.getBookContents(bookId);
    },
    enabled: bookId !== null,
    staleTime: 2 * 60 * 1000,
  });
