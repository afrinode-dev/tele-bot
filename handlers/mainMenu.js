const { Markup } = require('telegraf');

function getMainMenuKeyboard() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('🌍 Choisir un continent', 'choose_continent'),
      Markup.button.callback('📞 Voir les numéros', 'choose_continent')
    ],
    [
      Markup.button.callback('💳 Envoyer preuve', 'payment_proof'),
      Markup.button.callback('🔄 Historique', 'purchase_history')
    ],
    [
      Markup.button.callback('🛠 Support', 'support'),
      Markup.button.callback('🏠 Accueil', 'main_menu')
    ]
  ]);
}

function showMainMenu(ctx) {
  ctx.reply(
    '🌟 Menu Principal 🌟\n\nChoisissez une option :',
    getMainMenuKeyboard()
  );
}

function showHelp(ctx) {
  ctx.reply(
    'ℹ️ Centre d\'Aide\n\nComment pouvons-nous vous aider?',
    Markup.inlineKeyboard([
      [Markup.button.callback('📋 Fonctionnement du bot', 'support')],
      [Markup.button.callback('🔙 Retour', 'main_menu')]
    ])
  );
}

module.exports = {
  getMainMenuKeyboard,
  showMainMenu,
  showHelp
};
