const { createLogger, format, transports } = require('winston');
const { v4: uuidv4 } = require('uuid');

class ErrorHandler {
  constructor() {
    this.logger = createLogger({
      level: 'error',
      format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        format.json()
      ),
      defaultMeta: { service: 'load-balancer' },
      transports: [
        new transports.File({ filename: 'error.log' }),
        new transports.Console({
          format: format.combine(
            format.colorize(),
            format.simple()
          )
        })
      ]
    });
  }

  handle(err, req, res, next) {
    const errorId = uuidv4();
    const errorDetails = this.getErrorDetails(err, req, errorId);

    this.logger.error('An error occurred', errorDetails);

    if (res.headersSent) {
      return next(err);
    }

    this.sendErrorResponse(res, err, errorId);
  }

  getErrorDetails(err, req, errorId) {
    return {
      errorId,
      message: err.message,
      stack: err.stack,
      statusCode: err.statusCode || 500,
      method: req.method,
      path: req.path,
      params: req.params,
      query: req.query,
      headers: req.headers,
      timestamp: new Date().toISOString()
    };
  }

  sendErrorResponse(res, err, errorId) {
    const statusCode = err.statusCode || 500;
    const message = statusCode === 500 ? 'Internal Server Error' : err.message;

    res.status(statusCode).json({
      error: {
        message,
        errorId,
        statusCode
      }
    });
  }

  logError(err, context = {}) {
    const errorId = uuidv4();
    this.logger.error('An error occurred', {
      errorId,
      message: err.message,
      stack: err.stack,
      ...context
    });
    return errorId;
  }
}

module.exports = ErrorHandler;