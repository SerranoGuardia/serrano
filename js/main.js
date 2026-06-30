// js/main.js
// Controlador principal do CSE Lab System - SPA, Checklist e Relatórios

import { CONFIG } from './config.js';
import * as Auth from './auth.js';
import * as Drive from './drive.js';
import * as WA from './whatsapp.js';

// ═══════════════════════════════════════════════
// CONSTANTES & CONFIGURAÇÕES LOCAIS
// ═══════════════════════════════════════════════
const DAYS = [
  { key: 'seg', label: 'SEG', fullLabel: 'Segunda-feira' },
  { key: 'ter', label: 'TER', fullLabel: 'Terça-feira' },
  { key: 'qua', label: 'QUA', fullLabel: 'Quarta-feira' },
  { key: 'qui', label: 'QUI', fullLabel: 'Quinta-feira' },
  { key: 'sex', label: 'SEX', fullLabel: 'Sexta-feira' }
];

const SCHEDULE = {
  seg: [
    { lab: 'LAB 01', time: '12:30–13:25', type: 'nivel1', note: '' },
    { lab: 'LAB 02', time: '14:35–15:20', type: 'nivel1', note: 'Desligamento' },
    { lab: 'LAB 03', time: '15:35–16:20', type: 'nivel1', note: 'Desligamento' },
    { lab: 'LAB 04', time: '16:20–17:05', type: 'nivel1', note: 'Desligamento' },
  ],
  ter: [
    { lab: 'LAB 02', time: '14:00–15:15', type: 'completa', note: 'Desligamento' },
    { lab: 'LAB 03', time: '15:30–16:45', type: 'completa', note: 'Desligamento' },
    { lab: 'LAB 04', time: '16:45–18:00', type: 'completa', note: 'Desligamento' },
  ],
  qua: [
    { lab: 'LAB 02', time: '15:30–16:15', type: 'nivel1', note: 'Desligamento' },
    { lab: 'LAB 03', time: '16:15–17:00', type: 'nivel1', note: 'Desligamento' },
    { lab: 'LAB 04', time: '17:00–17:45', type: 'nivel1', note: 'Desligamento' },
    { lab: 'LAB 01', time: '17:45–17:55', type: null,     note: 'Só desligamento · recolher chave' },
  ],
  qui: [
    { lab: 'LAB 02', time: '13:15–14:00', type: 'nivel1', note: '' },
    { lab: 'LAB 03', time: '15:35–16:20', type: 'nivel1', note: 'Desligamento' },
    { lab: 'LAB 01', time: '16:20–17:05', type: 'nivel1', note: 'Desligamento · recolher chave' },
    { lab: 'LAB 04', time: '17:05–17:45', type: 'nivel1', note: 'Desligamento' },
    { lab: 'LAB 02', time: '17:45–18:00', type: 'nivel2', note: 'Desligamento' },
  ],
  sex: [
    { lab: 'LAB 03', time: '14:40–15:25', type: 'nivel1', note: 'Desligamento' },
    { lab: 'LAB 02', time: '15:40–16:25', type: 'nivel1', note: 'Desligamento' },
    { lab: 'LAB 01', time: '16:25–17:10', type: 'nivel1', note: 'Desligamento · recolher chave' },
    { lab: 'LAB 04', time: '17:10–17:55', type: 'nivel1', note: 'Desligamento' },
  ]
};

const ENCERRAMENTO_ITEMS = [
  'Desligar computadores.',
  'Desligar estabilizadores (apenas após desligar os computadores).',
  'Desligar disjuntores (apenas após desligar os estabilizadores).',
  'Desconectar o notebook do professor da tomada (quando aplicável).',
  'Posicionar cada mouse junto à respectiva CPU e deixar o cabeamento organizado.',
  'Posicionar cada teclado junto à respectiva CPU e deixar o cabeamento organizado.',
  'Recostar as cadeiras nas bancadas, segundo a numeração de cada posição.',
  'Colocar a banqueta junto à mesa do professor.',
  'Alinhar as arenas que estão penduradas na parede (lab 04).',
  'Apagar o quadro branco e a lousa.',
  'Encaminhar objetos no suporte da lousa para a Secretaria (exceção: apagadores e marcadores de quadro branco no lab 01).',
  'Fechar as janelas (obrigatório apenas nos labs 01 e 03).',
  'Travar as janelas (obrigatório apenas no lab 03).',
  'Desligar os ventiladores.',
  'Apagar as luzes.',
  'Trancar a porta.'
];

