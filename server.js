const TelegramBot = require("node-telegram-bot-api");

const token = process.env.BOT_TOKEN;

if (!token) {
console.error("❌ BOT_TOKEN не найден!");
process.exit(1);
}

const bot = new TelegramBot(token, {
polling: true
});

console.log("🤖 AIdeev2 запущен!");

bot.onText(/^/start$/, async (msg) => {
const chatId = msg.chat.id;

await bot.sendMessage(
    chatId,
    "🤖 Добро пожаловать в AIdeev2!\n\n" +
    "🎬 AI-генерация видео скоро будет доступна.\n\n" +
    "Команды:\n" +
    "/start — запустить бота\n" +
    "/help — помощь"
);

});

bot.onText(/^/help$/, async (msg) => {
const chatId = msg.chat.id;

await bot.sendMessage(
    chatId,
    "ℹ️ AIdeev2\n\n" +
    "🎬 Скоро здесь появится генерация видео.\n" +
    "🔥 Seedance\n" +
    "🎥 Google Veo\n" +
    "🤖 Другие AI-модели"
);

});

bot.on("message", async (msg) => {
if (!msg.text) return;

if (msg.text.startsWith("/")) return;

await bot.sendMessage(
    msg.chat.id,
    "🤖 AIdeev2 получил сообщение!\n\n" +
    "🎬 Генерация видео пока находится в разработке."
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