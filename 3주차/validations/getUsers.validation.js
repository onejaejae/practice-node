const validateGetUsers = (req, res, next) => {
  const { sort } = req.query;
  const errors = [];

  if (sort && sort !== "ASC" && sort !== "DESC")
    errors.push("Sort must be ASC or DESC");

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }
  next();
};

module.exports = validateGetUsers;
