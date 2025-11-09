import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment-timezone';

/**
 * Fungsi untuk "meloloskan" karakter khusus Markdown V2 yang lebih aman.
 * Ini mencegah error "can't parse entities" dari karakter seperti *, _, ~, dll.
 * @param {string} text - Teks yang akan dibersihkan.
 * @returns {string} Teks yang aman untuk Markdown.
 */
function escapeMarkdownV2(text) {
    if (typeof text !== 'string') return '';
    // Karakter yang perlu di-escape dalam MarkdownV2
    const charsToEscape = /([_*\[\]()~`>#+\-=|{}.!])/g;
    return text.replace(charsToEscape, '\\$1');
}

export default {
    command: ['beli', 'topup', 'order'],
    tags: ['gifar'],
    desc: 'Melakukan pembelian produk (top-up) via API.',

    async handler(ctx) {
        const OWNER_ID = '1284296702';
        
        const fromId = ctx.message?.from?.id;
        if (fromId != OWNER_ID) {
            return ctx.reply('❌ Hanya owner bot yang bisa menggunakan perintah ini.');
        }
        
        const KODE_RESELLER = 'NF00051';
        const PIN = '967400';
        const PASSWORD = 'gifar123';
        const API_URL = 'http://213.163.206.110:3333/api';

        const text = ctx.message?.text?.split(' ').slice(1).join(' ');
        if (!text) {
            return ctx.reply('❌ Format salah! Masukkan kode produk dan nomor tujuan.\nContoh: /beli BPAXL3 08123456789');
        }

        const args = text.split(/\s+/);
        const produk = args[0];
        const msisdn = args[1];

        if (!produk || !msisdn) {
            return ctx.reply('❌ Kode produk atau nomor tujuan tidak ditemukan.');
        }

        const timeFormatted = moment().tz("Asia/Jakarta").format("HHmmss");
        const reffid = uuidv4().replace(/-/g, '');

        try {
            const loadingMessage = await ctx.reply('⏳ Memproses transaksi, mohon tunggu...');

            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    req: 'topup',
                    kodereseller: KODE_RESELLER,
                    produk: produk,
                    msisdn: msisdn.replace(/[^0-9]/g, ''),
                    reffid: reffid,
                    time: timeFormatted,
                    pin: PIN,
                    password: PASSWORD
                })
            });

            const result = await response.json();

            const balanceRegex = /Saldo\s*[\d,.]+\s*-\s*[\d,.]+\s*=\s*[\d,.]+/;
            const rawMsg = result.msg ? result.msg.replace(balanceRegex, 'Saldo tersembunyi.') : 'Tidak ada pesan dari server.';
            
            // --- PERBAIKAN UTAMA DI SINI ---
            // Bersihkan semua variabel yang datang dari API sebelum digunakan di Markdown
            const escapedApiMsg = escapeMarkdownV2(rawMsg);
            const escapedProduk = escapeMarkdownV2(result.produk);
            const escapedMsisdn = escapeMarkdownV2(result.msisdn);
            const escapedTrxid = escapeMarkdownV2(result.trxid);
            const escapedReffid = escapeMarkdownV2(result.reffid);
            const escapedStatus = escapeMarkdownV2(result.status);

            let finalMessage;
            if (result.status_code === '0' && result.status === 'Sukses') {
                finalMessage = `🎉 *TRANSAKSI BERHASIL\\!* 🎉
═══════════════════════
📦 Produk: *${escapedProduk}*
📞 Tujuan: *${escapedMsisdn}*
🆔 TrxID: *${escapedTrxid}*
🔗 ReffID: *${escapedReffid}*

_Pesan Sistem: ${escapedApiMsg}_
═══════════════════════`;
            } else {
                finalMessage = `🚫 *TRANSAKSI GAGAL\\!*
═══════════════════════
Status: *${escapedStatus}*
Alasan: ${escapedApiMsg}
_Silakan periksa kembali format Anda atau saldo Anda\\._
═══════════════════════`;
            }

            await ctx.telegram.editMessageText(
                ctx.chat.id,
                loadingMessage.message_id,
                undefined,
                finalMessage,
                // Gunakan MarkdownV2 yang lebih ketat tapi lebih aman
                { parse_mode: 'MarkdownV2' }
            );

        } catch (error) {
            console.error('Error saat melakukan transaksi:', error);
            ctx.reply('Terjadi kesalahan fatal saat menghubungi server. Mohon coba lagi nanti.');
        }
    }
};