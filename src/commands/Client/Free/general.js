const axios = require("axios");
const { DateTime } = require("luxon");
const { Markup } = require("telegraf");
const logger = require("../../logger");

// валидный шаблон одной карты
const natalReg = /^\d{2}\.\d{2}\.\d{4}\s+\d{2}:\d{2}\s+.+$/;
const isValid = (t) =>
  natalReg.test(t.trim()) &&
  DateTime.fromFormat(t.split(/\s+/).slice(0, 2).join(" "), "dd.MM.yyyy HH:mm")
    .isValid;

// чтобы не ловить платные сообщения «&»
const dualReg = /&/;
const MODELS = [
  "openrouter/auto",
  "mistralai/mistral-7b-instruct",
  "anthropic/claude-3-haiku-20240307",
];

module.exports = (bot) => {
  bot.action("general_start", async (ctx) => {
    await ctx.answerCbQuery();
    ctx.reply(
      "Чтобы я составил твою *натальную карту*, пришли данные так:\n\n" +
        "📅 ДД.MM.ГГГГ  ⏰ ЧЧ:ММ  🗺 Город\n\n" +
        "Пример: 01.01.2000 10:00 Москва",
      { parse_mode: "Markdown" }
    );
  });

  // основная логика
  bot.hears(
    async (txt) => isValid(txt) && !dualReg.test(txt),
    async (ctx) => {
      const t0 = Date.now(),
        id = ctx.from.id,
        user = ctx.from.username || id;
      logger.info(`[free] запрос @${user}`);

      await ctx.reply("🔭 Сканирую звёзды…");

      const prompt = `Сделай краткий, дружелюбный отчёт (не более 1200 сим) по 7 пунктам:
1. ☀️ Солнце — характер  
2. 🌙 Луна — эмоции  
3. 🡱 Асцендент — внешнее «я»  
4. 🔎 Опыт и знания  
5. 🎨 Таланты и хобби  
6. 🧘 Здоровье и ресурс  
7. 🌀 Внутренний конфликт  

Затем строка:
—
✨ В итоге: (1-2 предложения резюме)

*Запрещено* упоминать любовь/отношения, деньги/карьеру и совместимость.
Только русский, можно эмодзи.
Дата рождения: ${ctx.message.text.trim()}`;

      let sent = false;
      for (const model of MODELS) {
        try {
          const { data } = await axios.post(
            "https://openrouter.ai/api/v1/chat/completions",
            { model, messages: [{ role: "user", content: prompt }] },
            {
              headers: {
                Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
              },
            }
          );
          await ctx.reply(
            data.choices?.[0]?.message?.content?.trim() +
              "\n\n💎 *Хочешь узнать о любви, деньгах или совместимости?* Нажми соответствующую платную кнопку!",
            { parse_mode: "Markdown" }
          );
          logger.info(`[free] ok ${model} ${Date.now() - t0}мс`);
          sent = true;
          break;
        } catch {
          logger.warn(`[free] swap ${model}`);
        }
      }
      if (!sent) ctx.reply("🛠️ Космос молчит. Попробуй позже.");
    }
  );
};
