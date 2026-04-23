/* eslint-disable @typescript-eslint/no-explicit-any */
import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

export const queryClient = new QueryClient({
  // Обработка ошибок для всех useQuery
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
  // Обработка ошибок для всех useMutation (создание, удаление, изменение)
  mutationCache: new MutationCache({
    onError: (error: any) => {
      if (!error.response) {
        toast.error('Сервер недоступен или проблемы с сетью');
        return;
      }
      if (error.response?.status >= 400) {
        toast.error(
          //как лучше хранить и передавать ошибку с сервера?
          `Ошибка ${error.response.status}: ${error.response.data?.detail || error.response.data?.message || 'Ошибка сервера'}`
        );
      }
    },
  }),
});
