import fetch from 'node-fetch'

export default {
    command: ['play'],
    tags: ['downloader'],
    desc: '🎵 Download & kirim MP3 YouTube pakai API ZenzXz terbaru',

    async handler(ctx) {
        const text = ctx.message?.text?.split(' ').slice(1).join(' ')
        if (!text) return ctx.reply('❌ Masukkan query!\nContoh: /play mantra hujan')

        try {
            // 1️⃣ Cari video via API AsagiOfficial
            const searchRes = await fetch(`https://api.asagiofficial.idnet.my.id/search/youtube?q=${encodeURIComponent(text)}`)
            const searchJson = await searchRes.json()

            if (!searchJson.status || !searchJson.result || !searchJson.result.length)
                throw new Error('Tidak ada hasil')

            const video = searchJson.result[0]
            const { title, channel, duration, imageUrl, link } = video

            const caption = `
🎶━━━━━━━━━━━━━━━🎶
✨ *P L A Y Y O U T U B E* ✨
🎶━━━━━━━━━━━━━━━🎶

🎧 *Title:* ${title}
📺 *Channel:* ${channel}
⏰ *Duration:* ${duration}

🔗 *Link:* ${link}
🎶━━━━━━━━━━━━━━━🎶
`.trim()

            // 2️⃣ Kirim thumbnail + caption
            await ctx.replyWithPhoto(imageUrl.split('?')[0], { caption, parse_mode: 'Markdown' })

            // 3️⃣ Download MP3 via API ZenzXz terbaru
            const apiDownloadRes = await fetch(`https://api.zenzxz.my.id/downloader/ytmp3?url=${encodeURIComponent(link)}`)
            const apiJson = await apiDownloadRes.json()

            if (!apiJson.status || !apiJson.download_url)
                throw new Error('Gagal mendapatkan URL download MP3')

            const downloadUrl = apiJson.download_url
            const audioRes = await fetch(downloadUrl)
            if (!audioRes.ok) throw new Error('Gagal download MP3 dari ZenzXz')

            const audioBuffer = Buffer.from(await audioRes.arrayBuffer())

            // 4️⃣ Kirim audio ke user
            await ctx.replyWithAudio({ source: audioBuffer, filename: `${title}.mp3` })

        } catch (e) {
            console.error(e)
            ctx.reply('❌ Tidak dapat menemukan atau mengirim audio dari query tersebut.')
        }
    }
}
