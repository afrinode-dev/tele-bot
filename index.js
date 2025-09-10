const { Telegraf, session, Scenes: { Stage } } = require('telegraf');
const { initDatabase, runQuery, getQuery, allQuery } = require('./database');
const mainMenu = require('./handlers/mainMenu');
const numbersMenu = require('./handlers/numbersMenu');
const paymentHandler = require('./handlers/paymentHandler');
const adminHandler = require('./handlers/adminHandler');
const historyHandler = require('./handlers/historyHandler');
const supportHandler = require('./handlers/supportHandler');
const { sendMediaWithRetry } = require('./utils/mediaManager');

require('dotenv').config();

// Vérification du token
if (!process.env.BOT_TOKEN) {
  console.error('❌ BOT_TOKEN non défini dans les variables d\'environnement');
  process.exit(1);
}

// Initialisation du bot
const bot = new Telegraf(process.env.BOT_TOKEN);

// Middleware de session
bot.use(session());

// Initialisation de la base de données
initDatabase().then(() => {
  console.log('✅ Base de données initialisée avec succès');
}).catch(err => {
  console.error('❌ Erreur lors de l\'initialisation de la base de données:', err);
});

// Middleware pour gérer les timeouts
bot.use(async (ctx, next) => {
  try {
    await Promise.race([
      next(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 10000)
      )
    ]);
  } catch (error) {
    if (error.message === 'Timeout') {
      console.log('⏰ Timeout sur la requête');
      if (ctx && ctx.reply) {
        await ctx.reply('⏰ Délai d\'attente dépassé. Veuillez réessayer.');
      }
    } else {
      throw error;
    }
  }
});

// Gestionnaire de commande /start
bot.start(async (ctx) => {
  try {
    const userId = ctx.from.id;
    const username = ctx.from.username || ctx.from.first_name;
    
    // Enregistrer l'utilisateur dans la base de données
    await runQuery(
      `INSERT OR IGNORE INTO users (user_id, username) VALUES (?, ?)`,
      [userId, username]
    );
    
    // Envoyer média avec gestion d'erreurs
    await sendMediaWithRetry(ctx);
    
    // Afficher le menu principal avec Reply Keyboard
    await mainMenu.showMainMenu(ctx);
  } catch (error) {
    console.error('Erreur dans la commande /start:', error);
    await ctx.reply('Une erreur s\'est produite. Veuillez réessayer.', 
      mainMenu.getMainMenuKeyboard());
  }
});

// Gestionnaire de texte pour les Reply Keyboards
bot.hears('🌍 Choisir un continent', (ctx) => {
  numbersMenu.showServiceSelection(ctx);
});

bot.hears('📞 Voir les numéros', (ctx) => {
  numbersMenu.showServiceSelection(ctx);
});

bot.hears('💳 Envoyer preuve', (ctx) => {
  paymentHandler.requestPaymentProof(ctx);
});

bot.hears('🔄 Historique', (ctx) => {
  historyHandler.showPurchaseHistory(ctx, { getQuery, allQuery });
});

bot.hears('🛠 Support', (ctx) => {
  supportHandler.showSupport(ctx);
});

bot.hears('🏠 Accueil', (ctx) => {
  mainMenu.showMainMenu(ctx);
});

// Gestionnaire de commande admin /send
bot.command('send', (ctx) => {
  adminHandler.handleSendCommand(ctx, { runQuery, getQuery });
});

// Gestionnaire de commande /stats (admin)
bot.command('stats', (ctx) => {
  adminHandler.showStats(ctx, { getQuery, allQuery });
});

// Gestionnaires de callback pour les services
bot.action(/service_(.+)/, (ctx) => {
  const service = ctx.match[1];
  numbersMenu.showContinents(ctx, service);
});

// Gestionnaires pour les continents
bot.action(/continent_(.+)_(.+)/, (ctx) => {
  const continent = ctx.match[1];
  const service = ctx.match[2];
  numbersMenu.showCountries(ctx, continent, service);
});

// Gestionnaires pour les pays
bot.action(/country_(.+)_(.+)_(.+)/, (ctx) => {
  const countryCode = ctx.match[1];
  const service = ctx.match[2];
  const continent = ctx.match[3];
  numbersMenu.showCountryDetails(ctx, countryCode, service, continent);
});

// Gestionnaires pour les achats
bot.action(/purchase_(.+)_(.+)_(.+)/, (ctx) => {
  const countryCode = ctx.match[1];
  const service = ctx.match[2];
  const continent = ctx.match[3];
  numbersMenu.handlePurchase(ctx, countryCode, service, continent, { runQuery, getQuery });
});

// Gestionnaire pour les messages (preuves de paiement)
bot.on('message', async (ctx) => {
  // Ignorer les commandes qui sont déjà gérées
  if (ctx.message.text && ctx.message.text.startsWith('/')) {
    return;
  }
  
  // Vérifier si c'est une preuve de paiement
  if (ctx.message.photo || ctx.message.document) {
    await paymentHandler.handleMessage(ctx, { runQuery, getQuery, allQuery });
  } else if (ctx.message.text && ![
    '🌍 Choisir un continent', '📞 Voir les numéros', '💳 Envoyer preuve',
    '🔄 Historique', '🛠 Support', '🏠 Accueil'
  ].includes(ctx.message.text)) {
    // Si c'est un message texte non lié aux boutons, rediriger vers le menu
    await ctx.reply('Je ne comprends pas ce message. Utilisez les boutons ci-dessous :',
      mainMenu.getMainMenuKeyboard());
  }
});

// Gestion des erreurs
bot.catch(async (err, ctx) => {
  console.error(`Error for ${ctx.updateType}:`, err);
  if (ctx && ctx.reply) {
    try {
      await ctx.reply('Une erreur s\'est produite. Veuillez réessayer.',
        mainMenu.getMainMenuKeyboard());
    } catch (e) {
      console.error('Erreur lors de l\'envoi du message d\'erreur:', e);
    }
  }
});

// Health check endpoint pour le monitoring
if (process.env.NODE_ENV === 'production') {
  const express = require('express');
  const app = express();
  const port = process.env.PORT || 3000;
  
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
  });
  
  app.listen(port, () => {
    console.log(`✅ Health check server running on port ${port}`);
  });
}

// Gestion propre de l'arrêt
process.once('SIGINT', async () => {
  console.log('Arrêt du bot...');
  await bot.stop('SIGINT');
  process.exit(0);
});

process.once('SIGTERM', async () => {
  console.log('Arrêt du bot...');
  await bot.stop('SIGTERM');
  process.exit(0);
});

// Fonction pour démarrer le bot avec réessai en cas d'erreur
async function startBotWithRetry(retries = 5, delay = 5000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await bot.launch();
      console.log('✅ Bot démarré avec succès!');
      return;
    } catch (error) {
      console.error(`❌ Tentative ${attempt}/${retries} échouée:`, error.message);
      
      if (attempt === retries) {
        console.error('❌ Échec du démarrage après toutes les tentatives');
        process.exit(1);
      }
      
      // Si c'est une erreur de conflit, attendre et réessayer
      if (error.response && error.response.error_code === 409) {
        console.log(`🔄 Conflit détecté, réessai dans ${delay/1000} secondes...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        // Pour d'autres erreurs, réessayer avec un délai exponentiel
        const waitTime = delay * Math.pow(2, attempt - 1);
        console.log(`⏳ Réessai dans ${waitTime/1000} secondes...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
}

// Démarrer le bot
startBotWithRetry();
