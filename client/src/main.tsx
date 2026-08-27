import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';
import { configureApiClient } from '@/lib/api/client';
import { App } from '@/app/App';
import { createAppRouter } from '@/app/router';
import '@/styles/globals.css';

configureApiClient();
const router = createAppRouter();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App router={router} />
    </QueryClientProvider>
  </React.StrictMode>,
);
