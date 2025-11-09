import fetch from 'node-fetch'

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function spamngl(link, pesan, jumlah, delayMs = 1000, onProgress) {
  if (!link.startsWith('https://ngl.link/')) throw new Error('❌ Link harus dimulai dengan https://ngl.link/')
  if (!pesan) throw new Error('❌ Pesan tidak boleh kosong.')
  if (isNaN(jumlah) || jumlah < 1) throw new Error('❌ Jumlah minimal harus 1')
  if (isNaN(delayMs) || delayMs < 0) throw new Error('❌ Delay harus berupa angka positif')

  const username = link.split('https://ngl.link/')[1]
  if (!username) throw new Error('❌ Username tidak ditemukan dari link')

  for (let i = 0; i < jumlah; i++) {
    try {
      await fetch('https://ngl.link/api/submit', {
        method: 'POST',
        headers: {
          'accept': '*/*',
          'content-type': 'application/x-www-form-urlencoded; charset=UTF-8'
        },
        body: `username=${username}&question=${encodeURIComponent(pesan)}&deviceId=1`
      })
      if (onProgress) onProgress(i + 1)
      await delay(delayMs)
    } catch (err) {
      console.error('❌ Gagal kirim:', err)
    }
  }

  return `✅ Berhasil kirim *${jumlah} pesan* ke @${username} dengan delay ${delayMs}ms`
}

export default {
  command: ['spamngl'],
  tags: ['tools'],
  desc: '📨 Kirim spam pesan ke akun NGL.link (support reply, delay custom & progress live)',
  async handler(ctx) {
    // Ambil teks dari command atau reply
    let input = ctx.message.text.split(' ').slice(1).join(' ').trim()
    if (!input && ctx.message.reply_to_message) {
      input = ctx.message.reply_to_message.text?.trim() || ''
    }

    // Validasi input
    if (!input) return ctx.reply(
      `❌ *Link NGL.link belum dikirim!*\n\n` +
      `📌 Contoh:\n` +
      `\`/spamngl https://ngl.link/username|5|Halo NGL Bot!|2000\``,
      { parse_mode: 'Markdown' }
    )

    if (!input.includes('|')) return ctx.reply(
      `❌ *Format salah!*\n\n` +
      `📌 Contoh:\n` +
      `\`/spamngl https://ngl.link/username|5|Halo NGL Bot!|2000\``,
      { parse_mode: 'Markdown' }
    )

    let [link, jumlahStr, ...rest] = input.split('|')
    let jumlah = parseInt(jumlahStr)

    // Ambil delay jika ada
    let delayMs = 1000
    let pesan
    if (rest.length > 1) {
      delayMs = parseInt(rest[rest.length - 1])
      pesan = rest.slice(0, rest.length - 1).join('|').trim()
    } else {
      pesan = rest.join('|').trim()
    }

    // Kirim pesan awal
    const msg = await ctx.reply(
      `🕐━━━━━━━━━━━━━━━🕐\n` +
      `⏳ Sedang mengirim pesan ke NGL.link...\n` +
      `📩 Total: ${jumlah} pesan\n` +
      `⏱ Delay: ${delayMs}ms\n` +
      `🕐━━━━━━━━━━━━━━━🕐`,
      { parse_mode: 'Markdown' }
    )

    try {
      // Jalankan spam dengan progress callback
      await spamngl(link.trim(), pesan, jumlah, delayMs, async (sent) => {
        await ctx.telegram.editMessageText(
          msg.chat.id,
          msg.message_id,
          null,
          `🕐━━━━━━━━━━━━━━━🕐\n` +
          `⏳ Sedang mengirim pesan ke NGL.link...\n` +
          `📩 Total: ${jumlah} pesan\n` +
          `✅ Terkirim: ${sent}\n` +
          `⏱ Delay: ${delayMs}ms\n` +
          `🕐━━━━━━━━━━━━━━━🕐`,
          { parse_mode: 'Markdown' }
        )
      })

      // Pesan akhir
      await ctx.telegram.editMessageText(
        msg.chat.id,
        msg.message_id,
        null,
        `🎉━━━━━━━━━━━━━━━🎉\n` +
        `✨ *S P A M  N G L* ✨\n` +
        `🎉━━━━━━━━━━━━━━━🎉\n\n` +
        `✅ Berhasil kirim *${jumlah} pesan* ke ${link.trim()}\n` +
        `📩 Pesan: "${pesan}"\n` +
        `⏱ Delay: ${delayMs}ms\n` +
        `🎶━━━━━━━━━━━━━━━🎶`,
        { parse_mode: 'Markdown' }
      )

    } catch (e) {
      ctx.reply(`❌ Error: ${e?.message || e}`)
    }
  }
}
