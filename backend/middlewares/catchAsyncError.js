import logger from '../logger.js'; // Import the logger

export const catchAsyncError = (theFunction) => {
  return (req, res, next) => {
    Promise.resolve(theFunction(req, res, next)).catch((err) => {
      logger.error(`${err.message} - ${req.method} ${req.url}`); // Log the error
      next(err); // Pass the error to the next middleware
    });
  };
};
