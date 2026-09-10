import React from 'react'

import { ThemeProvider } from 'next-themes';
import ReactDOM from 'react-dom/client'

import { Toaster } from './components/ui/toaster';
import Routes from './routes/routes';

import '@/styles/global.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="light" enableSystem attribute="class">
      <>
        <Toaster />
        <Routes />
      </>
    </ThemeProvider>
  </React.StrictMode>
);
