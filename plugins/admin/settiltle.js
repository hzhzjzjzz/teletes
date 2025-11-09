export default {
  command: ["settitle"],

  tags: ["admin"],

  desc: "✏️ Ubah nama / judul group",

  async handler(ctx) {
    try {
      // pastikan hanya di grup

      if (!ctx.chat || ctx.chat.type === "private") {
        return ctx.reply("❌ Perintah ini hanya bisa digunakan di grup.");
      }

      // cek user yang jalankan

      const member = await ctx.getChatMember(ctx.from.id);

      if (!["administrator", "creator"].includes(member.status)) {
        return ctx.reply(
          "🚫 Hanya *Admin* atau *Owner* yang bisa mengubah judul grup.",

          { parse_mode: "Markdown" },
        );
      }

      const text = ctx.message.text.split(" ").slice(1).join(" ");

      if (!text) {
        return ctx.reply(
          "🎀━━━━━━━━━━━━━━━━━🎀\n" +
            "⚠️ *Format salah!*\n" +
            "Gunakan perintah:\n" +
            "`/settitle <judul baru>`\n" +
            "🎀━━━━━━━━━━━━━━━━━🎀",

          { parse_mode: "Markdown" },
        );
      }

      // data lama & baru

      const oldTitle = ctx.chat.title;

      const newTitle = text;

      // update judul grup

      await ctx.telegram.setChatTitle(ctx.chat.id, newTitle);

      // ambil waktu + user

      const time = new Date().toLocaleString("id-ID", {
        timeZone: "Asia/Jakarta",
      });

      const user =
        `${ctx.from.first_name || ""} ${ctx.from.last_name || ""}`.trim();

      return ctx.reply(
        "🌸━━━━━━━━━━━━━━━━━🌸\n" +
          "✅ *Judul Grup Berhasil Diubah!*\n\n" +
          `⏰ Waktu: ${time}\n` +
          `🏷️ Nama Sebelum: *${oldTitle}*\n` +
          `🆕 Nama Sesudah: *${newTitle}*\n` +
          `👤 Oleh: *${user}*\n` +
          "🌸━━━━━━━━━━━━━━━━━🌸",

        { parse_mode: "Markdown" },
      );
    } catch (err) {
      console.error("❌ Gagal ubah judul:", err);

      return ctx.reply(
        "🔥━━━━━━━━━━━━━━━━━🔥\n" +
          "❌ *Gagal mengubah judul grup.*\n" +
          "🔥━━━━━━━━━━━━━━━━━🔥",

        { parse_mode: "Markdown" },
      );
    }
  },
};
