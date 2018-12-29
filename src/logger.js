const { createLogger, format, transports } = require('winston');

const { combine, timestamp, label, printf } = format;

const myFormat = printf((info) => {
  return `${info.timestamp} [${info.label}] ${info.level.toUpperCase()}: \t${info.message}`;
});

const logger = createLogger({
  format: combine(label, timestamp(), myFormat),
  transports: [new transports.Console()],
});

module.exports = { logger };
