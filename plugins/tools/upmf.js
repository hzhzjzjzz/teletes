import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import path from "path";
import { tmpdir } from "os";

export default {
  command: ["upmf"],
  tags: ["tools"],
  help: ["📤 /upmf — Balas media apa pun untuk upload ke MediaFire"],
  owner: false,
  premium: false,

  async handler(ctx) {
    try {
      const q = ctx.message?.reply_to_message;
      if (!q || (!q.document && !q.photo && !q.video && !q.audio && !q.voice)) {
        return ctx.reply(
          "⚠️ *Balas media apa pun!*\n\nContoh: foto, video, dokumen, audio.\nLalu ketik /upmf untuk unggah ke MediaFire.",
          {
            parse_mode: "Markdown",
          },
        );
      }

      await ctx.reply(
        "📤 *Mengunggah ke MediaFire...*\nMohon tunggu sebentar ⏳",
        {
          parse_mode: "Markdown",
        },
      );

      const file =
        q.document || q.photo?.slice(-1)[0] || q.video || q.audio || q.voice;
      const fileId = file.file_id;
      const fileName = file.file_name || `upload_${Date.now()}.bin`;

      const link = await ctx.telegram.getFileLink(fileId);
      const res = await axios.get(link.href, { responseType: "arraybuffer" });

      const tempPath = path.join(tmpdir(), fileName);
      fs.writeFileSync(tempPath, res.data);

      const form = new FormData();
      form.append("file", fs.createReadStream(tempPath), fileName);

      const { data } = await axios.post(
        "https://fgsi.koyeb.app/api/upload/uploadMediaFire",
        form,
        {
          headers: {
            ...form.getHeaders(),
            apikey: "fgsiapi-171dc826-6d",
          },
        },
      );

      fs.unlinkSync(tempPath); // hapus file setelah upload

      const result = data.data;
      return ctx.replyWithMarkdown(
        `
┌──⭓ *Upload Berhasil!*
│ 📁 *Nama:* \`${fileName}\`
│ 🌐 *Link:*
│ ${result.links.normal_download}
└────────────⭓
`,
        {
          disable_web_page_preview: true,
        },
      );
    } catch (err) {
      console.error(err);
      return ctx.reply(`❌ *Gagal mengunggah:*\n\`${err.message}\``, {
        parse_mode: "Markdown",
      });
    }
  },
};
