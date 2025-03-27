const validateCreateUser = (req, res, next) => {
  const { username, email, password } = req.body;
  const errors = [];

  if (!username) errors.push("Username is required");
  if (!email) errors.push("Email is required");
  if (!password) errors.push("Password is required");

  // 입력된 필드만 검증
  if (username && (username.length < 3 || username.length > 20)) {
    errors.push("Username must be between 3 and 20 characters");
  }

  if (email) {
    if (email.length < 3 || email.length > 100) {
      errors.push("Email must be between 3 and 100 characters");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push("Invalid email format");
    }
  }

  if (password && (password.length < 8 || password.length > 20)) {
    errors.push("Password must be between 8 and 20 characters");
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  next();
};

module.exports = validateCreateUser;
