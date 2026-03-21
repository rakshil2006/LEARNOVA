const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const errors = {};
    error.details.forEach((d) => {
      const key = d.path[0];
      errors[key] = d.message;
    });
    return res.status(400).json({ errors });
  }
  next();
};

module.exports = validate;
