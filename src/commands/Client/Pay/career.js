const { Markup } = require("telegraf");
const axios = require("axios");
const logger = require("../../../logger");
const pending = require("../../pendingStore");

module.exports = (bot, flowMap) => {
  const feature = "career";
  const niceFeature = "карьерный прогноз";
  const priceBtnText = "💼 Карьера (платно)";

  // ── кнопка в меню ────────────────────────────────────────────────
  bot.action("career_start", async (ctx) => {
    await ctx.answerCbQuery();
    flowMap.set(ctx.from.id, feature);
    pending.set(ctx.from.id, niceFeature); 

    ctx.reply(
      `💳 Для получения *${niceFeature}* переведи 50 ₽ на карту:\n` +
        "2200700977607737\n\n" +
        "Затем пришли сюда скриншот или чек 👇",
      { parse_mode: "Markdown" }
    );
  });

  // ── анализ карьеры (одна натальная карта) ───────────────────────
  const natalReg = /^\d{2}\.\d{2}\.\d{4}\s+\d{2}:\d{2}\s+.+$/;

  bot.hears(natalReg, async (ctx) => {
    if (flowMap.get(ctx.from.id) !== feature) return; // нет оплаты
    await ctx.reply("📈 Читаю карьерные линии…");

    const prompt = `Составь *карьерный прогноз* (≈1200 сим) ровно по 5 блокам:

1. 🏆 Сильные стороны в работе  
2. ⚠️ Слабые места и выгорание  
3. 💰 Поток денег и лучшие источники дохода  
4. 🚀 Рекомендованные профессии / форматы (офис, фриланс, бизнес…)  
5. 📅 Ключевые периоды на ближайший год  

Русский язык, дружелюбно, можно эмодзи.  
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
      logger.info(`[career] ok @${ctx.from.username || ctx.from.id}`);
    } catch (e) {
      logger.error(e.message);
      ctx.reply("🛠️ Что-то пошло не так, попробуй позже.");
    }
  });
};
