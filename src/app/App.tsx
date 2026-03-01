import {
  // React,
  useEffect,
} from 'react';
import { useNavigate, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from '../stores/globalStore';

import MainLayout from './layouts/MainLayout';
import TabsLayout from './layouts/TabLayout';

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
            <Route path="/" element={<TabsLayout />}>
              <Route index element={<Navigate to="/library" replace />} />
              <Route
                path="profile"
                element={<Profile onNavigate={() => navigate(-1)} />}
              />
              <Route
                path="mybooks"
                element={<MyBooks onNavigateToBook={handleBookSelection} />}
              />
              {/* ... все остальные страницы ... */}
            </Route>
          </Route>

          {/* 404 */}
          <Route path="*" element={<Navigate to="/" />} />
        </Route>
      </Routes>
    </QueryClientProvider>
  );
}

// <Routes>
//   {/* Основной макет с провайдерами */}
//   <Route element={<MainLayout />}>
//     {/* Вложенная навигация (Табы) */}
//     <Route path="/" element={<TabsLayout />}>
//       <Route index element={<Navigate to="/library" replace />} />
//       <Route path="library" element={<Library />} />
//       <Route path="search" element={<Search />} />
//       <Route path="mybooks" element={<MyBooks />} />
//       <Route path="profile" element={<Profile />} />
//       <Route path="book/:id" element={<BookDetailsComponent />} />
//       <Route path="book/:id/reviews" element={<Reviews />} />
//     </Route>

//     {/* Отдельные экраны без таббара */}
//     <Route path="auth" element={<Auth />} />
//     {/* <Route path="reader/:id" element={<ReaderPage />} /> */}
//     <Route path=":id" element={<div>Detail Page for {/* id */}</div>} />

//     {/* 404 */}
//     {/* <Route path="*" element={<NotFoundPage />} /> */}
//   </Route>
// </Routes>

// // import React, {useState} from "react"
// import { Route, Routes, Navigate } from "react-router-dom"
// import { PizzaProvider } from "./contexts/PizzaContext"
// import PizzaList from "./components/PageComponents/PizzaList"
// import PizzaForm from "./components/PageComponents/PizzaForm"
// import PizzaDetails from "./components/PageComponents/PizzaDetails"
// import Layout from "./components/Layout/Layout"
// import { AuthProvider } from "./contexts/AuthContext"
// import {useAuth} from "./contexts/AuthContext"
// import LoginPage from "./components/PageComponents/LoginPage"
// import RegistrPage from "./components/PageComponents/RegistrPage"
// import { ThemeProvider, useColorScheme} from "@mui/material"
// import mainTheme from "./themes/MainTheme"
// import Assortment from "./components/PageComponents/Assortment"
// import CartPanel from "./components/Layout/CartPanel"
// import IngredientForm from "./components/PageComponents/IngredientForm"
// import IngredientManagerList from "./components/PageComponents/IngredientManagerList"
// import IngredientDetails from "./components/PageComponents/IngredientDetails"
// import OrderHistory from "./components/PageComponents/OrderHistory"
// import OrderDetails from "./components/PageComponents/OrderDetails"
// import ManagerOrders from "./components/PageComponents/ManagerOrders"
// import CourierOrders from "./components/PageComponents/CourierOrders"
// import ErrorBoundary from "./errorHandling/ErrorBoundary"

// /**
//  * Компонент маршрута, защищенного правами доступа пользователя
//  * Показывает дочерний компонент children, если у пользователя достаточно прав
//  * Иначе отображает сообщение об ошибке и перенаправляет на главную страницу
//  * @param {React.ReactElement} children - Дочерний компонент, который должен быть защищён
//  * @param {boolean} [adminOnly=false] - Если true, доступ разрешён только администраторам
//  * @param {boolean} [managerOnly=false] - Если true, доступ разрешён только менеджерам
//  * @param {boolean} [courierOnly=false] - Если true, доступ разрешён только курьерам
//  *
//  * @returns {React.ReactElement} - Дочерний компонент или компонент перенаправления.
//  */
// const ProtectedRoute:React.FC<{children:React.ReactElement;adminOnly?:boolean; managerOnly?:boolean; courierOnly?:boolean}>=({
//   children,
//   adminOnly=false,
//   managerOnly=false,
//   courierOnly=false
// })=>{
//   const { user, isAdmin, isManager, isCourier } = useAuth() //Хук из контекста авторизации, чтобы получить данные о текущем пользователе и его правах

