import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
// Inter, for body text. Each script's letters are a separate file, and the
// browser only downloads the ones a page uses.
import '@fontsource-variable/inter';
import './index.css';

const root = document.getElementById('root');

if (!root) throw new Error('Missing #root element');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
