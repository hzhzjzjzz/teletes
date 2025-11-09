export default {
  command: ["owner", "dev", "creator"],
  tags: ["owner"],
  desc: "👑 Menampilkan informasi pemilik bot",

  async handler(ctx) {
    const config = ctx.config || {};
    const btn = config.infoButtons || {};

    // Default value
    const OWNER_NAME = config.OWNER_NAME || "Unknown";
    const OWNER_ID = config.OWNER_ID || 0;
    const OWNER_USERNAME = config.OWNER_USERNAME || "username_owner";

    const OWNER_LINK = btn.owner || `https://t.me/${OWNER_USERNAME}`;
    const WA_CHANNEL_LINK = btn.whatsapp || "https://whatsapp.com/channel/0029Vb5sKCeInlqQbjzsFT0g";
    const GROUP_LINK = btn.group || "https://t.me/+nB-4fvoL0LtkYWM9";

    // 🔹 Status owner
    let statusOwner = "✅ Online";
    try {
      const ownerInfo = await ctx.telegram.getChat(OWNER_ID);
      if (ownerInfo.status === "recently") statusOwner = "🟢 Aktif baru saja";
      else if (ownerInfo.status === "within_week")
        statusOwner = "🟡 Aktif minggu ini";
      else if (ownerInfo.status === "within_month")
        statusOwner = "🟠 Aktif bulan ini";
      else if (ownerInfo.status === "long_time_ago")
        statusOwner = "🔴 Lama tidak aktif";
    } catch {
      statusOwner = "✅ Online";
    }

    const text = `
╭━━━〔 👑 *INFORMASI OWNER* 〕━━━╮
│ 📛 *Nama:* ${OWNER_NAME}
│ 🆔 *ID:* \`${OWNER_ID}\`
│ 🔗 *Username:* [@${OWNER_USERNAME}](https://t.me/${OWNER_USERNAME})
│ 📡 *Status:* ${statusOwner}
╰━━━━━━━━━━━━━━━━━━━━━━╯
`.trim();

    // Inline Keyboard
    const buttons = [
      [
        { text: "💬 Chat Owner", url: OWNER_LINK },
      ],
      [
        { text: "✉️ Channel WA", url: WA_CHANNEL_LINK },
        { text: "👥 Group", url: GROUP_LINK },
      ]
    ];

    await ctx.reply(text, {
      parse_mode: "Markdown",
      disable_web_page_preview: true,
      reply_markup: { inline_keyboard: buttons },
    });
  },
};
