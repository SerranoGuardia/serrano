# CSE Lab System

PWA para gestão de laboratórios de informática — checklist, fotos de postos e reporte de defeitos.

## Estrutura

```
cse-lab-system/
├── index.html          ← app principal (renomear super-app-lab.html)
├── manifest.json       ← PWA
├── sw.js               ← Service Worker
├── icons/
│   ├── icon-192.png    ← gerar no Canva (192×192)
│   └── icon-512.png    ← gerar no Canva (512×512)
└── js/
    ├── config.js       ← ⚠️ PREENCHER antes de usar
    ├── auth.js         ← OAuth 2.0
    ├── drive.js        ← Google Drive API v3
    └── whatsapp.js     ← links wa.me
```

## Setup rápido

### 1. Preencher config.js
```js
CLIENT_ID:    '<ID do Google Cloud Console — Conta A>'
REDIRECT_URI: 'https://<seu-usuario>.github.io/cse-lab-system/'
PASTAS:       { 'LAB 01': '<ID da pasta>', ... }
NUMERO_TI:    '5519900000000'
```

### 2. Google Cloud Console (Conta A)
- Criar projeto → ativar **Google Drive API**
- Tela de consentimento OAuth → tipo **Externo**
- Credencial → **App da Web** → origem: `https://<usuario>.github.io`
- Adicionar usuários de teste (Igor, Kayky)

### 3. GitHub Pages (Conta B)
- Repositório público → Settings → Pages → branch `main`

### 4. Ícones
- Gerar em [canva.com](https://canva.com) ou similar
- Exportar como PNG: 192×192 e 512×512
- Salvar em `icons/`

### 5. Adicionar no `<head>` do index.html
```html
<link rel="manifest" href="manifest.json">
<meta name="theme-color" content="#4f8cff">
<meta name="apple-mobile-web-app-capable" content="yes">
<link rel="apple-touch-icon" href="icons/icon-192.png">
```

### 6. Registrar Service Worker (antes do `</body>`)
```html
<script>
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js');
  }
</script>
```

## Fluxo de autenticação
1. Usuário acessa a aba **Fotos**
2. App verifica `auth.estaAutenticado()`
3. Se não: exibe botão "Conectar Google Drive" → chama `auth.iniciarLogin()`
4. Google redireciona de volta com token na URL
5. `auth.processarCallbackToken()` salva o token no localStorage
6. Token válido por ~1h — ao expirar, usuário reconecta

## Nomenclatura de arquivos no Drive
```
posto_01_frente.jpg   → visão geral do posto
posto_01_detalhe.jpg  → cabos, riscos, área inferior
```
