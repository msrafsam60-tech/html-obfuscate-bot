const { Telegraf } = require("telegraf");
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const minify = require("html-minifier-terser").minify;

// TOKEN Railway থেকে আসবে
const bot = new Telegraf(process.env.BOT_TOKEN);

// তোমার Telegram User ID বসাও
const ADMIN_ID =6753121703 ;

// Stats
const users = new Set();
let totalFiles = 0;

// Start
bot.start((ctx) => {
ctx.reply("🤖 Bot is running... Send HTML file");
});

// HTML Obfuscation
async function obfuscate(html) {
let clean = await minify(html, {
collapseWhitespace: true,
removeComments: true
});

let base64 = Buffer.from(clean).toString("base64");

return `

<!DOCTYPE html><html>
<body>
<script>
document.write(atob("${base64}"));
</script>
</body>
</html>
  `;
}// Admin Stats
bot.command("stats", async (ctx) => {
if (ctx.from.id !== ADMIN_ID) return;

await ctx.reply(
`📊 Bot Statistics

👥 Total Users: ${users.size}
📁 Total Files Processed: ${totalFiles}`
);
});

// File Handler
bot.on("document", async (ctx) => {
users.add(ctx.from.id);
totalFiles++;

try {
// Admin Notification
if (ADMIN_ID) {
await bot.telegram.sendMessage(
ADMIN_ID,
`📁 New File Upload

👤 User: ${ctx.from.first_name || "Unknown"}
🆔 ID: ${ctx.from.id}
📄 File: ${ctx.message.document.file_name || "Unknown"}`
);
}

await ctx.reply(

"⏳ আপনার ফাইল প্রসেস করা হচ্ছে... 📁 ফাইলটি ইনক্রিপ্ট করা হচ্ছে... ⏳ অনুগ্রহ করে 10 সেকেন্ড অপেক্ষা করুন ✅ RAFSAN TEAM এর সাথে থাকার জন্য ধন্যবাদ!"
);

const fileLink = await ctx.telegram.getFileLink(
  ctx.message.document.file_id
);

const res = await axios.get(fileLink.href);
const html = res.data;

const output = await obfuscate(html);

const filePath = path.join(__dirname, "output.html");
await fs.writeFile(filePath, output);

await new Promise((r) => setTimeout(r, 10000));

await ctx.replyWithDocument({
  source: filePath
});

} catch (err) {
console.log(err);
ctx.reply("❌ Error processing file");
}
});

bot.launch();
console.log("Bot running...");
