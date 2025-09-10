const { Markup } = require('telegraf');

async function showPurchaseHistory(ctx, dbFunctions) {
  const userId = ctx.from.id;
  
  try {
    const orders = await dbFunctions.allQuery(
      `SELECT o.*, p.status as payment_status 
       FROM orders o 
       LEFT JOIN payments p ON o.order_id = p.order_id 
       WHERE o.user_id = ? 
       ORDER BY o.created_at DESC 
       LIMIT 10`,
      [userId]
    );
    
    if (orders.length === 0) {
      ctx.reply(
        '📝 Vous n\'avez encore effectué aucun achat.\n\n' +
        'Commencez par choisir un pays pour voir les numéros disponibles.',
        Markup.inlineKeyboard([
          Markup.button.callback('🌍 Voir les pays', 'choose_continent'),
          Markup.button.callback('🏠 Accueil', 'main_menu')
        ])
      );
      return;
    }
    
    let message = '📝 Historique de vos achats :\n\n';
    
    orders.forEach((order, index) => {
      const statusEmoji = order.payment_status === 'verified' ? '✅' : 
                         order.payment_status === 'pending' ? '⏳' : '❌';
      
      message += `${index + 1}. ${getServiceName(order.service_type)} - ${order.country_code}\n`;
      message += `   Prix: €${order.price} | Statut: ${statusEmoji} ${order.payment_status || 'En attente'}\n`;
      message += `   Date: ${new Date(order.created_at).toLocaleDateString('fr-FR')}\n\n`;
    });
    
    ctx.reply(
      message,
      Markup.inlineKeyboard([
        Markup.button.callback('🌍 Nouvel achat', 'choose_continent'),
        Markup.button.callback('🏠 Accueil', 'main_menu')
      ])
    );
    
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'historique:', error);
    ctx.reply(
      'Une erreur s\'est produite lors de la récupération de votre historique.',
      Markup.inlineKeyboard([
        Markup.button.callback('🔄 Réessayer', 'purchase_history'),
        Markup.button.callback('🏠 Accueil', 'main_menu')
      ])
    );
  }
}

// Fonction utilitaire
function getServiceName(service) {
  const services = {
    'whatsapp': 'WhatsApp',
    'telegram': 'Telegram',
    'google': 'Google',
    'facebook': 'Facebook',
    'tiktok': 'TikTok',
    'apple': 'Apple'
  };
  return services[service] || service;
}

module.exports = {
  showPurchaseHistory
};
