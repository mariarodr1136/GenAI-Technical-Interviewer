export function errorHandler(error, _req, res, _next) {
  console.error(error);

  if (error.code === "LIMIT_FILE_SIZE") {
    res.status(413).json({ error: "Audio file is too large. Keep recordings under 25 MB." });
    return;
  }

  res.status(500).json({
    error: error.message ?? "The interview server hit an unexpected error."
  });
}
