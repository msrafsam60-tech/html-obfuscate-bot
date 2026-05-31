const { Telegraf } = require("telegraf");
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const minify = require("html-minifier-terser").minify;

// ⚠️ TOKEN Railway থেকে আসবে
const bot = new Telegraf(process.env.BOT_TOKEN);

// 🔐 HTML obfuscation function
async function obfuscate(html) {
  let clean = await minify(html, {
    collapseWhitespace: true,
    removeComments: true
  });

  let base64 = Buffer.from(clean).toString("base64");

  return `
<!DOCTYPE html>
<html>
<body>
<script>
document.write(atob("${base64}"));
</script>
</body>
</html>
  `;
}

// 📁 File receive handler
bot.on("document", async (ctx) => {
  try {
    const fileLink = await ctx.telegram.getFileLink(
      ctx.message.document.file_id
    );

    const res = await axios.get(fileLink.href);
    const html = res.data;

    const output = await obfuscate(html);

    const filePath = path.join(__dirname, "output.html");
    await fs.writeFile(filePath, output);

    await ctx.replyWithDocument({ source: filePath });

  } catch (err) {
    console.log(err);
    ctx.reply("Error processing file");
  }
});

bot.launch();
console.log("Bot running...");
