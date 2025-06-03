require("dotenv").config();
const { Telegraf } = require("telegraf");
const axios = require("axios");

const bot = new Telegraf(process.env.BOT_TOKEN);

// ✅ Приветственное сообщение — ОБЯЗАТЕЛЬНО внутри bot.start
bot.start((ctx) => {
  ctx.reply(
    `Привет! Я — AstroBot 🌟\n\nЧтобы я составил твою натальную карту, пришли данные в формате:\n\nДД.ММ.ГГГГ ЧЧ:ММ Город\n\nПример: 01.01.2000 10:00 Смоленск`
  );
});

// Обработка текстовых сообщений
bot.on("text", async (ctx) => {
  const message = ctx.message.text.trim();
  const regex = /^(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}:\d{2})\s+(.+)/;

  const match = message.match(regex);
  if (!match) {
    return ctx.reply(
      "❗ Неверный формат. Пожалуйста, используй:\nДД.ММ.ГГГГ ЧЧ:ММ Город\n\nПример: 01.01.2000 10:00 Смоленск"
    );
  }

  const [_, day, month, year, time, city] = match;
  const fullDate = `${day}.${month}.${year}`;

  ctx.reply("🔭 Составляю карту звёзд...");

  const systemPrompt = `Составь натальную карту по дате рождения: ${fullDate}, время: ${time}, город: ${city}. Расскажи:
- Положение Солнца, Луны, Меркурия, Марса
- Характер, привычки, сильные черты
- Заверши кратким выводом, без эзотерики, не упоминай запретные темы. Формат:

🪐 Натальная карта по дате: ${fullDate}

☀️ Солнце в ...  
Описание...

🌙 Луна в ...  
Описание...

🧠 Меркурий в ...  
Описание...

🔥 Марс в ...  
Описание...

—  
✨ В итоге: ...`;

  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "Ты профессиональный астролог. Отвечай строго в заданном формате, без лишнего текста.",
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

    const reply = response.data.choices?.[0]?.message?.content?.trim();
    ctx.reply(reply || "✨ Что-то пошло не так. Попробуй позже.");
  } catch (err) {
    console.error("❌ AstroBot Error:", err.response?.data || err.message);
    ctx.reply("🛠️ Ошибка при обращении к звёздам. Попробуй ещё раз позже.");
  }
});

bot.launch();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
