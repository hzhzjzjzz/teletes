import axios from "axios";
import * as cheerio from "cheerio";
import FormData from "form-data";
import moment from "moment-timezone";

const globalQueue = new Map();

async function tiktokV1(url) {
  const encoded = new URLSearchParams();
  encoded.set("url", url);
  encoded.set("hd", "1");

  const { data } = await axios.post("https://tikwm.com/api/", encoded, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      Cookie: "current_language=en",
      "User-Agent":
        "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36",
    },
  });
  return data;
}

async function tiktokV2(url) {
  const form = new FormData();
  form.append("q", url);

  const { data } = await axios.post("https://savetik.co/api/ajaxSearch", form, {
    headers: {
      ...form.getHeaders(),
      Accept: "/",
      Origin: "https://savetik.co",
      Referer: "https://savetik.co/en2",
      "User-Agent":
        "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36",
      "X-Requested-With": "XMLHttpRequest",
    },
  });

  const $ = cheerio.load(data.data);
  const title = $(".thumbnail .content h3").text().trim();
  const thumbnail = $(".thumbnail .image-tik img").attr("src");
  const video_url = $("video#vid").attr("data-src");

  const slide_images = [];
  $(".photo-list .download-box li").each((_, el) => {
    const imgSrc = $(el).find(".download-items__thumb img").attr("src");
    if (imgSrc) slide_images.push(imgSrc);
  });

  return { title, thumbnail, video_url, slide_images };
}

export default {
  command: ["tiktok", "tt"],
  tags: ["downloader"],
  help: ["tiktok2 <url>"],
  desc: "📥 Download video TikTok tanpa watermark (Multi Antrian)",

  async handler(ctx) {
    const userId = ctx.from?.id;
    const isGroup = ctx.chat?.type?.endsWith("group");
    const text = ctx.message?.text?.split(" ").slice(1).join(" ");
    const timeStart = moment().tz("Asia/Jakarta").format("HH:mm:ss");

    if (!text) {
      return ctx.reply(
        "❌ Masukkan URL TikTok!\n\n📌 *Contoh:*\n/tiktok2 https://vt.tiktok.com/xxxxxx",
        { parse_mode: "Markdown" },
      );
    }

    // Multi antrian per pengguna
    if (globalQueue.has(userId)) {
      return ctx.reply(
        `⏳ *Sedang diproses...*\nMohon tunggu giliranmu ya! 🙏`,
      );
    }

    globalQueue.set(userId, true);
    await ctx.reply(
      `⏱️ *Permintaan diterima!* [${timeStart}]\nSedang mengunduh...`,
    );

    try {
      let res = {};
      let images = [];

      const dataV1 = await tiktokV1(text);
      if (dataV1?.data) {
        const d = dataV1.data;
        if (Array.isArray(d.images)) images = d.images;
        else if (Array.isArray(d.image_post)) images = d.image_post;

        res = {
          title: d.title,
          region: d.region,
          duration: d.duration,
          create_time: d.create_time,
          play_count: d.play_count,
          digg_count: d.digg_count,
          comment_count: d.comment_count,
          share_count: d.share_count,
          download_count: d.download_count,
          author: {
            unique_id: d.author?.unique_id,
            nickname: d.author?.nickname,
          },
          music_info: {
            title: d.music_info?.title,
            author: d.music_info?.author,
          },
          cover: d.cover,
          play: d.play,
          hdplay: d.hdplay,
          wmplay: d.wmplay,
        };
      }

      const dataV2 = await tiktokV2(text);
      if (!res.play && images.length === 0 && dataV2.video_url) {
        res.play = dataV2.video_url;
      }
      if (Array.isArray(dataV2.slide_images)) {
        images = dataV2.slide_images;
      }

      const timePost = res.create_time
        ? moment
            .unix(res.create_time)
            .tz("Asia/Jakarta")
            .format("D MMM YYYY [pukul] HH:mm")
        : "-";

      const caption = `╭───「 *🎬 TikTok Downloader* 」───⬣
│📛 *Judul:* ${res.title || "-"}
│👤 *User:* @${res.author?.unique_id || "-"}
│📌 *Nama:* ${res.author?.nickname || "-"}
│🎵 *Lagu:* ${res.music_info?.title} - ${res.music_info?.author}
│🌍 *Region:* ${res.region || "-"}
│⏳ *Durasi:* ${res.duration || 0}s
│🕒 *Upload:* ${timePost}
│
│📊 *Statistik:*
│👁️ Views: ${res.play_count || 0}
│❤️ Likes: ${res.digg_count || 0}
│💬 Komentar: ${res.comment_count || 0}
│🔁 Share: ${res.share_count || 0}
│⬇️ Download: ${res.download_count || 0}
╰────────────────────⬣`;

      const videoUrl = res.play || res.hdplay || res.wmplay;

      if (images.length > 0) {
        await ctx.reply(
          `📸 *Terdeteksi ${images.length} gambar.*\nMengirim ke DM...`,
        );
        for (const img of images) {
          await ctx.telegram.sendPhoto(
            userId,
            { url: img },
            { caption: res.title || "", parse_mode: "Markdown" },
          );
        }
        return;
      }

      if (videoUrl) {
        if (isGroup) {
          await ctx.reply(
            "📬 *Video akan dikirim ke DM kamu.*\nSilakan buka chat pribadi dengan bot.",
          );
          await ctx.telegram.sendVideo(
            userId,
            { url: videoUrl },
            { caption, parse_mode: "Markdown" },
          );
        } else {
          await ctx.replyWithVideo(
            { url: videoUrl },
            { caption, parse_mode: "Markdown" },
          );
        }
      } else if (res.cover) {
        await ctx.replyWithPhoto(
          { url: res.cover },
          { caption: "📷 *Thumbnail video*", parse_mode: "Markdown" },
        );
      } else {
        await ctx.reply("❌ Gagal mengambil video.");
      }
    } catch (e) {
      console.error(e);
      await ctx.reply(`⚠️ *Terjadi kesalahan:*\n\`${e.message}\``, {
        parse_mode: "Markdown",
      });
    } finally {
      globalQueue.delete(userId);
      const timeEnd = moment().tz("Asia/Jakarta").format("HH:mm:ss");
      console.log(`[${timeEnd}] ✅ TikTok selesai untuk ${userId}`);
    }
  },
};
