const { Telegraf, Markup, session } = require('telegraf');
const { initDatabase, runQuery, getQuery, allQuery } = require('./database');
const mainMenu = require('./handlers/mainMenu');
const numbersMenu = require('./handlers/numbersMenu');
const paymentHandler = require('./handlers/paymentHandler');
const adminHandler = require('./handlers/adminHandler');
const historyHandler = require('./handlers/historyHandler');
const supportHandler = require('./handlers/supportHandler');

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
    
    // Afficher le menu principal
    await ctx.reply(
      '🌟 Bienvenue dans notre service de numéros virtuels ! 🌟\n\n' +
      'Choisissez une option ci-dessous :',
      mainMenu.getMainMenuKeyboard()
    );
  } catch (error) {
    console.error('Erreur dans la commande /start:', error);
    ctx.reply('Une erreur s\'est produite. Veuillez réessayer.');
  }
});

// Gestionnaire de commande /help
bot.command('help', (ctx) => {
  mainMenu.showHelp(ctx);
});

// Gestionnaire de commande admin /send
bot.command('send', (ctx) => {
  adminHandler.handleSendCommand(ctx, { runQuery, getQuery });
});

// Gestionnaires de callback pour les menus principaux
bot.action('main_menu', (ctx) => {
  mainMenu.showMainMenu(ctx);
});

bot.action('choose_continent', (ctx) => {
  numbersMenu.showServiceSelection(ctx);
});

bot.action('payment_proof', (ctx) => {
  paymentHandler.requestPaymentProof(ctx);
});

bot.action('purchase_history', (ctx) => {
  historyHandler.showPurchaseHistory(ctx, { getQuery, allQuery });
});

bot.action('support', (ctx) => {
  supportHandler.showSupport(ctx);
});

// Gestionnaires pour les services
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
bot.on('message', (ctx) => {
  // Ignorer les commandes qui sont déjà gérées
  if (ctx.message.text && ctx.message.text.startsWith('/')) {
    return;
  }
  paymentHandler.handleMessage(ctx, { runQuery, getQuery, allQuery });
});

// Gestion des erreurs
bot.catch((err, ctx) => {
  console.error(`Error for ${ctx.updateType}:`, err);
  if (ctx && ctx.reply) {
    ctx.reply('Une erreur s\'est produite. Veuillez réessayer.');
  }
});

// Gestion propre de l'arrêt
process.once('SIGINT', () => {
  console.log('Arrêt du bot...');
  bot.stop('SIGINT');
});
process.once('SIGTERM', () => {
  console.log('Arrêt du bot...');
  bot.stop('SIGTERM');
});

// Fonction pour démarrer le bot
async function startBot() {
  try {
    await bot.launch();
    console.log('✅ Bot démarré avec succès!');
  } catch (error) {
    console.error('❌ Erreur lors du démarrage du bot:', error);
    
    // Si c'est une erreur de conflit, attendre et réessayer
    if (error.response && error.response.error_code === 409) {
      console.log('🔄 Conflit détecté, réessai dans 5 secondes...');
      setTimeout(startBot, 5000);
    } else {
      process.exit(1);
    }
  }
}

// Démarrer le bot
startBot();
