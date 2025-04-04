const bcrypt = require("bcrypt");
const express = require("express");
const jwt = require("jsonwebtoken");

const { getDB } = require("./db");

const app = express();
app.use(express.json());

const secretKey = "asdasdasdasddas124123";

const authenticateToken = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "토큰이 필요합니다." });

  try {
    const decoded = jwt.verify(token, secretKey);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: error.message });
  }
};

app.post("/signup", async (req, res) => {
  const db = await getDB();

  const { nickname, password } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);
  const createdUser = await db.run(
    "INSERT INTO users (nickname, password) VALUES (?, ?)",
    [nickname, hashedPassword]
  );

  const user = await db.get("SELECT * FROM users WHERE id = ?", [
    createdUser.lastID,
  ]);

  return res.status(201).json({ success: true, user });
});

app.post("/login", async (req, res) => {
  const db = await getDB();
  const { nickname, password } = req.body;

  const user = await db.get("SELECT * FROM users WHERE nickname = ?", [
    nickname,
  ]);
  if (!user) {
    return res
      .status(404)
      .json({ success: false, message: "가입된 계정이 없습니다." });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res
      .status(404)
      .json({ success: false, message: "비밀번호가 일치하지 않습니다." });
  }

  // jwt 토큰 생성
  const token = jwt.sign({ userId: user.id }, secretKey, { expiresIn: "1h" });
  return res.status(200).json({ success: true, token });
});

app.post("/posts", authenticateToken, async (req, res) => {
  const db = await getDB();
  const { title, content } = req.body;

  try {
    const user = await db.get("SELECT * FROM users WHERE id = ?", [
      req.user.userId,
    ]);

    if (!user) {
      return res.status(404).json({ message: "존재하지 않는 유저입니다." });
    }

    const createdPost = await db.run(
      "INSERT INTO posts (title, content, user_id) VALUES (?, ?, ?)",
      [title, content, user.id]
    );

    const post = await db.get("SELECT * FROM posts WHERE id = ?", [
      createdPost.lastID,
    ]);

    res.status(201).json({ success: true, post });
  } catch (error) {
    return res.status(403).json({ message: error.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
