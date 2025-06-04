// src/logger.js
const pino = require("pino");

const prettyOpts = {
  translateTime: "SYS:dd.MM.yyyy HH:mm:ss",
  translateTime: "SYS:dd.MM.yyyy HH:mm:ss",
  ignore: "pid,hostname,level",
  colorize: true,
  messageFormat: "{msg}", // в выводе останется только msg
};

let logger;
try {
  const transport = pino.transport({
    target: "pino-pretty",
    options: prettyOpts,
  });
  logger = pino({ level: "info" }, transport);
} catch {
  // fallback на JSON, если pino-pretty вдруг исчезнет
  logger = pino({ level: "info" });
}

module.exports = logger;
