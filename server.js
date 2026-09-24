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
        "🎬 Генерация видео через Gemini Omni.\n\n" +
        "Используй:\n" +
        "/omni <описание видео>\n\n" +
        "Пример:\n" +
        "/omni cat is dancing"
    );
});

// =========================
// HELP
// =========================

bot.onText(/^\/help$/, async (msg) => {
    await bot.sendMessage(
        msg.chat.id,
        "ℹ️ AIdeev2\n\n" +
        "🎬 Генерация видео:\n\n" +
        "/omni <prompt>\n\n" +
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
        console.log("🎬 Prompt:", prompt);

        const response = await ai.interactions.create({
            model: "gemini-omni-1.1-flash",
            input: prompt,
            response_format: {
                type: "video",
                resolution: "360p"
            }
        });

        console.log(
            "✅ Gemini response:",
            JSON.stringify(response, null, 2)
        );

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
            throw new Error(
                "Gemini не вернул видео. Ответ API: " +
                JSON.stringify(response).slice(0, 3000)
            );
        }

        const buffer = Buffer.from(videoData, "base64");

        await bot.sendVideo(
            chatId,
            buffer,
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

        let errorText = "";

        if (error && error.message) {
            errorText = error.message;
        } else {
            errorText = String(error);
        }

        if (errorText.length > 3500) {
            errorText = errorText.slice(0, 3500) + "...";
        }

        await bot.sendMessage(
            chatId,
            "❌ Ошибка Gemini:\n\n" +
            errorText
        );
    }
});

// =========================
// OTHER MESSAGES
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