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

// 📁 File receive handler + loading system
bot.on("document", async (ctx) => {
  try {
    // ⏳ loading message
    await ctx.reply("⏳ আপনার ফাইল প্রসেস করা হচ্ছে... অনুগ্রহ করে 10 সেকেন্ড অপেক্ষা করুন
 ফাইলটি ইনক্রিপ্ট মারা হচ্ছে
 এবং RAFSAN TEAM এর সাথে থাকুন ধন্যবাদ.!✅");

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
