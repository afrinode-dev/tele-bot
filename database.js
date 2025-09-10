const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const config = require('./config');

let db;

async function initDatabase() {
  try {
    db = await open({
      filename: config.DATABASE_PATH,
      driver: sqlite3.Database
    });

    // Création des tables
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        user_id INTEGER PRIMARY KEY,
        username TEXT,
        created_at DATETIME
      );
      
      CREATE TABLE IF NOT EXISTS orders (
        order_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        country_code TEXT,
        service_type TEXT,
        price REAL,
        status TEXT DEFAULT 'pending',
        created_at DATETIME,
        FOREIGN KEY (user_id) REFERENCES users (user_id)
      );
      
      CREATE TABLE IF NOT EXISTS payments (
        payment_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        order_id INTEGER,
        proof_image TEXT,
        status TEXT DEFAULT 'pending',
        created_at DATETIME,
        FOREIGN KEY (user_id) REFERENCES users (user_id),
        FOREIGN KEY (order_id) REFERENCES orders (order_id)
      );
    `);

    console.log('Base de données initialisée avec succès');
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de la base de données:', error);
  }
}

function getDb() {
  return db;
}

module.exports = { initDatabase, db: getDb };
