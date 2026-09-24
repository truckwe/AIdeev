const TelegramBot = require("node-telegram-bot-api");

const token = process.env.BOT_TOKEN;

if (!token) {
console.error("❌ BOT_TOKEN не найден в Environment Variables");
process.exit(1);
}

const bot = new TelegramBot(token, {
polling: true
});

console.log("🤖 AIdeev2 Telegram Bot запущен!");

bot.onText(//start/, async (msg) => {
const chatId = msg.chat.id;

await bot.sendMessage(
    chatId,
    `🤖 Добро пожаловать в AIdeev2!

🎬 Здесь скоро можно будет генерировать видео с помощью AI.

Команды:
/start — запустить бота
/help — помощь

🚀 Генерация видео будет подключена следующим этапом.`
);
});

bot.onText(//help/, async (msg) => {
const chatId = msg.chat.id;

await bot.sendMessage(
    chatId,
    `ℹ️ AIdeev2

Пока доступна тестовая версия бота.

🎬 Скоро:
• Seedance
• Google Veo
• другие AI-модели`
);
});

bot.on("message", async (msg) => {
if (!msg.text) return;
if (msg.text.startsWith("/")) return;

await bot.sendMessage(
    msg.chat.id,
    "🤖 AIdeev2 получил сообщение!\n\n🎬 Генерация видео пока подключается."
);

});

process.on("SIGINT", () => {
bot.stopPolling();
process.exit(0);
});

process.on("SIGTERM", () => {
bot.stopPolling();
process.exit(0);
});