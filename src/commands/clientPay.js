// ───────────────────────────────────────────────────────────
// ПЛАТНЫЕ КНОПКИ: Любовь, Карьера, Совместимость
// ───────────────────────────────────────────────────────────
const { Markup } = require("telegraf");

const PAY_TEXT = (topic) =>
  `💳 Для получения *${topic}* переведите 10 ₽ на карту:\n\n` +
  `2202 2006 1234 5678\n\n` +
  `Затем пришлите сюда скриншот или чек 👇`;

module.exports = (bot) => {
  // ——— Любовь
  bot.action("love_start", async (ctx) => {
    await ctx.answerCbQuery();
    ctx.reply(
      PAY_TEXT("астро-разбора по любви и отношениям") +
        `\n\n🔻 Что понадобится после оплаты:\n` +
        `• Ваши данные: *ДД.ММ.ГГГГ ЧЧ:ММ Город*`,
      { parse_mode: "Markdown" }
    );
  });

  // ——— Карьера
  bot.action("career_start", async (ctx) => {
    await ctx.answerCbQuery();
    ctx.reply(
      PAY_TEXT("карьерного и финансового прогноза") +
        `\n\n🔻 После оплаты пришлите:\n` +
        `• Ваши данные: *ДД.ММ.ГГГГ ЧЧ:ММ Город*\n` +
        `• Кратко: чем занимаетесь и что хотите узнать`,
      { parse_mode: "Markdown" }
    );
  });

  // ——— Совместимость
  bot.action("compat_start", async (ctx) => {
    await ctx.answerCbQuery();
    ctx.reply(
      PAY_TEXT("анализа совместимости") +
        `\n\n🔻 После оплаты пришлите одним сообщением:\n` +
        `• *Ваши* данные: ДД.ММ.ГГГГ ЧЧ:ММ Город\n` +
        `&\n` +
        `• *Партнёра*: ДД.ММ.ГГГГ ЧЧ:ММ Город\n\n` +
        `_Пример_: 10.04.1995 09:30 Смоленск & 25.12.1996 14:45 Казань`,
      { parse_mode: "Markdown" }
    );
  });

  // ——— Чек / скрин
  bot.on(["photo", "document"], async (ctx) => {
    const ADMIN_ID = process.env.ADMIN_ID;

    await ctx.reply(
      "📩 Чек принят! Проверю и открою доступ при подтверждении."
    );
    await ctx.forwardMessage(ADMIN_ID);

    await bot.telegram.sendMessage(
      ADMIN_ID,
      `🧾 Новый чек от @${ctx.from.username || "неизвестен"} (ID: ${
        ctx.from.id
      })`,
      Markup.inlineKeyboard([
        [
          Markup.button.callback("✔️ Подтвердить", `grant_ok_${ctx.from.id}`),
          Markup.button.callback("❌ Отклонить", `grant_no_${ctx.from.id}`),
        ],
      ])
    );
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