const CHECKLISTS = {
  nivel1: [
    { id: 'infra', tab: '🏗️ Infraestrutura', sections: [
      { id: 'porta',        title: '1.1 PORTA',        num: '1.1', items: ['Face interna e externa: integridade.', 'Maçaneta: integridade.', 'Janelinha (quando aplicável): integridade.'] },
      { id: 'janelas',      title: '1.2 JANELAS',       num: '1.2', items: ['Cortinas desencaixadas.'] },
      { id: 'ventiladores', title: '1.3 VENTILADORES',  num: '1.3', items: ['Funcionamento.'] },
      { id: 'lousa',        title: '1.4 LOUSA',         num: '1.4', items: ['Integridade da superfície da lousa.', 'Integridade do suporte para apagador e caneta de quadro branco.'] },
      { id: 'iluminacao',   title: '1.5 ILUMINAÇÃO',    num: '1.5', items: ['Lâmpadas "queimadas" ou intermitentes.'] }
    ]},
    { id: 'postos', tab: '💻 Postos de Trabalho', sections: [
      { id: 'cpus',          title: '2.1 CPUs',          num: '2.1', items: ['Gabinete: integridade (danos, riscos, parafusos faltando ou frouxos, conexão do cabeamento).', 'Suportes (pés) de borracha: integridade e encaixe.', 'Tampas de baia frontais: integridade e encaixe.', 'Identificação da numeração de bancadas: integridade.'] },
      { id: 'mouses',        title: '2.2 MOUSES',        num: '2.2', items: ['Carcaça e botões: integridade.', 'Cabo: dano na integridade del isolamento, revelando a fiação interna.'] },
      { id: 'teclados',      title: '2.3 TECLADOS',      num: '2.3', items: ['Carcaça: integridade.', 'Teclas soltas (virar cada teclado "de cabeça para baixo" e chacoalhá-lo levemente).', 'Teclas danificadas ou com encapamento danificado.', 'Objetos estranhos entre as teclas.', 'Cabo: dano na integridade del isolamento, revelando a fiação interna.'] },
      { id: 'monitores',     title: '2.4 MONITORES',     num: '2.4', items: ['Integridade da carcaça e da tela (riscos visíveis com o monitor ligado e desligado).'] },
      { id: 'bancadas',      title: '2.5 BANCADAS',      num: '2.5', items: ['Integridade da parte superior: riscos, danos e descascados.', 'Limpeza na parte superior: papéis de bala, adesivos, chicletes etc.'] },
      { id: 'cadeiras',      title: '2.6 CADEIRAS',      num: '2.6', items: ['Assento, encosto e "pernas" da cadeira: integridade (rachaduras, danos etc.).', 'Limpeza: riscos, adesivos, chicletes ou outras coisas no assento ou no encosto.'] },
      { id: 'estabilizadores', title: '2.7 ESTABILIZADORES', num: '2.7', items: ['Funcionamento: botão power e LED.', 'Carcaça: integridade.', 'Cabos de energia (do próprio estabilizador e dos equipamentos conectados): falha na integridade del isolamento, revelando a fiação interna.'] }
    ]},
    { id: 'encerramento', tab: '🔒 Encerramento', sections: [
      { id: 'enc', title: 'AÇÕES PARA ENCERRAMENTO', num: '3', items: ENCERRAMENTO_ITEMS }
    ]}
  ],

  nivel2: [
    { id: 'postos', tab: '💻 Postos de Trabalho', sections: [
      { id: 'cpus',     title: '1.1 CPUs',     num: '1.1', items: ['Gabinete: integridade (danos, riscos).', 'Suportes (pés) de borracha: integridade e encaixe.', 'Tampas de baia frontais: integridade e encaixe.'] },
      { id: 'mouses',   title: '1.2 MOUSES',   num: '1.2', items: ['Carcaça e botões: integridade.'] },
      { id: 'teclados', title: '1.3 TECLADOS', num: '1.3', items: ['Carcaça: integridade.', 'Teclas soltas (virar cada teclado "de cabeça para baixo" e chacoalhá-lo levemente).', 'Teclas danificadas ou com encapamento danificado.', 'Objetos estranhos entre as teclas.'] },
      { id: 'monitores', title: '1.4 MONITORES', num: '1.4', items: ['Integridade da carcaça e da tela (riscos visíveis com o monitor ligado e desligado).'] },
      { id: 'bancadas', title: '1.5 BANCADAS',  num: '1.5', items: ['Integridade da parte superior: riscos, danos e descascados.', 'Limpeza na parte superior: papéis de bala, adesivos, chicletes etc.'] },
      { id: 'cadeiras', title: '1.6 CADEIRAS',  num: '1.6', items: ['Assento, encosto e "pernas" da cadeira: integridade (rachaduras, danos etc.).', 'Limpeza: riscos, adesivos, chicletes ou outras coisas no assento ou no encosto.'] }
    ]},
    { id: 'encerramento', tab: '🔒 Encerramento', sections: [
      { id: 'enc', title: 'AÇÕES PARA ENCERRAMENTO', num: '2', items: ENCERRAMENTO_ITEMS }
    ]}
  ],

  completa: [
    { id: 'infra', tab: '🏗️ Infraestrutura', sections: [
      { id: 'porta',     title: '1.1 PORTA',     num: '1.1', items: ['Face interna e externa: integridade.', 'Janelinha (quando aplicável): integridade.', 'Maçaneta: integridade e funcionamento.', 'Fechadura: integridade e funcionamento.', 'Abertura e fechamento.'] },
      { id: 'janelas',   title: '1.2 JANELAS',   num: '1.2', items: ['Vidros e molduras: integridade.', 'Puxadores e travas: integridade e funcionamento (na abertura e no fechamento).', 'Cortinas: integridade e funcionamento (deslizamento).', 'Cortinas desencaixadas.'] },
      { id: 'ventiladores', title: '1.3 VENTILADORES', num: '1.3', items: ['Acionamento e desligamento.', 'Controle de velocidade (quando aplicável): variação.', 'Botões e knobs: integridade.'] },
      { id: 'lousa',     title: '1.4 LOUSA',     num: '1.4', items: ['Integridade da superfície da lousa.', 'Integridade do suporte para apagador e caneta de quadro branco.'] },
      { id: 'iluminacao', title: '1.5 ILUMINAÇÃO', num: '1.5', items: ['Acionamento e desligamento.', 'Lâmpadas "queimadas" ou intermitentes.'] },
      { id: 'comvisual', title: '1.6 COM. VISUAL', num: '1.6', items: ['Integridade e colagem de cartazes, avisos e horários de aula fixados nas paredes.', 'Integridade e colagem de avisos adesivados na porta (proibição de uso de celular, instruções para trancar a porta etc.).'] }
    ]},
    { id: 'postos', tab: '💻 Postos de Trabalho', sections: [
      { id: 'cpus',     title: '2.1 CPUs',     num: '2.1', items: ['Gabinete: integridade (danos, riscos, parafusos faltando ou frouxos etc.).', 'Suportes (pés) de borracha: integridade e encaixe.', 'Tampas de baia frontais: integridade e encaixe.', 'Tampas de baia traseiras: integridade e encaixe.', 'Orifícios de ventilação e dentro de baias: existência de objetos estranhos, especialmente obstruindo a passagem de ar.', 'Conectores dos periféricos: encaixados por completo.', 'Identificação da numeração de posição: integridade.', 'Etiqueta OEM: integridade.', 'Etiqueta de código CSG: integridade.'] },
      { id: 'mouses',   title: '2.2 MOUSES',   num: '2.2', items: ['Carcaça e botões: integridade.', 'Cabo: dano na integridade del isolamento, revelando a fiação interna.', 'Botões esquerdo, direito e central (quando aplicável): funcionamento (selecionar e arrastar).', 'Botão de scroll: funcionamento (rolagem e seleção).', 'Etiqueta de código CSG (quando aplicável): integridade.', 'Etiqueta de fabricação (quando aplicável): integridade.'] },
      { id: 'teclados', title: '2.3 TECLADOS', num: '2.3', items: ['Carcaça: integridade.', 'Teclas soltas (dica: virar cada teclado "de cabeça para baixo" e chacoalhá-lo levemente).', 'Teclas danificadas ou com encapamento danificado.', 'Teclas com caracteres apagados.', 'Teclas em posições trocadas.', 'Objetos estranhos entre as teclas.', 'Cabo: dano na integridade del isolamento, revelando a fiação interna.', 'Etiqueta de código CSG (quando aplicável): integridade.', 'Etiqueta de fabricação (quando aplicável): integridade.'] },
      { id: 'monitores', title: '2.4 MONITORES', num: '2.4', items: ['Integridade da carcaça e da tela (riscos, aqueles visíveis com o monitor ligado e os notados com o mesmo desligado).', 'Cabo: dano na integridade del isolamento, revelando a fiação interna.', 'Etiqueta de código CSG (quando aplicável): integridade.', 'Etiqueta de fabricação (quando aplicável): integridade.'] },
      { id: 'estabilizadores', title: '2.5 ESTABILIZADORES', num: '2.5', items: ['Funcionamento: botão power e LED.', 'Carcaça: integridade.', 'Orifícios de ventilação e dentro de baias: existência de objetos estranhos.', 'Cabos de energia (do próprio estabilizador e dos equipamentos a ele conectados, em ambas as extremidades): falha na integridade del isolamento, revelando a fiação interna.', 'Cabos de energia (do próprio estabilizador e dos equipamentos a ele conectados, em ambas as extremidades): encaixados por completo.'] },
      { id: 'bancadas', title: '2.6 BANCADAS',  num: '2.6', items: ['Integridade da parte superior: riscos, danos e descascados.', 'Integridade da parte inferior, laterais e sustentação ("pernas"): riscos, danos e descascados.', 'Integridade da identificação das bancadas (lab 04).', 'Limpeza na parte superior, inferior, laterais e sustentação ("pernas"): papéis de bala, adesivos, chicletes, rabiscos etc.'] },
      { id: 'cadeiras', title: '2.7 CADEIRAS',  num: '2.7', items: ['Assento, encosto e "pernas" da cadeira: integridade (rachaduras, danos etc.).', 'Limpeza: riscos, figurinhas, chicletes ou outras coisas no assento, no encosto ou embaixo da cadeira.'] },
      { id: 'arenas',   title: '2.8 ARENAS',    num: '2.8', items: ['Integridade da estrutura (danos, fixação das quinas etc).', 'Integridade da identificação.'] },
      { id: 'professor', title: '2.9 EQUIP. PROFESSOR', num: '2.9', items: ['Integridade do computador (conforme o caso: notebook, CPU, monitor, mouse, teclado, estabilizador e cabeamento).', 'Integridade da mesa.', 'Integridade da mesa de apoio (mesa branca com rodinhas).', 'Integridade da cadeira.', 'Integridade da banqueta de madeira.'] }
    ]},
    { id: 'encerramento', tab: '🔒 Encerramento', sections: [
      { id: 'apagar',     title: '3.1 APAGAR ARQUIVOS',  num: '3.1', items: ['Da área de trabalho.', 'Da pasta "Documentos".', 'Da pasta "Imagens".', 'Da pasta "Downloads".', 'Da Lixeira.'] },
      { id: 'papelparede', title: '3.2 PAPÉIS DE PAREDE', num: '3.2', items: ['Da área de trabalho.', 'Do navegador.'] },
      { id: 'finais',     title: '3.3 MOVIMENTOS FINAIS', num: '3.3', items: ['Desligar computadores.', 'Desligar estabilizadores (apenas após desligar os computadores).', 'Desligar disjuntores (apenas após desligar os estabilizadores).', 'Desconectar o notebook do professor da tomada (quando aplicável).', 'Passar pano na base para remover o pó do monitor, de sua base, da CPU, dos periféricos (mouse e teclado), dos estabilizadores e da superfície da bancada.', 'Se preciso, utilizar álcool ou pano embebido em água e sabão neutro para a remoção de sujidades em bancadas e equipamentos (incluindo os estabilizadores).', 'Alinhar os computadores entre si.', 'Ajustar o ângulo da tela dos monitores a 90°.', 'Posicionar cada mouse e teclado junto às respectivas CPUs e deixar os cabeamentos organizados.', 'Recostar as cadeiras nas bancadas, segundo a numeração de cada posição.', 'Colocar a banqueta junto à mesa do professor.', 'Alinhar as arenas que estão penduradas na parede (lab 04).', 'Apagar o quadro branco e a lousa (se a lousa estiver manchada, limpá-la com pano embebido em álcool).', 'Recolher papéis e outros objetos sobre a mesa do professor ou embaixo dela, encaminhando-os para a Secretaria.', 'Encaminhar objetos no suporte da lousa para a Secretaria (exceção: apagadores e marcadores de quadro branco no lab 01).', 'Fechar as janelas (obrigatório apenas nos labs 01 e 03).', 'Travar as janelas (obrigatório apenas no lab 03).', 'Desligar os ventiladores.', 'Apagar as luzes.', 'Trancar a porta.'] }
    ]}
  ]
};

