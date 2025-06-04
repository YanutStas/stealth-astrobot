// ───────── FREE natals ─────────
const axios = require("axios");
const { DateTime } = require("luxon");
const { Markup } = require("telegraf");
const logger = require("../logger");

// — валидация одной карты
const natalReg = /^\d{2}\.\d{2}\.\d{4}\s+\d{2}:\d{2}\s+.+$/;
const isValid = (t) =>
  natalReg.test(t.trim()) &&
  DateTime.fromFormat(t.split(/\s+/).slice(0, 2).join(" "), "dd.MM.yyyy HH:mm")
    .isValid;

// — совпадение двух карт (нужно, чтобы free-хендлер пропускал)
const dualReg = /^\s*\d{2}\.\d{2}\.\d{4}\s+\d{2}:\d{2}\s+.+?\s*&/;

// — модели
const MODELS = [
  "openrouter/auto",
  "mistralai/mistral-7b-instruct",
  "anthropic/claude-3-haiku-20240307",
];

module.exports = (bot) => {
  // /start
  bot.start((ctx) => {
    const n = ctx.from.first_name || "друг";
    ctx.reply(
      `🌌 Привет, ${n}! Готов расшифровать твой космический паспорт.\n` +
        `Куда заглянем?`,
      Markup.inlineKeyboard([
        [Markup.button.callback("🔮 Общая (бесплатно)", "natal_start")],
        [Markup.button.callback("💞 Любовь (платно) ПОКА ХУЁВО РАБОТАЕТ", "love_start")],
        [Markup.button.callback("💼 Карьера (платно) ПОКА ХУЁВО РАБОТАЕТ", "career_start")],
        [Markup.button.callback("❤️ Совместимость (платно)", "compat_start")],
      ])
    );
  });

  bot.action("natal_start", async (ctx) => {
    await ctx.answerCbQuery();
    ctx.reply(
      "Пришли данные в формате:\n" +
        "📅 ДД.MM.ГГГГ ⏰ ЧЧ:ММ 🗺 Город\n\n" +
        "Пример: 01.01.2000 10:00 Москва"
    );
  });

  // --- FREE анализ
  bot.hears(
    async (text) => isValid(text) && !dualReg.test(text),
    async (ctx) => {
      const t0 = Date.now(),
        u = ctx.from.username || ctx.from.id;
      logger.info(`[free-req] @${u}: ${ctx.message.text}`);

      await ctx.reply("🔭 Сканирую звёзды…");

      const prompt = `Выведи краткий (до 1200 симв.) анализ по 7 пунктам.
Формат строго:
1. ☀️ ...
2. 🌙 ...
3. 🡱 ...
4. 💠 ...
5. 🎨 ...
6. 🧘 ...
7. 🔶 ...

Затем строка:
—
✨ В итоге: ...

Без упоминаний любви, денег, карьеры, совместимости. Только русский язык, эмодзи приветствуются.
Данные рождения: ${ctx.message.text.trim()}`;

      let ok = false,
        err;
      for (const m of MODELS) {
        try {
          const { data } = await axios.post(
            "https://openrouter.ai/api/v1/chat/completions",
            { model: m, messages: [{ role: "user", content: prompt }] },
            {
              headers: {
                Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
              },
            }
          );
          await ctx.reply(
            data.choices?.[0]?.message?.content?.trim() || "🌌 Звёзды молчат…"
          );
          logger.info(`[free-ok ] @${u}|${m}|${Date.now() - t0}мс`);
          ok = true;
          break;
        } catch (e) {
          err = e;
          logger.warn(`[free-swap] ${m}❌`);
        }
      }
      if (!ok) {
        logger.error(`[free-fail] @${u}: ${err?.message}`);
        ctx.reply("🛠️ Космос недоступен. Попробуй позже.");
      }
    }
  );

  // неверный формат
  bot.on("text", (c, n) =>
    isValid(c.message.text) || dualReg.test(c.message.text)
      ? n()
      : c.reply("🤔 Формат неверный. Пример:\n01.01.2000 10:00 Москва")
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
