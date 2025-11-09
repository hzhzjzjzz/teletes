import fetch from 'node-fetch';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

export default {
    command: ['beli2', 'topup2', 'order2'],
    tags: ['gifar'],
    desc: 'Melakukan transaksi pembelian produk.',

    async handler(ctx) {
        // Ganti dengan ID Telegram Anda sebagai pemilik
        // Contoh: const OWNER_ID = 123456789;
        const OWNER_ID = '1284296702';

        const fromId = ctx.message?.from?.id;
        
        // Kode untuk mengecek apakah pengirim adalah pemilik
        if (fromId != OWNER_ID) {
            return ctx.reply("❌ Hanya owner bot yang bisa menggunakan perintah ini.");
        }
        
        // Kredensial akun Anhtronik Anda
        const API_ID = 'NZE757663C';
        const API_KEY = '55a0bfa0a802e8fb79262cc20a0ee3af118398d5962f096081140fa71ef3d990';
        const CMD = 'order';
        const API_URL = 'https://anhtronik.com/integration/api/order';

        const text = ctx.message?.text?.split(' ').slice(1).join(' ');
        if (!text) {
            return ctx.reply('❌ Format salah! Masukkan kode produk dan nomor tujuan.\nContoh: /order D5 08123456789');
        }

        const args = text.split(/\s+/);
        const productCode = args[0];
        const destination = args[1];

        if (!productCode || !destination) {
            return ctx.reply('❌ Kode produk atau nomor tujuan tidak ditemukan.');
        }
        
        const cleanedDestination = destination.replace(/[^0-9]/g, '');
        const refId = uuidv4().replace(/-/g, '');

        const signature = crypto.createHash('md5').update(API_ID + API_KEY + CMD + refId).digest('hex');

        const requestBody = {
            cmd: CMD,
            api_id: API_ID,
            ref_id: refId,
            product_code: productCode,
            destination: cleanedDestination,
            signature: signature,
        };

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            const result = await response.json();

            if (result.code === 200 && result.status === 'success') {
                const data = result.data;
                const message = `✅ *Transaksi Berhasil Diproses!*
═══════════════════════
📦 Produk: *${data.product_name}* (${data.product_code})
📞 Tujuan: *${data.destination}*
🆔 Trx ID: *${data.trx_id}*
🔗 Ref ID: *${data.ref_id}*
💰 Harga: Rp ${data.product_price.toLocaleString()}
📊 Status: *${data.status}*
═══════════════════════
`;
                await ctx.reply(message, { parse_mode: 'Markdown' });
            } else {
                await ctx.reply(`❌ *Transaksi Gagal:*\nStatus: ${result.status}\nPesan: ${result.message}`);
            }
        } catch (error) {
            console.error('Error saat menghubungi API:', error);
            ctx.reply('❌ Terjadi kesalahan saat menghubungi server. Mohon coba lagi nanti.');
        }
    }
};