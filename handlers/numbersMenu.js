const { Markup } = require('telegraf');
const { continentKeyboard, countriesKeyboard, countryDetailsKeyboard, backToContinentsKeyboard } = require('../utils/keyboards');
const { sendImage } = require('../utils/helpers');
const { db } = require('../database');

// Données des pays par continent
const countriesByContinent = {
  africa: [
    { code: 'DZ', name: 'Algérie', price: 5.99, emoji: '🇩🇿' },
    { code: 'EG', name: 'Égypte', price: 4.99, emoji: '🇪🇬' },
    { code: 'ZA', name: 'Afrique du Sud', price: 6.99, emoji: '🇿🇦' },
    { code: 'NG', name: 'Nigéria', price: 4.49, emoji: '🇳🇬' },
    { code: 'KE', name: 'Kenya', price: 5.49, emoji: '🇰🇪' },
    { code: 'MA', name: 'Maroc', price: 5.99, emoji: '🇲🇦' },
    { code: 'TN', name: 'Tunisie', price: 5.49, emoji: '🇹🇳' },
    // Ajouter d'autres pays africains...
  ],
  europe: [
    { code: 'FR', name: 'France', price: 9.99, emoji: '🇫🇷' },
    { code: 'DE', name: 'Allemagne', price: 9.49, emoji: '🇩🇪' },
    { code: 'GB', name: 'Royaume-Uni', price: 9.99, emoji: '🇬🇧' },
    { code: 'IT', name: 'Italie', price: 8.99, emoji: '🇮🇹' },
    { code: 'ES', name: 'Espagne', price: 8.49, emoji: '🇪🇸' },
    { code: 'NL', name: 'Pays-Bas', price: 8.99, emoji: '🇳🇱' },
    { code: 'BE', name: 'Belgique', price: 8.49, emoji: '🇧🇪' },
    // Ajouter d'autres pays européens...
  ],
  america: [
    { code: 'US', name: 'États-Unis', price: 7.99, emoji: '🇺🇸' },
    { code: 'CA', name: 'Canada', price: 7.49, emoji: '🇨🇦' },
    { code: 'BR', name: 'Brésil', price: 6.99, emoji: '🇧🇷' },
    { code: 'MX', name: 'Mexique', price: 6.49, emoji: '🇲🇽' },
    { code: 'AR', name: 'Argentine', price: 6.99, emoji: '🇦🇷' },
    { code: 'CL', name: 'Chili', price: 6.49, emoji: '🇨🇱' },
    { code: 'CO', name: 'Colombie', price: 6.29, emoji: '🇨🇴' },
    // Ajouter d'autres pays américains...
  ]
};

function showContinents(ctx, category) {
  sendImage(ctx, './assets/bot.png');
  ctx.reply(
    `🌍 Choisissez votre continent pour les numéros ${getCategoryName(category)} :`,
    continentKeyboard(category)
  );
}

function showCountries(ctx, continent, category) {
  sendImage(ctx, './assets/bot.png');
  const countries = countriesByContinent[continent];
  
  ctx.reply(
    `🌍 ${getContinentName(continent)} - ${getCategoryName(category)}\n\nSélectionnez votre pays :`,
    countriesKeyboard(countries, category, continent)
  );
}

function showCountryDetails(ctx, countryCode, category, continent) {
  sendImage(ctx, './assets/bot.png');
  
  const continentData = countriesByContinent[continent];
  const country = continentData.find(c => c.code === countryCode);
  
  if (!country) {
    ctx.reply('Pays non trouvé.');
    return;
  }
  
  // Générer un nombre aléatoire autour de 30
  const availableNumbers = Math.floor(Math.random() * 10) + 25;
  
  ctx.reply(
    `📋 Détails du pays\n\n` +
    `Pays: ${country.emoji} ${country.name}\n` +
    `Service: ${getCategoryName(category)}\n` +
    `Prix: €${country.price}\n` +
    `Numéros disponibles: ${availableNumbers}\n\n` +
    `Cliquez sur "Acheter" pour procéder à la commande.`,
    countryDetailsKeyboard(countryCode, category, continent)
  );
}

async function handlePurchase(ctx, countryCode, category, continent) {
  const userId = ctx.from.id;
  const continentData = countriesByContinent[continent];
  const country = continentData.find(c => c.code === countryCode);
  
  if (!country) {
    ctx.reply('Pays non trouvé.');
    return;
  }
  
  try {
    // Enregistrer la commande dans la base de données
    const result = await db.run(
      `INSERT INTO orders (user_id, country_code, service_type, price, created_at)
       VALUES (?, ?, ?, ?, datetime('now'))`,
      [userId, countryCode, category, country.price]
    );
    
    ctx.reply(
      `✅ Commande créée!\n\n` +
      `Pays: ${country.emoji} ${country.name}\n` +
      `Service: ${getCategoryName(category)}\n` +
      `Prix: €${country.price}\n\n` +
      `Veuillez maintenant envoyer votre preuve de paiement en utilisant le bouton "Envoyer preuve de paiement" dans le menu principal.`,
      Markup.inlineKeyboard([
        Markup.button.callback('📤 Envoyer preuve de paiement', 'payment_proof'),
        Markup.button.callback('🏠 Accueil', 'main_menu')
      ])
    );
  } catch (error) {
    console.error('Erreur lors de la création de la commande:', error);
    ctx.reply('Une erreur s\'est produite. Veuillez réessayer.');
  }
}

// Fonctions utilitaires
function getCategoryName(category) {
  const categories = {
    'whatsapp': 'WhatsApp',
    'telegram': 'Telegram',
    'google': 'Google',
    'facebook': 'Facebook',
    'tiktok': 'TikTok',
    'apple': 'Apple'
  };
  return categories[category] || category;
}

function getContinentName(continent) {
  const continents = {
    'africa': 'Afrique',
    'europe': 'Europe',
    'america': 'Amérique'
  };
  return continents[continent] || continent;
}

module.exports = {
  showContinents,
  showCountries,
  showCountryDetails,
  handlePurchase
};
