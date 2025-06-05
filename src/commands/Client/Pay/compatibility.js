const { Markup } = require("telegraf");
const axios = require("axios");
const logger = require("../../logger");

module.exports = (bot, flowMap) => {
  const feature = "compat"; // ← меняем в других файлах
  const niceFeature = "анализ совместимости";
  const priceMsg = "❤️ Совместимость (платно)";

  // 1️⃣ кнопка
  bot.action("compat_start", async (ctx) => {
    await ctx.answerCbQuery();
    flowMap.set(ctx.from.id, feature);

    ctx.reply(
      `💳 Для получения *${niceFeature}* переведи 10 ₽ на карту:\n` +
        "2202 2006 1234 5678\n\n" +
        "Затем пришли сюда скриншот или чек 👇",
      { parse_mode: "Markdown" }
    );
  });

  // 2️⃣ сам анализ (две карты через &)
  const dualReg =
    /^\s*(\d{2}\.\d{2}\.\d{4}\s+\d{2}:\d{2}\s+.+?)\s*&\s*(\d{2}\.\d{2}\.\d{4}\s+\d{2}:\d{2}\s+.+)$/;

  bot.hears(dualReg, async (ctx) => {
    if (flowMap.get(ctx.from.id) !== feature) return; // не оплачено
    const [, a, b] = ctx.message.text.match(dualReg);
    const u = ctx.from.username || ctx.from.id;
    logger.info(`[${feature}] запрос @${u}`);

    await ctx.reply("💞 Сверяю звёздные паспорта пары…");

    const prompt = `Сделай анализ *совместимости* пары ровно по 5 блокам (каждый ≤3 строки).

1. 🌟 Общее впечатление пары  
2. 💗 Эмоции и быт  
3. 🔥 Интим / страсть  
4. 🤝 Конфликты и рост  
5. ✨ Потенциал на год вперёд  

Русский язык, дружелюбно, без лишнего.  
Партнёр A: ${a}  
Партнёр B: ${b}`;

    try {
      const { data } = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          model: "openrouter/auto",
          messages: [
            { role: "system", content: "Отвечай только 5 блоками." },
            { role: "user", content: prompt },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );
      await ctx.reply(
        data.choices?.[0]?.message?.content?.trim() || "🌌 Не удалось."
      );
    } catch (e) {
      logger.error(e.message);
      ctx.reply("🛠️ Что-то пошло не так, попробуй позже.");
    }
  });
};
