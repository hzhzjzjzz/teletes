import fetch from 'node-fetch'
import FormData from 'form-data'

export default {
    command: ['tourl'],
    tags: ['tools'],
    desc: '📤 Upload file/media ke Catbox dengan reply + caption custom',

    async handler(ctx) {
        const reply = ctx.message?.reply_to_message
        const userCaption = ctx.message?.text?.split(' ').slice(1).join(' ')

        if (!reply || !(reply.document || reply.video || reply.audio || reply.photo)) {
            return ctx.reply('❌ Balas file, audio, video, atau foto untuk diupload ke Catbox.\nContoh: /tourl [caption opsional]')
        }

        try {
            let fileId
            if (reply.document) fileId = reply.document.file_id
            else if (reply.video) fileId = reply.video.file_id
            else if (reply.audio) fileId = reply.audio.file_id
            else if (reply.photo) fileId = reply.photo[reply.photo.length - 1].file_id

            // Ambil URL file dari Telegram
            const fileLink = await ctx.telegram.getFileLink(fileId)

            // Download file dari Telegram
            const fileRes = await fetch(fileLink.href)
            const fileBuffer = Buffer.from(await fileRes.arrayBuffer())

            // Upload ke Catbox
            const form = new FormData()
            form.append('reqtype', 'fileupload')
            form.append('userhash', '') // opsional
            form.append('fileToUpload', fileBuffer, { filename: reply.document?.file_name || 'file' })

            const uploadRes = await fetch('https://catbox.moe/user/api.php', { method: 'POST', body: form })
            const uploadText = await uploadRes.text()

            // Kirim URL dengan hiasan dan caption custom
            const caption = `
🎶━━━━━━━━━━━━━━━🎶
✨ *C A T B O X  U P L O A D* ✨
🎶━━━━━━━━━━━━━━━🎶

✅ File berhasil diupload!
📂 Nama file: ${reply.document?.file_name || reply.video?.file_name || 'file'}
🔗 URL: ${uploadText}

${userCaption ? `📝 Caption: ${userCaption}` : ''}
🎶━━━━━━━━━━━━━━━🎶
`.trim()

            ctx.reply(caption, { parse_mode: 'Markdown' })

        } catch (err) {
            console.error(err)
            ctx.reply('❌ Gagal mengupload file ke Catbox.')
        }
    }
}
