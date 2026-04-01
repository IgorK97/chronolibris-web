import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import './index.css';
import '@/lib/i18n/i18n.js'; // Инициализация i18n
import App from './app/App.tsx';
// import { registerSW } from 'virtual:pwa-register';
// registerSW({ immediate: true });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
