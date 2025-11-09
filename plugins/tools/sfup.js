import fs from "fs";
import axios from "axios";
import FormData from "form-data";

export default {
  command: ["sfup"],
  tags: ["tools"],
  desc: "⬆️ Upload file ke Sfile dengan hiasan Donghua kawaii + garis",
  usage: "Kirim/reply file dengan caption /sfup",

  async handler(ctx) {
    try {
      // 🔍 Cek apakah ada file dikirim atau direply
      const message = ctx.message || ctx.update.message;
      const document =
        message.document ||
        (message.reply_to_message && message.reply_to_message.document);

      if (!document) {
        return ctx.reply("❌ Kirim atau reply file dengan caption /sfup");
      }

      await ctx.reply("⬆️ Mengunggah ke Sfile...");

      // 📥 Download file dari Telegram
      const fileId = document.file_id;
      const fileLink = await ctx.telegram.getFileLink(fileId);

      // Gunakan folder temp di project (lebih aman daripada /tmp di Termux)
      const tempDir = "./temp";
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

      const filePath = `${tempDir}/${document.file_name}`;

      const response = await axios.get(fileLink.href, {
        responseType: "stream",
      });

      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });

      // ⬆️ Upload ke Sfile
      const form = new FormData();
      form.append("file", fs.createReadStream(filePath));

      const res = await axios.post(
        "https://sfile-api.zone.id/tools/sfup?apikey=bagus",
        form,
        {
          headers: form.getHeaders(),
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        },
      );

      // 🧹 Hapus file sementara
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

      const data = res.data;

      if (!data.success || !Array.isArray(data.urls)) {
        return ctx.reply("❌ Gagal mengunggah file ke Sfile.");
      }

      const link = data.urls[0] || "-";

      const caption = `
╔═══════════════════════
📂 Nama File : ${data.filename}
🕒 Upload    : ${data.uploaded_at}
🔗 Link      : ${link}
╚═══════════════════════
      `;

      await ctx.replyWithMarkdown(caption);
    } catch (err) {
      console.error("Sfile Upload Error:", err);
      ctx.reply(
        `❌ Gagal upload ke Sfile:\n${err.response?.data?.message || err.message}`,
      );
    }
  },
};