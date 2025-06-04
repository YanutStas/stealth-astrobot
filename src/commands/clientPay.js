// платная функция «Совместимость»

const { Markup } = require("telegraf");

module.exports = (bot) => {
  // кнопка «Совместимость (платно)» из меню
  bot.action("compat_start", async (ctx) => {
    await ctx.answerCbQuery();
    ctx.reply(
      "💳 Для получения совместимости отправь 10 ₽ на карту:\n\n" +
        "2202 2006 1234 5678\n\n" +
        "Затем пришли скриншот или чек сюда 👇"
    );
  });

  // /compat — если пользователь набрал вручную
  bot.command("compat", (ctx) => {
    ctx.reply(
      "💳 Для получения совместимости отправь 10 ₽ на карту:\n\n" +
        "2202 2006 1234 5678\n\n" +
        "Затем пришли скриншот или чек сюда 👇"
    );
  });

  // приём чеков (фото/док)
  bot.on(["photo", "document"], async (ctx) => {
    const user = ctx.from;

    // сообщаем пользователю
    await ctx.reply(
      "📩 Чек получен! Проверю и дам знать, как только оплата подтвердится."
    );

    // пересылаем картинку админу
    const fwdMsg = await ctx.forwardMessage(process.env.ADMIN_ID);

    // под пересланным сообщением — кнопки для админа
    await bot.telegram.sendMessage(
      process.env.ADMIN_ID,
      `🧾 Чек от @${user.username || "неизвестен"} (ID: ${user.id})`,
      Markup.inlineKeyboard([
        Markup.button.callback("✅ Подтверждено", `grant_ok_${user.id}`),
        Markup.button.callback("❌ Не подтверждено", `grant_no_${user.id}`),
      ])
    );
  });
};