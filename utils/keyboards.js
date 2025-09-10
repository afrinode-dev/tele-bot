const { Markup } = require('telegraf');
const { countriesByContinent } = require('../handlers/numbersMenu');

// Clavier principal
const mainKeyboard = Markup.inlineKeyboard([
  [
    Markup.button.callback('📱 Numéros WhatsApp', 'numbers_category_whatsapp'),
    Markup.button.callback('✈️ Numéros Telegram', 'numbers_category_telegram')
  ],
  [
    Markup.button.callback('💼 Autres services', 'numbers_category_google'),
    Markup.button.callback('💳 Envoyer preuve', 'payment_proof')
  ],
  [
    Markup.button.callback('ℹ️ Aide support', 'help_support')
  ]
]);

// Clavier d'aide
const helpKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback('📋 Fonctionnement du bot', 'help_support')],
  [Markup.button.callback('🔙 Retour', 'main_menu')]
]);

// Clavier de retour
const backKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback('🔙 Retour', 'main_menu')]
]);

// Clavier des continents
function continentKeyboard(category) {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('🌍 Afrique', `continent_africa_${category}`),
      Markup.button.callback('🌍 Europe', `continent_europe_${category}`)
    ],
    [
      Markup.button.callback('🌎 Amérique', `continent_america_${category}`),
      Markup.button.callback('🔙 Retour', 'main_menu')
    ]
  ]);
}

// Clavier des pays
function countriesKeyboard(countries, category, continent) {
  const buttons = [];
  
  // Créer des boutons par groupe de 2 pays
  for (let i = 0; i < countries.length; i += 2) {
    const row = [];
    if (countries[i]) {
      row.push(Markup.button.callback(
        `${countries[i].emoji} ${countries[i].name}`,
        `country_${countries[i].code}_${category}_${continent}`
      ));
    }
    if (countries[i + 1]) {
      row.push(Markup.button.callback(
        `${countries[i + 1].emoji} ${countries[i + 1].name}`,
        `country_${countries[i + 1].code}_${category}_${continent}`
      ));
    }
    buttons.push(row);
  }
  
  // Ajouter le bouton retour
  buttons.push([Markup.button.callback('🔙 Retour', `numbers_category_${category}`)]);
  
  return Markup.inlineKeyboard(buttons);
}

// Clavier des détails du pays
function countryDetailsKeyboard(countryCode, category, continent) {
  return Markup.inlineKeyboard([
    [Markup.button.callback('🛒 Acheter', `purchase_${countryCode}_${category}_${continent}`)],
    [Markup.button.callback('🔙 Retour', `continent_${continent}_${category}`)],
    [Markup.button.callback('🏠 Accueil', 'main_menu')]
  ]);
}

// Clavier de retour aux continents
function backToContinentsKeyboard(category) {
  return Markup.inlineKeyboard([
    [Markup.button.callback('🔙 Retour aux continents', `numbers_category_${category}`)],
    [Markup.button.callback('🏠 Accueil', 'main_menu')]
  ]);
}

module.exports = {
  mainKeyboard,
  helpKeyboard,
  backKeyboard,
  continentKeyboard,
  countriesKeyboard,
  countryDetailsKeyboard,
  backToContinentsKeyboard
};
