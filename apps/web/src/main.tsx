import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.js';
import tokens from './styles/tokens.js';

const style = document.createElement('style');
style.dataset.productivemeTokens = '';
style.textContent = tokens;
document.head.append(style);

const root = document.getElementById('root');

if (!root) {
  throw new Error('Missing #root element');
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
