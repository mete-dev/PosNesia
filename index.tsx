import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { AppProvider } from './hooks/useAppContext';
import { I18nProvider } from './hooks/useTranslation';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AppProvider>
      <I18nProvider>
        <App />
      </I18nProvider>
    </AppProvider>
  </React.StrictMode>
);