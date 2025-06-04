// // входная точка приложения
require("dotenv").config();
const { Telegraf } = require("telegraf");

const bot = new Telegraf(process.env.BOT_TOKEN);

// 👉 подключаем команды
require("./src/commands/clientFree")(bot);
require("./src/commands/clientPay")(bot);
require("./src/commands/admin")(bot);

// ── запуск
bot.launch();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

// require("dotenv").config();
// const { Telegraf } = require("telegraf");
// const axios = require("axios");

// const bot = new Telegraf(process.env.BOT_TOKEN);

// const ADMIN_ID = process.env.ADMIN_ID; // Пропиши свой Telegram ID в .env

// // Приветствие
// bot.start((ctx) => {
//   ctx.reply(
//     `Привет! Я — AstroBot 🌟\n\nЧтобы я составил твою натальную карту, пришли данные в формате:\n\n📅 ДД.ММ.ГГГГ ⏰ ЧЧ:ММ 🗺️ Город\n\nНапример: 01.01.2000 10:00 Москва\n\n✨ Чтобы узнать совместимость с другим человеком — введи /compat`
//   );
// });

// // Натальная карта (бесплатная)
// bot.hears(/^\d{2}\.\d{2}\.\d{4}\s+\d{2}:\d{2}\s+.+$/, async (ctx) => {
//   const userInput = ctx.message.text.trim();
//   ctx.reply("🔭 Составляю карту звёзд...");

//   const systemPrompt = `Составь краткую натальную карту для человека, родившегося ${userInput}. Укажи:

// ☀️ Солнце — знак и его влияние
// 🌙 Луна — знак и особенности
// 🧠 Меркурий — стиль мышления
// 🔥 Марс — энергия и мотивация

// Не упоминай любовь, секс, деньги, финансы, совместимость, венеру и 12 дом. Говори тепло, по-дружески, без эзотерики. Используй смайлики, говори кратко и суть.

// В конце добавь вывод в таком стиле:
// —
// ✨ В итоге: ... (главный итог о человеке)
// `;

//   try {
//     const response = await axios.post(
//       "https://openrouter.ai/api/v1/chat/completions",
//       {
//         model: "openai/gpt-3.5-turbo",
//         messages: [
//           {
//             role: "system",
//             content:
//               "Ты астролог, который пишет по-человечески. Используешь смайлики, пиши строго в заданном шаблоне.",
//           },
//           { role: "user", content: systemPrompt },
//         ],
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
//           "HTTP-Referer": `https://t.me/${process.env.BOT_USERNAME}`,
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     const output =
//       response.data.choices?.[0]?.message?.content?.trim() ||
//       "🌌 Звёзды сегодня молчат. Попробуй позже.";

//     ctx.reply(output);
//   } catch (error) {
//     console.error("❌ OpenRouter API Error:", error.response?.data || error.message);
//     ctx.reply("🛠️ Ошибка при обращении к звёздам. Попробуй ещё раз позже.");
//   }
// });

// // Команда /compat — инструкция по оплате
// bot.command("compat", async (ctx) => {
//   ctx.reply(
//     "💳 Для получения совместимости отправь 10₽ на карту:\n\n2202 2006 1234 5678\n\nЗатем пришли скриншот или чек сюда 👇"
//   );
// });

// // Обработка чека (фото, документ и т.п.)
// bot.on(["photo", "document"], async (ctx) => {
//   const user = ctx.from;

//   // Уведомляем пользователя
//   await ctx.reply("📩 Принято. Проверю чек и открою доступ при подтверждении.");

//   // Пересылаем админу с инструкцией
//   await ctx.forwardMessage(ADMIN_ID);

//   await bot.telegram.sendMessage(
//     ADMIN_ID,
//     `🧾 Новый чек от @${user.username || "неизвестен"} (ID: ${user.id})\nОтветь на это сообщение командой /grant`
//   );
// });

// // /grant — ручное подтверждение от админа
// bot.command("grant", async (ctx) => {
//   const replied = ctx.message.reply_to_message;

//   if (!replied || !replied.forward_from) {
//     return ctx.reply("⚠️ Ответь на сообщение юзера, которому надо выдать доступ.");
//   }

//   const userId = replied.forward_from.id;

//   await bot.telegram.sendMessage(
//     userId,
//     "✅ Оплата подтверждена!\n\nПришли данные двух людей в формате:\n\n📅 ДД.ММ.ГГГГ ⏰ ЧЧ:ММ 🗺️ Город & 📅 ДД.ММ.ГГГГ ⏰ ЧЧ:ММ 🗺️ Город"
//   );

//   await ctx.reply("✅ Доступ выдан.");
// });

// bot.launch();

// process.once("SIGINT", () => bot.stop("SIGINT"));
// process.once("SIGTERM", () => bot.stop("SIGTERM"));
