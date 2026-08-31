import React from 'react'
import ReactDOM from 'react-dom/client'
import Routes from './routes/routes';
import { ThemeProvider } from 'next-themes';

import '@/styles/global.css';
import { Toaster } from './components/ui/toaster';

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
