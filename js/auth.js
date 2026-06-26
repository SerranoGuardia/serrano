// js/auth.js
// OAuth 2.0 Implicit Flow para SPA hospedada no GitHub Pages
// Sem client_secret — seguro para uso client-side

import { CONFIG } from './config.js';

const TOKEN_KEY  = 'cse_drive_token';
const EXPIRY_KEY = 'cse_drive_expiry';

// ── Inicia o login: redireciona para o Google ──
export function iniciarLogin() {
  const params = new URLSearchParams({
    client_id:     CONFIG.CLIENT_ID,
    redirect_uri:  CONFIG.REDIRECT_URI,
    response_type: 'token',
    scope:         CONFIG.SCOPES,
    prompt:        'select_account',
  });
  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

// ── Processa o token retornado na URL após o redirect ──
// Chame esta função no início do app (window.onload)
export function processarCallbackToken() {
  const hash   = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  const token  = params.get('access_token');
  const expIn  = parseInt(params.get('expires_in') || '3600', 10);

  if (!token) return false;

  const expiry = Date.now() + expIn * 1000;
  localStorage.setItem(TOKEN_KEY,  token);
  localStorage.setItem(EXPIRY_KEY, String(expiry));

  // Limpa o token da URL por segurança
  history.replaceState(null, '', window.location.pathname);
  return true;
}

// ── Retorna o token salvo (null se expirado ou ausente) ──
export function getToken() {
  const token  = localStorage.getItem(TOKEN_KEY);
  const expiry = parseInt(localStorage.getItem(EXPIRY_KEY) || '0', 10);
  if (!token || Date.now() >= expiry) return null;
  return token;
}

// ── Verifica se o usuário está autenticado ──
export function estaAutenticado() {
  return getToken() !== null;
}

// ── Tempo restante do token em minutos ──
export function minutosRestantes() {
  const expiry = parseInt(localStorage.getItem(EXPIRY_KEY) || '0', 10);
  return Math.max(0, Math.round((expiry - Date.now()) / 60000));
}

// ── Logout ──
export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EXPIRY_KEY);
}
