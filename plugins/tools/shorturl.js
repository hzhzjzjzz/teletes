import axios from "axios";

export default {
  command: ["shorturl"],
  tags: ["tools"],
  desc: "🔗 Shorten URL via shogood.zone.id",

  async handler(ctx) {
    const text = ctx.message.text?.split(" ").slice(1).join(" ");
    if (!text)
      return await ctx.reply(
        "❌ Kirim URL yang ingin di-short!\n\n📌 Contoh: /shorturl https://codegood.my.id",
      );

    try {
      await ctx.reply("⏳ Sedang mempersingkat link...");

      const res = await axios.get(
        `https://cloudku.click/php?url=${encodeURIComponent(text)}`,
      );
      const short = res.data?.short;

      if (!short) return await ctx.reply("🚫 Gagal membuat Short URL.");

      const hasil = `
╭───❑「 🔗 Short URL 」❑────
│
├ 📥 *Asli:* ${text}
├ 📤 *Short:* ${short}
│
╰───────────────❍`;

      await ctx.reply(hasil);
    } catch (err) {
      console.error(err);
      await ctx.reply("❌ Terjadi kesalahan saat memproses permintaan.");
    }
  },
};
