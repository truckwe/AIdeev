const http = require("http");
const TelegramBot = require("node-telegram-bot-api");

// ========================================
// ENVIRONMENT VARIABLES
// ========================================

const BOT_TOKEN = process.env.BOT_TOKEN;
const ATLAS_API_KEY = process.env.ATLAS_API_KEY;

if (!BOT_TOKEN) {
    console.error("❌ BOT_TOKEN не найден!");
    process.exit(1);
}

if (!ATLAS_API_KEY) {
    console.error("❌ ATLAS_API_KEY не найден!");
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

    console.log(
        `🌐 HTTP server запущен на порту ${PORT}`
    );
});

// ========================================
// TELEGRAM
// ========================================

const bot = new TelegramBot(BOT_TOKEN, {
    polling: true
});

// ========================================
// ATLAS CLOUD
// ========================================

const ATLAS_BASE_URL =
    "https://api.atlascloud.ai/api/v1";

const ATLAS_MODEL =
    "google/gemini-omni-flash/text-to-video";

console.log("☁️ Atlas Cloud подключён");
console.log("🎬 Model:", ATLAS_MODEL);

console.log("🤖 AIdeev2 запускается...");

// ========================================
// WAIT
// ========================================

function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}

// ========================================
// WAIT FOR VIDEO
// ========================================

async function waitForVideo(
    predictionId,
    maxWait = 300000
) {

    const startTime = Date.now();

    console.log(
        "⏳ Ожидаем видео:",
        predictionId
    );

    while (
        Date.now() - startTime < maxWait
    ) {

        const response = await fetch(
            `${ATLAS_BASE_URL}/model/prediction/${predictionId}`,
            {
                method: "GET",

                headers: {
                    "Authorization":
                        `Bearer ${ATLAS_API_KEY}`
                }
            }
        );

        const result = await response.json();

        if (!response.ok) {

            console.error(
                "Atlas polling error:",
                JSON.stringify(
                    result,
                    null,
                    2
                )
            );

            throw new Error(
                result.message ||
                `Atlas Cloud HTTP ${response.status}`
            );
        }

        const data = result.data;

        if (!data) {
            throw new Error(
                "Atlas Cloud не вернул data."
            );
        }

        console.log(
            "📊 Status:",
            data.status
        );

        // ====================================
        // COMPLETED
        // ====================================

        if (data.status === "completed") {

            const videoUrl =
                data.outputs?.[0];

            if (!videoUrl) {

                throw new Error(
                    "Atlas Cloud сообщил completed, " +
                    "но ссылка на видео отсутствует."
                );
            }

            console.log(
                "🎥 Видео готово!"
            );

            return videoUrl;
        }

        // ====================================
        // FAILED
        // ====================================

        if (data.status === "failed") {

            throw new Error(
                data.error ||
                "Генерация видео завершилась ошибкой."
            );
        }

        // ====================================
        // PROCESSING
        // ====================================

        await sleep(5000);
    }

    throw new Error(
        "Превышено время ожидания генерации видео."
    );
}

// ========================================
// START
// ========================================

bot.onText(/^\/start$/, async (msg) => {

    const chatId = msg.chat.id;

    try {

        await bot.sendMessage(
            chatId,

            "👋 Привет! Я AIdeev2.\n\n" +

            "🎬 Я умею генерировать видео " +
            "через Gemini Omni Flash.\n\n" +

            "Команда:\n" +
            "/omni описание видео\n\n" +

            "Пример:\n" +
            "/omni cat is dancing"
        );

    } catch (error) {

        console.error(
            "❌ START ERROR:",
            error
        );
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

        console.error(
            "❌ HELP ERROR:",
            error
        );
    }
});

// ========================================
// OMNI VIDEO
// ========================================

