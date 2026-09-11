import {StrictMode, Suspense} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={<div role="status" className="flex min-h-screen items-center justify-center text-stone-600">Carregando...</div>}><App /></Suspense>
  </StrictMode>,
);
