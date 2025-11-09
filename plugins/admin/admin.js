export default {
  command: ["addadmin", "promote"],

  tags: ["admin"],

  desc: "Menambahkan admin di grup",

  async handler(ctx) {
    // Pastikan perintah di grup

    if (!["group", "supergroup"].includes(ctx.chat.type)) {
      return ctx.reply(
        `

💢 𝗘𝗿𝗿𝗼𝗿!  

╔════════════════════╗  

😒 Perintah ini cuma bisa  

dipakai di grup, ngerti nggak sih?!  

╚════════════════════╝

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

    if (!isAdmin) {
      return ctx.reply(
        `

🚫 𝗣𝗲𝗿𝗶𝗻𝘁𝗮𝗵 𝗗𝗶𝘁𝗼𝗹𝗮𝗸!  

╔════════════════════╗  

Hei! Kamu bukan admin grup  

atau pemilikku, jadi jangan  

ngatur-ngatur ya 😤  

╚════════════════════╝

      `.trim(),
        { parse_mode: "Markdown" },
      );
    }

    // Cek izin bot

    try {
      const botMember = await ctx.telegram.getChatMember(
        ctx.chat.id,
        ctx.botInfo.id,
      );

      if (
        botMember.status !== "administrator" ||
        !botMember.can_promote_members
      ) {
        return ctx.reply(
          `

🚫 𝗚𝗮𝗴𝗮𝗹!  

╔════════════════════╗  

Aku nggak punya izin *Can Promote Members*!  

Kasih izin dulu kalau mau aku nurut! 💢  

╚════════════════════╝

        `.trim(),
          { parse_mode: "Markdown" },
        );
      }
    } catch (e) {
      console.error("Gagal cek izin bot:", e);
    }

    // Ambil target (reply)

    const target = ctx.message.reply_to_message?.from;

    if (!target) {
      return ctx.reply(
        `

📌 𝗣𝗮𝗻𝗱𝘂𝗮𝗻!  

╔════════════════════╗  

Balas chat orang yang mau  

dinaikin jadi admin, jangan  

cuma nyuruh doang 😒  

╚════════════════════╝

      `.trim(),
        { parse_mode: "Markdown" },
      );
    }

    try {
      await ctx.telegram.promoteChatMember(ctx.chat.id, target.id, {
        can_change_info: true,

        can_delete_messages: true,

        can_invite_users: true,

        can_restrict_members: true,

        can_pin_messages: true,

        can_promote_members: false, // Biar aman
      });

      ctx.reply(
        `

🌸 𝗦𝘂𝗸𝘀𝗲𝘀! 🌸  

╔════════════════════╗  

✅ *${target.first_name}* sekarang  

udah jadi admin grup ini~ 💕  

Jangan bikin ribut ya 😏  

╚════════════════════╝

      `.trim(),
        { parse_mode: "Markdown" },
      );
    } catch (err) {
      console.error(err);

      ctx.reply(
        `

💔 𝗚𝗮𝗴𝗮𝗹! 💔  

╔════════════════════╗  

Aku nggak bisa naikin dia  

jadi admin... Pastikan aku  

punya izin yang bener! 💢  

╚════════════════════╝

      `.trim(),
        { parse_mode: "Markdown" },
      );
    }
  },
};
