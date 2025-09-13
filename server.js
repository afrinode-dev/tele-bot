require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const axios = require('axios');
const phone = require('phone');
const express = require("express");

// Configuration
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API_KEY = process.env.ONLINESIM_API_KEY;
const BANNER_URL = process.env.BANNER_IMAGE_URL;
const PORT = process.env.PORT || 3000;

// Vérification des variables d'environnement
if (!BOT_TOKEN || !API_KEY) {
  console.error('Erreur: TELEGRAM_BOT_TOKEN et ONLINESIM_API_KEY doivent être définis dans le fichier .env');
  process.exit(1);
}

// Initialisation du bot
const bot = new Telegraf(BOT_TOKEN);

// Configuration de l'API OnlineSim
const ONLINESIM_BASE_URL = 'https://onlinesim.io/api';
const LANG = 'fr';

// Classe utilitaire pour l'API OnlineSim
class OnlineSimAPI {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  // Récupérer la liste des pays disponibles
  async getCountries() {
    try {
      const response = await axios.get(`${ONLINESIM_BASE_URL}/getFreeCountryList`, {
        params: {
          lang: LANG
        }
      });
      
      if (response.data && response.data.response === 1) {
        return response.data.countries;
      }
      return [];
    } catch (error) {
      console.error('Erreur lors de la récupération des pays:', error.message);
      return [];
    }
  }

  // Récupérer les numéros d'un pays spécifique
  async getCountryNumbers(countryCode) {
    try {
      const response = await axios.get(`${ONLINESIM_BASE_URL}/getFreePhoneList`, {
        params: {
          country: countryCode,
          lang: LANG
        }
      });
      
      if (response.data && response.data.response === 1) {
        return response.data.numbers;
      }
      return [];
    } catch (error) {
      console.error('Erreur lors de la récupération des numéros:', error.message);
      return [];
    }
  }

  // Récupérer les messages d'un numéro
  async getNumberMessages(phoneNumber) {
    try {
      const response = await axios.get(`${ONLINESIM_BASE_URL}/getFreeMessageList`, {
        params: {
          phone: phoneNumber,
          lang: LANG
        }
      });
      
      if (response.data && response.data.response === 1) {
        return response.data.messages;
      }
      return [];
    } catch (error) {
      console.error('Erreur lors de la récupération des messages:', error.message);
      return [];
    }
  }