//   if (!user) {
//     alert("Недостаточно прав. Выполните вход!") //Если пользователь не авторизован, показываем уведомление.
//     return <Navigate to="/" replace />//Перенаправляем на главную страницу.
//   } else if (adminOnly && !isAdmin) {
//     alert("Недостаточно прав пользователя!")
//     //Если маршрут только для администраторов, а пользователь не администратор, показываем уведомление.
//     return <Navigate to="/" replace />
//     //Перенаправляем на главную страницу.
// }
// else if(managerOnly && !isManager){
//   alert("Недостаточно прав пользователя!");
//   return <Navigate to="/" replace/>
// }
// else if(courierOnly && !isCourier){
//   alert("Нет доступа");
//   return <Navigate to="/" replace/>
// }
// return children
// }

// /**
//  * Главный компонент приложения
//  * Оборачивает приложение в провайдеры тем, контекста авторизации и данных о пиццах, ингредиентах и заказах
//  * Определяет маршруты приложения
//  */
// const App: React.FC = () => {
//   return (

//     <ThemeProvider theme={mainTheme}>
//       <ErrorBoundary fallback={<h2>Что-то пошло не так... Пожалуйста, попробуйте позже</h2>}>
//       <AuthProvider>
//         <PizzaProvider>
//           <Layout>
//             <Routes>
//               <Route path="/" element={<Assortment />} />

//               <Route path="/history" element={<OrderHistory />} />

//               <Route path="/login" element={<LoginPage />} />

//               <Route path="/registration" element={<RegistrPage />}/>

//               <Route path="/pizzas" element={
//                   <ProtectedRoute adminOnly>
//                     <PizzaList />
//                   </ProtectedRoute>
//                 } />
//                 <Route path="/managerorders" element={
//                   <ProtectedRoute managerOnly>
//                     <ManagerOrders/>
//                   </ProtectedRoute>
//                 }/>
//                 <Route path="/deliveries" element={
//                   <ProtectedRoute courierOnly>
//                     <CourierOrders/>
//                   </ProtectedRoute>
//                 }/>
//                 <Route path="/ingredients" element={
//                   <ProtectedRoute managerOnly>
//                     <IngredientManagerList />
//                   </ProtectedRoute>
//                 } />
//               <Route
//                 path="/pizzas/add"
//                 element={
//                   <ProtectedRoute managerOnly>
//                     <PizzaForm />
//                   </ProtectedRoute>
//                 } />
//                 <Route
//                 path="/ingredients/add"
//                 element={
//                   <ProtectedRoute managerOnly>
//                     <IngredientForm />
//                   </ProtectedRoute>
//                 } />

//               <Route path="/pizzas/:id" element={
//                 <ProtectedRoute managerOnly>
//                   <PizzaDetails />
//                   </ProtectedRoute>} />
//                   <Route path="/ingredients/:id" element={
//                 <ProtectedRoute managerOnly>
//                   <IngredientDetails />
//                   </ProtectedRoute>} />
//             </Routes>
//           </Layout>
//         </PizzaProvider>

//       </AuthProvider>
//       </ErrorBoundary>
//      </ThemeProvider>

//   )
// }

// export default App

//import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
// import './App.css'

// function App() {
//   const [count, setCount] = useState(0)

//   return (
//     <>
//       <div>
//         <a href="https://vite.dev" target="_blank">
//           <img src={viteLogo} className="logo" alt="Vite logo" />
//         </a>
//         <a href="https://react.dev" target="_blank">
//           <img src={reactLogo} className="logo react" alt="React logo" />
//         </a>
//       </div>
//       <h1>Vite + React</h1>
//       <div className="card">
//         <button onClick={() => setCount((count) => count + 1)}>
//           count is {count}
//         </button>
//         <p>
//           Edit <code>src/App.tsx</code> and save to test HMR
//         </p>
//       </div>
//       <p className="read-the-docs">
//         Click on the Vite and React logos to learn more
//       </p>
//     </>
//   )
// }

// export default App
