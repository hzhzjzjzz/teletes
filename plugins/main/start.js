import { config } from "../../config.js";

// Fungsi escape untuk MarkdownV2
function escapeMarkdownV2(text) {
  if (!text) return "";
  return text.replace(/([_*\[\]()~`>#+\-=|{}.!])/g, "\\$1");
}

export default {
  command: ["start"],
  tags: ["main"],
  desc: "👋 Mulai bot",

  async handler(ctx) {
    const rawUser = ctx.from.first_name || ctx.from.username || "Pengguna";
    const user = escapeMarkdownV2(rawUser);
    const isGroup = ctx.chat?.type?.includes("group");

    const ownerLink = config.OWNER_LINK || "https://t.me/ReyzID12";
    const botUsername = config.BOTUSERNAME || "LinQiyeBot";
    const botName = escapeMarkdownV2(config.BOTNAME || "LinQiye");

    if (isGroup) {
      const teksGroup = escapeMarkdownV2(`
✨━━━━━━━━━━━━━━━━✨
👋 Halo *${rawUser}*!

Selamat datang di grup ini!  
Aku adalah *${config.BOTNAME}* 🚀  
🤖 Dengan bot ini aktif dengan *Auto AI*

Ketik */menu* untuk melihat daftar semua fitur.
✨━━━━━━━━━━━━━━━━✨
`);

      await ctx.reply(teksGroup, {
        parse_mode: "MarkdownV2",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "👨‍💻 Owner", url: ownerLink },
            ],
          ],
        },
      });
    } else {
      const teksPrivate = escapeMarkdownV2(`
✨━━━━━━━━━━━━━━━━✨
👋 Halo *${rawUser}*!

Selamat datang di *${config.BOTNAME}* 🚀  
🤖 Dengan bot ini aktif dengan *Auto AI*

Aku bisa membantu kamu dengan berbagai fitur:

📥 Downloader (Mediafire, Tiktok, dll)

➡️ Gunakan */menu* untuk melihat semua fitur.
✨━━━━━━━━━━━━━━━━✨
`);

      await ctx.reply(teksPrivate, {
        parse_mode: "MarkdownV2",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "👨‍💻 Owner", url: ownerLink },
            ],
            [
              { text: "➕ Tambahkan ke Grup", url: `https://t.me/${botUsername}?startgroup=true` }
            ]
          ],
        },
      });
    }
  },
};
