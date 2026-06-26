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
    'LAB 01': '1BXORO0OZxNgdTwQdHx6eThcXX7Q-jn5N',
    'LAB 02': '1aYtQv9AVMk7FQWvAxRBJpN9gspxSJAZr',
    'LAB 03': '1sSqUnovhSmprWCvYeUdPN7GoE4ygZoId',
    'LAB 04': '1b9eLfn57Lsopv7DruRsMPojKa5-nh_u7',
  },

  // Número do WhatsApp do responsável de TI (com DDI, sem + ou espaços)
  NUMERO_TI: '5511988720669',
};
