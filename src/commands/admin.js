// src/commands/admin.js
// кнопки подтверждения / отклонения чека

const { DateTime } = require("luxon");
const logger = require("../logger");

module.exports = (bot) => {
  // callback: подтверждаем оплату
  bot.action(/^grant_ok_(\d+)$/, async (ctx) => {
    const userId = ctx.match[1];
    await ctx.answerCbQuery("Оплата подтверждена ✔️");

    // 👉 пишем лог
    logger.info(
      {
        action: "grant_ok",
        targetId: userId,
        at: DateTime.local().setZone("Europe/Moscow").toISO(),
      },
      "✅ Админ подтвердил оплату"
    );

    // сообщение пользователю
    await bot.telegram.sendMessage(
      userId,
      "✨ Оплата прошла!\n\nСупер, переходим к самому интересному. " +
        "Пришли, пожалуйста, данные двух натальных карт в одну строку:\n\n" +
        "• Твои: 📅 ДД.ММ.ГГГГ ⏰ ЧЧ:ММ 🗺️ Город\n" +
        "• Партнёра: 📅 ДД.ММ.ГГГГ ⏰ ЧЧ:ММ 🗺️ Город\n\n" +
        "Например:\n" +
        "`10.04.1995 09:30 Смоленск & 25.12.1996 14:45 Казань`\n\n" +
        "И я сразу расскажу, как звёзды видят вашу совместимость 😉",
      { parse_mode: "Markdown" }
    );

    // отмечаем в чате админа
    await ctx.editMessageText("✅ Оплата подтверждена и доступ выдан.");
  });

  // callback: отклоняем оплату
  bot.action(/^grant_no_(\d+)$/, async (ctx) => {
    const userId = ctx.match[1];
    await ctx.answerCbQuery("Оплата НЕ подтверждена");

    // лог
    logger.info(
      {
        action: "grant_no",
        targetId: userId,
        at: DateTime.local().setZone("Europe/Moscow").toISO(),
      },
      "❌ Админ отклонил чек"
    );

    // пользователю
    await bot.telegram.sendMessage(
      userId,
      "😔 К сожалению, платёж пока не найден. " +
        "Проверь, пожалуйста, реквизиты и пришли корректный чек — и я сразу продолжу."
    );

    await ctx.editMessageText("❌ Оплата отклонена.");
  });
};
