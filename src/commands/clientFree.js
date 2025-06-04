// ───────────────────────────────────────────────────────────
// FREE — расширенная наталка (без любви, денег, совмест-ти)
// ───────────────────────────────────────────────────────────
const axios = require("axios");
const { DateTime } = require("luxon");
const { Markup } = require("telegraf");
const logger = require("../logger");

// ── валидация ввода
const natalReg = /^\d{2}\.\d{2}\.\d{4}\s+\d{2}:\d{2}\s+.+$/;
const isValidNatal = (t) => {
  if (!natalReg.test(t.trim())) return false;
  const [d, tm] = t.split(/\s+/);
  return DateTime.fromFormat(`${d} ${tm}`, "dd.MM.yyyy HH:mm").isValid;
};

// ── fallback-цепочка
const MODELS = [
  "openrouter/auto",
  "mistralai/mistral-7b-instruct",
  "anthropic/claude-3-haiku-20240307",
];

// ───────────────────────────────────────────────────────────
module.exports = (bot) => {
  // /start с прогревом
  bot.start((ctx) => {
    const name = ctx.from.first_name || "космический друг";
    const appeal =
      name.endsWith("а") || name.endsWith("я") ? "красотка" : "искатель";

    ctx.reply(
      `🌌 Привет, ${appeal} ${name}! Я AstroSelf — карманный проводник по звёздам.\n` +
        `Выбери, что интересно прямо сейчас 👇`,
      Markup.inlineKeyboard([
        [Markup.button.callback("🔮 Общая (бесплатно)", "natal_start")],
        [Markup.button.callback("💞 Любовь (платно)", "love_start")],
        [Markup.button.callback("💼 Карьера (платно)", "career_start")],
        [Markup.button.callback("❤️ Совместимость (платно)", "compat_start")],
      ])
    );
  });

  // инструкция
  bot.action("natal_start", async (ctx) => {
    await ctx.answerCbQuery();
    ctx.reply(
      "Чтобы я составил натальную карту, пришли данные в одну строку:\n\n" +
        "📅 ДД.ММ.ГГГГ   ⏰ ЧЧ:ММ   🗺 Город рождения\n\n" +
        "Пример: 01.01.2000 10:00 Москва"
    );
  });

  // расчёт бесплатной карты
  bot.hears(isValidNatal, async (ctx) => {
    const t0 = Date.now();
    const u = ctx.from.username || ctx.from.id;
    logger.info(`[free-req] @${u}: ${ctx.message.text}`);

    await ctx.reply("🔭 Сканирую звёзды…");

    const prompt =
      `Напиши ёмкую (≤ 1200 симв.) натальную карту для человека, родившегося ${ctx.message.text.trim()}.\n` +
      "Выведи *семь* нумерованных блоков, каждый до трёх строк:\n" +
      "1. ☀️ Солнце — база личности\n" +
      "2. 🌙 Луна — эмоции\n" +
      "3. 🡱 Асцендент — впечатление\n" +
      "4. 💠 Сев. узел — карма-курс\n" +
      "5. 🎨 Таланты и хобби\n" +
      "6. 🧘 Здоровье и ресурс\n" +
      "7. 🌀 Внутренний конфликт\n\n" +
      "Не упоминай любовь/брак/секс/семью/детей/карьеру/деньги/совместимость/Венеру/12 дом.\n" +
      "Без markdown-звёздочек, только обычный текст и эмодзи.\n\n" +
      "Закрой вывод одной строкой:\n" +
      "—\n" +
      "✨ В итоге: (одно предложение)\n\n" +
      "После итога добавь мотивационную строку:\n" +
      "💎 Хочешь узнать о любви, деньгах или совместимости? Жми красные кнопки выше!";

    let ok = false,
      err;
    for (const model of MODELS) {
      try {
        const { data } = await axios.post(
          "https://openrouter.ai/api/v1/chat/completions",
          { model, messages: [{ role: "user", content: prompt }] },
          {
            headers: {
              Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
              "HTTP-Referer": `https://t.me/${process.env.BOT_USERNAME}`,
              "Content-Type": "application/json",
            },
          }
        );
        await ctx.reply(
          data.choices?.[0]?.message?.content?.trim() || "🌌 Звёзды молчат…"
        );
        logger.info(`[free-ok ] @${u}: ${model} | ${Date.now() - t0} мс`);
        ok = true;
        break;
      } catch (e) {
        err = e;
        logger.warn(`[free-sw ] ${model} ⇒ ${e.response?.status || e.message}`);
      }
    }
    if (!ok) {
      logger.error(`[free-fail] @${u}: ${err?.message}`);
      ctx.reply("🛠️ Космос недоступен. Попробуй позже.");
    }
  });

  // fallback-ответ на неправильный формат
  bot.on("text", (ctx, n) =>
    isValidNatal(ctx.message.text)
      ? n()
      : ctx.reply("🤔 Формат неверный. Пример:\n01.01.2000 10:00 Москва")
  );
};

