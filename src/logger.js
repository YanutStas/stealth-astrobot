// src/logger.js
const pino = require("pino");

const prettyOpts = {
  translateTime: "SYS:dd.MM.yyyy HH:mm:ss",
  ignore: "hostname,level",
  messageFormat: "{msg}",
};

let logger;
try {
  const transport = pino.transport({
    target: "pino-pretty",
    options: prettyOpts,
  });
  logger = pino({ level: "info" }, transport);
} catch {
  logger = pino({ level: "info" });
  logger.warn("pino-pretty не найден — логи будут в JSON");
}

module.exports = logger;
