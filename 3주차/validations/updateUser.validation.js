const validateUpdateUser = (req, res, next) => {
  const { username, email, password } = req.body;
  const errors = [];

  if (username && (username.length < 3 || username.length > 20)) {
    errors.push("Username must be between 3 and 20 characters");
  }

  if (email && (email.length < 3 || email.length > 100)) {
    errors.push("Email must be between 3 and 100 characters");
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (email && !emailRegex.test(email)) {
    errors.push("Invalid email format");
  }

  if (password && (password.length < 8 || password.length > 20)) {
    errors.push("Password must be between 8 and 20 characters");
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  next();
};

module.exports = validateUpdateUser;
