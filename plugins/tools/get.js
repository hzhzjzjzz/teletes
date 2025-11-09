import jsbe from "js-beautify";

import { Readable } from "stream";

const html = jsbe.html;

function replyChunked(ctx, text, limit = 4000) {
  if (!text) return;

  ctx.reply("🌸✨✨✨ JSON Chunk ✨✨✨🌸");

  for (let i = 0; i < text.length; i += limit) {
    const chunk = text.substring(i, i + limit);

    ctx.reply(
      `📄✨ *Part ${Math.floor(i / limit) + 1}* ✨📄\n\`\`\`\n${chunk}\n\`\`\``,
    );
  }

  ctx.reply("🌸✨✨✨ Selesai ✨✨✨🌸");
}

const mimeMap = [
  {
    regex: /html/,
    ext: "html",
    sendFn: "sendDocument",
    preprocess: async (res) => Buffer.from(html(await res.text())),
    caption: "✅✨ HTML berhasil didapatkan ✨🌸",
  },

  {
    regex: /json/,
    ext: "json",
    sendFn: "replyChunked",
    preprocess: async (res) => JSON.stringify(await res.json(), null, 2),
    caption: "✅✨ JSON berhasil didapatkan ✨🌸",
  },

  {
    regex: /audio/,
    ext: "mp3",
    sendFn: "sendAudio",
    preprocess: async (res) => Buffer.from(await res.arrayBuffer()),
    caption: "🎵✅ Audio berhasil didapatkan 🎵🌸",
  },

  {
    regex: /video/,
    ext: "mp4",
    sendFn: "sendVideo",
    preprocess: async (res) => Buffer.from(await res.arrayBuffer()),
    caption: "🎬✅ Video berhasil didapatkan 🎬🌸",
  },

  {
    regex: /image/,
    ext: "jpg",
    sendFn: "sendPhoto",
    preprocess: async (res) => Buffer.from(await res.arrayBuffer()),
    caption: "🖼️✅ Foto berhasil didapatkan 🖼️🌸",
  },
];

function randomExt() {
  const exts = ["bin", "dat", "file"];

  return exts[Math.floor(Math.random() * exts.length)];
}

export default {
  command: ["get", "fetching"],

  tags: ["tools"],

  desc: "📥 Fetch link dan kirim konten otomatis dengan hiasan & emoji. Support reply message.",

  limit: false,

  async handler(ctx, { text }) {
    try {
      // Ambil text dari parameter, atau pesan yang di-reply, atau pesan command

      if (!text) {
        if (ctx.message?.reply_to_message?.text) {
          text = ctx.message.reply_to_message.text;
        } else {
          text = ctx.message?.text?.split(" ").slice(1).join(" ");
        }
      }

      if (!text || !text.includes("https"))
        return ctx.reply("⚠️❗ Masukkan linknya ya! 🌸");

      ctx.reply("✨🌸 Sedang memproses link, mohon tunggu... 🌸✨");

      const response = await fetch(text);

      const mime = response.headers.get("content-type")?.split(";")[0] || "";

      const mapping = mimeMap.find((f) => f.regex.test(mime));

      if (mapping) {
        const content = await mapping.preprocess(response);

        if (mapping.sendFn === "replyChunked") {
          replyChunked(ctx, content);
        } else {
          await ctx.telegram[mapping.sendFn](
            ctx.chat.id,

            { source: content, filename: `result.${mapping.ext}` },

            {
              caption: mapping.caption,
              reply_to_message_id: ctx.message.message_id,
            },
          );
        }
      } else {
        const data = Buffer.from(await response.arrayBuffer());

        const ext = randomExt();

        await ctx.telegram.sendDocument(
          ctx.chat.id,

          { source: data, filename: `result.${ext}` },

          {
            caption: `⚠️✨ File unknown berhasil didapatkan (${ext}) ✨🌸`,
            reply_to_message_id: ctx.message.message_id,
          },
        );
      }

      ctx.reply("🌸✅✨ Selesai mem-fetch link! ✨✅🌸");
    } catch (err) {
      console.error(err);

      ctx.reply(
        "❌💥 Terjadi kesalahan saat mem-fetch link! Pastikan link valid. 🌸",
      );
    }
  },
};