const TYPE_LABELS = { nivel1: 'Revisão Parcial Nível I', nivel2: 'Revisão Parcial Nível II', completa: 'Revisão Completa' };
const TYPE_TAGS   = { nivel1: ['tag-nivel1', 'Nível I'], nivel2: ['tag-nivel2', 'Nível II'], completa: ['tag-completa', 'Completa'] };
const TYPE_BADGE  = { nivel1: ['badge-nivel1', 'Nível I'], nivel2: ['badge-nivel2', 'Nível II'], completa: ['badge-completa', 'Completa'], null: ['badge-none', 'Desligamento'] };
const TYPE_ACCENT = { nivel1: 'accent-nivel1', nivel2: 'accent-nivel2', completa: 'accent-completa' };

// ═══════════════════════════════════════════════
// ESTADO GERAL DA APLICAÇÃO
// ═══════════════════════════════════════════════
let currentSession = null;
let currentData = [];
let activeTab = 0;
let state = {};
let activeDayKey = getTodayKey() || 'seg';
let currentNav = 'home';

// Estado Galeria de Fotos
const LABS_LIST = ['LAB 01', 'LAB 02', 'LAB 03', 'LAB 04'];
let activeFotoLab = 'LAB 01';
let fotoModal = { lab: '', posto: '', tipo: 'frente', pendingBlob: null, driveFile: null };

// Estado Reporte TI
let rFotoB64 = null;

// ═══════════════════════════════════════════════
// NAVEGAÇÃO E SPA
// ═══════════════════════════════════════════════
function navTo(section) {
  currentNav = section;
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

  if (section === 'home') {
    document.getElementById('navChecklist').classList.add('active');
    showScreen('screen-home');
    document.getElementById('defeitoFab').style.display = 'none';
  } else if (section === 'fotos') {
    document.getElementById('navFotos').classList.add('active');
    showScreen('screen-fotos');
    document.getElementById('defeitoFab').style.display = 'none';
    initFotos();
  } else if (section === 'reporte') {
    document.getElementById('navReporte').classList.add('active');
    showScreen('screen-reporte');
    document.getElementById('defeitoFab').style.display = 'none';
  }
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo(0, 0);
}

function goHome() {
  document.getElementById('defeitoFab').style.display = 'none';
  showScreen('screen-home');
  renderSchedule();
}

function getTodayKey() {
  const map = { 1: 'seg', 2: 'ter', 3: 'qua', 4: 'qui', 5: 'sex' };
  return map[new Date().getDay()] || null;
}

function switchDay(key) { 
  activeDayKey = key; 
  renderDayTabs(); 
  renderSchedule(); 
}

// ═══════════════════════════════════════════════
// TOASTS E NOTIFICAÇÕES
// ═══════════════════════════════════════════════
function showToast(msg, type = 'info', duration = 2400) {
  const c = document.getElementById('toastContainer');
  if (!c) return;
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => {
    t.classList.add('out');
    setTimeout(() => t.remove(), 320);
  }, duration);
}

function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

function sendNotification(title, body) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, icon: '' });
  }
}

// ═══════════════════════════════════════════════
// LOGICA E RENDERS DO CHECKLIST
// ═══════════════════════════════════════════════
function initHome() {
  const now = new Date();
  const opts = { weekday: 'short', day: '2-digit', month: '2-digit' };
  const homeDateEl = document.getElementById('homeDate');
  if (homeDateEl) {
    homeDateEl.textContent = now.toLocaleDateString('pt-BR', opts).replace(',', '');
  }
  renderDayTabs();
  renderSchedule();
  requestNotificationPermission();
}

function renderDayTabs() {
  const todayKey = getTodayKey();
  const tabsContainer = document.getElementById('dayTabs');
  if (!tabsContainer) return;
  tabsContainer.innerHTML = DAYS.map(d => `
    <button class="day-tab${d.key === activeDayKey ? ' active' : ''}${d.key === todayKey ? ' today' : ''}"
      onclick="switchDay('${d.key}')">
      ${d.label}${d.key === todayKey ? ' ·' : ''}
    </button>`).join('');
}

function getSessionState(dayKey, cardIdx) {
  return _loadStateWithExpiry(`session_${dayKey}_${cardIdx}`);
}

function isCardDone(dayKey, cardIdx) {
  const card = SCHEDULE[dayKey][cardIdx];
  if (!card.type) return false;
  const saved = getSessionState(dayKey, cardIdx);
  const data = CHECKLISTS[card.type];
  let total = 0, done = 0;
  data.forEach((tab, ti) => tab.sections.forEach((sec, si) => sec.items.forEach((_, ii) => { 
    total++; 
    if (saved[`${ti}-${si}-${ii}`]) done++; 
  })));
  return total > 0 && done === total;
}

function renderSchedule() {
  const todayKey = getTodayKey();
  const cards = SCHEDULE[activeDayKey];
  const isToday = activeDayKey === todayKey;
  const dayObj = DAYS.find(d => d.key === activeDayKey);
  const container = document.getElementById('scheduleContent');
  if (!container) return;

  let html = `<div class="schedule-day-label">${dayObj.fullLabel}${isToday ? '<span class="today-badge">HOJE</span>' : ''}</div>`;

  cards.forEach((card, idx) => {
    const [bdgClass, bdgLabel] = TYPE_BADGE[card.type] || TYPE_BADGE[null];
    const accentClass = card.type ? TYPE_ACCENT[card.type] : 'accent-none';
    const hasChecklist = card.type !== null;
    const done = hasChecklist && isCardDone(activeDayKey, idx);

    let progressHTML = '';
    if (hasChecklist) {
      const saved = getSessionState(activeDayKey, idx);
      const data = CHECKLISTS[card.type];
      let total = 0, doneCount = 0;
      data.forEach((tab, ti) => tab.sections.forEach((sec, si) => sec.items.forEach((_, ii) => { 
        total++; 
        if (saved[`${ti}-${si}-${ii}`]) doneCount++; 
      })));
      const pct = total ? Math.round((doneCount / total) * 100) : 0;
      progressHTML = `<div class="lab-progress">
        <div class="lab-progress-bar"><div class="lab-progress-fill" style="width:${pct}%"></div></div>
        <span class="lab-progress-text">${doneCount}/${total}</span>
      </div>`;
    }

    const doneLabel = done ? `<span class="lab-type-badge badge-done">✓ Concluído</span>` : `<span class="lab-type-badge ${bdgClass}">${bdgLabel}</span>`;

    html += `<div class="lab-card${hasChecklist ? '' : ' no-checklist'}${done ? ' done-card' : ''}"
           onclick="${hasChecklist ? `openChecklist('${activeDayKey}',${idx})` : ''}">
      <div class="lab-card-accent ${done ? 'accent-completa' : accentClass}"></div>
      <div class="lab-card-inner">
        <div class="lab-card-row">
          <span class="lab-name">${card.lab}</span>
          ${doneLabel}
        </div>
        <div class="lab-time">${card.time}</div>
        ${card.note ? `<div class="lab-note">${card.note}</div>` : ''}
        ${progressHTML}
      </div>
      ${hasChecklist ? '<span class="lab-arrow">›</span>' : ''}
    </div>`;
  });

  container.innerHTML = html;
}

