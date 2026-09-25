// js/drive.js
// Integração com a Google Drive API v3 - Otimizada e Flexível

import { getToken, driveLogin } from './auth.js';
import { CONFIG } from './config.js';

const BASE = 'https://www.googleapis.com/drive/v3';
const UP   = 'https://www.googleapis.com/upload/drive/v3';

// Arquivos que NÃO são postos de trabalho
const ARQUIVOS_ESPECIAIS = ['professor', 'proflab', 'cpub', 'cpud', 'extra', 'lousa', 'quadro'];

function ehArquivoEspecial(nomeArquivo) {
  const nomeSemExt = nomeArquivo.replace(/\.[^.]+$/, '').toLowerCase();
  return ARQUIVOS_ESPECIAIS.some(esp => nomeSemExt.includes(esp));
}

function authHeaders() {
  const token = getToken();
  if (!token) {
    driveLogin();
    throw new Error('Token expirado - redirecionando para login.');
  }
  return { Authorization: `Bearer ${token}` };
}

// ────────────────────────────────────────────────────────
// LEITURA OTIMIZADA — 1 ÚNICA REQUISIÇÃO PARA LISTAR TUDO
// ────────────────────────────────────────────────────────

export async function listarTodasFotos(lab) {
  const pastaId = CONFIG.PASTAS[lab];
  if (!pastaId) throw new Error(`Pasta não configurada para o ${lab}`);

  const params = new URLSearchParams({
    q:        `'${pastaId}' in parents and mimeType contains 'image/' and trashed = false`,
    fields:   'files(id,name,mimeType,modifiedTime,thumbnailLink,webViewLink)',
    orderBy:  'name',
    pageSize: '100',
  });

  const res = await fetch(`${BASE}/files?${params}`, { headers: authHeaders() });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Erro na API do Drive (${res.status}): ${err?.error?.message || res.statusText}`);
  }
  
  const data = await res.json();
  return data.files || [];
}

// ────────────────────────────────────────────────────────
// PARSER DE NOMES FLEXÍVEL (SEM RIGIDEZ DE NOMENCLATURA)
// ────────────────────────────────────────────────────────

export function organizarFotosLab(lab, arquivos) {
  const postosMap = {};
  const extras = [];

  // Identifica o índice do laboratório (ex: "LAB 01" -> 1)
  const labMatch = lab.match(/\d+/);
  const labIndex = labMatch ? parseInt(labMatch[0]) : null;

  for (const arq of arquivos) {
    if (ehArquivoEspecial(arq.name)) {
      extras.push(arq);
      continue;
    }

    const nameLower = arq.name.toLowerCase();
    const nameWithoutExt = arq.name.replace(/\.[^.]+$/, '');
    let designation = null;
    let type = 'frente';

    // Determina o tipo (frente vs detalhe)
    if (nameLower.includes('detalhe') || 
        nameLower.includes('detail') || 
        nameLower.includes('det') || 
        nameLower.endsWith('d') || 
        nameLower.includes('_d') || 
        nameLower.includes('-d')) {
      type = 'detalhe';
    }

    // Tenta casar padrões de postos
    if (lab === 'LAB 04') {
      // LAB 04 usa arenas/posições como A1, B3, C2, etc.
      const matchArena = nameWithoutExt.match(/([a-d])\s*[-_]?\s*(\d+)/i);
      if (matchArena) {
        designation = matchArena[1].toUpperCase() + matchArena[2];
      }
    } else if (labIndex !== null) {
      // LAB 01, 02, 03 usam padrão 101-122, 201-240, 301-341, etc.
      // Primeiro procuramos um número de 3 dígitos começando com o índice do laboratório (ex: 105 para LAB 01)
      const pattern3Digits = new RegExp(`\\b${labIndex}(\\d{2})\\b`);
      const match3Digits = nameWithoutExt.match(pattern3Digits);
      
      if (match3Digits) {
        designation = parseInt(match3Digits[1]); // ex: "05" -> 5
      } else {
        // Fallback: procura qualquer padrão com número de posto (ex: posto_05, pc 12, ou apenas "05")
        const matchGeneric = nameWithoutExt.match(/(?:posto|pc|posicao)?\s*[-_]?\s*(\d+)/i);
        if (matchGeneric) {
          designation = parseInt(matchGeneric[1]);
        }
      }
    }

    // Se encontramos uma designação válida de posto (número de 1 a 50 ou string A-D + número)
    if (designation !== null && designation !== undefined) {
      if (!postosMap[designation]) {
        postosMap[designation] = { frente: null, detalhe: null };
      }
      postosMap[designation][type] = arq;
    } else {
      // Se não for identificável, vai para a lista de extras
      extras.push(arq);
    }
  }

  return { postos: postosMap, extras };
}

// ────────────────────────────────────────────────────────
// CONFIGURAÇÃO DE NOMES PADRÃO PARA UPLOADS/SUBSTITUIÇÕES
// ────────────────────────────────────────────────────────

export function obterNomeSugerido(lab, posto, tipo) {
  let baseName = '';
  if (lab === 'LAB 04') {
    baseName = String(posto).toUpperCase(); // ex: A1, B2
  } else {
    const labMatch = lab.match(/\d+/);
    const labIndex = labMatch ? labMatch[0] : '1';
    baseName = `${labIndex}${String(posto).padStart(2, '0')}`; // ex: 105 para LAB 01 Posto 5
  }

  return tipo === 'detalhe' ? `${baseName}_detalhe.jpg` : `${baseName}.jpg`;
}

// ────────────────────────────────────────────────────────
// ESCRITA E MODIFICAÇÕES NO DRIVE
// ────────────────────────────────────────────────────────

export async function deletarArquivoDrive(fileId) {
  const res = await fetch(`${BASE}/files/${fileId}`, { method: 'DELETE', headers: authHeaders() });
  if (!res.ok && res.status !== 204) throw new Error(`Deleção falhou: ${res.status}`);
  return true;
}

export async function uploadParaDrive(pastaId, nomeArquivo, blob) {
  const token    = getToken();
  const boundary = 'cse_' + Date.now();
  const metadata = JSON.stringify({ name: nomeArquivo, parents: [pastaId] });
  const fData    = await blob.arrayBuffer();

  const pre  = `--${boundary}\r\nContent-Type: application/json\r\n\r\n${metadata}\r\n--${boundary}\r\nContent-Type: ${blob.type || 'image/jpeg'}\r\n\r\n`;
  const post = `\r\n--${boundary}--`;
  
  const preB  = new TextEncoder().encode(pre);
  const postB = new TextEncoder().encode(post);

  const body = new Uint8Array(preB.byteLength + fData.byteLength + postB.byteLength);
  body.set(preB);
  body.set(new Uint8Array(fData), preB.byteLength);
  body.set(postB, preB.byteLength + fData.byteLength);

  const res = await fetch(`${UP}/files?uploadType=multipart&fields=id,name,modifiedTime,thumbnailLink,webViewLink`, {
    method:  'POST',
    headers: { 
      Authorization: `Bearer ${token}`, 
      'Content-Type': `multipart/related; boundary=${boundary}` 
    },
    body,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Upload falhou: ${err?.error?.message || res.status}`);
  }
  return res.json();
}

// Substitui a foto na pasta do laboratório
export async function substituirFotoPosto(lab, posto, tipo, blob) {
  const pastaId = CONFIG.PASTAS[lab];
  const nomeArquivo = obterNomeSugerido(lab, posto, tipo);

  // Busca se já existe um arquivo com esse posto e tipo para deletar antes
  const arquivos = await listarTodasFotos(lab);
  const { postos } = organizarFotosLab(lab, arquivos);
  const existente = postos[posto]?.[tipo];

  if (existente) {
    await deletarArquivoDrive(existente.id).catch(e => console.warn('Erro ao deletar anterior:', e));
  }

  return uploadParaDrive(pastaId, nomeArquivo, blob);
}

// Busca foto específica de um posto e tipo (reutiliza listagem rápida para evitar chamadas extras)
export async function buscarFotoPosto(lab, posto, tipo) {
  const arquivos = await listarTodasFotos(lab);
  const { postos } = organizarFotosLab(lab, arquivos);
  return postos[posto]?.[tipo] || null;
}
