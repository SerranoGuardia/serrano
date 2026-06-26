// js/config.js
// ⚠️ Seguro para commitar — não contém client_secret
// Preencha CLIENT_ID e PASTAS após configurar o Google Cloud Console (Conta A)

export const CONFIG = {
  // Obtido em: console.cloud.google.com → Credenciais → ID do Cliente OAuth
  CLIENT_ID: '752637013195-2efafcn119m6ssohnhn4h6ih6alb72ie.apps.googleusercontent.com',

  // URL exata cadastrada no Google Cloud Console como URI de redirecionamento
  REDIRECT_URI: 'https://SerranoGuardia.github.io/serrano/',

  // Escopo necessário para ler e escrever no Drive
  SCOPES: 'https://www.googleapis.com/auth/drive',

  // IDs das pastas no Google Drive da Conta A
  // Obtenha abrindo a pasta no Drive e copiando o ID da URL:
  // drive.google.com/drive/folders/ESTE_EH_O_ID
  PASTAS: {
    'LAB 01': '17MOU0hIc8m6JoIttVdo2RePqNJCvB4c0',
    'LAB 02': '1kxEiKmahxGcmpzEp8EeC49hykdXeRG5P',
    'LAB 03': '1GnUR_YZ_gCNnBRU30zbpBjp0Vw-WvnIh',
    'LAB 04': '1kwBlgtO0JugpssXCCSpsxYiFkdiSZ0O2',
  },

  // Número do WhatsApp do responsável de TI (com DDI, sem + ou espaços)
  NUMERO_TI: '5511988720669',
};