function openChecklist(dayKey, cardIdx) {
  const card = SCHEDULE[dayKey][cardIdx];
  currentSession = { dayKey, cardIdx, type: card.type, lab: card.lab };
  currentData = CHECKLISTS[card.type];

  const sKey = `session_${dayKey}_${cardIdx}`;
  state = _loadStateWithExpiry(sKey);

  currentData.forEach((tab, ti) => tab.sections.forEach((sec, si) => sec.items.forEach((_, ii) => {
    const id = `${ti}-${si}-${ii}`; 
    if (!(id in state)) state[id] = false;
  })));

  activeTab = 0;
  document.getElementById('clLabName').textContent = `${card.lab} · ${DAYS.find(d => d.key === dayKey).label}`;
  const [tagClass] = TYPE_TAGS[card.type];
  const tagEl = document.getElementById('clTypeTag');
  tagEl.className = `checklist-type-tag ${tagClass}`;
  tagEl.textContent = TYPE_LABELS[card.type];

  renderStepIndicator();
  renderTabs();
  renderContent();
  updateProgress();
  updateTabBadges();
  showScreen('screen-checklist');
  
  // Exibe o botão flutuante de defeitos
  document.getElementById('defeitoFab').style.display = 'flex';
  document.getElementById('defeitoSheetTitle').textContent = `⚠ Defeitos · ${card.lab}`;
  updateDefeitoFabBadge();
  _populateDefeitoPcSelect(card.lab);
}

function saveState() {
  if (!currentSession) return;
  const key = `session_${currentSession.dayKey}_${currentSession.cardIdx}`;
  try {
    const existing = _loadRaw(key);
    const timestamps = existing.timestamps || {};
    Object.keys(state).forEach(id => {
      if (state[id] && !timestamps[id]) timestamps[id] = Date.now();
      if (!state[id]) delete timestamps[id];
    });
    localStorage.setItem(key, JSON.stringify({ items: state, timestamps }));
  } catch (e) {
    console.error('Erro ao salvar estado:', e);
  }
}

function _loadRaw(key) {
  try { 
    const s = localStorage.getItem(key); 
    return s ? JSON.parse(s) : {}; 
  } catch (e) { 
    return {}; 
  }
}

function _loadStateWithExpiry(key) {
  const raw = _loadRaw(key);
  const items = raw.items || raw;
  const timestamps = raw.timestamps || {};
  const now = Date.now();
  const MS_24H = 24 * 60 * 60 * 1000;
  const result = {};
  Object.keys(items).forEach(id => {
    const ts = timestamps[id];
    if (items[id] && ts && (now - ts) >= MS_24H) {
      result[id] = false; // Expirou, reseta para pendente
    } else {
      result[id] = items[id];
    }
  });
  return result;
}

function totalItems() { return Object.keys(state).length; }
function doneItems()  { return Object.values(state).filter(Boolean).length; }

function renderStepIndicator() {
  const tabs = currentData;
  let html = '';
  tabs.forEach((tab, i) => {
    const isDone = isTabDone(i);
    const isActive = i === activeTab;
    html += `<div class="step-dot${isActive ? ' active' : ''}${isDone && !isActive ? ' completed' : ''}"></div>`;
  });
  html += `<span class="step-label">${activeTab + 1} de ${tabs.length}</span>`;
  document.getElementById('stepIndicator').innerHTML = html;
}

function isTabDone(ti) {
  return currentData[ti].sections.every((sec, si) =>
    sec.items.every((_, ii) => state[`${ti}-${si}-${ii}`])
  );
}

function updateProgress() {
  const total = totalItems(), done = doneItems();
  const pct = total ? Math.round((done / total) * 100) : 0;
  document.getElementById('progressBar').style.width = pct + '%';
  document.getElementById('progressText').textContent = `${done} / ${total} itens`;
  document.getElementById('progressPct').textContent = pct + '%';
  document.getElementById('statDone').textContent = done;
  document.getElementById('statPending').textContent = total - done;
  document.getElementById('completeBtn').disabled = false;
}

function updateSectionProgress(itemEl) {
  const body = itemEl.closest('.section-body');
  const header = body?.previousElementSibling;
  if (!header) return;
  const items = body.querySelectorAll('.item');
  const total = items.length;
  const done = body.querySelectorAll('.item.checked').length;
  const progEl = header.querySelector('.section-progress');
  if (progEl) { 
    progEl.textContent = `${done}/${total}`; 
    progEl.className = 'section-progress' + (done === total ? ' done' : ''); 
  }
  const numEl = header.querySelector('.section-num');
  if (numEl) { 
    numEl.className = 'section-num' + (done === total ? ' done' : ''); 
  }
  if (done === total) header.classList.add('sec-done'); else header.classList.remove('sec-done');
}

function updateTabBadges() {
  currentData.forEach((tab, ti) => {
    let total = 0, done = 0;
    tab.sections.forEach((sec, si) => sec.items.forEach((_, ii) => { 
      total++; 
      if (state[`${ti}-${si}-${ii}`]) done++; 
    }));
    const tabEl = document.querySelector(`.tab[data-tab="${ti}"]`);
    if (!tabEl) return;
    const badge = tabEl.querySelector('.badge');
    if (badge) badge.textContent = `${done}/${total}`;
    if (done === total) tabEl.classList.add('tab-done'); else tabEl.classList.remove('tab-done');
    const chk = tabEl.querySelector('.tab-check');
    if (chk) chk.textContent = done === total ? '✓ ' : '';
  });
  renderStepIndicator();
}

function renderTabs() {
  const container = document.getElementById('tabsContainer');
  if (!container) return;
  container.innerHTML = currentData.map((tab, i) => {
    let total = 0; 
    tab.sections.forEach(s => { total += s.items.length; });
    const done = isTabDone(i);
    return `<button class="tab${i === activeTab ? ' active' : ''}${done ? ' tab-done' : ''}" data-tab="${i}" onclick="switchTab(${i})">
      <span class="tab-check">${done ? '✓ ' : ''}</span>${tab.tab}
      <span class="badge">0/${total}</span>
    </button>`;
  }).join('');
  updateTabBadges();
}

function switchTab(idx) {
  activeTab = idx;
  document.querySelectorAll('.tab').forEach((t, i) => t.classList.toggle('active', i === idx));
  renderContent();
  renderStepIndicator();
}

function checkTabAutoAdvance() {
  if (!isTabDone(activeTab)) return;
  const nextIdx = activeTab + 1;
  if (nextIdx >= currentData.length) return; // Finalizou o checklist, deixa para o botão finalizar

  showToast(`✓ ${currentData[activeTab].tab} concluída!`, 'success', 2000);
  sendNotification('Lab Check ✓', `${currentData[activeTab].tab} finalizada! Próxima: ${currentData[nextIdx].tab}`);

  setTimeout(() => {
    switchTab(nextIdx);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    renderContent(true);
  }, 800);
}

