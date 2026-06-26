// js/whatsapp.js
// Funções de disparo para WhatsApp via links dinâmicos wa.me

import { CONFIG } from './config.js';

// ── Reporte de defeito para o TI ──
export function enviarReporteTI({ laboratorio, pc, componente, descricao }) {
  const hora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const linhas = [
    `🔧 *TI Reporte — ${laboratorio}*`,
    ``,
    `📍 *Local:* ${laboratorio} · PC ${String(pc).padStart(2, '0')}`,
    `⚙️ *Problema:* ${componente}`,
    `🕐 *Horário:* ${hora}`,
    ``,
    `📝 *Descrição:*`,
    descricao,
    ``,
    `_Enviado via CSE Lab System_`,
  ];

  const msg = encodeURIComponent(linhas.join('\n'));
  window.open(`https://wa.me/${CONFIG.NUMERO_TI}?text=${msg}`, '_blank');
}

// ── Compartilhamento de resultado do checklist ──
export function compartilharChecklist({ lab, dia, tipo, done, total, pendentes }) {
  const pct    = Math.round((done / total) * 100);
  const hora   = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const status = done === total
    ? '🎉 Checklist 100% completo!'
    : `⚠️ ${pendentes.length} item(s) pendente(s)`;

  const linhasPend = pendentes
    .slice(0, 10)
    .map(p => `• [${p.label}] ${p.texto}`)
    .join('\n');

  const sufixo = pendentes.length > 10
    ? `\n• ...e mais ${pendentes.length - 10} item(s).`
    : '';

  const linhas = [
    `✅ *Lab Check — ${lab}*`,
    `📅 ${dia} · ${hora}`,
    `📋 ${tipo}`,
    ``,
    `*Progresso: ${done}/${total} (${pct}%)*`,
    status,
    pendentes.length > 0 ? `\n*Pendentes:*\n${linhasPend}${sufixo}` : '',
    ``,
    `_CSE Lab System_`,
  ].filter(l => l !== undefined);

  const msg = encodeURIComponent(linhas.join('\n'));
  window.open(`https://wa.me/?text=${msg}`, '_blank');
}
