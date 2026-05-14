/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect } from 'react';
import {
  useNavigate,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';
import { USER_ROLES, useStore } from '../stores/globalStore';
import MainLayout from './layouts/MainLayout';
import { BookDetailsComponent } from '../pages/BookDetails';
import { Profile } from '../pages/Profile';
import { Auth } from '../pages/Auth';
//default vs non default exports?
import { Library } from '@/pages/Library';
import { MyBooks } from '../pages/MyBooks';
import { usersApi } from '../api/user';
import { ProtectedRoute } from './routes/ProtectedRoute';
import {
  // MutationCache,
  // QueryCache,
  // QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import {
  ContentManagement,
  CountryManager,
  // FormatManager,
  LanguageManager,
  PersonManager,
  PublisherManager,
  SelectionCreatePage,
  SelectionEditPage,
  ThemeManager,
} from '@/pages/AdminPanel';
import { ContentUnit } from '@/pages/AdminPanel/Contents/SingleContent/ContentUnit';
import { BookUnit } from '@/pages/AdminPanel/Books/SingleBook/BookUnit';
import { SelectionsPage } from '@/pages/AdminPanel/Selection/SelectionsPage';
import { TagsPage } from '@/pages/AdminPanel/Tags/TagsPage';
import { ReaderPage } from '@/pages/Reader/ReaderPage';
import ReaderLayout from './layouts/ReaderLayout';
import { ModerationPage } from '@/pages/Moderation/ModerationPage';
import SearchPage from '@/pages/Search/ui/SearchPage';
import { RegisterStaffPage } from '@/pages/AdminPanel/RegisterStaffPage/RegisterStuffPage';
import { PublicOnlyRoute } from './routes/PublicOnlyRoute';
import { queryClient } from '@/api/queryClient';
import { Toaster } from 'react-hot-toast';

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
        console.error('Ошибка входа. Попробуйте войти в аккаунт позднее', e);
      } finally {
        setInitialized(true);
      }
    };

    initApp();
  }, []);

  const location = useLocation();

  useEffect(() => {
    const titles: Record<string, string> = {
      '/library': 'Библиотека | Chronolibris',
      '/auth': 'Вход | Chronolibris',
      '/profile': 'Мой профиль | Chronolibris',
      '/mybooks': 'Мои книги | Chronolibris',
      '/moderation': 'Панель модерации | Chronolibris',
      '/search': 'Поиск книг | Chronolibris',
      '/lang': 'Управление языками | Chronolibris',
      '/country': 'Управление странами | Chronolibris',
      '/publisher': 'Управление издателями | Chronolibris',
      '/person': 'Управление персоналиями | Chronolibris',
      '/selections': 'Управление подборками | Chronolibris',
      '/themes': 'Управление темами | Chronolibris',
      '/tags': 'Управление тегами | Chronolibris',
      '/contents': 'Управление содержимым | Chronolibris',
      '/register-staff': 'Регистрация сотрудников | Chronolibris',
    };

    const matchedKey = Object.keys(titles).find((path) =>
      location.pathname.startsWith(path)
    );

    if (matchedKey) {
      document.title = titles[matchedKey];
      return;
    }
  }, [location]);

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
      <Toaster
        containerStyle={{
          zIndex: 99999,
        }}
        toastOptions={{
          style: {
            cursor: 'pointer',
          },
          error: {
            duration: 5000,
          },
        }}
        position="top-right"
      />
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
            <Route path="publisher" element={<PublisherManager />} />
            <Route path="person" element={<PersonManager />} />

            <Route path="selections" element={<SelectionsPage />} />
            <Route path="selections/new" element={<SelectionCreatePage />} />
            <Route path="selections/:id" element={<SelectionEditPage />} />
            <Route path="themes" element={<ThemeManager />} />
            <Route path="tags" element={<TagsPage />} />

            <Route path="contents" element={<ContentManagement />} />
            <Route path="/contents/new" element={<ContentUnit />} />
            <Route path="/contents/:contentId" element={<ContentUnit />} />
            <Route path="/contents/:contentId/edit" element={<ContentUnit />} />
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
