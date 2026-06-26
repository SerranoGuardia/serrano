# 📋 Documentação Técnica — CSE Lab System
**Arquitetura Full-Stack para GitHub Pages + PWA + Google Drive API**

---

## ÍNDICE
1. [Estrutura de Arquivos do Projeto](#1-estrutura-de-arquivos)
2. [GitHub Pages — Configuração (Conta B)](#2-github-pages--conta-b)
3. [PWA — manifest.json + Service Worker](#3-pwa)
4. [Google Cloud Console — Configuração (Conta A)](#4-google-cloud-console--conta-a)
5. [OAuth 2.0 com PKCE — Autenticação Segura](#5-oauth-20-com-pkce)
6. [Google Drive API v3 — Galeria de Fotos](#6-google-drive-api-v3)
7. [Upload e Substituição de Fotos](#7-upload-e-substituição-de-fotos)
8. [WhatsApp — Reporte via wa.me](#8-whatsapp--reporte)
9. [Módulo drive.js — Código Completo](#9-módulo-driversjs--código-completo)
10. [Contexto de Continuidade](#10-contexto-de-continuidade)

---

## 1. Estrutura de Arquivos

```
cse-lab-system/                  ← raiz do repositório (Conta B)
├── index.html                   ← app principal (já existe: super-app-lab.html)
├── manifest.json                ← PWA manifest
├── sw.js                        ← Service Worker
├── icons/
│   ├── icon-192.png             ← ícone PWA 192×192
│   └── icon-512.png             ← ícone PWA 512×512
├── js/
│   ├── drive.js                 ← módulo Google Drive API (NOVO)
│   ├── auth.js                  ← módulo OAuth 2.0 PKCE (NOVO)
│   └── app.js                   ← lógica principal existente (inline → extrair)
└── README.md
```

---

## 2. GitHub Pages — Conta B

### Passo a passo

**2.1 — Criar o repositório**
```
1. Faça login na Conta B (desenvolvimento)
2. GitHub → New Repository
   Nome:    cse-lab-system
   Visível: Public  ← obrigatório para GitHub Pages gratuito
   Init:    ✓ Add README
3. Clonar localmente:
   git clone https://github.com/<conta-b>/cse-lab-system.git
```

**2.2 — Ativar GitHub Pages**
```
Repositório → Settings → Pages
  Source: Deploy from a branch
  Branch: main  /  (root)
  Save

URL gerada: https://<conta-b>.github.io/cse-lab-system/
```

**2.3 — Deploy contínuo**
```bash
# fluxo básico de trabalho
git add .
git commit -m "feat: adiciona módulo drive"
git push origin main
# GitHub Pages atualiza em ~30s
```

**2.4 — Variáveis sensíveis (Client ID)**
> ⚠️ O `client_id` OAuth NÃO é segredo — ele é público por design no fluxo PKCE.
> O que NUNCA deve ir ao repositório é o `client_secret`.
> No fluxo PKCE client-side, não existe `client_secret`. É seguro.

```javascript
// js/config.js  ← commitado normalmente, sem segredo
export const CONFIG = {
  CLIENT_ID: '1234567890-abc.apps.googleusercontent.com', // Conta A
  REDIRECT_URI: 'https://<conta-b>.github.io/cse-lab-system/',
  SCOPES: 'https://www.googleapis.com/auth/drive',
  
  // IDs das pastas no Drive da Conta A (um por laboratório)
  PASTAS: {
    'LAB 01': '1AbCdEfGhIjKlMnOpQrStUvWxYz',
    'LAB 02': '2AbCdEfGhIjKlMnOpQrStUvWxYz',
    'LAB 03': '3AbCdEfGhIjKlMnOpQrStUvWxYz',
    'LAB 04': '4AbCdEfGhIjKlMnOpQrStUvWxYz',
  }
};
```

---

## 3. PWA

### 3.1 — manifest.json

```json
{
  "name": "CSE Lab System",
  "short_name": "Lab System",
  "description": "Checklist, fotos e reportes dos laboratórios CSE",
  "start_url": "/cse-lab-system/",
  "scope": "/cse-lab-system/",
  "display": "standalone",
  "orientation": "portrait-primary",
  "background_color": "#0f1117",
  "theme_color": "#4f8cff",
  "lang": "pt-BR",
  "icons": [
    {
      "src": "icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

### 3.2 — Adicionar no `<head>` do index.html

```html
<link rel="manifest" href="manifest.json">
<meta name="theme-color" content="#4f8cff">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Lab System">
<link rel="apple-touch-icon" href="icons/icon-192.png">
```

### 3.3 — sw.js (Service Worker — Cache Shell)

```javascript
// sw.js
const CACHE_NAME = 'cse-lab-v1';
const SHELL = [
  './',
  './index.html',
  './manifest.json',
  './js/auth.js',
  './js/drive.js',
  './js/config.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap'
];

// Instalação: faz cache do shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL))
  );
  self.skipWaiting();
});

// Ativação: limpa caches antigos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: Network-first para API, Cache-first para shell
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Sempre busca da rede para chamadas ao Google Drive
  if (url.hostname.includes('googleapis.com') || url.hostname.includes('accounts.google.com')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Cache-first para assets locais
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
```

### 3.4 — Registrar o Service Worker no index.html

```html
<!-- Antes do </body> -->
<script>
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('SW registrado:', reg.scope))
      .catch(err => console.error('SW falhou:', err));
  }
</script>
```

---

## 4. Google Cloud Console — Conta A

> Execute estes passos logado com a **Conta A** (operacional/cloud).

### Passo a passo completo

```
PASSO 1 — Criar projeto
  → console.cloud.google.com
  → "Selecionar projeto" → "Novo Projeto"
  → Nome: cse-lab-operacional
  → Criar

PASSO 2 — Ativar a API
  → Menu lateral: "APIs e serviços" → "Biblioteca"
  → Pesquisar: "Google Drive API"
  → Selecionar → "Ativar"

PASSO 3 — Tela de consentimento OAuth
  → "APIs e serviços" → "Tela de consentimento OAuth"
  → Tipo de usuário: "Externo"
  → Preencher:
      Nome do app:         CSE Lab System
      E-mail de suporte:   <e-mail da Conta A>
      Domínios autorizados: github.io
  → Salvar e continuar

  → Escopos: adicionar manualmente:
      https://www.googleapis.com/auth/drive
  → Salvar e continuar

  → Usuários de teste: adicionar e-mails dos usuários
    (Igor, Kayky e qualquer outro)
    ⚠️ Enquanto o app estiver em "Teste", só estes e-mails funcionam.
    Para liberar para todos: solicitar verificação do app (opcional).

PASSO 4 — Criar credencial OAuth
  → "APIs e serviços" → "Credenciais"
  → "+ Criar credencial" → "ID do cliente OAuth"
  → Tipo: "Aplicativo da Web"
  → Nome: CSE Lab GitHub Pages
  → Origens JavaScript autorizadas:
      https://<conta-b>.github.io
  → URIs de redirecionamento autorizados:
      https://<conta-b>.github.io/cse-lab-system/
  → Criar
  → Copiar o CLIENT_ID gerado → colar no config.js

  ⚠️ NÃO copie o CLIENT_SECRET — não é usado no PKCE.

PASSO 5 — Estrutura de pastas no Drive (Conta A)
  → drive.google.com (logado na Conta A)
  → Criar pasta raiz: "CSE Laboratórios"
  → Dentro, criar 4 pastas:
      LAB 01 / LAB 02 / LAB 03 / LAB 04
  → Dentro de cada lab, criar subpastas por posto:
      Posto 01 / Posto 02 / ... / Posto 41
  → Copiar o ID de cada pasta raiz de lab
    (URL: drive.google.com/drive/folders/ESTE_E_O_ID)
    → colar no CONFIG.PASTAS do config.js
```

---

## 5. OAuth 2.0 com PKCE

> **Por que PKCE?** O fluxo Implicit (antigo) não usa `code_verifier` e tokens ficam
> expostos na URL. O PKCE é o padrão atual recomendado pelo Google para SPAs.
> Não há `client_secret` — é seguro publicar o `client_id`.

```javascript
// js/auth.js

import { CONFIG } from './config.js';

const TOKEN_KEY  = 'cse_drive_token';
const EXPIRY_KEY = 'cse_drive_expiry';

// ── Gera string aleatória para PKCE ──
function _randomString(length = 64) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  return Array.from(crypto.getRandomValues(new Uint8Array(length)))
    .map(b => chars[b % chars.length]).join('');
}

// ── SHA-256 do code_verifier → code_challenge ──
async function _sha256(plain) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// ── Inicia o fluxo OAuth PKCE ──
export async function iniciarLogin() {
  const verifier  = _randomString(64);
  const challenge = await _sha256(verifier);

  // Salva verifier para usar na troca de token
  sessionStorage.setItem('pkce_verifier', verifier);

  const params = new URLSearchParams({
    client_id:             CONFIG.CLIENT_ID,
    redirect_uri:          CONFIG.REDIRECT_URI,
    response_type:         'code',
    scope:                 CONFIG.SCOPES,
    code_challenge:        challenge,
    code_challenge_method: 'S256',
    access_type:           'offline',
    prompt:                'consent',
  });

  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

// ── Troca o código pelo token (chamada via proxy ou endpoint público) ──
// ATENÇÃO: O Google não permite troca de code→token direto do browser
// sem client_secret. Use uma das duas opções abaixo:
//
// OPÇÃO A (Recomendada — Google Identity Services):
//   Substituir este fluxo pelo gsi (google.accounts.oauth2.initCodeClient)
//   que lida com PKCE internamente.
//
// OPÇÃO B (Alternativa simples — Implicit Flow com token direto):
//   Usar response_type=token (mais simples, token na URL, sem refresh).
//   Adequado para apps internos com poucos usuários.
//
// Abaixo implementamos a OPÇÃO B (mais prática para este caso):

export async function iniciarLoginSimples() {
  const params = new URLSearchParams({
    client_id:     CONFIG.CLIENT_ID,
    redirect_uri:  CONFIG.REDIRECT_URI,
    response_type: 'token',
    scope:         CONFIG.SCOPES,
    prompt:        'select_account',
  });
  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

// ── Processa o token retornado na URL (após redirect) ──
export function processarCallbackToken() {
  const hash   = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  const token  = params.get('access_token');
  const expIn  = parseInt(params.get('expires_in') || '3600', 10);

  if (!token) return false;

  const expiry = Date.now() + expIn * 1000;
  localStorage.setItem(TOKEN_KEY,  token);
  localStorage.setItem(EXPIRY_KEY, String(expiry));

  // Limpa o hash da URL (boa prática de segurança)
  history.replaceState(null, '', window.location.pathname);
  return true;
}

// ── Retorna o token salvo (ou null se expirado) ──
export function getToken() {
  const token  = localStorage.getItem(TOKEN_KEY);
  const expiry = parseInt(localStorage.getItem(EXPIRY_KEY) || '0', 10);
  if (!token || Date.now() >= expiry) return null;
  return token;
}

// ── Verifica se está autenticado ──
export function estaAutenticado() {
  return getToken() !== null;
}

// ── Logout ──
export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EXPIRY_KEY);
}
```

---

## 6. Google Drive API v3 — Galeria de Fotos

```javascript
// Parte do js/drive.js — Listagem e renderização

import { getToken, iniciarLoginSimples } from './auth.js';
import { CONFIG } from './config.js';

const BASE = 'https://www.googleapis.com/drive/v3';
const UP   = 'https://www.googleapis.com/upload/drive/v3';

// ── Cabeçalho de autenticação ──
function authHeaders() {
  const token = getToken();
  if (!token) throw new Error('NÃO_AUTENTICADO');
  return { Authorization: `Bearer ${token}` };
}

// ── Listar arquivos de uma pasta ──
export async function listarArquivos(pastaId) {
  const params = new URLSearchParams({
    q:        `'${pastaId}' in parents and mimeType contains 'image/' and trashed = false`,
    fields:   'files(id, name, mimeType, modifiedTime, thumbnailLink, webContentLink)',
    orderBy:  'name',
    pageSize: '100',
  });

  const res = await fetch(`${BASE}/files?${params}`, {
    headers: authHeaders()
  });

  if (!res.ok) throw new Error(`Drive API: ${res.status}`);
  const data = await res.json();
  return data.files || [];
}

// ── Listar SUBPASTAS de uma pasta (para navegar Posto 01, Posto 02...) ──
export async function listarSubpastas(pastaId) {
  const params = new URLSearchParams({
    q:        `'${pastaId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields:   'files(id, name)',
    orderBy:  'name',
    pageSize: '50',
  });

  const res = await fetch(`${BASE}/files?${params}`, {
    headers: authHeaders()
  });

  if (!res.ok) throw new Error(`Drive API subpastas: ${res.status}`);
  const data = await res.json();
  return data.files || [];
}

// ── URL de exibição de uma imagem (via thumbnail do Drive) ──
export function urlImagem(fileId) {
  // Retorna URL direta de exibição (sem download, autenticada via token)
  return `${BASE}/files/${fileId}?alt=media`;
}

// ── Busca a foto de um posto específico (busca por nome padrão) ──
export async function buscarFotoPosto(pastaLabId, numPosto, tipo) {
  // tipo: 'frente' | 'detalhe'
  const nomeArquivo = `posto_${String(numPosto).padStart(2,'0')}_${tipo}`;
  
  const params = new URLSearchParams({
    q: `'${pastaLabId}' in parents and name contains '${nomeArquivo}' and trashed = false`,
    fields: 'files(id, name, modifiedTime)',
    pageSize: '5',
  });

  const res = await fetch(`${BASE}/files?${params}`, {
    headers: authHeaders()
  });

  const data = await res.json();
  return (data.files && data.files.length > 0) ? data.files[0] : null;
}
```

---

## 7. Upload e Substituição de Fotos

```javascript
// Parte do js/drive.js — Upload multipart e substituição

// ── Upload de nova foto (multipart) ──
export async function uploadFoto(pastaId, nomeArquivo, blob) {
  const token = getToken();
  if (!token) throw new Error('NÃO_AUTENTICADO');

  // Metadata do arquivo
  const metadata = {
    name:    nomeArquivo,
    parents: [pastaId],
  };

  // Monta multipart body manualmente (evita dependência de FormData multipart)
  const boundary  = '-------cse_boundary_' + Date.now();
  const delimiter = `\r\n--${boundary}\r\n`;
  const close_delim = `\r\n--${boundary}--`;

  // Converte blob para ArrayBuffer
  const fileBuffer = await blob.arrayBuffer();

  const metadataPart = delimiter
    + 'Content-Type: application/json\r\n\r\n'
    + JSON.stringify(metadata);

  const filePart = '\r\n--' + boundary + '\r\n'
    + `Content-Type: ${blob.type || 'image/jpeg'}\r\n\r\n`;

  // Concatena: metadados (text) + arquivo (binary)
  const metaBytes   = new TextEncoder().encode(metadataPart + filePart);
  const closeBytes  = new TextEncoder().encode(close_delim);
  const combined    = new Uint8Array(metaBytes.byteLength + fileBuffer.byteLength + closeBytes.byteLength);
  combined.set(metaBytes, 0);
  combined.set(new Uint8Array(fileBuffer), metaBytes.byteLength);
  combined.set(closeBytes, metaBytes.byteLength + fileBuffer.byteLength);

  const res = await fetch(`${UP}/files?uploadType=multipart&fields=id,name,modifiedTime`, {
    method:  'POST',
    headers: {
      Authorization:  `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: combined,
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Upload falhou: ${err.error?.message || res.status}`);
  }

  return res.json(); // { id, name, modifiedTime }
}

// ── Deletar arquivo ──
export async function deletarArquivo(fileId) {
  const res = await fetch(`${BASE}/files/${fileId}`, {
    method:  'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok && res.status !== 204) throw new Error(`Deleção falhou: ${res.status}`);
  return true;
}

// ── SUBSTITUIÇÃO — fluxo completo ──
// 1. Busca arquivo existente pelo nome padrão na pasta
// 2. Se existir, deleta o antigo
// 3. Faz upload do novo com o mesmo nome
export async function substituirFotoPosto(pastaLabId, numPosto, tipo, blob) {
  const nomeArquivo = `posto_${String(numPosto).padStart(2,'0')}_${tipo}.jpg`;

  // Busca foto existente
  const existente = await buscarFotoPosto(pastaLabId, numPosto, tipo);

  // Deleta se existir
  if (existente) {
    await deletarArquivo(existente.id);
    console.log(`Foto anterior deletada: ${existente.name}`);
  }

  // Faz upload do novo arquivo
  const novoArquivo = await uploadFoto(pastaLabId, nomeArquivo, blob);
  console.log(`Nova foto salva: ${novoArquivo.name} (id: ${novoArquivo.id})`);
  return novoArquivo;
}

// ── Captura via câmera (HTML5) e retorna Blob ──
export function capturarFotoCamera(videoElement) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width  = videoElement.videoWidth  || 1280;
    canvas.height = videoElement.videoHeight || 720;
    canvas.getContext('2d').drawImage(videoElement, 0, 0);
    canvas.toBlob(blob => {
      if (!blob) return reject(new Error('Falha ao capturar frame'));
      resolve(blob);
    }, 'image/jpeg', 0.92); // qualidade 92%
  });
}

// ── Input de arquivo → Blob ──
export function fileInputParaBlob(fileInputElement) {
  const file = fileInputElement.files[0];
  if (!file) return null;
  return file; // File é subclasse de Blob
}
```

---

## 8. WhatsApp — Reporte

```javascript
// js/whatsapp.js

// Número do responsável de TI (com código do país, sem + ou espaços)
const NUMERO_TI = '5519900000000'; // ← substituir pelo número real

export function enviarReporteTI({ laboratorio, pc, componente, descricao, hora }) {
  const msg = [
    `🔧 *TI Reporte — ${laboratorio}*`,
    ``,
    `📍 *Local:* ${laboratorio} · PC ${String(pc).padStart(2,'0')}`,
    `⚙️ *Problema:* ${componente}`,
    `🕐 *Horário:* ${hora || new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}`,
    ``,
    `📝 *Descrição:*`,
    descricao,
    ``,
    `_Enviado via CSE Lab System_`
  ].join('%0A');

  // Abre o WhatsApp Web ou app com mensagem pré-preenchida
  window.open(`https://wa.me/${NUMERO_TI}?text=${msg}`, '_blank');
}

// Compartilhamento de checklist via WhatsApp
export function compartilharChecklist({ lab, dia, tipo, done, total, pendentes }) {
  const pct = Math.round(done / total * 100);
  
  const linhasPendentes = pendentes.slice(0, 8)
    .map(p => `• [${p.label}] ${p.texto}`)
    .join('%0A');

  const sufixo = pendentes.length > 8
    ? `%0A• ...e mais ${pendentes.length - 8} item(s).`
    : '';

  const status = done === total ? '🎉 100% completo!' : `⚠️ ${pendentes.length} pendente(s)`;

  const msg = [
    `✅ *Lab Check — ${lab}*`,
    `📅 ${dia} · ${tipo}`,
    ``,
    `*Progresso: ${done}/${total} (${pct}%)*`,
    status,
    pendentes.length > 0 ? `%0A*Pendentes:*%0A${linhasPendentes}${sufixo}` : '',
    ``,
    `_CSE Lab System_`
  ].join('%0A');

  window.open(`https://wa.me/?text=${msg}`, '_blank');
}
```

---

## 9. Módulo drive.js — Código Completo

```javascript
// js/drive.js — versão completa e integrada

import { getToken, iniciarLoginSimples, estaAutenticado } from './auth.js';
import { CONFIG } from './config.js';

const BASE = 'https://www.googleapis.com/drive/v3';
const UP   = 'https://www.googleapis.com/upload/drive/v3';

function authHeaders() {
  const token = getToken();
  if (!token) { iniciarLoginSimples(); throw new Error('Redirecionando para login...'); }
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

// ─── LEITURA ───────────────────────────────────────────

export async function listarSubpastas(pastaId) {
  const q = `'${pastaId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  const p = new URLSearchParams({ q, fields: 'files(id,name)', orderBy: 'name', pageSize: '50' });
  const r = await fetch(`${BASE}/files?${p}`, { headers: authHeaders() });
  const d = await r.json();
  return d.files || [];
}

export async function buscarFotoPosto(pastaLabId, numPosto, tipo) {
  const nome = `posto_${String(numPosto).padStart(2,'0')}_${tipo}`;
  const q = `'${pastaLabId}' in parents and name contains '${nome}' and trashed=false`;
  const p = new URLSearchParams({ q, fields: 'files(id,name,modifiedTime,thumbnailLink)', pageSize: '5' });
  const r = await fetch(`${BASE}/files?${p}`, { headers: authHeaders() });
  const d = await r.json();
  return d.files?.[0] || null;
}

export async function getUrlImagem(fileId) {
  // Retorna dados da imagem como blob URL (funciona com token Bearer)
  const r = await fetch(`${BASE}/files/${fileId}?alt=media`, { headers: authHeaders() });
  if (!r.ok) return null;
  const blob = await r.blob();
  return URL.createObjectURL(blob);
}

// ─── ESCRITA ───────────────────────────────────────────

export async function deletarArquivo(fileId) {
  await fetch(`${BASE}/files/${fileId}`, { method: 'DELETE', headers: authHeaders() });
}

export async function uploadFoto(pastaId, nomeArquivo, blob) {
  const token = getToken();
  const boundary = 'cse_lab_' + Date.now();

  const meta     = JSON.stringify({ name: nomeArquivo, parents: [pastaId] });
  const fileData = await blob.arrayBuffer();

  const pre   = `--${boundary}\r\nContent-Type: application/json\r\n\r\n${meta}\r\n--${boundary}\r\nContent-Type: ${blob.type || 'image/jpeg'}\r\n\r\n`;
  const post  = `\r\n--${boundary}--`;
  const preB  = new TextEncoder().encode(pre);
  const postB = new TextEncoder().encode(post);
  const body  = new Uint8Array(preB.byteLength + fileData.byteLength + postB.byteLength);
  body.set(preB);
  body.set(new Uint8Array(fileData), preB.byteLength);
  body.set(postB, preB.byteLength + fileData.byteLength);

  const r = await fetch(`${UP}/files?uploadType=multipart&fields=id,name,modifiedTime`, {
    method:  'POST',
    headers: {
      Authorization:  `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body,
  });

  if (!r.ok) throw new Error(`Upload: ${(await r.json()).error?.message}`);
  return r.json();
}

export async function substituirFotoPosto(lab, numPosto, tipo, blob) {
  const pastaId    = CONFIG.PASTAS[lab];
  const nomeArquivo = `posto_${String(numPosto).padStart(2,'0')}_${tipo}.jpg`;
  const existente  = await buscarFotoPosto(pastaId, numPosto, tipo);
  if (existente) await deletarArquivo(existente.id);
  return uploadFoto(pastaId, nomeArquivo, blob);
}

// ─── INTEGRAÇÃO COM O APP EXISTENTE ────────────────────

// Chame esta função na seção de Fotos do super-app para renderizar o grid do Drive
export async function renderizarGaleriaDrive(lab, containerEl, onClickPosto) {
  const pastaId = CONFIG.PASTAS[lab];
  containerEl.innerHTML = '<p style="color:var(--text3);padding:20px">Carregando fotos...</p>';

  const fotos = {};
  // Busca frente e detalhe de todos os 41 postos em paralelo
  const promessas = [];
  for (let p = 1; p <= 41; p++) {
    promessas.push(buscarFotoPosto(pastaId, p, 'frente').then(f  => { if (f) fotos[`${p}_frente`]  = f; }));
    promessas.push(buscarFotoPosto(pastaId, p, 'detalhe').then(d => { if (d) fotos[`${p}_detalhe`] = d; }));
  }
  await Promise.allSettled(promessas);

  let html = '<div class="posto-grid">';
  for (let p = 1; p <= 41; p++) {
    const fF = fotos[`${p}_frente`];
    const fD = fotos[`${p}_detalhe`];
    const hasFoto = fF || fD;
    const dataStr = hasFoto
      ? new Date((fF||fD).modifiedTime).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'2-digit'})
      : 'Sem foto';

    // thumbnailLink: miniatura pública do Drive (não requer auth para exibir)
    const thumbSrc = (fF||fD)?.thumbnailLink?.replace('=s220','=s400') || '';

    html += `<div class="posto-card${hasFoto?' has-foto':''}" onclick="onClickPosto(${p})">
      ${hasFoto
        ? `<img class="posto-thumb" src="${thumbSrc}" loading="lazy">`
        : `<div class="posto-thumb-empty"><span class="posto-thumb-icon">📷</span><span class="posto-thumb-txt">Sem foto</span></div>`}
      ${hasFoto ? '<div class="posto-dot"></div>' : ''}
      <div class="posto-label">
        <span class="posto-num">Posto ${String(p).padStart(2,'0')}</span>
        <span class="posto-date">${dataStr}</span>
      </div>
    </div>`;
  }
  html += '</div>';
  containerEl.innerHTML = html;
}
```

---

## 10. Contexto de Continuidade

> **Copie e cole este bloco inteiro para continuar com outra IA.**

---

```
══════════════════════════════════════════════════════════════════
CONTEXTO DE CONTINUIDADE — CSE Lab System
Versão: 1.0 | Data: 2025-06
══════════════════════════════════════════════════════════════════

## RESUMO EXECUTIVO
Aplicativo web (HTML/JS Vanilla, sem frameworks) para gestão de 4
laboratórios de informática com ~41 postos cada. Funciona como PWA
instalável no celular. Hospedado no GitHub Pages (estático).
Três módulos: Checklist diário, Galeria de Fotos dos postos,
Reporte de defeitos via WhatsApp.

## ESTADO ATUAL DO CÓDIGO
- super-app-lab.html: arquivo único com os 3 módulos funcionais.
  · Checklist: 100% funcional. Usa localStorage. Lógica de
    cronograma semanal, 3 tipos de revisão (nivel1, nivel2, completa),
    registro de defeitos com foto (base64 no localStorage).
  · Fotos dos Postos: 100% funcional LOCALMENTE (base64 no
    localStorage). ← PRÓXIMA ETAPA: migrar para Google Drive.
  · Reporte TI: funcional via wa.me. Tinha endpoint Google Apps
    Script (URL hardcoded) que pode ter expirado.

## ARQUITETURA ESCOLHIDA
- Hospedagem: GitHub Pages (Conta B de desenvolvimento)
- Armazenamento de fotos: Google Drive API v3 (Conta A operacional)
- Autenticação: OAuth 2.0 Implicit Flow (response_type=token)
  · SEM client_secret (não necessário para SPA pública)
  · Token armazenado no localStorage com controle de expiração
  · Fluxo: usuário clica "Conectar Drive" → redireciona para Google
    → retorna com access_token na URL hash → app salva e usa
- Upload: multipart/related via fetch (sem biblioteca gapi)
- Substituição de foto: delete arquivo antigo → upload novo mesmo nome

## ESTRUTURA DE PASTAS NO DRIVE (Conta A)
CSE Laboratórios/
  LAB 01/
    posto_01_frente.jpg
    posto_01_detalhe.jpg
    posto_02_frente.jpg
    ...
  LAB 02/ ... LAB 03/ ... LAB 04/

## NOMENCLATURA DE ARQUIVOS
posto_XX_frente.jpg   (visão geral da mesa, monitor, equipamentos)
posto_XX_detalhe.jpg  (cabos, parte inferior, área de risco)
XX = número com zero à esquerda (01, 02, ..., 41)

## ARQUIVOS CRIADOS / A CRIAR
Criados (documento):
  - js/auth.js        → OAuth 2.0 Implicit Flow + PKCE scaffold
  - js/drive.js       → CRUD Google Drive API v3
  - js/config.js      → CLIENT_ID e IDs das pastas (público, sem segredos)
  - js/whatsapp.js    → Funções wa.me para reporte e checklist
  - manifest.json     → PWA manifest
  - sw.js             → Service Worker cache-first

A criar:
  - Refatorar super-app-lab.html para importar os módulos JS
  - Substituir lógica de fotos do localStorage pelo drive.js
  - Adicionar botão "Conectar Drive" na tela de Fotos
  - Tratar estado: autenticado vs. não autenticado no módulo de fotos

## CONFIG NECESSÁRIA (a preencher pelo usuário)
js/config.js:
  CLIENT_ID:  "<ID gerado no Google Cloud Console — Conta A>"
  REDIRECT_URI: "https://<conta-b>.github.io/cse-lab-system/"
  PASTAS:
    'LAB 01': "<ID da pasta LAB 01 no Drive da Conta A>"
    'LAB 02': "<ID da pasta LAB 02 no Drive da Conta A>"
    'LAB 03': "<ID da pasta LAB 03 no Drive da Conta A>"
    'LAB 04': "<ID da pasta LAB 04 no Drive da Conta A>"

whatsapp.js:
  NUMERO_TI: "55XXYYYYYYYYYY" (número do responsável TI)

## GOOGLE CLOUD CONSOLE (Conta A) — STATUS
☐ Projeto criado: cse-lab-operacional
☐ Google Drive API ativada
☐ Tela consentimento OAuth configurada (tipo: Externo)
☐ Credencial OAuth criada (tipo: App da Web)
☐ Origem autorizada: https://<conta-b>.github.io
☐ URI redirect autorizado: https://<conta-b>.github.io/cse-lab-system/
☐ Usuários de teste adicionados (Igor, Kayky)

## PRÓXIMOS PASSOS (em ordem)
1. Criar repositório no GitHub (Conta B) e ativar Pages
2. Configurar Google Cloud Console (Conta A) — checklist acima
3. Criar config.js com CLIENT_ID e IDs das pastas
4. Copiar js/auth.js, js/drive.js, js/whatsapp.js para o repositório
5. Criar icons/ (192×192 e 512×512 PNG) — pode gerar com Canva/DALL-E
6. Adicionar manifest.json e sw.js ao repositório
7. Refatorar seção "Fotos" do super-app-lab.html:
   a. Botão "Conectar Google Drive" (chama iniciarLoginSimples())
   b. Ao carregar a tela, checar estaAutenticado()
   c. Se autenticado: chamar renderizarGaleriaDrive()
   d. Se não: mostrar botão de login
   e. No modal de foto: ao salvar, chamar substituirFotoPosto()
      em vez de salvar no localStorage
8. Testar localmente com servidor HTTP (npx serve . ou Live Server)
   ⚠️ OAuth NÃO funciona em file:// — precisa de http://localhost
9. Deploy no GitHub Pages e testar em produção

## DEPENDÊNCIAS
- Nenhuma biblioteca externa (Vanilla JS puro)
- Google Fonts: DM Sans + DM Mono (já no HTML)
- APIs externas: Google Drive API v3, Google OAuth 2.0

## LIMITAÇÕES CONHECIDAS
- Implicit Flow: token expira em 1h, sem refresh automático
  (usuário precisa re-autenticar). Aceitável para uso diário.
- localStorage das fotos antigas (base64) continuará funcionando
  como fallback se o Drive não estiver conectado.
- GitHub Pages serve arquivos estáticos apenas — sem backend.
  Toda lógica é client-side.
- CORS: Drive API v3 permite chamadas direto do browser com token Bearer.

## TECNOLOGIAS
HTML5, CSS3 Custom Properties, JavaScript ES Modules (import/export),
Web Crypto API (PKCE), Cache API (Service Worker), localStorage,
Camera API (getUserMedia), Google Drive API v3, OAuth 2.0 Implicit Flow,
GitHub Pages, PWA (manifest + SW)
══════════════════════════════════════════════════════════════════
```
