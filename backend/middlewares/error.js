import logger from '../logger.js'; // Import the logger

class ErrorHandler extends Error {
    constructor(message, statuscode) {
        super(message);
        this.statuscode = statuscode;
    }
}

export const errorMiddleware = (err, req, res, next) => {
    err.message = err.message || "Internal server error";
    err.statuscode = err.statuscode || 500;

    if (err.name == "CastError") {
        const message = `Resource not found. Invalid ${err.path}`;
        err = new ErrorHandler(message, 400);
    }

    if (err.code == 11000) {
        const message = `Duplicate ${Object.keys(err.keyValue)} entered`;
        err = new ErrorHandler(message, 400);
    }

    if (err.name == "JsonWebTokenError") {
        const message = `Json web Token is Invalid. Try again.`;
        err = new ErrorHandler(message, 400);
    }

    if (err.name == "TokenExpiredError") {
        const message = `Json web Token is Expired. Try again.`;
        err = new ErrorHandler(message, 400);
    }

    if (err.name == "Exception") {
        const message = `Some Exception occurred`;
        err = new ErrorHandler(message, 400);
    }

    // Log the error
    logger.error(`${err.message} - ${req.method} ${req.url}`);

    return res.status(err.statuscode).json({
        success: false,
        message: err.message,
    });
};

export default ErrorHandler;
