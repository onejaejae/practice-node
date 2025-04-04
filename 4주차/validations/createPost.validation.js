const validateCreatePost = (req, res, next) => {
  const { nickname, title, content } = req.body;

  // 필수 필드 존재 여부 확인
  if (!nickname || !title || !content) {
    return res.status(400).json({
      success: false,
      message: "닉네임, 제목, 내용은 필수입니다.",
    });
  }

  // 데이터 타입 검증
  if (
    typeof nickname !== "string" ||
    typeof title !== "string" ||
    typeof content !== "string"
  ) {
    return res.status(400).json({
      success: false,
      message: "닉네임, 제목, 내용은 문자열이어야 합니다.",
    });
  }

  next();
};

module.exports = validateCreatePost;
