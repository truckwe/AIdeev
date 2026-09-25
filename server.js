const TelegramBot = require("node-telegram-bot-api");
const { GoogleGenAI } = require("@google/genai");

const BOT_TOKEN = process.env.BOT_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!BOT_TOKEN) {
    console.error("❌ BOT_TOKEN не найден");
    process.exit(1);
}

if (!GEMINI_API_KEY) {
    console.error("❌ GEMINI_API_KEY не найден");
    process.exit(1);
}

const bot = new TelegramBot(BOT_TOKEN, {
    polling: true
});

const ai = new GoogleGenAI({
    apiKey: GEMINI_API_KEY
});

console.log("🤖 AIdeev2 запущен!");

// =========================
// START
// =========================

bot.onText(/^\/start$/, async (msg) => {
    const chatId = msg.chat.id;

    await bot.sendMessage(
        chatId,
        "👋 Привет! Я AIdeev2.\n\n" +
        "🎬 Генерация видео через Gemini Omni.\n\n" +
        "Команда:\n" +
        "/omni описание видео\n\n" +
        "Пример:\n" +
        "/omni cat is dancing"
    );
});

// =========================
// HELP
// =========================

bot.onText(/^\/help$/, async (msg) => {
    const chatId = msg.chat.id;

    await bot.sendMessage(
        chatId,
        "🎬 AIdeev2\n\n" +
        "/omni описание — создать видео\n\n" +
        "Пример:\n" +
        "/omni cat is dancing"
    );
});

// =========================
// OMNI
// =========================

bot.onText(/^\/omni(?:\s+([\s\S]+))?$/, async (msg, match) => {
    const chatId = msg.chat.id;
    const prompt = match && match[1]
        ? match[1].trim()
        : "";

    if (!prompt) {
        await bot.sendMessage(
            chatId,
            "❌ Напиши описание видео.\n\n" +
            "Пример:\n" +
            "/omni cat is dancing"
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

        const interaction = await ai.interactions.create({
            model: "gemini-omni-1.1-flash",
            input: prompt,
            response_format: {
                type: "video",
                resolution: "360p"
            }
        });

        console.log("✅ Gemini ответил");

        if (!interaction.output_video?.data) {
            console.log(
                "Gemini response:",
                JSON.stringify(interaction, null, 2)
            );

            throw new Error("Google не вернул видео.");
        }

        const videoBuffer = Buffer.from(
            interaction.output_video.data,
            "base64"
        );

        await bot.sendVideo(
            chatId,
            videoBuffer,
            {
                caption:
                    "🎬 Готово!\n\n" +
                    "🤖 AIdeev2 • Gemini Omni\n" +
                    "📺 360p"
            },
            {
                filename: "aideev2.mp4",
                contentType: "video/mp4"
            }
        );

        console.log("🎥 Видео отправлено!");

    } catch (error) {
        console.error("❌ GEMINI ERROR:", error);

        const errorText =
            error?.message || String(error);

        await bot.sendMessage(
            chatId,
            "❌ Ошибка Gemini:\n\n" +
            errorText.slice(0, 3500)
        );
    }
});

// =========================
// TELEGRAM ERRORS
// =========================

bot.on("polling_error", (error) => {
    console.error(
        "❌ Telegram polling error:",
        error.message
    );
});