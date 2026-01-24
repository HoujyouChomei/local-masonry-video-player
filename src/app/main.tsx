// src/app/main.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import { Providers } from './providers';
import { App } from './app';
import './globals.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Providers>
      <App />
    </Providers>
  </React.StrictMode>
);
