// js/config.js
// ⚠️ Seguro para commitar — não contém client_secret
// Preencha CLIENT_ID e PASTAS após configurar o Google Cloud Console (Conta A)

export const CONFIG = {
  // Obtido em: console.cloud.google.com → Credenciais → ID do Cliente OAuth
  CLIENT_ID: '752637013195-2efafcn119m6ssohnhn4h6ih6alb72ie.apps.googleusercontent.com.apps.googleusercontent.com',

  // URL exata cadastrada no Google Cloud Console como URI de redirecionamento
  REDIRECT_URI: 'https://serrano.github.io/SerranoGuardia/',

  // Escopo necessário para ler e escrever no Drive
  SCOPES: 'https://www.googleapis.com/auth/drive',

  // IDs das pastas no Google Drive da Conta A
  // Obtenha abrindo a pasta no Drive e copiando o ID da URL:
  // drive.google.com/drive/folders/ESTE_EH_O_ID
  PASTAS: {
    'LAB 01': '1asn6q5WfYTfkNXLCAsjjF35EOMqP4Uqv?hl=pt-br',
    'LAB 02': '1-OUUr4Bb3wt_ALs2uIAn3qQim5z1qVYV?hl=pt-br',
    'LAB 03': '1qAG6mpdMTiOhIiu2ultip9BpQPwd7Yqx?hl=pt-br',
    'LAB 04': '1-Km6b9xoFDxion-dGtHxZEfQ-IHznwGN?hl=pt-br',
  },

  // Número do WhatsApp do responsável de TI (com DDI, sem + ou espaços)
  NUMERO_TI: '5511988720669',
};
