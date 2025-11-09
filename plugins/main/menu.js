import fs from "fs";
import path from "path";
import { config } from "../../config.js";

const emojiKategori = {
  admin: "🛡️",
  ai: "🧠",
  anime: "🍥",
  bot: "🤖",
  bugs: "🐞",
  downloader: "⬇️",
  donghua: "🐉",
  elphoto: "🖼️",
  enc: "🔒",
  fix: "🧩",
  fun: "🎮",
  game: "🎲",
  group: "👥",
  info: "📘",
  internal: "🔧",
  islam: "🕌",
  main: "🎯",
  maker: "🧪",
  news: "📰",
  nsfw: "🔞",
  other: "📦",
  owner: "👑",
  panel: "📟",
  payment: "💰",
  primbon: "🔮",
  rpg: "🗡️",
  search: "🔍",
  sertifikat: "📄",
  stalker: "🕵️",
  store: "🏪",
  tools: "🛠️",
  default: "📦",
};

export const command = ["menu"];
export const tags = ["main"];
export const desc = "📂 Menampilkan daftar fitur bot berdasarkan kategori";

const pkg = JSON.parse(
  fs.readFileSync(new URL("../../package.json", import.meta.url)),
);

export default (bot) => {
  bot.command(command, async (ctx) => {
    const args = ctx.message?.text?.split(" ").slice(1) || [];
    const subMenu = args[0]?.toLowerCase();
    const name = ctx.from?.first_name || "Unknown";
    const userId = ctx.from?.id;

    const pluginList = bot.context.pluginList || [];
    const meta = bot.context.pluginMeta || {};

    const kategori = {};
    let latestCommand = "";
    let totalCommands = 0;

    for (const file of pluginList) {
      const data = meta[file];
      if (!data) continue;

      const tags = data.tags || ["other"];
      const commands = data.command || [];

      if (commands.length > 0) {
        latestCommand = commands[commands.length - 1];
        totalCommands += commands.length;
      }

      for (const tag of tags) {
        if (!kategori[tag]) kategori[tag] = [];
        kategori[tag].push(...commands);
      }
    }

    const sortedKategori = Object.keys(kategori).sort();
    for (const tag of sortedKategori) {
      kategori[tag] = [...new Set(kategori[tag])].sort();
    }

    const totalJson = fs.existsSync("./json")
      ? fs.readdirSync("./json").filter((f) => f.endsWith(".json")).length
      : 0;
    const totalLib = fs
      .readdirSync("./lib")
      .filter((f) => f.endsWith(".js")).length;
    const totalPlugins = pluginList.length;

    if (subMenu) {
      const tag = subMenu;
      const fitur = kategori[tag];
      if (!fitur) return ctx.reply(`❌ Kategori \`${tag}\` tidak ditemukan.`);

      const text =
        `╭━━ ${emojiKategori[tag] || "📦"} 𝗠𝗘𝗡𝗨 ${tag.toUpperCase()} ━━╮\n` +
        fitur.map((c) => `⟿ /${c}`).join("\n") +
        `\n╰━━━━━━━━━━━━━━━━━━╯`;

      return await ctx.replyWithMarkdown(text);
    }

    // Build Menu Text
    const lines = [
      `╭══════ ⌜ 🔱  𝗞𝗔𝗭𝗘 𝗠𝗘𝗡𝗨 ⌟ ══════╮`,
      `│ 👤 User: ${name}`,
      `│ 🧬 ID: ${userId}`,
      `│ ⚙️ Version: v${pkg.version}`,
      `│ 🧩 Plugins: ${totalPlugins}`,
      `│ 📚 JSON DB: ${totalJson}`,
      `│ 🛠 Modules: ${totalLib}`,
      `│ 🔢 Commands: ${totalCommands}`,
      `│ 📌 Last: /${latestCommand || "Unknown"}`,
      `╰═════════════════════════════╯`,
      ``,
      `📂 Kategori Menu:`,
      ...sortedKategori.map((tag) => {
        const emoji = emojiKategori[tag] || "📦";
        return `⟿ ${emoji} \`/menu ${tag}\``;
      }),
      ``,
      `✨ _"In silence, I strike. In shadow, I lead."_`,
      `🌙 *Stand firm, seeker of thunder.*`,
    ];

    const menuText = lines.join("\n");

    const buttons = [];
    const infoButtons = config.infoButtons || {};
    if (infoButtons.source)
      buttons.push([{ text: "🌐 Source Code", url: infoButtons.source }]);
    if (infoButtons.owner)
      buttons.push([{ text: "👑 Owner", url: infoButtons.owner }]);
    if (infoButtons.channel)
      buttons.push([{ text: "📢 Channel", url: infoButtons.channel }]);
    if (infoButtons.support)
      buttons.push([{ text: "🛠 Support", url: infoButtons.support }]);

    // Media paths
    const imgPath = path.join("image", "menu", "opening.jpg");
    const videoPath = path.join("image", "menu", "opening.mp4");
    const audioPath = path.join("audio", "menu", "opening.mp3");

    // Opening Thumbnail + Menu Text + Buttons
    if (fs.existsSync(videoPath)) {
      await ctx.replyWithVideo(
        { source: videoPath },
        {
          caption: menuText,
          parse_mode: "Markdown",
          reply_markup: { inline_keyboard: buttons },
        },
      );
    } else if (fs.existsSync(imgPath)) {
      await ctx.replyWithPhoto(
        { source: imgPath },
        {
          caption: menuText,
          parse_mode: "Markdown",
          reply_markup: { inline_keyboard: buttons },
        },
      );
    } else {
      // Fallback text-only
      await ctx.reply(menuText, {
        parse_mode: "Markdown",
        reply_markup: { inline_keyboard: buttons },
      });
    }

    // Optional Audio Opening (separate, if needed)
    if (fs.existsSync(audioPath)) {
      await ctx.replyWithAudio(
        { source: audioPath },
        {
          title: "Silent Thunder Intro",
          performer: "Kaze",
          caption: "🎧 Audio Opening\n_Suara sunyi sebelum badai..._",
          parse_mode: "Markdown",
        },
      );
    }
  });
};
