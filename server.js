const TelegramBot = require("node-telegram-bot-api");
const { GoogleGenAI } = require("@google/genai");

const telegramToken = process.env.BOT_TOKEN;
const geminiKey = process.env.GEMINI_API_KEY;

if (!telegramToken) {
    console.error("❌ BOT_TOKEN не найден!");
    process.exit(1);
}

if (!geminiKey) {
    console.error("❌ GEMINI_API_KEY не найден!");
    process.exit(1);
}

const bot = new TelegramBot(telegramToken, {
    polling: true
});

const ai = new GoogleGenAI({
    apiKey: geminiKey
});

console.log("🤖 AIdeev2 запущен!");

// =========================
// START
// =========================

bot.onText(/^\/start$/, async (msg) => {
    await bot.sendMessage(
        msg.chat.id,
        "🤖 Добро пожаловать в AIdeev2!\n\n" +
        "🎬 Я умею генерировать видео.\n\n" +
        "Команда:\n" +
        "/omni <описание видео>\n\n" +
        "Пример:\n" +
        "/omni кот идёт по ночному Токио"
    );
});

// =========================
// HELP
// =========================

bot.onText(/^\/help$/, async (msg) => {
    await bot.sendMessage(
        msg.chat.id,
        "ℹ️ AIdeev2\n\n" +
        "🎬 Генерация видео через Gemini Omni.\n\n" +
        "Используй:\n" +
        "/omni <prompt>\n\n" +
        "Пример:\n" +
        "/omni космонавт летит над Марсом"
    );
});

// =========================
// OMNI VIDEO
// =========================

bot.onText(/^\/omni(?:\s+([\s\S]+))?$/, async (msg, match) => {
    const chatId = msg.chat.id;
    const prompt = match && match[1] ? match[1].trim() : "";

    if (!prompt) {
        await bot.sendMessage(
            chatId,
            "❌ Напиши описание видео.\n\n" +
            "Пример:\n" +
            "/omni кот идёт по ночному Токио"
        );
        return;
    }

    await bot.sendMessage(
        chatId,
        "🎬 Начинаю генерацию...\n\n" +
        "📝 " + prompt + "\n\n" +
        "⏳ Это может занять некоторое время."
    );

    try {
        console.log("🎬 Генерация:", prompt);

        const response = await ai.interactions.create({
            model: "gemini-omni-1.1-flash",
            input: prompt,
            response_format: {
                type: "video",
                resolution: "360p"
            }
        });

        console.log("✅ Ответ Gemini получен");

        let videoData = null;

        if (response && response.outputs) {
            for (const output of response.outputs) {
                if (
                    output &&
                    output.type === "video" &&
                    output.video
                ) {
                    videoData = output.video;
                    break;
                }
            }
        }

        if (!videoData) {
            console.error("❌ Видео не найдено:", response);

            await bot.sendMessage(
                chatId,
                "❌ Gemini не вернул видео."
            );

            return;
        }

        const buffer = Buffer.from(videoData, "base64");

        await bot.sendVideo(
            chatId,
            buffer,
            {
                caption: "🎬 Готово!\n\n🤖 AIdeev2 • Gemini Omni"
            },
            {
                filename: "aideev2.mp4",
                contentType: "video/mp4"
            }
        );

        console.log("🎥 Видео отправлено");

    } catch (error) {
        console.error("❌ Ошибка Gemini:", error);

        await bot.sendMessage(
            chatId,
            "❌ Не удалось сгенерировать видео.\n\n" +
            "Проверь API Gemini и попробуй ещё раз."
        );
    }
});

// =========================
// IGNORE OTHER COMMANDS
// =========================

bot.on("message", async (msg) => {
    if (!msg.text) return;

    if (msg.text.startsWith("/")) return;
});

// =========================
// SHUTDOWN
// =========================

process.on("SIGINT", () => {
    bot.stopPolling();
    process.exit(0);
});

process.on("SIGTERM", () => {
    bot.stopPolling();
    process.exit(0);
});