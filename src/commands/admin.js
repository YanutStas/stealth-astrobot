//Логика фичей со стороны админа

module.exports = (bot) => {
  bot.command("grant", async (ctx) => {
    const replied = ctx.message.reply_to_message;
    if (!replied || !replied.forward_from) {
      return ctx.reply("⚠️ Ответь на пересланное сообщение пользователя.");
    }

    const userId = replied.forward_from.id;

    await bot.telegram.sendMessage(
      userId,
      "✅ Оплата подтверждена!\n\nПришлите данные двух людей в формате:\n\n📅 ДД.ММ.ГГГГ ⏰ ЧЧ:ММ 🗺️ Город & 📅 ДД.ММ.ГГГГ ⏰ ЧЧ:ММ 🗺️ Город"
    );

    await ctx.reply("✅ Доступ выдан.");
  });
};
