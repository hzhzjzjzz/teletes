import fetch from 'node-fetch';
import crypto from 'crypto';

export default {
    command: ['cekstokakrab'],
    tags: ['gifar', 'gifar'],
    desc: 'Mengecek ketersediaan stok akrab via API.',

    async handler(ctx) {
        // Kredensial akun Anhtronik Anda
        const API_ID = 'NZE757663C';
        const API_KEY = '55a0bfa0a802e8fb79262cc20a0ee3af118398d5962f096081140fa71ef3d990';
        const CMD = 'stock_akrab';
        const API_URL = 'https://anhtronik.com/integration/api/stock-akrab';

        // Pengecekan akses owner (opsional, tergantung kebutuhan Anda)
        // const OWNER_ID = 'YOUR_OWNER_ID';
        // if (ctx.message?.from?.id != OWNER_ID) {
        //     return ctx.reply('❌ Hanya owner bot yang bisa menggunakan perintah ini.');
        // }

        // Membuat signature MD5
        const signature = crypto.createHash('md5').update(API_ID + API_KEY + CMD).digest('hex');

        const requestBody = {
            cmd: CMD,
            api_id: API_ID,
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
                let message = '✅ *Stok Akrab Tersedia:*\n═══════════════════════\n';

                if (result.data.length > 0) {
                    result.data.forEach(item => {
                        const stockStatus = item.stock > 0 ? '🟢 Tersedia' : '🔴 Kosong';
                        const hargaBaru = parseInt(item.price) + 5000;
                        
                        message += `\n📦 *${item.name}*\n`;
                        message += `    - Kode: ${item.code}\n`;
                        message += `    - Harga: Rp ${hargaBaru.toLocaleString('id-ID')}\n`;
                        message += `    - Stok: ${stockStatus}\n`;
                    });
                } else {
                    message = '❌ *Tidak ada data stok yang tersedia saat ini.*';
                }

                await ctx.reply(message.trim(), { parse_mode: 'Markdown' });

            } else {
                await ctx.reply(`❌ *Gagal Cek Stok:*\nStatus: ${result.status}\nPesan: ${result.message}`);
            }
        } catch (error) {
            console.error('Error saat menghubungi API:', error);
            ctx.reply('❌ Terjadi kesalahan saat menghubungi server. Mohon coba lagi nanti.');
        }
    }
};