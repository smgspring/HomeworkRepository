const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const dbDir = path.join(__dirname, "db");
const dbPath = path.join(dbDir, "product.db");
const jsonPath = path.join(__dirname, "data", "product.json");

if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir);

const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  console.log("🎬 DB 생성 시작...");

  // 기존 테이블 제거 (필요시)
  db.run(`DROP TABLE IF EXISTS movies`);

  // 테이블 생성
  db.run(`
    CREATE TABLE movies (
      movie_id INTEGER PRIMARY KEY AUTOINCREMENT,
      movie_title TEXT NOT NULL,
      movie_release_date TEXT,
      movie_overview TEXT,
      movie_rate REAL,
      movie_image TEXT
    )
  `);

  // JSON 파일 읽기
  const rawData = fs.readFileSync(jsonPath);
  const movies = JSON.parse(rawData);

  const stmt = db.prepare(`
    INSERT INTO movies (
      movie_title, movie_release_date, movie_overview, movie_rate, movie_image
    ) VALUES (?, ?, ?, ?, ?)
  `);

  movies.forEach((movie) => {
    stmt.run(
      movie.title,
      movie.release_date,
      movie.overview,
      movie.vote_average,
      movie.poster_url
    );
  });

  stmt.finalize();
  console.log("✅ DB 초기화 및 데이터 삽입 완료");
});

db.close();
