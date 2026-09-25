// js/auth.js
// Google Identity Services (GIS) Token Model - Autenticação OAuth 2.0 Client-Side
import { CONFIG } from './config.js';

const TK_KEY  = 'cse_token';
const EXP_KEY = 'cse_expiry';

let _gisClient = null;
let _onLoginCallback = null;

// Inicializa a biblioteca GIS do Google automaticamente ao importar
(function _initGIS() {
  if (typeof window === 'undefined') return;
  const s = document.createElement('script');
  s.src = 'https://accounts.google.com/gsi/client';
  s.async = true;
  s.defer = true;
  s.onload = () => {
    if (window.google?.accounts?.oauth2) {
      _gisClient = window.google.accounts.oauth2.initTokenClient({
        client_id: CONFIG.CLIENT_ID,
        scope:     CONFIG.SCOPES,
        callback:  (resp) => {
          if (resp.error) {
            console.error('Erro de autenticação GIS:', resp.error);
            return;
          }
          const expiry = Date.now() + (parseInt(resp.expires_in) * 1000);
          localStorage.setItem(TK_KEY,  resp.access_token);
          localStorage.setItem(EXP_KEY, String(expiry));
          if (_onLoginCallback) _onLoginCallback();
        },
      });
    }
  };
  document.head.appendChild(s);
})();

export function driveLogin(onSuccess) {
  if (onSuccess) _onLoginCallback = onSuccess;
  if (!_gisClient) {
    console.warn('Cliente GIS ainda não carregado. Tentando novamente...');
    setTimeout(() => driveLogin(onSuccess), 1000);
    return;
  }
  _gisClient.requestAccessToken({ prompt: 'select_account' });
}

export function processarTokenCallback() {
  const hash  = window.location.hash.substring(1);
  const p     = new URLSearchParams(hash);
  const token = p.get('access_token');
  const expIn = parseInt(p.get('expires_in') || '3600', 10);
  if (!token) return false;
  localStorage.setItem(TK_KEY,  token);
  localStorage.setItem(EXP_KEY, String(Date.now() + expIn * 1000));
  window.history.replaceState(null, '', window.location.pathname);
  return true;
}

export function getToken() {
  if (typeof window === 'undefined') return null;
  const t = localStorage.getItem(TK_KEY);
  const e = parseInt(localStorage.getItem(EXP_KEY) || '0', 10);
  return (t && Date.now() < e) ? t : null;
}

export function driveAutenticado() {
  return !!getToken();
}

export function driveLogout() {
  const token = getToken();
  localStorage.removeItem(TK_KEY);
  localStorage.removeItem(EXP_KEY);
  if (token && window.google?.accounts?.oauth2) {
    try {
      window.google.accounts.oauth2.revoke(token, () => {});
    } catch (e) {
      console.warn('Erro ao revogar token:', e);
    }
  }
}

export function minutosRestantes() {
  const e = parseInt(localStorage.getItem(EXP_KEY) || '0', 10);
  return Math.max(0, Math.round((e - Date.now()) / 60000));
}