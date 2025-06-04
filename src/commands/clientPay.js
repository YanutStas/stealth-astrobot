// ───────────────────────────────────────────────────────────
// ПЛАТНЫЕ КНОПКИ / совместимость + логирование
// ───────────────────────────────────────────────────────────
const axios = require("axios");
const { Markup } = require("telegraf");
const logger = require("../logger");

const cardInfo = "2202 2006 1234 5678";

const payMsg = (what) =>
  `💳 Чтобы получить *${what}*, переведите 10 ₽ на карту:\n\n${cardInfo}\n\n` +
  "Затем пришлите сюда скриншот или чек 👇";

module.exports = (bot) => {
  // Кнопки оплаты
  bot.action("love_start", async (ctx) => {
    await ctx.answerCbQuery();
    ctx.reply(payMsg("разбор любви"), { parse_mode: "Markdown" });
  });
  bot.action("career_start", async (ctx) => {
    await ctx.answerCbQuery();
    ctx.reply(payMsg("карьерный прогноз"), { parse_mode: "Markdown" });
  });
  bot.action("compat_start", async (ctx) => {
    await ctx.answerCbQuery();
    ctx.reply(payMsg("анализ совместимости"), { parse_mode: "Markdown" });
  });

  // чек → админ
  bot.on(["photo", "document"], async (ctx) => {
    await ctx.reply(
      "📩 Чек принят! Открою доступ, как только Админ подтвердит."
    );
    await ctx.forwardMessage(process.env.ADMIN_ID);
    await bot.telegram.sendMessage(
      process.env.ADMIN_ID,
      `🧾 Чек от @${ctx.from.username || "anon"} (ID: ${ctx.from.id})`,
      Markup.inlineKeyboard([
        [
          Markup.button.callback("✔️ Подтвердить", `grant_ok_${ctx.from.id}`),
          Markup.button.callback("❌ Отклонить", `grant_no_${ctx.from.id}`),
        ],
      ])
    );
  });

  // ====== ПЛАТНАЯ СОВМЕСТИМОСТЬ ======
  const dualReg =
    /^\s*(\d{2}\.\d{2}\.\d{4}\s+\d{2}:\d{2}\s+.+?)\s*&\s*(\d{2}\.\d{2}\.\d{4}\s+\d{2}:\d{2}\s+.+)$/;
  bot.hears(dualReg, async (ctx) => {
    const [, p1, p2] = ctx.message.text.match(dualReg);
    const t0 = Date.now(),
      u = ctx.from.username || ctx.from.id;
    logger.info(`[compat-req] @${u}`);

    await ctx.reply("💞 Проверяю химический состав отношений…");

    const prompt =
      `Сделай краткий (до 1800 симв.) анализ *совместимости* пары:\n` +
      `• Партнёр А: ${p1}\n• Партнёр Б: ${p2}\n\n` +
      "Выведи 5 блоков не длиннее 3-х строк:\n" +
      "1. 🌟 Общее впечатление пары\n" +
      "2. 💗 Эмоции и быт\n" +
      "3. 🔥 Интим / страсть\n" +
      "4. 🤝 Конфликты и рост\n" +
      "5. ✨ Потенциал на год вперёд\n\n" +
      "Заверши одной фразой-советом.\n" +
      "Только русский язык, эмодзи приветствуются, markdown не нужен.";

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
        data.choices?.[0]?.message?.content?.trim() ||
          "🌌 Совместимость пока не ясна, попробуйте позже"
      );
      logger.info(`[compat-ok ] @${u} | ${Date.now() - t0} мс`);
    } catch (e) {
      logger.error(`[compat-fail] ${e.message}`);
      ctx.reply("🛠️ Не смог рассчитать совместимость. Попробуй позже.");
    }
  });
};

// // платная функция «Совместимость»

// const { Markup } = require("telegraf");

// module.exports = (bot) => {
//   // кнопка «Совместимость (платно)» из меню
//   bot.action("compat_start", async (ctx) => {
//     await ctx.answerCbQuery();
//     ctx.reply(
//       "💳 Для получения совместимости отправь 10 ₽ на карту:\n\n" +
//         "2202 2006 1234 5678\n\n" +
//         "Затем пришли скриншот или чек сюда 👇"
//     );
//   });

//   // /compat — если пользователь набрал вручную
//   bot.command("compat", (ctx) => {
//     ctx.reply(
//       "💳 Для получения совместимости отправь 10 ₽ на карту:\n\n" +
//         "2202 2006 1234 5678\n\n" +
//         "Затем пришли скриншот или чек сюда 👇"
//     );
//   });

//   // приём чеков (фото/док)
//   bot.on(["photo", "document"], async (ctx) => {
//     const user = ctx.from;

//     // сообщаем пользователю
//     await ctx.reply(
//       "📩 Чек получен! Проверю и дам знать, как только оплата подтвердится."
//     );

//     // пересылаем картинку админу
//     const fwdMsg = await ctx.forwardMessage(process.env.ADMIN_ID);

//     // под пересланным сообщением — кнопки для админа
//     await bot.telegram.sendMessage(
//       process.env.ADMIN_ID,
//       `🧾 Чек от @${user.username || "неизвестен"} (ID: ${user.id})`,
//       Markup.inlineKeyboard([
//         Markup.button.callback("✅ Подтверждено", `grant_ok_${user.id}`),
//         Markup.button.callback("❌ Не подтверждено", `grant_no_${user.id}`),
//       ])
//     );
//   });
// };
