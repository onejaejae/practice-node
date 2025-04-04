const sqlite3 = require("sqlite3").verbose();
const { AsyncDatabase } = require("promised-sqlite3");

// SQLite 데이터베이스 연결
const db = new sqlite3.Database("db.sqlite", (err) => {
  if (err) {
    console.error("❌ Database connection error:", err.message);
  } else {
    console.log("✅ Connected to SQLite database.");
  }
});

// users와 posts 테이블 생성
db.serialize(() => {
  // users 테이블 생성
  db.run(
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nickname TEXT NOT NULL,
      password varchar(255) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
  );

  // posts 테이블 생성
  db.run(
    `CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT NULL,
      deleted_at DATETIME DEFAULT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`
  );
});

const getDB = async () => {
  return await AsyncDatabase.open("./db.sqlite");
};

module.exports = { getDB };
