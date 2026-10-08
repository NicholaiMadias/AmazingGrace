import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import MatrixApp from './MatrixApp';

const rootElement = document.getElementById('matrix-root');

if (rootElement) {
    createRoot(rootElement).render(
        <StrictMode>
            <MatrixApp />
        </StrictMode>
    );
} else {
    const msg = document.createElement('div');
    msg.style.cssText = 'padding:20px;color:#ff0055;font-family:monospace';
    msg.textContent = 'FATAL_ERROR: Matrix root container not found.';
    document.body.appendChild(msg);
}

window.addEventListener('error', (event) => {
    console.error('Global Matrix Node Error:', event.error);
});
