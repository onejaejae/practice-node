const express = require("express");
const app = express();

const { getDB } = require("./db");
const validateCreateUser = require("./validations/createUser.validation");
const validateCreatePost = require("./validations/createPost.validation");

app.use(express.json());

const createUserService = async (req, res, next) => {
  const db = await getDB();

  const { nickname } = req.body;

  const result = await db.run("INSERT INTO users (nickname) VALUES (?)", [
    nickname,
  ]);
  const user = await db.get("SELECT * FROM users WHERE id = ?", [
    result.lastID,
  ]);

  return res.status(201).json({ success: true, user });
};

const testMiddleware = (req, res, next) => {
  console.log("test middleware");
  next();
};

// POST /users - 사용자 닉네임 등록
app.post("/users", validateCreateUser, createUserService);

// POST /posts - 게시글 작성
app.post("/posts", validateCreatePost, async (req, res) => {
  try {
    const db = await getDB();
    const { nickname, title, content } = req.body;

    // 1. 사용자 찾기 또는 생성
    const userId = await findOrCreateUser(db, nickname);

    // 2. 게시글 생성
    const post = await createPost(db, { userId, title, content });

    res.status(201).json({
      success: true,
      data: post,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// 사용자 찾기 또는 생성하는 함수
const findOrCreateUser = async (db, nickname) => {
  const existingUser = await db.get("SELECT id FROM users WHERE nickname = ?", [
    nickname,
  ]);

  if (existingUser) {
    return existingUser.id;
  }

  const result = await db.run("INSERT INTO users (nickname) VALUES (?)", [
    nickname,
  ]);
  return result.lastID;
};

// 게시글 생성 함수
const createPost = async (db, { userId, title, content }) => {
  const result = await db.run(
    "INSERT INTO posts (user_id, title, content) VALUES (?, ?, ?)",
    [userId, title, content]
  );

  // 생성된 게시글 조회 (닉네임 포함)
  const post = await db.get(
    `
    SELECT posts.*, users.nickname 
    FROM posts 
    JOIN users ON posts.user_id = users.id 
    WHERE posts.id = ?
  `,
    [result.lastID]
  );

  return post;
};

// GET /posts - 게시글 목록 조회
app.get("/posts", async (req, res) => {
  try {
    const db = await getDB();
    const { nickname, sort = "desc", page = 1, limit = 3 } = req.query;

    console.log("page---", page);

    const offset = (page - 1) * limit;
    // 기본 쿼리 작성
    let query = `
      SELECT 
        posts.id,
        posts.title,
        posts.content,
        users.nickname,
        posts.created_at
      FROM posts 
      JOIN users ON posts.user_id = users.id 
      WHERE posts.deleted_at IS NULL
    `;
    const params = [];

    // 닉네임 검색 조건 추가
    if (nickname) {
      query += " AND users.nickname = ?";
      params.push(nickname);
    }

    // 정렬 조건 추가
    const sortDirection = sort.toLowerCase() === "asc" ? "ASC" : "DESC";
    query += ` ORDER BY posts.created_at ${sortDirection}`;

    // 페이징 처리
    query += " LIMIT ? OFFSET ?";
    params.push(Number(limit), Number(offset));

    // 전체 게시글 수 조회 (페이징 정보용)
    let countQuery = `
      SELECT COUNT(*) as total
      FROM posts 
      JOIN users ON posts.user_id = users.id 
      WHERE posts.deleted_at IS NULL
    `;
    if (nickname) {
      countQuery += " AND users.nickname = ?";
    }
    const totalCount = await db.get(countQuery, nickname ? [nickname] : []);

    // 게시글 목록 조회

    console.log("query", query);
    const posts = await db.all(query, params);

    // 응답 데이터 구성
    res.json({
      success: true,
      data: {
        posts,
        pagination: {
          total: totalCount.total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(totalCount.total / limit),
          hasNext: Number(page) < Math.ceil(totalCount.total / limit),
        },
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// PUT /posts/:id - 게시글 수정
app.put("/posts/:id", async (req, res) => {
  try {
    const db = await getDB();
    const { nickname, title, content } = req.body;
    const postId = req.params.id;

    if (!nickname) {
      return res.status(400).json({
        success: false,
        message: "닉네임은 필수입니다.",
      });
    }

    // 게시글 작성자 확인
    const post = await db.get(
      `SELECT posts.* 
       FROM posts 
       JOIN users ON posts.user_id = users.id 
       WHERE posts.id = ? AND users.nickname = ? AND posts.deleted_at IS NULL`,
      [postId, nickname]
    );

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "게시글을 찾을 수 없거나 수정 권한이 없습니다.",
      });
    }

    // 수정할 필드 설정
    const updates = [];
    const params = [];

    if (title !== undefined) {
      updates.push("title = ?");
      params.push(title);
    }
    if (content !== undefined) {
      updates.push("content = ?");
      params.push(content);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: "수정할 내용이 없습니다.",
      });
    }

    // updated_at 자동 갱신
    updates.push("updated_at = CURRENT_TIMESTAMP");
    params.push(postId);

    // 게시글 수정
    await db.run(`UPDATE posts SET ${updates.join(", ")} WHERE id = ?`, params);

    // 수정된 게시글 조회
    const updatedPost = await db.get(
      `SELECT posts.*, users.nickname 
       FROM posts 
       JOIN users ON posts.user_id = users.id 
       WHERE posts.id = ?`,
      [postId]
    );

    res.json({
      success: true,
      data: updatedPost,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// DELETE /posts/:id - 게시글 삭제
app.delete("/posts/:id", async (req, res) => {
  try {
    const db = await getDB();
    const { nickname } = req.body;
    const postId = req.params.id;

    if (!nickname) {
      return res.status(400).json({
        success: false,
        message: "닉네임은 필수입니다.",
      });
    }

    // 게시글 소프트 삭제
    const result = await db.run(
      `UPDATE posts SET deleted_at = CURRENT_TIMESTAMP 
       WHERE id = ? AND user_id IN (
         SELECT id FROM users WHERE nickname = ?
       ) AND deleted_at IS NULL`,
      [postId, nickname]
    );

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: "게시글을 찾을 수 없거나 삭제 권한이 없습니다.",
      });
    }

    res.json({
      success: true,
      data: { message: "게시글이 성공적으로 삭제되었습니다." },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
