const { Markup } = require("telegraf");
const axios = require("axios");
const logger = require("../../../logger");

module.exports = (bot, flowMap) => {
  const feature = "love";
  const niceFeature = "анализ любви и отношений";
  const priceBtnText = "💕 Любовь (платно)";

  // ── кнопка в меню ────────────────────────────────────────────────
  bot.action("love_start", async (ctx) => {
    await ctx.answerCbQuery();
    flowMap.set(ctx.from.id, feature);

    ctx.reply(
      `💳 Для получения *${niceFeature}* переведи 10 ₽ на карту:\n` +
        "2202 2006 1234 5678\n\n" +
        "Затем пришли сюда скриншот или чек 👇",
      { parse_mode: "Markdown" }
    );
  });

  // ── анализ любви (одна натальная карта) ─────────────────────────
  const natalReg = /^\d{2}\.\d{2}\.\d{4}\s+\d{2}:\d{2}\s+.+$/;

  bot.hears(natalReg, async (ctx) => {
    if (flowMap.get(ctx.from.id) !== feature) return; // нет оплаты
    await ctx.reply("💖 Открываю любовный свиток…");

    const prompt = `Сделай *любовный разбор* (≈1200 сим) ровно по 5 блокам:

1. 🌹 Как человек любит и проявляет чувства  
2. 💔 Основные ловушки и страхи в отношениях  
3. 💑 Идеальный партнёр и формат союза  
4. 🕊 Практические советы для гармонии (2-3 шт.)  
5. 🔮 Перспективы личной жизни на ближайший год  

Только русский, можно эмодзи.  
Дата рождения: ${ctx.message.text.trim()}`;

    try {
      const { data } = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          model: "openrouter/auto",
          messages: [{ role: "user", content: prompt }],
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );
      await ctx.reply(
        data.choices?.[0]?.message?.content?.trim() || "🌌 Не вышло."
      );
      logger.info(`[love] ok @${ctx.from.username || ctx.from.id}`);
    } catch (e) {
      logger.error(e.message);
      ctx.reply("🛠️ Что-то пошло не так, попробуй позже.");
    }
  });
};
