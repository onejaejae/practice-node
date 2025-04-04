const validateCreateUser = (req, res, next) => {
  const { nickname } = req.body;

  if (!nickname) {
    return res.status(400).json({
      success: false,
      message: "닉네임은 필수입니다.",
    });
  }

  next();
};

module.exports = validateCreateUser;
