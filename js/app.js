/**
 * CSE LAB SYSTEM - CORE JS
 * Engenharia Front-end Sênior
 */

const CONFIG = {
    CLIENT_ID: 'SEU_CLIENT_ID_AQUI.apps.googleusercontent.com',
    SCOPES: 'https://www.googleapis.com/auth/drive.readonly',
    PASTAS: {
        'LAB 01': 'ID_DA_PASTA_LAB01',
        'LAB 02': 'ID_DA_PASTA_LAB02',
        'LAB 03': 'ID_DA_PASTA_LAB03',
        'LAB 04': 'ID_DA_PASTA_LAB04'
    },
    WHATSAPP_TI: '5519900000000'
};

let GOOGLE_TOKEN = null;
let currentLabPhotos = new Map();

// --- 1. MOTOR DE AUTENTICAÇÃO (OAUTH CORRIGIDO) ---

function initAuth() {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const token = params.get('access_token');

    if (token) {
        GOOGLE_TOKEN = token;
        localStorage.setItem('cse_access_token', token);
        // Limpeza de URL - Essencial para não quebrar o estado da PWA
        window.history.replaceState(null, null, window.location.pathname);
        showToast("Conectado ao Google Drive", "success");
    } else {
        GOOGLE_TOKEN = localStorage.getItem('cse_access_token');
    }
}

function loginDrive() {
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CONFIG.CLIENT_ID}&redirect_uri=${encodeURIComponent(window.location.origin + window.location.pathname)}&response_type=token&scope=${encodeURIComponent(CONFIG.SCOPES)}`;
    window.location.href = url;
}

// --- 2. DRIVE API OTIMIZADA (UMA REQUISIÇÃO APENAS) ---

async function fetchAllLabPhotos(labName) {
    if (!GOOGLE_TOKEN) return;

    const folderId = CONFIG.PASTAS[labName];
    document.getElementById('mainLoading').classList.add('active');

    try {
        // q: busca arquivos na pasta que não estejam na lixeira
        const q = `'${folderId}' in parents and trashed = false`;
        const fields = "files(id, name, thumbnailLink, webViewLink)";
        
        const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=${encodeURIComponent(fields)}&pageSize=100`, {
            headers: { 'Authorization': `Bearer ${GOOGLE_TOKEN}` }
        });

        if (response.status === 401) {
            loginDrive(); // Token expirou
            return;
        }

        const data = await response.json();
        
        // Mapeia arquivos em memória para busca instantânea
        currentLabPhotos.clear();
        data.files.forEach(file => {
            // Assume padrão de nome: posto_01.jpg
            const match = file.name.match(/\d+/);
            if (match) {
                currentLabPhotos.set(parseInt(match[0]), {
                    thumb: file.thumbnailLink,
                    link: file.webViewLink
                });
            }
        });

        renderPhotoGrid(labName);
    } catch (err) {
        showToast("Erro ao carregar Drive", "error");
    } finally {
        document.getElementById('mainLoading').classList.remove('active');
    }
}

// --- 3. RENDERIZAÇÃO DASHBOARD ---

function renderPhotoGrid(labName) {
    const container = document.getElementById('fotosContent');
    let html = `<div class="fotos-section-label">Postos ${labName} <span class="fotos-count">${currentLabPhotos.size}/41 fotos</span></div>`;
    html += `<div class="posto-grid">`;

    for (let i = 1; i <= 41; i++) {
        const photo = currentLabPhotos.get(i);
        html += `
            <div class="posto-card ${photo ? 'has-foto' : ''}" onclick="${photo ? `window.open('${photo.link}', '_blank')` : ''}">
                ${photo ? 
                    `<img src="${photo.thumb.replace('=s220', '=s400')}" class="posto-thumb">` : 
                    `<div class="posto-thumb-empty"><span class="posto-thumb-icon">📷</span></div>`
                }
                <div class="posto-label">
                    <span class="posto-num">Posto ${i.toString().padStart(2, '0')}</span>
                </div>
            </div>
        `;
    }
    html += `</div>`;
    container.innerHTML = html;
}

// --- 4. NAVEGAÇÃO SPA ---

function navTo(screen) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById(`screen-${screen}`).classList.add('active');
    // Adiciona classe active no botão correto
    const btn = document.querySelector(`.nav-btn[onclick="navTo('${screen}')"]`);
    if(btn) btn.classList.add('active');

    if (screen === 'fotos') {
        if (!GOOGLE_TOKEN) {
            renderDriveConnectPrompt();
        } else {
            fetchAllLabPhotos('LAB 01'); // Carrega padrão
        }
    }
}

function renderDriveConnectPrompt() {
    document.getElementById('fotosContent').innerHTML = `
        <div class="drive-connect-wrap">
            <div class="drive-connect-icon">📂</div>
            <div class="drive-connect-title">Drive Desconectado</div>
            <p class="drive-connect-sub">Conecte sua conta Google para visualizar as fotos dos postos.</p>
            <button class="btn btn-primary" onclick="loginDrive()">Conectar Google Drive</button>
        </div>
    `;
}

// --- INICIALIZAÇÃO ---
window.onload = () => {
    initAuth();
    // Aqui você incluiria a lógica de renderizar o cronograma inicial
};

function showToast(msg, type) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerText = msg;
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('out');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}