function renderContent(showBanner = false) {
  const container = document.getElementById('content');
  if (!container) return;
  const tab = currentData[activeTab];

  let bannerHTML = '';
  if (showBanner) {
    bannerHTML = `<div class="tab-complete-banner visible">
      <h3>✓ Seção anterior concluída!</h3>
      <p>Agora: <strong>${currentData[activeTab].tab}</strong></p>
    </div>`;
  }

  const sectionsHTML = tab.sections.map((sec, si) => {
    const total = sec.items.length;
    let done = 0;
    sec.items.forEach((_, ii) => { if (state[`${activeTab}-${si}-${ii}`]) done++; });
    const allDone = done === total;
    const allChecked = allDone;

    const itemsHTML = sec.items.map((text, ii) => {
      const id = `${activeTab}-${si}-${ii}`;
      const checked = state[id];
      const letter = String.fromCharCode(97 + ii);
      return `<div class="item${checked ? ' checked' : ''}" id="el-${id}" onclick="handleItemClick('${id}',this)">
        <div class="checkbox"><span class="checkmark">✓</span></div>
        <span class="item-letter">${letter})</span>
        <span class="item-text">${text}</span>
      </div>`;
    }).join('');

    return `<div class="section">
      <div class="section-header${allDone ? ' sec-done' : ''}" onclick="toggleSection('body-${si}',this)">
        <span class="section-num${allDone ? ' done' : ''}">${sec.num}</span>
        <span class="section-title">${sec.title.replace(/^\d+\.\d+\s+/, '')}</span>
        <button class="mark-all-btn${allChecked ? ' all-done' : ''}" onclick="event.stopPropagation();markAll(${si},${!allChecked})" title="${allChecked ? 'Desmarcar todos' : 'Marcar todos'}">
          ${allChecked ? '✓ todos' : 'marcar ↓'}
        </button>
        <span class="section-progress${allDone ? ' done' : ''}">${done}/${total}</span>
        <span class="chevron">▼</span>
      </div>
      <div class="section-body" id="body-${si}">${itemsHTML}</div>
    </div>`;
  }).join('');

  container.innerHTML = bannerHTML + sectionsHTML;
}

function markAll(si, check) {
  const sec = currentData[activeTab].sections[si];
  sec.items.forEach((_, ii) => { state[`${activeTab}-${si}-${ii}`] = check; });
  saveState();
  renderContent();
  updateProgress();
  updateTabBadges();
  if (check) {
    showToast(`Seção marcada ✓`, 'success', 1600);
    setTimeout(checkTabAutoAdvance, 200);
  }
}

function handleItemClick(id, el) {
  const ripple = document.createElement('span');
  ripple.className = 'ripple';
  const rect = el.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  ripple.style.cssText = `width:${size}px;height:${size}px;top:${rect.height / 2 - size / 2}px;left:${rect.width / 2 - size / 2}px`;
  el.appendChild(ripple);
  setTimeout(() => ripple.remove(), 500);

  state[id] = !state[id];
  saveState();
  if (state[id]) el.classList.add('checked'); else el.classList.remove('checked');
  updateProgress();
  updateSectionProgress(el);
  updateTabBadges();

  const si = parseInt(id.split('-')[1]);
  const sec = currentData[activeTab].sections[si];
  const total = sec.items.length;
  const done = sec.items.filter((_, ii) => state[`${activeTab}-${si}-${ii}`]).length;
  const header = document.getElementById(`body-${si}`)?.previousElementSibling;
  if (header) {
    const btn = header.querySelector('.mark-all-btn');
    if (btn) {
      const allDone = done === total;
      btn.className = `mark-all-btn${allDone ? ' all-done' : ''}`;
      btn.textContent = allDone ? '✓ todos' : 'marcar ↓';
    }
  }

  if (state[id]) checkTabAutoAdvance();
}

function toggleSection(bodyId, header) {
  document.getElementById(bodyId).classList.toggle('hidden');
  header.classList.toggle('collapsed');
}

function resetChecklist() {
  if (!confirm('Limpar todos os itens marcados nessa sessão?')) return;
  Object.keys(state).forEach(k => state[k] = false);
  saveState();
  activeTab = 0;
  renderTabs();
  renderContent();
  updateProgress();
  updateTabBadges();
}

// ── MODAL FINALIZAR ──
function buildReport() {
  const total = totalItems(), done = doneItems();
  const pending = [];
  currentData.forEach((tab, ti) => tab.sections.forEach((sec, si) => sec.items.forEach((text, ii) => {
    if (!state[`${ti}-${si}-${ii}`]) pending.push({ label: sec.num, text });
  })));
  return { total, done, pending };
}

function openModal() {
  const { total, done, pending } = buildReport();
  const allDone = pending.length === 0;

  document.getElementById('modalEmoji').textContent = allDone ? '🎉' : '⚠️';
  document.getElementById('modalTitle').textContent = allDone ? 'Checklist completo!' : `${pending.length} item${pending.length > 1 ? 's' : ''} pendente${pending.length > 1 ? 's' : ''}`;
  document.getElementById('modalDesc').textContent  = allDone
    ? `Todos os ${total} itens verificados. O laboratório está em ordem.`
    : `${done} de ${total} itens marcados. Itens faltando:`;

  document.getElementById('pendingListContainer').innerHTML = !allDone ? `
    <div class="pending-list">
      <p>Pendentes</p>
      ${pending.map(p => `<div class="pending-item"><span class="section-tag">${p.label}</span>${p.text}</div>`).join('')}
    </div>` : '';

  document.getElementById('modalSecBtn').textContent = allDone ? 'Reiniciar checklist' : 'Reiniciar tudo';
  document.getElementById('modalOverlay').classList.add('open');

  if (allDone) {
    sendNotification('🎉 Lab Check completo!', `${currentSession.lab} — todos os ${total} itens verificados.`);
  }
}

function closeModal() { document.getElementById('modalOverlay').classList.remove('open'); }
function closeModalOutside(e) { if (e.target === document.getElementById('modalOverlay')) closeModal(); }

function shareWhatsApp() {
  const { total, done, pending } = buildReport();
  const { lab, dayKey } = currentSession;
  const day = DAYS.find(d => d.key === dayKey).fullLabel;
  const tipo = TYPE_LABELS[currentSession.type];

  // Dispara a trigger no whatsapp.js
  WA.compartilharChecklist({
    lab,
    dia: day,
    tipo,
    done,
    total,
    pendentes: pending.map(p => ({ label: p.label, texto: p.text }))
  });
}

// ═══════════════════════════════════════════════
// CONTROLE DE DEFEITOS (LOCALSTORAGE)
// ═══════════════════════════════════════════════
function _defeitoStorageKey() {
  if (!currentSession) return 'defeitos_unknown';
  return `defeitos_${currentSession.dayKey}_${currentSession.cardIdx}_${currentSession.lab.replace(/\s/g, '')}`;
}

function carregarDefeitos() {
  try {
    const raw = localStorage.getItem(_defeitoStorageKey());
    return raw ? JSON.parse(raw) : [];
  } catch (e) { return []; }
}

function salvarDefeito() {
  const pc = document.getElementById('defeitoPcSelect').value;
  const desc = document.getElementById('defeitoDescInput').value.trim();
  const preview = document.getElementById('defeitoFilePreview');
  const fotoBase64 = (preview.style.display !== 'none') ? preview.src : null;

  if (!desc) { showToast('Descreva o defeito antes de registrar.', 'info'); return; }

  const defeito = {
    id: Date.now(),
    lab: currentSession.lab,
    dayKey: currentSession.dayKey,
    pc: pc || 'Não especificado',
    descricao: desc,
    fotoBase64,
    status: 'pendente',
    criadoEm: new Date().toISOString()
  };

  const lista = carregarDefeitos();
  lista.unshift(defeito);
  try { localStorage.setItem(_defeitoStorageKey(), JSON.stringify(lista)); } catch (e) {}

  document.getElementById('defeitoDescInput').value = '';
  document.getElementById('defeitoPcSelect').value = '';
  document.getElementById('defeitoFileInput').value = '';
  document.getElementById('defeitoFilePreview').style.display = 'none';
  document.getElementById('defeitoFileLabel').textContent = '📷 Toque para tirar foto ou selecionar';

  showToast('Defeito registrado ✓', 'success');
  renderDefeitos();
  updateDefeitoFabBadge();
}

