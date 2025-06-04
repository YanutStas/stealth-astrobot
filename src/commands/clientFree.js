// логика бесплатных фичей клиента
const axios = require("axios");
const logger = require("../logger"); // <-- NEW
const { DateTime } = require("luxon");

// регулярка «ДД.ММ.ГГГГ ЧЧ:ММ Город»
const natalReg = /^\d{2}\.\d{2}\.\d{4}\s+\d{2}:\d{2}\s+.+$/;

// список fallback-моделей
const MODEL_CHAIN = [
  process.env.ROUTER_MODEL,
  "azure-openai/gpt-3.5-turbo",
  "openrouter/auto",
  "mistralai/mistral-7b-instruct",
  "anthropic/claude-3-haiku-20240307",
].filter(Boolean);

module.exports = (bot) => {
  // /start
  bot.start((ctx) => {
    ctx.reply(
      `Привет! Я — AstroBot 🌟\n\nЧтобы я составил твою натальную карту, пришли данные в формате:\n\n📅 ДД.ММ.ГГГГ ⏰ ЧЧ:ММ 🗺️ Город\n\nНапр.: 01.01.2000 10:00 Москва\n\n✨ Чтобы узнать совместимость — введи /compat`
    );
  });

  // натальная карта (бесплатно)
  bot.hears(natalReg, async (ctx) => {
    const tsStart = Date.now();
    const { id, username, first_name, last_name } = ctx.from;

    // логируем входящее сообщение
    logger.info(
      {
        userId: id,
        user: username || `${first_name || ""} ${last_name || ""}`.trim(),
        text: ctx.message.text,
        at: DateTime.local().toISO(),
      },
      "📥 Запрос натальной карты"
    );

    await ctx.reply("🔭 Составляю карту звёзд...");

    const userInput = ctx.message.text.trim();
    const prompt = `Составь краткую натальную карту для человека, родившегося ${userInput}. Укажи:

☀️ Солнце — знак и его влияние
🌙 Луна — знак и особенности
🧠 Меркурий — стиль мышления
🔥 Марс — энергия и мотивация

Не упоминай любовь, секс, деньги, финансы, совместимость, венеру и 12 дом. Говори тепло, по-дружески, без эзотерики. Используй смайлики, говори кратко и по делу.

В конце добавь вывод:
—
✨ В итоге: ... (главный итог о человеке)
`;

    let sent = false;
    let lastErr = null;

    for (const model of MODEL_CHAIN) {
      try {
        const { data } = await axios.post(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            model,
            messages: [
              {
                role: "system",
                content:
                  "Ты астролог, который пишет по-человечески. Используешь смайлики, пиши строго в заданном шаблоне.",
              },
              { role: "user", content: prompt },
            ],
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
              "HTTP-Referer": `https://t.me/${process.env.BOT_USERNAME}`,
              "Content-Type": "application/json",
            },
          }
        );

        const out =
          data.choices?.[0]?.message?.content?.trim() ||
          "🌌 Звёзды молчат. Попробуй позже.";

        await ctx.reply(out);

        logger.info(
          {
            userId: id,
            model,
            ms: Date.now() - tsStart,
          },
          "📤 Ответ отправлен"
        );

        sent = true;
        break;
      } catch (e) {
        lastErr = e;
        logger.warn(
          { model, err: e.response?.status || e.message },
          "⚠️ Модель не сработала, переключаюсь"
        );
      }
    }

    if (!sent) {
      logger.error(
        { userId: id, err: lastErr?.response?.data || lastErr?.message },
        "❌ Все модели упали"
      );
      ctx.reply("🛠️ Звёзды недоступны. Попробуй позже.");
    }
  });
};
