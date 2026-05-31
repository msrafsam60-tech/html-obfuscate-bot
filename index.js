const { Telegraf } = require("telegraf");
const minify = require("html-minifier-terser").minify;

const bot = new Telegraf("8278978702:AAGKmhgNQRQmwoAkhMaW7UJ7QibZeZoNq5M");

async function obfuscate(html) {
  let clean = await minify(html, {
    collapseWhitespace: true,
    removeComments: true
  });

  let base64 = Buffer.from(clean).toString("base64");

  return `<script>document.write(atob("${base64}"));</script>`;
}

bot.on("text", async (ctx) => {
  try {
    let result = await obfuscate(ctx.message.text);
    ctx.reply(result);
  } catch {
    ctx.reply("Error");
  }
});

bot.launch();
