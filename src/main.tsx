import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Register service worker only in production on web (not in dev or Capacitor)
if (import.meta.env.PROD && 'serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('/sw.js', { scope: '/' });
}

// Auto-fullscreen when running as installed PWA (desktop Chrome ignores manifest "fullscreen")
if (window.matchMedia('(display-mode: standalone)').matches || window.matchMedia('(display-mode: fullscreen)').matches) {
  document.addEventListener('click', function enterFullscreen() {
    document.documentElement.requestFullscreen?.().catch(() => {});
    document.removeEventListener('click', enterFullscreen);
  }, { once: true });
}
