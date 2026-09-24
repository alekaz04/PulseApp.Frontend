import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

const root = document.getElementById('root');
if (!root) {
  throw new Error('В index.html нет элемента #root');
}

createRoot(root).render(
  <StrictMode>
    <main>Pulse</main>
  </StrictMode>,
);
