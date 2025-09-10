const { Markup } = require('telegraf');
const { sendMediaWithRetry } = require('../utils/mediaManager');

function getMainMenuKeyboard() {
  return Markup.keyboard([
    ['🌍 Choisir un continent', '📞 Voir les numéros'],
    ['💳 Envoyer preuve', '🔄 Historique'],
    ['🛠 Support', '🏠 Accueil']
  ]).resize();
}

function getInlineMenuKeyboard() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('📱 WhatsApp', 'service_whatsapp'),
      Markup.button.callback('✈️ Telegram', 'service_telegram')
    ],
    [
      Markup.button.callback('🔍 Google', 'service_google'),
      Markup.button.callback('📘 Facebook', 'service_facebook')
    ],
    [
      Markup.button.callback('🎵 TikTok', 'service_tiktok'),
      Markup.button.callback('🍎 Apple', 'service_apple')
    ]
  ]);
}

async function showMainMenu(ctx) {
  try {
    // Envoyer les médias
    await sendMediaWithRetry(ctx);
    
    // Afficher le menu principal
    await ctx.reply(
      '🌟 Menu Principal 🌟\n\nChoisissez une option :',
      getMainMenuKeyboard()
    );
  } catch (error) {
    console.error('Erreur dans showMainMenu:', error);
    await ctx.reply(
      '🌟 Menu Principal 🌟\n\nChoisissez une option :',
      getMainMenuKeyboard()
    );
  }
}

function showHelp(ctx) {
  ctx.reply(
    'ℹ️ Centre d\'Aide\n\nComment pouvons-nous vous aider?',
    getMainMenuKeyboard()
  );
}

module.exports = {
  getMainMenuKeyboard,
  getInlineMenuKeyboard,
  showMainMenu,
  showHelp
};
