// Middleware for handling 404 errors
export const notFoundHandler = (req, res, next) => {
  res.status(404).json({ message: "Route not found" });
};

// Middleware for handling general errors
export const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};
