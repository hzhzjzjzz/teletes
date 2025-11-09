export default {
  command: ["cekid", "id"],

  tags: ["tools"],

  DESC: "Cek ID user, grup, atau channel lewat pilihan tombol",

  async handler(m, { conn }) {
    try {
      let teks = "🔎 Pilih target untuk cek ID:";

      await conn.telegram.sendMessage(m.chat.id, teks, {
        reply_markup: {
          inline_keyboard: [
            [{ text: "👤 User (Sender)", callback_data: "cekid_user" }],

            [{ text: "👥 Grup Ini", callback_data: "cekid_group" }],

            [
              {
                text: "📢 Channel (via ID Chat)",
                callback_data: "cekid_channel",
              },
            ],
          ],
        },
      });
    } catch (e) {
      console.error(e);

      await conn.reply(m.chat.id, "❌ Gagal membuat pilihan target!");
    }
  },
};

// Listener untuk callback query

export async function callbackHandler(ctx) {
  try {
    if (ctx.callbackQuery.data === "cekid_user") {
      await ctx.answerCbQuery();

      let user = ctx.from;

      await ctx.reply(
        `👤 *User Info*\n\n` +
          `Nama: ${user.first_name}\n` +
          (user.username ? `Username: @${user.username}\n` : "") +
          `🆔 ID: \`${user.id}\``,

        { parse_mode: "Markdown" },
      );
    }

    if (ctx.callbackQuery.data === "cekid_group") {
      await ctx.answerCbQuery();

      let chat = ctx.chat;

      await ctx.reply(
        `👥 *Group Info*\n\n` +
          `Nama: ${chat.title}\n` +
          `🆔 Group ID: \`${chat.id}\``,

        { parse_mode: "Markdown" },
      );
    }

    if (ctx.callbackQuery.data === "cekid_channel") {
      await ctx.answerCbQuery();

      let chat = ctx.chat;

      await ctx.reply(
        `📢 *Channel Info*\n\n` +
          `Nama: ${chat.title || "N/A"}\n` +
          `🆔 Channel ID: \`${chat.id}\``,

        { parse_mode: "Markdown" },
      );
    }
  } catch (e) {
    console.error(e);

    await ctx.reply("❌ Error saat proses callback!");
  }
}
