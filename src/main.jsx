import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { SevenSistersProvider } from './context/SevenSistersContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <SevenSistersProvider>
      <App />
    </SevenSistersProvider>
  </React.StrictMode>
);
