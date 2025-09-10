const { Telegraf, Markup, Scenes, session } = require('telegraf');
const config = require('./config');
const { initDatabase, db } = require('./database');
const mainMenu = require('./handlers/mainMenu');
const numbersMenu = require('./handlers/numbersMenu');
const paymentHandler = require('./handlers/paymentHandler');
const adminHandler = require('./handlers/adminHandler');
const { mainKeyboard, backKeyboard } = require('./utils/keyboards');
const { sendImage, sendAudio } = require('./utils/helpers');

// Initialisation du bot
const bot = new Telegraf(config.BOT_TOKEN);

// Middleware de session
bot.use(session());

// Initialisation de la base de données
initDatabase();

// Gestionnaire de commande /start
bot.start(async (ctx) => {
  const userId = ctx.from.id;
  const username = ctx.from.username || ctx.from.first_name;
  
  // Enregistrer l'utilisateur dans la base de données
  db.run(
    `INSERT OR IGNORE INTO users (user_id, username, created_at) 
     VALUES (?, ?, datetime('now'))`,
    [userId, username]
  );
  
  // Envoyer l'image et l'audio
  await sendImage(ctx, './assets/bot.png');
  await sendAudio(ctx, './assets/intro.mp3');
  
  // Afficher le menu principal
  await ctx.reply(
    '🌟 Bienvenue dans notre service de numéros virtuels ! 🌟\n\n' +
    'Choisissez une option ci-dessous :',
    mainKeyboard
  );
});

// Gestionnaire de commande /help
bot.command('help', (ctx) => {
  mainMenu.showHelp(ctx);
});

// Gestionnaire de commande admin /send
bot.command('send', (ctx) => {
  adminHandler.handleSendCommand(ctx);
});

// Gestionnaires de callback pour les menus
bot.action('main_menu', (ctx) => {
  mainMenu.showMainMenu(ctx);
});

bot.action('help_support', (ctx) => {
  mainMenu.showHelpSupport(ctx);
});

bot.action('payment_proof', (ctx) => {
  paymentHandler.requestPaymentProof(ctx);
});

// Gestionnaires pour les catégories de numéros
bot.action(/numbers_category_(.+)/, (ctx) => {
  const category = ctx.match[1];
  numbersMenu.showContinents(ctx, category);
});

bot.action(/continent_(.+)_(.+)/, (ctx) => {
  const continent = ctx.match[1];
  const category = ctx.match[2];
  numbersMenu.showCountries(ctx, continent, category);
});

bot.action(/country_(.+)_(.+)_(.+)/, (ctx) => {
  const countryCode = ctx.match[1];
  const category = ctx.match[2];
  const continent = ctx.match[3];
  numbersMenu.showCountryDetails(ctx, countryCode, category, continent);
});

bot.action(/purchase_(.+)_(.+)_(.+)/, (ctx) => {
  const countryCode = ctx.match[1];
  const category = ctx.match[2];
  const continent = ctx.match[3];
  numbersMenu.handlePurchase(ctx, countryCode, category, continent);
});

// Gestionnaire pour les messages (preuves de paiement)
bot.on('message', (ctx) => {
  paymentHandler.handleMessage(ctx);
});

// Gestion des erreurs
bot.catch((err, ctx) => {
  console.error(`Error for ${ctx.updateType}:`, err);
  ctx.reply('Une erreur s\'est produite. Veuillez réessayer.');
});

// Lancement du bot
bot.launch().then(() => {
  console.log('Bot démarré avec succès!');
});

// Gestion propre de l'arrêt
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
