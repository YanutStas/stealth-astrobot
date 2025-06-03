require("dotenv").config();
const { Telegraf } = require("telegraf");
const axios = require("axios");

const bot = new Telegraf(process.env.BOT_TOKEN);

// Хранилище ID юзеров, которым дали доступ (в идеале — БД, но для MVP хватит)
const grantedUsers = new Set();

// ✅ Приветствие
bot.start((ctx) => {
  ctx.reply(
    `Привет! Я — AstroBot 🌟\n\nЧтобы я составил твою натальную карту, пришли данные в формате:\n\n📅 ДД.ММ.ГГГГ ⏰ ЧЧ:ММ 🗺️ Город\n\nНапример: 01.01.2000 10:00 Москва\n\n✨ Чтобы узнать совместимость — введи /compat`
  );
});

// ✅ Обработка натальной карты
bot.hears(/^\d{2}\.\d{2}\.\d{4}\s+\d{2}:\d{2}\s+.+$/, async (ctx) => {
  const userInput = ctx.message.text.trim();
  ctx.reply("🔭 Составляю карту звёзд...");

  const systemPrompt = `Составь краткую натальную карту для человека, родившегося ${userInput}. Укажи:
☀️ Солнце — знак и его влияние  
🌙 Луна — знак и особенности  
🧠 Меркурий — стиль мышления  
🔥 Марс — энергия и мотивация

Не упоминай любовь, секс, деньги, финансы, совместимость, венеру и 12 дом. Говори тепло, по-дружески, без эзотерики. Используй смайлики.

—
✨ В итоге: (итог)`;

  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "Ты астролог, который пишет кратко, понятно и с эмодзи.",
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
      "🌌 Звёзды молчат.";
    ctx.reply(output);
  } catch (error) {
    console.error("❌ Ошибка:", error.response?.data || error.message);
    ctx.reply("🛠️ Ошибка при обращении к звёздам. Попробуй позже.");
  }
});

// ✅ Команда совместимости
bot.command("compat", async (ctx) => {
  const userId = ctx.from.id;
  if (grantedUsers.has(userId)) {
    ctx.reply(
      "✅ У тебя уже есть доступ. Присылай данные двух людей через `&`."
    );
    return;
  }

  ctx.replyWithMarkdown(
    `💳 Для получения совместимости отправь *10₽* на карту:\n\n` +
      `\`2202 2006 1234 5678\`\n\n` +
      `Затем пришли скриншот или чек сюда 👇`
  );
});

// ✅ Получение чека
bot.on("photo", async (ctx) => {
  const userId = ctx.from.id;
  const username = ctx.from.username || "неизвестен";

  // Ответ юзеру
  ctx.reply("📩 Принято. Проверю чек и открою доступ при подтверждении.");

  // Пересылаем фото админу
  const adminId = process.env.ADMIN_ID;
  if (adminId) {
    try {
      const fileId = ctx.message.photo.at(-1).file_id;

      await ctx.telegram.sendPhoto(adminId, fileId, {
        caption: `📥 Новый чек от @${username} (ID: ${userId})\nОтветь командой /grant`,
      });
    } catch (err) {
      console.error("❌ Ошибка при пересылке админу:", err.message);
    }
  }
});

// ✅ Скрытая команда для вручную выданного доступа
bot.command("grant", (ctx) => {
  if (ctx.from.id === Number(process.env.ADMIN_ID)) {
    const replied = ctx.message.reply_to_message?.from;
    if (replied) {
      grantedUsers.add(replied.id);
      ctx.reply("✅ Пользователь получил доступ!");
    } else {
      ctx.reply("⚠️ Ответь на сообщение юзера, которому надо выдать доступ.");
    }
  } else {
    ctx.reply("🚫 Недостаточно прав.");
  }
});

bot.launch();
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
