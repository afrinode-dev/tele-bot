const { Markup } = require('telegraf');
const { getMainMenuKeyboard } = require('./mainMenu');

async function handleSendCommand(ctx, dbFunctions) {
  // Vérifier si l'utilisateur est l'admin
  const adminId = process.env.ADMIN_ID || 123456789;
  if (ctx.from.id !== parseInt(adminId)) {
    await ctx.reply('❌ Commande réservée à l\'administrateur.');
    return;
  }
  
  const args = ctx.message.text.split(' ').slice(1);
  if (args.length < 2) {
    await ctx.reply('Usage: /send <userID> <message>');
    return;
  }
  
  const userId = parseInt(args[0]);
  const message = args.slice(1).join(' ');
  
  try {
    // Envoyer le message à l'utilisateur
    await ctx.telegram.sendMessage(userId, 
      `📨 Message de l'administrateur:\n\n${message}\n\n` +
      `Si vous avez des questions, répondez à ce message.`
    );
    
    await ctx.reply(`✅ Message envoyé à l'utilisateur ${userId}`);
    
    // Marquer la commande comme livrée si applicable
    await dbFunctions.runQuery(
      `UPDATE orders SET status = 'delivered' 
       WHERE user_id = ? AND status = 'payment_verified'`,
      [userId]
    );
    
  } catch (error) {
    console.error('Erreur lors de l\'envoi du message:', error);
    await ctx.reply('Impossible d\'envoyer le message. L\'utilisateur a peut-être bloqué le bot.');
  }
}

async function showStats(ctx, dbFunctions) {
  // Vérifier si l'utilisateur est l'admin
  const adminId = process.env.ADMIN_ID || 123456789;
  if (ctx.from.id !== parseInt(adminId)) {
    await ctx.reply('❌ Commande réservée à l\'administrateur.');
    return;
  }
  
  try {
    // Récupérer les statistiques
    const totalUsers = await dbFunctions.getQuery('SELECT COUNT(*) as count FROM users');
    const totalOrders = await dbFunctions.getQuery('SELECT COUNT(*) as count FROM orders');
    const pendingPayments = await dbFunctions.getQuery(`SELECT COUNT(*) as count FROM payments WHERE status = 'pending'`);
    const revenue = await dbFunctions.getQuery('SELECT SUM(price) as total FROM orders WHERE status = "delivered"');
    
    await ctx.reply(
      `📊 Statistiques du Bot\n\n` +
      `👥 Utilisateurs totaux: ${totalUsers.count}\n` +
      `📦 Commandes totales: ${totalOrders.count}\n` +
      `⏳ Paiements en attente: ${pendingPayments.count}\n` +
      `💰 Revenu total: €${revenue.total || 0}\n\n` +
      `Dernière mise à jour: ${new Date().toLocaleString('fr-FR')}`
    );
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    await ctx.reply('Erreur lors de la récupération des statistiques.');
  }
}

// Gestionnaire pour l'approbation des paiements
async function handlePaymentApproval(ctx, orderId, approved) {
  const adminId = process.env.ADMIN_ID || 123456789;
  if (ctx.from.id !== parseInt(adminId)) {
    return;
  }
  
  try {
    const status = approved ? 'verified' : 'rejected';
    await dbFunctions.runQuery(
      `UPDATE payments SET status = ? WHERE order_id = ?`,
      [status, orderId]
    );
    
    await dbFunctions.runQuery(
      `UPDATE orders SET status = ? WHERE order_id = ?`,
      [approved ? 'payment_verified' : 'payment_rejected', orderId]
    );
    
    if (approved) {
      await ctx.reply(`✅ Paiement #${orderId} approuvé avec succès!`);
    } else {
      await ctx.reply(`❌ Paiement #${orderId} rejeté.`);
    }
    
    // Notifier l'utilisateur
    const order = await dbFunctions.getQuery(
      `SELECT user_id FROM orders WHERE order_id = ?`,
      [orderId]
    );
    
    if (order) {
      const message = approved ? 
        `✅ Votre paiement a été approuvé! Votre numéro sera livré sous 24h.` :
        `❌ Votre paiement a été rejeté. Contactez le support pour plus d'informations.`;
      
      await ctx.telegram.sendMessage(order.user_id, message);
    }
    
  } catch (error) {
    console.error('Erreur lors de la gestion du paiement:', error);
    await ctx.reply('Erreur lors de la gestion du paiement.');
  }
}

module.exports = {
  handleSendCommand,
  showStats,
  handlePaymentApproval
};
