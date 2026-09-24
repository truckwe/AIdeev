bot.onText(/^\/omni(?:\s+([\s\S]+))?$/, async (msg, match) => {
    const chatId = msg.chat.id;
    const prompt = match && match[1] ? match[1].trim() : "";

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
            throw new Error(
                "Google не вернул видео."
            );
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
            error?.message ||
            String(error);

        await bot.sendMessage(
            chatId,
            "❌ Ошибка Gemini:\n\n" +
            errorText.slice(0, 3500)
        );
    }
});