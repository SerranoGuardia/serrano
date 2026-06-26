// js/drive.js
// Google Drive API v3 — leitura, upload e substituição de fotos
// Vanilla JS, sem dependências externas

import { getToken, iniciarLogin } from './auth.js';
import { CONFIG } from './config.js';

const BASE = 'https://www.googleapis.com/drive/v3';
const UP   = 'https://www.googleapis.com/upload/drive/v3';

// ─────────────────────────────────────────
// INTERNO
// ─────────────────────────────────────────

function authHeaders() {
  const token = getToken();
  if (!token) {
    iniciarLogin();
    throw new Error('Token expirado — redirecionando para login.');
  }
  return { Authorization: `Bearer ${token}` };
}

async function driveGet(path, params) {
  const url = `${BASE}${path}?${new URLSearchParams(params)}`;
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Drive API ${res.status}: ${err?.error?.message || res.statusText}`);
  }
  return res.json();
}

// ─────────────────────────────────────────
// LEITURA
// ─────────────────────────────────────────

// Busca o arquivo de foto de um posto específico pelo nome padrão
export async function buscarFotoPosto(lab, numPosto, tipo) {
  const pastaId = CONFIG.PASTAS[lab];
  const nome    = `posto_${String(numPosto).padStart(2, '0')}_${tipo}`;
  const data    = await driveGet('/files', {
    q:        `'${pastaId}' in parents and name contains '${nome}' and trashed=false`,
    fields:   'files(id,name,modifiedTime,thumbnailLink)',
    orderBy:  'modifiedTime desc',
    pageSize: '5',
  });
  return data.files?.[0] || null;
}

// Retorna uma URL de objeto (blob) para exibir a imagem autenticada
export async function getUrlImagem(fileId) {
  const res = await fetch(`${BASE}/files/${fileId}?alt=media`, {
    headers: authHeaders(),
  });
  if (!res.ok) return null;
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

// ─────────────────────────────────────────
// ESCRITA
// ─────────────────────────────────────────

export async function deletarArquivo(fileId) {
  const res = await fetch(`${BASE}/files/${fileId}`, {
    method:  'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok && res.status !== 204) {
    throw new Error(`Deleção falhou: ${res.status}`);
  }
  return true;
}

export async function uploadFoto(pastaId, nomeArquivo, blob) {
  const token    = getToken();
  const boundary = 'cse_lab_' + Date.now();

  const meta  = JSON.stringify({ name: nomeArquivo, parents: [pastaId] });
  const fData = await blob.arrayBuffer();

  const pre  = `--${boundary}\r\nContent-Type: application/json\r\n\r\n${meta}\r\n--${boundary}\r\nContent-Type: ${blob.type || 'image/jpeg'}\r\n\r\n`;
  const post = `\r\n--${boundary}--`;
  const preB  = new TextEncoder().encode(pre);
  const postB = new TextEncoder().encode(post);

  const body = new Uint8Array(preB.byteLength + fData.byteLength + postB.byteLength);
  body.set(preB);
  body.set(new Uint8Array(fData), preB.byteLength);
  body.set(postB, preB.byteLength + fData.byteLength);

  const res = await fetch(`${UP}/files?uploadType=multipart&fields=id,name,modifiedTime`, {
    method:  'POST',
    headers: {
      Authorization:  `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Upload falhou: ${err?.error?.message || res.status}`);
  }
  return res.json(); // { id, name, modifiedTime }
}

// Fluxo completo: busca → deleta antigo → faz upload novo
export async function substituirFotoPosto(lab, numPosto, tipo, blob) {
  const pastaId      = CONFIG.PASTAS[lab];
  const nomeArquivo  = `posto_${String(numPosto).padStart(2, '0')}_${tipo}.jpg`;
  const existente    = await buscarFotoPosto(lab, numPosto, tipo);

  if (existente) {
    await deletarArquivo(existente.id);
  }

  return uploadFoto(pastaId, nomeArquivo, blob);
}

// ─────────────────────────────────────────
// GALERIA — renderiza grid de postos
// ─────────────────────────────────────────

export async function renderizarGaleria(lab, containerEl, onClickPosto) {
  containerEl.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;padding:40px;gap:12px;color:var(--text3)">
      <span style="font-size:20px;animation:spin 1s linear infinite;display:inline-block">⟳</span>
      Carregando fotos do Drive...
    </div>`;

  // Busca frente e detalhe de todos os postos em paralelo
  const fotos = {};
  const promessas = [];
  for (let p = 1; p <= 41; p++) {
    promessas.push(
      buscarFotoPosto(lab, p, 'frente').then(f => { if (f) fotos[`${p}_frente`]  = f; }).catch(() => {})
    );
    promessas.push(
      buscarFotoPosto(lab, p, 'detalhe').then(d => { if (d) fotos[`${p}_detalhe`] = d; }).catch(() => {})
    );
  }
  await Promise.allSettled(promessas);

  let comFoto = 0;
  for (let p = 1; p <= 41; p++) {
    if (fotos[`${p}_frente`] || fotos[`${p}_detalhe`]) comFoto++;
  }

  let html = `
    <div class="fotos-section-label">
      ${lab} · Postos de Trabalho
      <span class="fotos-count">${comFoto}/41 com foto</span>
    </div>
    <div class="posto-grid">`;

  for (let p = 1; p <= 41; p++) {
    const fF       = fotos[`${p}_frente`];
    const fD       = fotos[`${p}_detalhe`];
    const hasFoto  = fF || fD;
    const principal = fF || fD;
    // thumbnailLink é URL pública do Drive (não precisa de token para exibir miniatura)
    const thumb    = principal?.thumbnailLink?.replace('=s220', '=s400') || '';
    const dataStr  = hasFoto
      ? new Date(principal.modifiedTime).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'2-digit' })
      : 'Sem foto';

    html += `
      <div class="posto-card${hasFoto ? ' has-foto' : ''}" onclick="(${onClickPosto.toString()})(${p})">
        ${hasFoto
          ? `<img class="posto-thumb" src="${thumb}" loading="lazy" alt="Posto ${p}">`
          : `<div class="posto-thumb-empty"><span class="posto-thumb-icon">📷</span><span class="posto-thumb-txt">Sem foto</span></div>`}
        ${hasFoto ? '<div class="posto-dot"></div>' : ''}
        <div class="posto-label">
          <span class="posto-num">Posto ${String(p).padStart(2, '0')}</span>
          <span class="posto-date">${dataStr}</span>
        </div>
      </div>`;
  }
  html += '</div>';
  containerEl.innerHTML = html;
}
