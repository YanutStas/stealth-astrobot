const { Markup } = require("telegraf");
const { DateTime } = require("luxon");
const logger = require("../../logger");

module.exports = (bot, flowMap) => {
  // чек от пользователя → админ
  bot.on(["photo", "document"], async (ctx) => {
    const feat = flowMap.get(ctx.from.id) || "неизвестно";
    await ctx.reply("📩 Чек принят! Открою доступ после подтверждения.");

    await ctx.forwardMessage(process.env.ADMIN_ID);
    await bot.telegram.sendMessage(
      process.env.ADMIN_ID,
      `🧾 Чек от @${ctx.from.username || "anon"} (ID:${ctx.from.id})\n` +
        `Запрошено: *${feat.toUpperCase()}*`,
      {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([
          [
            Markup.button.callback("✔️ Подтвердить", `grant_ok_${ctx.from.id}`),
            Markup.button.callback("❌ Отклонить", `grant_no_${ctx.from.id}`),
          ],
        ]),
      }
    );
  });

  // подтверждение
  bot.action(/^grant_ok_(\d+)$/, async (ctx) => {
    const id = ctx.match[1];
    await ctx.answerCbQuery("Оплата подтверждена");
    bot.telegram.sendMessage(id, "✨ Оплата подтверждена! Можем продолжать 🚀");
    ctx.editMessageText("✅ Оплата подтверждена.");
    logger.info(
      `[admin] ✔️ ${id} ${DateTime.local().toFormat("dd.MM.yyyy HH:mm")}`
    );
  });

  // отказ
  bot.action(/^grant_no_(\d+)$/, async (ctx) => {
    const id = ctx.match[1];
    await ctx.answerCbQuery("Оплата отклонена");
    bot.telegram.sendMessage(
      id,
      "😔 Платёж не найден. Пришли корректный чек, и мы продолжим."
    );
    ctx.editMessageText("❌ Оплата отклонена.");
    logger.info(
      `[admin] ❌ ${id} ${DateTime.local().toFormat("dd.MM.yyyy HH:mm")}`
    );
  });
};
