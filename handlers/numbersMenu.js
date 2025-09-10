const { Markup } = require('telegraf');

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
    { code: 'ET', name: 'Éthiopie', price: 4.99, emoji: '🇪🇹' },
    { code: 'GH', name: 'Ghana', price: 5.29, emoji: '🇬🇭' },
    { code: 'CI', name: 'Côte d\'Ivoire', price: 5.49, emoji: '🇨🇮' }
  ],
  europe: [
    { code: 'FR', name: 'France', price: 9.99, emoji: '🇫🇷' },
    { code: 'DE', name: 'Allemagne', price: 9.49, emoji: '🇩🇪' },
    { code: 'GB', name: 'Royaume-Uni', price: 9.99, emoji: '🇬🇧' },
    { code: 'IT', name: 'Italie', price: 8.99, emoji: '🇮🇹' },
    { code: 'ES', name: 'Espagne', price: 8.49, emoji: '🇪🇸' },
    { code: 'NL', name: 'Pays-Bas', price: 8.99, emoji: '🇳🇱' },
    { code: 'BE', name: 'Belgique', price: 8.49, emoji: '🇧🇪' },
    { code: 'PT', name: 'Portugal', price: 8.29, emoji: '🇵🇹' },
    { code: 'CH', name: 'Suisse', price: 9.79, emoji: '🇨🇭' },
    { code: 'SE', name: 'Suède', price: 9.29, emoji: '🇸🇪' }
  ],
  america: [
    { code: 'US', name: 'États-Unis', price: 7.99, emoji: '🇺🇸' },
    { code: 'CA', name: 'Canada', price: 7.49, emoji: '🇨🇦' },
    { code: 'BR', name: 'Brésil', price: 6.99, emoji: '🇧🇷' },
    { code: 'MX', name: 'Mexique', price: 6.49, emoji: '🇲🇽' },
    { code: 'AR', name: 'Argentine', price: 6.99, emoji: '🇦🇷' },
    { code: 'CL', name: 'Chili', price: 6.49, emoji: '🇨🇱' },
    { code: 'CO', name: 'Colombie', price: 6.29, emoji: '🇨🇴' },
    { code: 'PE', name: 'Péru', price: 6.19, emoji: '🇵🇪' },
    { code: 'VE', name: 'Venezuela', price: 5.99, emoji: '🇻🇪' },
    { code: 'EC', name: 'Équateur', price: 6.09, emoji: '🇪🇨' }
  ]
};

function getServiceSelectionKeyboard() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('📱 WhatsApp', 'service_whatsapp'),
      Markup.button.callback('✈️ Telegram', 'service_telegram')
    ],
    [
      Markup.button.callback('🔍 Google', 'service_google'),
      Markup.button.callback('📘 Facebook', 'service_facebook')
    ],
    [
      Markup.button.callback('🎵 TikTok', 'service_tiktok'),
      Markup.button.callback('🍎 Apple', 'service_apple')
    ],
    [
      Markup.button.callback('🔙 Retour', 'main_menu')
    ]
  ]);
}

function getContinentKeyboard(service) {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('🌍 Afrique', `continent_africa_${service}`),
      Markup.button.callback('🌍 Europe', `continent_europe_${service}`)
    ],
    [
      Markup.button.callback('🌎 Amérique', `continent_america_${service}`)
    ],
    [
      Markup.button.callback('🔙 Retour', 'choose_continent'),
      Markup.button.callback('🏠 Accueil', 'main_menu')
    ]
  ]);
}

function getCountriesKeyboard(countries, service, continent) {
  const buttons = [];
  
  // Créer des boutons par groupe de 2 pays
  for (let i = 0; i < countries.length; i += 2) {
    const row = [];
    if (countries[i]) {
      row.push(Markup.button.callback(
        `${countries[i].emoji} ${countries[i].name}`,
        `country_${countries[i].code}_${service}_${continent}`
      ));
    }
    if (countries[i + 1]) {
      row.push(Markup.button.callback(
        `${countries[i + 1].emoji} ${countries[i + 1].name}`,
        `country_${countries[i + 1].code}_${service}_${continent}`
      ));
    }
    buttons.push(row);
  }
  
  // Ajouter les boutons de navigation
  buttons.push([
    Markup.button.callback('🔙 Retour', `service_${service}`),
    Markup.button.callback('🏠 Accueil', 'main_menu')
  ]);
  
  return Markup.inlineKeyboard(buttons);
}

function getCountryDetailsKeyboard(countryCode, service, continent) {
  return Markup.inlineKeyboard([
    [Markup.button.callback('🛒 Acheter maintenant', `purchase_${countryCode}_${service}_${continent}`)],
    [Markup.button.callback('🔙 Liste des pays', `continent_${continent}_${service}`)],
    [Markup.button.callback('🏠 Accueil', 'main_menu')]
  ]);
}

function showServiceSelection(ctx) {
  ctx.reply(
    '📱 Choisissez le type de service :',
    getServiceSelectionKeyboard()
  );
}

function showContinents(ctx, service) {
  ctx.reply(
    `🌍 Choisissez votre continent pour les numéros ${getServiceName(service)} :`,
    getContinentKeyboard(service)
  );
}

function showCountries(ctx, continent, service) {
  const countries = countriesByContinent[continent];
  
  ctx.reply(
    `🌍 ${getContinentName(continent)} - ${getServiceName(service)}\n\nSélectionnez votre pays :`,
    getCountriesKeyboard(countries, service, continent)
  );
}

function showCountryDetails(ctx, countryCode, service, continent) {
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
    `Service: ${getServiceName(service)}\n` +
    `Prix: €${country.price}\n` +
    `Numéros disponibles: ${availableNumbers}\n\n` +
    `Cliquez sur "Acheter maintenant" pour procéder à la commande.`,
    getCountryDetailsKeyboard(countryCode, service, continent)
  );
}

async function handlePurchase(ctx, countryCode, service, continent, dbFunctions) {
  const userId = ctx.from.id;
  const continentData = countriesByContinent[continent];
  const country = continentData.find(c => c.code === countryCode);
  
  if (!country) {
    ctx.reply('Pays non trouvé.');
    return;
  }
  
  try {
    // Enregistrer la commande dans la base de données
    const result = await dbFunctions.runQuery(
      `INSERT INTO orders (user_id, country_code, service_type, price)
       VALUES (?, ?, ?, ?)`,
      [userId, countryCode, service, country.price]
    );
    
    ctx.reply(
      `✅ Commande créée!\n\n` +
      `Pays: ${country.emoji} ${country.name}\n` +
      `Service: ${getServiceName(service)}\n` +
      `Prix: €${country.price}\n\n` +
      `Veuillez maintenant envoyer votre preuve de paiement.`,
      Markup.inlineKeyboard([
        Markup.button.callback('💳 Envoyer preuve', 'payment_proof'),
        Markup.button.callback('🏠 Accueil', 'main_menu')
      ])
    );
  } catch (error) {
    console.error('Erreur lors de la création de la commande:', error);
    ctx.reply('Une erreur s\'est produite. Veuillez réessayer.');
  }
}

// Fonctions utilitaires
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

function getContinentName(continent) {
  const continents = {
    'africa': 'Afrique',
    'europe': 'Europe',
    'america': 'Amérique'
  };
  return continents[continent] || continent;
}

module.exports = {
  showServiceSelection,
  showContinents,
  showCountries,
  showCountryDetails,
  handlePurchase
};