bot.onText(
    /^\/omni(?:\s+([\s\S]+))?$/,
    async (msg, match) => {

        const chatId = msg.chat.id;

        const prompt =
            match && match[1]
                ? match[1].trim()
                : "";

        // ====================================
        // CHECK PROMPT
        // ====================================

        if (!prompt) {

            await bot.sendMessage(
                chatId,

                "❌ Напиши описание видео.\n\n" +

                "Пример:\n" +
                "/omni cat is dancing"
            );

            return;
        }

        // ====================================
        // START MESSAGE
        // ====================================

        await bot.sendMessage(
            chatId,

            "🎬 Начинаю генерацию...\n\n" +

            "📝 " + prompt + "\n\n" +

            "🤖 Gemini Omni Flash\n" +

            "☁️ Atlas Cloud\n\n" +

            "⏳ Это может занять некоторое время."
        );

        try {

            console.log(
                "================================"
            );

            console.log(
                "🎬 Atlas Cloud video generation"
            );

            console.log(
                "🤖 Model:",
                ATLAS_MODEL
            );

            console.log(
                "📝 Prompt:",
                prompt
            );

            console.log(
                "================================"
            );

            // =================================
            // CREATE VIDEO TASK
            // =================================

            const response = await fetch(
                `${ATLAS_BASE_URL}/model/generateVideo`,
                {
                    method: "POST",

                    headers: {
                        "Authorization":
                            `Bearer ${ATLAS_API_KEY}`,

                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        model:
                            ATLAS_MODEL,

                        prompt:
                            prompt,

                        duration:
                            10,

                        aspect_ratio:
                            "16:9",

                        resolution:
                            "720p",

                        thinking_level:
                            "low",

                        seed:
                            -1
                    })
                }
            );

            const result =
                await response.json();

            console.log(
                "📡 Atlas response:"
            );

            console.log(
                JSON.stringify(
                    result,
                    null,
                    2
                )
            );

            // =================================
            // API ERROR
            // =================================

            if (!response.ok) {

                throw new Error(
                    result.message ||
                    result.data?.error ||
                    `Atlas Cloud HTTP ${response.status}`
                );
            }

            if (
                result.code !== undefined &&
                result.code !== 0
            ) {

                throw new Error(
                    result.message ||
                    "Atlas Cloud вернул ошибку."
                );
            }

            // =================================
            // GET PREDICTION ID
            // =================================

            const predictionId =
                result.data?.id;

            if (!predictionId) {

                throw new Error(
                    "Atlas Cloud не вернул prediction ID."
                );
            }

            console.log(
                "🆔 Prediction ID:",
                predictionId
            );

            // =================================
            // WAIT
            // =================================

            const videoUrl =
                await waitForVideo(
                    predictionId
                );

            console.log(
                "🎥 Video URL:",
                videoUrl
            );

            // =================================
            // SEND VIDEO
            // =================================

            await bot.sendVideo(
                chatId,

                videoUrl,

                {
                    caption:

                        "🎬 Готово!\n\n" +

                        "🤖 AIdeev2\n" +

                        "✨ Gemini Omni Flash\n" +

                        "☁️ Atlas Cloud\n" +

                        "📺 720p"
                }
            );

            console.log(
                "✅ Видео отправлено в Telegram!"
            );

        } catch (error) {

            console.error(
                "================================"
            );

            console.error(
                "❌ ATLAS CLOUD ERROR"
            );

            console.error(
                "================================"
            );

            console.error(error);

            const errorText =
                error?.message ||
                String(error);

            try {

                await bot.sendMessage(
                    chatId,

                    "❌ Ошибка Atlas Cloud:\n\n" +

                    errorText.slice(
                        0,
                        3500
                    )
                );

            } catch (telegramError) {

                console.error(
                    "❌ Не удалось отправить ошибку:",
                    telegramError
                );
            }
        }
    }
);

// ========================================
// TELEGRAM POLLING ERROR
// ========================================

bot.on(
    "polling_error",
    (error) => {

        console.error(
            "❌ Telegram polling error:",
            error.message
        );
    }
);

// ========================================
// TELEGRAM ERROR
// ========================================

bot.on(
    "error",
    (error) => {

        console.error(
            "❌ Telegram bot error:",
            error.message
        );
    }
);

// ========================================
// START MESSAGE
// ========================================

console.log(
    "🤖 AIdeev2 запущен!"
);

console.log(
    "☁️ Atlas Cloud: готов"
);

console.log(
    "✨ Gemini Omni Flash: готов"
);

console.log(
    "📺 Resolution: 720p"
);

console.log(
    "⏱️ Duration: 10 seconds"
);