function renderDefeitos() {
  const lista = carregarDefeitos();
  const container = document.getElementById('defeitoListContainer');
  if (!container) return;
  
  document.getElementById('defeitoListCount').textContent = lista.length;

  if (lista.length === 0) {
    container.innerHTML = '<div class="defeito-empty">Nenhum defeito registrado ainda.</div>';
    return;
  }

  container.innerHTML = lista.map(d => {
    const data = new Date(d.criadoEm).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    const imgHTML = d.fotoBase64 ? `<img class="defeito-card-img" src="${d.fotoBase64}" alt="foto do defeito">` : '';
    const statusClass = d.status === 'consertado' ? 'consertado' : 'pendente';
    const statusLabel = d.status === 'consertado' ? '✓ Consertado' : '⏳ Pendente';
    return `<div class="defeito-card" id="defeito-${d.id}">
      <div class="defeito-card-head">
        <div class="defeito-card-meta">
          <span class="defeito-card-pc">📍 ${d.pc}</span>
          <span class="defeito-card-date">${data}</span>
        </div>
        <span class="defeito-status-badge ${statusClass}"
              onclick="toggleDefeitoStatus(${d.id})"
              title="Clique para alternar status">${statusLabel}</span>
      </div>
      ${imgHTML}
      <div class="defeito-card-desc">${d.descricao}</div>
      <button class="defeito-delete-btn" onclick="deletarDefeito(${d.id})" title="Remover defeito">✕</button>
    </div>`;
  }).join('');
}

function toggleDefeitoStatus(id) {
  const lista = carregarDefeitos();
  const idx = lista.findIndex(d => d.id === id);
  if (idx === -1) return;
  lista[idx].status = lista[idx].status === 'consertado' ? 'pendente' : 'consertado';
  try { localStorage.setItem(_defeitoStorageKey(), JSON.stringify(lista)); } catch (e) {}
  renderDefeitos();
  updateDefeitoFabBadge();
}

function deletarDefeito(id) {
  if (!confirm('Remover este defeito?')) return;
  const lista = carregarDefeitos().filter(d => d.id !== id);
  try { localStorage.setItem(_defeitoStorageKey(), JSON.stringify(lista)); } catch (e) {}
  renderDefeitos();
  updateDefeitoFabBadge();
  showToast('Defeito removido.', 'info', 1800);
}

function updateDefeitoFabBadge() {
  const lista = carregarDefeitos();
  const pendentes = lista.filter(d => d.status === 'pendente').length;
  const badge = document.getElementById('defeitoFabBadge');
  if (badge) {
    badge.style.display = pendentes > 0 ? 'flex' : 'none';
    badge.textContent = pendentes;
  }
}

function openDefeitoModal() {
  renderDefeitos();
  document.getElementById('defeitoOverlay').classList.add('open');
}

function closeDefeitoModal() { document.getElementById('defeitoOverlay').classList.remove('open'); }
function closeDefeitoOutside(e) { if (e.target === document.getElementById('defeitoOverlay')) closeDefeitoModal(); }

function handleDefeitoPhoto(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    const preview = document.getElementById('defeitoFilePreview');
    preview.src = ev.target.result;
    preview.style.display = 'block';
    document.getElementById('defeitoFileLabel').textContent = '✓ Foto selecionada';
  };
  reader.readAsDataURL(file);
}

function _populateDefeitoPcSelect(labName) {
  const sel = document.getElementById('defeitoPcSelect');
  if (!sel) return;
  const options = ['— Selecione o PC ou local —'];
  
  if (labName === 'LAB 04') {
    // LAB 04 usa designações de A1 a D3
    const arenas = ['A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3', 'D1', 'D2', 'D3'];
    arenas.forEach(a => options.push(`PC ${a}`));
  } else {
    // LAB 01, 02, 03 usam 1 a 20 (ou 41)
    for (let i = 1; i <= 20; i++) options.push(`PC ${String(i).padStart(2, '0')}`);
  }
  options.push('Mesa do professor', 'Quadro branco / Lousa', 'Janela / Ventilador', 'Porta', 'Outro');
  sel.innerHTML = options.map((o, i) => `<option value="${i === 0 ? '' : o}">${o}</option>`).join('');
}

// ═══════════════════════════════════════════════
// CONTROLE DE FOTOS & GOOGLE DRIVE (OTIMIZADO)
// ═══════════════════════════════════════════════
function initFotos() {
  // Executa callback se houver token na URL
  if (window.location.hash.includes('access_token')) {
    Auth.processarTokenCallback();
  }

  renderFotosLabTabs();

  const tokenInfo = document.getElementById('driveTokenInfo');
  if (Auth.driveAutenticado()) {
    tokenInfo.style.display = 'flex';
    document.getElementById('driveMinLeft').textContent = Auth.minutosRestantes();
    renderGaleriaDrive(activeFotoLab);
  } else {
    tokenInfo.style.display = 'none';
    renderConectarDrive();
  }
  updateFotosBadge();
}

function renderFotosLabTabs() {
  const container = document.getElementById('fotosLabTabs');
  if (!container) return;
  container.innerHTML = LABS_LIST.map(l =>
    `<button class="fotos-lab-tab${l === activeFotoLab ? ' active' : ''}" onclick="switchFotoLab('${l}')">${l}</button>`
  ).join('');
}

function switchFotoLab(lab) {
  activeFotoLab = lab;
  renderFotosLabTabs();
  Auth.driveAutenticado() ? renderGaleriaDrive(lab) : renderConectarDrive();
}

function renderConectarDrive() {
  const container = document.getElementById('fotosContent');
  if (!container) return;
  container.innerHTML = `
    <div class="drive-connect-wrap">
      <span class="drive-connect-icon">📂</span>
      <div class="drive-connect-title">Conectar ao Google Drive</div>
      <div class="drive-connect-sub">As fotos de referência ficam salvas na conta operacional.<br>Conecte para visualizar e atualizar.</div>
      <button class="drive-connect-btn" onclick="driveLogin()">Conectar Drive</button>
    </div>`;
}

