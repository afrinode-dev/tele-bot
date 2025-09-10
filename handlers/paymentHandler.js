const { Markup } = require('telegraf');

function requestPaymentProof(ctx) {
  ctx.reply(
    '💳 Envoi de preuve de paiement\n\n' +
    'Veuillez envoyer votre capture d\'écran ou photo de la preuve de paiement.\n\n' +
    'Assurez-vous que la preuve est claire et montre tous les détails importants.',
    Markup.inlineKeyboard([
      Markup.button.callback('🔙 Retour', 'main_menu')
    ])
  );
}

async function handleMessage(ctx, dbFunctions) {
  // Vérifier si le message contient une photo ou un document
  if (ctx.message.photo || ctx.message.document) {
    const userId = ctx.from.id;
    const fileId = ctx.message.photo 
      ? ctx.message.photo[ctx.message.photo.length - 1].file_id 
      : ctx.message.document.file_id;
    
    try {
      // Vérifier si l'utilisateur a une commande en attente
      const order = await dbFunctions.getQuery(
        `SELECT * FROM orders WHERE user_id = ? AND status = 'pending' ORDER BY created_at DESC LIMIT 1`,
        [userId]
      );
      
      if (!order) {
        ctx.reply(
          'Vous n\'avez pas de commande en attente. Veuillez d\'abord créer une commande.',
          Markup.inlineKeyboard([
            Markup.button.callback('🌍 Choisir un pays', 'choose_continent'),
            Markup.button.callback('🏠 Accueil', 'main_menu')
          ])
        );
        return;
      }
      
      // Enregistrer la preuve de paiement
      await dbFunctions.runQuery(
        `INSERT INTO payments (user_id, order_id, proof_image)
         VALUES (?, ?, ?)`,
        [userId, order.order_id, fileId]
      );
      
      // Mettre à jour le statut de la commande
      await dbFunctions.runQuery(
        `UPDATE orders SET status = 'payment_pending' WHERE order_id = ?`,
        [order.order_id]
      );
      
      // Envoyer la preuve à l'admin
      const adminId = process.env.ADMIN_ID || 123456789;
      const caption = `Nouvelle preuve de paiement!\n\n` +
                     `Utilisateur: @${ctx.from.username || ctx.from.first_name}\n` +
                     `ID: ${userId}\n` +
                     `Commande: #${order.order_id}\n` +
                     `Date: ${new Date().toLocaleString('fr-FR')}`;
      
      try {
        if (ctx.message.photo) {
          await ctx.telegram.sendPhoto(adminId, fileId, { caption });
        } else {
          await ctx.telegram.sendDocument(adminId, fileId, { caption });
        }
      } catch (adminError) {
        console.error('Erreur lors de l\'envoi à l\'admin:', adminError);
      }
      
      ctx.reply(
        '✅ Preuve de paiement reçue!\n\n' +
        'Votre preuve a été envoyée à l\'administrateur pour vérification.\n' +
        'Vous recevrez votre numéro sous peu une fois le paiement confirmé.\n\n' +
        'Merci pour votre confiance!',
        Markup.inlineKeyboard([
          Markup.button.callback('🔄 Historique', 'purchase_history'),
          Markup.button.callback('🏠 Accueil', 'main_menu')
        ])
      );
      
    } catch (error) {
      console.error('Erreur lors du traitement du paiement:', error);
      ctx.reply('Une erreur s\'est produite. Veuillez réessayer.');
    }
  }
}

module.exports = {
  requestPaymentProof,
  handleMessage
};
