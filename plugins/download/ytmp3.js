import fetch from 'node-fetch'

export default {
    command: ['ytmp3'],
    tags: ['downloader'],
    desc: '⬇️ Download MP3 langsung dari link YouTube',

    async handler(ctx) {
        const text = ctx.message?.text?.split(' ').slice(1).join(' ')
        if (!text) return ctx.reply('❌ Masukkan link YouTube!\nContoh: /ytmp3 https://youtu.be/mC9v5FaLt84')

        try {
            // 1️⃣ Ambil info & download URL dari API ZenzXz
            const apiRes = await fetch(`https://api.zenzxz.my.id/downloader/ytmp3?url=${encodeURIComponent(text)}`)
            const apiJson = await apiRes.json()

            if (!apiJson.status || !apiJson.download_url)
                throw new Error('❌ Gagal mendapatkan URL download MP3')

            const { title, download_url, thumbnail, duration } = apiJson

            // 2️⃣ Kirim thumbnail + info
            const caption = `
🎶━━━━━━━━━━━━━━━🎶
✨ *Y T M P 3* ✨
🎶━━━━━━━━━━━━━━━🎶

🎧 *Title:* ${title}
⏰ *Duration:* ${duration} detik
🔗 *Link:* ${text}
🎶━━━━━━━━━━━━━━━🎶
`.trim()

            await ctx.replyWithPhoto(thumbnail.split('?')[0], { caption, parse_mode: 'Markdown' })

            // 3️⃣ Download audio
            const audioRes = await fetch(download_url)
            if (!audioRes.ok) throw new Error('❌ Gagal download MP3 dari ZenzXz')

            const audioBuffer = Buffer.from(await audioRes.arrayBuffer())

            // 4️⃣ Kirim MP3 ke user
            await ctx.replyWithAudio({ source: audioBuffer, filename: `${title}.mp3` })

        } catch (e) {
            console.error(e)
            ctx.reply('❌ Terjadi kesalahan saat mendownload MP3.')
        }
    }
}
