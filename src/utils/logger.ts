import winston from 'winston';

const { combine, timestamp, printf, colorize, align } = winston.format;

// Define the log format
const logFormat = printf(({ level, message, timestamp }) => {
    return `${timestamp} ${level}: ${message}`;
});

// Create the logger instance
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info', // Default to 'info' if LOG_LEVEL is not set
    format: combine(
        colorize({ all: true }),
        timestamp({
            format: 'YYYY-MM-DD hh:mm:ss.SSS A', // e.g., 2023-10-27 03:24:00.123 PM
        }),
        align(),
        logFormat
    ),
    transports: [
        new winston.transports.Console(),
        // Optionally, add file transport
        // new winston.transports.File({ filename: 'error.log', level: 'error' }),
        // new winston.transports.File({ filename: 'combined.log' }),
    ],
    exceptionHandlers: [
        new winston.transports.Console(),
        // new winston.transports.File({ filename: 'exceptions.log' })
    ],
    rejectionHandlers: [
        new winston.transports.Console(),
        // new winston.transports.File({ filename: 'rejections.log' })
    ],
});

export default logger;