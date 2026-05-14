/* eslint-disable @typescript-eslint/no-explicit-any */
import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error: any) => {
      if (!error.response) {
        toast.error('Сервер недоступен или проблемы с сетью');
        return;
      }
      if (error.response?.status >= 400) {
        toast.error(
          `Ошибка ${error.response.status}: ${error.response.data?.detail || error.response.data?.message || 'Попробуйте позже'}`
        );
      }
    },
  }),
  mutationCache: new MutationCache({
    onError: (error: any) => {
      if (!error.response) {
        toast.error('Сервер недоступен или проблемы с сетью');
        return;
      }
      if (error.response?.status >= 400) {
        toast.error(
          `Ошибка ${error.response.status}: ${error.response.data?.detail || error.response.data?.message || 'Ошибка сервера'}`
        );
      }
    },
  }),
});
