const pino = require("pino");

// Уровень логов можно задать через .env (LOG_LEVEL=debug)
const level = process.env.LOG_LEVEL || "info";

// Попробуем подключить prettifier, но не упадём, если пакета нет
let logger;

if (process.env.NODE_ENV === "production") {
  // В проде — обычный JSON-лог на stdout
  logger = pino({ level });
} else {
  // В Dev пытаемся сделать красиво
  try {
    const transport = pino.transport({
      target: "pino-pretty",
      options: {
        translateTime: "SYS:dd.MM.yyyy HH:mm:ss",
        ignore: "pid,hostname",
        colorize: true,
      },
    });
    logger = pino({ level }, transport);
  } catch (err) {
    // pino-pretty не установлен — fallback на «сырой» вывод
    logger = pino({ level });
    logger.warn("pino-pretty не найден — логи будут в JSON");
  }
}

module.exports = logger;
