const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  if (err.name === "MulterError") {
    return res.status(400).json({ error: err.message });
  }
  const status = err.status || 500;
  res.status(status).json({ error: err.message || "Internal server error" });
};

module.exports = errorHandler;
