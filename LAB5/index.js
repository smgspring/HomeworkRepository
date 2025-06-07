const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");
const app = express();
const PORT = 3000;

// 🔹 SQLite DB 연결
const db = new sqlite3.Database(path.join(__dirname, "db", "product.db"));

// 🔹 정적 파일 서비스 (public/)
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🔹 영화 목록 API (/api/movies)
app.get("/api/movies", (req, res) => {
  const { keyword, sort } = req.query;
  let sql = "SELECT * FROM movies";
  const params = [];

  if (keyword) {
    sql += " WHERE movie_title LIKE ? OR movie_overview LIKE ?";
    const kw = `%${keyword}%`;
    params.push(kw, kw);
  }

  if (sort === "rating-desc") sql += " ORDER BY movie_rate DESC";
  else if (sort === "rating-asc") sql += " ORDER BY movie_rate ASC";
  else if (sort === "date-desc") sql += " ORDER BY movie_release_date DESC";
  else if (sort === "date-asc") sql += " ORDER BY movie_release_date ASC";

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// 🔹 영화 상세 정보 API (/api/movies/:id)
app.get("/api/movies/:id", (req, res) => {
  const id = req.params.id;
  db.get("SELECT * FROM movies WHERE movie_id = ?", [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: "Movie not found" });
    res.json(row);
  });
});

// 🔹 댓글 조회 API (/api/comments/:movie_id)
app.get("/api/comments/:movie_id", (req, res) => {
  const movieId = req.params.movie_id;
  const filePath = path.join(__dirname, "db", "comment.json");

  fs.readFile(filePath, "utf-8", (err, data) => {
    if (err) return res.status(500).json({ error: "Failed to read comments" });
    const allComments = JSON.parse(data || "[]");
    const comments = allComments.filter(
      (c) => String(c.movie_id) === String(movieId)
    );
    res.json(comments);
  });
});

// 🔹 댓글 등록 API (POST /api/comments)
app.post("/api/comments", (req, res) => {
  const { movie_id, writer, text } = req.body;
  const filePath = path.join(__dirname, "db", "comment.json");

  fs.readFile(filePath, "utf-8", (err, data) => {
    let comments = [];
    if (!err) {
      comments = JSON.parse(data || "[]");
    }

    const newComment = {
      movie_id,
      writer,
      text,
      timestamp: new Date().toISOString(),
    };
    comments.push(newComment);

    fs.writeFile(filePath, JSON.stringify(comments, null, 2), (err) => {
      if (err) return res.status(500).json({ error: "Failed to save comment" });
      res.json({ success: true, comment: newComment });
    });
  });
});

// 🔹 서버 실행
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
