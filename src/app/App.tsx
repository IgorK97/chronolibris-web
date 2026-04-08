/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from 'react';
import { useNavigate, Routes, Route, Navigate } from 'react-router-dom';
import { USER_ROLES, useStore } from '../stores/globalStore';
import MainLayout from './layouts/MainLayout';
import { BookDetailsComponent } from '../pages/bookDetails';
import { Profile } from '../pages/profile';
import { Auth } from '../pages/auth';
//default vs non default exports?
import { Library } from '@/pages/library';
import { MyBooks } from '../pages/myBooks';
import { usersApi } from '../api/user';
import { ProtectedRoute } from './routes/ProtectedRoute';
import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import {
  ContentManagement,
  CountryManager,
  FormatManager,
  LanguageManager,
  PersonManager,
  PublisherManager,
  ThemeManager,
} from '@/pages/AdminPanel';
import { ContentUnit } from '@/pages/AdminPanel/Contents/SingleContent/ContentUnit';
import { BookUnit } from '@/pages/AdminPanel/Books/SingleBook/BookUnit';
import { SelectionsPage } from '@/pages/AdminPanel/Selection/SelectionsPage';
import { TagsPage } from '@/pages/AdminPanel/Tags/TagsPage';
import { ReaderPage } from '@/pages/reader/ReaderPage';
import ReaderLayout from './layouts/ReaderLayout';
import { ModerationPage } from '@/pages/moderation/ModerationPage';
import SearchPage from '@/pages/search/ui/SearchPage';
import { RegisterStaffPage } from '@/pages/AdminPanel/RegisterStaffPage/RegisterStuffPage';
import { PublicOnlyRoute } from './routes/PublicOnlyRoute';
import toast from 'react-hot-toast';

const queryClient = new QueryClient({
  // Обработка ошибок для всех useQuery
  queryCache: new QueryCache({
    onError: (error: any) => {
      if (error.response?.status >= 500) {
        toast.error(
          `Ошибка сервера: ${error.response.data?.message || 'Попробуйте позже'}`
        );
      }
    },
  }),
  // Обработка ошибок для всех useMutation (создание, удаление, изменение)
  mutationCache: new MutationCache({
    onError: (error: any) => {
      if (error.response?.status >= 500) {
        toast.error(
          `Не удалось выполнить действие: ${error.response.data?.message || 'Ошибка сервера'}`
        );
      }
    },
  }),
});

export default function App() {
  const { setUser, isInitialized, setInitialized } = useStore();
  const navigate = useNavigate();
  const handleReadClick = async (bookFileId?: number) => {
    navigate(`/reader/${bookFileId}`);
  };
  useEffect(() => {
    const initApp = async () => {
      try {
        const freshUser = await usersApi.getProfile();
        setUser(freshUser);
      } catch (e) {
        setUser(null);
        console.error('Session expired or server error', e);
      } finally {
        setInitialized(true);
      }
    };

    initApp();
  }, []);

  if (!isInitialized) {
    return <div>Загрузка...</div>;
  }
  const handleAuthSuccess = () => {
    navigate('/library');
  };
  const handleBookSelection = (bookId: number) => {
    navigate(`/book/${bookId}`);
  };
  const handleBookListSelection = (selectionId: number) => {
    navigate(`/search/?selectionId=${selectionId}`);
  };
  const handleNavigateToReviews = (bookId: number) => {
    navigate(`/book/${bookId}/reviews`);
  };
  return (
    <QueryClientProvider client={queryClient}>
      <Routes>
        <Route element={<MainLayout />}>
          {/* Только неавторизованные */}
          <Route element={<PublicOnlyRoute redirectTo="/library" />}>
            <Route
              path="auth"
              element={<Auth onNavigate={handleAuthSuccess} />}
            />
          </Route>

          {/* Любые пользователи */}
          <Route
            path="search"
            element={<SearchPage onNavigateToBook={handleBookSelection} />}
          />

          <Route
            path="library"
            element={
              <Library
                onNavigateToBook={handleBookSelection}
                onNavigateToList={handleBookListSelection}
              />
            }
          />

          <Route
            path="book/:id"
            element={
              <BookDetailsComponent
                onNavigateToBack={() => navigate(-1)}
                onNavigateToRead={() => {}}
                onReadClick={handleReadClick}
                onNavigateToReviews={handleNavigateToReviews}
              />
            }
          />

          {/* Только модераторы и администраторы */}
          <Route
            element={
              <ProtectedRoute
                allowedRoles={[USER_ROLES.MODERATOR, USER_ROLES.ADMIN]}
              />
            }
          >
            <Route path="moderation" element={<ModerationPage />} />
          </Route>

          {/* Только авторизованные пользователи (любые) */}
          <Route
            element={
              <ProtectedRoute
                allowedRoles={[
                  USER_ROLES.ADMIN,
                  USER_ROLES.READER,
                  USER_ROLES.MODERATOR,
                ]}
              />
            }
          >
            <Route
              path="profile"
              element={<Profile onNavigate={() => navigate(-1)} />}
            />
          </Route>

          {/* Только читатели */}
          <Route
            element={<ProtectedRoute allowedRoles={[USER_ROLES.READER]} />}
          >
            <Route
              path="mybooks"
              element={<MyBooks onNavigateToBook={handleBookSelection} />}
            />
          </Route>

          {/* Только администраторы */}
          <Route element={<ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]} />}>
            <Route path="lang" element={<LanguageManager />} />
            <Route path="country" element={<CountryManager />} />
            <Route path="format" element={<FormatManager />} />
            <Route path="publisher" element={<PublisherManager />} />
            <Route path="person" element={<PersonManager />} />

            <Route path="selections" element={<SelectionsPage />} />
            <Route path="themes" element={<ThemeManager />} />
            <Route path="tags" element={<TagsPage />} />

            <Route path="contents" element={<ContentManagement />} />
            <Route path="/contents/new" element={<ContentUnit />} />
            <Route path="/contents/:contentId/edit" element={<ContentUnit />} />

            {/* <Route path="books" element={<BookManagement />} /> */}
            <Route path="books/:bookId" element={<BookUnit />} />

            <Route path="register-staff" element={<RegisterStaffPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/library" />} />
        </Route>

        {/* Отдельный макет для читалки */}
        <Route element={<ReaderLayout />}>
          <Route
            element={
              <ProtectedRoute
                allowedRoles={[
                  USER_ROLES.READER,
                  USER_ROLES.ADMIN,
                  USER_ROLES.MODERATOR,
                ]}
              />
            }
          >
            <Route path="reader/:bookFileId" element={<ReaderPage />} />
          </Route>
        </Route>
      </Routes>
    </QueryClientProvider>
  );
}
