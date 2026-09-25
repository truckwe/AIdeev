const http = require("http");
const TelegramBot = require("node-telegram-bot-api");
const { GoogleGenAI } = require("@google/genai");

// ========================================
// ENVIRONMENT VARIABLES
// ========================================

const BOT_TOKEN = process.env.BOT_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!BOT_TOKEN) {
    console.error("❌ BOT_TOKEN не найден!");
    process.exit(1);
}

if (!GEMINI_API_KEY) {
    console.error("❌ GEMINI_API_KEY не найден!");
    process.exit(1);
}

// ========================================
// RENDER HTTP SERVER
// ========================================

const PORT = process.env.PORT || 10000;

const server = http.createServer((req, res) => {
    res.writeHead(200, {
        "Content-Type": "text/plain; charset=utf-8"
    });

    res.end("AIdeev2 is running!");
});

server.listen(PORT, "0.0.0.0", () => {
    console.log(`🌐 HTTP server запущен на порту ${PORT}`);
});

// ========================================
// TELEGRAM
// ========================================

const bot = new TelegramBot(BOT_TOKEN, {
    polling: true
});

// ========================================
// GEMINI
// ========================================

const ai = new GoogleGenAI({
    apiKey: GEMINI_API_KEY
});

console.log("🤖 AIdeev2 запускается...");

// ========================================
// START
// ========================================

bot.onText(/^\/start$/, async (msg) => {
    const chatId = msg.chat.id;

    try {
        await bot.sendMessage(
            chatId,
            "👋 Привет! Я AIdeev2.\n\n" +
            "🎬 Я умею генерировать видео через Gemini Omni.\n\n" +
            "Команда:\n" +
            "/omni описание видео\n\n" +
            "Пример:\n" +
            "/omni cat is dancing"
        );
    } catch (error) {
        console.error("❌ START ERROR:", error);
    }
});

// ========================================
// HELP
// ========================================

bot.onText(/^\/help$/, async (msg) => {
    const chatId = msg.chat.id;

    try {
        await bot.sendMessage(
            chatId,
            "🎬 AIdeev2\n\n" +
            "/omni описание — создать видео\n\n" +
            "Пример:\n" +
            "/omni cat is dancing"
        );
    } catch (error) {
        console.error("❌ HELP ERROR:", error);
    }
});

// ========================================
// OMNI VIDEO
// ========================================

bot.onText(/^\/omni(?:\s+([\s\S]+))?$/, async (msg, match) => {

    const chatId = msg.chat.id;

    const prompt = match && match[1]
        ? match[1].trim()
        : "";

    // ------------------------------------
    // Проверка prompt
    // ------------------------------------

    if (!prompt) {
        await bot.sendMessage(
            chatId,
            "❌ Напиши описание видео.\n\n" +
            "Пример:\n" +
            "/omni cat is dancing"
        );

        return;
    }

    // ------------------------------------
    // Сообщение пользователю
    // ------------------------------------

    await bot.sendMessage(
        chatId,
        "🎬 Начинаю генерацию...\n\n" +
        "📝 " + prompt + "\n\n" +
        "⏳ Это может занять некоторое время."
    );

    try {

        console.log("================================");
        console.log("🎬 Gemini Omni generation");
        console.log("📝 Prompt:", prompt);
        console.log("================================");

        // --------------------------------
        // Gemini Omni
        // --------------------------------

        const interaction = await ai.interactions.create({
            model: "gemini-omni-1.1-flash",

            input: prompt,

            response_format: {
                type: "video",
                resolution: "360p"
            }
        });

        console.log("✅ Gemini ответил");

        // --------------------------------
        // Проверяем видео
        // --------------------------------

        if (!interaction.output_video?.data) {

            console.log(
                "❌ Gemini не вернул video data"
            );

            console.log(
                JSON.stringify(
                    interaction,
                    null,
                    2
                )
            );

            throw new Error(
                "Google не вернул видео."
            );
        }

        // --------------------------------
        // Base64 → Buffer
        // --------------------------------

        const videoBuffer = Buffer.from(
            interaction.output_video.data,
            "base64"
        );

        console.log(
            "🎥 Размер видео:",
            videoBuffer.length,
            "bytes"
        );

        // --------------------------------
        // Отправляем видео Telegram
        // --------------------------------

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

        console.log("✅ Видео отправлено в Telegram!");

    } catch (error) {

        console.error("================================");
        console.error("❌ GEMINI ERROR");
        console.error("================================");

        console.error(error);

        const errorText =
            error?.message ||
            String(error);

        // --------------------------------
        // Ошибка пользователю
        // --------------------------------

        try {

            await bot.sendMessage(
                chatId,
                "❌ Ошибка Gemini:\n\n" +
                errorText.slice(0, 3500)
            );

        } catch (telegramError) {

            console.error(
                "❌ Не удалось отправить ошибку:",
                telegramError
            );
        }
    }
});

// ========================================
// TELEGRAM POLLING ERROR
// ========================================

bot.on("polling_error", (error) => {

    console.error(
        "❌ Telegram polling error:",
        error.message
    );
});

// ========================================
// TELEGRAM WEBHOOK ERROR
// ========================================

bot.on("error", (error) => {

    console.error(
        "❌ Telegram bot error:",
        error.message
    );
});

// ========================================
// START MESSAGE
// ========================================

console.log("🤖 AIdeev2 запущен!");
console.log("🎬 Gemini Omni: готов");
console.log("📺 Default resolution: 360p");