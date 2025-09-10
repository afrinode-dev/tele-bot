const { Markup } = require('telegraf');
const { mainKeyboard, helpKeyboard, backKeyboard } = require('../utils/keyboards');
const { sendImage } = require('../utils/helpers');

function showMainMenu(ctx) {
  sendImage(ctx, './assets/bot.png');
  ctx.reply(
    '🌟 Menu Principal 🌟\n\nChoisissez une option :',
    mainKeyboard
  );
}

function showHelp(ctx) {
  sendImage(ctx, './assets/bot.png');
  ctx.reply(
    'ℹ️ Centre d\'Aide\n\nComment pouvons-nous vous aider?',
    helpKeyboard
  );
}

function showHelpSupport(ctx) {
  sendImage(ctx, './assets/bot.png');
  ctx.reply(
    '📋 Fonctionnement du Bot\n\n' +
    '1. Choisissez le type de numéro dont vous avez besoin\n' +
    '2. Sélectionnez votre continent et pays\n' +
    '3. Consultez les détails et prix\n' +
    '4. Procédez à l\'achat\n' +
    '5. Envoyez votre preuve de paiement\n' +
    '6. Recevez votre numéro par message\n\n' +
    'Pour toute question, contactez notre support.',
    backKeyboard
  );
}

module.exports = {
  showMainMenu,
  showHelp,
  showHelpSupport
};
