const { createLogger, format, transports } = require('winston');
const { v4: uuidv4 } = require('uuid');

class Logger {
  constructor() {
    this.logger = createLogger({
      level: 'info',
      format: format.combine(
        format.timestamp(),
        format.json()
      ),
      defaultMeta: { service: 'load-balancer' },
      transports: [
        new transports.File({ filename: 'error.log', level: 'error' }),
        new transports.File({ filename: 'combined.log' }),
        new transports.Console({
          format: format.combine(
            format.colorize(),
            format.simple()
          )
        })
      ]
    });

    this.perfLogger = createLogger({
      level: 'info',
      format: format.combine(
        format.timestamp(),
        format.json()
      ),
      defaultMeta: { service: 'load-balancer-performance' },
      transports: [
        new transports.File({ filename: 'performance.log' })
      ]
    });
  }

  requestLogger(req, res, next) {
    const requestId = uuidv4();
    req.requestId = requestId;

    const startTime = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const logInfo = {
        requestId,
        method: req.method,
        path: req.path,
        params: req.params,
        query: req.query,
        statusCode: res.statusCode,
        duration,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      };

      this.logger.info('Request processed', logInfo);

      if (duration > 1000) {
        this.perfLogger.warn('Slow request', logInfo);
      }
    });

    next();
  }

  info(message, meta = {}) {
    this.logger.info(message, meta);
  }

  warn(message, meta = {}) {
    this.logger.warn(message, meta);
  }

  error(message, meta = {}) {
    this.logger.error(message, meta);
  }

  logPerformance(operation, duration, meta = {}) {
    this.perfLogger.info('Performance log', {
      operation,
      duration,
      ...meta
    });
  }
}

module.exports = new Logger();