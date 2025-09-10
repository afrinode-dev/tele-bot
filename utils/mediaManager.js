const fs = require('fs');
const path = require('path');

async function sendMediaWithRetry(ctx, maxRetries = 3) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Essayer d'envoyer l'image
      const imagePath = path.join(__dirname, '../assets/bot.png');
      if (fs.existsSync(imagePath)) {
        await ctx.replyWithPhoto({ source: imagePath });
      } else {
        console.warn('Fichier image non trouvé:', imagePath);
      }
      
      // Essayer d'envoyer l'audio
      const audioPath = path.join(__dirname, '../assets/intro.mp3');
      if (fs.existsSync(audioPath)) {
        await ctx.replyWithAudio({ source: audioPath });
      } else {
        console.warn('Fichier audio non trouvé:', audioPath);
      }
      
      return; // Succès
    } catch (error) {
      lastError = error;
      console.warn(`Tentative ${attempt}/${maxRetries} échouée pour l'envoi des médias:`, error.message);
      
      if (attempt < maxRetries) {
        // Attendre avant de réessayer (backoff exponentiel)
        const waitTime = 1000 * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  // Si toutes les tentatives ont échoué
  console.error('Échec de l\'envoi des médias après toutes les tentatives:', lastError);
  // Continuer sans médias plutôt que de faire échouer toute l'opération
}

module.exports = {
  sendMediaWithRetry
};
