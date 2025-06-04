// логика платных фичей клиента

module.exports = (bot) => {
  // инструкция по оплате
  bot.command("compat", (ctx) => {
    ctx.reply(
      "💳 Для получения совместимости отправь 10 ₽ на карту:\n\n2202 2006 1234 5678\n\nЗатем пришли скриншот или чек сюда 👇"
    );
  });

  // приём чеков (фото/документ)
  bot.on(["photo", "document"], async (ctx) => {
    const user = ctx.from;

    await ctx.reply(
      "📩 Принято. Проверю чек и открою доступ при подтверждении."
    );
    await ctx.forwardMessage(process.env.ADMIN_ID);

    await bot.telegram.sendMessage(
      process.env.ADMIN_ID,
      `🧾 Новый чек от @${user.username || "неизвестен"} (ID: ${
        user.id
      })\nОтветь на это сообщение командой /grant`
    );
  });
};
