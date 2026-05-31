const { Telegraf } = require("telegraf");
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const minify = require("html-minifier-terser").minify;

// ⚠️ TOKEN Railway থেকে আসবে
const bot = new Telegraf(process.env.BOT_TOKEN);

// 🔐 Start message
bot.start((ctx) => ctx.reply("🤖 Bot is running... Send HTML file"));

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

// 📁 File receive handler + loading system
bot.on("document", async (ctx) => {
  try {
    // ⏳ Loading message (FIXED multiline)
    await ctx.reply(
`⏳ আপনার ফাইল প্রসেস করা হচ্ছে...
📁 ফাইলটি ইনক্রিপ্ট করা হচ্ছে...
⏳ অনুগ্রহ করে 10 সেকেন্ড অপেক্ষা করুন
✅ RAFSAN TEAM এর সাথে থাকার জন্য ধন্যবাদ!`
    );

    const fileLink = await ctx.telegram.getFileLink(
      ctx.message.document.file_id
    );

    const res = await axios.get(fileLink.href);
    const html = res.data;

    const output = await obfuscate(html);

    const filePath = path.join(__dirname, "output.html");
    await fs.writeFile(filePath, output);

    // ⏳ delay effect
    await new Promise(r => setTimeout(r, 10000));

    await ctx.replyWithDocument({ source: filePath });

  } catch (err) {
    console.log(err);
    ctx.reply("❌ Error processing file");
  }
});

bot.launch();
console.log("Bot running...");