// // бесплатные функции клиента (натальная карта)

// const axios = require("axios");
// const { DateTime } = require("luxon");
// const { Markup } = require("telegraf");
// const logger = require("../logger");

// // ──────── Валидация ────────
// const natalReg = /^\d{2}\.\d{2}\.\d{4}\s+\d{2}:\d{2}\s+.+$/;
// function isValidNatal(text) {
//   if (!natalReg.test(text.trim())) return false;
//   const [dateStr, timeStr] = text.split(/\s+/);
//   const dt = DateTime.fromFormat(`${dateStr} ${timeStr}`, "dd.MM.yyyy HH:mm");
//   return dt.isValid;
// }

// // ──────── Цепочка моделей ────────
// const MODEL_CHAIN = [
//   "openrouter/auto",
//   "mistralai/mistral-7b-instruct",
//   "anthropic/claude-3-haiku-20240307",
// ];

// // ────────────────────────────────
// module.exports = (bot) => {
//   // /start — нейтральное приветствие + кнопки
//   bot.start((ctx) => {
//     ctx.reply(
//       "Выберите, что нужно:",
//       Markup.inlineKeyboard([
//         [Markup.button.callback("🔮 Общая (бесплатно)", "natal_start")],
//         [Markup.button.callback("❤️ Совместимость (платно)", "compat_start")],
//       ])
//     );
//   });

//   // кнопка «Общая (бесплатно)»
//   bot.action("natal_start", async (ctx) => {
//     await ctx.answerCbQuery();
//     ctx.reply(
//       "Чтобы я составил твою натальную карту, пришли данные в формате:\n\n" +
//         "📅 ДД.ММ.ГГГГ ⏰ ЧЧ:ММ 🗺️ Город\n\n" +
//         "Напр.: 01.01.2000 10:00 Москва"
//     );
//   });

//   // натальная карта
//   bot.hears(isValidNatal, async (ctx) => {
//     const tsStart = Date.now();
//     const { id, username, first_name, last_name } = ctx.from;

//     logger.info(`📥 @${username || id}: ${ctx.message.text}`);

//     await ctx.reply("🔭 Составляю карту звёзд...");

//     const userInput = ctx.message.text.trim();
//     const prompt = `**Не используй никакие языки, кроме русcкого.** Составь краткую натальную карту для человека, родившегося ${userInput}. Укажи:

// ☀️ Солнце — знак и влияние
// 🌙 Луна — знак и особенности
// 🧠 Меркурий — стиль мышления
// 🔥 Марс — энергия и мотивация

// Не упоминай любовь, секс, деньги, финансы, совместимость, венеру и 12 дом. Говори тепло, по-дружески, без эзотерики. Используй смайлики, говори кратко и по делу.

// В конце добавь вывод:
// —
// ✨ В итоге: ... (главный итог о человеке)
// `;

//     let sent = false;
//     let lastErr = null;

//     for (const model of MODEL_CHAIN) {
//       try {
//         const { data } = await axios.post(
//           "https://openrouter.ai/api/v1/chat/completions",
//           {
//             model,
//             messages: [
//               {
//                 role: "system",
//                 content:
//                   "Ты астролог, который пишет по-человечески. Используешь смайлики, пиши строго в заданном шаблоне.",
//               },
//               { role: "user", content: prompt },
//             ],
//           },
//           {
//             headers: {
//               Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
//               "HTTP-Referer": `https://t.me/${process.env.BOT_USERNAME}`,
//               "Content-Type": "application/json",
//             },
//           }
//         );

//         const out =
//           data.choices?.[0]?.message?.content?.trim() ||
//           "🌌 Звёзды молчат. Попробуй позже.";

//         await ctx.reply(out);

//         logger.info(
//           `📤 @${username || id}: ${model} | ${Date.now() - tsStart} мс`
//         );

//         sent = true;
//         break;
//       } catch (e) {
//         lastErr = e;
//         logger.warn(
//           { model, err: e.response?.status || e.message },
//           "⚠️ Модель не сработала, переключаюсь"
//         );
//       }
//     }

//     if (!sent) {
//       logger.error(
//         { userId: id, err: lastErr?.response?.data || lastErr?.message },
//         "❌ Все модели упали"
//       );
//       ctx.reply("🛠️ Звёзды недоступны. Попробуй позже.");
//     }
//   });

//   // если текст, но невалиден
//   bot.on("text", (ctx, next) => {
//     if (!isValidNatal(ctx.message.text)) {
//       return ctx.reply(
//         "🤔 Формат неверный. Используй: ДД.ММ.ГГГГ ЧЧ:ММ Город\nНапр.: 01.01.2000 10:00 Москва"
//       );
//     }
//     return next();
//   });
// };
