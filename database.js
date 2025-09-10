const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

let db;

function initDatabase() {
  return new Promise((resolve, reject) => {
    const dbDir = path.join(__dirname);
    const dbPath = path.join(dbDir, 'database.sqlite');
    
    // Assurer que le répertoire existe
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Erreur lors de l\'ouverture de la base de données:', err);
        reject(err);
        return;
      }
      
      console.log('Connexion à la base de données SQLite réussie.');
      
      // Création des tables
      db.serialize(() => {
        db.run(`
          CREATE TABLE IF NOT EXISTS users (
            user_id INTEGER PRIMARY KEY,
            username TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `, (err) => {
          if (err) console.error('Erreur création table users:', err);
        });
        
        db.run(`
          CREATE TABLE IF NOT EXISTS orders (
            order_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            country_code TEXT,
            service_type TEXT,
            price REAL,
            status TEXT DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (user_id)
          )
        `, (err) => {
          if (err) console.error('Erreur création table orders:', err);
        });
        
        db.run(`
          CREATE TABLE IF NOT EXISTS payments (
            payment_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            order_id INTEGER,
            proof_image TEXT,
            status TEXT DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (user_id),
            FOREIGN KEY (order_id) REFERENCES orders (order_id)
          )
        `, (err) => {
          if (err) console.error('Erreur création table payments:', err);
        });
        
        console.log('✅ Tables créées avec succès');
        resolve();
      });
    });
  });
}

function getDb() {
  return db;
}

// Fonctions utilitaires pour la base de données
function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
}

function getQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

function allQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// Fermer proprement la base de données
function closeDatabase() {
  return new Promise((resolve, reject) => {
    if (db) {
      db.close((err) => {
        if (err) {
          reject(err);
        } else {
          console.log('Base de données fermée.');
          resolve();
        }
      });
    } else {
      resolve();
    }
  });
}

module.exports = { 
  initDatabase, 
  db: getDb, 
  runQuery, 
  getQuery, 
  allQuery,
  closeDatabase
};
