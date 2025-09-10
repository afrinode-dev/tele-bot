const fs = require('fs');

// Envoyer une image
async function sendImage(ctx, imagePath) {
  try {
    if (fs.existsSync(imagePath)) {
      await ctx.replyWithPhoto({ source: imagePath });
    } else {
      console.warn(`Fichier image non trouvé: ${imagePath}`);
    }
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'image:', error);
  }
}

// Envoyer un audio
async function sendAudio(ctx, audioPath) {
  try {
    if (fs.existsSync(audioPath)) {
      await ctx.replyWithAudio({ source: audioPath });
    } else {
      console.warn(`Fichier audio non trouvé: ${audioPath}`);
    }
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'audio:', error);
  }
}

module.exports = {
  sendImage,
  sendAudio
};