// Renderiza a galeria em lote com chamada única (Otimizado)
async function renderGaleriaDrive(lab) {
  const container = document.getElementById('fotosContent');
  if (!container) return;
  
  container.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;padding:40px;gap:12px;color:var(--text3)"><span class="spinner" style="width:22px;height:22px;border-width:2.5px"></span> Carregando fotos...</div>`;

  try {
    const arquivos = await Drive.listarTodasFotos(lab);
    const { postos, extras } = Drive.organizarFotosLab(lab, arquivos);
    
    // Armazena no cache local
    window.__fotosCarregadas = { postos, extras };

    let html = '';

    if (lab === 'LAB 04') {
      const designacoesPadrao = ['A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3', 'D1', 'D2', 'D3'];
      const todasDesignacoes = Array.from(new Set([...designacoesPadrao, ...Object.keys(postos)]));
      todasDesignacoes.sort((a, b) => a.localeCompare(b, 'pt-BR', { numeric: true, sensitivity: 'base' }));

      const comFoto = todasDesignacoes.filter(d => postos[d]?.frente || postos[d]?.detalhe).length;

      html += `<div class="fotos-section-label">Postos · ${lab}<span class="fotos-count">${comFoto}/${todasDesignacoes.length} com foto</span></div>`;
      html += `<div class="posto-grid">`;

      todasDesignacoes.forEach(d => {
        const fF = postos[d]?.frente;
        const fD = postos[d]?.detalhe;
        const pri = fF || fD;
        const hasFoto = !!pri;
        const thumb = pri?.thumbnailLink?.replace('=s220', '=s400') || '';
        const dataStr = hasFoto ? new Date(pri.modifiedTime).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }) : 'Sem foto';

        html += `<div class="posto-card${hasFoto ? ' has-foto' : ''}" onclick="openFotoModal('${lab}','${d}')">
          ${hasFoto ? `<img class="posto-thumb" src="${thumb}" loading="lazy" alt="Posto ${d}">` : `<div class="posto-thumb-empty"><span class="posto-thumb-icon">📷</span><span class="posto-thumb-txt">Sem foto</span></div>`}
          ${hasFoto ? '<div class="posto-dot"></div>' : ''}
          <div class="posto-label">
            <span class="posto-num">Posto ${d}</span>
            <span class="posto-date">${pri ? pri.name : dataStr}</span>
          </div>
        </div>`;
      });
      html += '</div>';
    } else {
      let comFoto = 0;
      for (let p = 1; p <= 41; p++) {
        if (postos[p]?.frente || postos[p]?.detalhe) comFoto++;
      }

      html += `<div class="fotos-section-label">Postos · ${lab}<span class="fotos-count">${comFoto}/41 com foto</span></div>`;
      html += `<div class="posto-grid">`;

      for (let p = 1; p <= 41; p++) {
        const fF = postos[p]?.frente;
        const fD = postos[p]?.detalhe;
        const pri = fF || fD;
        const hasFoto = !!pri;
        const thumb = pri?.thumbnailLink?.replace('=s220', '=s400') || '';
        const dataStr = hasFoto ? new Date(pri.modifiedTime).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }) : 'Sem foto';

        html += `<div class="posto-card${hasFoto ? ' has-foto' : ''}" onclick="openFotoModal('${lab}',${p})">
          ${hasFoto ? `<img class="posto-thumb" src="${thumb}" loading="lazy" alt="Posto ${p}">` : `<div class="posto-thumb-empty"><span class="posto-thumb-icon">📷</span><span class="posto-thumb-txt">Sem foto</span></div>`}
          ${hasFoto ? '<div class="posto-dot"></div>' : ''}
          <div class="posto-label">
            <span class="posto-num">Posto ${String(p).padStart(2, '0')}</span>
            <span class="posto-date">${pri ? pri.name : dataStr}</span>
          </div>
        </div>`;
      }
      html += '</div>';
    }

    // Renderiza itens extras na listagem para dar visibilidade total do drive
    if (extras.length > 0) {
      html += `<div class="fotos-section-label" style="margin-top:20px">Outros itens / Fotos adicionais <span class="fotos-count">${extras.length} arquivos</span></div>`;
      html += `<div class="posto-grid">`;

      extras.forEach(e => {
        const thumb = e.thumbnailLink?.replace('=s220', '=s400') || '';
        const dateStr = new Date(e.modifiedTime).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });

        html += `<div class="posto-card has-foto" onclick="openFotoModal('${lab}','${e.name.replace(/\.[^.]+$/, '')}')">
          <img class="posto-thumb" src="${thumb}" loading="lazy" alt="${e.name}">
          <div class="posto-label">
            <span class="posto-num">${e.name.replace(/\.[^.]+$/, '')}</span>
            <span class="posto-date">${dateStr}</span>
          </div>
        </div>`;
      });
      html += '</div>';
    }

    container.innerHTML = html;
  } catch (err) {
    console.error(err);
    container.innerHTML = `
      <div class="drive-connect-wrap">
        <span class="drive-connect-icon">⚠️</span>
        <div class="drive-connect-title">Erro ao carregar fotos</div>
        <div class="drive-connect-sub">${err.message}</div>
        <button class="drive-connect-btn" onclick="initFotos()">Tentar novamente</button>
      </div>`;
  }
}

function updateFotosBadge() {
  let count = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith('foto_')) count++;
  }
  const badge = document.getElementById('fotosBadge');
  if (badge) {
    if (count > 0) { badge.style.display = 'flex'; badge.textContent = count; }
    else badge.style.display = 'none';
  }
}

// ── Modal de foto ──
function openFotoModal(lab, posto) {
  fotoModal = { lab, posto: String(posto), tipo: 'frente', pendingBlob: null, driveFile: null };
  document.getElementById('fotoModalTitle').textContent = isNaN(posto) ? `Posto ${posto}` : `Posto ${String(posto).padStart(2, '0')}`;
  document.getElementById('fotoModalSub').textContent   = `${lab} · Selecione o tipo`;
  switchFotoTab('frente');
  document.getElementById('fotoModalOverlay').classList.add('open');
}

function closeFotoModal() {
  document.getElementById('fotoModalOverlay').classList.remove('open');
  fotoModal.pendingBlob = null;
  if (Auth.driveAutenticado()) renderGaleriaDrive(activeFotoLab);
}

function closeFotoModalOutside(e) { if (e.target === document.getElementById('fotoModalOverlay')) closeFotoModal(); }

function switchFotoTab(tipo) {
  fotoModal.tipo = tipo;
  fotoModal.pendingBlob = null;
  fotoModal.driveFile = null;
  document.getElementById('fotoTabFrente').classList.toggle('active',  tipo === 'frente');
  document.getElementById('fotoTabDetalhe').classList.toggle('active', tipo === 'detalhe');
  document.getElementById('fotoUploadInput').value = '';
  _renderFotoPreview();
}

async function _renderFotoPreview() {
  const { lab, posto, tipo } = fotoModal;
  const img     = document.getElementById('fotoPreviewImg');
  const empty   = document.getElementById('fotoEmptyArea');
  const saveBtn = document.getElementById('fotoSaveBtn');
  const delBtn  = document.getElementById('fotoDeleteBtn');

  if (fotoModal.pendingBlob) {
    img.src = URL.createObjectURL(fotoModal.pendingBlob);
    img.style.display = 'block'; empty.style.display = 'none';
    saveBtn.disabled = false;
    delBtn.style.display = 'none';
    return;
  }

  if (Auth.driveAutenticado()) {
    // Tenta carregar o arquivo a partir do cache para velocidade instantânea
    let arquivo = null;
    if (window.__fotosCarregadas) {
      if (window.__fotosCarregadas.postos[posto]) {
        arquivo = window.__fotosCarregadas.postos[posto][tipo];
      } else {
        arquivo = window.__fotosCarregadas.extras.find(e => e.name.replace(/\.[^.]+$/, '') === posto);
      }
    }

    if (!arquivo) {
      document.getElementById('fotoLoadingOverlay').classList.add('active');
      arquivo = await Drive.buscarFotoPosto(lab, posto, tipo).catch(() => null);
      document.getElementById('fotoLoadingOverlay').classList.remove('active');
    }

    fotoModal.driveFile = arquivo;
    if (arquivo?.thumbnailLink) {
      img.src = arquivo.thumbnailLink.replace('=s220', '=s800');
      img.style.display = 'block'; empty.style.display = 'none';
      saveBtn.disabled = true;
      delBtn.style.display = 'block';
    } else {
      img.style.display = 'none'; empty.style.display = 'flex';
      saveBtn.disabled = true; delBtn.style.display = 'none';
    }
  } else {
    const saved = _getFotoLocal(lab, posto, tipo);
    if (saved) {
      img.src = saved.b64; img.style.display = 'block'; empty.style.display = 'none';
      saveBtn.disabled = true; delBtn.style.display = 'block';
    } else {
      img.style.display = 'none'; empty.style.display = 'flex';
      saveBtn.disabled = true; delBtn.style.display = 'none';
    }
  }
}

function handleFotoUpload(e) {
  const file = e.target.files[0]; 
  if (!file) return;
  fotoModal.pendingBlob = file;
  _renderFotoPreview();
}

