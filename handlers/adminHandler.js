const { db } = require('../database');
const config = require('../config');

async function handleSendCommand(ctx) {
  // Vérifier si l'utilisateur est l'admin
  if (ctx.from.id !== config.ADMIN_ID) {
    ctx.reply('❌ Commande réservée à l\'administrateur.');
    return;
  }
  
  const args = ctx.message.text.split(' ').slice(1);
  if (args.length < 2) {
    ctx.reply('Usage: /send <userID> <message>');
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
    
    ctx.reply(`✅ Message envoyé à l'utilisateur ${userId}`);
    
    // Marquer la commande comme livrée si applicable
    await db.run(
      `UPDATE orders SET status = 'delivered' 
       WHERE user_id = ? AND status = 'payment_verified'`,
      [userId]
    );
    
  } catch (error) {
    console.error('Erreur lors de l\'envoi du message:', error);
    ctx.reply('Impossible d\'envoyer le message. L\'utilisateur a peut-être bloqué le bot.');
  }
}

module.exports = {
  handleSendCommand
};
