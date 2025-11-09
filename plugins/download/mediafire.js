import axios from "axios";
import mime from "mime-types";
import * as cheerio from "cheerio";
import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";
import { config } from "../../config.js";

const MAX_SIZE_MB = 999;

export default {
  command: ["mf", "mfdl", "mediafire"],
  tags: ["downloader"],
  desc: "📦 Download file dari Mediafire",

  async handler(ctx) {
    const text = ctx.message?.text?.split(" ")?.slice(1)?.join(" ");
    const sender = ctx.from.id;
    const isGroup = ctx.chat?.type?.includes("group");

    if (!text)
      return ctx.reply(`╭───〔 ${config.BOTNAME} 〕───⬣
│ Contoh penggunaan:
│ /mediafire https://www.mediafire.com/file/xxx/namafile.zip/file
╰────────────⬣`);

    if (!/mediafire\.com/.test(text))
      return ctx.reply(`❌ Link tidak valid. Hanya support *mediafire.com*`);

    try {
      // 🔎 Ambil HTML via API
      const { data } = await axios.get(
        "https://api.nekorinn.my.id/tools/rynn-stuff-v2",
        {
          params: {
            method: "GET",
            url: text,
            accessKey:
              "3ebcf782818cfa0b7265086f112ae25c0954afec762aa05a2eac66580c7cb353",
          },
        },
      );

      const $ = cheerio.load(data.result.response);
      const raw = $("div.dl-info");

      let filename =
        $(".dl-btn-label").attr("title") ||
        raw.find("div.intro div.filename").text().trim();

      // 🧹 Sanitize nama file (hilangkan karakter berbahaya)
      filename = filename.replace(/[<>:"/\\|?*]+/g, "_");

      const ext = filename.split(".").pop();
      const mimetype =
        mime.lookup(ext.toLowerCase()) || "application/octet-stream";
      const filesize = raw
        .find("ul.details li:nth-child(1) span")
        .text()
        .trim();
      const uploaded = raw
        .find("ul.details li:nth-child(2) span")
        .text()
        .trim();
      const dl = $("a#downloadButton").attr("data-scrambled-url");

      if (!dl) return ctx.reply("❌ Gagal mengambil link download.");

      const decoded = Buffer.from(dl, "base64").toString();
      const sizeInMB =
        parseFloat(filesize) *
        (filesize.toLowerCase().includes("gb") ? 1024 : 1);

      const caption = `
╭━━〔 📦 MediaFire Downloader 〕━━⬣
┃ 📁 *Nama:* ${filename}
┃ 📄 *Tipe:* ${mimetype}
┃ 💾 *Ukuran:* ${filesize}
┃ 🗓️ *Upload:* ${uploaded}
╰━━━━━━━━━━━━━━━━━━━━⬣
🤖 Powered by *${config.BOTNAME}*
`.trim();

      const contextInfo = {
        message_thread_id: ctx.message?.message_thread_id,
        reply_markup: {
          inline_keyboard: [[{ text: "🌐 Download Manual", url: decoded }]],
        },
      };

      console.log(
        `[MEDIAFIRE] ${filename} | ${filesize} | ${mimetype} | ${decoded}`,
      );

      if (sizeInMB > MAX_SIZE_MB) {
        return ctx.reply(`❌ Ukuran file *${sizeInMB.toFixed(2)} MB* melebihi batas ${MAX_SIZE_MB} MB.
Silakan unduh manual:
${decoded}`);
      }

      // 📥 Download file asli
      const response = await axios.get(decoded, {
        responseType: "arraybuffer",
      });

      // 📂 Simpan sementara file asli
      const tempDir = path.join(process.cwd(), "temp");
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

      const originalPath = path.join(tempDir, filename);
      fs.writeFileSync(originalPath, response.data);

      // 📦 Bungkus ke ZIP
      const zip = new AdmZip();
      zip.addFile(filename, fs.readFileSync(originalPath));
      const zipBuffer = zip.toBuffer();
      const zipName = filename.replace(/\.[^/.]+$/, "") + ".zip";
      const zipPath = path.join(tempDir, zipName);
      fs.writeFileSync(zipPath, zipBuffer);

      const sendTo = isGroup ? sender : ctx.chat.id;

      // 📤 Kirim ZIP ke user
      await ctx.telegram.sendDocument(
        sendTo,
        { source: zipPath },
        { caption, filename: zipName, ...contextInfo },
      );

      if (isGroup) ctx.reply(`✅ File telah dikirim ke private kamu.`);

      // 🧹 Hapus file sementara dengan pengecekan biar gak ENOENT
      for (const file of [originalPath, zipPath]) {
        if (fs.existsSync(file)) {
          try {
            fs.unlinkSync(file);
          } catch (e) {
            console.warn("⚠️ Gagal hapus file:", file, e.message);
          }
        }
      }
    } catch (err) {
      console.error(`[MEDIAFIRE ERROR] ${err.message}`);
      ctx.reply(`❌ Terjadi kesalahan:\n${err.message}`);
    }
  },
};