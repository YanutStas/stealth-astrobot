// src/logger.js
const pino = require("pino");

const level = process.env.LOG_LEVEL || "info";
const isProd = process.env.NODE_ENV === "production";

let logger;

// helper, чтобы warn не спамил
let warned = false;
function warnOnce(msg) {
  if (!warned) {
    console.warn(msg);
    warned = true;
  }
}

if (isProd) {
  logger = pino({ level });
} else {
  try {
    const transport = pino.transport({
      target: "pino-pretty",
      options: {
        translateTime: "SYS:dd-MM-yyyy HH:mm:ss",
        colorize: true,
        ignore: "pid,hostname",
        messageFormat: "{msg}",          // убираем уровни в [] скобках
      },
    });
    logger = pino({ level }, transport);
  } catch {
    warnOnce("pino-pretty не найден — логи будут в JSON");
    logger = pino({ level });
  }
}

module.exports = logger;
