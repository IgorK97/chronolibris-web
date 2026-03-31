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
import { Profile } from '../pages/profile';
import { Auth } from '../pages/auth';
import Reviews from '../pages/reviews';
import Library from '@/pages/library';
import MyBooks from '../pages/myBooks';
import { usersApi } from '../api/user';
import {
  // ModeratorRoute,
  ProtectedRoute,
} from './ProtectedRoute';
import { SelectionListView } from '../pages/library/ui/SectionList';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  ContentManagement,
  CountryManager,
  FormatManager,
  LanguageManager,
  PersonManager,
  PublisherManager,
  SeriesManager,
  ThemeManager,
} from '@/pages/adminPanel';
import { ContentUnit } from '@/pages/adminPanel/ui/ContentUnit';
// import { Reader } from '@/components/Reader';
import { BookManagement } from '@/pages/adminPanel/ui/BookManagement';
import { BookUnit } from '@/pages/adminPanel/ui/BookUnit';
import { SelectionsPage } from '@/pages/adminPanel/Selection/SelectionsPage';
import { TagsPage } from '@/pages/adminPanel/Tags/TagsPage';
import { ReaderPage } from '@/pages/reader/ReaderPage';
import ReaderLayout from './layouts/ReaderLayout';
import { ModerationPage } from '@/pages/moderation/ModerationPage';
import SearchPage from '@/pages/search/ui/SearchPage';
import { RegisterStaffPage } from '@/pages/RegisterStaffPage/RegisterStuffPage';

const queryClient = new QueryClient();

export default function App() {
  const { setUser, isInitialized, setInitialized, setCurrentBook } = useStore();
  const navigate = useNavigate(); // Добавляем хук навигации
  const handleReadClick = async (bookFileId?: number) => {
    // Переход с параметрами для Reader
    navigate(`/reader/${bookFileId}`);
  };
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
          <Route
            path="auth"
            element={<Auth onNavigate={handleAuthSuccess} />}
          />
          <Route
            path="search"
            element={
              <SearchPage
                // setCurrentBook={setCurrentBook}
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
                onReadClick={handleReadClick}
                onNavigateToReviews={handleNavigateToReviews}
              />
            }
          />

          <Route
            path="book/:id/reviews"
            element={<Reviews onNavigate={() => navigate(-1)} />}
          />
          {/* <Route element={<ModeratorRoute />}>
            <Route path="moderation" element={<ModerationPage />} />
          </Route> */}
          <Route element={<ProtectedRoute />}>
            {/* <Route path="/" element={<TabsLayout />}> */}
            {/* <Route index element={<Navigate to="/library" replace />} /> */}
            <Route path="moderation" element={<ModerationPage />} />
            <Route
              path="profile"
              element={<Profile onNavigate={() => navigate(-1)} />}
            />
            <Route
              path="mybooks"
              element={<MyBooks onNavigateToBook={handleBookSelection} />}
            />
            <Route path="lang" element={<LanguageManager />} />
            <Route path="selections" element={<SelectionsPage />} />
            <Route path="country" element={<CountryManager />} />
            <Route path="format" element={<FormatManager />} />
            <Route path="publisher" element={<PublisherManager />} />
            <Route path="series" element={<SeriesManager />} />
            <Route path="person" element={<PersonManager />} />
            <Route path="themes" element={<ThemeManager />} />
            <Route path="contents" element={<ContentManagement />} />
            <Route path="contents/:contentId" element={<ContentUnit />} />
            <Route path="tags" element={<TagsPage />} />
            <Route path="register-staff" element={<RegisterStaffPage />} />

            {/*Add barrel export later */}
            <Route path="books" element={<BookManagement />} />
            <Route path="books/:bookId" element={<BookUnit />} />
          </Route>
          <Route path="*" element={<Navigate to="/library" />} />
        </Route>
        <Route element={<ReaderLayout />}>
          <Route element={<ProtectedRoute />}>
            <Route path="reader/:bookFileId" element={<ReaderPage />} />
          </Route>
        </Route>
      </Routes>
    </QueryClientProvider>
  );
}
