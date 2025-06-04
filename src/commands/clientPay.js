// ───────── PAY buttons & compatibility ─────────
const axios = require("axios");
const { Markup } = require("telegraf");
const logger = require("../logger");

const card = "2202 2006 1234 5678";
const MODE = "openrouter/auto";

// — после оплаты чек → админ
function payMsg(what) {
  return (
    `💳 Чтобы получить *${what}*, переведите 10 ₽ на карту:\n\n${card}\n\n` +
    "Потом пришлите сюда скриншот или чек 👇"
  );
}

module.exports = (bot) => {
  // кнопки оплаты
  bot.action("love_start", async (c) => {
    await c.answerCbQuery();
    c.reply(payMsg("анализ любви"), { parse_mode: "Markdown" });
  });
  bot.action("career_start", async (c) => {
    await c.answerCbQuery();
    c.reply(payMsg("карьерный прогноз"), { parse_mode: "Markdown" });
  });
  bot.action("compat_start", async (c) => {
    await c.answerCbQuery();
    c.reply(payMsg("анализ совместимости"), { parse_mode: "Markdown" });
  });

  // чек
  bot.on(["photo", "document"], async (ctx) => {
    await ctx.reply("📩 Чек принят! Открою доступ после подтверждения.");
    await ctx.forwardMessage(process.env.ADMIN_ID);
    await bot.telegram.sendMessage(
      process.env.ADMIN_ID,
      `🧾 Чек от @${ctx.from.username || "anon"} (ID:${ctx.from.id})`,
      Markup.inlineKeyboard([
        [
          Markup.button.callback("✔️ Подтвердить", `grant_ok_${ctx.from.id}`),
          Markup.button.callback("❌ Отклонить", `grant_no_${ctx.from.id}`),
        ],
      ])
    );
  });

  // — совместимость (две карты)
  const dualReg =
    /^\s*(\d{2}\.\d{2}\.\d{4}\s+\d{2}:\d{2}\s+.+?)\s*&\s*(\d{2}\.\d{2}\.\d{4}\s+\d{2}:\d{2}\s+.+)$/;

  bot.hears(dualReg, async (ctx) => {
    const [, a, b] = ctx.message.text.match(dualReg);
    const t0 = Date.now(),
      u = ctx.from.username || ctx.from.id;
    logger.info(`[compat-req] @${u}`);

    await ctx.reply("💞 Сверяю звёздные паспорта пары…");

    const prompt = `Ты опытный астролог. Сделай анализ *совместимости* пары по пяти блокам (каждый ≤3 строки).

1. 🌟 Общее впечатление пары  
2. 💗 Эмоции и быт  
3. 🔥 Интим / страсть  
4. 🤝 Конфликты и рост  
5. ✨ Потенциал на год вперёд  

Стиль: дружелюбно, по-делу, смайлики можно. Markdown и списки не нужны.
Данные:
• Партнёр A: ${a}
• Партнёр B: ${b}`;

    try {
      const { data } = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          model: MODE,
          messages: [
            {
              role: "system",
              content: "Отвечай только по шаблону 1-5, без лишних тем.",
            },
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
        data.choices?.[0]?.message?.content?.trim() ||
          "🌌 Совместимость не читается, попробуйте позже"
      );
      logger.info(`[compat-ok ] @${u}|${Date.now() - t0}мс`);
    } catch (e) {
      logger.error(`[compat-fail] ${e.message}`);
      ctx.reply("🛠️ Не вышло рассчитать. Попробуйте позднее.");
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
