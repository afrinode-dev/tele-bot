const sqlite3 = require('sqlite3').verbose();
const path = require('path');

let db;

function initDatabase() {
  return new Promise((resolve, reject) => {
    const dbPath = path.join(__dirname, 'database.sqlite');
    
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
        `);
        
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
        `);
        
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
        `);
        
        console.log('Tables créées avec succès');
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

module.exports = { 
  initDatabase, 
  db: getDb, 
  runQuery, 
  getQuery, 
  allQuery 
};
