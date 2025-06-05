// src/commands/Admin/admin.js
const { DateTime } = require("luxon");
const logger = require("../../logger");
const { Markup } = require("telegraf");

const ADMIN_ID = process.env.ADMIN_ID;

// память: кто за что платит
// заполняется в Pay-командах  (require('../pendingStore') в career / love / compatibility)
const pending = require("../pendingStore");

module.exports = (bot) => {
  /* ---------- чек от клиента ---------- */
  bot.on(["photo", "document"], async (ctx) => {
    const user = ctx.from;
    const srv = pending.get(user.id) || "неизвестная услуга";

    // клиенту
    await ctx.reply("📩 Чек принят! Открою доступ после подтверждения.");

    // админу: сначала сам чек (пересылка)
    await ctx.forwardMessage(ADMIN_ID);

    // далее — подпись + кнопки
    await bot.telegram.sendMessage(
      ADMIN_ID,
      `🧾 Оплата за *${srv}* от @${user.username || "неизвестен"} (ID: ${
        user.id
      })`,
      {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([
          [
            Markup.button.callback("✔️ Подтвердить", `grant_ok_${user.id}`),
            Markup.button.callback("✖️ Отклонить", `grant_no_${user.id}`),
          ],
        ]),
      }
    );
  });

  /* ---------- админ: подтвердить ---------- */
  bot.action(/^grant_ok_(\d+)$/, async (ctx) => {
    const userId = ctx.match[1];
    const srv = pending.get(+userId) || "ваша услуга";

    await ctx.answerCbQuery("Оплата подтверждена ✔️");

    // лог
    logger.info(
      `[${DateTime.local().toFormat(
        "dd.MM.yyyy HH:mm:ss"
      )}]: ✅ Оплата подтверждена для @${userId}`
    );

    // клиенту
    await bot.telegram.sendMessage(
      userId,
      `✨ Оплата прошла!\n\nОтлично — переходим к «${srv}». Пришли, пожалуйста, все данные одним сообщением, как я просил ранее 😉`
    );

    // админу
    await ctx.editMessageText(
      `✅ Оплата за «${srv}» подтверждена и доступ выдан.`
    );
    pending.delete(+userId);
  });

  /* ---------- админ: отклонить ---------- */
  bot.action(/^grant_no_(\d+)$/, async (ctx) => {
    const userId = ctx.match[1];
    const srv = pending.get(+userId) || "услуга";

    await ctx.answerCbQuery("Оплата отклонена");

    logger.info(
      `[${DateTime.local().toFormat(
        "dd.MM.yyyy HH:mm:ss"
      )}]: ❌ Оплата отклонена для @${userId}`
    );

    await bot.telegram.sendMessage(
      userId,
      "😔 Платёж не найден. Проверь реквизиты и пришли корректный чек — и мы продолжим!"
    );

    await ctx.editMessageText(`❌ Оплата за «${srv}» отклонена.`);
    pending.delete(+userId);
  });
};
