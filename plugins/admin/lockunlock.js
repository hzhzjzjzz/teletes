export default {
  command: ["lock", "unlock", "tutupgrup", "bukagrup"],

  desc: "🔒🔓 Tutup/Buka grup (hanya admin)",

  tags: ["admin"],

  async handler(ctx) {
    try {
      const chat = ctx.chat;

      const from = ctx.from;

      const cmd = ctx.message.text.split(" ")[0].toLowerCase();

      if (!chat || chat.type === "private") {
        return ctx.reply("❌ Fitur ini hanya bisa digunakan di grup.");
      }

      const member = await ctx.telegram.getChatMember(chat.id, from.id);

      if (!["creator", "administrator"].includes(member.status)) {
        return ctx.reply(
          "🚫 Hanya *admin* yang bisa menggunakan perintah ini.",
          {
            parse_mode: "Markdown",
          },
        );
      }

      // waktu

      const now = new Date();

      const timeString = now.toLocaleString("id-ID", {
        timeZone: "Asia/Jakarta",

        weekday: "long",

        day: "numeric",

        month: "long",

        year: "numeric",

        hour: "2-digit",

        minute: "2-digit",

        second: "2-digit",
      });

      // jumlah member

      const memberCount = await ctx.telegram.getChatMembersCount(chat.id);

      let loadingMsg;

      if (cmd === "/lock" || cmd === "/tutupgrup") {
        await ctx.reply("🔒");

        loadingMsg = await ctx.reply("🔒 Sedang *menutup grup*...", {
          parse_mode: "Markdown",
        });

        await ctx.telegram.setChatPermissions(chat.id, {
          can_send_messages: false,

          can_send_media_messages: false,

          can_send_polls: false,

          can_send_other_messages: false,

          can_add_web_page_previews: false,

          can_invite_users: false,
        });

        setTimeout(async () => {
          await ctx.telegram.editMessageText(
            chat.id,

            loadingMsg.message_id,

            null,

            `┏━━━━━━━━━━━━━━┓

┃   🔒 *GRUP DITUTUP* 🔒

┗━━━━━━━━━━━━━━┛

🏷️ Grup   : *${chat.title}*

👥 Member : *${memberCount}*

👑 Oleh   : [${from.first_name}](tg://user?id=${from.id})

⏰ Waktu  : ${timeString}

📢 Status : Sekarang hanya *admin* yang bisa mengirim pesan.

━━━━━━━━━━━━━━━━━━━━━━━`,

            { parse_mode: "Markdown" },
          );

          // auto delete pesan loading setelah diubah

          setTimeout(() => {
            ctx.deleteMessage(loadingMsg.message_id).catch(() => {});
          }, 2000);
        }, 1500);
      } else if (cmd === "/unlock" || cmd === "/bukagrup") {
        await ctx.reply("🔓");

        loadingMsg = await ctx.reply("🔓 Sedang *membuka grup*...", {
          parse_mode: "Markdown",
        });

        await ctx.telegram.setChatPermissions(chat.id, {
          can_send_messages: true,

          can_send_media_messages: true,

          can_send_polls: true,

          can_send_other_messages: true,

          can_add_web_page_previews: true,

          can_invite_users: true,
        });

        setTimeout(async () => {
          await ctx.telegram.editMessageText(
            chat.id,

            loadingMsg.message_id,

            null,

            `┏━━━━━━━━━━━━━━┓

┃   🔓 *GRUP DIBUKA* 🔓

┗━━━━━━━━━━━━━━┛

🏷️ Grup   : *${chat.title}*

👥 Member : *${memberCount}*

👑 Oleh   : [${from.first_name}](tg://user?id=${from.id})

⏰ Waktu  : ${timeString}

📢 Status : Semua anggota bisa *mengirim pesan* kembali.

━━━━━━━━━━━━━━━━━━━━━━━`,

            { parse_mode: "Markdown" },
          );

          // auto delete pesan loading setelah diubah

          setTimeout(() => {
            ctx.deleteMessage(loadingMsg.message_id).catch(() => {});
          }, 2000);
        }, 1500);
      }
    } catch (err) {
      console.error(err);

      return ctx.reply("⚠️ Terjadi kesalahan saat mengatur status grup.");
    }
  },
};
