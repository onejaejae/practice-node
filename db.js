const sqlite3 = require("sqlite3").verbose();

// SQLite 데이터베이스 연결
const db = new sqlite3.Database("db.sqlite", (err) => {
  if (err) {
    console.error("❌ Database connection error:", err.message);
  } else {
    console.log("✅ Connected to SQLite database.");
  }
});

// users 테이블 생성
db.serialize(() => {
  db.run(
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username VARCHAR(20) NOT NULL,
      email VARCHAR(20) NOT NULL,
      password VARCHAR(20) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT NULL,
      deleted_at DATETIME DEFAULT NULL,
      role TEXT NOT NULL DEFAULT "user"
    )`
  );
});

module.exports = db;
