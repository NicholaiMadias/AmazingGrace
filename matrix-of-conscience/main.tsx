import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import MatrixOfConscience from '../src/components/MatrixOfConscience';

const rootElement = document.getElementById('matrix-root');

if (rootElement) {
  try {
    createRoot(rootElement).render(
      <StrictMode>
        <MatrixOfConscience />
      </StrictMode>
    );
  } catch (err) {
    console.error('Failed to render Matrix of Conscience:', err);
    rootElement.innerHTML = `<div style="padding: 20px; color: #00f0ff; font-family: monospace; background: #05050c; height: 100vh;">
      <h2>SYSTEM_ERROR: Matrix initialization failure.</h2>
      <p>The neural link could not be established.</p>
      <pre style="color: #ff0055; margin-top: 20px;">${err instanceof Error ? err.message : String(err)}</pre>
    </div>`;
  }
} else {
  document.body.innerHTML = `<div style="padding: 20px; color: #ff0055; font-family: monospace;">
    <h2>FATAL_ERROR: Matrix root container not found.</h2>
  </div>`;
}

window.addEventListener('error', (event) => {
  console.error('Global Matrix Node Error:', event.error);
});
