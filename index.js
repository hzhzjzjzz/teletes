import cluster from "cluster";

// --- TAMBAHKAN 'session' DISINI ---

import { Telegraf, session } from "telegraf";

import { config } from "./config.js";

import { loadPlugins } from "./lib/loader.js";

import fs from "fs";

import path from "path";

import { fileURLToPath } from "url";

import chalk from "chalk";

import axios from "axios";

// --- IMPOR FUNGSI LOGIKA DARI PLUGIN ANDA ---

// (Sesuaikan path/jalur ini jika file cekkuota.js Anda tidak ada di 'plugins/tools/cekkuota.js')

import { executeCek } from "./plugins/tools/cekkuota.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const LOCK_FILE = path.join(__dirname, "off.lock");

if (cluster.isPrimary) {

  console.clear();

  console.log("🌟 Memulai bot dengan sistem \x1b[33mAuto-Restart\x1b[0m...\n");

  const startWorker = () => {

    const worker = cluster.fork();

    console.log(`🚀 Worker PID ${worker.process.pid} dimulai`);

    worker.on("exit", (code, signal) => {

      console.log(`\n❌ Bot mati (code: ${code}, signal: ${signal})`);

      console.log("🔁 Restarting bot in 3 detik...");

      setTimeout(startWorker, 3000);

    });

  };

  startWorker();

} else {

  (async () => {

    try {

      if (!config.TOKEN) {

        console.log("\n\x1b[31m⛔ TOKEN BOT TIDAK DITEMUKAN!\x1b[0m");

        console.log("→ Periksa file config.js kamu!");

        process.exit(1);

      }

      if (fs.existsSync(LOCK_FILE)) {

        console.log("\x1b[31m🚫 Bot sedang dimatikan (OFF mode).\x1b[0m");

        console.log("→ Hapus file off.lock untuk menyalakan kembali.");

        process.exit(0);

      }

      const bot = new Telegraf(config.TOKEN);

      bot.context.pluginMeta = {};

      bot.context.pluginList = [];

      bot.context.globalHandlers = [];

      // Middleware identifikasi owner

      bot.use((ctx, next) => {

        ctx.isOwner = ctx.from?.id === config.OWNER_ID;

        ctx.config = config;

        ctx.bot = bot;

        return next();

      });

      // --- AKTIFKAN SESI (SESSION) ---

      // Ini akan membuat ctx.session tersedia

      bot.use(session({

        defaultSession: () => ({ awaiting: null }) // Buat objek sesi default

      }));

      // Load plugin

      await loadPlugins(bot);

      // --- TAMBAHAN BARU: Penangan Teks untuk Sesi ---

      // Handler ini berjalan untuk SEMUA pesan teks

      // Ini harus ada SEBELUM logging dan SEBELUM AI

      bot.on("message", async (ctx, next) => {

        const text = ctx.message?.text;

        

        // Cek apakah ada sesi 'awaiting'

        if (text && ctx.session && ctx.session.awaiting === 'cek') {

          ctx.session.awaiting = null; // Hapus sesi agar tidak diproses lagi

          

          if (text.toLowerCase() === 'exit') {

            return ctx.reply('Dibatalkan.');

          }

          

          // Jalankan logika 'cek' dengan nomor yang diberikan

          return executeCek(ctx, text); 

        }

        

        // Jika tidak ada sesi, lanjutkan ke handler berikutnya (logging, AI)

        return next();

      });

      // Logging pesan masuk

      bot.on("message", async (ctx, next) => {

        try {

          const msg = ctx.message;

          const user = ctx.from;

          const chat = ctx.chat;

          if (!msg || !user) return next();

          const text =

            msg.text ||

            msg.caption ||

            msg.reply_to_message?.text ||

            msg.reply_to_message?.caption;

          if (!text) return next();

          let commandUsed = "-";

          if (msg.entities?.length) {

            const cmdEntity = msg.entities.find(e => e.type === "bot_command");

            if (cmdEntity) {

              commandUsed = text.slice(cmdEntity.offset, cmdEntity.offset + cmdEntity.length);

            }

          }

          const chatType = chat?.type?.includes("group") ? "Group" : "Private";

          const groupId = chat?.id || "-";

          const groupName = chat?.title || chat?.first_name || "-";

          console.log(chalk.magenta("\n┏━━━━━━━━━━━━━━━ 📥 Pesan Masuk ━━━━━━━━━━━━━━━┓"));

          console.log(chalk.blue(`┃ 🧾 Teks Pesan        : ${text}`));

          console.log(chalk.green(`┃ 👤 Username          : @${user.username || "-"}`));

          console.log(chalk.yellow(`┃ 🏷 Nama Depan        : ${user.first_name || "-"}`));

          console.log(chalk.cyan(`┃ 🏷 Nama Belakang     : ${user.last_name || "-"}`));

          console.log(chalk.white(`┃ ⚡ Command Digunakan : ${commandUsed}`));

          console.log(chalk.red(`┃ 🗂 Tipe Chat         : ${chatType}`));

          console.log(chalk.redBright(`┃ 🆔 ID Grup/Private   : ${groupId}`));

          console.log(chalk.magenta(`┃ 📌 Nama Grup/Private : ${groupName}`));

          console.log(chalk.magenta("┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛"));

        } catch (err) {

          console.error("❌ Error logging message:", err.message);

        }

        return next();

      });

      // Auto AI eksternal

      if (config.USE_AUTO_AI) {

        const conversationHistory = {};

        bot.on("message", async (ctx, next) => {

          // --- TAMBAHAN: Jangan jalankan AI jika sedang menunggu sesi ---

          if (ctx.session && ctx.session.awaiting) return next();

          

          try {

            const text =

              ctx.message?.text ||

              ctx.message?.caption ||

              ctx.message?.reply_to_message?.text ||

              ctx.message?.reply_to_message?.caption;

            if (!text) return next();

            const userId = ctx.from.id;

            const chatType = ctx.chat?.type || "";

            const botMentioned =

              ctx.message?.entities?.some(

                e =>

                  e.type === "mention" &&

                  text.slice(e.offset, e.offset + e.length).includes(ctx.bot.botInfo.username)

              ) || false;

            if (chatType.includes("group") && !botMentioned) return next();

            if (!conversationHistory[userId]) conversationHistory[userId] = [];

            conversationHistory[userId].push({ role: "user", content: text });

            const url = `https://api.nefusoft.cloud/api/v1/ai/gpt?prompt=${encodeURIComponent(text)}`;

            const { data } = await axios.get(url);

            const aiReply = data?.result || "🤖 AI tidak merespon.";

            conversationHistory[userId].push({ role: "assistant", content: aiReply });

            await new Promise(r => setTimeout(r, Math.min(1000 + aiReply.length * 30, 5000)));

            await ctx.reply(aiReply);

          } catch (err) {

            console.error("❌ Auto AI API eksternal error:", err.message);

          }

          return next();

        });

        console.log(

          chalk.green(

            "🤖 Auto AI eksternal aktif. Gunakan dengan bijak, jika error hubungi https://t.me/ReyzID12"

          )

        );

      }

      // Launch bot

      await bot.launch();

      console.log(chalk.green("\n✨ Bot Telegram AKTIF dengan Auto AI OpenAI"));

      console.log(chalk.yellow("⚡ Mode: Clean, Fast & AI 🚀"));

      process.once("SIGINT", () => bot.stop("SIGINT"));

      process.once("SIGTERM", () => bot.stop("SIGTERM"));

    } catch (err) {

      console.error(chalk.red("❌ Terjadi kesalahan saat startup:"), err);

      process.exit(1);

    }

  })();

}