const express = require("express");
const bcrypt = require("bcrypt");

const validateCreateUser = require("./validations/createUser.validation");
const validateGetUsers = require("./validations/getUsers.validation");
const validateUpdateUser = require("./validations/updateUser.validation");
const app = express();

const db = require("./db");

app.use(express.json());

// 사용자 생성하기
app.post("/users", validateCreateUser, async (req, res) => {
  const { username, email, password } = req.body;

  // 이메일 중복 검증
  db.get("SELECT * FROM users WHERE email = ?", [email], async (err, row) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }

    if (row) {
      return res.status(400).json({ message: "이미 존재하는 계정입니다." });
    }

    // 비밀번호 암호화
    const hashedPassword = await bcrypt.hash(password, 10);

    // 사용자 생성
    db.run(
      "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
      [username, email, hashedPassword],
      (err) => {
        if (err) {
          return res.status(500).json({ success: false, error: err.message });
        }
      }
    );

    // 사용자 조회
    db.get("SELECT * FROM users WHERE email = 1?1", [email], (err, row) => {
      if (err) {
        return res.status(500).json({ success: false, error: err.message });
      }

      return res
        .status(201)
        .json({ message: "User created successfully", data: row });
    });
  });
});

// 사용자 전체 조회
app.get("/users", validateGetUsers, (req, res) => {
  const { keyword, sort = "ASC", page = 0, limit = 10 } = req.query;
  const offset = page * limit;

  // 기본 쿼리 및 파라미터 배열
  let query = "SELECT * FROM users WHERE deleted_at IS NULL";
  const params = [];

  // 검색어가 있으면 조건 추가
  if (keyword) {
    query += " AND (username LIKE ? OR email LIKE ?)";
    params.push(`%${keyword}%`, `%${keyword}%`);
  }

  // 정렬 및 페이지네이션 추가
  query += ` ORDER BY created_at ${sort} LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  // 쿼리 실행
  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }

    return res.status(200).json({
      success: true,
      data: rows,
    });
  });
});

// 사용자 조회
app.get("/users/:userId", (req, res) => {
  const userId = req.params.userId;

  db.get(
    "SELECT * FROM users WHERE id = ? AND deleted_at IS NULL",
    [userId],
    (err, row) => {
      if (err) {
        throw new Error("Failed to get user");
      }

      if (!row) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.status(200).json({ data: row });
    }
  );
});

// 사용자 정보 수정
app.patch("/users/:userId", validateUpdateUser, (req, res) => {
  const userId = req.params.userId;
  const { username, email, password } = req.body;

  db.get("SELECT * FROM users WHERE id = ?", [userId], async (err, row) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }

    if (!row) {
      return res.status(404).json({ message: "User not found" });
    }

    // 업데이트할 필드 준비 (기존 값 유지 또는 새 값 사용)
    const updatedUser = {
      username: username || row.username,
      email: email || row.email,
      password: password ? await bcrypt.hash(password, 10) : row.password,
    };

    db.run(
      "UPDATE users SET username = ?, email = ?, password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [updatedUser.username, updatedUser.email, updatedUser.password, userId],
      (err) => {
        if (err) {
          return res.status(500).json({ success: false, error: err.message });
        }

        return res.status(200).json({ message: "User updated successfully" });
      }
    );
  });
});

// 사용자 삭제
app.delete("/users/:userId", (req, res) => {
  const userId = req.params.userId;

  db.run(
    "UPDATE users SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?",
    [userId],
    (err) => {
      if (err) {
        return res.status(500).json({ success: false, error: err.message });
      }

      return res.status(200).json({ message: "User deleted successfully" });
    }
  );
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
