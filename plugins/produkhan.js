import fetch from 'node-fetch';

import crypto from 'crypto';

export default {

    command: ['listprodukhan', 'produkhan'],

    tags: ['gifar'],

    desc: 'Melihat daftar produk berdasarkan kategori.',

    async handler(ctx) {

        // Ganti dengan ID Telegram Anda sebagai pemilik

        const OWNER_ID = '1284296702';

        

        // Pengecekan akses owner

        const fromId = ctx.message?.from?.id;

        if (String(fromId) !== OWNER_ID) {

            return await ctx.reply('❌ Hanya owner bot yang bisa menggunakan perintah ini.');

        }

        // Mengambil kode kategori dari argumen perintah

        const categoryCode = ctx.message?.text?.split(' ').slice(1)[0];

        if (!categoryCode) {

            return await ctx.reply(

                '❌ *Format salah!*\nMasukkan kode kategori untuk melihat produk.\nContoh: `/listproduk GAME`',

                { parse_mode: 'Markdown' }

            );

        }

        // Kredensial akun Anhtronik Anda

        const API_ID = 'NZE757663C';

        const API_KEY = '55a0bfa0a802e8fb79262cc20a0ee3af118398d5962f096081140fa71ef3d990';

        const CMD = 'product'; // CMD diubah menjadi 'product'

        const API_URL = 'https://anhtronik.com/integration/api/product'; // URL API diubah

        // Signature dihitung ulang dengan CMD yang baru

        const signature = crypto.createHash('md5').update(API_ID + API_KEY + CMD).digest('hex');

        

        // Body permintaan disesuaikan untuk API produk

        const requestBody = {

            cmd: CMD,

            api_id: API_ID,

            signature: signature,

            category_code: categoryCode.toUpperCase() // Menambahkan kode kategori ke body

        };

        try {

            await ctx.reply(`⏳ Sedang mencari produk untuk kategori *${categoryCode}*...`, { parse_mode: 'Markdown' });

            const response = await fetch(API_URL, {

                method: 'POST',

                headers: { 'Content-Type': 'application/json' },

                body: JSON.stringify(requestBody),

            });

            const result = await response.json();

            if (result.code === 200 && result.status === 'success') {

                let message = `✅ *Daftar Produk Kategori: ${categoryCode.toUpperCase()}*\n═══════════════════════\n`;

                

                if (result.data.length > 0) {

                    result.data.forEach(item => {

                        const price = item.price ? item.price.toLocaleString('id-ID') : 'N/A';

                        message += `\n*${item.name}*\n`;

                        message += `    - Kode: \`${item.code}\`\n`;

                        message += `    - Harga: *Rp ${price}*\n`;

                        message += `    - Status: ${item.status}\n`;

                        message += `    - Deskripsi: _${item.desc}_\n`;

                    });

                } else {

                    message += '❌ *Tidak ada produk yang ditemukan untuk kategori ini.*';

                }

                

                await ctx.reply(message.trim(), { parse_mode: 'Markdown' });

            } else {

                await ctx.reply(`❌ *Gagal Mendapatkan Daftar Produk:*\nStatus: ${result.status}\nPesan: ${result.message}`, { parse_mode: 'Markdown' });

            }

        } catch (error) {

            console.error('Error saat menghubungi API:', error);

            await ctx.reply('Terjadi kesalahan saat menghubungi server. Mohon coba lagi nanti.');

        }

    }

};