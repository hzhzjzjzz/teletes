import { config } from "../../config.js";

export default {
  command: ["setppgrup", "setppgroup", "setppgc"],

  tags: ["admin"],

  desc: "Mengganti foto profil grup",

  async handler(ctx) {
    const OWNER_ID = config.OWNER_ID;

    // Pastikan perintah di grup

    if (!["group", "supergroup"].includes(ctx.chat.type)) {
      return ctx.reply(
        `

😒 Fitur ini cuma bisa dipake di grup, ngerti nggak sih? 💢

      `.trim(),
        { parse_mode: "Markdown" },
      );
    }

    // Cek apakah user adalah owner bot atau admin grup

    let isAdmin = false;

    try {
      const member = await ctx.telegram.getChatMember(ctx.chat.id, ctx.from.id);

      isAdmin = ["administrator", "creator"].includes(member.status);
    } catch (e) {
      console.error("Gagal cek status admin:", e);
    }

    if (ctx.from.id !== OWNER_ID && !isAdmin) {
      return ctx.reply(
        `

🚫 Eh kamu pikir siapa berani nyuruh aku? 😤  

Bukan owner, bukan admin, udah diem aja! 💢

      `.trim(),
        { parse_mode: "Markdown" },
      );
    }

    // Cek apakah bot punya izin ubah info grup

    try {
      const botMember = await ctx.telegram.getChatMember(
        ctx.chat.id,
        ctx.botInfo.id,
      );

      if (botMember.status !== "administrator" || !botMember.can_change_info) {
        return ctx.reply(
          `

😡 Nih ya... aku nggak punya izin *Ubah Info Grup*!  

Cepet kasih aku akses *Can Change Info* kalau mau aku ganti fotonya! 💢

        `.trim(),
          { parse_mode: "Markdown" },
        );
      }
    } catch (e) {
      console.error("Gagal cek izin bot:", e);
    }

    try {
      const photo =
        ctx.message.photo?.pop() || ctx.message.reply_to_message?.photo?.pop();

      if (!photo) {
        return ctx.reply(
          `

🙄 Ya ampun... fotonya mana woy?!  

╔════════════════════╗  

📸 Kirim atau balas foto  

buat dijadiin profil grup! 💢  

╚════════════════════╝

        `.trim(),
          { parse_mode: "Markdown" },
        );
      }

      const file = await ctx.telegram.getFileLink(photo.file_id);

      // Ubah foto profil grup

      await ctx.telegram.setChatPhoto(ctx.chat.id, { url: file.href });

      ctx.reply(
        `

✨ Udah nih ya ✨  

╔════════════════════╗  

✅ Foto grup udah aku ganti  

gara-gara *${ctx.from.first_name}*  

Puasss? 😏  

╚════════════════════╝

      `.trim(),
        { parse_mode: "Markdown" },
      );
    } catch (err) {
      console.error(err);

      ctx.reply(
        `

💢 Yah gagal lagi!  

╔════════════════════╗  

❌ Pastikan aku punya izin  

buat ubah info grup dulu! 😤  

╚════════════════════╝

      `.trim(),
        { parse_mode: "Markdown" },
      );
    }
  },
};
