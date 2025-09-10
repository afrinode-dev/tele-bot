const { Markup } = require('telegraf');

function showSupport(ctx) {
  ctx.reply(
    '🛠 Centre de Support\n\n' +
    '📋 Comment fonctionne notre service :\n' +
    '1. Choisissez le type de numéro dont vous avez besoin\n' +
    '2. Sélectionnez votre continent et pays\n' +
    '3. Consultez les détails et prix\n' +
    '4. Procédez à l\'achat\n' +
    '5. Envoyez votre preuve de paiement\n' +
    '6. Recevez votre numéro par message\n\n' +
    '❓ Questions fréquentes :\n' +
    '• Les numéros sont-ils réutilisables ? Non, chaque numéro est unique\n' +
    '• Délai de livraison ? Sous 24h après confirmation du paiement\n' +
    '• Problème avec un numéro ? Contactez-nous directement\n\n' +
    '📞 Contact :\n' +
    'Pour toute question, contactez @votresupport',
    Markup.inlineKeyboard([
      Markup.button.callback('🌍 Faire un achat', 'choose_continent'),
      Markup.button.callback('🏠 Accueil', 'main_menu')
    ])
  );
}

module.exports = {
  showSupport
};