  // Prolonger la location d'un numéro (pour les numéros payants)
  async extendRent(tzid) {
    try {
      const response = await axios.get(`${ONLINESIM_BASE_URL}/extendRentState`, {
        params: {
          apikey: this.apiKey,
          tzid: tzid,
          extension: 1
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la prolongation:', error.message);
      return null;
    }
  }
}

// Initialisation de l'API
const onlineSimAPI = new OnlineSimAPI(API_KEY);

// Fonction pour formater un numéro de téléphone
function formatPhoneNumber(phoneNumber, countryCode) {
  try {
    const formatted = phone(phoneNumber, countryCode);
    if (formatted.isValid) {
      return formatted.phoneNumber;
    }
    return phoneNumber;
  } catch (error) {
    return phoneNumber;
  }
}

// Fonction pour obtenir le drapeau d'un pays à partir du code
function getCountryFlag(countryCode) {
  if (!countryCode) return '🏳';
  
  // Conversion du code de pays en point de code Unicode pour le drapeau
  const base = 127397;
  return countryCode.toUpperCase().replace(/./g, 
    char => String.fromCodePoint(base + char.charCodeAt(0))
  );
}

// Gestionnaire de commande /start et /restart
bot.start(async (ctx) => {
  try {
    if (BANNER_URL) {
      await ctx.replyWithPhoto(BANNER_URL, {
        caption: `⁀➴ Bonjour ${ctx.from.first_name || 'Utilisateur'}!\n
Bienvenue sur le Bot Virtual Number OnlineSim\n\n
Envoyez /help pour obtenir de l'aide\n
Envoyez /number pour obtenir un numéro virtuel`,
        parse_mode: 'Markdown'
      });
    } else {
      await ctx.reply(`⁀➴ Bonjour ${ctx.from.first_name || 'Utilisateur'}!\n
Bienvenue sur le Bot Virtual Number OnlineSim\n\n
Envoyez /help pour obtenir de l'aide\n
Envoyez /number pour obtenir un numéro virtuel`);
    }
  } catch (error) {
    console.error('Erreur dans la commande start:', error);
    await ctx.reply('Une erreur est survenue lors du démarrage du bot.');
  }
});

bot.command('restart', async (ctx) => {
  await ctx.reply('Redémarrage du bot...');
  await ctx.reply(`⁀➴ Bonjour ${ctx.from.first_name || 'Utilisateur'}!\n
Bienvenue sur le Bot Virtual Number OnlineSim\n\n
Envoyez /help pour obtenir de l'aide\n
Envoyez /number pour obtenir un numéro virtuel`);
});

// Gestionnaire de commande /help et /usage
bot.help(async (ctx) => {
  const helpText = `·ᴥ· Virtual Number Bot\n\n
══════════════\n
★ Pour obtenir un nouveau numéro, envoyez simplement la commande /number ou utilisez le bouton inline (Renouveler) pour obtenir un nouveau numéro.\n\n
★ Pour obtenir les messages reçus, utilisez le bouton inline (Boîte de réception). Cela vous montrera les 5 derniers messages.\n\n
★ Vous pouvez également vérifier le profil Telegram du numéro en utilisant le bouton inline (Profil)\n
══════════════\n\n
C'est tout ce que vous devez savoir sur ce bot !`;
  
  await ctx.reply(helpText);
});

bot.command('usage', async (ctx) => {
  await ctx.reply('Commande /usage: voir /help');
});

// Gestionnaire de commande /number
bot.command('number', async (ctx) => {
  try {
    // Message initial
    let message = await ctx.reply('Recherche d\'un numéro pour vous...\n\n⁀➴ Récupération des pays en ligne:');

    // Récupérer les pays disponibles
    const countries = await onlineSimAPI.getCountries();
    
    if (!countries || countries.length === 0) {
      await ctx.editMessageText('Aucun pays disponible pour le moment. Veuillez réessayer plus tard.');
      return;
    }

    await ctx.editMessageText(`Recherche d'un numéro aléatoire pour vous...\n\n⁀➴ Récupération des pays en ligne:\nTrouvé ${countries.length} pays\n\n⁀➴ Test des numéros actifs:`);

    // Mélanger les pays pour un choix aléatoire
    const shuffledCountries = [...countries].sort(() => Math.random() - 0.5);

    // Parcourir les pays pour trouver un numéro actif
    for (const country of shuffledCountries) {
      const countryCode = country.country;
      const countryName = country.country_text;

      // Récupérer les numéros pour ce pays
      const numbers = await onlineSimAPI.getCountryNumbers(countryCode);
      
      if (!numbers || numbers.length === 0) continue;

      // Filtrer les numéros actifs (ceux qui ont des messages récents)
      const activeNumbers = [];
      
      for (const number of numbers) {
        // Vérifier si le numéro a des messages récents
        const messages = await onlineSimAPI.getNumberMessages(number.full_number);
        if (messages && messages.length > 0) {
          activeNumbers.push({
            number: number.full_number,
            country: countryCode,
            countryName: countryName,
            messages: messages
          });
        }
      }

      // Si on a trouvé des numéros actifs, en choisir un au hasard
      if (activeNumbers.length > 0) {
        const randomNumber = activeNumbers[Math.floor(Math.random() * activeNumbers.length)];
        
        // Formater le numéro
        const formattedNumber = formatPhoneNumber(randomNumber.number, randomNumber.country);
        const flag = getCountryFlag(randomNumber.country);
        
        // Créer les boutons inline
        const keyboard = Markup.inlineKeyboard([
          [
            Markup.button.callback('📥 Boîte de réception', `inbox:${randomNumber.country}:${randomNumber.number}`),
            Markup.button.callback('🔁 Renouveler', `renew:${randomNumber.country}:${randomNumber.number}`)
          ],
          [
            Markup.button.callback('👤 Profil', `profile:${randomNumber.country}:${randomNumber.number}`)
          ]
        ]);

        // Mettre à jour le message avec le numéro trouvé
        await ctx.editMessageText(`${flag} Voici votre numéro: ${formattedNumber}\n\nPays: ${randomNumber.countryName}\n\nDernière mise à jour: ${new Date().toLocaleString()}`, keyboard);
        return;
      }
    }

    // Si aucun numéro actif n'a été trouvé
    await ctx.editMessageText('Aucun numéro actif disponible pour le moment. Veuillez réessayer plus tard.');

  } catch (error) {
    console.error('Erreur dans la commande number:', error);
    try {
      await ctx.editMessageText('Une erreur est survenue lors de la recherche d\'un numéro. Veuillez réessayer.');
    } catch (e) {
      await ctx.reply('Une erreur est survenue lors de la recherche d\'un numéro. Veuillez réessayer.');
    }
  }
});

// Gestionnaire pour le bouton "Boîte de réception"
bot.action(/inbox:(.+):(.+)/, async (ctx) => {
  try {
    await ctx.answerCbQuery();
    const [country, phoneNumber] = ctx.match.slice(1);
    
    // Récupérer les messages
    const messages = await onlineSimAPI.getNumberMessages(phoneNumber);
    
    if (!messages || messages.length === 0) {
      await ctx.reply('Aucun message trouvé pour ce numéro.');
      return;
    }
    
    // Afficher les 5 derniers messages
    const recentMessages = messages.slice(0, 5);
    let messageText = `📨 Messages pour ${phoneNumber}:\n\n`;
    
    for (const msg of recentMessages) {
      messageText += `⏰ ${msg.created_at}\n📝 ${msg.text}\n\n`;
    }
    
    if (messages.length > 5) {
      messageText += `\n... et ${messages.length - 5} autres messages`;
    }
    
    await ctx.reply(messageText);
  } catch (error) {
    console.error('Erreur dans la gestion de la boîte de réception:', error);
    await ctx.answerCbQuery('Erreur lors de la récupération des messages');
  }
});

// Gestionnaire pour le bouton "Renouveler"
bot.action(/renew:(.+):(.+)/, async (ctx) => {
  try {
    await ctx.answerCbQuery();
    // Pour l'instant, on renvoie simplement un nouveau numéro
    // Dans une version future, on pourrait utiliser l'API extendRentState pour les numéros payants
    await ctx.reply('Fonctionnalité de renouvellement en développement. Utilisez /number pour un nouveau numéro.');
  } catch (error) {
    console.error('Erreur dans la gestion du renouvellement:', error);
    await ctx.answerCbQuery('Erreur lors du renouvellement');
  }
});

// Gestionnaire pour le bouton "Profil"
bot.action(/profile:(.+):(.+)/, async (ctx) => {
  try {
    await ctx.answerCbQuery();
    const [country, phoneNumber] = ctx.match.slice(1);
    
    // Récupérer les messages pour afficher les derniers SMS
    const messages = await onlineSimAPI.getNumberMessages(phoneNumber);
    
    let profileText = `👤 Profil pour ${phoneNumber}\n\n`;
    
    if (messages && messages.length > 0) {
      profileText += `Derniers messages:\n\n`;
      const recentMessages = messages.slice(0, 3);
      
      for (const msg of recentMessages) {
        profileText += `⏰ ${msg.created_at}\n📝 ${msg.text}\n\n`;
      }
    } else {
      profileText += 'Aucun message reçu pour ce numéro.';
    }
    
    // Ajouter un bouton pour contacter le numéro sur Telegram
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.url('Contacter sur Telegram', `tg://resolve?phone=${phoneNumber}`)]
    ]);
    
    await ctx.reply(profileText, keyboard);
  } catch (error) {
    console.error('Erreur dans la gestion du profil:', error);
    await ctx.answerCbQuery('Erreur lors de la récupération du profil');
  }
});

// Gestion des erreurs
bot.catch((err, ctx) => {
  console.error(`Erreur pour ${ctx.updateType}:`, err);
  ctx.reply('Une erreur est survenue. Veuillez réessayer.');
});

// Serveur web pour Render
const app = express();
app.use(express.json());
app.get('/', (req, res) => {
  res.send('🤖 Bot est en ligne!');
});

// Démarrer le bot
app.listen(PORT, () => {
  console.log(`🚀 Serveur web démarré sur le port ${PORT}`);
});

// Gestion propre de l'arrêt
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
