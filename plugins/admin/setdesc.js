export default {
  command: ["setdesc"],

  tags: ["admin"],

  desc: "✏️ Ubah deskripsi group",

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
          "🚫 Hanya *Admin* atau *Owner* yang bisa mengubah deskripsi grup.",
          {
            parse_mode: "Markdown",
          },
        );
      }

      const text = ctx.message.text.split(" ").slice(1).join(" ");

      if (!text) {
        return ctx.reply(
          "🎀━━━━━━━━━━━━━━━━━🎀\n" +
            "⚠️ *Format salah!*\n" +
            "Gunakan perintah:\n" +
            "`/setdesc <deskripsi baru>`\n" +
            "🎀━━━━━━━━━━━━━━━━━🎀",

          { parse_mode: "Markdown" },
        );
      }

      // update deskripsi grup

      await ctx.telegram.setChatDescription(ctx.chat.id, text);

      return ctx.reply(
        "🌸━━━━━━━━━━━━━━━━━🌸\n" +
          "✅ *Deskripsi Grup Berhasil Diubah!*\n\n" +
          `📝 Deskripsi baru:\n"${text}"\n` +
          "🌸━━━━━━━━━━━━━━━━━🌸",

        { parse_mode: "Markdown" },
      );
    } catch (err) {
      console.error("❌ Gagal ubah deskripsi:", err);

      return ctx.reply(
        "🔥━━━━━━━━━━━━━━━━━🔥\n" +
          "❌ *Gagal mengubah deskripsi grup.*\n" +
          "🔥━━━━━━━━━━━━━━━━━🔥",

        { parse_mode: "Markdown" },
      );
    }
  },
};
