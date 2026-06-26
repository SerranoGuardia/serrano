// js/auth.js
import { CONFIG } from './config.js';

const TOKEN_KEY  = 'cse_drive_token';
const EXPIRY_KEY = 'cse_drive_expiry';

let _tokenClient = null;

// Chame isso no carregamento da página
export function inicializarAuth(onLogin) {
  // Carrega a lib GIS do Google dinamicamente
  const script = document.createElement('script');
  script.src = 'https://accounts.google.com/gsi/client';
  script.onload = () => {
    _tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: CONFIG.CLIENT_ID,
      scope: CONFIG.SCOPES,
      callback: (response) => {
        if (response.error) { console.error(response); return; }
        const expiry = Date.now() + (response.expires_in * 1000);
        localStorage.setItem(TOKEN_KEY, response.access_token);
        localStorage.setItem(EXPIRY_KEY, String(expiry));
        if (onLogin) onLogin();
      },
    });
  };
  document.head.appendChild(script);
}

export function iniciarLogin() {
  if (!_tokenClient) { alert('Auth ainda carregando, tente em 1s'); return; }
  _tokenClient.requestAccessToken({ prompt: 'select_account' });
}

export function getToken() {
  const token  = localStorage.getItem(TOKEN_KEY);
  const expiry = parseInt(localStorage.getItem(EXPIRY_KEY) || '0', 10);
  if (!token || Date.now() >= expiry) return null;
  return token;
}

export function estaAutenticado() { return getToken() !== null; }

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EXPIRY_KEY);
}