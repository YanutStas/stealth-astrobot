const { Markup } = require("telegraf");

module.exports = (bot) => {
  bot.start((ctx) => {
    const name = ctx.from.first_name || "друг";
    ctx.reply(
      `🌠 Привет, ${name}! Я собираю космические досье.\n` +
        `Выбери, что интереснее прямо сейчас 👇`,
      Markup.inlineKeyboard([
        [Markup.button.callback("🔮 Общая (бесплатно)", "general_start")],
        [Markup.button.callback("💕 Любовь (платно)", "love_start")],
        [Markup.button.callback("💼 Карьера (платно)", "career_start")],
        [Markup.button.callback("❤️ Совместимость (платно)", "compat_start")],
      ])
    );
  });
};
