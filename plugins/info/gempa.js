import fetch from "node-fetch";
import { Markup } from "telegraf";

export default {
  command: ["gempa", "infogempa"],
  tags: ["info"],
  desc: "🌋 Info gempa bumi terbaru (dengan hiasan & tombol)",

  async handler(ctx) {
    try {
      const res = await fetch("https://api.zenzxz.my.id/info/gempa");
      const { result } = await res.json();

      if (!result) return ctx.reply("❌ Gagal mengambil data gempa.");

      const caption = `
╭━━━〔 🌋 *INFO GEMPA TERKINI* 〕━━━╮
┃ 📆 *Tanggal:* ${result.tanggal}
┃ 🕒 *Waktu:* ${result.jam}
┃ 📍 *Lokasi:* ${result.lokasi}
┃ 📏 *Magnitudo:* ${result.magnitude}
┃ 🧭 *Kedalaman:* ${result.kedalaman}
┃ 🌊 *Potensi:* ${result.potensi}
┃ 🗺️ *Koordinat:* ${result.koordinat}
┃ 📣 *Dirasakan:* ${result.dirasakan || "-"}
╰━━━━━━━━━━━━━━━━━━━━━━━╯

🛰️ *Sumber:* BMKG via zenzxz.dpdns.org
`.trim();

      const btn =
        result.map && result.map.endsWith(".jpg")
          ? Markup.inlineKeyboard([
              [Markup.button.url("🗺️ Lihat Peta Gempa", result.map)],
            ])
          : null;

      if (result.map && result.map.endsWith(".jpg")) {
        await ctx.replyWithPhoto(
          { url: result.map },
          {
            caption,
            parse_mode: "Markdown",
            ...btn,
          },
        );
      } else {
        await ctx.reply(caption, {
          parse_mode: "Markdown",
          ...btn,
        });
      }
    } catch (e) {
      console.error(e);
      await ctx.reply(
        "❌ Terjadi kesalahan saat mengambil info gempa.\nSilakan coba beberapa saat lagi.",
      );
    }
  },
};
