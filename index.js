require("dotenv").config();
const { Telegraf } = require("telegraf");
const axios = require("axios");

const bot = new Telegraf(process.env.BOT_TOKEN);

// ✅ Приветствие
bot.start((ctx) => {
  ctx.reply(
    `Привет! Я — AstroBot 🌟\n\nЧтобы я составил твою натальную карту, пришли данные в формате:\n\n📅 ДД.ММ.ГГГГ ⏰ ЧЧ:ММ 🗺️ Город\n\nНапример: 01.01.2000 10:00 Москва`
  );
});

// ✅ Обработка запроса
bot.on("text", async (ctx) => {
  const userInput = ctx.message.text.trim();

  // 👇 Проверка на формат: дата, время и город
  if (!/^\d{2}\.\d{2}\.\d{4}\s+\d{2}:\d{2}\s+.+$/.test(userInput)) {
    return ctx.reply(
      "❗ Неверный формат. Введи так:\nДД.ММ.ГГГГ ЧЧ:ММ Город\n\nНапример: 01.01.2000 10:00 Москва"
    );
  }

  ctx.reply("🔭 Составляю карту звёзд...");

  const systemPrompt = `Составь краткую натальную карту для человека, родившегося ${userInput}. Укажи:

☀️ Солнце — знак и его влияние  
🌙 Луна — знак и особенности  
🧠 Меркурий — стиль мышления  
🔥 Марс — энергия и мотивация

Не упоминай любовь, секс, деньги, финансы, совместимость, венеру и 12 дом. Говори тепло, по-дружески, без эзотерики. Используй смайлики, говори кратко и суть.

В конце добавь вывод в таком стиле:
—
✨ В итоге: ... (главный итог о человеке)
`;

  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "Ты астролог, который пишет по-человечески. Используешь смайлики, пиши строго в заданном шаблоне.",
          },
          { role: "user", content: systemPrompt },
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

    const output =
      response.data.choices?.[0]?.message?.content?.trim() ||
      "🌌 Звёзды сегодня молчат. Попробуй позже.";

    ctx.reply(output);
  } catch (error) {
    console.error(
      "❌ OpenRouter API Error:",
      error.response?.data || error.message
    );
    ctx.reply("🛠️ Ошибка при обращении к звёздам. Попробуй ещё раз позже.");
  }
});

bot.launch();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