async function salvarFoto() {
  if (!fotoModal.pendingBlob) return;
  const { lab, posto, tipo, pendingBlob } = fotoModal;

  if (Auth.driveAutenticado()) {
    document.getElementById('fotoLoadingOverlay').classList.add('active');
    document.getElementById('fotoSaveBtn').disabled = true;
    try {
      await Drive.substituirFotoPosto(lab, posto, tipo, pendingBlob);
      showToast('Foto salva no Drive ✓', 'success');
      fotoModal.pendingBlob = null;
      window.__fotosCarregadas = null; // Reseta cache
      await _renderFotoPreview();
    } catch (err) {
      showToast('Erro ao salvar no Drive. Salvando localmente.', 'info');
      _salvarFotoLocal(lab, posto, tipo, pendingBlob);
    }
    document.getElementById('fotoLoadingOverlay').classList.remove('active');
  } else {
    _salvarFotoLocal(lab, posto, tipo, pendingBlob);
  }
  updateFotosBadge();
}

async function deletarFoto() {
  const { lab, posto, tipo, driveFile } = fotoModal;
  if (!confirm('Remover esta foto?')) return;
  if (Auth.driveAutenticado() && driveFile) {
    document.getElementById('fotoLoadingOverlay').classList.add('active');
    await Drive.deletarArquivoDrive(driveFile.id).catch(() => {});
    document.getElementById('fotoLoadingOverlay').classList.remove('active');
    showToast('Foto removida do Drive.', 'info', 1800);
    window.__fotosCarregadas = null; // Reseta cache
  } else {
    _deletarFotoLocal(lab, posto, tipo);
  }
  fotoModal.driveFile = null;
  await _renderFotoPreview();
  updateFotosBadge();
}

// Fallback local das fotos
function _fotoLocalKey(lab, posto, tipo) { return `foto_${lab.replace(/\s/g, '')}_p${posto}_${tipo}`; }
function _getFotoLocal(lab, posto, tipo) { try { const r = localStorage.getItem(_fotoLocalKey(lab, posto, tipo)); return r ? JSON.parse(r) : null; } catch (e) { return null; } }
function _salvarFotoLocal(lab, posto, tipo, blob) {
  const reader = new FileReader();
  reader.onload = ev => {
    try { 
      localStorage.setItem(_fotoLocalKey(lab, posto, tipo), JSON.stringify({ b64: ev.target.result, savedAt: new Date().toISOString() })); 
    } catch (e) { 
      showToast('Armazenamento cheio.', 'error'); 
      return; 
    }
    showToast('Foto salva localmente ✓', 'success');
    fotoModal.pendingBlob = null;
    _renderFotoPreview();
    updateFotosBadge();
  };
  reader.readAsDataURL(blob);
}
function _deletarFotoLocal(lab, posto, tipo) { 
  localStorage.removeItem(_fotoLocalKey(lab, posto, tipo)); 
  showToast('Foto removida.', 'info', 1800); 
}

// ═══════════════════════════════════════════════
// REPORTE DE TI - ENVIO DE FORMULÁRIO
// ═══════════════════════════════════════════════
function handleRFoto(e) {
  const file = e.target.files[0]; 
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    rFotoB64 = ev.target.result;
    const p = document.getElementById('rPreview');
    p.src = rFotoB64; p.style.display = 'block';
    document.getElementById('rFotoLabel').textContent = '✓ Foto selecionada';
  };
  reader.readAsDataURL(file);
}

async function submitReporte() {
  const lab  = document.getElementById('rLab').value;
  const pc   = document.getElementById('rPc').value;
  const tipo = document.getElementById('rTipo').value;
  const desc = document.getElementById('rDesc').value.trim();

  if (!lab)  { showToast('Selecione um laboratório', 'info'); return; }
  if (!pc || parseInt(pc) < 1 || parseInt(pc) > 41) { showToast('PC deve ser entre 1 e 41', 'info'); return; }
  if (!tipo) { showToast('Selecione o tipo de problema', 'info'); return; }
  if (!desc) { showToast('Descreva o problema', 'info'); return; }

  const temFoto = !!rFotoB64;

  // Se houver script cadastrado e foto, envia para o Apps Script
  if (CONFIG.WEB_APP_URL && rFotoB64) {
    document.getElementById('rLoading').classList.add('active');
    document.getElementById('rSubmitBtn').disabled = true;
    try {
      const r = await fetch(CONFIG.WEB_APP_URL, { 
        method: 'POST', 
        body: JSON.stringify({ laboratorio: lab, pc, componente: tipo, descricao: desc, foto: rFotoB64 }) 
      });
      const d = await r.json();
      document.getElementById('rLoading').classList.remove('active');
      if (d.success) {
        showToast('Reporte enviado ✓', 'success');
        _limparFormReporte();
        if (d.linkWhatsApp) setTimeout(() => window.open(d.linkWhatsApp, '_blank'), 1200);
        document.getElementById('rSubmitBtn').disabled = false;
        return;
      }
    } catch (e) {
      console.warn('Erro Apps Script:', e);
    }
    document.getElementById('rLoading').classList.remove('active');
    document.getElementById('rSubmitBtn').disabled = false;
  }

  // Fallback: Abre o WhatsApp
  WA.enviarReporteTI({
    laboratorio: lab,
    pc,
    componente: tipo,
    descricao: desc
  });
  
  if (temFoto) showToast('WhatsApp aberto · envie a foto em seguida 📎', 'success', 3500);
  else showToast('Abrindo WhatsApp...', 'success');
  _limparFormReporte();
}

function _limparFormReporte() {
  ['rLab', 'rPc', 'rTipo', 'rDesc'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('rPreview').style.display = 'none';
  document.getElementById('rFotoLabel').textContent = '📷 Toque para tirar foto ou selecionar';
  rFotoB64 = null;
}

function driveLogin() {
  Auth.driveLogin(() => {
    showToast('Drive conectado ✓', 'success');
    initFotos();
  });
}

function driveLogout() {
  Auth.driveLogout();
  showToast('Drive desconectado.', 'info');
  initFotos();
}

// ═══════════════════════════════════════════════
// EXPOSIÇÃO DAS FUNÇÕES PARA O CONTEXTO GLOBAL (HTML WINDOW)
// ═══════════════════════════════════════════════
if (typeof window !== 'undefined') {
  window.navTo = navTo;
  window.goHome = goHome;
  window.switchDay = switchDay;
  window.openChecklist = openChecklist;
  window.resetChecklist = resetChecklist;
  window.openModal = openModal;
  window.closeModal = closeModal;
  window.closeModalOutside = closeModalOutside;
  window.shareWhatsApp = shareWhatsApp;
  window.toggleSection = toggleSection;
  window.markAll = markAll;
  window.handleItemClick = handleItemClick;
  window.switchTab = switchTab;

  window.openDefeitoModal = openDefeitoModal;
  window.closeDefeitoModal = closeDefeitoModal;
  window.closeDefeitoOutside = closeDefeitoOutside;
  window.handleDefeitoPhoto = handleDefeitoPhoto;
  window.salvarDefeito = salvarDefeito;
  window.toggleDefeitoStatus = toggleDefeitoStatus;
  window.deletarDefeito = deletarDefeito;

  window.driveLogin = driveLogin;
  window.driveLogout = driveLogout;

  window.initFotos = initFotos;
  window.switchFotoLab = switchFotoLab;
  window.openFotoModal = openFotoModal;
  window.closeFotoModal = closeFotoModal;
  window.closeFotoModalOutside = closeFotoModalOutside;
  window.switchFotoTab = switchFotoTab;
  window.handleFotoUpload = handleFotoUpload;
  window.salvarFoto = salvarFoto;
  window.deletarFoto = deletarFoto;

  window.handleRFoto = handleRFoto;
  window.submitReporte = submitReporte;
  
  // Inicialização no carregamento da página
  window.addEventListener('load', () => {
    initHome();
    
    // Service Worker Registration
    if ('serviceWorker' in navigator && window.location.protocol !== 'file:') {
      navigator.serviceWorker.register('./sw.js')
        .catch(e => console.warn('SW:', e));
    }

    // Processa token legado no hash da URL se houver
    if (window.location.hash.includes('access_token')) {
      if (Auth.processarTokenCallback()) {
        navTo('fotos');
      }
    }
  });
}
