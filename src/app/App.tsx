import {
  // React,
  useEffect,
} from 'react';
import { useNavigate, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from '../stores/globalStore';

import MainLayout from './layouts/MainLayout';
// import TabsLayout from './layouts/TabLayout';

// Импорт страниц (замените на свои пути)
import { BookDetailsComponent } from '../pages/bookDetails';
import Search from '../pages/search';
import { Profile } from '../pages/profile';
import { Auth } from '../pages/auth';
import Reviews from '../pages/reviews';
import Library from '@/pages/library';
import MyBooks from '../pages/myBooks';
import { usersApi } from '../api/user';
import { ProtectedRoute } from './ProtectedRoute';
import { SelectionListView } from '../pages/library/ui/SectionList';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  CountryManager,
  FormatManager,
  LanguageManager,
  PublisherManager,
} from '@/pages/adminPanel';

const queryClient = new QueryClient();

export default function App() {
  const { setUser, isInitialized, setInitialized, setCurrentBook } = useStore();
  const navigate = useNavigate(); // Добавляем хук навигации
  useEffect(() => {
    const initApp = async () => {
      // Если в localStorage нашли старого юзера, можно обновить его данные с сервера
      // if (user?.userId) {
      try {
        const freshUser = await usersApi.getProfile();
        setUser(freshUser);
      } catch (e) {
        setUser(null);
        console.error('Session expired or server error', e);
        // Если токен протух, можно разлогинить: setUser(null);
      } finally {
        // }
        setInitialized(true);
      }
    };

    initApp();
  }, []);

  if (!isInitialized) {
    return <div>Загрузка...</div>; // Или твой ActivityIndicator
  }
  const handleAuthSuccess = () => {
    navigate('/library'); // Или на ту страницу, которая нужна
  };
  const handleBookSelection = (bookId: number) => {
    navigate(`/book/${bookId}`);
  };
  const handleBookListSelection = (selectionId: number, title: string) => {
    navigate(`/selection/${selectionId}`, { state: { title } });
  };
  const handleNavigateToReviews = (bookId: number) => {
    navigate(`/book/${bookId}/reviews`);
  };
  return (
    <QueryClientProvider client={queryClient}>
      <Routes>
        <Route element={<MainLayout />}>
          <Route
            path="auth"
            element={<Auth onNavigate={handleAuthSuccess} />}
          />
          <Route
            path="search"
            element={
              <Search
                setCurrentBook={setCurrentBook}
                onNavigateToBook={handleBookSelection}
              />
            }
          />
          <Route
            path="selection/:id"
            element={
              <SelectionListView
                onNavigateToBook={handleBookSelection}
                onGoBack={() => navigate(-1)}
                setCurrentBook={setCurrentBook}
              />
            }
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
                onNavigateToReviews={handleNavigateToReviews}
              />
            }
          />

          <Route
            path="book/:id/reviews"
            element={<Reviews onNavigate={() => navigate(-1)} />}
          />
          <Route element={<ProtectedRoute />}>
            {/* <Route path="/" element={<TabsLayout />}> */}
            <Route index element={<Navigate to="/library" replace />} />
            <Route
              path="profile"
              element={<Profile onNavigate={() => navigate(-1)} />}
            />
            <Route
              path="mybooks"
              element={<MyBooks onNavigateToBook={handleBookSelection} />}
            />
            <Route path="lang" element={<LanguageManager />} />
            <Route path="country" element={<CountryManager />} />
            <Route path="format" element={<FormatManager />} />
            <Route path="publisher" element={<PublisherManager />} />
          </Route>
          {/* </Route> */}

          {/* 404 */}
          <Route path="*" element={<Navigate to="/" />} />
        </Route>
      </Routes>
    </QueryClientProvider>
  );
}
